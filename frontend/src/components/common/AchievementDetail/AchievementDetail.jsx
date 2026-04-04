/**
 * 成就詳情元件
 * 顯示成就的詳細資訊：圖示、描述、解鎖條件、進度條、稀有度
 */

import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import './AchievementDetail.css';

/**
 * 依積分計算稀有度
 * @param {number} points
 * @returns {{ label: string, className: string }}
 */
export function getRarity(points) {
  if (points >= 50) {
    return { label: '傳說', className: 'rarity--legendary' };
  }
  if (points >= 21) {
    return { label: '稀有', className: 'rarity--rare' };
  }
  return { label: '普通', className: 'rarity--common' };
}

/**
 * 取得類別中文名稱
 * @param {string} category
 * @returns {string}
 */
export function getCategoryLabel(category) {
  const labels = {
    milestone: '里程碑',
    gameplay: '遊戲玩法',
    collection: '收集類',
    special: '特殊成就',
  };
  return labels[category] || category;
}

/**
 * 格式化解鎖條件描述
 * @param {Object} condition
 * @returns {string}
 */
function formatCondition(condition) {
  if (!condition) return '';
  const typeLabels = {
    games_played: '累計完成場數',
    games_won: '累計勝利場數',
    total_creatures: '累計創造生物',
    total_traits: '累計獲得性狀',
    total_kills: '累計擊殺生物',
    win_rate: '勝率',
    score_in_game: '單場得分',
    creatures_in_game: '單場生物數量',
    kills_in_game: '單場擊殺數',
    win_in_rounds: '回合內獲勝',
    all_survived: '所有生物存活',
    win_without_kills: '不擊殺贏得遊戲',
    perfect_game: '贏得遊戲且所有生物吃飽',
  };
  const label = typeLabels[condition.type] || condition.type;
  if (typeof condition.value === 'boolean') {
    return label;
  }
  if (condition.type === 'win_rate') {
    return `${label} ≥ ${condition.value}%（至少 ${condition.minGames || 0} 場後）`;
  }
  return `${label} ≥ ${condition.value}`;
}

/**
 * 成就詳情 Modal
 */
function AchievementDetail({ achievement, onClose }) {
  const rarity = getRarity(achievement.points || 0);
  const categoryLabel = getCategoryLabel(achievement.category);
  const conditionText = formatCondition(achievement.condition);
  const progress = achievement.progress || null;
  const progressPct = progress
    ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : null;

  // 按下 Escape 關閉
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

  // 分享成就（複製文字到剪貼簿）
  const handleShare = useCallback(async () => {
    const text = achievement.unlocked
      ? `我在演化論中解鎖了成就「${achievement.name}」${achievement.icon}！獲得 ${achievement.points} 點！`
      : `我正在追求成就「${achievement.name}」${achievement.icon}，目前進度 ${progressPct ?? 0}%！`;
    try {
      await navigator.clipboard.writeText(text);
      alert('成就資訊已複製！');
    } catch {
      // fallback for environments without clipboard
      alert(text);
    }
  }, [achievement, progressPct]);

  return (
    <div
      className="achievement-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`成就詳情：${achievement.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="achievement-detail">
        {/* 關閉按鈕 */}
        <button
          className="achievement-detail__close"
          onClick={onClose}
          aria-label="關閉"
        >
          ✕
        </button>

        {/* 圖示 + 稀有度 */}
        <div className={`achievement-detail__icon-wrap ${rarity.className}`}>
          <span className="achievement-detail__icon">{achievement.icon}</span>
        </div>
        <span className={`achievement-detail__rarity ${rarity.className}`}>
          {rarity.label}
        </span>

        {/* 名稱 */}
        <h2 className="achievement-detail__name">
          {achievement.name}
          {achievement.nameEn && (
            <span className="achievement-detail__name-en"> · {achievement.nameEn}</span>
          )}
        </h2>

        {/* 類別 */}
        <span className="achievement-detail__category">{categoryLabel}</span>

        {/* 描述 */}
        <p className="achievement-detail__description">{achievement.description}</p>

        {/* 解鎖條件 */}
        {conditionText && (
          <div className="achievement-detail__condition">
            <span className="achievement-detail__condition-label">解鎖條件：</span>
            {conditionText}
          </div>
        )}

        {/* 進度條（未解鎖且有進度資料時顯示） */}
        {!achievement.unlocked && progress && (
          <div className="achievement-detail__progress">
            <div className="achievement-detail__progress-label">
              進度：{progress.current} / {progress.total}
            </div>
            <div
              className="achievement-detail__progress-bar"
              role="progressbar"
              aria-valuenow={progress.current}
              aria-valuemin={0}
              aria-valuemax={progress.total}
            >
              <div
                className="achievement-detail__progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="achievement-detail__progress-pct">{progressPct}%</span>
          </div>
        )}

        {/* 積分 */}
        <div className="achievement-detail__points">
          {achievement.unlocked ? (
            <span className="achievement-detail__points-unlocked">
              +{achievement.points} 點
            </span>
          ) : (
            <span className="achievement-detail__points-locked">
              {achievement.points} 點（未解鎖）
            </span>
          )}
        </div>

        {/* 解鎖時間 */}
        {achievement.unlocked && achievement.unlockedAt && (
          <div className="achievement-detail__unlocked-at">
            解鎖於：{new Date(achievement.unlockedAt).toLocaleDateString('zh-TW')}
          </div>
        )}

        {/* 分享按鈕 */}
        <button
          className="achievement-detail__share"
          onClick={handleShare}
          aria-label="分享成就"
        >
          📤 分享成就
        </button>
      </div>
    </div>
  );
}

AchievementDetail.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    nameEn: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.string.isRequired,
    category: PropTypes.string,
    condition: PropTypes.shape({
      type: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
      minGames: PropTypes.number,
    }),
    points: PropTypes.number,
    unlocked: PropTypes.bool,
    unlockedAt: PropTypes.string,
    progress: PropTypes.shape({
      current: PropTypes.number.isRequired,
      total: PropTypes.number.isRequired,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AchievementDetail;
