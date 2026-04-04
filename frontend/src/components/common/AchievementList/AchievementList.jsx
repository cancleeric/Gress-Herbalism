/**
 * 成就列表組件
 *
 * 支援類別篩選、進度追蹤、稀有度標示和點擊查看詳情
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './AchievementList.css';

/** 類別 tab 定義 */
const CATEGORY_TABS = [
  { key: 'all', label: '全部' },
  { key: 'milestone', label: '里程碑' },
  { key: 'gameplay', label: '遊戲玩法' },
  { key: 'collection', label: '收集類' },
  { key: 'special', label: '特殊成就' },
];

/** 預設稀有度 */
const DEFAULT_RARITY = 'common';

/** 稀有度顯示名稱 */
const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  legendary: '傳說',
};

/**
 * 單個成就卡片
 */
function AchievementCard({ achievement, onClick }) {
  const {
    icon,
    name,
    description,
    points,
    rarity,
    unlocked,
    progress,
    currentValue,
    condition,
  } = achievement;

  const rarityKey = rarity || DEFAULT_RARITY;
  const progressPct = typeof progress === 'number' ? Math.min(progress, 100) : 0;
  const target =
    condition && typeof condition.value === 'number' ? condition.value : null;
  const showProgress = !unlocked && target !== null;

  return (
    <button
      type="button"
      className={`achievement-card ${unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'} achievement-card--${rarityKey}`}
      onClick={() => onClick(achievement)}
      title={description}
      aria-label={`${name}${unlocked ? ' (已解鎖)' : ''}`}
    >
      {/* 圖示 */}
      <div className="achievement-card__icon">
        {unlocked ? icon : '🔒'}
      </div>

      {/* 名稱 + 稀有度 */}
      <div className="achievement-card__body">
        <span className="achievement-card__name">{name}</span>
        <div className="achievement-card__meta">
          {rarity && (
            <span className={`achievement-card__rarity achievement-card__rarity--${rarityKey}`}>
              {RARITY_LABELS[rarityKey] || rarityKey}
            </span>
          )}
          {unlocked && (
            <span className="achievement-card__points">+{points}</span>
          )}
        </div>
      </div>

      {/* 進度條（未解鎖且有數值目標時顯示） */}
      {showProgress && (
        <div className="achievement-card__progress">
          <div
            className="achievement-card__progress-bar"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="achievement-card__progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="achievement-card__progress-text">
            {currentValue !== undefined ? currentValue : 0}/{target}
          </span>
        </div>
      )}
    </button>
  );
}

AchievementCard.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string,
    points: PropTypes.number,
    rarity: PropTypes.string,
    category: PropTypes.string,
    condition: PropTypes.object,
    progress: PropTypes.number,
    currentValue: PropTypes.number,
    unlocked: PropTypes.bool,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

/**
 * 成就列表
 */
function AchievementList({ achievements, onSelect = () => {}, className }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    if (!achievements) return [];
    if (activeCategory === 'all') return achievements;
    return achievements.filter((a) => a.category === activeCategory);
  }, [achievements, activeCategory]);

  const unlockedCount = useMemo(
    () => (achievements || []).filter((a) => a.unlocked).length,
    [achievements]
  );

  const totalCount = achievements ? achievements.length : 0;

  return (
    <div className={`achievement-list ${className || ''}`}>
      {/* 統計摘要 */}
      <div className="achievement-list__summary">
        <span className="achievement-list__summary-count">
          {unlockedCount} / {totalCount} 已解鎖
        </span>
        <div
          className="achievement-list__summary-bar"
          role="progressbar"
          aria-valuenow={totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="achievement-list__summary-fill"
            style={{
              width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%',
            }}
          />
        </div>
      </div>

      {/* 類別 Tabs */}
      <div className="achievement-list__tabs" role="tablist" aria-label="成就類別">
        {CATEGORY_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? totalCount
              : (achievements || []).filter((a) => a.category === tab.key).length;

          if (tab.key !== 'all' && count === 0) return null;

          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={activeCategory === tab.key}
              className={`achievement-list__tab ${activeCategory === tab.key ? 'achievement-list__tab--active' : ''}`}
              onClick={() => setActiveCategory(tab.key)}
            >
              {tab.label}
              <span className="achievement-list__tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 成就格線 */}
      {filtered.length > 0 ? (
        <div className="achievement-list__grid">
          {filtered.map((achievement) => (
            <AchievementCard
              key={achievement.id || achievement.name}
              achievement={achievement}
              onClick={onSelect}
            />
          ))}
        </div>
      ) : (
        <p className="achievement-list__empty">此類別暫無成就</p>
      )}
    </div>
  );
}

AchievementList.propTypes = {
  /** 成就列表（含進度資料） */
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.string,
      points: PropTypes.number,
      rarity: PropTypes.string,
      category: PropTypes.string,
      condition: PropTypes.object,
      progress: PropTypes.number,
      currentValue: PropTypes.number,
      unlocked: PropTypes.bool,
    })
  ),
  /** 點擊成就時的回呼，傳入完整 achievement 物件 */
  onSelect: PropTypes.func,
  /** 額外 CSS 類名 */
  className: PropTypes.string,
};

export { AchievementCard };
export default AchievementList;
