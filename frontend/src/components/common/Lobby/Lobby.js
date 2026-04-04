/**
 * 遊戲大廳組件
 * 重新設計：側邊欄佈局（基於 Google Stitch 設計 - 提示詞 2）
 *
 * @module Lobby
 * @description 顯示遊戲大廳，包含房間列表、創建房間和加入房間功能
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  requestRoomList,
  quickMatch,
  cancelQuickMatch,
  onMatchFound,
  onMatchStatus,
  sendLobbyChatMessage,
  onLobbyChatMessage,
  requestLobbyChatHistory,
  onLobbyChatHistory,
  inviteToRoom,
  onGameInvitationReceived,
  setSocketPlayerId,
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
import { getFriends } from '../../../services/friendService';
import './Lobby.css';

/**
 * 遊戲大廳組件
 *
 * @returns {JSX.Element} 大廳組件
 */
function Lobby() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  // 遊戲大廳改版：快速配對、遊戲類型篩選、聊天室、好友面板
  const [gameTypeFilter, setGameTypeFilter] = useState('herbalism'); // 'all' | 'herbalism' | 'evolution'
  const [matchStatus, setMatchStatus] = useState('idle'); // 'idle' | 'searching'
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [inviteStatus, setInviteStatus] = useState(''); // non-blocking feedback message
  const chatEndRef = useRef(null);

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
          setError('與伺服器斷線，請確認後端是否啟動');
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

      // 記錄房間內其他玩家為最近遊玩
      gameState.players.forEach(p => {
        if (p.id !== playerId) {
          setRecentPlayers(prev => {
            const filtered = prev.filter(rp => rp.name !== p.name);
            return [{ name: p.name, timestamp: Date.now() }, ...filtered].slice(0, 5);
          });
        }
      });

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

  // 載入好友在線狀態
  const loadOnlineFriends = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const friends = await getFriends(user.uid);
      const online = friends.filter(
        ({ friend }) => friend.presence?.status === 'online' || friend.presence?.status === 'in_game'
      );
      setOnlineFriends(online.map(({ friend }) => friend));
    } catch (err) {
      console.error('載入好友狀態失敗:', err);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadOnlineFriends();
    const interval = setInterval(loadOnlineFriends, 30000);
    return () => clearInterval(interval);
  }, [loadOnlineFriends]);

  // 監聽快速配對、聊天室、邀請事件
  useEffect(() => {
    const unsubMatchFound = onMatchFound(({ gameId, gameState: gs }) => {
      setMatchStatus('idle');
      saveCurrentRoom({ roomId: gameId, playerId, playerName: nickname.trim() });
      dispatch(updateGameState({
        gameId,
        players: gs.players,
        maxPlayers: gs.maxPlayers,
        gamePhase: gs.gamePhase,
        currentPlayerId: playerId
      }));
      navigate(`/game/${gameId}`);
    });

    const unsubMatchStatus = onMatchStatus(({ status }) => {
      setMatchStatus(status === 'searching' ? 'searching' : 'idle');
    });

    const unsubChat = onLobbyChatMessage((entry) => {
      setChatMessages(prev => [...prev.slice(-99), entry]);
    });

    const unsubChatHistory = onLobbyChatHistory((history) => {
      setChatMessages(history);
    });

    const unsubInvite = onGameInvitationReceived((invitation) => {
      setPendingInvitations(prev => [...prev, invitation]);
    });

    // 請求聊天歷史
    requestLobbyChatHistory();

    return () => {
      unsubMatchFound();
      unsubMatchStatus();
      unsubChat();
      unsubChatHistory();
      unsubInvite();
    };
  }, [dispatch, navigate, playerId, nickname]);

  // 設定玩家 ID 到 socket（供邀請功能使用）
  useEffect(() => {
    if (isConnected && user?.uid) {
      setSocketPlayerId(user.uid);
    }
  }, [isConnected, user?.uid]);

  // 聊天室自動捲動
  useEffect(() => {
    if (chatEndRef.current && showChatPanel) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatPanel]);

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
      setPasswordError('請輸入密碼');
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
      setError('請輸入遊戲暱稱');
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

  /**
   * 快速配對
   */
  const handleQuickMatch = () => {
    if (!validateNicknameInput()) return;
    if (!isConnected) {
      setError('尚未連線到伺服器');
      return;
    }

    saveNickname(nickname.trim());

    if (matchStatus === 'searching') {
      cancelQuickMatch(playerId, 'herbalism');
      setMatchStatus('idle');
      return;
    }

    const player = {
      id: playerId,
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : (user?.uid || null),
      photoURL: user?.photoURL || null,
    };

    setMatchStatus('searching');
    quickMatch(player, 'herbalism', 3);
  };

  /**
   * 發送聊天訊息
   */
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const senderName = nickname.trim() || displayName || '玩家';
    sendLobbyChatMessage(senderName, chatInput.trim(), 'herbalism');
    setChatInput('');
  };

  /**
   * 邀請好友加入房間
   */
  const handleInviteFriend = (friend) => {
    const currentRoom = getCurrentRoom();
    if (!currentRoom || !currentRoom.roomId) {
      setInviteStatus('請先創建或加入房間才能邀請好友');
      setTimeout(() => setInviteStatus(''), 3000);
      return;
    }

    const fromPlayer = {
      id: user?.uid || playerId,
      name: nickname.trim() || displayName,
    };

    inviteToRoom(fromPlayer, friend.id, currentRoom.roomId, 'herbalism');
    setInviteStatus(`已向 ${friend.display_name} 發送邀請！`);
    setTimeout(() => setInviteStatus(''), 3000);
  };

  /**
   * 接受遊戲邀請
   */
  const handleAcceptInvitation = (invitation) => {
    setPendingInvitations(prev => prev.filter(i => i.id !== invitation.id));

    if (!validateNicknameInput()) return;

    saveNickname(nickname.trim());
    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : (user?.uid || null),
      photoURL: user?.photoURL || null,
    };

    joinRoom(invitation.roomId, player);
  };

  /**
   * 拒絕遊戲邀請
   */
  const handleDeclineInvitation = (invitationId) => {
    setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
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

      {/* 遊戲邀請通知 */}
      {pendingInvitations.map(inv => (
        <div key={inv.id} className="invitation-toast">
          <div className="invitation-info">
            <span className="material-symbols-outlined">mail</span>
            <span><strong>{inv.fromPlayer?.name || '玩家'}</strong> 邀請你加入{inv.gameType === 'evolution' ? '演化論' : '本草'}遊戲！</span>
          </div>
          <div className="invitation-actions">
            <button className="inv-accept-btn" onClick={() => handleAcceptInvitation(inv)}>接受</button>
            <button className="inv-decline-btn" onClick={() => handleDeclineInvitation(inv.id)}>拒絕</button>
          </div>
        </div>
      ))}

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

          {/* 工單 0276：返回遊戲選擇頁面 */}
          <button
            className="back-to-selection-btn"
            onClick={() => navigate('/')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            返回遊戲選擇
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
          {/* 快速配對按鈕 */}
          <button
            className={`quick-match-btn ${matchStatus === 'searching' ? 'searching' : ''}`}
            onClick={handleQuickMatch}
            disabled={!isConnected || isLoading}
          >
            <span className="material-symbols-outlined">
              {matchStatus === 'searching' ? 'hourglass_top' : 'sports_esports'}
            </span>
            {matchStatus === 'searching' ? '配對中…（點擊取消）' : '快速配對'}
          </button>

          {/* 遊戲類型篩選 */}
          <div className="game-type-filter">
            <button
              className={`filter-btn ${gameTypeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setGameTypeFilter('all')}
            >全部</button>
            <button
              className={`filter-btn ${gameTypeFilter === 'herbalism' ? 'active' : ''}`}
              onClick={() => setGameTypeFilter('herbalism')}
            >本草</button>
            <button
              className={`filter-btn ${gameTypeFilter === 'evolution' ? 'active' : ''}`}
              onClick={() => setGameTypeFilter('evolution')}
            >演化論</button>
          </div>

          <div className="room-table-container">
            {(() => {
              const filteredRooms = rooms.filter(room => {
                if (gameTypeFilter === 'all') return true;
                if (gameTypeFilter === 'evolution') return room.gameType === 'evolution';
                return !room.gameType || room.gameType === 'herbalism';
              });
              if (filteredRooms.length === 0) {
                return (
                  <div className="no-rooms">
                    <span className="material-symbols-outlined">meeting_room</span>
                    目前沒有可用的房間，點擊上方按鈕創建新房間
                  </div>
                );
              }
              return (
                <table className="room-table">
                  <thead>
                    <tr>
                      <th>房間名稱</th>
                      <th>類型</th>
                      <th>玩家</th>
                      <th>狀態</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((room) => (
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
                          <span className={`room-game-type ${room.gameType === 'evolution' ? 'evolution' : 'herbalism'}`}>
                            {room.gameType === 'evolution' ? '演化論' : '本草'}
                          </span>
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
                            onClick={() => {
                              if (room.gameType === 'evolution') {
                                navigate(`/lobby/evolution`);
                              } else {
                                handleQuickJoin(room.id, room.isPrivate, room.name);
                              }
                            }}
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
              );
            })()}
          </div>

          {/* 在線好友面板 */}
          {inviteStatus && (
            <div className="invite-status-msg">{inviteStatus}</div>
          )}
          {onlineFriends.length > 0 && (
            <div className="online-friends-panel">
              <h3 className="panel-title">
                <span className="material-symbols-outlined">group</span>
                好友在線 ({onlineFriends.length})
              </h3>
              <div className="online-friends-list">
                {onlineFriends.map(friend => (
                  <div key={friend.id} className="online-friend-item">
                    <div className="friend-avatar-small">
                      {friend.avatar_url
                        ? <img src={friend.avatar_url} alt="" />
                        : <div className="avatar-placeholder-small">{(friend.display_name || '?')[0]}</div>
                      }
                      <span className={`status-dot ${friend.presence?.status === 'in_game' ? 'in-game' : 'online'}`}></span>
                    </div>
                    <span className="online-friend-name">{friend.display_name}</span>
                    <span className="online-friend-status">
                      {friend.presence?.status === 'in_game' ? '遊戲中' : '在線'}
                    </span>
                    <button
                      className="invite-friend-btn"
                      onClick={() => handleInviteFriend(friend)}
                      title="邀請加入房間"
                    >
                      <span className="material-symbols-outlined">person_add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 最近遊玩的玩家 */}
          {recentPlayers.length > 0 && (
            <div className="recent-players-panel">
              <h3 className="panel-title">
                <span className="material-symbols-outlined">history</span>
                最近遊玩
              </h3>
              <div className="recent-players-list">
                {recentPlayers.map((p, idx) => (
                  <div key={idx} className="recent-player-item">
                    <div className="avatar-placeholder-small">{(p.name || '?')[0]}</div>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 工單 202601260048：單人模式區 */}
          <div className="single-player-section">
            <button
              className="single-player-btn"
              onClick={handleOpenAIModal}
            >
              <span className="material-symbols-outlined">smart_toy</span>
              單人模式
            </button>
            <button
              className="chat-toggle-btn"
              onClick={() => setShowChatPanel(prev => !prev)}
            >
              <span className="material-symbols-outlined">chat</span>
              大廳聊天
              {chatMessages.length > 0 && <span className="chat-badge">{chatMessages.length > 99 ? '99+' : chatMessages.length}</span>}
            </button>
          </div>

          {/* 大廳聊天室 */}
          {showChatPanel && (
            <div className="lobby-chat-panel">
              <div className="chat-header">
                <span className="material-symbols-outlined">forum</span>
                大廳聊天
                <button className="chat-close-btn" onClick={() => setShowChatPanel(false)}>✕</button>
              </div>
              <div className="chat-messages">
                {chatMessages.length === 0 && (
                  <div className="chat-empty">暫無訊息，開始聊天吧！</div>
                )}
                {chatMessages.map(msg => (
                  <div key={msg.id} className="chat-message">
                    <span className="chat-name">{msg.playerName}：</span>
                    <span className="chat-text">{msg.message}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-row">
                <input
                  className="chat-input"
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="輸入訊息…"
                  maxLength={200}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || !isConnected}
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          )}
        </main>
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
              <h2 className="crm-title">創建新房間</h2>
              <p className="crm-subtitle">設定房間參數後開始遊戲</p>
            </div>

            {/* 表單區域 */}
            <div className="crm-form">
              {/* 玩家數量 */}
              <div className="crm-input-group">
                <label htmlFor="createPlayerCount">玩家數量</label>
                <select
                  id="createPlayerCount"
                  className="crm-select"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
                  disabled={isLoading}
                >
                  <option value={3}>3人</option>
                  <option value={4}>4人</option>
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
                  <label htmlFor="privateToggle" className="crm-checkbox-label">設為私人房間</label>
                </div>
                <span className="material-symbols-outlined crm-checkbox-icon">lock</span>
              </div>

              {/* 房間密碼（條件顯示）*/}
              {isPrivate && (
                <div className="crm-password-group">
                  <label htmlFor="createRoomPassword">房間密碼</label>
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
                      placeholder="請輸入密碼"
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
                取消
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-confirm"
                onClick={handleCreateRoom}
                disabled={isLoading || !isConnected}
              >
                <span className="material-symbols-outlined">done_all</span>
                {isLoading ? '創建中...' : '創建房間'}
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

      {/* 工單 202601260048：AI 設定 Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="modal ai-modal">
            <h3>單人模式設定</h3>
            <p className="modal-description">
              選擇 AI 對手的數量和難度
            </p>

            <AIPlayerSelector onConfigChange={handleAIConfigChange} />

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCloseAIModal}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartSinglePlayer}
              >
                開始遊戲
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
