/**
 * 排行榜頁面
 * 工單 0060, 0141
 * 中國風草藥主題設計
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../../services/apiService';
import './Leaderboard.css';

function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('games_won');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getLeaderboard(sortBy, 20);
      if (result.success) {
        setLeaderboard(result.data);
      }
    } catch (err) {
      setError('載入排行榜失敗');
      console.error('載入排行榜失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const getRankDisplay = (rank) => {
    switch (rank) {
      case 1:
        return <span className="rank-medal gold">🥇</span>;
      case 2:
        return <span className="rank-medal silver">🥈</span>;
      case 3:
        return <span className="rank-medal bronze">🥉</span>;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  return (
    <div className="leaderboard-page">
      {/* Background Decorations */}
      <div className="bg-decoration bg-decoration-top"></div>
      <div className="bg-decoration bg-decoration-bottom"></div>

      <div className="leaderboard-layout">
        {/* 導航欄 */}
        <header className="leaderboard-nav">
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

        <main className="leaderboard-main">
          <div className="leaderboard-card">
            <h1 className="leaderboard-title">排行榜</h1>

            {/* 排序選項 */}
            <div className="sort-tabs">
              <button
                className={`sort-tab ${sortBy === 'games_won' ? 'active' : ''}`}
                onClick={() => setSortBy('games_won')}
              >
                勝場數
              </button>
              <button
                className={`sort-tab ${sortBy === 'win_rate' ? 'active' : ''}`}
                onClick={() => setSortBy('win_rate')}
              >
                勝率
              </button>
              <button
                className={`sort-tab ${sortBy === 'total_score' ? 'active' : ''}`}
                onClick={() => setSortBy('total_score')}
              >
                總得分
              </button>
            </div>

            {error && <div className="leaderboard-error">{error}</div>}

            {/* 排行榜列表 */}
            {loading ? (
              <div className="leaderboard-loading">載入中...</div>
            ) : leaderboard.length === 0 ? (
              <div className="leaderboard-empty">
                <p>暫無排行資料</p>
                <p className="hint">完成遊戲後就會出現在排行榜上</p>
              </div>
            ) : (
              <div className="leaderboard-table-wrapper">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th className="col-rank">排名</th>
                      <th className="col-player">玩家</th>
                      <th className="col-games">場數</th>
                      <th className="col-wins">勝場</th>
                      <th className="col-rate">勝率</th>
                      <th className="col-score">總分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player) => (
                      <tr key={player.id} className={player.rank <= 3 ? 'top-rank' : ''}>
                        <td className="col-rank">{getRankDisplay(player.rank)}</td>
                        <td className="col-player">
                          <div className="player-cell">
                            {player.avatar_url ? (
                              <img
                                src={player.avatar_url}
                                alt=""
                                className="mini-avatar"
                              />
                            ) : (
                              <div className="mini-avatar-placeholder">
                                {(player.display_name || '?')[0]}
                              </div>
                            )}
                            <span className="player-name">{player.display_name}</span>
                          </div>
                        </td>
                        <td className="col-games">{player.games_played}</td>
                        <td className="col-wins">{player.games_won}</td>
                        <td className="col-rate">{player.win_rate}%</td>
                        <td className="col-score">{player.total_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        <footer className="leaderboard-footer">
          <p>© 2024 本草 Herbalism Online. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default Leaderboard;
