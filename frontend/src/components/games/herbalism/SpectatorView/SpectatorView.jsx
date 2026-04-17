/**
 * 觀戰視圖組件 - 工單 0062
 *
 * @module SpectatorView
 * @description 即時同步的觀戰介面（唯讀），透過 Socket.io 接收遊戲狀態更新
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../firebase/AuthContext';
import {
  initSocket,
  joinAsSpectator,
  leaveSpectator,
  onSpectatorJoined,
  onSpectatorSync,
  onSpectatorCount,
  onSpectatorGameEnded,
  onConnectionChange,
  onError
} from '../../../../services/socketService';
import './SpectatorView.css';

const PHASE_LABELS = {
  waiting: '等待中',
  playing: '進行中',
  postQuestion: '問牌後',
  followGuessing: '跟猜中',
  roundEnd: '局結束',
  finished: '遊戲結束'
};

/**
 * 觀戰視圖組件
 */
function SpectatorView() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gameState, setGameState] = useState(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [gameEnded, setGameEnded] = useState(false);

  const spectatorIdRef = useRef(`spectator_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
  const spectatorName = user?.isAnonymous
    ? '訪客觀眾'
    : (user?.displayName || '觀眾');

  const handleLeave = useCallback(() => {
    leaveSpectator(gameId);
    navigate('/lobby/herbalism');
  }, [gameId, navigate]);

  useEffect(() => {
    initSocket();

    const unsubConnect = onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setError('連線中斷，等待重連...');
      } else {
        setError('');
      }
    });

    const unsubError = onError(({ message }) => {
      setError(message);
    });

    const unsubJoined = onSpectatorJoined(({ gameState: gs, spectatorCount: count }) => {
      setGameState(gs);
      setSpectatorCount(count);
      setError('');
    });

    const unsubSync = onSpectatorSync(({ gameState: gs, spectatorCount: count }) => {
      setGameState(gs);
      setSpectatorCount(count);
    });

    const unsubCount = onSpectatorCount(({ spectatorCount: count }) => {
      setSpectatorCount(count);
    });

    const unsubEnded = onSpectatorGameEnded(() => {
      setGameEnded(true);
    });

    // 加入觀戰
    const spectator = {
      id: spectatorIdRef.current,
      name: spectatorName
    };
    joinAsSpectator(gameId, spectator);

    return () => {
      unsubConnect();
      unsubError();
      unsubJoined();
      unsubSync();
      unsubCount();
      unsubEnded();
      leaveSpectator(gameId);
    };
  }, [gameId, spectatorName]);

  if (gameEnded) {
    return (
      <div className="spectator-ended">
        <div className="spectator-ended-card">
          <span className="material-symbols-outlined spectator-ended-icon">sports_score</span>
          <h2>遊戲已結束</h2>
          <p>此對局已結束，感謝您的觀戰！</p>
          {gameState && gameState.winner && (
            <p className="spectator-winner-msg">
              🏆 {gameState.players?.find(p => p.id === gameState.winner)?.name || '未知玩家'} 獲勝！
            </p>
          )}
          <button className="spectator-back-btn" onClick={() => navigate('/lobby/herbalism')}>
            返回大廳
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="spectator-view">
      {/* 頂部觀戰欄 */}
      <header className="spectator-header">
        <div className="spectator-header-left">
          <span className="material-symbols-outlined spectator-icon">visibility</span>
          <span className="spectator-title">觀戰模式</span>
          <span className="spectator-game-id"># {gameId.slice(-6)}</span>
        </div>
        <div className="spectator-header-center">
          {gameState && (
            <span className={`spectator-phase spectator-phase-${gameState.gamePhase}`}>
              {PHASE_LABELS[gameState.gamePhase] || gameState.gamePhase}
            </span>
          )}
        </div>
        <div className="spectator-header-right">
          <span className="spectator-count">
            <span className="material-symbols-outlined">groups</span>
            {spectatorCount} 人觀戰
          </span>
          {!isConnected && (
            <span className="spectator-disconnected">連線中斷</span>
          )}
          <button className="spectator-leave-btn" onClick={handleLeave}>
            <span className="material-symbols-outlined">exit_to_app</span>
            離開觀戰
          </button>
        </div>
      </header>

      {/* 錯誤訊息 */}
      {error && (
        <div className="spectator-error" role="alert">
          {error}
        </div>
      )}

      {/* 遊戲內容 */}
      {!gameState ? (
        <div className="spectator-loading">
          <div className="spectator-spinner"></div>
          <p>正在載入遊戲狀態...</p>
        </div>
      ) : (
        <main className="spectator-main">
          {/* 蓋牌區域 */}
          <section className="spectator-board">
            <h3 className="spectator-section-title">
              <span className="material-symbols-outlined">mystery</span>
              蓋牌（隱藏）
            </h3>
            <div className="spectator-hidden-cards">
              {[0, 1].map((i) => (
                <div key={i} className="spectator-hidden-card">
                  <div className="spectator-card-back">
                    <span className="spectator-card-question">?</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 玩家列表 */}
          <section className="spectator-players">
            <h3 className="spectator-section-title">
              <span className="material-symbols-outlined">group</span>
              玩家狀態
            </h3>
            <div className="spectator-player-list">
              {gameState.players && gameState.players.map((player, idx) => {
                const isCurrentTurn = idx === gameState.currentPlayerIndex;
                const isActive = player.isActive !== false;
                const score = (gameState.scores && gameState.scores[player.id]) || player.score || 0;

                return (
                  <div
                    key={player.id}
                    className={`spectator-player-card ${isCurrentTurn ? 'current-turn' : ''} ${!isActive ? 'inactive' : ''}`}
                  >
                    <div className="spectator-player-header">
                      <span className="spectator-player-name">{player.name}</span>
                      {isCurrentTurn && isActive && (
                        <span className="spectator-turn-badge">當前回合</span>
                      )}
                      {!isActive && (
                        <span className="spectator-inactive-badge">已退出</span>
                      )}
                      {player.isDisconnected && (
                        <span className="spectator-disconnected-badge">斷線</span>
                      )}
                    </div>
                    <div className="spectator-player-score">
                      <span className="material-symbols-outlined">star</span>
                      {score} 分
                    </div>
                    <div className="spectator-player-hand">
                      手牌：{player.hand ? player.hand.length : 0} 張
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 遊戲歷史 */}
          {gameState.gameHistory && gameState.gameHistory.length > 0 && (
            <section className="spectator-history">
              <h3 className="spectator-section-title">
                <span className="material-symbols-outlined">history</span>
                最近動作
              </h3>
              <ul className="spectator-history-list">
                {gameState.gameHistory.slice(-5).reverse().map((entry, i) => (
                  <li key={i} className="spectator-history-item">
                    {formatHistoryEntry(entry, gameState.players)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 積分板 */}
          {gameState.scores && (
            <section className="spectator-scores">
              <h3 className="spectator-section-title">
                <span className="material-symbols-outlined">leaderboard</span>
                積分板
              </h3>
              <div className="spectator-score-list">
                {gameState.players &&
                  [...gameState.players]
                    .sort((a, b) => ((gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0)))
                    .map((player) => (
                      <div key={player.id} className="spectator-score-row">
                        <span className="spectator-score-name">{player.name}</span>
                        <span className="spectator-score-value">
                          {gameState.scores[player.id] || 0} / {gameState.winningScore || 7}
                        </span>
                        <div className="spectator-score-bar-wrap">
                          <div
                            className="spectator-score-bar"
                            style={{ width: `${Math.min(100, ((gameState.scores[player.id] || 0) / (gameState.winningScore || 7)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                }
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

/**
 * 格式化歷史記錄條目
 */
function formatHistoryEntry(entry, players) {
  if (!entry) return '';
  const findName = (id) => {
    const p = players && players.find(p => p.id === id);
    return p ? p.name : id;
  };

  if (entry.type === 'question') {
    return `${findName(entry.playerId)} 向 ${findName(entry.targetPlayerId)} 問牌`;
  }
  if (entry.type === 'guess') {
    return `${findName(entry.playerId)} 猜牌`;
  }
  return JSON.stringify(entry);
}

export default SpectatorView;
