/**
 * 個人資料頁面
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { StatsCardGroup } from '../../components/games/evolution/stats';
import AchievementToast from '../../components/common/AchievementToast';
import './ProfilePage.css';

const RARITY_LABELS = { common: '普通', rare: '稀有', legendary: '傳說' };
const RARITY_COLORS = { common: '#9E9E9E', rare: '#2196F3', legendary: '#FF9800' };
const CATEGORY_LABELS = {
  all: '全部',
  milestone: '里程碑',
  gameplay: '遊戲玩法',
  collection: '收集類',
  special: '特殊成就',
};

/**
 * 成就詳情 Modal
 */
function AchievementDetailModal({ achievement, onClose }) {
  if (!achievement) return null;

  const rarityLabel = RARITY_LABELS[achievement.rarity] || '';
  const rarityColor = RARITY_COLORS[achievement.rarity] || '#aaa';
  const categoryLabel = CATEGORY_LABELS[achievement.category] || achievement.category || '';
  const progress = achievement.progress ?? (achievement.unlocked ? 100 : 0);
  const current = achievement.current ?? null;
  const target = achievement.target ?? null;

  const handleShare = async () => {
    const text = `我在《演化論》解鎖了成就「${achievement.name}」！${achievement.description}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `成就：${achievement.name}`, text });
      } catch {
        // user cancelled or share failed
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // clipboard access denied — silent fail
      }
    }
  };

  return (
    <div
      className="achievement-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-label={achievement.name}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="achievement-detail-modal__content">
        <button className="achievement-detail-modal__close" onClick={onClose} aria-label="關閉">✕</button>

        <div className="achievement-detail-modal__icon">{achievement.icon}</div>
        <h2 className="achievement-detail-modal__name">{achievement.name}</h2>

        {rarityLabel && (
          <span
            className="achievement-detail-modal__rarity"
            style={{ color: rarityColor, borderColor: rarityColor }}
          >
            {rarityLabel}
          </span>
        )}

        {categoryLabel && (
          <span className="achievement-detail-modal__category">{categoryLabel}</span>
        )}

        {achievement.description && (
          <p className="achievement-detail-modal__description">{achievement.description}</p>
        )}

        <div className="achievement-detail-modal__progress-wrap">
          <div className="achievement-detail-modal__progress-bar">
            <div
              className="achievement-detail-modal__progress-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {current !== null && target !== null && (
            <span className="achievement-detail-modal__progress-text">{current}/{target}</span>
          )}
        </div>

        {achievement.points != null && (
          <div className="achievement-detail-modal__points">+{achievement.points} 點</div>
        )}

        <button className="achievement-detail-modal__share-btn" onClick={handleShare}>
          🔗 分享成就
        </button>
      </div>
    </div>
  );
}

AchievementDetailModal.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string,
    points: PropTypes.number,
    rarity: PropTypes.string,
    category: PropTypes.string,
    unlocked: PropTypes.bool,
    progress: PropTypes.number,
    current: PropTypes.number,
    target: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
};

/**
 * 成就分類篩選
 */
function CategoryFilter({ activeCategory, onChange }) {
  const categories = ['all', 'milestone', 'gameplay', 'collection', 'special'];
  return (
    <div className="category-filter" role="tablist" aria-label="成就分類">
      {categories.map((cat) => (
        <button
          key={cat}
          role="tab"
          aria-selected={activeCategory === cat}
          className={`category-filter__tab${activeCategory === cat ? ' category-filter__tab--active' : ''}`}
          onClick={() => onChange(cat)}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
}

CategoryFilter.propTypes = {
  activeCategory: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

/**
 * 成就徽章
 */
function AchievementBadge({ achievement, onClick, progress, current, target }) {
  const rarityLabel = RARITY_LABELS[achievement.rarity] || '';
  const rarityColor = RARITY_COLORS[achievement.rarity] || null;
  const effectiveProgress = progress ?? (achievement.unlocked ? 100 : 0);

  return (
    <div
      className={`achievement-badge ${achievement.unlocked ? '' : 'achievement-badge--locked'}`}
      title={achievement.description}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <span className="achievement-badge__icon">{achievement.icon}</span>
      <span className="achievement-badge__name">{achievement.name}</span>
      {achievement.unlocked && (
        <span className="achievement-badge__points">+{achievement.points}</span>
      )}
      {rarityLabel && (
        <span
          className="achievement-badge__rarity"
          style={rarityColor ? { color: rarityColor } : undefined}
        >
          {rarityLabel}
        </span>
      )}
      {!achievement.unlocked && target != null && target > 0 && current != null && (
        <span className="achievement-badge__progress-text">{current}/{target}</span>
      )}
      {!achievement.unlocked && (
        <div className="achievement-badge__progress-bar">
          <div
            className="achievement-badge__progress-fill"
            style={{ width: `${Math.min(effectiveProgress, 100)}%` }}
          />
        </div>
      )}
    </div>
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
    rarity: PropTypes.string,
    category: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func,
  progress: PropTypes.number,
  current: PropTypes.number,
  target: PropTypes.number,
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
  achievementProgress,
  newlyUnlocked,
  history,
  loading,
  error,
  onRefresh,
  className,
}) {
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Trigger toasts for newly unlocked achievements
  useEffect(() => {
    if (newlyUnlocked && newlyUnlocked.length > 0) {
      setToasts(newlyUnlocked);
    }
  }, [newlyUnlocked]);

  // Merge progress data into achievements using a Map for O(n) lookup
  const progressMap = new Map(
    achievementProgress?.map((p) => [p.id, p]) || []
  );
  const mergedAchievements = achievements?.map((ach) => {
    const prog = progressMap.get(ach.id);
    if (!prog) return ach;
    return { ...ach, progress: prog.progress, current: prog.current, target: prog.target };
  });

  // Filter by category
  const filteredAchievements =
    activeCategory === 'all'
      ? mergedAchievements
      : mergedAchievements?.filter((a) => a.category === activeCategory);

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

  // 顯示的成就
  const displayedAchievements = showAllAchievements
    ? filteredAchievements
    : filteredAchievements?.slice(0, 6);

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((a) => a.id !== id));
  };

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
      {/* 成就解鎖通知 */}
      <AchievementToast achievements={toasts} onDismiss={handleDismissToast} />

      {/* 成就詳情 Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}

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

        <CategoryFilter activeCategory={activeCategory} onChange={setActiveCategory} />

        <div className="profile-page__achievement-grid">
          {displayedAchievements?.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              onClick={() => setSelectedAchievement(achievement)}
              progress={achievement.progress}
              current={achievement.current}
              target={achievement.target}
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
      rarity: PropTypes.string,
      category: PropTypes.string,
    })
  ),
  /** 成就進度 */
  achievementProgress: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      progress: PropTypes.number,
      current: PropTypes.number,
      target: PropTypes.number,
    })
  ),
  /** 新解鎖的成就（觸發 Toast） */
  newlyUnlocked: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string,
      points: PropTypes.number,
      rarity: PropTypes.string,
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

export { ProfilePage, AchievementBadge, GameHistoryItem, CategoryFilter, AchievementDetailModal };
export default ProfilePage;
