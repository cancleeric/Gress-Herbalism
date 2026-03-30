/**
 * 演化論遊戲大廳頁面
 *
 * @module EvolutionLobbyPage
 * @description 演化論遊戲專用的大廳，包含房間列表和創建功能
 * 工單 0276 - UI 與本草大廳相同
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../firebase/AuthContext';
import {
  initSocket,
  onConnectionChange,
  evoCreateRoom,
  evoJoinRoom,
  evoRequestRoomList,
  onEvoRoomCreated,
  onEvoJoinedRoom,
  onEvoRoomListUpdated,
  onEvoError
} from '../../../services/socketService';
import {
  saveNickname,
  getNickname
} from '../../../utils/common/localStorage';
import { getPlayerNameError } from '../../../utils/common/validation';
import {
  AI_DIFFICULTY,
  ALL_AI_DIFFICULTIES,
  getAIDifficultyDescription
} from '../../../shared/constants';
import VersionInfo from '../VersionInfo';
import '../Lobby/Lobby.css';
import './EvolutionLobbyPage.css';

/**
 * 演化論大廳頁面組件
 */
function EvolutionLobbyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayName = user?.isAnonymous ? '訪客' : (user?.displayName || '訪客');

  // 狀態
  const [nickname, setNickname] = useState('');
  const [rooms, setRooms] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [createRoomError, setCreateRoomError] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [playerId] = useState(`player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

  // 當前導航
  const [activeNav, setActiveNav] = useState('rooms');

  // 單人模式（vs AI）狀態
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiConfig, setAIConfig] = useState({ aiCount: 1, difficulties: [AI_DIFFICULTY.MEDIUM] });

  // 載入暱稱
  useEffect(() => {
    const saved = getNickname();
    if (saved) setNickname(saved);
  }, []);

  // Socket 連線
  useEffect(() => {
    initSocket();

    const unsubConnect = onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setError('與伺服器斷線，請確認後端是否啟動');
      } else {
        setError('');
        // 連線後請求房間列表
        evoRequestRoomList();
      }
    });

    // 監聽房間列表更新
    const unsubRoomList = onEvoRoomListUpdated((roomList) => {
      console.log('[EvoLobby] 房間列表更新:', roomList);
      setRooms(roomList);
    });

    // 監聽房間創建成功
    // 工單 0281：傳遞房間資料和創建者標記
    const unsubCreated = onEvoRoomCreated((room) => {
      console.log('[EvoLobby] 房間創建成功:', room);
      setIsLoading(false);
      setShowCreateModal(false);
      navigate(`/game/evolution/${room.id}`, {
        state: { room, isCreator: true }
      });
    });

    // 監聽加入房間成功
    // 工單 0281：傳遞房間資料
    const unsubJoined = onEvoJoinedRoom(({ roomId, room }) => {
      console.log('[EvoLobby] 加入房間成功:', roomId);
      setIsLoading(false);
      navigate(`/game/evolution/${roomId}`, {
        state: { room, isCreator: false }
      });
    });

    // 監聽錯誤
    const unsubError = onEvoError(({ message }) => {
      console.error('[EvoLobby] 錯誤:', message);
      setError(message);
      setIsLoading(false);
    });

    // 請求房間列表
    evoRequestRoomList();

    return () => {
      unsubConnect();
      unsubRoomList();
      unsubCreated();
      unsubJoined();
      unsubError();
    };
  }, [navigate]);

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
   * 創建房間
   * 工單 0276：添加調試日誌
   */
  const handleCreateRoom = () => {
    console.log('[EvoLobby] handleCreateRoom 開始');
    console.log('[EvoLobby] isConnected:', isConnected);
    console.log('[EvoLobby] nickname:', nickname);
    console.log('[EvoLobby] playerCount:', playerCount);

    if (!validateNicknameInput()) {
      console.log('[EvoLobby] 暱稱驗證失敗');
      return;
    }
    if (!isConnected) {
      console.log('[EvoLobby] 未連線到伺服器');
      setError('尚未連線到伺服器');
      return;
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

    console.log('[EvoLobby] 準備創建房間，player:', player);
    evoCreateRoom(`${nickname.trim()}的房間`, playerCount, player);
    console.log('[EvoLobby] evoCreateRoom 已呼叫');
  };

  /**
   * 加入房間
   */
  const handleJoinRoom = (roomId) => {
    if (!validateNicknameInput()) return;
    if (!isConnected) {
      setError('尚未連線到伺服器');
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

    evoJoinRoom(roomId, player);
  };

  /**
   * 用 Room ID 加入房間
   */
  const handleJoinByRoomId = () => {
    if (!joinRoomId.trim()) {
      setError('請輸入房間 ID');
      return;
    }
    handleJoinRoom(joinRoomId.trim());
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
   * 開始單人模式（vs AI）
   */
  const handleStartVsAI = () => {
    if (!nickname.trim()) {
      setError('請輸入遊戲暱稱');
      return;
    }

    saveNickname(nickname.trim());

    const params = new URLSearchParams({
      mode: 'single',
      aiCount: aiConfig.aiCount.toString(),
      difficulties: aiConfig.difficulties.join(','),
      playerName: nickname.trim(),
      playerId
    });

    navigate(`/game/evolution/local-game?${params.toString()}`, {
      state: {
        aiConfig,
        playerName: nickname.trim(),
        playerId
      }
    });
  };

  /**
   * 更新 AI 難度設定
   */
  const handleAIDifficultyChange = (index, difficulty) => {
    setAIConfig(prev => {
      const newDifficulties = [...prev.difficulties];
      newDifficulties[index] = difficulty;
      return { ...prev, difficulties: newDifficulties };
    });
  };

  /**
   * 更新 AI 數量
   */
  const handleAICountChange = (count) => {
    setAIConfig(prev => {
      const newDiffs = [...prev.difficulties];
      while (newDiffs.length < count) newDiffs.push(AI_DIFFICULTY.MEDIUM);
      newDiffs.length = count;
      return { aiCount: count, difficulties: newDiffs };
    });
  };

  return (
    <div className="lobby evolution-theme">
      {/* 側邊欄 */}
      <aside className="lobby-sidebar">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined">genetics</span>
        </div>
        <h1 className="sidebar-title">演化論</h1>

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
          <span className="material-symbols-outlined">psychiatry</span>
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

          {/* 返回遊戲選擇頁面 */}
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
                          onClick={() => handleJoinRoom(room.id)}
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

          {/* 單人模式（vs AI）入口 */}
          <div className="single-player-section">
            <button
              className="single-player-btn"
              onClick={() => setShowAIModal(true)}
            >
              <span className="material-symbols-outlined">smart_toy</span>
              單人模式（vs AI）
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
          <div className="create-room-modal" onClick={e => e.stopPropagation()}>
            {/* 裝飾圖示 */}
            <span className="material-symbols-outlined crm-decor-top">genetics</span>
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
                  <option value={2}>2人</option>
                  <option value={3}>3人</option>
                  <option value={4}>4人</option>
                </select>
              </div>

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

      {/* 單人模式（vs AI）設定 Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="modal ai-modal">
            <h3>演化論單人模式</h3>
            <p className="modal-description">選擇 AI 對手數量和難度，與電腦對戰</p>

            <div className="ai-count-section">
              <label>AI 對手數量</label>
              <select
                className="ai-count-select"
                value={aiConfig.aiCount}
                onChange={(e) => handleAICountChange(parseInt(e.target.value, 10))}
              >
                <option value={1}>1 個 AI（2 人遊戲）</option>
                <option value={2}>2 個 AI（3 人遊戲）</option>
                <option value={3}>3 個 AI（4 人遊戲）</option>
              </select>
            </div>

            <div className="ai-difficulty-section">
              <h4>各 AI 難度設定</h4>
              {aiConfig.difficulties.map((diff, idx) => (
                <div key={idx} className="ai-difficulty-row">
                  <span className="ai-name">AI {idx + 1}</span>
                  <select
                    className="difficulty-select"
                    value={diff}
                    onChange={(e) => handleAIDifficultyChange(idx, e.target.value)}
                  >
                    {ALL_AI_DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d === AI_DIFFICULTY.EASY ? '簡單' :
                         d === AI_DIFFICULTY.MEDIUM ? '中等' : '困難'}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="difficulty-info">
              <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                {getAIDifficultyDescription(aiConfig.difficulties[0])}
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAIModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleStartVsAI}>
                開始遊戲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 版本資訊 */}
      <VersionInfo showFull />
    </div>
  );
}

export default EvolutionLobbyPage;
