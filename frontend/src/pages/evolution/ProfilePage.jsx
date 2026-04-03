/**
 * 個人資料頁面
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { StatsCardGroup } from '../../components/games/evolution/stats';
import { AchievementDetailModal } from '../../components/common/AchievementDetail';
import { getRarity } from '../../components/common/AchievementToast/AchievementToast';
import './ProfilePage.css';

/** 成就類別標籤對照 */
const CATEGORY_LABELS = {
  milestone: '里程碑',
  gameplay: '遊戲玩法',
  collection: '收集類',
  special: '特殊成就',
};

/**
 * 成就徽章（可點擊）
 */
function AchievementBadge({ achievement, onClick }) {
  const rarity = getRarity(achievement.points || 0);
  const progress = achievement.progress ?? (achievement.unlocked ? 100 : 0);

  return (
    <button
      type="button"
      className={`achievement-badge ${achievement.unlocked ? '' : 'achievement-badge--locked'} ${rarity.className}`}
      title={achievement.description}
      onClick={() => onClick && onClick(achievement)}
      data-testid="achievement-badge"
    >
      <span className="achievement-badge__icon">{achievement.icon}</span>
      <span className="achievement-badge__name">{achievement.name}</span>
      {achievement.unlocked ? (
        <span className="achievement-badge__points">+{achievement.points}</span>
      ) : (
        <div className="achievement-badge__progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="achievement-badge__progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      <span className={`achievement-badge__rarity-dot ${rarity.className}`} aria-label={rarity.label} />
    </button>
  );
}

AchievementBadge.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string.isRequired,
    points: PropTypes.number,
    unlocked: PropTypes.bool,
    progress: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func,
};

/**
 * 遊戲歷史項目
 */
function GameHistoryItem({ game }) {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`game-history-item ${game.isWinner ? 'game-history-item--win' : ''}`}>
      <span className="game-history-item__result">
        {game.isWinner ? '🏆 勝利' : `第 ${game.rank} 名`}
      </span>
      <span className="game-history-item__score">{game.score} 分</span>
      <span className="game-history-item__details">
        {game.creatures}🦎 {game.traits}🧬
      </span>
      <span className="game-history-item__date">{formatDate(game.playedAt)}</span>
    </div>
  );
}

GameHistoryItem.propTypes = {
  game: PropTypes.shape({
    id: PropTypes.string,
    isWinner: PropTypes.bool,
    rank: PropTypes.number,
    score: PropTypes.number,
    creatures: PropTypes.number,
    traits: PropTypes.number,
    playedAt: PropTypes.string,
  }).isRequired,
};

/**
 * 個人資料頁面
 */
