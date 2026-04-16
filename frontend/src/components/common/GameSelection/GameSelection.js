/**
 * 遊戲選擇頁面
 *
 * @module GameSelection
 * @description 登入後的遊戲選擇頁面
 * 工單 0276
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../firebase/AuthContext';
import './GameSelection.css';

/**
 * 遊戲選擇頁面組件
 */
function GameSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.isAnonymous ? '訪客' : (user?.displayName || user?.email?.split('@')[0] || '訪客');

  /**
   * 處理遊戲選擇
   */
  const handleSelectGame = (gameType) => {
    if (gameType === 'herbalism') {
      navigate('/lobby/herbalism');
    } else if (gameType === 'evolution') {
      navigate('/lobby/evolution');
    }
  };

  /**
   * 處理登出
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  return (
    <div className="game-selection">
      {/* 頂部欄 */}
      <header className="gs-header">
        <div className="gs-user-info">
          {user?.photoURL ? (
            <img
              className="gs-avatar"
              src={user.photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="gs-avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="gs-username">{displayName}</span>
        </div>
        <button className="gs-logout-btn" onClick={handleLogout}>
          登出
        </button>
      </header>

      {/* 主內容 */}
      <main className="gs-main">
        <h1 className="gs-title">選擇遊戲</h1>
        <p className="gs-subtitle">請選擇您想要遊玩的遊戲</p>

        <div className="gs-games">
          {/* 本草 */}
          <div
            className="gs-game-card herbalism"
            onClick={() => handleSelectGame('herbalism')}
          >
            <div className="gs-game-icon">🌿</div>
            <h2 className="gs-game-title">本草</h2>
            <p className="gs-game-desc">
              3-4 人推理桌遊
              <br />
              透過問牌和推理猜測蓋牌顏色
            </p>
            <div className="gs-game-info">
              <span>3-4 人</span>
              <span>15-30 分鐘</span>
            </div>
          </div>

          {/* 演化論 */}
          <div
            className="gs-game-card evolution"
            onClick={() => handleSelectGame('evolution')}
          >
            <div className="gs-game-icon">🦎</div>
            <h2 className="gs-game-title">演化論</h2>
            <p className="gs-game-desc">
              2-4 人策略卡牌遊戲
              <br />
              創造生物並讓牠們在競爭中存活
            </p>
            <div className="gs-game-info">
              <span>2-4 人</span>
              <span>30-60 分鐘</span>
            </div>
          </div>
        </div>

        {/* 底部導航 */}
        <div className="gs-nav">
          <button
            className="gs-nav-btn"
            onClick={() => navigate('/profile')}
          >
            <span className="material-symbols-outlined">person</span>
            個人資料
          </button>
          <button
            className="gs-nav-btn"
            onClick={() => navigate('/friends')}
          >
            <span className="material-symbols-outlined">group</span>
            好友
          </button>
          <button
            className="gs-nav-btn"
            onClick={() => navigate('/leaderboard')}
          >
            <span className="material-symbols-outlined">leaderboard</span>
            排行榜
          </button>
          <button
            className="gs-nav-btn"
            onClick={() => navigate('/herbarium')}
          >
            <span className="material-symbols-outlined">local_florist</span>
            本草百科
          </button>
        </div>
      </main>
    </div>
  );
}

export default GameSelection;
