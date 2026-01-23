/**
 * 遊戲大廳組件
 *
 * @module Lobby
 * @description 顯示遊戲大廳，包含房間列表、創建房間和加入房間功能
 */

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createGameAction, joinGame } from '../../store/gameStore';
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
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');

  /**
   * 處理玩家名稱變更
   * @param {React.ChangeEvent<HTMLInputElement>} e - 事件物件
   */
  const handlePlayerNameChange = (e) => {
    setPlayerName(e.target.value);
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
    return true;
  };

  /**
   * 創建新房間
   */
  const handleCreateRoom = () => {
    if (!validatePlayerName()) return;

    const newRoomId = `room_${Date.now()}`;
    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      isHost: true
    };

    dispatch(createGameAction([player]));
    dispatch(joinGame(newRoomId, player));
    navigate(`/game/${newRoomId}`);
  };

  /**
   * 加入現有房間
   */
  const handleJoinRoom = () => {
    if (!validatePlayerName()) return;

    if (!roomId.trim()) {
      setError('請輸入房間ID');
      return;
    }

    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      isHost: false
    };

    dispatch(joinGame(roomId.trim(), player));
    navigate(`/game/${roomId.trim()}`);
  };

  /**
   * 快速加入房間（從列表點擊）
   * @param {string} selectedRoomId - 選擇的房間ID
   */
  const handleQuickJoin = (selectedRoomId) => {
    if (!validatePlayerName()) return;

    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      isHost: false
    };

    dispatch(joinGame(selectedRoomId, player));
    navigate(`/game/${selectedRoomId}`);
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
            />
          </div>
        </section>

        {/* 創建房間區 */}
        <section className="lobby-section create-section">
          <h2>創建房間</h2>
          <button
            className="btn btn-primary"
            onClick={handleCreateRoom}
          >
            創建新房間
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
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleJoinRoom}
          >
            加入房間
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
                    {room.playerCount}/4 玩家
                  </span>
                  <button
                    className="btn btn-small"
                    onClick={() => handleQuickJoin(room.id)}
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
          <div className="error-message">
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