function ProfilePage({
  user,
  stats,
  achievements,
  history,
  loading,
  error,
  onRefresh,
  className,
}) {
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleBadgeClick = useCallback((achievement) => {
    setSelectedAchievement(achievement);
    setDetailOpen(true);
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetailOpen(false);
    setSelectedAchievement(null);
  }, []);

  const handleShare = useCallback(async (achievement) => {
    const text = `我在演化論中解鎖了成就「${achievement.name}」！ 🎮`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '成就解鎖', text });
      } catch {
        // ignore cancel
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }, []);

  // 統計卡片資料
  const statsCards = stats
    ? [
        { label: '遊戲場數', value: stats.games_played || 0, icon: '🎮' },
        { label: '勝場數', value: stats.games_won || 0, icon: '🏆' },
        { label: '勝率', value: `${stats.win_rate?.toFixed(1) || 0}%`, icon: '📊' },
        { label: '最高分', value: stats.highest_score || 0, icon: '⭐' },
        { label: '累積分數', value: stats.total_score || 0, icon: '💰' },
        { label: '總擊殺', value: stats.total_kills || 0, icon: '🦖' },
      ]
    : [];

  // 成就進度
  const unlockedCount = achievements?.filter((a) => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;
  const totalPoints = achievements
    ?.filter((a) => a.unlocked)
    .reduce((sum, a) => sum + (a.points || 0), 0) || 0;

  // 類別篩選
  const categories = ['all', ...new Set((achievements || []).map((a) => a.category).filter(Boolean))];
  const filteredAchievements = activeCategory === 'all'
    ? achievements
    : achievements?.filter((a) => a.category === activeCategory);

  // 顯示的成就
  const displayedAchievements = showAllAchievements
    ? filteredAchievements
    : filteredAchievements?.slice(0, 6);

  if (loading) {
    return (
      <div className={`profile-page profile-page--loading ${className || ''}`}>
        <div className="profile-page__spinner">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`profile-page profile-page--error ${className || ''}`}>
        <p>{error}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="profile-page__retry-btn">
            重試
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`profile-page ${className || ''}`}>
      {/* 玩家資訊 */}
      <section className="profile-page__header">
        <div className="profile-page__avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} />
          ) : (
            <span className="profile-page__avatar-placeholder">
              {user?.displayName?.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div className="profile-page__info">
          <h1 className="profile-page__name">{user?.displayName || '玩家'}</h1>
          <p className="profile-page__joined">
            加入時間：{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-TW') : '-'}
          </p>
        </div>
      </section>

      {/* 統計摘要 */}
      <section className="profile-page__stats">
        <h2 className="profile-page__section-title">📊 統計</h2>
        <StatsCardGroup stats={statsCards} />
      </section>

      {/* 成就 */}
      <section className="profile-page__achievements">
        <div className="profile-page__achievements-header">
          <h2 className="profile-page__section-title">
            🏅 成就 ({unlockedCount}/{totalCount})
          </h2>
          <span className="profile-page__achievement-points">
            {totalPoints} 點
          </span>
        </div>

        {/* 類別篩選 */}
        {categories.length > 1 && (
          <div className="profile-page__category-tabs" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                className={`profile-page__category-tab ${activeCategory === cat ? 'profile-page__category-tab--active' : ''}`}
                onClick={() => { setActiveCategory(cat); setShowAllAchievements(false); }}
                data-testid={`category-tab-${cat}`}
              >
                {cat === 'all' ? '全部' : (CATEGORY_LABELS[cat] || cat)}
              </button>
            ))}
          </div>
        )}

        <div className="profile-page__achievement-grid">
          {displayedAchievements?.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              onClick={handleBadgeClick}
            />
          ))}
        </div>

        {filteredAchievements && filteredAchievements.length > 6 && (
          <button
            className="profile-page__show-more"
            onClick={() => setShowAllAchievements(!showAllAchievements)}
          >
            {showAllAchievements ? '顯示較少' : `顯示全部 (${filteredAchievements.length})`}
          </button>
        )}
      </section>

      {/* 成就詳情彈窗 */}
      <AchievementDetailModal
        achievement={selectedAchievement}
        isOpen={detailOpen}
        onClose={handleDetailClose}
        onShare={handleShare}
      />

      {/* 遊戲歷史 */}
      <section className="profile-page__history">
        <h2 className="profile-page__section-title">📜 近期遊戲</h2>

        {history && history.length > 0 ? (
          <div className="profile-page__history-list">
            {history.slice(0, 10).map((game, index) => (
              <GameHistoryItem key={game.id || index} game={game} />
            ))}
          </div>
        ) : (
          <p className="profile-page__empty">尚無遊戲記錄</p>
        )}
      </section>
    </div>
  );
}

ProfilePage.propTypes = {
  /** 使用者資訊 */
  user: PropTypes.shape({
    id: PropTypes.string,
    displayName: PropTypes.string,
    avatarUrl: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  /** 統計資料 */
  stats: PropTypes.shape({
    games_played: PropTypes.number,
    games_won: PropTypes.number,
    win_rate: PropTypes.number,
    highest_score: PropTypes.number,
    total_score: PropTypes.number,
    total_kills: PropTypes.number,
  }),
  /** 成就列表 */
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      icon: PropTypes.string,
      points: PropTypes.number,
      unlocked: PropTypes.bool,
      progress: PropTypes.number,
      category: PropTypes.string,
    })
  ),
  /** 遊戲歷史 */
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      isWinner: PropTypes.bool,
      rank: PropTypes.number,
      score: PropTypes.number,
      creatures: PropTypes.number,
      traits: PropTypes.number,
      playedAt: PropTypes.string,
    })
  ),
  /** 載入狀態 */
  loading: PropTypes.bool,
  /** 錯誤訊息 */
  error: PropTypes.string,
  /** 重新整理 */
  onRefresh: PropTypes.func,
  /** 額外的 CSS 類名 */
  className: PropTypes.string,
};

export { ProfilePage, AchievementBadge, GameHistoryItem };
export default ProfilePage;
