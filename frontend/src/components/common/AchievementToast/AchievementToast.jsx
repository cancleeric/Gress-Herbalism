/**
 * 成就解鎖通知 Toast
 *
 * @module components/common/AchievementToast/AchievementToast
 */

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './AchievementToast.css';

/**
 * 依點數判斷稀有度
 * @param {number} points
 * @returns {{ label: string, className: string }}
 */
export function getRarity(points) {
  if (points >= 100) return { label: '傳說', className: 'rarity--legendary' };
  if (points >= 35) return { label: '稀有', className: 'rarity--rare' };
  return { label: '普通', className: 'rarity--common' };
}

/**
 * 單個成就 Toast 項目
 */
function AchievementToastItem({ achievement, onDismiss }) {
  const rarity = getRarity(achievement.points || 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(achievement.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [achievement.id, onDismiss]);

  return (
    <motion.div
      className={`achievement-toast ${rarity.className}`}
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      role="alert"
      aria-live="polite"
      data-testid="achievement-toast"
    >
      <button
        className="achievement-toast__close"
        onClick={() => onDismiss(achievement.id)}
        aria-label="關閉通知"
        data-testid="achievement-toast-close"
      >
        ×
      </button>
      <div className="achievement-toast__header">
        <span className="achievement-toast__label">🏅 成就解鎖！</span>
        <span className={`achievement-toast__rarity ${rarity.className}`}>
          {rarity.label}
        </span>
      </div>
      <div className="achievement-toast__body">
        <span className="achievement-toast__icon">{achievement.icon}</span>
        <div className="achievement-toast__content">
          <p className="achievement-toast__name">{achievement.name}</p>
          {achievement.description && (
            <p className="achievement-toast__desc">{achievement.description}</p>
          )}
        </div>
        {achievement.points > 0 && (
          <span className="achievement-toast__points">+{achievement.points}</span>
        )}
      </div>
    </motion.div>
  );
}

AchievementToastItem.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string,
    points: PropTypes.number,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * 成就通知容器 — 渲染所有待顯示的通知
 *
 * @param {Object} props
 * @param {Array}  props.achievements - 待通知的成就列表
 * @param {Function} props.onDismiss - 關閉單一通知 (achievementId) => void
 */
export function AchievementToastContainer({ achievements, onDismiss }) {
  const handleDismiss = useCallback(
    (id) => {
      if (onDismiss) onDismiss(id);
    },
    [onDismiss]
  );

  return (
    <div className="achievement-toast-container" data-testid="achievement-toast-container">
      <AnimatePresence>
        {achievements?.map((ach) => (
            <AchievementToastItem
              key={ach.id}
              achievement={ach}
              onDismiss={handleDismiss}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

AchievementToastContainer.propTypes = {
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.string,
      points: PropTypes.number,
    })
  ),
  onDismiss: PropTypes.func,
};

export default AchievementToastContainer;
