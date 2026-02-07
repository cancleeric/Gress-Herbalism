/**
 * 觸控手勢 Hooks
 *
 * 提供移動端觸控優化相關的 React Hooks
 *
 * @module hooks/useTouch
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * 手勢方向常數
 */
export const SWIPE_DIRECTION = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down',
};

/**
 * 預設設定
 */
const DEFAULT_CONFIG = {
  longPressDelay: 500,
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  pinchThreshold: 0.1,
  doubleTapDelay: 300,
};

/**
 * 長按檢測 Hook
 *
 * @param {Function} callback - 長按觸發的回調函數
 * @param {Object} options - 選項
 * @param {number} options.delay - 長按延遲時間（毫秒）
 * @param {Function} options.onStart - 開始按壓回調
 * @param {Function} options.onCancel - 取消長按回調
 * @returns {Object} 事件處理器
 */
export function useLongPress(callback, options = {}) {
  const {
    delay = DEFAULT_CONFIG.longPressDelay,
    onStart,
    onCancel,
  } = options;

  const timeoutRef = useRef(null);
  const targetRef = useRef(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const start = useCallback(
    (event) => {
      // 取得觸控位置
      const touch = event.touches?.[0] || event;
      startPosRef.current = { x: touch.clientX, y: touch.clientY };

      isLongPressRef.current = false;
      targetRef.current = event.target;

      onStart?.(event);

      timeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        callback?.(event, targetRef.current);
      }, delay);
    },
    [callback, delay, onStart]
  );

  const move = useCallback(
    (event) => {
      // 如果移動超過閾值，取消長按
      const touch = event.touches?.[0] || event;
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      if (deltaX > 10 || deltaY > 10) {
        clear();
        onCancel?.(event);
      }
    },
    [clear, onCancel]
  );

  const end = useCallback(
    (event) => {
      const wasLongPress = isLongPressRef.current;
      clear();

      if (!wasLongPress) {
        onCancel?.(event);
      }

      isLongPressRef.current = false;
    },
    [clear, onCancel]
  );

  useEffect(() => {
    return clear;
  }, [clear]);

  return useMemo(
    () => ({
      onTouchStart: start,
      onTouchMove: move,
      onTouchEnd: end,
      onTouchCancel: end,
      // 也支援滑鼠事件（用於測試）
      onMouseDown: start,
      onMouseMove: move,
      onMouseUp: end,
      onMouseLeave: end,
    }),
    [start, move, end]
  );
}

/**
 * 滑動手勢 Hook
 *
 * @param {Object} callbacks - 回調函數
 * @param {Function} callbacks.onSwipeLeft - 左滑回調
 * @param {Function} callbacks.onSwipeRight - 右滑回調
 * @param {Function} callbacks.onSwipeUp - 上滑回調
 * @param {Function} callbacks.onSwipeDown - 下滑回調
 * @param {Function} callbacks.onSwipe - 任意滑動回調
 * @param {Object} options - 選項
 * @returns {Object} 事件處理器和狀態
 */
export function useSwipe(callbacks = {}, options = {}) {
  const {
    threshold = DEFAULT_CONFIG.swipeThreshold,
    velocityThreshold = DEFAULT_CONFIG.swipeVelocityThreshold,
    preventDefault = true,
  } = options;

  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setSwiping(true);
    setSwipeOffset({ x: 0, y: 0 });
  }, []);

  const handleTouchMove = useCallback(
    (event) => {
      if (!swiping) return;

      if (preventDefault) {
        event.preventDefault();
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;

      setSwipeOffset({ x: deltaX, y: deltaY });
    },
    [swiping, preventDefault]
  );

  const handleTouchEnd = useCallback(
    (event) => {
      if (!swiping) return;

      setSwiping(false);

      const deltaX = swipeOffset.x;
      const deltaY = swipeOffset.y;
      const deltaTime = Date.now() - startRef.current.time;

      // 計算速度
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // 判斷方向
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      let direction = null;

      if (absX > threshold || velocityX > velocityThreshold) {
        if (absX > absY) {
          direction = deltaX > 0 ? SWIPE_DIRECTION.RIGHT : SWIPE_DIRECTION.LEFT;
        }
      }

      if (absY > threshold || velocityY > velocityThreshold) {
        if (absY > absX) {
          direction = deltaY > 0 ? SWIPE_DIRECTION.DOWN : SWIPE_DIRECTION.UP;
        }
      }

      if (direction) {
        const swipeData = {
          direction,
          deltaX,
          deltaY,
          velocity: Math.max(velocityX, velocityY),
          duration: deltaTime,
        };

        callbacks.onSwipe?.(swipeData);

        switch (direction) {
          case SWIPE_DIRECTION.LEFT:
            callbacks.onSwipeLeft?.(swipeData);
            break;
          case SWIPE_DIRECTION.RIGHT:
            callbacks.onSwipeRight?.(swipeData);
            break;
          case SWIPE_DIRECTION.UP:
            callbacks.onSwipeUp?.(swipeData);
            break;
          case SWIPE_DIRECTION.DOWN:
            callbacks.onSwipeDown?.(swipeData);
            break;
          default:
            break;
        }
      }

      setSwipeOffset({ x: 0, y: 0 });
    },
    [swiping, swipeOffset, threshold, velocityThreshold, callbacks]
  );

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: () => {
        setSwiping(false);
        setSwipeOffset({ x: 0, y: 0 });
      },
    },
    swiping,
    swipeOffset,
  };
}

