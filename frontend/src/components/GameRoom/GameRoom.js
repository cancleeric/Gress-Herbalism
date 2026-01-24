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
  startGame as socketStartGame,
  sendGameAction,
  requestRevealHiddenCards,
  leaveRoom,
  submitColorChoice
} from '../../services/socketService';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED
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

    return () => {
      unsubGameState();
      unsubError();
      unsubHidden();
      unsubColorChoice();
      unsubWaiting();
      unsubColorResult();
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
      giveColor: questionData.colors[0], // 用於類型3
      getColor: questionData.colors[1]  // 用於類型3
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
   * 取得遊戲階段顯示文字
   */
  const getGamePhaseText = () => {
    switch (gameState.gamePhase) {
      case GAME_PHASE_WAITING:
        return '等待玩家加入...';
      case GAME_PHASE_PLAYING:
        return '遊戲進行中';
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
