/**
 * 個人資料頁面
 * 工單 0060, 0139
 * 中國風草藥主題設計
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase';
import { getPlayerStats, getPlayerHistory } from '../../services/apiService';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 工單 0175：阻止匿名玩家存取 Profile
  const isAnonymous = user?.isAnonymous;

  useEffect(() => {
    if (user?.uid && !isAnonymous) {
      loadData();
    } else if (isAnonymous) {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsResult, historyResult] = await Promise.all([
        getPlayerStats(user.uid),
        getPlayerHistory(user.uid),
      ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        setError(statsResult.message || '載入統計資料失敗');
      }

      if (historyResult.success) {
        setHistory(historyResult.data);
      } else {
        setError(prev => prev || (historyResult.message || '載入歷史資料失敗'));
      }
    } catch (err) {
      setError('載入資料失敗，請稍後再試');
      console.error('載入資料失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">載入中...</div>
      </div>
    );
  }

  // 工單 0175：匿名玩家阻止頁面
  if (isAnonymous) {
    return (
      <div className="profile-page">
        <div className="profile-anonymous">
          <p>請先使用 Google 帳號登入以查看個人資料</p>
          <button className="back-btn" onClick={handleBack}>返回大廳</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Background Decorations */}
      <div className="bg-decoration bg-decoration-top"></div>
      <div className="bg-decoration bg-decoration-bottom"></div>

      <div className="profile-layout">
        {/* 導航欄 */}
        <header className="profile-nav">
          <button className="back-btn" onClick={handleBack}>
            ← 返回大廳
          </button>
          <div className="nav-brand">
            <svg className="nav-icon" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
            </svg>
            <span className="nav-title">Herbalism</span>
          </div>
        </header>

        <main className="profile-main">
          {/* 個人資料卡片 */}
          <div className="profile-card">
            {/* 頭像區域 */}
            <div className="profile-header">
              <div className="avatar-container">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="頭像" className="avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {(user?.displayName || '玩')[0]}
                  </div>
                )}
              </div>
              <div className="user-info">
                <h2>{user?.displayName || '玩家'}</h2>
                <p className="user-email">{user?.email || (user?.isAnonymous ? '訪客帳號' : '')}</p>
              </div>
            </div>

            {/* 工單 0175：錯誤訊息改善 */}
            {error && (
              <div className="profile-error">
                {error}
                <button className="retry-btn" onClick={loadData}>重新載入</button>
              </div>
            )}

            {/* 統計數據 */}
            <div className="stats-section">
              <h3>遊戲統計</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{stats?.games_played || 0}</span>
                  <span className="stat-label">總場數</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats?.games_won || 0}</span>
                  <span className="stat-label">勝利</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats?.win_rate || 0}%</span>
                  <span className="stat-label">勝率</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats?.total_score || 0}</span>
                  <span className="stat-label">總得分</span>
                </div>
                <div className="stat-card highlight">
                  <span className="stat-value">{stats?.highest_score || 0}</span>
                  <span className="stat-label">最高分</span>
                </div>
              </div>
            </div>

            {/* 遊戲歷史 */}
            <div className="history-section">
              <h3>最近遊戲</h3>
              {history.length === 0 ? (
                <p className="no-history">還沒有遊戲記錄</p>
              ) : (
                <ul className="history-list">
                  {history.map((record, index) => (
                    <li key={index} className={`history-item ${record.is_winner ? 'win' : 'lose'}`}>
                      <span className="result-icon">
                        {record.is_winner ? '🏆' : '💔'}
                      </span>
                      <div className="history-info">
                        <span className="score">得分：{record.final_score}</span>
                        <span className="details">
                          {record.game_history?.player_count || '?'} 人遊戲 · {record.game_history?.rounds_played || 1} 局
                        </span>
                      </div>
                      <span className="date">
                        {new Date(record.created_at).toLocaleDateString('zh-TW')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 登出按鈕 */}
          <button className="logout-btn" onClick={handleLogout}>
            登出
          </button>
        </main>

        <footer className="profile-footer">
          <p>© 2024 本草 Herbalism Online. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default Profile;
