/**
 * 效能優化工具函數
 *
 * @module utils/performance
 */

/**
 * 防抖函數
 * 在事件停止觸發後延遲執行
 *
 * @param {Function} func - 要執行的函數
 * @param {number} wait - 等待時間（毫秒）
 * @param {Object} options - 選項
 * @param {boolean} options.leading - 是否在開始時執行
 * @param {boolean} options.trailing - 是否在結束時執行
 * @returns {Function} 防抖後的函數
 */
export function debounce(func, wait = 300, options = {}) {
  const { leading = false, trailing = true } = options;

  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = null;
  let result = null;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastCallTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = lastCallTime === null ? wait : time - lastCallTime;
    return lastCallTime === null || timeSinceLastCall >= wait;
  }

  function trailingEdge(time) {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    lastThis = null;
    return result;
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, wait - (time - lastCallTime));
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;

    if (isInvoking) {
      if (timeoutId === null) {
        lastCallTime = time;
        if (leading) {
          return invokeFunc(time);
        }
        timeoutId = setTimeout(timerExpired, wait);
        return result;
      }
    }

    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, wait);
    }

    return result;
  }

  debounced.cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = null;
    timeoutId = null;
  };

  debounced.flush = function () {
    if (timeoutId !== null) {
      return trailingEdge(Date.now());
    }
    return result;
  };

  return debounced;
}

/**
 * 節流函數
 * 限制函數在指定時間內只能執行一次
 *
 * @param {Function} func - 要執行的函數
 * @param {number} wait - 等待時間（毫秒）
 * @param {Object} options - 選項
 * @param {boolean} options.leading - 是否在開始時執行
 * @param {boolean} options.trailing - 是否在結束時執行
 * @returns {Function} 節流後的函數
 */
export function throttle(func, wait = 100, options = {}) {
  const { leading = true, trailing = true } = options;

  let timeoutId = null;
  let lastCallTime = 0;
  let lastArgs = null;
  let lastThis = null;

  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    func.apply(thisArg, args);
  }

  function throttled(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    lastArgs = args;
    lastThis = this;

    if (timeSinceLastCall >= wait) {
      if (leading) {
        lastCallTime = now;
        invokeFunc();
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          timeoutId = null;
          invokeFunc();
        }, wait);
      }
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        invokeFunc();
      }, wait - timeSinceLastCall);
    }
  }

  throttled.cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}

/**
 * 請求動畫幀節流
 * 使用 requestAnimationFrame 進行節流
 *
 * @param {Function} func - 要執行的函數
 * @returns {Function} RAF 節流後的函數
 */
export function rafThrottle(func) {
  let rafId = null;
  let lastArgs = null;

  function throttled(...args) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, lastArgs);
        rafId = null;
      });
    }
  }

  throttled.cancel = function () {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
}

/**
 * 空閒時間執行
 * 在瀏覽器空閒時執行任務
 *
 * @param {Function} func - 要執行的函數
 * @param {Object} options - 選項
 * @param {number} options.timeout - 超時時間
 * @returns {Function} 包裝後的函數
 */
export function idleCallback(func, options = {}) {
  const { timeout = 1000 } = options;

  if ('requestIdleCallback' in window) {
    return function (...args) {
      return window.requestIdleCallback(
        () => func.apply(this, args),
        { timeout }
      );
    };
  }

  // 降級到 setTimeout
  return function (...args) {
    return setTimeout(() => func.apply(this, args), 1);
  };
}

/**
 * 記憶化函數
 * 快取函數結果
 *
 * @param {Function} func - 要記憶化的函數
 * @param {Function} resolver - 快取鍵生成函數
 * @returns {Function} 記憶化後的函數
 */
export function memoize(func, resolver) {
  const cache = new Map();

  function memoized(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  }

  memoized.cache = cache;

  memoized.clear = function () {
    cache.clear();
  };

  return memoized;
}

/**
 * 批次更新
 * 將多次更新合併為一次
 *
 * @param {Function} func - 批次處理函數
 * @param {Object} options - 選項
 * @returns {Object} 批次更新器
 */
export function createBatchUpdater(func, options = {}) {
  const { maxBatchSize = 100, maxWaitTime = 16 } = options;

  let batch = [];
  let timeoutId = null;

  function flush() {
    if (batch.length === 0) return;

    const items = batch;
    batch = [];
    timeoutId = null;

    func(items);
  }

  function add(item) {
    batch.push(item);

    if (batch.length >= maxBatchSize) {
      flush();
    } else if (timeoutId === null) {
      timeoutId = setTimeout(flush, maxWaitTime);
    }
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    batch = [];
  }

  return { add, flush, cancel };
}

/**
 * 效能測量裝飾器
 *
 * @param {string} name - 測量名稱
 * @returns {Function} 裝飾器函數
 */
export function measure(name) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const end = performance.now();

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Perf] ${name}: ${(end - start).toFixed(2)}ms`);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * 檢測是否支援 GPU 加速
 *
 * @returns {boolean}
 */
export function supportsGPUAcceleration() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * 取得效能相關的 CSS 類別
 *
 * @returns {Object}
 */
export function getPerformanceClasses() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEndDevice = navigator.hardwareConcurrency <= 2;
  const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;

  return {
    'reduce-motion': prefersReducedMotion,
    'low-end-device': isLowEndDevice,
    'low-memory': hasLowMemory,
    'gpu-accelerated': supportsGPUAcceleration(),
  };
}

export default {
  debounce,
  throttle,
  rafThrottle,
  idleCallback,
  memoize,
  createBatchUpdater,
  measure,
  supportsGPUAcceleration,
  getPerformanceClasses,
};
