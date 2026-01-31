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
function EvolutionLobby({ roomId, initialRoom, onGameStart }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(initialRoom);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // 工單 0279：同步 initialRoom prop 變化
  useEffect(() => {
    if (initialRoom) {
      console.log('[EvolutionLobby] initialRoom 更新:', initialRoom.players?.map(p => p.name));
      setRoom(initialRoom);
    }
  }, [initialRoom]);

  // 工單 0283：使用 firebaseUid 查找當前玩家
  const currentPlayer = room?.players?.find(p => p.firebaseUid === user?.uid);
  const isHost = currentPlayer?.isHost;

  // 檢查是否所有玩家都準備
  const allPlayersReady = room?.players?.length >= 2 &&
    room?.players?.every(p => p.isReady || p.isHost);

  // Socket 事件監聽
  useEffect(() => {
    // 監聽玩家加入
    const unsubPlayerJoined = onEvoPlayerJoined(({ player, room: updatedRoom }) => {
      console.log('[EvolutionLobby] 玩家加入:', player.name);
      setRoom(updatedRoom);
    });

    // 監聽玩家離開
    // 工單 0282：增強日誌
    const unsubPlayerLeft = onEvoPlayerLeft(({ playerId, room: updatedRoom }) => {
      console.log('[EvolutionLobby] 收到 playerLeft 事件');
      console.log('[EvolutionLobby] 離開的 playerId:', playerId);
      console.log('[EvolutionLobby] 更新後的玩家:', updatedRoom?.players?.map(p => p.name));
      setRoom(updatedRoom);
    });

    // 監聽準備狀態變更
    // 工單 0283：使用 player.id 而非 Firebase UID 比對
    const unsubPlayerReady = onEvoPlayerReady(({ playerId, isReady: ready, room: updatedRoom }) => {
      console.log('[EvolutionLobby] 玩家準備狀態:', playerId, ready);
      setRoom(updatedRoom);
      // 查找當前玩家並比對
      const myPlayer = updatedRoom?.players?.find(p => p.firebaseUid === user?.uid);
      if (playerId === myPlayer?.id) {
        setIsReady(ready);
      }
    });

    // 監聽遊戲開始
    const unsubGameStarted = onEvoGameStarted((gameState) => {
      console.log('[EvolutionLobby] 遊戲開始');
      if (onGameStart) {
        onGameStart(gameState);
      }
    });

    // 監聽錯誤
    const unsubError = onEvoError(({ message }) => {
      console.error('[EvolutionLobby] 錯誤:', message);
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubPlayerReady();
      unsubGameStarted();
      unsubError();
    };
  }, [user?.uid, onGameStart]);

  // 切換準備狀態
  // 工單 0283：使用 currentPlayer.id 而非 Firebase UID
  const handleToggleReady = useCallback(() => {
    if (!roomId || !currentPlayer?.id) return;
    evoSetReady(roomId, currentPlayer.id, !isReady);
  }, [roomId, currentPlayer?.id, isReady]);

  // 開始遊戲
  // 工單 0283：使用 currentPlayer.id 而非 Firebase UID
  const handleStartGame = useCallback(() => {
    if (!roomId || !currentPlayer?.id) return;
    evoStartGame(roomId, currentPlayer.id);
  }, [roomId, currentPlayer?.id]);

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
                {player.isHost ? '(房主)' : player.isReady ? '已準備' : '未準備'}
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
          >
            {isReady ? '取消準備' : '準備'}
          </button>
        )}

        {isHost && (
          <button
            className="start-btn"
            onClick={handleStartGame}
            disabled={!allPlayersReady || (room.players?.length || 0) < 2}
          >
            {(room.players?.length || 0) < 2
              ? '需要至少 2 位玩家'
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
