/**
 * 演化論遊戲房間等待介面
 *
 * @module components/games/evolution/EvolutionLobby
 * 工單 0273
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../firebase/AuthContext';
import {
  evoSetReady,
  evoStartGame,
  evoLeaveRoom,
  onEvoPlayerJoined,
  onEvoPlayerLeft,
  onEvoPlayerReady,
  onEvoPlayerConnectionChanged,
  getSocket,
  onConnectionChange,
  onEvoGameStarted,
  onEvoError
} from '../../../../services/socketService';
import './EvolutionLobby.css';

/**
 * 演化論房間等待介面組件
 * @param {Object} props
 * @param {string} props.roomId - 房間 ID
 * @param {Object} props.initialRoom - 初始房間資料
 * @param {Function} props.onGameStart - 遊戲開始回調
 */
function EvolutionLobby(props) {
  const { user } = useAuth();
  // Remount only at an identity/route boundary, never on same-UID token refresh.
  return <EvolutionLobbySession key={JSON.stringify([user?.uid || null, props.roomId])} {...props} user={user} />;
}

function EvolutionLobbySession({ roomId, initialRoom, initialRoomOwnerUid, onGameStart, user }) {
  const navigate = useNavigate();
  const validInitialRoom = user?.uid && initialRoomOwnerUid === user.uid && initialRoom?.id === roomId && initialRoom.players?.some(p => p.firebaseUid === user?.uid)
    ? initialRoom : null;
  const [room, setRoom] = useState(validInitialRoom);
  const [connected, setConnected] = useState(() => Boolean(getSocket()?.connected));
  const [error, setError] = useState(null);

  // 工單 0279：同步 initialRoom prop 變化
  useEffect(() => {
    if (validInitialRoom) setRoom(validInitialRoom);
  }, [validInitialRoom]);

  // 工單 0283：使用 firebaseUid 查找當前玩家
  const currentPlayer = room?.players?.find(p => p.firebaseUid === user?.uid);
  const isHost = currentPlayer?.isHost;
  const isReady = Boolean(currentPlayer?.isReady);
  const allPlayersConnected = connected && room?.players?.every(p => !p.isDisconnected);

  // 檢查是否所有玩家都準備
  const allPlayersReady = room?.players?.length >= 2 &&
    room?.players?.every(p => p.isReady || p.isHost);

  // Socket metadata belongs to this route and this listener lifetime only.
  useEffect(() => {
    let alive = true;
    let errorTimer = null;
    const updateRoom = ({ room: updatedRoom }) => {
      if (alive && updatedRoom?.id === roomId) {
        const ownedRoom = user?.uid && updatedRoom.players?.some(p => p.firebaseUid === user.uid);
        setRoom(ownedRoom ? updatedRoom : null);
      }
    };
    const unsubPlayerJoined = onEvoPlayerJoined(updateRoom);
    const unsubPlayerLeft = onEvoPlayerLeft(updateRoom);
    const unsubPlayerReady = onEvoPlayerReady(updateRoom);
    const unsubPlayerConnection = onEvoPlayerConnectionChanged(updateRoom);
    const unsubConnection = onConnectionChange(value => { if (alive) setConnected(value); });
    const unsubGameStarted = onEvoGameStarted(gameState => {
      if (alive && gameState?.gameId === roomId && onGameStart) onGameStart(gameState);
    });
    const unsubError = onEvoError(({ gameId, message }) => {
      if (!alive || gameId !== roomId) return;
      console.error('[EvolutionLobby] 發生錯誤');
      setError(typeof message === 'string' ? message : '操作失敗，請稍後再試');
      if (errorTimer !== null) clearTimeout(errorTimer);
      errorTimer = setTimeout(() => { if (alive) setError(null); }, 3000);
    });
    return () => {
      alive = false;
      if (errorTimer !== null) clearTimeout(errorTimer);
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubPlayerReady();
      unsubPlayerConnection();
      unsubConnection();
      unsubGameStarted();
      unsubError();
    };
  }, [user?.uid, onGameStart, roomId]);

  // 切換準備狀態
  // 工單 0283：使用 currentPlayer.id 而非 Firebase UID
  const handleToggleReady = useCallback(() => {
    if (!roomId || !currentPlayer?.id || !connected || currentPlayer.isDisconnected) return;
    evoSetReady(roomId, currentPlayer.id, !isReady);
  }, [roomId, currentPlayer?.id, currentPlayer?.isDisconnected, isReady, connected]);

  // 開始遊戲
  // 工單 0283：使用 currentPlayer.id 而非 Firebase UID
  const handleStartGame = useCallback(() => {
    if (!roomId || !currentPlayer?.id || !isHost || !allPlayersReady || !allPlayersConnected) return;
    evoStartGame(roomId, currentPlayer.id);
  }, [roomId, currentPlayer?.id, isHost, allPlayersReady, allPlayersConnected]);

  // 離開房間
  // 工單 0283：使用 currentPlayer.id 而非 Firebase UID
  const handleLeaveRoom = useCallback(() => {
    if (!roomId || !currentPlayer?.id) return;
    evoLeaveRoom(roomId, currentPlayer.id);
    // 工單 0276：返回演化論大廳
    navigate('/lobby/evolution');
  }, [roomId, currentPlayer?.id, navigate]);

  if (!room) {
    return (
      <div className="evolution-lobby loading">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="evolution-lobby">
      {/* 房間標題 */}
      <div className="room-header">
        <h2>{room.name || '演化論房間'}</h2>
        <span className="room-id">房間 ID: {roomId}</span>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* 玩家列表 */}
      <div className="players-section">
        <h3>
          玩家列表 ({room.players?.length || 0}/{room.maxPlayers || 4})
        </h3>
        <div className="player-list">
          {/* 工單 0283：使用 firebaseUid 判斷當前玩家 */}
          {room.players?.map(player => (
            <div
              key={player.id}
              className={`player-card ${player.firebaseUid === user?.uid ? 'current-player' : ''}`}
            >
              <span className="player-name">{player.name}</span>
              {player.isHost && <span className="host-badge">房主</span>}
              <span className={`ready-status ${player.isReady ? 'ready' : ''}`}>
                {player.isDisconnected ? '重新連線中' : player.isHost ? '(房主)' : player.isReady ? '已準備' : '未準備'}
              </span>
            </div>
          ))}

          {/* 空位顯示 */}
          {Array.from({ length: (room.maxPlayers || 4) - (room.players?.length || 0) }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <span className="player-name">等待玩家加入...</span>
            </div>
          ))}
        </div>
      </div>

      {/* 遊戲資訊 */}
      <div className="game-info">
        <p>遊戲類型：演化論：物種起源</p>
        <p>遊戲人數：2-4 人</p>
        <p>遊戲時間：約 30-60 分鐘</p>
      </div>

      {/* 操作按鈕 */}
      <div className="action-buttons">
        {!isHost && (
          <button
            className={`ready-btn ${isReady ? 'cancel' : ''}`}
            onClick={handleToggleReady}
            disabled={!connected || Boolean(currentPlayer?.isDisconnected)}
          >
            {isReady ? '取消準備' : '準備'}
          </button>
        )}

        {isHost && (
          <button
            className="start-btn"
            onClick={handleStartGame}
            disabled={!allPlayersReady || !allPlayersConnected}
          >
            {(room.players?.length || 0) < 2
              ? '需要至少 2 位玩家'
              : !allPlayersConnected
                ? '等待玩家重新連線'
                : !allPlayersReady
                  ? '等待玩家準備'
                  : '開始遊戲'}
          </button>
        )}

        <button className="leave-btn" onClick={handleLeaveRoom}>
          離開房間
        </button>
      </div>

      {/* 提示訊息 */}
      <div className="tips">
        {isHost ? (
          <p>您是房主，當所有玩家準備後即可開始遊戲。</p>
        ) : (
          <p>點擊「準備」按鈕表示您已準備好開始遊戲。</p>
        )}
      </div>
    </div>
  );
}

export default EvolutionLobby;
