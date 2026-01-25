/**
 * 遊戲大廳組件
 * 重新設計：中國風草藥主題（基於 Google Stitch 設計）
 *
 * @module Lobby
 * @description 顯示遊戲大廳，包含房間列表、創建房間和加入房間功能
 */

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  updateGameState
} from '../../store/gameStore';
import {
  initSocket,
  onRoomList,
  onRoomCreated,
  onJoinedRoom,
  onError,
  onConnectionChange,
  onPasswordRequired,
  onReconnected,
  onReconnectFailed,
  createRoom,
  joinRoom,
  attemptReconnect,
  emitPlayerRefreshing
} from '../../services/socketService';
import { MIN_PLAYERS, MAX_PLAYERS } from '../../shared/constants';
import {
  savePlayerName,
  getPlayerName,
  getCurrentRoom,
  clearCurrentRoom,
  saveCurrentRoom
} from '../../utils/localStorage';
import { getPlayerNameError, getRoomPasswordError } from '../../utils/validation';
import './Lobby.css';

/**
 * 遊戲大廳組件
 *
 * @returns {JSX.Element} 大廳組件
 */
function Lobby() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 本地狀態
  const [playerName, setPlayerName] = useState('');
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [playerId] = useState(`player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

  // 房間密碼相關狀態
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);
  const [pendingRoomName, setPendingRoomName] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 創建房間 Modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 重連相關狀態
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempted, setReconnectAttempted] = useState(false);

  // 當前分頁
  const [activeTab, setActiveTab] = useState('rooms');

  // 載入時讀取儲存的暱稱
  useEffect(() => {
    const savedName = getPlayerName();
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // 初始化 Socket 連線
  useEffect(() => {
    initSocket();

    const unsubConnect = onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setError('與伺服器斷線，請確認後端是否啟動');
      } else {
        setError('');
      }
    });

    const unsubRooms = onRoomList((updatedRooms) => {
      setRooms(updatedRooms);
    });

    const unsubError = onError(({ message }) => {
      setError(message);
      setIsLoading(false);
    });

    const unsubCreated = onRoomCreated(({ gameId, gameState }) => {
      saveCurrentRoom({
        roomId: gameId,
        playerId: playerId,
        playerName: playerName.trim()
      });

      dispatch(updateGameState({
        gameId,
        players: gameState.players,
        maxPlayers: gameState.maxPlayers,
        gamePhase: gameState.gamePhase,
        currentPlayerId: playerId
      }));
      navigate(`/game/${gameId}`);
      setIsLoading(false);
      setShowCreateModal(false);
    });

    const unsubJoined = onJoinedRoom(({ gameId, gameState }) => {
      saveCurrentRoom({
        roomId: gameId,
        playerId: playerId,
        playerName: playerName.trim()
      });

      dispatch(updateGameState({
        gameId,
        players: gameState.players,
        maxPlayers: gameState.maxPlayers,
        gamePhase: gameState.gamePhase,
        currentPlayerId: playerId
      }));
      navigate(`/game/${gameId}`);
      setIsLoading(false);
    });

    const unsubPassword = onPasswordRequired(({ gameId }) => {
      const room = rooms.find(r => r.id === gameId);
      setPendingRoomId(gameId);
      setPendingRoomName(room ? room.name : '私人房間');
      setShowPasswordModal(true);
      setInputPassword('');
      setPasswordError('');
      setIsLoading(false);
    });

    const unsubReconnected = onReconnected(({ gameId, playerId: reconnectedPlayerId, gameState }) => {
      console.log('[重連] 重連成功:', gameId);
      setIsReconnecting(false);
      dispatch(updateGameState({
        gameId,
        players: gameState.players,
        maxPlayers: gameState.maxPlayers,
        gamePhase: gameState.gamePhase,
        currentPlayerId: reconnectedPlayerId
      }));
      navigate(`/game/${gameId}`);
    });

    const unsubReconnectFailed = onReconnectFailed(({ reason, message }) => {
      console.log('[重連] 重連失敗:', reason, message);
      setIsReconnecting(false);
      clearCurrentRoom();
      setError(`重連失敗：${message}`);
    });

    return () => {
      unsubConnect();
      unsubRooms();
      unsubError();
      unsubCreated();
      unsubJoined();
      unsubPassword();
      unsubReconnected();
      unsubReconnectFailed();
    };
  }, [dispatch, navigate, playerId, rooms, playerName]);

  // 嘗試重連
  useEffect(() => {
    if (isConnected && !reconnectAttempted) {
      setReconnectAttempted(true);

      const savedRoom = getCurrentRoom();
      if (savedRoom && savedRoom.roomId && savedRoom.playerId) {
        console.log('[重連] 發現儲存的房間資訊，嘗試重連:', savedRoom);
        setIsReconnecting(true);
        attemptReconnect(savedRoom.roomId, savedRoom.playerId, savedRoom.playerName);
      }
    }
  }, [isConnected, reconnectAttempted]);

  // 頁面重整前通知後端
  useEffect(() => {
    const handleBeforeUnload = () => {
      const savedRoom = getCurrentRoom();
      if (savedRoom && savedRoom.roomId && savedRoom.playerId) {
        emitPlayerRefreshing(savedRoom.roomId, savedRoom.playerId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  /**
   * 驗證玩家名稱
   */
  const validatePlayerNameInput = () => {
    const nameError = getPlayerNameError(playerName);
    if (nameError) {
      setError(nameError);
      return false;
    }
    return true;
  };

  /**
   * 創建新房間
   */
  const handleCreateRoom = () => {
    if (!validatePlayerNameInput()) return;
    if (!isConnected) {
      setError('尚未連線到伺服器');
      return;
    }

    if (isPrivate) {
      const pwdError = getRoomPasswordError(roomPassword);
      if (pwdError) {
        setError(pwdError);
        return;
      }
    }

    savePlayerName(playerName.trim());

    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: playerName.trim()
    };

    createRoom(player, playerCount, isPrivate ? roomPassword : null);
  };

  /**
   * 快速加入房間
   */
  const handleQuickJoin = (selectedRoomId, roomIsPrivate = false, roomName = '') => {
    if (!validatePlayerNameInput()) return;
    if (!isConnected) {
      setError('尚未連線到伺服器');
      return;
    }

    if (roomIsPrivate) {
      setPendingRoomId(selectedRoomId);
      setPendingRoomName(roomName);
      setShowPasswordModal(true);
      setInputPassword('');
      setPasswordError('');
      return;
    }

    savePlayerName(playerName.trim());

    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: playerName.trim()
    };

    joinRoom(selectedRoomId, player);
  };

  /**
   * 快速加入任意房間
   */
  const handleQuickJoinAny = () => {
    if (!validatePlayerNameInput()) return;
    if (!isConnected) {
      setError('尚未連線到伺服器');
      return;
    }

    // 找到第一個可加入的房間
    const availableRoom = rooms.find(room =>
      room.playerCount < (room.maxPlayers || 4) && !room.isPrivate
    );

    if (availableRoom) {
      handleQuickJoin(availableRoom.id, false, availableRoom.name);
    } else {
      setError('目前沒有可加入的房間，請創建新房間');
    }
  };

  /**
   * 提交密碼加入私人房間
   */
  const handlePasswordSubmit = () => {
    if (!inputPassword) {
      setPasswordError('請輸入密碼');
      return;
    }

    savePlayerName(playerName.trim());

    setIsLoading(true);
    setShowPasswordModal(false);

    const player = {
      id: playerId,
      name: playerName.trim()
    };

    joinRoom(pendingRoomId, player, inputPassword);
  };

  /**
   * 關閉密碼輸入框
   */
  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingRoomId(null);
    setPendingRoomName('');
    setInputPassword('');
    setPasswordError('');
  };

  /**
   * 獲取玩家名稱首字母
   */
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="lobby">
      {/* 重連中覆蓋層 */}
      {isReconnecting && (
        <div className="modal-overlay">
          <div className="modal reconnecting-modal">
            <div className="reconnecting-spinner"></div>
            <p>正在嘗試重新連線...</p>
          </div>
        </div>
      )}

      {/* 頂部導航欄 */}
      <header className="lobby-header">
        <div className="lobby-header-inner">
          <div className="lobby-brand">
            <div className="lobby-logo">
              <span className="material-symbols-outlined">eco</span>
            </div>
            <div className="lobby-brand-text">
              <h1 className="lobby-brand-title">Herbalism</h1>
              <span className="lobby-brand-subtitle">本草</span>
            </div>
          </div>

          <div className="lobby-user-area">
            <div className="lobby-score">
              <span className="material-symbols-outlined">stars</span>
              <span>Score: 0</span>
            </div>
            <div className="lobby-user">
              <div className="lobby-user-info">
                <p className="lobby-user-name">{playerName || '訪客'}</p>
{!isConnected && (
                  <p className="lobby-user-rank">
                    <span className="connection-status disconnected">
                      未連線
                    </span>
                  </p>
                )}
              </div>
              <div className="lobby-avatar">
                {getInitial(playerName)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主內容區 */}
      <main className="lobby-content">
        {/* 分頁導航 */}
        <div className="lobby-tabs">
          <div className="lobby-tabs-inner">
            <button
              className={`lobby-tab ${activeTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('rooms')}
            >
              <span className="material-symbols-outlined">meeting_room</span>
              房間
            </button>
            <button
              className={`lobby-tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => navigate('/friends')}
            >
              <span className="material-symbols-outlined">group</span>
              好友
            </button>
            <button
              className={`lobby-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => navigate('/leaderboard')}
            >
              <span className="material-symbols-outlined">leaderboard</span>
              排行榜
            </button>
            <button
              className={`lobby-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
            >
              <span className="material-symbols-outlined">person</span>
              個人資料
            </button>
          </div>
        </div>

        {/* 標題區域 */}
        <div className="lobby-title-area">
          <div>
            <h2 className="lobby-title">遊戲大廳</h2>
            <p className="lobby-subtitle">加入房間開始遊戲，或創建自己的房間...</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleQuickJoinAny}
            disabled={isLoading || !isConnected}
          >
            <span className="material-symbols-outlined">bolt</span>
            快速加入
          </button>
        </div>

        {/* 玩家名稱輸入 */}
        <div className="input-group" style={{ maxWidth: '400px', marginBottom: '24px' }}>
          <label htmlFor="playerName">玩家名稱</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              setError('');
            }}
            placeholder="請輸入您的名稱（2-12 字元）"
            maxLength={12}
            disabled={isLoading}
          />
          {playerName && getPlayerName() && playerName === getPlayerName() && (
            <span className="welcome-message">歡迎回來，{playerName}！</span>
          )}
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* 房間網格 */}
        <div className="room-grid">
          {rooms.length === 0 ? (
            <p className="no-rooms">目前沒有可用的房間，點擊右下角按鈕創建新房間</p>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-card-image">
                  <div className="room-card-image-bg"></div>
                  <span className={`room-card-status ${room.playerCount >= (room.maxPlayers || 4) ? 'in-game' : 'waiting'} ${room.isPrivate ? 'private' : ''}`}>
                    {room.playerCount >= (room.maxPlayers || 4) ? '已滿' : '等待中'}
                  </span>
                </div>
                <div className="room-card-body">
                  <div className="room-card-info">
                    <div>
                      <h3 className="room-card-name">{room.name}</h3>
                      <p className="room-card-id">ID: {room.id}</p>
                    </div>
                    <div className="room-card-players">
                      <p className={`room-card-players-count ${room.playerCount >= (room.maxPlayers || 4) ? 'full' : ''}`}>
                        {room.playerCount}/{room.maxPlayers || 4}
                      </p>
                      <p className="room-card-players-label">玩家</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleQuickJoin(room.id, room.isPrivate, room.name)}
                    disabled={isLoading || !isConnected || room.playerCount >= (room.maxPlayers || 4)}
                  >
                    <span className="material-symbols-outlined">
                      {room.playerCount >= (room.maxPlayers || 4) ? 'visibility' : 'door_open'}
                    </span>
                    {room.playerCount >= (room.maxPlayers || 4) ? '已滿' : '加入房間'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 創建房間浮動按鈕 */}
      <div className="fab-container">
        <button
          className="fab"
          onClick={() => setShowCreateModal(true)}
          disabled={!isConnected}
          title="創建新房間"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* 頁尾 */}
      <footer className="lobby-footer">
        <div className="lobby-footer-inner">
          <div className="lobby-footer-links">
            <p>© 2024 本草 Herbalism. All rights reserved.</p>
            <a href="#">隱私政策</a>
            <a href="#">服務條款</a>
          </div>
          <div className="lobby-footer-status">
            <span>
              <span className="online-indicator"></span>
              {rooms.length} 個房間
            </span>
{!isConnected && (
              <span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>wifi_off</span>
                伺服器: 離線
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* 創建房間 Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal create-room-modal" onClick={e => e.stopPropagation()}>
            <h3>
              <span className="material-symbols-outlined">add_circle</span>
              創建新房間
            </h3>
            <p>設定房間參數後開始遊戲</p>

            <div className="input-group">
              <label htmlFor="createPlayerCount">玩家數量</label>
              <select
                id="createPlayerCount"
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
                disabled={isLoading}
              >
                <option value={3}>3 人</option>
                <option value={4}>4 人</option>
              </select>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => {
                    setIsPrivate(e.target.checked);
                    if (!e.target.checked) {
                      setRoomPassword('');
                    }
                  }}
                  disabled={isLoading}
                />
                <span>設為私人房間</span>
              </label>
            </div>

            {isPrivate && (
              <div className="input-group">
                <label htmlFor="createRoomPassword">房間密碼</label>
                <input
                  id="createRoomPassword"
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="輸入 4-16 位密碼"
                  maxLength={16}
                  disabled={isLoading}
                />
                <span className="input-hint">密碼長度：4-16 個字元</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateRoom}
                disabled={isLoading || !isConnected}
              >
                {isLoading ? '創建中...' : '創建房間'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 密碼輸入 Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal password-modal">
            <h3>🔒 私人房間</h3>
            <p>「{pendingRoomName}」需要密碼才能加入</p>

            <input
              type="password"
              value={inputPassword}
              onChange={(e) => {
                setInputPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="請輸入房間密碼"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
            />

            {passwordError && (
              <p className="modal-error">{passwordError}</p>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handlePasswordCancel}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePasswordSubmit}
                disabled={isLoading}
              >
                {isLoading ? '加入中...' : '加入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lobby;
