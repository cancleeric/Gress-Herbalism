/**
 * 觀戰模式視圖組件
 *
 * 工單 0062 - 觀戰模式
 * @module SpectatorView
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../firebase/AuthContext';
import {
  setSpectatorGameState,
  setSpectatorCount,
  setSpectatorStatus,
  setSpectatorError,
  resetSpectator,
} from '../../../../store/spectatorSlice';
import {
  initSocket,
  joinSpectate,
  leaveSpectate,
  onSpectatorJoined,
  onSpectatorSync,
  onSpectatorCount,
  onSpectatorGameEnded,
  onSpectatorError,
} from '../../../../services/socketService';
import './SpectatorView.css';

// 顏色中文對照
const COLOR_LABELS = {
  red: '紅',
  yellow: '黃',
  green: '綠',
  blue: '藍',
};

// 階段中文對照
const PHASE_LABELS = {
  playing: '進行中',
  followGuessing: '跟猜階段',
  postQuestion: '問牌後確認',
  roundEnd: '本局結算',
  finished: '遊戲結束',
};

/**
 * 觀戰用蓋牌組件（顏色隱藏）
 */
function SpectatorHiddenCard({ card, index }) {
  const isRevealed = card && card.color !== null;
  const cardClass = isRevealed
    ? `spectator-hidden-card revealed card-${card.color}`
    : 'spectator-hidden-card';

  return (
    <div className={cardClass} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="card-inner">
        {isRevealed ? (
          <span className="card-color-label">{COLOR_LABELS[card.color] || card.color}</span>
        ) : (
          <span className="card-question">?</span>
        )}
      </div>
    </div>
  );
}

/**
 * 玩家資訊列
 */
function SpectatorPlayerRow({ player, scores }) {
  const score = scores?.[player.id] ?? player.score ?? 0;
  return (
    <div className={`spectator-player-row ${player.isCurrentTurn ? 'current-turn' : ''} ${!player.isActive ? 'inactive' : ''}`}>
      <div className="spectator-player-info">
        <span className="spectator-player-name">
          {player.isCurrentTurn && <span className="turn-indicator">▶ </span>}
          {player.name}
          {player.isHost && <span className="host-badge"> 房主</span>}
          {player.isDisconnected && <span className="disconnected-badge"> 斷線</span>}
          {!player.isActive && <span className="inactive-badge"> 已退出</span>}
        </span>
        <span className="spectator-player-hand-count">手牌: {player.handCount}</span>
      </div>
      <div className="spectator-player-score">
        <span className="score-label">分數</span>
        <span className="score-value">{score}</span>
      </div>
    </div>
  );
}

/**
 * 觀戰主視圖組件
 */
function SpectatorView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user } = useAuth();

  const { gameState, spectatorCount, status, error } = useSelector(
    state => state.spectator
  );

  const spectatorId = useRef(
    `spectator_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );
  const spectatorName = user?.displayName || user?.email || '觀戰者';

  // 離開觀戰
  const handleLeave = useCallback(() => {
    leaveSpectate(gameId, spectatorId.current);
    dispatch(resetSpectator());
    navigate('/lobby/herbalism');
  }, [gameId, dispatch, navigate]);

  useEffect(() => {
    if (!gameId) return;

    // 快取 ref 值以供 cleanup 使用
    const currentSpectatorId = spectatorId.current;

    // 初始化 socket
    initSocket();

    // 發送加入請求
    joinSpectate(gameId, currentSpectatorId, spectatorName);

    // 監聽加入成功
    const offJoined = onSpectatorJoined(({ gameId: gId, gameState: gs, spectatorCount: cnt }) => {
      dispatch(setSpectatorGameState(gId, gs));
      dispatch(setSpectatorCount(cnt));
    });

    // 監聽狀態同步
    const offSync = onSpectatorSync(({ gameState: gs }) => {
      dispatch(setSpectatorGameState(gameId, gs));
    });

    // 監聽觀戰人數
    const offCount = onSpectatorCount(({ count }) => {
      dispatch(setSpectatorCount(count));
    });

    // 監聽遊戲結束
    const offEnded = onSpectatorGameEnded(() => {
      dispatch(setSpectatorStatus('ended'));
    });

    // 監聽錯誤
    const offError = onSpectatorError(({ message }) => {
      dispatch(setSpectatorError(message));
    });

    return () => {
      offJoined();
      offSync();
      offCount();
      offEnded();
      offError();
      leaveSpectate(gameId, currentSpectatorId);
      dispatch(resetSpectator());
    };
  }, [gameId, spectatorName, dispatch]);

  // 錯誤狀態
  if (status === 'error') {
    return (
      <div className="spectator-container">
        <div className="spectator-error">
          <span className="material-symbols-outlined">error</span>
          <p>{error || '無法加入觀戰'}</p>
          <button className="spectator-leave-btn" onClick={() => navigate('/lobby/herbalism')}>
            返回大廳
          </button>
        </div>
      </div>
    );
  }

  // 載入中
  if (status === 'idle' || !gameState) {
    return (
      <div className="spectator-container">
        <div className="spectator-loading">
          <div className="spectator-spinner" />
          <p>正在連線觀戰...</p>
        </div>
      </div>
    );
  }

  // 遊戲結束
  if (status === 'ended') {
    return (
      <div className="spectator-container">
        <div className="spectator-ended">
          <span className="material-symbols-outlined">emoji_events</span>
          <h2>遊戲結束</h2>
          {gameState?.winner && (
            <p className="spectator-winner">勝利者：{gameState.winner.name || gameState.winner}</p>
          )}
          <button className="spectator-leave-btn" onClick={() => navigate('/lobby/herbalism')}>
            返回大廳
          </button>
        </div>
      </div>
    );
  }

  const { players = [], hiddenCards = [], scores = {}, gamePhase, currentRound, winningScore } = gameState;

  return (
    <div className="spectator-container">
      {/* 頂部資訊列 */}
      <div className="spectator-header">
        <div className="spectator-header-left">
          <span className="spectator-badge">
            <span className="material-symbols-outlined">visibility</span>
            觀戰中
          </span>
          <span className="spectator-count">
            <span className="material-symbols-outlined">groups</span>
            {spectatorCount} 人觀戰
          </span>
        </div>
        <div className="spectator-header-center">
          <span className="spectator-game-id">#{gameId?.slice(-6)}</span>
          <span className="spectator-phase">{PHASE_LABELS[gamePhase] || gamePhase}</span>
          {currentRound && (
            <span className="spectator-round">第 {currentRound} 局</span>
          )}
        </div>
        <button className="spectator-leave-btn" onClick={handleLeave}>
          <span className="material-symbols-outlined">logout</span>
          離開觀戰
        </button>
      </div>

      <div className="spectator-main">
        {/* 蓋牌區 */}
        <div className="spectator-board">
          <h3 className="spectator-section-title">蓋牌</h3>
          <div className="spectator-hidden-cards">
            {hiddenCards.map((card, idx) => (
              <SpectatorHiddenCard key={idx} card={card} index={idx} />
            ))}
          </div>
          <p className="spectator-hint">
            {gamePhase === 'roundEnd' || gamePhase === 'finished'
              ? '本局蓋牌已揭曉'
              : '蓋牌將在本局結算時揭曉'}
          </p>
        </div>

        {/* 玩家列表 */}
        <div className="spectator-players">
          <h3 className="spectator-section-title">
            玩家（目標：{winningScore} 分）
          </h3>
          {players.map(player => (
            <SpectatorPlayerRow key={player.id} player={player} scores={scores} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpectatorView;
