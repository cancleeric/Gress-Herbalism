/**
 * 遊戲房間組件
 *
 * @module GameRoom
 * @description 遊戲進行時的主要介面，整合 GameBoard、PlayerHand、QuestionCard、GuessCard、GameStatus 等子組件
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  updateGameState,
  resetGame
} from '../../store/gameStore';
import {
  onGameState,
  onError,
  onHiddenCardsRevealed,
  onColorChoiceRequired,
  onWaitingForColorChoice,
  onColorChoiceResult,
  onFollowGuessStarted,
  onFollowGuessUpdate,
  onGuessResult,
  onRoundStarted,
  startGame as socketStartGame,
  sendGameAction,
  requestRevealHiddenCards,
  leaveRoom,
  submitColorChoice,
  submitFollowGuessResponse,
  startNextRound
} from '../../services/socketService';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  GAME_PHASE_FOLLOW_GUESSING,
  GAME_PHASE_ROUND_END
} from '../../shared/constants';
import GameBoard from '../GameBoard/GameBoard';
import PlayerHand from '../PlayerHand/PlayerHand';
import QuestionCard from '../QuestionCard/QuestionCard';
import GuessCard from '../GuessCard/GuessCard';
import { GameStatusContainer } from '../GameStatus/GameStatus';
import './GameRoom.css';

/**
 * 遊戲房間組件
 *
 * @returns {JSX.Element} 遊戲房間組件
 */
