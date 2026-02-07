/**
 * 效能工具函數測試
 *
 * @file utils/performance.test.js
 */

import {
  debounce,
  throttle,
  rafThrottle,
  memoize,
  createBatchUpdater,
} from './performance';

// 模擬 requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

describe('performance utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('應該延遲執行函數', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('應該在多次調用時只執行最後一次', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc('a');
      debouncedFunc('b');
      debouncedFunc('c');

      jest.advanceTimersByTime(300);
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('c');
    });

    it('leading 選項應該在開始時執行', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300, { leading: true, trailing: false });

      debouncedFunc('a');
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('a');

      debouncedFunc('b');
      jest.advanceTimersByTime(300);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('cancel 應該取消待執行的調用', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc();
      debouncedFunc.cancel();

      jest.advanceTimersByTime(300);
      expect(func).not.toHaveBeenCalled();
    });

    it('flush 應該立即執行待執行的調用', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc('test');
      debouncedFunc.flush();

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('test');
    });
  });

  describe('throttle', () => {
    it('應該限制函數執行頻率', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc();
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('leading: false 應該不在開始時執行', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100, { leading: false });

      throttledFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('trailing: false 應該不在結束時執行', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100, { trailing: false });

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc();
      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('cancel 應該取消待執行的調用', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);

      throttledFunc();
      throttledFunc();
      throttledFunc.cancel();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('rafThrottle', () => {
    it('應該使用 requestAnimationFrame 節流', () => {
      const func = jest.fn();
      const rafThrottledFunc = rafThrottle(func);

      rafThrottledFunc('a');
      rafThrottledFunc('b');
      rafThrottledFunc('c');

      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(16);
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('c');
    });

    it('cancel 應該取消待執行的調用', () => {
      const func = jest.fn();
      const rafThrottledFunc = rafThrottle(func);

      rafThrottledFunc();
      rafThrottledFunc.cancel();

      jest.advanceTimersByTime(16);
      expect(func).not.toHaveBeenCalled();
    });
  });

  describe('memoize', () => {
    it('應該快取函數結果', () => {
      const func = jest.fn((x) => x * 2);
      const memoizedFunc = memoize(func);

      expect(memoizedFunc(5)).toBe(10);
      expect(memoizedFunc(5)).toBe(10);
      expect(func).toHaveBeenCalledTimes(1);

      expect(memoizedFunc(10)).toBe(20);
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('應該支援自訂 resolver', () => {
      const func = jest.fn((obj) => obj.value * 2);
      const memoizedFunc = memoize(func, (obj) => obj.id);

      expect(memoizedFunc({ id: 1, value: 5 })).toBe(10);
      expect(memoizedFunc({ id: 1, value: 100 })).toBe(10);
      expect(func).toHaveBeenCalledTimes(1);

      expect(memoizedFunc({ id: 2, value: 5 })).toBe(10);
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('clear 應該清除快取', () => {
      const func = jest.fn((x) => x * 2);
      const memoizedFunc = memoize(func);

      memoizedFunc(5);
      memoizedFunc.clear();
      memoizedFunc(5);

      expect(func).toHaveBeenCalledTimes(2);
    });

    it('應該暴露 cache', () => {
      const func = jest.fn((x) => x * 2);
      const memoizedFunc = memoize(func);

      memoizedFunc(5);
      expect(memoizedFunc.cache.has(5)).toBe(true);
      expect(memoizedFunc.cache.get(5)).toBe(10);
    });
  });

  describe('createBatchUpdater', () => {
    it('應該批次處理更新', () => {
      const func = jest.fn();
      const batcher = createBatchUpdater(func, { maxWaitTime: 16 });

      batcher.add('a');
      batcher.add('b');
      batcher.add('c');

      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(16);
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith(['a', 'b', 'c']);
    });

    it('達到 maxBatchSize 時應該立即執行', () => {
      const func = jest.fn();
      const batcher = createBatchUpdater(func, { maxBatchSize: 3 });

      batcher.add('a');
      batcher.add('b');
      expect(func).not.toHaveBeenCalled();

      batcher.add('c');
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith(['a', 'b', 'c']);
    });

    it('flush 應該立即執行', () => {
      const func = jest.fn();
      const batcher = createBatchUpdater(func);

      batcher.add('a');
      batcher.add('b');
      batcher.flush();

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith(['a', 'b']);
    });

    it('cancel 應該取消批次', () => {
      const func = jest.fn();
      const batcher = createBatchUpdater(func, { maxWaitTime: 16 });

      batcher.add('a');
      batcher.cancel();

      jest.advanceTimersByTime(16);
      expect(func).not.toHaveBeenCalled();
    });

    it('flush 空批次不應該調用函數', () => {
      const func = jest.fn();
      const batcher = createBatchUpdater(func);

      batcher.flush();
      expect(func).not.toHaveBeenCalled();
    });
  });
});
