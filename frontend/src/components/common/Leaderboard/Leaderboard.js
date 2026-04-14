/**
 * 排行榜頁面
 * 工單 0060, 0141
 * 中國風草藥主題設計
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../firebase';
import { getLeaderboard, getPlayerEloHistory } from '../../../services/apiService';
import './Leaderboard.css';

const INITIAL_ELO_RATING = 1000;

function EloHistoryChart({ data }) {
  if (!data || data.length < 2) {
    return <div className="elo-chart-empty">完成更多對局後會顯示 ELO 走勢</div>;
  }

  const width = 560;
  const height = 180;
  const padding = 24;
  const ratings = data.map((item) => item.new_elo);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const range = Math.max(1, max - min);
  const stepX = (width - padding * 2) / Math.max(1, data.length - 1);

  const points = data.map((item, index) => {
    const x = padding + index * stepX;
    const normalized = (item.new_elo - min) / range;
    const y = height - padding - normalized * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="elo-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="ELO 歷史走勢圖">
      <polyline
        fill="none"
        stroke="#2E7D32"
        strokeWidth="3"
        points={points}
      />
    </svg>
  );
}

function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('elo_rating');
  const [boardType, setBoardType] = useState('global');
  const [meta, setMeta] = useState({});
  const [eloHistory, setEloHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getLeaderboard(sortBy, 100, {
          type: boardType,
          viewerFirebaseUid: user?.uid,
        });
        if (active && result.success) {
          setLeaderboard(result.data);
          setMeta(result.meta || {});
        }
      } catch (err) {
        if (active) {
          setError('載入排行榜失敗');
        }
        console.error('載入排行榜失敗:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [sortBy, boardType, user?.uid]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!user?.uid) {
        setEloHistory([]);
        return;
      }

      try {
        const result = await getPlayerEloHistory(user.uid, 20);
        if (active && result.success) {
          setEloHistory(result.data || []);
        }
      } catch (err) {
        console.error('載入 ELO 歷史失敗:', err);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [user?.uid]);

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

  const leaderboardTitle = useMemo(() => (
    boardType === 'season' ? '賽季排行榜' : '全球排行榜'
  ), [boardType]);

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
            <h1 className="leaderboard-title">{leaderboardTitle}</h1>

            <div className="leaderboard-type-tabs">
              <button
                className={`sort-tab ${boardType === 'global' ? 'active' : ''}`}
                onClick={() => setBoardType('global')}
              >
                全球
              </button>
              <button
                className={`sort-tab ${boardType === 'season' ? 'active' : ''}`}
                onClick={() => setBoardType('season')}
              >
                賽季
              </button>
            </div>

            {/* 排序選項 */}
            <div className="sort-tabs">
              <button
                className={`sort-tab ${sortBy === 'elo_rating' ? 'active' : ''}`}
                onClick={() => setSortBy('elo_rating')}
              >
                ELO
              </button>
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

            {meta?.season?.season_name && (
              <div className="season-info">目前賽季：{meta.season.season_name}</div>
            )}

            {meta?.viewer && (
              <div className="my-rank-card">
                我的排名 #{meta.viewer.rank} · ELO {meta.viewer.eloRating}
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
                        <th className="col-elo">ELO</th>
                        <th className="col-games">場數</th>
                        <th className="col-wins">勝場</th>
                        <th className="col-losses">敗場</th>
                        <th className="col-rate">勝率</th>
                        {boardType === 'season' ? <th className="col-score">賽季峰值</th> : <th className="col-score">總分</th>}
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
                        <td className="col-elo">{player.elo_rating || INITIAL_ELO_RATING}</td>
                        <td className="col-games">{player.games_played}</td>
                        <td className="col-wins">{player.games_won}</td>
                        <td className="col-losses">{player.losses}</td>
                        <td className="col-rate">{player.win_rate}%</td>
                        {boardType === 'season'
                          ? <td className="col-score">{player.season_peak_elo || player.elo_rating || INITIAL_ELO_RATING}</td>
                          : <td className="col-score">{player.total_score}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="elo-history-card">
              <h2 className="elo-history-title">我的 ELO 歷史</h2>
              <EloHistoryChart data={eloHistory} />
              {eloHistory.length > 0 && (
                <div className="elo-latest-change">
                  最新變化：{eloHistory[eloHistory.length - 1].elo_change > 0 ? '+' : ''}
                  {eloHistory[eloHistory.length - 1].elo_change}
                </div>
              )}
            </div>
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
