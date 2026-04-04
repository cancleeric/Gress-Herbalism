/**
 * useAchievementNotification
 *
 * 管理成就解鎖通知 Toast 的狀態 Hook
 *
 * 用法：
 *   const { notifications, notify, dismiss } = useAchievementNotification();
 *   notify(achievement);          // 顯示通知
 *   dismiss(achievementId);       // 手動關閉
 */

import { useState, useCallback, useRef } from 'react';

/**
 * 取得成就的唯一 key
 * @param {Object} achievement
 * @returns {string}
 */
function getAchievementKey(achievement) {
  return achievement.id || achievement.name;
}

/**
 * 成就通知管理 Hook
 * @param {Object} options
 * @param {number} [options.maxNotifications=3] - 最多同時顯示幾個通知
 * @returns {{ notifications: Array, notify: Function, dismiss: Function, dismissAll: Function }}
 */
function useAchievementNotification({ maxNotifications = 3 } = {}) {
  const [notifications, setNotifications] = useState([]);

  /**
   * 顯示新成就通知
   * @param {Object} achievement - 成就物件（需含 id 或 name）
   */
  const notify = useCallback(
    (achievement) => {
      if (!achievement) return;

      const key = getAchievementKey(achievement);

      setNotifications((prev) => {
        // 避免重複
        if (prev.some((n) => getAchievementKey(n) === key)) return prev;

        const next = [...prev, achievement];
        // 若超過上限，移除最舊的
        return next.length > maxNotifications
          ? next.slice(next.length - maxNotifications)
          : next;
      });
    },
    [maxNotifications]
  );

  /**
   * 關閉指定通知
   * @param {string} key - achievement.id 或 achievement.name
   */
  const dismiss = useCallback((key) => {
    setNotifications((prev) =>
      prev.filter((n) => getAchievementKey(n) !== key)
    );
  }, []);

  /**
   * 關閉所有通知
   */
  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, notify, dismiss, dismissAll };
}

export default useAchievementNotification;
