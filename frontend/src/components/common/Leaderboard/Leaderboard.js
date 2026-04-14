/**
 * 排行榜頁面
 * 工單 0060, 0141
 * 中國風草藥主題設計
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard, getPlayerEloHistory } from '../../../services/apiService';
import { useAuth } from '../../../firebase/AuthContext';
import './Leaderboard.css';

function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('elo_rating');
  const [rankingType, setRankingType] = useState('global');
  const [eloHistory, setEloHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getLeaderboard(sortBy, 100, rankingType);
      if (result.success) {
        setLeaderboard(result.data);
      }
    } catch (err) {
      setError('載入排行榜失敗');
      console.error('載入排行榜失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, rankingType]);

  const loadMyEloHistory = useCallback(async (uid) => {
    try {
      const result = await getPlayerEloHistory(uid, 20);
      if (result.success) {
        setEloHistory(result.data || []);
      }
    } catch (err) {
      setEloHistory([]);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!user?.uid) return;
    loadMyEloHistory(user.uid);
  }, [user?.uid, loadMyEloHistory]);

  const handleBack = () => {
    // 返回上一頁（可能是本草大廳或演化論大廳）
    navigate(-1);
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

  const myRank = leaderboard.find(player => player.firebase_uid && player.firebase_uid === user?.uid) || null;
  const chartPoints = [...eloHistory]
    .reverse()
    .map((item, index, arr) => {
      const width = 240;
      const height = 70;
      const min = Math.min(...arr.map(x => x.elo_after));
      const max = Math.max(...arr.map(x => x.elo_after));
      const x = arr.length <= 1 ? 0 : (index / (arr.length - 1)) * width;
      const y = max === min ? height / 2 : ((max - item.elo_after) / (max - min)) * height;
      return `${x},${y}`;
    })
    .join(' ');

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
                className={`sort-tab ${rankingType === 'global' ? 'active' : ''}`}
                onClick={() => {
                  setRankingType('global');
                  setSortBy('elo_rating');
                }}
              >
                全球排名
              </button>
              <button
                className={`sort-tab ${rankingType === 'season' ? 'active' : ''}`}
                onClick={() => {
                  setRankingType('season');
                  setSortBy('season_current_elo');
                }}
              >
                賽季排名
              </button>
            </div>

            <div className="sort-tabs">
              <button
                className={`sort-tab ${sortBy === (rankingType === 'season' ? 'season_current_elo' : 'elo_rating') ? 'active' : ''}`}
                onClick={() => setSortBy(rankingType === 'season' ? 'season_current_elo' : 'elo_rating')}
              >
                ELO
              </button>
              <button
                className={`sort-tab ${sortBy === (rankingType === 'season' ? 'season_games_won' : 'games_won') ? 'active' : ''}`}
                onClick={() => setSortBy(rankingType === 'season' ? 'season_games_won' : 'games_won')}
              >
                勝場
              </button>
              <button
                className={`sort-tab ${sortBy === (rankingType === 'season' ? 'season_peak_elo' : 'total_score') ? 'active' : ''}`}
                onClick={() => setSortBy(rankingType === 'season' ? 'season_peak_elo' : 'total_score')}
              >
                {rankingType === 'season' ? '賽季峰值' : '總得分'}
              </button>
            </div>

            {myRank && (
              <div className="leaderboard-my-rank">
                <p>我的排名：#{myRank.rank}（ELO: {rankingType === 'season' ? myRank.season_current_elo : myRank.elo_rating}）</p>
                {eloHistory.length > 1 && (
                  <div className="elo-history-chart">
                    <svg width="240" height="70" viewBox="0 0 240 70" role="img" aria-label="ELO history chart">
                      <polyline
                        points={chartPoints}
                        fill="none"
                        stroke="#2f855a"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )}

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
                      <th className="col-score">ELO</th>
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
                            {rankingType === 'season' && player.rank <= 10 && (
                              <span className="top10-badge">S Top 10</span>
                            )}
                          </div>
                        </td>
                        <td className="col-score">{rankingType === 'season' ? player.season_current_elo : player.elo_rating}</td>
                        <td className="col-games">{rankingType === 'season' ? player.season_games_played : player.games_played}</td>
                        <td className="col-wins">{rankingType === 'season' ? player.season_games_won : player.games_won}</td>
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
