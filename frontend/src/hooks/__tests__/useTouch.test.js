/**
 * useTouch Hooks 測試
 */

import { renderHook, act } from '@testing-library/react';
import {
  useLongPress,
  useSwipe,
  usePinchZoom,
  useDoubleTap,
  useHapticFeedback,
  useMultiSelect,
  useGestures,
  SWIPE_DIRECTION,
} from '../useTouch';

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

describe('useTouch Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useLongPress', () => {
    it('should trigger callback after delay', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useLongPress(callback, { delay: 500 }));

      const event = {
        touches: [{ clientX: 100, clientY: 100 }],
        target: document.createElement('div'),
      };

      act(() => {
        result.current.onTouchStart(event);
      });

      // 還沒到時間
      expect(callback).not.toHaveBeenCalled();

      // 經過延遲時間
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel if moved too much', () => {
      const callback = jest.fn();
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useLongPress(callback, { delay: 500, onCancel })
      );

      const startEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
        target: document.createElement('div'),
      };

      act(() => {
        result.current.onTouchStart(startEvent);
      });

      // 移動超過閾值
      const moveEvent = {
        touches: [{ clientX: 150, clientY: 150 }],
      };

      act(() => {
        result.current.onTouchMove(moveEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should call onStart when touch starts', () => {
      const onStart = jest.fn();
      const { result } = renderHook(() =>
        useLongPress(jest.fn(), { onStart })
      );

      const event = {
        touches: [{ clientX: 100, clientY: 100 }],
        target: document.createElement('div'),
      };

      act(() => {
        result.current.onTouchStart(event);
      });

      expect(onStart).toHaveBeenCalled();
    });
  });

  describe('useSwipe', () => {
    it('should detect left swipe', () => {
      const onSwipeLeft = jest.fn();
      const onSwipe = jest.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeLeft, onSwipe }, { threshold: 50 })
      );

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 200, clientY: 100 }],
        });
      });

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 100, clientY: 100 }],
          preventDefault: jest.fn(),
        });
      });

      act(() => {
        jest.advanceTimersByTime(100);
        result.current.handlers.onTouchEnd({});
      });

      expect(onSwipeLeft).toHaveBeenCalled();
      expect(onSwipe).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: SWIPE_DIRECTION.LEFT,
        })
      );
    });

    it('should detect right swipe', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeRight }, { threshold: 50 })
      );

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        });
      });

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 200, clientY: 100 }],
          preventDefault: jest.fn(),
        });
      });

      act(() => {
        jest.advanceTimersByTime(100);
        result.current.handlers.onTouchEnd({});
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should track swiping state', () => {
      const { result } = renderHook(() => useSwipe({}));

      expect(result.current.swiping).toBe(false);

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        });
      });

      expect(result.current.swiping).toBe(true);

      act(() => {
        result.current.handlers.onTouchEnd({});
      });

      expect(result.current.swiping).toBe(false);
    });

    it('should track swipe offset', () => {
      const { result } = renderHook(() => useSwipe({}, { preventDefault: false }));

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        });
      });

      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 150, clientY: 120 }],
          preventDefault: jest.fn(),
        });
      });

      expect(result.current.swipeOffset).toEqual({ x: 50, y: 20 });
    });
  });

  describe('usePinchZoom', () => {
    it('should detect pinch gesture', () => {
      const onPinchStart = jest.fn();
      const onPinchMove = jest.fn();
      const { result } = renderHook(() =>
        usePinchZoom({ onPinchStart, onPinchMove })
      );

      // 開始雙指觸控
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 100 },
          ],
          preventDefault: jest.fn(),
        });
      });

      expect(onPinchStart).toHaveBeenCalled();
      expect(result.current.isPinching).toBe(true);

      // 放大手勢
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [
            { clientX: 50, clientY: 100 },
            { clientX: 250, clientY: 100 },
          ],
          preventDefault: jest.fn(),
        });
      });

      expect(onPinchMove).toHaveBeenCalled();
      expect(result.current.scale).toBeGreaterThan(1);
    });

    it('should respect min and max scale', () => {
      const { result } = renderHook(() =>
        usePinchZoom({ minScale: 0.5, maxScale: 2 })
      );

      // 開始雙指觸控
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 100 },
          ],
          preventDefault: jest.fn(),
        });
      });

      // 嘗試極端放大
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [
            { clientX: 0, clientY: 100 },
            { clientX: 500, clientY: 100 },
          ],
          preventDefault: jest.fn(),
        });
      });

      expect(result.current.scale).toBeLessThanOrEqual(2);
    });

    it('should reset scale', () => {
      const { result } = renderHook(() => usePinchZoom({}));

      act(() => {
        result.current.setScale(2);
      });

      expect(result.current.scale).toBe(2);

      act(() => {
        result.current.resetScale();
      });

      expect(result.current.scale).toBe(1);
    });
  });

  describe('useDoubleTap', () => {
    it('should detect double tap', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDoubleTap(callback, { delay: 300 }));

      const event = { target: document.createElement('div') };

      // 第一次點擊
      act(() => {
        result.current.onTouchEnd(event);
      });

      expect(callback).not.toHaveBeenCalled();

      // 第二次點擊（在延遲內）
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.onTouchEnd(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not trigger if taps are too far apart', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDoubleTap(callback, { delay: 300 }));

      const event = { target: document.createElement('div') };

      act(() => {
        result.current.onTouchEnd(event);
      });

      // 等待超過延遲
      act(() => {
        jest.advanceTimersByTime(400);
        result.current.onTouchEnd(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('useHapticFeedback', () => {
    it('should check vibration support', () => {
      const { result } = renderHook(() => useHapticFeedback());
      expect(result.current.isSupported).toBe(true);
    });

    it('should trigger light vibration', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.light();
      });

      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should trigger medium vibration', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.medium();
      });

      expect(mockVibrate).toHaveBeenCalledWith(25);
    });

    it('should trigger heavy vibration', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.heavy();
      });

      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('should trigger success pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.success();
      });

      expect(mockVibrate).toHaveBeenCalledWith([10, 50, 10, 50, 30]);
    });

    it('should trigger error pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.error();
      });

      expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50]);
    });

    it('should cancel vibration', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.cancel();
      });

      expect(mockVibrate).toHaveBeenCalledWith(0);
    });

    it('should trigger custom pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      const pattern = [100, 50, 100];

      act(() => {
        result.current.pattern(pattern);
      });

      expect(mockVibrate).toHaveBeenCalledWith(pattern);
    });
  });

  describe('useMultiSelect', () => {
    it('should track selection state', () => {
      const { result } = renderHook(() => useMultiSelect({}));

      expect(result.current.isSelecting).toBe(false);
      expect(result.current.selectedIds).toEqual([]);
    });

    it('should start selection on touch', () => {
      const { result } = renderHook(() => useMultiSelect({}));

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        });
      });

      expect(result.current.isSelecting).toBe(true);
    });

    it('should end selection on touch end', () => {
      const onSelectionChange = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelect({ onSelectionChange })
      );

      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        });
      });

      act(() => {
        result.current.handlers.onTouchEnd({});
      });

      expect(result.current.isSelecting).toBe(false);
    });
  });

  describe('useGestures', () => {
    it('should combine all gesture handlers', () => {
      const onLongPress = jest.fn();
      const onSwipeLeft = jest.fn();

      const { result } = renderHook(() =>
        useGestures({
          onLongPress,
          onSwipeLeft,
          enableLongPress: true,
          enableSwipe: true,
        })
      );

      expect(result.current.handlers).toHaveProperty('onTouchStart');
      expect(result.current.handlers).toHaveProperty('onTouchMove');
      expect(result.current.handlers).toHaveProperty('onTouchEnd');
      expect(result.current.handlers).toHaveProperty('onTouchCancel');
    });

    it('should track pinch scale', () => {
      const { result } = renderHook(() => useGestures({ enablePinch: true }));

      expect(result.current.scale).toBe(1);
      expect(result.current.isPinching).toBe(false);
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useGestures({ enablePinch: true }));

      expect(typeof result.current.resetScale).toBe('function');
    });
  });

  describe('SWIPE_DIRECTION', () => {
    it('should export direction constants', () => {
      expect(SWIPE_DIRECTION.LEFT).toBe('left');
      expect(SWIPE_DIRECTION.RIGHT).toBe('right');
      expect(SWIPE_DIRECTION.UP).toBe('up');
      expect(SWIPE_DIRECTION.DOWN).toBe('down');
    });
  });
});
