/**
 * 動畫控制 Hooks
 *
 * @module components/games/evolution/animations/useAnimation
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * 動畫佇列管理 Hook
 * 獨立的動畫狀態管理，不依賴 Redux
 */
export function useAnimationQueue() {
  const [queue, setQueue] = useState([]);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    speed: 1,
    reducedMotion: false,
  });

  // 加入動畫到佇列
  const enqueue = useCallback((animation) => {
    const newAnimation = {
      id: `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...animation,
    };

    setQueue((prev) => {
      const updated = [...prev, newAnimation];
      // 按優先級排序
      return updated.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    });
  }, []);

  // 批次加入動畫
  const enqueueBatch = useCallback((animations) => {
    const newAnimations = animations.map((anim, index) => ({
      id: `anim_${Date.now()}_${index}`,
      timestamp: Date.now(),
      ...anim,
    }));

    setQueue((prev) => {
      const updated = [...prev, ...newAnimations];
      return updated.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    });
  }, []);

  // 播放下一個動畫
  const playNext = useCallback(() => {
    setQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        setCurrentAnimation(next);
        setIsPlaying(true);
        return rest;
      }
      return prev;
    });
  }, []);

  // 動畫完成
  const complete = useCallback(() => {
    setCurrentAnimation(null);
    setIsPlaying(false);
  }, []);

  // 取消當前動畫
  const cancel = useCallback(() => {
    setCurrentAnimation(null);
    setIsPlaying(false);
  }, []);

  // 清空佇列
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // 跳過所有動畫
  const skipAll = useCallback(() => {
    setQueue([]);
    setCurrentAnimation(null);
    setIsPlaying(false);
  }, []);

  // 更新設定
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return {
    queue,
    currentAnimation,
    isPlaying,
    settings,
    queueLength: queue.length,
    enqueue,
    enqueueBatch,
    playNext,
    complete,
    cancel,
    clearQueue,
    skipAll,
    updateSettings,
  };
}

/**
 * 動畫控制 Hook
 * 提供便捷的動畫觸發方法
 */
export function useAnimationControl(animationQueue) {
  const { enqueue, enqueueBatch, skipAll, updateSettings, isPlaying, queueLength } = animationQueue;

  // 播放攻擊動畫
  const playAttack = useCallback((attackerId, defenderId) => {
    enqueue({
      type: 'attack',
      priority: 10,
      data: { attackerId, defenderId },
    });
  }, [enqueue]);

  // 播放進食動畫
  const playFeed = useCallback((creatureId, fromPosition, toPosition) => {
    enqueue({
      type: 'feed',
      priority: 5,
      data: { creatureId, fromPosition, toPosition },
    });
  }, [enqueue]);

  // 播放死亡動畫
  const playDeath = useCallback((creatureId) => {
    enqueue({
      type: 'death',
      priority: 8,
      data: { creatureId },
    });
  }, [enqueue]);

  // 播放階段轉換動畫
  const playPhaseTransition = useCallback((phase) => {
    enqueue({
      type: 'phase',
      priority: 15, // 高優先級
      data: { phase },
    });
  }, [enqueue]);

  // 播放飽足動畫
  const playSatisfied = useCallback((creatureId) => {
    enqueue({
      type: 'satisfied',
      priority: 3,
      data: { creatureId },
    });
  }, [enqueue]);

  // 批次播放動畫
  const playBatch = useCallback((animations) => {
    enqueueBatch(animations);
  }, [enqueueBatch]);

  // 跳過所有動畫
  const skip = useCallback(() => {
    skipAll();
  }, [skipAll]);

  // 更新設定
  const setSettings = useCallback((newSettings) => {
    updateSettings(newSettings);
  }, [updateSettings]);

  return {
    isPlaying,
    queueLength,
    playAttack,
    playFeed,
    playDeath,
    playPhaseTransition,
    playSatisfied,
    playBatch,
    skip,
    setSettings,
  };
}
