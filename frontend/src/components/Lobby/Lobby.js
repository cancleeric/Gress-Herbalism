/**
 * 遊戲大廳組件
 *
 * @module Lobby
 * @description 顯示遊戲大廳，包含房間列表、創建房間和加入房間功能
 */

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  createGameAction,
  joinGame,
  updateGameState
} from '../../store/gameStore';
import {
  createGameRoom,
  getGameState
} from '../../services/gameService';
import { validatePlayerCount } from '../../utils/gameRules';
import { MIN_PLAYERS, MAX_PLAYERS } from '../../shared/constants';
import './Lobby.css';

/**
 * 遊戲大廳組件
 *
 * @returns {JSX.Element} 大廳組件
 */
function Lobby() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const gameState = useSelector((state) => ({
    gameId: state.gameId,
    players: state.players
  }));

  // 本地狀態
  const [playerName, setPlayerName] = useState('');
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS);
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 處理玩家名稱變更
   * @param {React.ChangeEvent<HTMLInputElement>} e - 事件物件
   */
  const handlePlayerNameChange = (e) => {
    setPlayerName(e.target.value);
    setError('');
  };

  /**
   * 處理玩家數量變更
   * @param {React.ChangeEvent<HTMLSelectElement>} e - 事件物件
   */
  const handlePlayerCountChange = (e) => {
    setPlayerCount(parseInt(e.target.value, 10));
    setError('');
  };

  /**
   * 處理房間ID變更
   * @param {React.ChangeEvent<HTMLInputElement>} e - 事件物件
   */
  const handleRoomIdChange = (e) => {
    setRoomId(e.target.value);
    setError('');
  };

  /**
   * 驗證玩家名稱
   * @returns {boolean} 是否有效
   */
  const validatePlayerName = () => {
    if (!playerName.trim()) {
      setError('請輸入玩家名稱');
      return false;
    }
    if (playerName.trim().length > 20) {
      setError('玩家名稱不可超過20個字元');
      return false;
    }
    return true;
  };

  /**
   * 驗證房間ID格式
   * @param {string} id - 房間ID
   * @returns {boolean} 是否有效
   */
  const validateRoomId = (id) => {
    if (!id || !id.trim()) {
      setError('請輸入房間ID');
      return false;
    }
    // 基本格式驗證：只允許英數字和底線
    const validPattern = /^[a-zA-Z0-9_]+$/;
    if (!validPattern.test(id.trim())) {
      setError('房間ID格式不正確，只允許英數字和底線');
      return false;
    }
    return true;
  };

  /**
   * 創建新房間
   * 收集玩家資訊，驗證玩家數量，創建遊戲並導航到遊戲房間
   */
  const handleCreateRoom = () => {
    if (!validatePlayerName()) return;

    // 驗證玩家數量
    if (!validatePlayerCount(playerCount)) {
      setError(`玩家數量必須在 ${MIN_PLAYERS} 到 ${MAX_PLAYERS} 人之間`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 創建房主玩家資訊
      const hostPlayer = {
        id: `player_${Date.now()}`,
        name: playerName.trim(),
        isHost: true,
        isCurrentTurn: false,
        hand: []
      };

      // 使用 gameService 創建遊戲房間
      // 房間創建時只有房主，其他玩家會在加入時添加
      // 遊戲正式開始（發牌）會在所有玩家加入後進行
      const newGame = createGameRoom(hostPlayer, playerCount);

      if (!newGame || !newGame.gameId) {
        setError('創建房間失敗，請重試');
        setIsLoading(false);
        return;
      }

      // 更新 Redux store
      dispatch(createGameAction([hostPlayer]));
      dispatch(joinGame(newGame.gameId, hostPlayer));
      dispatch(updateGameState({
        gameId: newGame.gameId,
        maxPlayers: playerCount,
        gamePhase: 'waiting'
      }));

      // 導航到遊戲房間
      navigate(`/game/${newGame.gameId}`);
    } catch (err) {
      console.error('創建房間錯誤:', err);
      setError('創建房間失敗：' + (err.message || '未知錯誤'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 加入現有房間
   * 驗證房間ID，檢查房間狀態，加入玩家到遊戲
   */
  const handleJoinRoom = () => {
    if (!validatePlayerName()) return;
    if (!validateRoomId(roomId)) return;

    setIsLoading(true);
    setError('');

    try {
      const trimmedRoomId = roomId.trim();

      // 獲取遊戲狀態以驗證房間
      const gameState = getGameState(trimmedRoomId);

      if (!gameState) {
        setError('房間不存在，請確認房間ID是否正確');
        setIsLoading(false);
        return;
      }

      // 檢查房間是否已滿
      const maxPlayers = gameState.maxPlayers || MAX_PLAYERS;
      if (gameState.players && gameState.players.length >= maxPlayers) {
        setError('房間已滿，無法加入');
        setIsLoading(false);
        return;
      }

      // 檢查遊戲是否已開始
      if (gameState.gamePhase !== 'waiting') {
        setError('遊戲已開始，無法加入');
        setIsLoading(false);
        return;
      }

      // 創建新玩家資訊
      const newPlayer = {
        id: `player_${Date.now()}`,
        name: playerName.trim(),
        isHost: false,
        isCurrentTurn: false,
        hand: []
      };

      // 更新 Redux store
      dispatch(joinGame(trimmedRoomId, newPlayer));

      // 導航到遊戲房間
      navigate(`/game/${trimmedRoomId}`);
    } catch (err) {
      console.error('加入房間錯誤:', err);
      setError('加入房間失敗：' + (err.message || '未知錯誤'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 快速加入房間（從列表點擊）
   * @param {string} selectedRoomId - 選擇的房間ID
   */
  const handleQuickJoin = (selectedRoomId) => {
    setRoomId(selectedRoomId);
    // 設定完房間ID後，觸發加入
    if (!validatePlayerName()) return;

    setIsLoading(true);
    setError('');

    try {
      const gameState = getGameState(selectedRoomId);

      if (!gameState) {
        setError('房間不存在');
        setIsLoading(false);
        return;
      }

      const maxPlayers = gameState.maxPlayers || MAX_PLAYERS;
      if (gameState.players && gameState.players.length >= maxPlayers) {
        setError('房間已滿');
        setIsLoading(false);
        return;
      }

      if (gameState.gamePhase !== 'waiting') {
        setError('遊戲已開始');
        setIsLoading(false);
        return;
      }

      const newPlayer = {
        id: `player_${Date.now()}`,
        name: playerName.trim(),
        isHost: false,
        isCurrentTurn: false,
        hand: []
      };

      dispatch(joinGame(selectedRoomId, newPlayer));
      navigate(`/game/${selectedRoomId}`);
    } catch (err) {
      console.error('快速加入房間錯誤:', err);
      setError('加入房間失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lobby">
      <header className="lobby-header">
        <h1>桌遊網頁版</h1>
        <p className="lobby-subtitle">3-4 人推理卡牌遊戲</p>
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
              placeholder="請輸入您的名稱"
              maxLength={20}
              disabled={isLoading}
            />
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
            disabled={isLoading}
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
            disabled={isLoading}
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
                    disabled={isLoading}
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
