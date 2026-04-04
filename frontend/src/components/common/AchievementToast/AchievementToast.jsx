/**
 * 成就解鎖通知彈窗（Toast）
 *
 * 成就解鎖時的即時視覺回饋動畫通知
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './AchievementToast.css';

/** 稀有度樣式對應 */
const RARITY_CLASS = {
  common: 'achievement-toast--common',
  rare: 'achievement-toast--rare',
  legendary: 'achievement-toast--legendary',
};

/**
 * 單個成就 Toast 通知
 */
function AchievementToastItem({ achievement, onDismiss, duration = 4000 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss, duration]);

  const rarityClass = RARITY_CLASS[achievement.rarity] || RARITY_CLASS.common;

  return (
    <div
      className={`achievement-toast ${rarityClass}`}
      role="alert"
      aria-live="polite"
      onClick={onDismiss}
    >
      <div className="achievement-toast__icon">{achievement.icon}</div>
      <div className="achievement-toast__body">
        <p className="achievement-toast__label">🎉 成就解鎖！</p>
        <p className="achievement-toast__name">{achievement.name}</p>
        {achievement.points && (
          <p className="achievement-toast__points">+{achievement.points} 點</p>
        )}
      </div>
      <button
        className="achievement-toast__close"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="關閉通知"
      >
        ×
      </button>
    </div>
  );
}

AchievementToastItem.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string,
    points: PropTypes.number,
    rarity: PropTypes.string,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
  duration: PropTypes.number,
};

/**
 * Toast 容器 — 渲染多個解鎖通知
 */
function AchievementToast({ notifications = [], onDismiss, duration = 4000 }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="achievement-toast-container" aria-label="成就通知">
      {notifications.map((achievement) => (
        <AchievementToastItem
          key={achievement.id || achievement.name}
          achievement={achievement}
          onDismiss={() => onDismiss(achievement.id || achievement.name)}
          duration={duration}
        />
      ))}
    </div>
  );
}

AchievementToast.propTypes = {
  /** 待顯示的成就列表 */
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string,
      points: PropTypes.number,
      rarity: PropTypes.string,
    })
  ),
  /** 關閉單個通知的回呼，傳入 achievement.id */
  onDismiss: PropTypes.func.isRequired,
  /** 自動消失時間（ms），預設 4000 */
  duration: PropTypes.number,
};

export { AchievementToastItem };
export default AchievementToast;
