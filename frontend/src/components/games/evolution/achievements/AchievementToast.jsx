/**
 * 成就解鎖通知 Toast
 */

import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './AchievementToast.css';

const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  legendary: '傳說',
};

/**
 * 單一成就解鎖 Toast
 */
function AchievementToastItem({ achievement, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 觸發進場動畫
    const showTimer = setTimeout(() => setVisible(true), 10);
    // 自動隱藏
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(achievement.id), 350);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [achievement.id, onDismiss]);

  const rarity = achievement.rarity || 'common';
  const rarityLabel = RARITY_LABELS[rarity];

  return (
    <div
      className={`achievement-toast ${visible ? 'achievement-toast--visible' : ''} achievement-toast--${rarity}`}
      role="alert"
      aria-live="polite"
    >
      <span className="achievement-toast__icon">{achievement.icon}</span>
      <div className="achievement-toast__body">
        <span className="achievement-toast__title">🏅 成就解鎖！</span>
        <span className="achievement-toast__name">{achievement.name}</span>
        <span className={`achievement-toast__rarity achievement-toast__rarity--${rarity}`}>
          {rarityLabel}
        </span>
      </div>
      <span className="achievement-toast__points">+{achievement.points}</span>
      <button
        className="achievement-toast__close"
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(achievement.id), 350);
        }}
        aria-label="關閉通知"
      >
        ✕
      </button>
    </div>
  );
}

AchievementToastItem.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    points: PropTypes.number,
    rarity: PropTypes.oneOf(['common', 'rare', 'legendary']),
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * 成就解鎖通知容器
 *
 * 使用方式：
 *   const [toasts, setToasts] = useState([]);
 *   // 解鎖成就時：
 *   setToasts(prev => [...prev, achievement]);
 *   // 渲染：
 *   <AchievementToast achievements={toasts} onDismiss={id => setToasts(prev => prev.filter(a => a.id !== id))} />
 */
function AchievementToast({ achievements, onDismiss }) {
  const handleDismiss = useCallback(
    (id) => {
      onDismiss(id);
    },
    [onDismiss]
  );

  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="achievement-toast-container" aria-label="成就通知">
      {achievements.map((achievement) => (
        <AchievementToastItem
          key={achievement.id}
          achievement={achievement}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}

AchievementToast.propTypes = {
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      points: PropTypes.number,
      rarity: PropTypes.oneOf(['common', 'rare', 'legendary']),
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export { AchievementToastItem };
export default AchievementToast;
