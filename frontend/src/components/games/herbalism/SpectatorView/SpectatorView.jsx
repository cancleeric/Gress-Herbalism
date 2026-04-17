/**
 * 觀戰視圖組件
 *
 * 工單 0062：觀戰模式
 * 允許使用者以觀戰者身份即時查看進行中的遊戲。
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../../../firebase/AuthContext';
import {
  initSocket,
  joinAsSpectator,
  leaveAsSpectator,
  onSpectatorJoined,
  onSpectatorSync,
  onSpectatorCount,
  onSpectatorGameEnded,
  onError
} from '../../../../services/socketService';
import {
  startSpectating,
  updateSpectatorGameState,
  updateSpectatorCount,
  spectatorGameEnded,
  resetSpectator
} from '../../../../store/spectatorSlice';
import './SpectatorView.css';

const PHASE_LABELS = {
  playing: '進行中',
  postQuestion: '問牌後',
  followGuessing: '跟猜階段',
  roundEnd: '局結束',
  finished: '遊戲結束',
  waiting: '等待中'
};

/**
 * 觀戰視圖組件
 */
function SpectatorView() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const spectatorState = useSelector(state => state.spectator);

  const [spectatorId] = useState(
    `spectator_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  );
  const [spectatorName] = useState(
    user?.isAnonymous ? '訪客觀眾' : (user?.displayName || '觀眾')
  );
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(true);

  const handleLeave = useCallback(() => {
    leaveAsSpectator(gameId, spectatorId);
    dispatch(resetSpectator());
    navigate('/lobby/herbalism');
  }, [gameId, spectatorId, dispatch, navigate]);

  useEffect(() => {
    initSocket();

    const unsubJoined = onSpectatorJoined(({ gameState, spectatorCount }) => {
      dispatch(startSpectating(gameId, gameState, spectatorCount));
      setIsJoining(false);
    });

    const unsubSync = onSpectatorSync(({ gameState, spectatorCount }) => {
      dispatch(updateSpectatorGameState(gameState, spectatorCount));
    });

    const unsubCount = onSpectatorCount(({ spectatorCount }) => {
      dispatch(updateSpectatorCount(spectatorCount));
    });

    const unsubGameEnded = onSpectatorGameEnded(({ winner }) => {
      dispatch(spectatorGameEnded(winner));
    });

    const unsubError = onError(({ message }) => {
      setError(message);
      setIsJoining(false);
    });

    // 加入觀戰
    joinAsSpectator(gameId, spectatorId, spectatorName);

    return () => {
      unsubJoined();
      unsubSync();
      unsubCount();
      unsubGameEnded();
      unsubError();
      leaveAsSpectator(gameId, spectatorId);
      dispatch(resetSpectator());
    };
  }, [gameId, spectatorId, spectatorName, dispatch]);

  if (error) {
    return (
      <div className="spectator-error">
        <span className="material-symbols-outlined">error</span>
        <p>{error}</p>
        <button className="spectator-back-btn" onClick={() => navigate('/lobby/herbalism')}>
          返回大廳
        </button>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="spectator-loading">
        <div className="spectator-spinner"></div>
        <p>正在連線觀戰...</p>
      </div>
    );
  }

  const { gameState, spectatorCount, winner } = spectatorState;

  if (!gameState) {
    return (
      <div className="spectator-error">
        <p>無法載入遊戲狀態</p>
        <button className="spectator-back-btn" onClick={() => navigate('/lobby/herbalism')}>
          返回大廳
        </button>
      </div>
    );
  }

  const currentPlayer = gameState.players?.[gameState.currentPlayerIndex];

  return (
    <div className="spectator-view">
      {/* 頂部觀戰指示列 */}
      <header className="spectator-header">
        <div className="spectator-badge">
          <span className="material-symbols-outlined">visibility</span>
          觀戰中
        </div>
        <div className="spectator-game-info">
          <span className="spectator-phase">
            {PHASE_LABELS[gameState.gamePhase] || gameState.gamePhase}
          </span>
          {gameState.currentRound && (
            <span className="spectator-round">第 {gameState.currentRound} 局</span>
          )}
        </div>
        <div className="spectator-count-info">
          <span className="material-symbols-outlined">group</span>
          {spectatorCount} 人觀戰
        </div>
        <button className="spectator-leave-btn" onClick={handleLeave}>
          <span className="material-symbols-outlined">exit_to_app</span>
          離開觀戰
        </button>
      </header>

      {/* 遊戲結束橫幅 */}
      {winner && (
        <div className="spectator-winner-banner">
          <span className="material-symbols-outlined">emoji_events</span>
          遊戲結束！勝者：{gameState.players?.find(p => p.id === winner)?.name || winner}
        </div>
      )}

      {/* 主內容 */}
      <main className="spectator-main">
        {/* 玩家狀態列 */}
        <section className="spectator-players">
          <h2 className="spectator-section-title">玩家狀態</h2>
          <div className="spectator-player-list">
            {gameState.players?.map((player) => (
              <div
                key={player.id}
                className={`spectator-player-card${player.isCurrentTurn ? ' current-turn' : ''}${!player.isActive ? ' inactive' : ''}${player.isDisconnected ? ' disconnected' : ''}`}
              >
                <div className="spectator-player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="spectator-player-info">
                  <div className="spectator-player-name">
                    {player.name}
                    {player.isHost && (
                      <span className="material-symbols-outlined host-icon" title="房主">star</span>
                    )}
                    {player.isCurrentTurn && (
                      <span className="material-symbols-outlined turn-icon" title="當前玩家">play_arrow</span>
                    )}
                  </div>
                  <div className="spectator-player-stats">
                    <span className="spectator-hand-count">
                      <span className="material-symbols-outlined">style</span>
                      手牌 {player.handCount ?? 0} 張
                    </span>
                  </div>
                  {player.isDisconnected && (
                    <span className="spectator-status-label disconnected-label">斷線中</span>
                  )}
                  {!player.isActive && !player.isDisconnected && (
                    <span className="spectator-status-label inactive-label">已退出</span>
                  )}
                </div>
                <div className="spectator-player-score-big">
                  {gameState.scores?.[player.id] ?? player.score ?? 0}
                  <span className="score-unit">分</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 當前回合資訊 */}
        {currentPlayer && gameState.gamePhase === 'playing' && (
          <section className="spectator-turn-info">
            <div className="spectator-turn-indicator">
              <span className="material-symbols-outlined">person</span>
              <strong>{currentPlayer.name}</strong> 的回合
            </div>
          </section>
        )}

        {/* 勝利目標 */}
        <section className="spectator-meta">
          <div className="spectator-meta-item">
            <span className="material-symbols-outlined">flag</span>
            勝利目標：{gameState.winningScore ?? 7} 分
          </div>
          <div className="spectator-meta-item">
            <span className="material-symbols-outlined">info</span>
            觀戰者無法執行遊戲動作
          </div>
        </section>
      </main>
    </div>
  );
}

export default SpectatorView;
