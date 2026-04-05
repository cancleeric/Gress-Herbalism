/**
 * 成就解鎖通知 Toast 組件
 * 使用 framer-motion 動畫
 */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import './AchievementToast.css';

const RARITY_LABELS = { common: '普通', rare: '稀有', legendary: '傳說' };
const RARITY_COLORS = { common: '#9E9E9E', rare: '#2196F3', legendary: '#FF9800' };
const AUTO_DISMISS_MS = 4000;

function AchievementToastItem({ achievement, onDismiss }) {
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []); // onDismiss is stable per render; reset not desired

  return (
    <motion.div
      className="achievement-toast"
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onDismiss}
      role="alert"
      aria-live="polite"
    >
      <div className="achievement-toast__badge">🏅</div>
      <div className="achievement-toast__body">
        <div className="achievement-toast__title">成就解鎖！</div>
        <div className="achievement-toast__name">
          <span className="achievement-toast__icon">{achievement.icon}</span>
          {achievement.name}
        </div>
        {achievement.rarity && (
          <div
            className="achievement-toast__rarity"
            style={{ color: RARITY_COLORS[achievement.rarity] || '#aaa' }}
          >
            {RARITY_LABELS[achievement.rarity] || achievement.rarity}
          </div>
        )}
      </div>
      <div className="achievement-toast__points">+{achievement.points}pt</div>
    </motion.div>
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
};

function AchievementToast({ achievements = [], onDismiss }) {
  const [items, setItems] = useState(achievements);

  useEffect(() => {
    if (achievements.length > 0) {
      setItems(achievements);
    }
  }, [achievements]);

  const handleDismiss = (id) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    if (onDismiss) onDismiss(id);
  };

  return (
    <div className="achievement-toast-container" aria-label="成就通知">
      <AnimatePresence>
        {items.map((achievement) => (
          <AchievementToastItem
            key={achievement.id}
            achievement={achievement}
            onDismiss={() => handleDismiss(achievement.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

AchievementToast.propTypes = {
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string,
      points: PropTypes.number,
      rarity: PropTypes.string,
    })
  ),
  onDismiss: PropTypes.func,
};

export { AchievementToastItem };
export default AchievementToast;