/**
 * 雙指縮放 Hook
 *
 * @param {Object} options - 選項
 * @param {number} options.minScale - 最小縮放比例
 * @param {number} options.maxScale - 最大縮放比例
 * @param {Function} options.onPinchStart - 開始縮放回調
 * @param {Function} options.onPinchMove - 縮放中回調
 * @param {Function} options.onPinchEnd - 結束縮放回調
 * @returns {Object} 事件處理器和狀態
 */
export function usePinchZoom(options = {}) {
  const {
    minScale = 0.5,
    maxScale = 3,
    onPinchStart,
    onPinchMove,
    onPinchEnd,
  } = options;

  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);

  // 計算兩個觸控點之間的距離
  const getDistance = useCallback((touches) => {
    if (touches.length < 2) return 0;

    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // 計算兩個觸控點的中心
  const getCenter = useCallback((touches) => {
    if (touches.length < 2) return { x: 0, y: 0 };

    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback(
    (event) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        setIsPinching(true);

        initialDistanceRef.current = getDistance(event.touches);
        initialScaleRef.current = scale;

        const center = getCenter(event.touches);
        setOrigin(center);

        onPinchStart?.({ scale, origin: center });
      }
    },
    [scale, getDistance, getCenter, onPinchStart]
  );

  const handleTouchMove = useCallback(
    (event) => {
      if (!isPinching || event.touches.length !== 2) return;

      event.preventDefault();

      const currentDistance = getDistance(event.touches);
      const scaleFactor = currentDistance / initialDistanceRef.current;
      let newScale = initialScaleRef.current * scaleFactor;

      // 限制縮放範圍
      newScale = Math.min(Math.max(newScale, minScale), maxScale);

      const center = getCenter(event.touches);
      setOrigin(center);
      setScale(newScale);

      onPinchMove?.({ scale: newScale, origin: center, scaleFactor });
    },
    [isPinching, getDistance, getCenter, minScale, maxScale, onPinchMove]
  );

  const handleTouchEnd = useCallback(
    (event) => {
      if (isPinching && event.touches.length < 2) {
        setIsPinching(false);
        onPinchEnd?.({ scale, origin });
      }
    },
    [isPinching, scale, origin, onPinchEnd]
  );

  // 重置縮放
  const resetScale = useCallback(() => {
    setScale(1);
    setOrigin({ x: 0, y: 0 });
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
    scale,
    isPinching,
    origin,
    resetScale,
    setScale,
  };
}

/**
 * 雙擊檢測 Hook
 *
 * @param {Function} callback - 雙擊回調
 * @param {Object} options - 選項
 * @param {number} options.delay - 雙擊間隔時間
 * @returns {Object} 事件處理器
 */
export function useDoubleTap(callback, options = {}) {
  const { delay = DEFAULT_CONFIG.doubleTapDelay } = options;

  const lastTapRef = useRef(0);
  const timeoutRef = useRef(null);

  const handleTap = useCallback(
    (event) => {
      const now = Date.now();
      const timeDiff = now - lastTapRef.current;

      if (timeDiff < delay && timeDiff > 0) {
        // 雙擊
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        callback?.(event);
      }

      lastTapRef.current = now;
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onTouchEnd: handleTap,
    onClick: handleTap,
  };
}

/**
 * 觸控反饋（震動）Hook
 *
 * @returns {Object} 震動函數
 */
export function useHapticFeedback() {
  const isSupported = useMemo(() => {
    return 'vibrate' in navigator;
  }, []);

  // 輕微震動（選擇項目）
  const light = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(10);
    }
  }, [isSupported]);

  // 中等震動（確認操作）
  const medium = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(25);
    }
  }, [isSupported]);

  // 強烈震動（錯誤或警告）
  const heavy = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(50);
    }
  }, [isSupported]);

  // 成功模式（短-短-長）
  const success = useCallback(() => {
    if (isSupported) {
      navigator.vibrate([10, 50, 10, 50, 30]);
    }
  }, [isSupported]);

  // 錯誤模式（長-短-長）
  const error = useCallback(() => {
    if (isSupported) {
      navigator.vibrate([50, 30, 50]);
    }
  }, [isSupported]);

  // 自定義模式
  const pattern = useCallback(
    (vibrationPattern) => {
      if (isSupported) {
        navigator.vibrate(vibrationPattern);
      }
    },
    [isSupported]
  );

  // 取消震動
  const cancel = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(0);
    }
  }, [isSupported]);

  return {
    isSupported,
    light,
    medium,
    heavy,
    success,
    error,
    pattern,
    cancel,
  };
}

