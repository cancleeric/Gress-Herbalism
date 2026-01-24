/**
 * 個人資料頁面
 * 工單 0060
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

  useEffect(() => {
    if (user?.uid) {
      loadData();
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
      }

      if (historyResult.success) {
        setHistory(historyResult.data);
      }
    } catch (err) {
      setError('載入資料失敗');
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

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* 返回按鈕 */}
        <button className="back-btn" onClick={handleBack}>
          ← 返回大廳
        </button>

        {/* 玩家資訊 */}
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

        {error && <div className="profile-error">{error}</div>}

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

        {/* 登出按鈕 */}
        <button className="logout-btn" onClick={handleLogout}>
          登出
        </button>
      </div>
    </div>
  );
}

export default Profile;
