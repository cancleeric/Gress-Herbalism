/**
 * 成就解鎖通知彈窗（Toast）
 * 成就解鎖時顯示，自動消失，支援佇列
 */

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './AchievementToast.css';

/**
 * 單一成就 Toast 通知
 */
export function AchievementToastItem({ achievement, onDismiss, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div
      className="achievement-toast"
      role="alert"
      aria-live="polite"
      onClick={onDismiss}
    >
      <div className="achievement-toast__icon">{achievement.icon}</div>
      <div className="achievement-toast__content">
        <div className="achievement-toast__title">🏅 成就解鎖！</div>
        <div className="achievement-toast__name">{achievement.name}</div>
        {achievement.points != null && (
          <div className="achievement-toast__points">+{achievement.points} 點</div>
        )}
      </div>
      <button
        className="achievement-toast__close"
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        aria-label="關閉通知"
      >
        ✕
      </button>
    </div>
  );
}

AchievementToastItem.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    points: PropTypes.number,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
  duration: PropTypes.number,
};

/**
 * Toast 容器：管理多個通知的佇列
 */
function AchievementToast({ toasts, onDismiss }) {
  const handleDismiss = useCallback(
    (id) => {
      onDismiss(id);
    },
    [onDismiss]
  );

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="achievement-toast-container" aria-label="成就通知">
      {toasts.map((toast) => (
        <AchievementToastItem
          key={toast.id}
          achievement={toast}
          onDismiss={() => handleDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

AchievementToast.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      points: PropTypes.number,
    })
  ),
  onDismiss: PropTypes.func.isRequired,
};

export default AchievementToast;
