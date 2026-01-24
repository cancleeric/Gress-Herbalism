/**
 * 排行榜頁面
 * 工單 0060
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
      <div className="leaderboard-container">
        {/* 返回按鈕 */}
        <button className="back-btn" onClick={handleBack}>
          ← 返回大廳
        </button>

        <h1 className="leaderboard-title">🏆 排行榜</h1>

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
    </div>
  );
}

export default Leaderboard;
