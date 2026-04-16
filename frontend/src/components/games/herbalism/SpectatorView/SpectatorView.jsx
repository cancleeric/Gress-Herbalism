/**
 * 觀戰模式視圖 - Issue #62
 * 顯示進行中的本草遊戲（上帝視角 — 所有手牌可見）
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../firebase/AuthContext';
import {
  initSocket,
  spectatorJoin,
  spectatorLeave,
  sendSpectatorChat,
  onSpectatorSync,
  onSpectatorJoined,
  onSpectatorLeft,
  onSpectatorChat,
  onSpectatorError
} from '../../../../services/socketService';
import {
  startSpectating,
  stopSpectating,
  syncGameState,
  spectatorJoined as spectatorJoinedAction,
  spectatorLeft as spectatorLeftAction,
  addChatMessage,
  setSpectatorError,
  selectSpectatorGameState,
  selectSpectators,
  selectSpectatorChatMessages,
  selectSpectatorError
} from '../../../../store/spectatorSlice';
import './SpectatorView.css';

const COLOR_LABELS = {
  red: '紅',
  yellow: '黃',
  green: '綠',
  blue: '藍'
};

const COLOR_CLASSES = {
  red: 'card-red',
  yellow: 'card-yellow',
  green: 'card-green',
  blue: 'card-blue'
};

function CardChip({ color }) {
  return (
    <span className={`spec-card-chip ${COLOR_CLASSES[color] || ''}`}>
      {COLOR_LABELS[color] || color}
    </span>
  );
}

function PlayerHand({ player }) {
  return (
    <div className={`spec-player ${player.isCurrentTurn ? 'spec-player--active' : ''} ${!player.isActive ? 'spec-player--inactive' : ''}`}>
      <div className="spec-player-header">
        <span className="spec-player-name">
          {player.name}
          {player.isCurrentTurn && <span className="spec-turn-badge">回合中</span>}
          {!player.isActive && <span className="spec-inactive-badge">離開</span>}
        </span>
        <span className="spec-player-score">分數: {player.score || 0}</span>
      </div>
      <div className="spec-hand">
        {player.hand && player.hand.length > 0 ? (
          player.hand.map((card) => (
            <CardChip key={card.id} color={card.color} />
          ))
        ) : (
          <span className="spec-no-cards">無手牌</span>
        )}
      </div>
    </div>
  );
}

/**
 * 觀戰模式主組件
 */
