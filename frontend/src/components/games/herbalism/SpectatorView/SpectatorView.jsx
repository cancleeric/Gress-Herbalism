/**
 * 觀戰視圖組件
 * 工單 0062 - 觀戰模式：旁觀進行中對局 + 即時同步
 *
 * @module SpectatorView
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../firebase/AuthContext';
import {
  initSocket,
  joinSpectator,
  leaveSpectator,
  onSpectatorJoined,
  onSpectatorSync,
  onSpectatorGameEnded,
  onSpectatorError,
  onConnectionChange
} from '../../../../services/socketService';
import {
  spectatorJoined,
  spectatorSync,
  spectatorGameEnded,
  spectatorError,
  spectatorLeft,
  spectatorReset
} from '../../../../store/spectatorSlice';
import './SpectatorView.css';

const PHASE_LABELS = {
  playing: '進行中',
  followGuessing: '跟猜中',
  postQuestion: '問牌後',
  roundEnd: '局結束',
  finished: '已結束'
};

/**
 * 玩家卡片（觀戰版）
 */
function SpectatorPlayerCard({ player, isCurrent }) {
  return (
    <div className={`spectator-player-card ${isCurrent ? 'spectator-player-card--current' : ''} ${!player.isActive ? 'spectator-player-card--inactive' : ''}`}>
      <div className="spectator-player-name">{player.name}</div>
      <div className="spectator-player-score">
        <span className="spectator-score-label">得分</span>
        <span className="spectator-score-value">{player.score ?? 0}</span>
      </div>
      <div className="spectator-player-hand">
        <span className="spectator-hand-label">手牌</span>
        <span className="spectator-hand-count">{player.handCount ?? 0} 張</span>
      </div>
      {!player.isActive && (
        <div className="spectator-player-badge spectator-player-badge--out">已退出</div>
      )}
      {isCurrent && player.isActive && (
        <div className="spectator-player-badge spectator-player-badge--turn">行動中</div>
      )}
    </div>
  );
}

/**
 * 遊戲歷史記錄列表
 */
function GameHistoryList({ history }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="spectator-history-empty">尚無遊戲記錄</div>
    );
  }

  return (
    <ul className="spectator-history-list" ref={listRef}>
      {history.map((entry, i) => (
        <li key={i} className="spectator-history-item">
          {entry.description || JSON.stringify(entry)}
        </li>
      ))}
    </ul>
  );
}

/**
 * 觀戰視圖主組件
 */