/**
 * 多指選擇 Hook
 * 用於滑動選擇多張卡片
 *
 * @param {Object} options - 選項
 * @param {Array} options.items - 可選擇的項目列表
 * @param {Function} options.getItemRect - 取得項目位置的函數
 * @param {Function} options.onSelectionChange - 選擇變更回調
 * @returns {Object} 事件處理器和狀態
 */
export function useMultiSelect(options = {}) {
  const { items = [], getItemRect, onSelectionChange } = options;

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionRect, setSelectionRect] = useState(null);

  const startPosRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSelecting(true);
    setSelectedIds(new Set());
    setSelectionRect(null);
  }, []);

  const handleTouchMove = useCallback(
    (event) => {
      if (!isSelecting || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const x1 = Math.min(startPosRef.current.x, touch.clientX);
      const y1 = Math.min(startPosRef.current.y, touch.clientY);
      const x2 = Math.max(startPosRef.current.x, touch.clientX);
      const y2 = Math.max(startPosRef.current.y, touch.clientY);

      const rect = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
      setSelectionRect(rect);

      // 檢查哪些項目被選中
      if (getItemRect) {
        const newSelected = new Set();

        items.forEach((item) => {
          const itemRect = getItemRect(item);
          if (itemRect && rectsIntersect(rect, itemRect)) {
            newSelected.add(item.id || item.instanceId);
          }
        });

        setSelectedIds(newSelected);
      }
    },
    [isSelecting, items, getItemRect]
  );

  const handleTouchEnd = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      onSelectionChange?.(Array.from(selectedIds));
      setSelectionRect(null);
    }
  }, [isSelecting, selectedIds, onSelectionChange]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
    isSelecting,
    selectedIds: Array.from(selectedIds),
    selectionRect,
  };
}

/**
 * 檢查兩個矩形是否相交
 */
function rectsIntersect(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * 綜合手勢 Hook
 * 整合長按、滑動、縮放等手勢
 *
 * @param {Object} config - 配置
 * @returns {Object} 事件處理器和狀態
 */
export function useGestures(config = {}) {
  const {
    onLongPress,
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onDoubleTap,
    onPinch,
    enableLongPress = true,
    enableSwipe = true,
    enablePinch = true,
    enableDoubleTap = true,
    longPressDelay = DEFAULT_CONFIG.longPressDelay,
    swipeThreshold = DEFAULT_CONFIG.swipeThreshold,
  } = config;

  const longPress = useLongPress(enableLongPress ? onLongPress : null, {
    delay: longPressDelay,
  });

  const { handlers: swipeHandlers, swiping, swipeOffset } = useSwipe(
    enableSwipe
      ? {
          onSwipe,
          onSwipeLeft,
          onSwipeRight,
          onSwipeUp,
          onSwipeDown,
        }
      : {},
    { threshold: swipeThreshold }
  );

  const {
    handlers: pinchHandlers,
    scale,
    isPinching,
    origin,
    resetScale,
  } = usePinchZoom(
    enablePinch
      ? {
          onPinchMove: onPinch,
        }
      : {}
  );

  const doubleTapHandlers = useDoubleTap(enableDoubleTap ? onDoubleTap : null);

  // 合併所有事件處理器
  const handlers = useMemo(() => {
    return {
      onTouchStart: (e) => {
        longPress.onTouchStart?.(e);
        swipeHandlers.onTouchStart?.(e);
        pinchHandlers.onTouchStart?.(e);
      },
      onTouchMove: (e) => {
        longPress.onTouchMove?.(e);
        swipeHandlers.onTouchMove?.(e);
        pinchHandlers.onTouchMove?.(e);
      },
      onTouchEnd: (e) => {
        longPress.onTouchEnd?.(e);
        swipeHandlers.onTouchEnd?.(e);
        pinchHandlers.onTouchEnd?.(e);
        doubleTapHandlers.onTouchEnd?.(e);
      },
      onTouchCancel: (e) => {
        longPress.onTouchCancel?.(e);
        swipeHandlers.onTouchCancel?.(e);
        pinchHandlers.onTouchCancel?.(e);
      },
    };
  }, [longPress, swipeHandlers, pinchHandlers, doubleTapHandlers]);

  return {
    handlers,
    swiping,
    swipeOffset,
    scale,
    isPinching,
    origin,
    resetScale,
  };
}

export default {
  useLongPress,
  useSwipe,
  usePinchZoom,
  useDoubleTap,
  useHapticFeedback,
  useMultiSelect,
  useGestures,
  SWIPE_DIRECTION,
};
