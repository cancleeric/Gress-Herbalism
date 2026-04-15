/**
 * 全球排行榜頁面（ELO + 賽季）
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../firebase';
import { getEloLeaderboard, getPlayerEloHistory } from '../../../services/apiService';
import './Leaderboard.css';

const SCOPE = {
  GLOBAL: 'global',
  SEASON: 'season',
};

function EloTrendChart({ points }) {
  const safeValues = (points || [])
    .map((p) => p.elo_after)
    .filter((value) => Number.isFinite(value));

  if (safeValues.length < 2) {
    return <p className="elo-trend-empty">暫無足夠資料繪製曲線</p>;
  }

  const width = 420;
  const height = 120;
  const padding = 12;
  const values = safeValues;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const stepX = (width - padding * 2) / Math.max(1, values.length - 1);

  const polylinePoints = values
    .map((value, index) => {
      const x = padding + stepX * index;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="elo-trend-chart" role="img" aria-label="ELO 趨勢圖">
      <polyline points={polylinePoints} fill="none" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scope, setScope] = useState(SCOPE.GLOBAL);
  const [leaderboard, setLeaderboard] = useState([]);
  const [season, setSeason] = useState(null);
  const [eloHistory, setEloHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getEloLeaderboard({ scope, limit: 100 });
        if (!active) return;
        setLeaderboard(result?.data || []);
        setSeason(result?.season || null);
      } catch (err) {
        if (!active) return;
        setError('載入排行榜失敗');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [scope]);

  const myEntry = useMemo(
    () => leaderboard.find((player) => player.firebase_uid === user?.uid),
    [leaderboard, user?.uid]
  );

  useEffect(() => {
    let active = true;
    const loadMyHistory = async () => {
      if (!user?.uid) return;
      try {
        const result = await getPlayerEloHistory(user.uid, 50);
        if (!active) return;
        setEloHistory(result?.data || []);
      } catch (err) {
        if (!active) return;
        setEloHistory([]);
      }
    };
    loadMyHistory();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const handleBack = () => navigate(-1);

  const getRankDisplay = (rank) => {
    if (rank === 1) return <span className="rank-medal gold">🥇</span>;
    if (rank === 2) return <span className="rank-medal silver">🥈</span>;
    if (rank === 3) return <span className="rank-medal bronze">🥉</span>;
    return <span className="rank-number">{rank}</span>;
  };

  return (
    <div className="leaderboard-page">
      <div className="bg-decoration bg-decoration-top"></div>
      <div className="bg-decoration bg-decoration-bottom"></div>

      <div className="leaderboard-layout">
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
            <h1 className="leaderboard-title">全球排行榜（ELO）</h1>
            {season && (
              <p className="leaderboard-season-label">
                當前賽季：{season.name || `Season ${season.id}`}
              </p>
            )}

            <div className="sort-tabs">
              <button className={`sort-tab ${scope === SCOPE.GLOBAL ? 'active' : ''}`} onClick={() => setScope(SCOPE.GLOBAL)}>
                全球排行
              </button>
              <button className={`sort-tab ${scope === SCOPE.SEASON ? 'active' : ''}`} onClick={() => setScope(SCOPE.SEASON)}>
                賽季排行
              </button>
            </div>

            {myEntry && (
              <div className="leaderboard-my-rank">
                我的排名：<strong>#{myEntry.rank}</strong>（ELO {myEntry.elo_rating || 0}）
              </div>
            )}

            {error && <div className="leaderboard-error">{error}</div>}

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
                      <th className="col-wins">勝</th>
                      <th className="col-losses">負</th>
                      <th className="col-games">場數</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player) => {
                      const losses = Math.max(0, (player.games_played || 0) - (player.games_won || 0));
                      return (
                        <tr key={player.id} className={player.rank <= 3 ? 'top-rank' : ''}>
                          <td className="col-rank">{getRankDisplay(player.rank)}</td>
                          <td className="col-player">
                            <div className="player-cell">
                              {player.avatar_url ? (
                                <img src={player.avatar_url} alt="" className="mini-avatar" />
                              ) : (
                                <div className="mini-avatar-placeholder">{(player.display_name || '?')[0]}</div>
                              )}
                              <span className="player-name">{player.display_name}</span>
                              {scope === SCOPE.SEASON && player.rank <= 10 && (
                                <span className="season-badge">Top 10</span>
                              )}
                            </div>
                          </td>
                          <td className="col-elo">{player.elo_rating || 0}</td>
                          <td className="col-wins">{player.games_won || 0}</td>
                          <td className="col-losses">{losses}</td>
                          <td className="col-games">{player.games_played || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="leaderboard-history">
              <h2 className="leaderboard-history-title">我的 ELO 變化</h2>
              <EloTrendChart points={eloHistory} />
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
