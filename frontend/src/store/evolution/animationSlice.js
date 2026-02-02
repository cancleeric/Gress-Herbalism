/**
 * 演化論遊戲動畫狀態管理
 *
 * @module store/evolution/animationSlice
 */

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
export const selectCurrentAnimation = (state) => state.animation?.currentAnimation;
export const selectIsPlaying = (state) => state.animation?.isPlaying ?? false;
export const selectQueueLength = (state) => state.animation?.queue?.length ?? 0;
export const selectAnimationSettings = (state) => state.animation?.settings ?? initialState.settings;

export default animationSlice.reducer;
