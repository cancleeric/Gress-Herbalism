/**
 * 遊戲大廳組件
 * 重新設計：側邊欄佈局（基於 Google Stitch 設計 - 提示詞 2）
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
import VersionInfo from '../VersionInfo';
import {
  saveNickname,
  getNickname,
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
  // 工單 0122：分離玩家名稱與暱稱
  const [displayName] = useState('訪客');  // 玩家名稱（登入身份，目前固定為訪客）
  const [nickname, setNickname] = useState('');  // 遊戲暱稱（可編輯）
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

  // 用 Room ID 加入
  const [joinRoomId, setJoinRoomId] = useState('');

  // 當前導航
  const [activeNav, setActiveNav] = useState('rooms');

  // 載入時讀取儲存的暱稱
  useEffect(() => {
    const savedNickname = getNickname();
    if (savedNickname) {
      setNickname(savedNickname);
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
        playerName: nickname.trim()
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
        playerName: nickname.trim()
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
  }, [dispatch, navigate, playerId, rooms, nickname]);

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
   * 驗證遊戲暱稱
   */
  const validateNicknameInput = () => {
    const nameError = getPlayerNameError(nickname);
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
    if (!validateNicknameInput()) return;
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

    saveNickname(nickname.trim());

    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: nickname.trim()
    };

    createRoom(player, playerCount, isPrivate ? roomPassword : null);
  };

  /**
   * 快速加入房間
   */
  const handleQuickJoin = (selectedRoomId, roomIsPrivate = false, roomName = '') => {
    if (!validateNicknameInput()) return;
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

    saveNickname(nickname.trim());

    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: nickname.trim()
    };

    joinRoom(selectedRoomId, player);
  };

  /**
   * 用 Room ID 加入房間
   */
  const handleJoinByRoomId = () => {
    if (!joinRoomId.trim()) {
      setError('請輸入房間 ID');
      return;
    }
    if (!validateNicknameInput()) return;
    if (!isConnected) {
      setError('尚未連線到伺服器');
      return;
    }

    const room = rooms.find(r => r.id === joinRoomId.trim());
    if (room && room.isPrivate) {
      setPendingRoomId(joinRoomId.trim());
      setPendingRoomName(room.name);
      setShowPasswordModal(true);
      setInputPassword('');
      setPasswordError('');
      return;
    }

    saveNickname(nickname.trim());

    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: nickname.trim()
    };

    joinRoom(joinRoomId.trim(), player);
  };

  /**
   * 提交密碼加入私人房間
   */
  const handlePasswordSubmit = () => {
    if (!inputPassword) {
      setPasswordError('請輸入密碼');
      return;
    }

    saveNickname(nickname.trim());

    setIsLoading(true);
    setShowPasswordModal(false);

    const player = {
      id: playerId,
      name: nickname.trim()
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

  /**
   * 判斷房間是否可加入
   */
  const canJoinRoom = (room) => {
    return room.playerCount < (room.maxPlayers || 4);
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

      {/* 側邊欄 */}
      <aside className="lobby-sidebar">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined">eco</span>
        </div>
        <h1 className="sidebar-title">本草</h1>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeNav === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveNav('rooms')}
            title="遊戲大廳"
          >
            <span className="material-symbols-outlined">meeting_room</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
            title="個人資料"
          >
            <span className="material-symbols-outlined">person</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeNav === 'friends' ? 'active' : ''}`}
            onClick={() => navigate('/friends')}
            title="好友"
          >
            <span className="material-symbols-outlined">group</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeNav === 'ranks' ? 'active' : ''}`}
            onClick={() => navigate('/leaderboard')}
            title="排行榜"
          >
            <span className="material-symbols-outlined">leaderboard</span>
          </button>
        </nav>

        <div className="sidebar-decoration">
          <span className="material-symbols-outlined">spa</span>
        </div>
      </aside>

      {/* 主內容區 */}
      <div className="lobby-main">
        {/* 頂部用戶欄 */}
        <header className="lobby-header">
          <div className="lobby-user-area">
            <div className="lobby-avatar">
              {getInitial(displayName)}
            </div>
            <p className="lobby-user-name">{displayName}</p>
          </div>
{!isConnected && (
            <span className="connection-status disconnected">
              未連線
            </span>
          )}
        </header>

        {/* 主內容 */}
        <main className="lobby-content">
          {/* 遊戲暱稱輸入 */}
          <div className="nickname-section">
            <label className="nickname-label" htmlFor="nickname">遊戲暱稱</label>
            <input
              id="nickname"
              className="nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="請輸入遊戲中顯示的暱稱（2-12 字元）"
              maxLength={12}
              disabled={isLoading}
            />
            {nickname && getNickname() && nickname === getNickname() && (
              <span className="welcome-message">歡迎回來，{nickname}！</span>
            )}
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {/* 創建房間按鈕 */}
          <button
            className="create-room-btn"
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected || isLoading}
          >
            <span className="material-symbols-outlined">add_circle</span>
            創建新房間
          </button>

          {/* 加入房間區域 */}
          <div className="join-room-section">
            <input
              className="join-room-input"
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="輸入房間 ID"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoinByRoomId();
                }
              }}
            />
            <button
              className="join-room-btn"
              onClick={handleJoinByRoomId}
              disabled={!isConnected || isLoading || !joinRoomId.trim()}
            >
              <span className="material-symbols-outlined">login</span>
              加入
            </button>
          </div>

          {/* 房間列表表格 */}
          <div className="room-table-container">
            {rooms.length === 0 ? (
              <div className="no-rooms">
                <span className="material-symbols-outlined">meeting_room</span>
                目前沒有可用的房間，點擊上方按鈕創建新房間
              </div>
            ) : (
              <table className="room-table">
                <thead>
                  <tr>
                    <th>房間名稱</th>
                    <th>ID</th>
                    <th>玩家</th>
                    <th>狀態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td>
                        <span className="room-name">
                          {room.name}
                          {room.isPrivate && (
                            <span className="material-symbols-outlined private-icon">lock</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="room-id">{room.id}</span>
                      </td>
                      <td>
                        <span className="room-players">
                          <span className={`room-players-count ${!canJoinRoom(room) ? 'full' : ''}`}>
                            {room.playerCount}/{room.maxPlayers || 4}
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className={`room-status ${canJoinRoom(room) ? 'waiting' : 'full'}`}>
                          {canJoinRoom(room) ? '等待中' : '已滿'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="room-action-btn"
                          onClick={() => handleQuickJoin(room.id, room.isPrivate, room.name)}
                          disabled={isLoading || !isConnected || !canJoinRoom(room)}
                        >
                          <span className="material-symbols-outlined">
                            {canJoinRoom(room) ? 'login' : 'block'}
                          </span>
                          {canJoinRoom(room) ? '加入' : '已滿'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* 頁尾 */}
        <footer className="lobby-footer">
          <div className="lobby-footer-left">
            <span>© 2024 本草 Herbalism</span>
          </div>
          <div className="lobby-footer-right">
            <span className="online-indicator"></span>
            <span>{rooms.length} 個房間</span>
          </div>
        </footer>
      </div>

      {/* 手機版底部導航 */}
      <nav className="mobile-nav">
        <button
          className={`mobile-nav-item ${activeNav === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveNav('rooms')}
        >
          <span className="material-symbols-outlined">meeting_room</span>
          大廳
        </button>
        <button
          className={`mobile-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <span className="material-symbols-outlined">person</span>
          個人
        </button>
        <button
          className={`mobile-nav-item ${activeNav === 'friends' ? 'active' : ''}`}
          onClick={() => navigate('/friends')}
        >
          <span className="material-symbols-outlined">group</span>
          好友
        </button>
        <button
          className={`mobile-nav-item ${activeNav === 'ranks' ? 'active' : ''}`}
          onClick={() => navigate('/leaderboard')}
        >
          <span className="material-symbols-outlined">leaderboard</span>
          排行
        </button>
      </nav>

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
            <h3>
              <span className="material-symbols-outlined">lock</span>
              私人房間
            </h3>
            <p>「{pendingRoomName}」需要密碼才能加入</p>

            <div className="input-group">
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
            </div>

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

      {/* 工單 0112: 版本資訊 */}
      <VersionInfo showFull />
    </div>
  );
}

export default Lobby;
