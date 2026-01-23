/**
 * 遊戲房間組件
 *
 * @module GameRoom
 * @description 遊戲進行時的主要介面，包含遊戲桌面、玩家資訊、手牌和操作按鈕
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  updateGameState,
  leaveGame,
  resetGame
} from '../../store/gameStore';
import { getGameState } from '../../services/gameService';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED
} from '../../shared/constants';
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
    gameHistory: state.gameHistory
  }));

  // 本地狀態
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(null);

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
   * 監聽玩家列表變化，更新當前玩家
   */
  useEffect(() => {
    if (gameState.players && gameState.players.length > 0) {
      // 找到當前回合的玩家
      const current = gameState.players[gameState.currentPlayerIndex];
      setCurrentPlayer(current || null);
    }
  }, [gameState.players, gameState.currentPlayerIndex]);

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
    // 找到當前玩家（假設第一個玩家是自己）
    const myPlayer = gameState.players[0];
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
      dispatch(updateGameState({
        gamePhase: GAME_PHASE_PLAYING,
        currentPlayerIndex: 0
      }));
    } else {
      setError('需要至少 3 位玩家才能開始遊戲');
    }
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

  /**
   * 取得其他玩家列表（排除自己）
   * @returns {Array} 其他玩家列表
   */
  const getOtherPlayers = () => {
    // 目前簡單處理，假設第一個玩家是自己
    return gameState.players.slice(1);
  };

  /**
   * 取得自己的玩家資訊
   * @returns {Object|null} 自己的玩家資訊
   */
  const getMyPlayer = () => {
    // 目前簡單處理，假設第一個玩家是自己
    return gameState.players[0] || null;
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
  const otherPlayers = getOtherPlayers();

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
        {/* 左側：其他玩家資訊 */}
        <aside className="players-sidebar">
          <h2>玩家列表</h2>
          <ul className="player-list">
            {gameState.players.map((player, index) => (
              <li
                key={player.id}
                className={`player-item ${index === gameState.currentPlayerIndex ? 'current-turn' : ''}`}
              >
                <span className="player-name">
                  {player.name}
                  {player.isHost && ' (房主)'}
                </span>
                <span className="player-cards">
                  {player.hand ? `${player.hand.length} 張牌` : ''}
                </span>
                {index === gameState.currentPlayerIndex && (
                  <span className="turn-indicator">輪到此玩家</span>
                )}
              </li>
            ))}
          </ul>

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
          <div className="game-board">
            {gameState.gamePhase === GAME_PHASE_WAITING ? (
              <div className="waiting-message">
                <h2>等待玩家加入</h2>
                <p>目前有 {gameState.players.length} 位玩家</p>
                <p>需要 3-4 位玩家才能開始</p>
              </div>
            ) : gameState.gamePhase === GAME_PHASE_FINISHED ? (
              <div className="game-over-message">
                <h2>遊戲結束!</h2>
                {gameState.winner ? (
                  <p>獲勝者: {gameState.players.find(p => p.id === gameState.winner)?.name || gameState.winner}</p>
                ) : (
                  <p>沒有獲勝者</p>
                )}
              </div>
            ) : (
              <div className="game-in-progress">
                <h2>遊戲進行中</h2>
                {currentPlayer && (
                  <p>當前回合: {currentPlayer.name}</p>
                )}
                {/* 遊戲板將在後續工作單中實作 */}
                <p className="placeholder-text">遊戲板 - 待實作</p>
              </div>
            )}
          </div>

          {/* 隱藏牌區域（遊戲結束時顯示） */}
          {gameState.gamePhase === GAME_PHASE_FINISHED && gameState.hiddenCards && (
            <div className="hidden-cards-reveal">
              <h3>蓋牌揭曉</h3>
              <div className="hidden-cards">
                {gameState.hiddenCards.map((card, index) => (
                  <div
                    key={card.id || index}
                    className={`card card-${card.color}`}
                  >
                    {card.color}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 右側：遊戲歷史 */}
        <aside className="history-sidebar">
          <h2>遊戲歷史</h2>
          <ul className="history-list">
            {gameState.gameHistory.length === 0 ? (
              <li className="no-history">尚無動作記錄</li>
            ) : (
              gameState.gameHistory.map((action, index) => (
                <li key={index} className="history-item">
                  <span className="history-action">
                    {action.type === 'question' ? '問牌' : '猜牌'}
                  </span>
                </li>
              ))
            )}
          </ul>
        </aside>
      </main>

      {/* 底部區域：自己的手牌和操作按鈕 */}
      <footer className="game-room-footer">
        {/* 自己的手牌 */}
        <div className="my-hand">
          <h3>我的手牌</h3>
          <div className="hand-cards">
            {myPlayer?.hand?.length > 0 ? (
              myPlayer.hand.map((card) => (
                <div
                  key={card.id}
                  className={`card card-${card.color}`}
                >
                  {card.color}
                </div>
              ))
            ) : (
              <p className="no-cards">尚無手牌</p>
            )}
          </div>
        </div>

        {/* 操作按鈕 */}
        {gameState.gamePhase === GAME_PHASE_PLAYING && (
          <div className="action-buttons">
            <button className="btn btn-primary" disabled>
              問牌 (待實作)
            </button>
            <button className="btn btn-secondary" disabled>
              猜牌 (待實作)
            </button>
          </div>
        )}
      </footer>

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
