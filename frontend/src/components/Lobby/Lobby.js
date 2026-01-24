/**
 * 遊戲大廳組件
 *
 * @module Lobby
 * @description 顯示遊戲大廳，包含房間列表、創建房間和加入房間功能
 */

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  joinGame,
  updateGameState
} from '../../store/gameStore';
import {
  initSocket,
  onRoomList,
  onRoomCreated,
  onJoinedRoom,
  onError,
  onConnectionChange,
  createRoom,
  joinRoom
} from '../../services/socketService';
import { MIN_PLAYERS, MAX_PLAYERS } from '../../shared/constants';
import { savePlayerName, getPlayerName } from '../../utils/localStorage';
import { getPlayerNameError } from '../../utils/validation';
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
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [playerId] = useState(`player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

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

    const unsubJoined = onJoinedRoom(({ gameId, gameState }) => {
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

    return () => {
      unsubConnect();
      unsubRooms();
      unsubError();
      unsubCreated();
      unsubJoined();
    };
  }, [dispatch, navigate, playerId]);

  /**
   * 處理玩家名稱變更
   */
  const handlePlayerNameChange = (e) => {
    setPlayerName(e.target.value);
    setError('');
  };

  /**
   * 處理玩家數量變更
   */
  const handlePlayerCountChange = (e) => {
    setPlayerCount(parseInt(e.target.value, 10));
    setError('');
  };

  /**
   * 處理房間ID變更
   */
  const handleRoomIdChange = (e) => {
    setRoomId(e.target.value);
    setError('');
  };

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

    // 儲存暱稱到 localStorage
    savePlayerName(playerName.trim());

    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: playerName.trim()
    };

    createRoom(player, playerCount);
  };

  /**
   * 加入現有房間
   */
  const handleJoinRoom = () => {
    if (!validatePlayerNameInput()) return;
    if (!isConnected) {
      setError('尚未連線到伺服器');
      return;
    }
    if (!roomId.trim()) {
      setError('請輸入房間ID');
      return;
    }

    // 儲存暱稱到 localStorage
    savePlayerName(playerName.trim());

    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: playerName.trim()
    };

    joinRoom(roomId.trim(), player);
  };

  /**
   * 快速加入房間（從列表點擊）
   */
  const handleQuickJoin = (selectedRoomId) => {
    if (!validatePlayerNameInput()) return;
    if (!isConnected) {
      setError('尚未連線到伺服器');
      return;
    }

    // 儲存暱稱到 localStorage
    savePlayerName(playerName.trim());

    setIsLoading(true);
    setError('');

    const player = {
      id: playerId,
      name: playerName.trim()
    };

    joinRoom(selectedRoomId, player);
  };

  return (
    <div className="lobby">
      <header className="lobby-header">
        <h1>本草 Herbalism</h1>
        <p className="lobby-subtitle">3-4 人推理卡牌遊戲</p>
        <p className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '已連線' : '未連線'}
        </p>
      </header>

      <main className="lobby-content">
        {/* 玩家資訊區 */}
        <section className="lobby-section player-section">
          <h2>玩家資訊</h2>
          <div className="input-group">
            <label htmlFor="playerName">玩家名稱</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={handlePlayerNameChange}
              placeholder="請輸入您的名稱（2-12 字元）"
              maxLength={12}
              disabled={isLoading}
            />
            {playerName && getPlayerName() && playerName === getPlayerName() && (
              <span className="welcome-message">歡迎回來，{playerName}！</span>
            )}
          </div>
        </section>

        {/* 創建房間區 */}
        <section className="lobby-section create-section">
          <h2>創建房間</h2>
          <div className="input-group">
            <label htmlFor="playerCount">玩家數量</label>
            <select
              id="playerCount"
              value={playerCount}
              onChange={handlePlayerCountChange}
              disabled={isLoading}
            >
              <option value={3}>3 人</option>
              <option value={4}>4 人</option>
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCreateRoom}
            disabled={isLoading || !isConnected}
          >
            {isLoading ? '創建中...' : '創建新房間'}
          </button>
        </section>

        {/* 加入房間區 */}
        <section className="lobby-section join-section">
          <h2>加入房間</h2>
          <div className="input-group">
            <label htmlFor="roomId">房間ID</label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={handleRoomIdChange}
              placeholder="請輸入房間ID"
              disabled={isLoading}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleJoinRoom}
            disabled={isLoading || !isConnected}
          >
            {isLoading ? '加入中...' : '加入房間'}
          </button>
        </section>

        {/* 房間列表區 */}
        <section className="lobby-section rooms-section">
          <h2>可用房間</h2>
          {rooms.length === 0 ? (
            <p className="no-rooms">目前沒有可用的房間</p>
          ) : (
            <ul className="room-list">
              {rooms.map((room) => (
                <li key={room.id} className="room-item">
                  <span className="room-name">{room.name}</span>
                  <span className="room-players">
                    {room.playerCount}/{room.maxPlayers || 4} 玩家
                  </span>
                  <button
                    className="btn btn-small"
                    onClick={() => handleQuickJoin(room.id)}
                    disabled={isLoading || !isConnected}
                  >
                    加入
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 錯誤訊息 */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </main>

      <footer className="lobby-footer">
        <p>遊戲規則：猜測兩張隱藏牌的顏色</p>
      </footer>
    </div>
  );
}

export default Lobby;