function GameRoom() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { gameId } = useParams();

  // 從 Redux store 取得遊戲狀態
  const gameState = useSelector((state) => ({
    storeGameId: state.gameId,
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    gamePhase: state.gamePhase,
    winner: state.winner,
    hiddenCards: state.hiddenCards,
    gameHistory: state.gameHistory,
    currentPlayerId: state.currentPlayerId,
    maxPlayers: state.maxPlayers
  }));

  // 本地狀態
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuestionCard, setShowQuestionCard] = useState(false);
  const [showGuessCard, setShowGuessCard] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);
  const [hiddenCardsForGuess, setHiddenCardsForGuess] = useState([]);
  const [questionResult, setQuestionResult] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  // 顏色選擇相關狀態
  const [showColorChoice, setShowColorChoice] = useState(false);
  const [colorChoiceData, setColorChoiceData] = useState(null);
  const [waitingForColorChoice, setWaitingForColorChoice] = useState(false);
  const [colorChoiceInfo, setColorChoiceInfo] = useState(null);
  // 跟猜相關狀態
  const [followGuessData, setFollowGuessData] = useState(null);
  const [showFollowGuessPanel, setShowFollowGuessPanel] = useState(false);
  const [guessResultData, setGuessResultData] = useState(null);
  const [showRoundEnd, setShowRoundEnd] = useState(false);

  /**
   * 取得當前回合的玩家
   */
  const getCurrentPlayer = useCallback(() => {
    if (gameState.players && gameState.players.length > 0) {
      return gameState.players[gameState.currentPlayerIndex] || null;
    }
    return null;
  }, [gameState.players, gameState.currentPlayerIndex]);

  /**
   * 取得自己的玩家資訊
   */
  const getMyPlayer = useCallback(() => {
    if (gameState.currentPlayerId) {
      return gameState.players.find(p => p.id === gameState.currentPlayerId) || null;
    }
    return gameState.players[0] || null;
  }, [gameState.players, gameState.currentPlayerId]);

  /**
   * 檢查是否是自己的回合
   */
  const isMyTurn = useCallback(() => {
    const currentPlayer = getCurrentPlayer();
    const myPlayer = getMyPlayer();
    if (!currentPlayer || !myPlayer) return false;
    return currentPlayer.id === myPlayer.id;
  }, [getCurrentPlayer, getMyPlayer]);

  /**
   * 計算活躍玩家數量
   */
  const getActivePlayerCount = useCallback(() => {
    return gameState.players.filter(p => p.isActive !== false).length;
  }, [gameState.players]);

  /**
   * 檢查是否只剩一個活躍玩家（必須猜牌）
   */
  const mustGuess = useCallback(() => {
    return getActivePlayerCount() <= 1;
  }, [getActivePlayerCount]);

  /**
   * 訂閱 Socket 事件
   */
  useEffect(() => {
    // 監聽遊戲狀態更新
    const unsubGameState = onGameState((newState) => {
      dispatch(updateGameState({
        gameId: newState.gameId,
        players: newState.players,
        currentPlayerIndex: newState.currentPlayerIndex,
        gamePhase: newState.gamePhase,
        winner: newState.winner,
        hiddenCards: newState.hiddenCards,
        gameHistory: newState.gameHistory,
        maxPlayers: newState.maxPlayers
      }));
      setIsLoading(false);
    });

    // 監聽錯誤
    const unsubError = onError(({ message }) => {
      setError(message);
      setIsLoading(false);
    });

    // 監聽蓋牌揭示
    const unsubHidden = onHiddenCardsRevealed(({ cards }) => {
      setHiddenCardsForGuess(cards);
    });

    // 監聽顏色選擇請求（被要牌玩家）
    const unsubColorChoice = onColorChoiceRequired(({ askingPlayerId, colors, message }) => {
      setColorChoiceData({ askingPlayerId, colors, message });
      setShowColorChoice(true);
      setWaitingForColorChoice(false);
    });

    // 監聽等待顏色選擇（其他玩家）
    const unsubWaiting = onWaitingForColorChoice(({ targetPlayerId, askingPlayerId, colors }) => {
      setWaitingForColorChoice(true);
      setColorChoiceInfo({ targetPlayerId, askingPlayerId, colors });
    });

    // 監聽顏色選擇結果
    const unsubColorResult = onColorChoiceResult(({ targetPlayerId, chosenColor, cardsTransferred }) => {
      setShowColorChoice(false);
      setColorChoiceData(null);
      setWaitingForColorChoice(false);
      setColorChoiceInfo(null);
    });

    // 監聽跟猜開始
    const unsubFollowGuess = onFollowGuessStarted(({ guessingPlayerId, guessedColors, decisionOrder, currentDeciderId, decisions }) => {
      setFollowGuessData({
        guessingPlayerId,
        guessedColors,
        decisionOrder: decisionOrder || [],
        currentDeciderId,
        decisions: decisions || {},
        followingPlayers: [],
        declinedPlayers: []
      });
      setShowFollowGuessPanel(true);
    });

    // 監聽跟猜更新
    const unsubFollowUpdate = onFollowGuessUpdate(({ playerId, isFollowing, currentDeciderId, decisions, followingPlayers, declinedPlayers }) => {
      setFollowGuessData(prev => ({
        ...prev,
        currentDeciderId,
        decisions: decisions || prev.decisions,
        followingPlayers,
        declinedPlayers
      }));
    });

    // 監聽猜牌結果
    const unsubGuessResult = onGuessResult(({ isCorrect, scoreChanges, hiddenCards, guessingPlayerId, followingPlayers }) => {
      setShowFollowGuessPanel(false);
      setGuessResultData({ isCorrect, scoreChanges, hiddenCards, guessingPlayerId, followingPlayers });
      setShowRoundEnd(true);
    });

    // 監聽局開始
    const unsubRoundStart = onRoundStarted(({ round, startPlayerIndex }) => {
      setShowRoundEnd(false);
      setGuessResultData(null);
    });

    return () => {
      unsubGameState();
      unsubError();
      unsubHidden();
      unsubColorChoice();
      unsubWaiting();
      unsubColorResult();
      unsubFollowGuess();
      unsubFollowUpdate();
      unsubGuessResult();
      unsubRoundStart();
    };
  }, [dispatch]);

  /**
   * 離開房間
   */
  const handleLeaveRoom = () => {
    const myPlayer = getMyPlayer();
    if (myPlayer && gameId) {
      leaveRoom(gameId, myPlayer.id);
    }
    dispatch(resetGame());
    navigate('/');
  };

  /**
   * 開始遊戲
   */
  const handleStartGame = () => {
    if (gameState.players.length >= 3 && gameId) {
      setIsLoading(true);
      socketStartGame(gameId);
    } else {
      setError('需要至少 3 位玩家才能開始遊戲');
    }
  };

  /**
   * 打開問牌介面
   */
  const handleOpenQuestion = () => {
    setShowQuestionCard(true);
    setIsGuessing(false);
    setQuestionResult(null);
  };

  /**
   * 關閉問牌介面
   */
  const handleCloseQuestion = () => {
    setShowQuestionCard(false);
    setQuestionResult(null);
  };

  /**
   * 打開猜牌介面
   */
  const handleOpenGuess = () => {
    setShowGuessCard(true);
    setIsGuessing(true);
    setGuessResult(null);
    // 請求查看蓋牌
    const myPlayer = getMyPlayer();
    if (myPlayer && gameId) {
      requestRevealHiddenCards(gameId, myPlayer.id);
    }
  };

  /**
   * 關閉猜牌介面
   */
  const handleCloseGuess = () => {
    setShowGuessCard(false);
    setIsGuessing(false);
    setGuessResult(null);
    setHiddenCardsForGuess([]);
  };

  /**
   * 處理問牌提交
   */
  const handleQuestionSubmit = (questionData) => {
    const myPlayer = getMyPlayer();
    if (!myPlayer || !gameId) return;

    setIsLoading(true);

    const action = {
      type: 'question',
      playerId: myPlayer.id,
      targetPlayerId: questionData.targetPlayerId,
      colors: questionData.colors,
      questionType: questionData.questionType,
      selectedColor: questionData.colors[0], // 用於類型2
      giveColor: questionData.giveColor || questionData.colors[0], // 用於類型3（使用選擇的或預設第一個）
      getColor: questionData.getColor || questionData.colors[1]  // 用於類型3
    };

    sendGameAction(gameId, action);
    setShowQuestionCard(false);
  };

  /**
   * 處理猜牌提交
   */
  const handleGuessSubmit = (guessData) => {
    const myPlayer = getMyPlayer();
    if (!myPlayer || !gameId) return;

    setIsLoading(true);

    const action = {
      type: 'guess',
      playerId: myPlayer.id,
      guessedColors: guessData.guessedColors
    };

    sendGameAction(gameId, action);
    setShowGuessCard(false);
  };

  /**
   * 處理顏色選擇（被要牌玩家選擇給哪種顏色）
   */
  const handleColorChoice = (chosenColor) => {
    if (!gameId) return;

    submitColorChoice(gameId, chosenColor);
    setShowColorChoice(false);
    setColorChoiceData(null);
  };

  /**
   * 處理跟猜決定
   */
  const handleFollowGuess = (isFollowing) => {
    const myPlayer = getMyPlayer();
    if (!gameId || !myPlayer) return;

    submitFollowGuessResponse(gameId, myPlayer.id, isFollowing);
  };

  /**
   * 處理開始下一局
   */
  const handleStartNextRound = () => {
    if (!gameId) return;

    startNextRound(gameId);
    setShowRoundEnd(false);
    setGuessResultData(null);
  };

  /**
   * 取得遊戲階段顯示文字
   */
  const getGamePhaseText = () => {
    switch (gameState.gamePhase) {
      case GAME_PHASE_WAITING:
        return '等待玩家加入...';
      case GAME_PHASE_PLAYING:
        return '遊戲進行中';
      case GAME_PHASE_FOLLOW_GUESSING:
        return '跟猜階段';
      case GAME_PHASE_ROUND_END:
        return '局結束';
      case GAME_PHASE_FINISHED:
        return '遊戲結束';
      default:
        return '未知狀態';
    }
  };

  const myPlayer = getMyPlayer();
  const currentPlayer = getCurrentPlayer();
  const canAct = isMyTurn() && gameState.gamePhase === GAME_PHASE_PLAYING && myPlayer?.isActive !== false;
  const onlyGuess = mustGuess();

  return (
    <div className="game-room">
      {/* 頂部區域：遊戲資訊 */}
      <header className="game-room-header">
        <div className="game-info">
          <h1>遊戲房間</h1>
          <span className="game-id">房間ID: {gameId}</span>
          <span className="game-phase">{getGamePhaseText()}</span>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleLeaveRoom}
          >
            離開房間
          </button>
        </div>
      </header>

      {/* 主要遊戲區域 */}
      <main className="game-room-main">
        {/* 左側：遊戲狀態 */}
        <aside className="status-sidebar">
          <GameStatusContainer showHistory={true} />

          {/* 等待中時顯示開始按鈕 */}
          {gameState.gamePhase === GAME_PHASE_WAITING && myPlayer?.isHost && (
            <button
              className="btn btn-primary start-game-btn"
              onClick={handleStartGame}
              disabled={gameState.players.length < 3 || isLoading}
            >
              {isLoading ? '啟動中...' : `開始遊戲 (${gameState.players.length}/${gameState.maxPlayers || 4})`}
            </button>
          )}

          {/* 等待中非房主提示 */}
          {gameState.gamePhase === GAME_PHASE_WAITING && !myPlayer?.isHost && (
            <p className="waiting-host">等待房主開始遊戲...</p>
          )}
        </aside>

        {/* 中央：遊戲桌面 */}
        <section className="game-board-area">
          <GameBoard
            currentPlayerId={myPlayer?.id}
            isGuessing={isGuessing}
          />

          {/* 遊戲結束資訊 */}
          {gameState.gamePhase === GAME_PHASE_FINISHED && (
            <div className="game-over-info">
              {gameState.winner ? (
                <p className="winner-message">
                  獲勝者: {gameState.players.find(p => p.id === gameState.winner)?.name || '未知'}
                </p>
              ) : (
                <p className="no-winner-message">遊戲結束，沒有獲勝者</p>
              )}
            </div>
          )}
        </section>

        {/* 右側：玩家列表 */}
        <aside className="players-sidebar">
          <h2>玩家列表</h2>
          <ul className="player-list">
            {gameState.players.map((player, index) => (
              <li
                key={player.id}
                className={`player-item ${index === gameState.currentPlayerIndex ? 'current-turn' : ''} ${player.isActive === false ? 'eliminated' : ''}`}
              >
                <span className="player-name">
                  {player.name}
                  {player.isHost && ' (房主)'}
                  {player.id === myPlayer?.id && ' (我)'}
                </span>
                <span className="player-score">{player.score || 0} 分</span>
                <span className="player-cards">
                  {player.hand ? `${player.hand.length} 張牌` : ''}
                </span>
                {index === gameState.currentPlayerIndex && player.isActive !== false && (
                  <span className="turn-indicator">輪到此玩家</span>
                )}
                {player.isActive === false && (
                  <span className="eliminated-badge">已退出</span>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </main>

      {/* 底部區域：自己的手牌和操作按鈕 */}
      <footer className="game-room-footer">
        {/* 自己的手牌 */}
        <div className="my-hand-section">
          <PlayerHand
            cards={myPlayer?.hand || []}
            title="我的手牌"
            selectable={false}
          />
        </div>

        {/* 操作按鈕 */}
        {gameState.gamePhase === GAME_PHASE_PLAYING && (
          <div className="action-buttons">
            {canAct && !onlyGuess && (
              <button
                className="btn btn-primary"
                onClick={handleOpenQuestion}
                disabled={isLoading}
              >
                問牌
              </button>
            )}
            {canAct && (
              <button
                className={`btn ${onlyGuess ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleOpenGuess}
                disabled={isLoading}
              >
                猜牌
                {onlyGuess && <span className="must-guess-hint">（必須猜牌）</span>}
              </button>
            )}
            {!canAct && currentPlayer && myPlayer?.isActive !== false && (
              <p className="waiting-turn">等待 {currentPlayer.name} 的回合...</p>
            )}
            {myPlayer?.isActive === false && (
              <p className="eliminated-message">你已退出遊戲，等待結果...</p>
            )}
          </div>
        )}
      </footer>

      {/* 問牌介面 Modal */}
      {showQuestionCard && (
        <div className="modal-overlay" onClick={handleCloseQuestion}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <QuestionCard
              players={gameState.players.filter(p => p.isActive !== false)}
              currentPlayerId={myPlayer?.id}
              currentPlayerHand={myPlayer?.hand || []}
              onSubmit={handleQuestionSubmit}
              onCancel={handleCloseQuestion}
              isOpen={showQuestionCard}
              isLoading={isLoading}
              questionResult={questionResult}
              onResultClose={handleCloseQuestion}
            />
          </div>
        </div>
      )}

      {/* 猜牌介面 Modal */}
      {showGuessCard && (
        <div className="modal-overlay" onClick={handleCloseGuess}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <GuessCard
              onSubmit={handleGuessSubmit}
              onCancel={handleCloseGuess}
              isOpen={showGuessCard}
              isLoading={isLoading}
              guessResult={guessResult}
              onResultClose={handleCloseGuess}
              hiddenCards={hiddenCardsForGuess}
              canViewAnswer={true}
            />
          </div>
        </div>
      )}

      {/* 顏色選擇介面 Modal（被要牌玩家選擇給哪種顏色） */}
      {showColorChoice && colorChoiceData && (
        <div className="modal-overlay">
          <div className="modal-content color-choice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="color-choice-card">
              <h3>選擇要給的顏色</h3>
              <p className="color-choice-message">
                {gameState.players.find(p => p.id === colorChoiceData.askingPlayerId)?.name || '對方'}
                使用「其中一種顏色全部」方式向你要牌
              </p>
              <p>你兩種顏色都有，請選擇要給哪種顏色的全部牌：</p>
              <div className="color-choice-buttons">
                {colorChoiceData.colors.map(color => (
                  <button
                    key={color}
                    className={`btn btn-color color-${color}`}
                    onClick={() => handleColorChoice(color)}
                  >
                    {color === 'red' ? '紅色' :
                     color === 'yellow' ? '黃色' :
                     color === 'green' ? '綠色' :
                     color === 'blue' ? '藍色' : color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 等待顏色選擇提示 */}
      {waitingForColorChoice && colorChoiceInfo && (
        <div className="waiting-overlay">
          <div className="waiting-message">
            <p>等待 {gameState.players.find(p => p.id === colorChoiceInfo.targetPlayerId)?.name || '對方'} 選擇要給哪種顏色...</p>
          </div>
        </div>
      )}

      {/* 跟猜面板 Modal */}
      {showFollowGuessPanel && followGuessData && (
        <div className="modal-overlay">
          <div className="modal-content follow-guess-modal" onClick={(e) => e.stopPropagation()}>
            <div className="follow-guess-card">
              <h3>跟猜階段</h3>
              <p className="guess-info">
                <strong>{gameState.players.find(p => p.id === followGuessData.guessingPlayerId)?.name || '玩家'}</strong>
                {' '}猜測蓋牌是：
                <span className="guessed-colors">
                  {followGuessData.guessedColors.map(color => (
                    <span key={color} className={`color-badge color-${color}`}>
                      {color === 'red' ? '紅' :
                       color === 'yellow' ? '黃' :
                       color === 'green' ? '綠' :
                       color === 'blue' ? '藍' : color}
                    </span>
                  ))}
                </span>
              </p>

              {/* 決定順序顯示 */}
              <div className="follow-guess-order">
                <h4>決定順序</h4>
                <ul className="decision-order-list">
                  {/* 猜牌者 */}
                  <li className="decision-item guesser">
                    <span className="player-label">
                      {gameState.players.find(p => p.id === followGuessData.guessingPlayerId)?.name || '玩家'}
                    </span>
                    <span className="decision-badge guesser-badge">猜牌者</span>
                  </li>
                  {/* 其他玩家按順序 */}
                  {followGuessData.decisionOrder?.map((playerId, index) => {
                    const player = gameState.players.find(p => p.id === playerId);
                    const decision = followGuessData.decisions?.[playerId];
                    const isCurrentDecider = followGuessData.currentDeciderId === playerId;
                    return (
                      <li key={playerId} className={`decision-item ${isCurrentDecider ? 'current-decider' : ''}`}>
                        <span className="order-number">{index + 1}.</span>
                        <span className="player-label">{player?.name || playerId}</span>
                        {isCurrentDecider && !decision && (
                          <span className="decision-badge deciding">決定中...</span>
                        )}
                        {decision === 'follow' && (
                          <span className="decision-badge followed">跟猜</span>
                        )}
                        {decision === 'pass' && (
                          <span className="decision-badge declined">不跟</span>
                        )}
                        {!isCurrentDecider && !decision && (
                          <span className="decision-badge waiting">等待中</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 自己需要決定時顯示按鈕（只有輪到自己時才能點） */}
              {followGuessData.currentDeciderId === myPlayer?.id && (
                <div className="follow-guess-buttons">
                  <p className="decision-prompt">輪到你決定！跟對 +1 分，跟錯 -1 分並退出當局</p>
                  <button
                    className="btn btn-success"
                    onClick={() => handleFollowGuess(true)}
                  >
                    跟猜
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleFollowGuess(false)}
                  >
                    不跟
                  </button>
                </div>
              )}

              {/* 自己是猜牌者 */}
              {followGuessData.guessingPlayerId === myPlayer?.id && (
                <p className="waiting-others">等待其他玩家按順序決定是否跟猜...</p>
              )}

              {/* 自己已決定 */}
              {followGuessData.decisions?.[myPlayer?.id] &&
               followGuessData.guessingPlayerId !== myPlayer?.id && (
                <p className="already-decided">
                  你選擇了「{followGuessData.decisions[myPlayer?.id] === 'follow' ? '跟猜' : '不跟'}」，等待其他玩家...
                </p>
              )}

              {/* 還沒輪到自己 */}
              {!followGuessData.decisions?.[myPlayer?.id] &&
               followGuessData.currentDeciderId !== myPlayer?.id &&
               followGuessData.guessingPlayerId !== myPlayer?.id &&
               followGuessData.decisionOrder?.includes(myPlayer?.id) && (
                <p className="waiting-turn">還沒輪到你，請等待...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 局結束 / 猜牌結果面板 */}
      {showRoundEnd && guessResultData && (
        <div className="modal-overlay">
          <div className="modal-content round-end-modal" onClick={(e) => e.stopPropagation()}>
            <div className="round-end-card">
              <h3>{guessResultData.isCorrect ? '猜對了！' : '猜錯了！'}</h3>

              {/* 顯示蓋牌 */}
              <div className="hidden-cards-reveal">
                <p>蓋牌是：</p>
                <div className="hidden-cards">
                  {guessResultData.hiddenCards.map((card, index) => (
                    <span key={index} className={`card-badge color-${card.color}`}>
                      {card.color === 'red' ? '紅' :
                       card.color === 'yellow' ? '黃' :
                       card.color === 'green' ? '綠' :
                       card.color === 'blue' ? '藍' : card.color}
                    </span>
                  ))}
                </div>
              </div>

              {/* 分數變化 */}
              <div className="score-changes">
                <h4>分數變化</h4>
                <ul className="score-list">
                  {Object.entries(guessResultData.scoreChanges).map(([playerId, change]) => {
                    const player = gameState.players.find(p => p.id === playerId);
                    return (
                      <li key={playerId} className={change > 0 ? 'score-up' : change < 0 ? 'score-down' : ''}>
                        {player?.name || playerId}：
                        <span className="score-change">
                          {change > 0 ? `+${change}` : change}
                        </span>
                        {playerId === guessResultData.guessingPlayerId && ' (猜牌者)'}
                        {guessResultData.followingPlayers.includes(playerId) && ' (跟猜)'}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 目前分數 */}
              <div className="current-scores">
                <h4>目前分數</h4>
                <ul className="score-list">
                  {gameState.players.map(player => (
                    <li key={player.id}>
                      {player.name}：{player.score || 0} 分
                      {(player.score || 0) >= 7 && <span className="winner-badge">勝利！</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 下一局按鈕 */}
              {gameState.gamePhase !== GAME_PHASE_FINISHED && (
                <button
                  className="btn btn-primary"
                  onClick={handleStartNextRound}
                >
                  開始下一局
                </button>
              )}

              {/* 遊戲結束 */}
              {gameState.gamePhase === GAME_PHASE_FINISHED && (
                <div className="game-finished">
                  <p className="winner-announcement">
                    恭喜 {gameState.players.find(p => p.id === gameState.winner)?.name || '獲勝者'} 獲勝！
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={handleLeaveRoom}
                  >
                    離開房間
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}
    </div>
  );
}

export default GameRoom;
