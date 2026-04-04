/**
 * 成就詳情彈窗
 *
 * 顯示成就的圖示、描述、解鎖條件和進度條
 */

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './AchievementDetail.css';

/** 稀有度顯示名稱 */
const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  legendary: '傳說',
};

/** 類別顯示名稱 */
const CATEGORY_LABELS = {
  milestone: '里程碑',
  gameplay: '遊戲玩法',
  collection: '收集類',
  special: '特殊成就',
};

/**
 * 格式化解鎖條件文字
 */
function formatCondition(condition) {
  if (!condition) return '';
  switch (condition.type) {
    case 'games_played':
      return `完成 ${condition.value} 場遊戲`;
    case 'games_won':
      return `贏得 ${condition.value} 場遊戲`;
    case 'total_creatures':
      return `累計創造 ${condition.value} 隻生物`;
    case 'total_traits':
      return `累計獲得 ${condition.value} 個性狀`;
    case 'total_kills':
      return `累計擊殺 ${condition.value} 隻生物`;
    case 'kills_in_game':
      return `單場擊殺 ${condition.value} 隻生物`;
    case 'creatures_in_game':
      return `單場擁有 ${condition.value} 隻生物`;
    case 'score_in_game':
      return `單場獲得 ${condition.value} 分以上`;
    case 'win_in_rounds':
      return `在 ${condition.value} 回合內獲勝`;
    case 'win_rate':
      return `在至少 ${condition.minGames || 0} 場後維持 ${condition.value}% 以上勝率`;
    case 'all_survived':
      return '所有生物存活至遊戲結束';
    case 'win_without_kills':
      return '不擊殺任何生物贏得遊戲';
    case 'perfect_game':
      return '贏得遊戲且所有生物都吃飽';
    default:
      return '';
  }
}

/**
 * 取得條件的目標值（用於進度顯示）
 */
function getConditionTarget(condition) {
  if (!condition) return null;
  if (typeof condition.value === 'number') return condition.value;
  return null;
}

/**
 * 成就詳情彈窗
 */
function AchievementDetail({ achievement, onClose }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!achievement) return null;

  const {
    icon,
    name,
    description,
    condition,
    progress,
    currentValue,
    points,
    rarity,
    category,
    unlocked,
    unlockedAt,
  } = achievement;

  const target = getConditionTarget(condition);
  const progressPct = typeof progress === 'number' ? Math.min(progress, 100) : 0;
  const rarityKey = rarity || 'common';
  const conditionText = formatCondition(condition);

  return (
    <div
      className="achievement-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="成就詳情"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`achievement-detail achievement-detail--${rarityKey}`}>
        {/* 關閉按鈕 */}
        <button
          className="achievement-detail__close"
          onClick={onClose}
          aria-label="關閉"
        >
          ×
        </button>

        {/* 頂部：圖示 + 名稱 */}
        <div className="achievement-detail__header">
          <div
            className={`achievement-detail__icon ${unlocked ? '' : 'achievement-detail__icon--locked'}`}
          >
            {unlocked ? icon : '🔒'}
          </div>
          <div className="achievement-detail__title-group">
            <h2 className="achievement-detail__name">{name}</h2>
            <div className="achievement-detail__badges">
              {rarity && (
                <span
                  className={`achievement-detail__rarity achievement-detail__rarity--${rarityKey}`}
                >
                  {RARITY_LABELS[rarityKey] || rarityKey}
                </span>
              )}
              {category && (
                <span className="achievement-detail__category">
                  {CATEGORY_LABELS[category] || category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 描述 */}
        <p className="achievement-detail__description">{description}</p>

        {/* 解鎖條件 */}
        {conditionText && (
          <div className="achievement-detail__condition">
            <span className="achievement-detail__condition-label">解鎖條件：</span>
            <span>{conditionText}</span>
          </div>
        )}

        {/* 進度條 */}
        {!unlocked && target !== null && (
          <div className="achievement-detail__progress">
            <div className="achievement-detail__progress-header">
              <span className="achievement-detail__progress-label">進度</span>
              <span className="achievement-detail__progress-value">
                {currentValue !== undefined ? currentValue : 0} / {target}
              </span>
            </div>
            <div
              className="achievement-detail__progress-bar"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="achievement-detail__progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* 分數 */}
        <div className="achievement-detail__footer">
          <span className="achievement-detail__points">+{points} 點</span>
          {unlocked && unlockedAt && (
            <span className="achievement-detail__unlocked-date">
              解鎖於 {new Date(unlockedAt).toLocaleDateString('zh-TW')}
            </span>
          )}
          {unlocked && !unlockedAt && (
            <span className="achievement-detail__unlocked-badge">✅ 已解鎖</span>
          )}
        </div>
      </div>
    </div>
  );
}

AchievementDetail.propTypes = {
  /** 成就資料 */
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
    unlockedAt: PropTypes.string,
  }),
  /** 關閉回呼 */
  onClose: PropTypes.func.isRequired,
};

export default AchievementDetail;
