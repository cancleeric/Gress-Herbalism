/**
 * 遊戲大廳組件
 * 重新設計：側邊欄佈局（基於 Google Stitch 設計 - 提示詞 2）
 *
 * @module Lobby
 * @description 顯示遊戲大廳，包含房間列表、創建房間和加入房間功能
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../firebase/AuthContext';
import {
  updateGameState
} from '../../../store/gameStore';
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
  emitPlayerRefreshing,
  requestRoomList
} from '../../../services/socketService';
import { MIN_PLAYERS, MAX_PLAYERS, AI_DIFFICULTY } from '../../../shared/constants';
import VersionInfo from '../VersionInfo';
import {
  saveNickname,
  getNickname,
  getCurrentRoom,
  clearCurrentRoom,
  saveCurrentRoom
} from '../../../utils/common/localStorage';
import { getPlayerNameError, getRoomPasswordError } from '../../../utils/common/validation';
import { AIPlayerSelector } from '../../games/herbalism/GameSetup';
import './Lobby.css';

/**
 * 遊戲大廳組件
 *
 * @returns {JSX.Element} 大廳組件
 */
function Lobby() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();  // 從 Auth Context 取得登入資訊

  // 本地狀態
  // 工單 0122：分離玩家名稱與暱稱
  // user.displayName: Google 登入時為帳號名稱，訪客登入時為 null
  // user.isAnonymous: 訪客登入時為 true
  const displayName = user?.isAnonymous ? '訪客' : (user?.displayName || '訪客');
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
  const [createRoomError, setCreateRoomError] = useState('');

  // 重連相關狀態
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempted, setReconnectAttempted] = useState(false);

  // 用 Room ID 加入
  const [joinRoomId, setJoinRoomId] = useState('');

  // 當前導航
  const [activeNav, setActiveNav] = useState('rooms');

  // 工單 0382：延遲顯示斷線錯誤的 timer ref
  const disconnectTimerRef = useRef(null);

  // 工單 0276：移除遊戲類型選擇（現在有獨立的遊戲選擇頁面）

  // 工單 202601260048：單人模式相關狀態
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiConfig, setAIConfig] = useState({
    aiCount: 2,
    difficulties: [AI_DIFFICULTY.MEDIUM, AI_DIFFICULTY.MEDIUM]
  });

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

    // 工單 0382：延遲顯示斷線錯誤，避免初始化時閃現錯誤訊息
    const unsubConnect = onConnectionChange((connected) => {
      setIsConnected(connected);

      // 清除之前的延遲 timer
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }

      if (!connected) {
        // 延遲 3 秒後才顯示錯誤，給予重連時間
        disconnectTimerRef.current = setTimeout(() => {
          setError(t('lobby.error.disconnected'));
        }, 3000);
      } else {
        setError('');
      }
    });

    const unsubRooms = onRoomList((updatedRooms) => {
      setRooms(updatedRooms);
    });

    // 工單 0147：訂閱完成後，主動請求房間列表
    requestRoomList();

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
      // 工單 0276：本草大廳只創建本草房間
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
      // 工單 0276：本草大廳只加入本草房間
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
      // 工單 0382：清理延遲 timer
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
      }
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
      setError(t('lobby.error.notConnected'));
      return;
    }

    if (isPrivate) {
      const pwdError = getRoomPasswordError(roomPassword);
      if (pwdError) {
        setCreateRoomError(pwdError);
        return;
      }
    }

    saveNickname(nickname.trim());

    setIsLoading(true);
    setCreateRoomError('');

    const player = {
      id: playerId,
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : (user?.uid || null),
      photoURL: user?.photoURL || null,
    };

    createRoom(player, playerCount, isPrivate ? roomPassword : null);
  };

  /**
   * 快速加入房間
   */
  const handleQuickJoin = (selectedRoomId, roomIsPrivate = false, roomName = '') => {
    if (!validateNicknameInput()) return;
    if (!isConnected) {
      setError(t('lobby.error.notConnected'));
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
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : (user?.uid || null),
      photoURL: user?.photoURL || null,
    };

    joinRoom(selectedRoomId, player);
  };

  /**
   * 用 Room ID 加入房間
   */
  const handleJoinByRoomId = () => {
    if (!joinRoomId.trim()) {
      setError(t('lobby.error.noRoomId'));
      return;
    }
    if (!validateNicknameInput()) return;
    if (!isConnected) {
      setError(t('lobby.error.notConnected'));
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
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : (user?.uid || null),
      photoURL: user?.photoURL || null,
    };

    joinRoom(joinRoomId.trim(), player);
  };

  /**
   * 提交密碼加入私人房間
   */
  const handlePasswordSubmit = () => {
    if (!inputPassword) {
      setPasswordError(t('lobby.form.passwordPlaceholder'));
      return;
    }

    saveNickname(nickname.trim());

    setIsLoading(true);
    setShowPasswordModal(false);

    const player = {
      id: playerId,
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : (user?.uid || null),
      photoURL: user?.photoURL || null,
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

  /**
   * 工單 202601260048：打開 AI 設定 Modal
   */
  const handleOpenAIModal = () => {
    setShowAIModal(true);
  };

  /**
   * 工單 202601260048：關閉 AI 設定 Modal
   */
  const handleCloseAIModal = () => {
    setShowAIModal(false);
  };

  /**
   * 工單 202601260048：處理 AI 配置變更
   */
  const handleAIConfigChange = (newConfig) => {
    setAIConfig(newConfig);
  };

  /**
   * 工單 202601260048：開始單人遊戲
   */
  const handleStartSinglePlayer = () => {
    if (!nickname.trim()) {
      setError(t('lobby.error.invalidNickname'));
      return;
    }

    console.log('[Lobby] 開始單人遊戲，aiConfig:', aiConfig);

    // 儲存暱稱到 localStorage
    saveNickname(nickname.trim());

    // 使用 URL 參數傳遞 aiConfig（避免 state 在刷新後丟失）
    const params = new URLSearchParams({
      mode: 'single',
      aiCount: aiConfig.aiCount.toString(),
      difficulties: aiConfig.difficulties.join(','),
      playerName: nickname.trim(),
      playerId: playerId
    });

    // 導航到單人模式遊戲（使用 URL 參數 + state）
    navigate(`/game/local-game?${params.toString()}`, {
      state: {
        aiConfig,
        playerName: nickname.trim(),
        playerId
      }
    });
  };

  return (
    <div className="lobby">
      {/* 重連中覆蓋層 */}
      {isReconnecting && (
        <div className="modal-overlay">
          <div className="modal reconnecting-modal">
            <div className="reconnecting-spinner"></div>
            <p>{t('lobby.reconnecting')}</p>
          </div>
        </div>
      )}

      {/* 側邊欄 */}
      <aside className="lobby-sidebar">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined">eco</span>
        </div>
        <h1 className="sidebar-title">{t('lobby.title')}</h1>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeNav === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveNav('rooms')}
            title={t('lobby.nav.rooms')}
          >
            <span className="material-symbols-outlined">meeting_room</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
            title={t('lobby.nav.profile')}
          >
            <span className="material-symbols-outlined">person</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeNav === 'friends' ? 'active' : ''}`}
            onClick={() => navigate('/friends')}
            title={t('lobby.nav.friends')}
          >
            <span className="material-symbols-outlined">group</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeNav === 'ranks' ? 'active' : ''}`}
            onClick={() => navigate('/leaderboard')}
            title={t('lobby.nav.leaderboard')}
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
            {user?.photoURL ? (
              <img
                className="lobby-avatar-img"
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="lobby-avatar">
                {getInitial(displayName)}
              </div>
            )}
            <p className="lobby-user-name">{displayName}</p>
          </div>
{!isConnected && (
            <span className="connection-status disconnected">
              {t('lobby.connectionStatus.disconnected')}
            </span>
          )}
        </header>

        {/* 主內容 */}
        <main className="lobby-content">
          {/* 遊戲暱稱輸入 */}
          <div className="nickname-section">
            <label className="nickname-label" htmlFor="nickname">{t('lobby.nicknameLabel')}</label>
            <input
              id="nickname"
              className="nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder={t('lobby.nicknamePlaceholder')}
              maxLength={12}
              disabled={isLoading}
            />
            {nickname && getNickname() && nickname === getNickname() && (
              <span className="welcome-message">{t('lobby.welcomeBack', { nickname })}</span>
            )}
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {/* 工單 0276：返回遊戲選擇頁面 */}
          <button
            className="back-to-selection-btn"
            onClick={() => navigate('/')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {t('lobby.backToSelection')}
          </button>

          {/* 創建房間按鈕 */}
          <button
            className="create-room-btn"
            onClick={() => {
              setCreateRoomError('');
              setShowCreateModal(true);
            }}
            disabled={!isConnected || isLoading}
          >
            <span className="material-symbols-outlined">add_circle</span>
            {t('lobby.createNewRoom')}
          </button>

          {/* 加入房間區域 */}
          <div className="join-room-section">
            <input
              className="join-room-input"
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder={t('lobby.joinRoomPlaceholder')}
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
              {t('lobby.joinBtn')}
            </button>
          </div>

          {/* 房間列表表格 */}
          {/* 工單 0276：只顯示本草房間 */}
          <div className="room-table-container">
            {rooms.filter(room => !room.gameType || room.gameType === 'herbalism').length === 0 ? (
              <div className="no-rooms">
                <span className="material-symbols-outlined">meeting_room</span>
                {t('lobby.noRooms')}
              </div>
            ) : (
              <table className="room-table">
                <thead>
                  <tr>
                    <th>{t('lobby.table.roomName')}</th>
                    <th>ID</th>
                    <th>{t('lobby.table.players')}</th>
                    <th>{t('lobby.table.status')}</th>
                    <th>{t('lobby.table.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 工單 0276：只顯示本草房間 */}
                  {rooms.filter(room => !room.gameType || room.gameType === 'herbalism').map((room) => (
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
                          {canJoinRoom(room) ? t('lobby.roomStatus.waiting') : t('lobby.roomStatus.full')}
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
                          {canJoinRoom(room) ? t('lobby.joinBtn') : t('lobby.roomStatus.full')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 工單 202601260048：單人模式區 */}
          <div className="single-player-section">
            <button
              className="single-player-btn"
              onClick={handleOpenAIModal}
            >
              <span className="material-symbols-outlined">smart_toy</span>
              {t('lobby.singlePlayer')}
            </button>
          </div>
        </main>
      </div>

      {/* 手機版底部導航 */}
      <nav className="mobile-nav">
        <button
          className={`mobile-nav-item ${activeNav === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveNav('rooms')}
        >
          <span className="material-symbols-outlined">meeting_room</span>
          {t('lobby.nav.lobbyShort')}
        </button>
        <button
          className={`mobile-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <span className="material-symbols-outlined">person</span>
          {t('lobby.nav.profileShort')}
        </button>
        <button
          className={`mobile-nav-item ${activeNav === 'friends' ? 'active' : ''}`}
          onClick={() => navigate('/friends')}
        >
          <span className="material-symbols-outlined">group</span>
          {t('lobby.nav.friends')}
        </button>
        <button
          className={`mobile-nav-item ${activeNav === 'ranks' ? 'active' : ''}`}
          onClick={() => navigate('/leaderboard')}
        >
          <span className="material-symbols-outlined">leaderboard</span>
          {t('lobby.nav.leaderboardShort')}
        </button>
      </nav>

      {/* 創建房間 Modal（工單 0128 重新設計）*/}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-room-modal" onClick={e => e.stopPropagation()}>
            {/* 裝飾圖示 */}
            <span className="material-symbols-outlined crm-decor-top">eco</span>
            <span className="material-symbols-outlined crm-decor-bottom">psychiatry</span>

            {/* 頂部區域 */}
            <div className="crm-header">
              <span className="material-symbols-outlined crm-header-icon">add_circle</span>
              <h2 className="crm-title">{t('lobby.modal.createRoom.title')}</h2>
              <p className="crm-subtitle">{t('lobby.modal.createRoom.subtitle')}</p>
            </div>

            {/* 表單區域 */}
            <div className="crm-form">
              {/* 玩家數量 */}
              <div className="crm-input-group">
                <label htmlFor="createPlayerCount">{t('lobby.form.playerCount')}</label>
                <select
                  id="createPlayerCount"
                  className="crm-select"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
                  disabled={isLoading}
                >
                  <option value={3}>{t('lobby.form.3players')}</option>
                  <option value={4}>{t('lobby.form.4players')}</option>
                </select>
              </div>

              {/* 設為私人房間 */}
              <div className="crm-checkbox-row">
                <div className="crm-checkbox-left">
                  <input
                    type="checkbox"
                    id="privateToggle"
                    className="crm-checkbox"
                    checked={isPrivate}
                    onChange={(e) => {
                      setIsPrivate(e.target.checked);
                      if (!e.target.checked) {
                        setRoomPassword('');
                      }
                    }}
                    disabled={isLoading}
                  />
                  <label htmlFor="privateToggle" className="crm-checkbox-label">{t('lobby.form.privateRoom')}</label>
                </div>
                <span className="material-symbols-outlined crm-checkbox-icon">lock</span>
              </div>

              {/* 房間密碼（條件顯示）*/}
              {isPrivate && (
                <div className="crm-password-group">
                  <label htmlFor="createRoomPassword">{t('lobby.form.password')}</label>
                  <div className="crm-password-wrapper">
                    <input
                      id="createRoomPassword"
                      type="password"
                      className="crm-password-input"
                      value={roomPassword}
                      onChange={(e) => {
                        setRoomPassword(e.target.value);
                        setCreateRoomError('');
                      }}
                      placeholder={t('lobby.form.passwordPlaceholder')}
                      maxLength={16}
                      disabled={isLoading}
                    />
                    <span className="material-symbols-outlined crm-password-icon">key</span>
                  </div>
                </div>
              )}

              {/* 錯誤訊息 */}
              {createRoomError && (
                <div className="crm-error" role="alert">
                  {createRoomError}
                </div>
              )}
            </div>

            {/* 按鈕區域 */}
            <div className="crm-actions">
              <button
                type="button"
                className="crm-btn crm-btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-confirm"
                onClick={handleCreateRoom}
                disabled={isLoading || !isConnected}
              >
                <span className="material-symbols-outlined">done_all</span>
                {isLoading ? t('lobby.modal.creating') : t('lobby.modal.createBtn')}
              </button>
            </div>

            {/* 底部金色橫條 */}
            <div className="crm-bottom-accent"></div>
          </div>
        </div>
      )}

      {/* 密碼輸入 Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal password-modal">
            <h3>
              <span className="material-symbols-outlined">lock</span>
              {t('lobby.modal.privateRoom')}
            </h3>
            <p>{t('lobby.modal.passwordRequired', { roomName: pendingRoomName })}</p>

            <div className="input-group">
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder={t('lobby.modal.passwordPlaceholder')}
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
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePasswordSubmit}
                disabled={isLoading}
              >
                {isLoading ? t('lobby.modal.joining') : t('lobby.joinBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 工單 202601260048：AI 設定 Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="modal ai-modal">
            <h3>{t('lobby.modal.singlePlayer.title')}</h3>
            <p className="modal-description">
              {t('lobby.modal.singlePlayer.desc')}
            </p>

            <AIPlayerSelector onConfigChange={handleAIConfigChange} />

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCloseAIModal}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartSinglePlayer}
              >
                {t('lobby.modal.startGame')}
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
