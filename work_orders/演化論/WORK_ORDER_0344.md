# 工單 0344：動畫管理器

## 基本資訊
- **工單編號**：0344
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0342、0343（動畫系統）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/animations/AnimationManager.jsx`（新增）
  - `frontend/src/store/evolution/animationSlice.js`（新增）

---

## 目標

建立動畫管理器，統一控制遊戲動畫：
1. 動畫佇列管理
2. 動畫優先級
3. 並行/序列執行
4. 動畫狀態追蹤

---

## 詳細規格

### 1. 動畫 Store Slice

```javascript
// frontend/src/store/evolution/animationSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // 動畫佇列
  queue: [],

  // 當前播放的動畫
  currentAnimation: null,

  // 是否正在播放
  isPlaying: false,

  // 動畫設定
  settings: {
    enabled: true,
    speed: 1, // 1 = 正常, 2 = 快速
    reducedMotion: false,
  },
};

export const animationSlice = createSlice({
  name: 'animation',
  initialState,
  reducers: {
    // 加入動畫到佇列
    enqueue: (state, action) => {
      const animation = {
        id: `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...action.payload,
      };
      state.queue.push(animation);

      // 按優先級排序
      state.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    },

    // 批次加入動畫
    enqueueBatch: (state, action) => {
      const animations = action.payload.map((anim, index) => ({
        id: `anim_${Date.now()}_${index}`,
        timestamp: Date.now(),
        ...anim,
      }));
      state.queue.push(...animations);
      state.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    },

    // 開始播放下一個動畫
    playNext: (state) => {
      if (state.queue.length > 0) {
        state.currentAnimation = state.queue.shift();
        state.isPlaying = true;
      }
    },

    // 動畫完成
    complete: (state) => {
      state.currentAnimation = null;
      state.isPlaying = false;
    },

    // 取消當前動畫
    cancel: (state) => {
      state.currentAnimation = null;
      state.isPlaying = false;
    },

    // 清空佇列
    clearQueue: (state) => {
      state.queue = [];
    },

    // 跳過所有動畫
    skipAll: (state) => {
      state.queue = [];
      state.currentAnimation = null;
      state.isPlaying = false;
    },

    // 更新設定
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

export const {
  enqueue,
  enqueueBatch,
  playNext,
  complete,
  cancel,
  clearQueue,
  skipAll,
  updateSettings,
} = animationSlice.actions;

// Selectors
export const selectCurrentAnimation = (state) => state.animation.currentAnimation;
export const selectIsPlaying = (state) => state.animation.isPlaying;
export const selectQueueLength = (state) => state.animation.queue.length;
export const selectAnimationSettings = (state) => state.animation.settings;

export default animationSlice.reducer;
```

### 2. 動畫管理器組件

```jsx
// frontend/src/components/games/evolution/animations/AnimationManager.jsx

import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import {
  selectCurrentAnimation,
  selectIsPlaying,
  selectAnimationSettings,
  playNext,
  complete,
} from '../../../../store/evolution/animationSlice';
import {
  AttackAnimation,
  FeedAnimation,
  DeathAnimation,
  PhaseTransition,
  SatisfiedAnimation,
} from './AnimatedEvent';
import './AnimationManager.css';

/**
 * 動畫管理器
 * 統一管理和播放遊戲動畫
 */
export const AnimationManager = () => {
  const dispatch = useDispatch();
  const currentAnimation = useSelector(selectCurrentAnimation);
  const isPlaying = useSelector(selectIsPlaying);
  const settings = useSelector(selectAnimationSettings);

  // 動畫完成處理
  const handleAnimationComplete = useCallback(() => {
    dispatch(complete());
  }, [dispatch]);

  // 檢查佇列並播放下一個
  useEffect(() => {
    if (!isPlaying) {
      dispatch(playNext());
    }
  }, [isPlaying, dispatch]);

  // 動畫禁用時直接跳過
  useEffect(() => {
    if (!settings.enabled && currentAnimation) {
      handleAnimationComplete();
    }
  }, [settings.enabled, currentAnimation, handleAnimationComplete]);

  // 渲染當前動畫
  const renderAnimation = () => {
    if (!currentAnimation || !settings.enabled) {
      return null;
    }

    const { type, data } = currentAnimation;

    switch (type) {
      case 'attack':
        return (
          <AttackAnimation
            show={true}
            onComplete={handleAnimationComplete}
          />
        );

      case 'feed':
        return (
          <FeedAnimation
            show={true}
            fromPosition={data.fromPosition}
            toPosition={data.toPosition}
            onComplete={handleAnimationComplete}
          />
        );

      case 'death':
        return (
          <DeathAnimation
            show={true}
            onComplete={handleAnimationComplete}
          />
        );

      case 'phase':
        return (
          <PhaseTransition
            phase={data.phase}
            show={true}
            onComplete={handleAnimationComplete}
          />
        );

      case 'satisfied':
        return (
          <SatisfiedAnimation
            show={true}
            onComplete={handleAnimationComplete}
          />
        );

      default:
        // 未知動畫類型，直接完成
        handleAnimationComplete();
        return null;
    }
  };

  return (
    <div
      className={`animation-manager ${settings.reducedMotion ? 'animation-manager--reduced' : ''}`}
      style={{ '--animation-speed': settings.speed }}
    >
      <AnimatePresence mode="wait">
        {renderAnimation()}
      </AnimatePresence>
    </div>
  );
};

export default AnimationManager;
```

### 3. 動畫 Hooks

```jsx
// frontend/src/components/games/evolution/animations/useAnimation.js

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  enqueue,
  enqueueBatch,
  skipAll,
  updateSettings,
  selectIsPlaying,
  selectQueueLength,
} from '../../../../store/evolution/animationSlice';

/**
 * 動畫控制 Hook
 */
export function useAnimationControl() {
  const dispatch = useDispatch();
  const isPlaying = useSelector(selectIsPlaying);
  const queueLength = useSelector(selectQueueLength);

  // 播放攻擊動畫
  const playAttack = useCallback((attackerId, defenderId) => {
    dispatch(enqueue({
      type: 'attack',
      priority: 10,
      data: { attackerId, defenderId },
    }));
  }, [dispatch]);

  // 播放進食動畫
  const playFeed = useCallback((creatureId, fromPosition, toPosition) => {
    dispatch(enqueue({
      type: 'feed',
      priority: 5,
      data: { creatureId, fromPosition, toPosition },
    }));
  }, [dispatch]);

  // 播放死亡動畫
  const playDeath = useCallback((creatureId) => {
    dispatch(enqueue({
      type: 'death',
      priority: 8,
      data: { creatureId },
    }));
  }, [dispatch]);

  // 播放階段轉換動畫
  const playPhaseTransition = useCallback((phase) => {
    dispatch(enqueue({
      type: 'phase',
      priority: 15, // 高優先級
      data: { phase },
    }));
  }, [dispatch]);

  // 批次播放動畫
  const playBatch = useCallback((animations) => {
    dispatch(enqueueBatch(animations));
  }, [dispatch]);

  // 跳過所有動畫
  const skip = useCallback(() => {
    dispatch(skipAll());
  }, [dispatch]);

  // 更新設定
  const setSettings = useCallback((settings) => {
    dispatch(updateSettings(settings));
  }, [dispatch]);

  return {
    isPlaying,
    queueLength,
    playAttack,
    playFeed,
    playDeath,
    playPhaseTransition,
    playBatch,
    skip,
    setSettings,
  };
}
```

### 4. 樣式

```css
/* frontend/src/components/games/evolution/animations/AnimationManager.css */

.animation-manager {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
}

/* 減少動畫模式 */
.animation-manager--reduced * {
  animation-duration: 0.1s !important;
  transition-duration: 0.1s !important;
}

/* 動畫速度控制 */
.animation-manager * {
  animation-duration: calc(var(--animation-speed, 1) * var(--base-duration, 1s));
}
```

---

## 驗收標準

1. [ ] 動畫佇列正確管理
2. [ ] 優先級排序正確
3. [ ] 動畫序列播放正確
4. [ ] 跳過功能正常
5. [ ] 設定控制正常
6. [ ] Hook API 易用
7. [ ] 與遊戲邏輯整合正常

---

## 備註

- 動畫管理器確保動畫有序播放
- 支援減少動畫模式（無障礙）