function SpectatorView() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const { isSpectating, gameState, spectatorCount, error, gameEnded, winner, finalScores } =
    useSelector(state => state.spectator);

  const spectatorName = user?.displayName || user?.email || '觀戰者';

  const handleLeave = useCallback(() => {
    if (gameId) {
      leaveSpectator(gameId);
    }
    dispatch(spectatorLeft());
    navigate('/lobby/herbalism');
  }, [gameId, dispatch, navigate]);

  useEffect(() => {
    // 初始化 socket 並加入觀戰
    const s = initSocket();

    const unsubJoined = onSpectatorJoined((data) => {
      dispatch(spectatorJoined(data));
    });

    const unsubSync = onSpectatorSync((data) => {
      dispatch(spectatorSync(data));
    });

    const unsubEnded = onSpectatorGameEnded((data) => {
      dispatch(spectatorGameEnded(data));
    });

    const unsubError = onSpectatorError((data) => {
      dispatch(spectatorError(data.message));
    });

    const unsubConn = onConnectionChange((connected) => {
      if (connected && gameId) {
        // 重連後重新加入觀戰
        joinSpectator(gameId, spectatorName);
      }
    });

    // 加入觀戰
    if (gameId) {
      joinSpectator(gameId, spectatorName);
    }

    return () => {
      unsubJoined();
      unsubSync();
      unsubEnded();
      unsubError();
      unsubConn();
      // 離開時通知伺服器
      if (gameId) {
        leaveSpectator(gameId);
      }
      dispatch(spectatorReset());
    };
  }, [gameId, spectatorName, dispatch]);

  // 錯誤狀態
  if (error) {
    return (
      <div className="spectator-view spectator-view--error">
        <div className="spectator-error-box">
          <h2 className="spectator-error-title">無法觀戰</h2>
          <p className="spectator-error-message">{error}</p>
          <button className="spectator-btn" onClick={() => navigate('/lobby/herbalism')}>
            返回大廳
          </button>
        </div>
      </div>
    );
  }

  // 載入中（尚未收到 joined 確認）
  if (!isSpectating) {
    return (
      <div className="spectator-view spectator-view--loading">
        <div className="spectator-loading-spinner" />
        <p>正在連線到對局...</p>
      </div>
    );
  }

  // 遊戲結束
  if (gameEnded) {
    const winnerPlayer = gameState?.players?.find(p => p.id === winner);
    return (
      <div className="spectator-view spectator-view--ended">
        <div className="spectator-ended-box">
          <h2 className="spectator-ended-title">對局結束</h2>
          {winnerPlayer && (
            <p className="spectator-ended-winner">🏆 {winnerPlayer.name} 獲勝！</p>
          )}
          {finalScores && (
            <div className="spectator-final-scores">
              <h3>最終得分</h3>
              <ul>
                {Object.entries(finalScores).map(([pid, score]) => {
                  const player = gameState?.players?.find(p => p.id === pid);
                  return (
                    <li key={pid}>
                      {player?.name || pid}：{score} 分
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <button className="spectator-btn" onClick={() => navigate('/lobby/herbalism')}>
            返回大廳
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState?.players?.[gameState.currentPlayerIndex];
  const phaseLabel = PHASE_LABELS[gameState?.gamePhase] || gameState?.gamePhase || '載入中';

  return (
    <div className="spectator-view">
      {/* 頂部標題列 */}
      <header className="spectator-header">
        <div className="spectator-header-left">
          <span className="spectator-badge">👁 觀戰中</span>
          <span className="spectator-phase-label">{phaseLabel}</span>
          {gameState?.currentRound > 0 && (
            <span className="spectator-round-label">第 {gameState.currentRound} 局</span>
          )}
        </div>
        <div className="spectator-header-center">
          <h1 className="spectator-title">本草遊戲觀戰</h1>
        </div>
        <div className="spectator-header-right">
          <span className="spectator-count-label">👁 {spectatorCount} 人觀戰</span>
          <button className="spectator-btn spectator-btn--leave" onClick={handleLeave}>
            離開觀戰
          </button>
        </div>
      </header>

      <main className="spectator-main">
        {/* 玩家列表 */}
        <section className="spectator-players">
          <h2 className="spectator-section-title">玩家</h2>
          <div className="spectator-players-grid">
            {(gameState?.players || []).map((player, idx) => (
              <SpectatorPlayerCard
                key={player.id}
                player={player}
                isCurrent={idx === gameState.currentPlayerIndex}
              />
            ))}
          </div>
        </section>

        {/* 蓋牌區 */}
        <section className="spectator-hidden-cards">
          <h2 className="spectator-section-title">蓋牌區</h2>
          <div className="spectator-hidden-cards-row">
            {Array.from({ length: gameState?.hiddenCardCount || 0 }).map((_, i) => (
              <div key={i} className="spectator-hidden-card">
                <span className="spectator-hidden-card-label">?</span>
              </div>
            ))}
          </div>
          <p className="spectator-hidden-cards-hint">
            共 {gameState?.hiddenCardCount || 0} 張蓋牌（顏色僅玩家可見）
          </p>
        </section>

        {/* 遊戲記錄 */}
        <section className="spectator-history">
          <h2 className="spectator-section-title">遊戲記錄</h2>
          <GameHistoryList history={gameState?.gameHistory} />
        </section>
      </main>
    </div>
  );
}

export default SpectatorView;
