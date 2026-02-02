/**
 * 排行榜頁面
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './LeaderboardPage.css';

/**
 * 排行榜類型
 */
const LEADERBOARD_TYPES = {
  ALL: 'all',
  DAILY: 'daily',
  WEEKLY: 'weekly',
};

/**
 * 排名圖示
 */
const RANK_ICONS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

/**
 * 排行榜項目
 */
function LeaderboardItem({ rank, player, isCurrentUser, onClick }) {
  const rankIcon = RANK_ICONS[rank];

  return (
    <div
      className={`leaderboard-item ${isCurrentUser ? 'leaderboard-item--current' : ''}`}
      onClick={() => onClick?.(player)}
      role="button"
      tabIndex={0}
    >
      <span className="leaderboard-item__rank">
        {rankIcon || `#${rank}`}
      </span>
      <span className="leaderboard-item__name">
        {player.display_name || player.user_id?.slice(0, 8)}
      </span>
      <span className="leaderboard-item__games">
        {player.games_played || 0} 場
      </span>
      <span className="leaderboard-item__wins">
        {player.games_won || 0} 勝
      </span>
      <span className="leaderboard-item__win-rate">
        {player.win_rate?.toFixed(1) || '0.0'}%
      </span>
      <span className="leaderboard-item__score">
        {player.total_score || 0} 分
      </span>
    </div>
  );
}

LeaderboardItem.propTypes = {
  rank: PropTypes.number.isRequired,
  player: PropTypes.shape({
    user_id: PropTypes.string,
    display_name: PropTypes.string,
    games_played: PropTypes.number,
    games_won: PropTypes.number,
    win_rate: PropTypes.number,
    total_score: PropTypes.number,
  }).isRequired,
  isCurrentUser: PropTypes.bool,
  onClick: PropTypes.func,
};

/**
 * 排行榜頁面
 */
function LeaderboardPage({
  currentUserId,
  onFetchLeaderboard,
  onFetchDailyLeaderboard,
  onFetchWeeklyLeaderboard,
  onPlayerClick,
  className,
}) {
  const [activeType, setActiveType] = useState(LEADERBOARD_TYPES.ALL);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * 載入排行榜資料
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      switch (activeType) {
        case LEADERBOARD_TYPES.DAILY:
          result = onFetchDailyLeaderboard
            ? await onFetchDailyLeaderboard()
            : [];
          break;
        case LEADERBOARD_TYPES.WEEKLY:
          result = onFetchWeeklyLeaderboard
            ? await onFetchWeeklyLeaderboard()
            : [];
          break;
        default:
          result = onFetchLeaderboard
            ? await onFetchLeaderboard()
            : [];
      }
      setData(result || []);
    } catch (err) {
      console.error('[LeaderboardPage] 載入失敗:', err);
      setError('載入排行榜失敗');
    } finally {
      setLoading(false);
    }
  }, [activeType, onFetchLeaderboard, onFetchDailyLeaderboard, onFetchWeeklyLeaderboard]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * 過濾資料
   */
  const filteredData = searchTerm
    ? data.filter(
        (player) =>
          player.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  /**
   * 找到當前使用者的排名
   */
  const currentUserRank = data.findIndex((p) => p.user_id === currentUserId) + 1;

  return (
    <div className={`leaderboard-page ${className || ''}`}>
      {/* 標題 */}
      <h1 className="leaderboard-page__title">🏆 排行榜</h1>

      {/* 類型切換 */}
      <div className="leaderboard-page__tabs">
        <button
          className={`leaderboard-page__tab ${activeType === LEADERBOARD_TYPES.ALL ? 'active' : ''}`}
          onClick={() => setActiveType(LEADERBOARD_TYPES.ALL)}
        >
          總排行
        </button>
        <button
          className={`leaderboard-page__tab ${activeType === LEADERBOARD_TYPES.DAILY ? 'active' : ''}`}
          onClick={() => setActiveType(LEADERBOARD_TYPES.DAILY)}
        >
          今日
        </button>
        <button
          className={`leaderboard-page__tab ${activeType === LEADERBOARD_TYPES.WEEKLY ? 'active' : ''}`}
          onClick={() => setActiveType(LEADERBOARD_TYPES.WEEKLY)}
        >
          本週
        </button>
      </div>

      {/* 搜尋框 */}
      <div className="leaderboard-page__search">
        <input
          type="text"
          placeholder="搜尋玩家..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="leaderboard-page__search-input"
        />
      </div>

      {/* 當前使用者排名提示 */}
      {currentUserId && currentUserRank > 0 && (
        <div className="leaderboard-page__my-rank">
          你的排名：<strong>#{currentUserRank}</strong>
        </div>
      )}

      {/* 表頭 */}
      <div className="leaderboard-page__header">
        <span className="leaderboard-page__header-rank">排名</span>
        <span className="leaderboard-page__header-name">玩家</span>
        <span className="leaderboard-page__header-games">場次</span>
        <span className="leaderboard-page__header-wins">勝場</span>
        <span className="leaderboard-page__header-rate">勝率</span>
        <span className="leaderboard-page__header-score">總分</span>
      </div>

      {/* 排行榜列表 */}
      <div className="leaderboard-page__list">
        {loading ? (
          <div className="leaderboard-page__loading">載入中...</div>
        ) : error ? (
          <div className="leaderboard-page__error">{error}</div>
        ) : filteredData.length === 0 ? (
          <div className="leaderboard-page__empty">
            {searchTerm ? '找不到符合的玩家' : '暫無排行資料'}
          </div>
        ) : (
          filteredData.map((player, index) => (
            <LeaderboardItem
              key={player.user_id || index}
              rank={player.rank || index + 1}
              player={player}
              isCurrentUser={player.user_id === currentUserId}
              onClick={onPlayerClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

LeaderboardPage.propTypes = {
  /** 當前使用者 ID */
  currentUserId: PropTypes.string,
  /** 取得總排行榜 */
  onFetchLeaderboard: PropTypes.func,
  /** 取得每日排行榜 */
  onFetchDailyLeaderboard: PropTypes.func,
  /** 取得每週排行榜 */
  onFetchWeeklyLeaderboard: PropTypes.func,
  /** 點擊玩家 */
  onPlayerClick: PropTypes.func,
  /** 額外的 CSS 類名 */
  className: PropTypes.string,
};

export { LeaderboardPage, LeaderboardItem, LEADERBOARD_TYPES, RANK_ICONS };
export default LeaderboardPage;
