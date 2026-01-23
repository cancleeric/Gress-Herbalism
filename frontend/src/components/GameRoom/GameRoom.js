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
  leaveGame,
  resetGame
} from '../../store/gameStore';
import { getGameState, startGame } from '../../services/gameService';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED
} from '../../shared/constants';
import GameBoard from '../GameBoard/GameBoard';
import PlayerHand from '../PlayerHand/PlayerHand';
import { QuestionCardContainer } from '../QuestionCard/QuestionCard';
import { GuessCardContainer } from '../GuessCard/GuessCard';
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
    currentPlayerId: state.currentPlayerId
  }));

  // 本地狀態
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuestionCard, setShowQuestionCard] = useState(false);
  const [showGuessCard, setShowGuessCard] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);

  /**
   * 取得當前回合的玩家
   * @returns {Object|null} 當前回合玩家
   */
  const getCurrentPlayer = useCallback(() => {
    if (gameState.players && gameState.players.length > 0) {
      return gameState.players[gameState.currentPlayerIndex] || null;
    }
    return null;
  }, [gameState.players, gameState.currentPlayerIndex]);

  /**
   * 取得自己的玩家資訊
   * @returns {Object|null} 自己的玩家資訊
   */
  const getMyPlayer = useCallback(() => {
    // 使用 currentPlayerId 找到自己的玩家
    if (gameState.currentPlayerId) {
      return gameState.players.find(p => p.id === gameState.currentPlayerId) || null;
    }
    // 如果沒有 currentPlayerId，假設第一個玩家是自己
    return gameState.players[0] || null;
  }, [gameState.players, gameState.currentPlayerId]);

  /**
   * 檢查是否是自己的回合
   * @returns {boolean} 是否是自己的回合
   */
  const isMyTurn = useCallback(() => {
    const currentPlayer = getCurrentPlayer();
    const myPlayer = getMyPlayer();
    if (!currentPlayer || !myPlayer) return false;
    return currentPlayer.id === myPlayer.id;
  }, [getCurrentPlayer, getMyPlayer]);

  /**
   * 計算活躍玩家數量
   * @returns {number} 活躍玩家數量
   */
  const getActivePlayerCount = useCallback(() => {
    return gameState.players.filter(p => p.isActive !== false).length;
  }, [gameState.players]);

  /**
   * 檢查是否只剩一個活躍玩家（必須猜牌）
   * @returns {boolean} 是否必須猜牌
   */
  const mustGuess = useCallback(() => {
    return getActivePlayerCount() <= 1;
  }, [getActivePlayerCount]);

  /**
   * 組件掛載時載入遊戲狀態
   */
  useEffect(() => {
    loadGameState();

    // 組件卸載時的清理
    return () => {
      // 清理任何訂閱或計時器
    };
  }, [gameId]);

  /**
   * 載入遊戲狀態
   */
  const loadGameState = () => {
    setIsLoading(true);
    setError('');

    try {
      // 如果有遊戲ID，嘗試從 gameService 取得狀態
      if (gameId) {
        const serverState = getGameState(gameId);
        if (serverState) {
          dispatch(updateGameState(serverState));
        }
      }
    } catch (err) {
      console.error('載入遊戲狀態錯誤:', err);
      setError('無法載入遊戲狀態');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 離開房間
   */
  const handleLeaveRoom = () => {
    const myPlayer = getMyPlayer();
    if (myPlayer && gameId) {
      dispatch(leaveGame(gameId, myPlayer.id));
    }
    dispatch(resetGame());
    navigate('/');
  };

  /**
   * 開始遊戲
   */
  const handleStartGame = () => {
    if (gameState.players.length >= 3) {
      // 使用 gameService.startGame 來正確初始化遊戲
      if (gameId) {
        const result = startGame(gameId);
        if (result && result.success) {
          dispatch(updateGameState(result.gameState));
        } else {
          // 如果 startGame 不存在，使用本地更新
          dispatch(updateGameState({
            gamePhase: GAME_PHASE_PLAYING,
            currentPlayerIndex: 0
          }));
        }
      } else {
        dispatch(updateGameState({
          gamePhase: GAME_PHASE_PLAYING,
          currentPlayerIndex: 0
        }));
      }
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
  };

  /**
   * 關閉問牌介面
   */
  const handleCloseQuestion = () => {
    setShowQuestionCard(false);
  };

  /**
   * 打開猜牌介面
   */
  const handleOpenGuess = () => {
    setShowGuessCard(true);
    setIsGuessing(true);
  };

  /**
   * 關閉猜牌介面
   */
  const handleCloseGuess = () => {
    setShowGuessCard(false);
    setIsGuessing(false);
  };

  /**
   * 取得遊戲階段顯示文字
   * @returns {string} 遊戲階段文字
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

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="game-room loading">
        <div className="loading-spinner">
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  const myPlayer = getMyPlayer();
  const currentPlayer = getCurrentPlayer();
  const canAct = isMyTurn() && gameState.gamePhase === GAME_PHASE_PLAYING;
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
              disabled={gameState.players.length < 3}
            >
              開始遊戲 ({gameState.players.length}/3-4)
            </button>
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
                  🏆 獲勝者: {gameState.players.find(p => p.id === gameState.winner)?.name || '未知'}
                </p>
              ) : (
                <p className="no-winner-message">遊戲結束，沒有獲勝者</p>
              )}
            </div>
          )}
        </section>

        {/* 右側：玩家列表（簡易版，GameStatus 已有詳細版） */}
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
              >
                問牌
              </button>
            )}
            {canAct && (
              <button
                className={`btn ${onlyGuess ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleOpenGuess}
              >
                猜牌
                {onlyGuess && <span className="must-guess-hint">（必須猜牌）</span>}
              </button>
            )}
            {!canAct && currentPlayer && (
              <p className="waiting-turn">等待 {currentPlayer.name} 的回合...</p>
            )}
          </div>
        )}
      </footer>

      {/* 問牌介面 Modal */}
      {showQuestionCard && (
        <div className="modal-overlay" onClick={handleCloseQuestion}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <QuestionCardContainer
              isOpen={showQuestionCard}
              onClose={handleCloseQuestion}
            />
          </div>
        </div>
      )}

      {/* 猜牌介面 Modal */}
      {showGuessCard && (
        <div className="modal-overlay" onClick={handleCloseGuess}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <GuessCardContainer
              isOpen={showGuessCard}
              onClose={handleCloseGuess}
            />
          </div>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default GameRoom;