function SpectatorView() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const gameState = useSelector(selectSpectatorGameState);
  const spectators = useSelector(selectSpectators);
  const chatMessages = useSelector(selectSpectatorChatMessages);
  const error = useSelector(selectSpectatorError);

  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef(null);

  const spectatorId = useRef(`spec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).current;
  const spectatorName = user?.displayName || user?.email || '觀戰者';

  // 自動滾動聊天至底部
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // 初始化 socket 並加入觀戰
  // spectatorId and spectatorName are stable refs/values derived from stable sources.
  useEffect(() => {
    initSocket();
    dispatch(startSpectating({ gameId }));

    spectatorJoin(gameId, { id: spectatorId, name: spectatorName });

    const unsubSync = onSpectatorSync((snapshot) => {
      dispatch(syncGameState({
        gameState: snapshot,
        spectators: snapshot.spectators || []
      }));
    });

    const unsubJoined = onSpectatorJoined((payload) => {
      dispatch(spectatorJoinedAction(payload));
    });

    const unsubLeft = onSpectatorLeft((payload) => {
      dispatch(spectatorLeftAction(payload));
    });

    const unsubChat = onSpectatorChat((msg) => {
      dispatch(addChatMessage(msg));
    });

    const unsubError = onSpectatorError(({ message }) => {
      dispatch(setSpectatorError(message));
    });

    return () => {
      spectatorLeave(gameId, spectatorId);
      dispatch(stopSpectating());
      unsubSync();
      unsubJoined();
      unsubLeft();
      unsubChat();
      unsubError();
    };
  }, [gameId, spectatorId, spectatorName, dispatch]);

  const handleLeave = useCallback(() => {
    spectatorLeave(gameId, spectatorId);
    dispatch(stopSpectating());
    navigate('/lobby/herbalism');
  }, [gameId, spectatorId, dispatch, navigate]);

  const handleSendChat = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) return;
    sendSpectatorChat(gameId, spectatorId, spectatorName, msg);
    setChatInput('');
  }, [chatInput, gameId, spectatorId, spectatorName]);

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  if (error) {
    return (
      <div className="spectator-error">
        <span className="material-symbols-outlined">error</span>
        <p>{error}</p>
        <button onClick={() => navigate('/lobby/herbalism')}>返回大廳</button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="spectator-loading">
        <div className="spectator-spinner"></div>
        <p>載入牌局中...</p>
      </div>
    );
  }

  const hiddenCards = gameState.hiddenCards || [];
  const players = gameState.players || [];

  return (
    <div className="spectator-view">
      {/* 頂部工具列 */}
      <header className="spectator-header">
        <div className="spectator-header-left">
          <span className="material-symbols-outlined">visibility</span>
          <h1 className="spectator-title">觀戰中</h1>
          <span className="spectator-game-id">{gameId.slice(-8)}</span>
        </div>
        <div className="spectator-header-right">
          <span className="spectator-count-badge">
            <span className="material-symbols-outlined">group</span>
            {spectators.length} 人觀戰
          </span>
          <button
            className="spectator-chat-toggle"
            onClick={() => setShowChat(v => !v)}
            title="觀戰聊天室"
          >
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button className="spectator-leave-btn" onClick={handleLeave}>
            <span className="material-symbols-outlined">exit_to_app</span>
            離開觀戰
          </button>
        </div>
      </header>

      <div className="spectator-body">
        {/* 主牌局區 */}
        <main className="spectator-main">
          {/* 蓋牌（上帝視角可見）*/}
          <section className="spectator-hidden-cards">
            <h2 className="spectator-section-title">蓋牌（上帝視角）</h2>
            <div className="spec-hidden-hand">
              {hiddenCards.map((card) => (
                <CardChip key={card.id} color={card.color} />
              ))}
            </div>
          </section>

          {/* 遊戲階段 */}
          <div className="spectator-phase">
            階段：<strong>{gameState.gamePhase}</strong>
            &nbsp;|&nbsp;第 <strong>{gameState.currentRound || 1}</strong> 局
          </div>

          {/* 所有玩家手牌 */}
          <section className="spectator-players">
            <h2 className="spectator-section-title">玩家手牌</h2>
            <div className="spec-players-grid">
              {players.map((player) => (
                <PlayerHand key={player.id} player={player} />
              ))}
            </div>
          </section>

          {/* 遊戲歷史摘要 */}
          {gameState.gameHistory && gameState.gameHistory.length > 0 && (
            <section className="spectator-history">
              <h2 className="spectator-section-title">最近動作</h2>
              <ul className="spec-history-list">
                {gameState.gameHistory.slice(-5).reverse().map((entry, idx) => (
                  <li key={idx} className="spec-history-item">
                    <span className="spec-history-type">{entry.type}</span>
                    {entry.playerName && <span> — {entry.playerName}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        {/* 側欄：觀戰者列表 */}
        <aside className="spectator-sidebar">
          <h2 className="spectator-section-title">
            <span className="material-symbols-outlined">group</span>
            觀戰者列表 ({spectators.length})
          </h2>
          <ul className="spec-spectator-list">
            {spectators.map((s) => (
              <li key={s.id} className="spec-spectator-item">
                <span className="material-symbols-outlined">visibility</span>
                {s.name}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* 觀戰聊天室抽屜 */}
      {showChat && (
        <div className="spectator-chat-drawer">
          <div className="spectator-chat-header">
            <span>觀戰聊天室</span>
            <button onClick={() => setShowChat(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="spectator-chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="spectator-chat-msg">
                <span className="spectator-chat-name">{msg.spectatorName}</span>
                <span className="spectator-chat-text">{msg.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="spectator-chat-input-row">
            <input
              className="spectator-chat-input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="發送訊息..."
              maxLength={200}
            />
            <button
              className="spectator-chat-send"
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpectatorView;
