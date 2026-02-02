/**
 * 動畫 Slice 測試
 *
 * @module store/evolution/__tests__/animationSlice.test
 */

import reducer, {
  enqueue,
  enqueueBatch,
  playNext,
  complete,
  cancel,
  clearQueue,
  skipAll,
  updateSettings,
  selectCurrentAnimation,
  selectIsPlaying,
  selectQueueLength,
  selectAnimationSettings,
} from '../animationSlice';

describe('animationSlice', () => {
  const initialState = {
    queue: [],
    currentAnimation: null,
    isPlaying: false,
    settings: {
      enabled: true,
      speed: 1,
      reducedMotion: false,
    },
  };

  describe('reducers', () => {
    it('should return initial state', () => {
      expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    describe('enqueue', () => {
      it('should add animation to queue', () => {
        const animation = { type: 'attack', data: { attackerId: '1' } };
        const state = reducer(initialState, enqueue(animation));

        expect(state.queue.length).toBe(1);
        expect(state.queue[0].type).toBe('attack');
        expect(state.queue[0].id).toBeDefined();
        expect(state.queue[0].timestamp).toBeDefined();
      });

      it('should sort queue by priority', () => {
        let state = reducer(initialState, enqueue({ type: 'feed', priority: 5 }));
        state = reducer(state, enqueue({ type: 'phase', priority: 15 }));
        state = reducer(state, enqueue({ type: 'death', priority: 8 }));

        expect(state.queue[0].type).toBe('phase');
        expect(state.queue[1].type).toBe('death');
        expect(state.queue[2].type).toBe('feed');
      });
    });

    describe('enqueueBatch', () => {
      it('should add multiple animations to queue', () => {
        const animations = [
          { type: 'attack', priority: 10 },
          { type: 'feed', priority: 5 },
        ];
        const state = reducer(initialState, enqueueBatch(animations));

        expect(state.queue.length).toBe(2);
        expect(state.queue[0].type).toBe('attack');
        expect(state.queue[1].type).toBe('feed');
      });
    });

    describe('playNext', () => {
      it('should move first queue item to currentAnimation', () => {
        const stateWithQueue = {
          ...initialState,
          queue: [
            { id: 'anim1', type: 'attack' },
            { id: 'anim2', type: 'feed' },
          ],
        };
        const state = reducer(stateWithQueue, playNext());

        expect(state.currentAnimation.id).toBe('anim1');
        expect(state.isPlaying).toBe(true);
        expect(state.queue.length).toBe(1);
      });

      it('should do nothing if queue is empty', () => {
        const state = reducer(initialState, playNext());

        expect(state.currentAnimation).toBeNull();
        expect(state.isPlaying).toBe(false);
      });
    });

    describe('complete', () => {
      it('should clear currentAnimation and set isPlaying to false', () => {
        const playingState = {
          ...initialState,
          currentAnimation: { id: 'anim1', type: 'attack' },
          isPlaying: true,
        };
        const state = reducer(playingState, complete());

        expect(state.currentAnimation).toBeNull();
        expect(state.isPlaying).toBe(false);
      });
    });

    describe('cancel', () => {
      it('should clear currentAnimation and set isPlaying to false', () => {
        const playingState = {
          ...initialState,
          currentAnimation: { id: 'anim1', type: 'attack' },
          isPlaying: true,
        };
        const state = reducer(playingState, cancel());

        expect(state.currentAnimation).toBeNull();
        expect(state.isPlaying).toBe(false);
      });
    });

    describe('clearQueue', () => {
      it('should clear the queue', () => {
        const stateWithQueue = {
          ...initialState,
          queue: [{ id: 'anim1', type: 'attack' }],
        };
        const state = reducer(stateWithQueue, clearQueue());

        expect(state.queue).toEqual([]);
      });
    });

    describe('skipAll', () => {
      it('should clear queue and currentAnimation', () => {
        const playingState = {
          ...initialState,
          queue: [{ id: 'anim2', type: 'feed' }],
          currentAnimation: { id: 'anim1', type: 'attack' },
          isPlaying: true,
        };
        const state = reducer(playingState, skipAll());

        expect(state.queue).toEqual([]);
        expect(state.currentAnimation).toBeNull();
        expect(state.isPlaying).toBe(false);
      });
    });

    describe('updateSettings', () => {
      it('should update settings', () => {
        const state = reducer(initialState, updateSettings({ speed: 2 }));

        expect(state.settings.speed).toBe(2);
        expect(state.settings.enabled).toBe(true);
      });

      it('should merge settings', () => {
        const state = reducer(initialState, updateSettings({ reducedMotion: true }));

        expect(state.settings.reducedMotion).toBe(true);
        expect(state.settings.speed).toBe(1);
        expect(state.settings.enabled).toBe(true);
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      animation: {
        queue: [{ id: 'anim1' }, { id: 'anim2' }],
        currentAnimation: { id: 'anim0', type: 'attack' },
        isPlaying: true,
        settings: { enabled: true, speed: 2, reducedMotion: false },
      },
    };

    it('selectCurrentAnimation should return currentAnimation', () => {
      expect(selectCurrentAnimation(mockState)).toEqual({ id: 'anim0', type: 'attack' });
    });

    it('selectIsPlaying should return isPlaying', () => {
      expect(selectIsPlaying(mockState)).toBe(true);
    });

    it('selectQueueLength should return queue length', () => {
      expect(selectQueueLength(mockState)).toBe(2);
    });

    it('selectAnimationSettings should return settings', () => {
      expect(selectAnimationSettings(mockState)).toEqual({
        enabled: true,
        speed: 2,
        reducedMotion: false,
      });
    });

    it('selectors should handle undefined state', () => {
      const emptyState = {};
      expect(selectCurrentAnimation(emptyState)).toBeUndefined();
      expect(selectIsPlaying(emptyState)).toBe(false);
      expect(selectQueueLength(emptyState)).toBe(0);
      expect(selectAnimationSettings(emptyState)).toEqual({
        enabled: true,
        speed: 1,
        reducedMotion: false,
      });
    });
  });
});
