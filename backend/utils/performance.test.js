/**
 * 後端效能工具測試
 *
 * @file utils/performance.test.js
 */

const {
  BatchProcessor,
  DeltaCalculator,
  MemoryCache,
  PerformanceMonitor,
  ObjectPool,
  getMemoryUsage,
} = require('./performance');

describe('BatchProcessor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('應該在達到批次大小時立即處理', () => {
    const handler = jest.fn();
    const processor = new BatchProcessor(handler, { maxBatchSize: 3 });

    processor.add('a');
    processor.add('b');
    expect(handler).not.toHaveBeenCalled();

    processor.add('c');
    expect(handler).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('應該在超時後處理', () => {
    const handler = jest.fn();
    const processor = new BatchProcessor(handler, { maxWaitTime: 100 });

    processor.add('a');
    processor.add('b');
    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(handler).toHaveBeenCalledWith(['a', 'b']);
  });

  it('flush 應該立即處理', () => {
    const handler = jest.fn();
    const processor = new BatchProcessor(handler);

    processor.add('a');
    processor.flush();

    expect(handler).toHaveBeenCalledWith(['a']);
  });

  it('clear 應該清空批次', () => {
    const handler = jest.fn();
    const processor = new BatchProcessor(handler, { maxWaitTime: 100 });

    processor.add('a');
    processor.clear();

    jest.advanceTimersByTime(100);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('DeltaCalculator', () => {
  describe('diff', () => {
    it('相同物件應該返回 null', () => {
      const obj = { a: 1, b: 2 };
      expect(DeltaCalculator.diff(obj, obj)).toBeNull();
    });

    it('應該檢測新增屬性', () => {
      const oldState = { a: 1 };
      const newState = { a: 1, b: 2 };
      const delta = DeltaCalculator.diff(oldState, newState);

      expect(delta).toEqual({
        b: { type: 'set', value: 2 },
      });
    });

    it('應該檢測修改屬性', () => {
      const oldState = { a: 1 };
      const newState = { a: 2 };
      const delta = DeltaCalculator.diff(oldState, newState);

      expect(delta).toEqual({
        a: { type: 'set', value: 2 },
      });
    });

    it('應該檢測刪除屬性', () => {
      const oldState = { a: 1, b: 2 };
      const newState = { a: 1 };
      const delta = DeltaCalculator.diff(oldState, newState);

      expect(delta).toEqual({
        b: { type: 'delete' },
      });
    });

    it('應該處理嵌套物件', () => {
      const oldState = { user: { name: 'Alice', age: 25 } };
      const newState = { user: { name: 'Alice', age: 26 } };
      const delta = DeltaCalculator.diff(oldState, newState);

      expect(delta).toEqual({
        user: {
          age: { type: 'set', value: 26 },
        },
      });
    });

    it('應該處理陣列變化', () => {
      const oldState = { items: [1, 2, 3] };
      const newState = { items: [1, 2, 3, 4] };
      const delta = DeltaCalculator.diff(oldState, newState);

      expect(delta).toEqual({
        items: { type: 'set', value: [1, 2, 3, 4] },
      });
    });
  });

  describe('apply', () => {
    it('應該應用設置變更', () => {
      const state = { a: 1 };
      const delta = { b: { type: 'set', value: 2 } };
      const result = DeltaCalculator.apply(state, delta);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('應該應用刪除變更', () => {
      const state = { a: 1, b: 2 };
      const delta = { b: { type: 'delete' } };
      const result = DeltaCalculator.apply(state, delta);

      expect(result).toEqual({ a: 1 });
    });

    it('應該應用嵌套變更', () => {
      const state = { user: { name: 'Alice', age: 25 } };
      const delta = { user: { age: { type: 'set', value: 26 } } };
      const result = DeltaCalculator.apply(state, delta);

      expect(result).toEqual({ user: { name: 'Alice', age: 26 } });
    });
  });
});

describe('MemoryCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('應該存取快取', () => {
    const cache = new MemoryCache();
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('應該在過期後返回 undefined', () => {
    const cache = new MemoryCache({ ttl: 1000 });
    cache.set('key', 'value');

    jest.advanceTimersByTime(1001);
    expect(cache.get('key')).toBeUndefined();
  });

  it('應該刪除快取', () => {
    const cache = new MemoryCache();
    cache.set('key', 'value');
    cache.delete('key');
    expect(cache.get('key')).toBeUndefined();
  });

  it('應該在達到容量時淘汰舊項目', () => {
    const cache = new MemoryCache({ maxSize: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('has 應該正確檢查存在性', () => {
    const cache = new MemoryCache();
    cache.set('key', 'value');

    expect(cache.has('key')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);
  });

  it('clear 應該清空快取', () => {
    const cache = new MemoryCache();
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });
});

describe('PerformanceMonitor', () => {
  it('應該測量執行時間', async () => {
    const monitor = new PerformanceMonitor();

    monitor.start('test');
    // 模擬一些工作
    await new Promise((resolve) => setTimeout(resolve, 10));
    const duration = monitor.end('test');

    expect(duration).toBeGreaterThan(0);
  });

  it('應該累積指標', () => {
    const monitor = new PerformanceMonitor();

    for (let i = 0; i < 3; i++) {
      monitor.start('test');
      monitor.end('test');
    }

    const metrics = monitor.getMetrics('test');
    expect(metrics.count).toBe(3);
  });

  it('getAllMetrics 應該返回所有指標', () => {
    const monitor = new PerformanceMonitor();

    monitor.start('a');
    monitor.end('a');
    monitor.start('b');
    monitor.end('b');

    const all = monitor.getAllMetrics();
    expect(all).toHaveProperty('a');
    expect(all).toHaveProperty('b');
  });

  it('reset 應該清除所有指標', () => {
    const monitor = new PerformanceMonitor();

    monitor.start('test');
    monitor.end('test');
    monitor.reset();

    expect(monitor.getMetrics('test')).toBeNull();
  });
});

describe('ObjectPool', () => {
  it('應該建立和回收物件', () => {
    const factory = jest.fn(() => ({ value: 0 }));
    const pool = new ObjectPool(factory, { maxSize: 5 });

    const obj1 = pool.acquire();
    expect(factory).toHaveBeenCalledTimes(1);

    pool.release(obj1);

    const obj2 = pool.acquire();
    expect(factory).toHaveBeenCalledTimes(1); // 應該重用
    expect(obj2).toBe(obj1);
  });

  it('應該限制池大小', () => {
    const pool = new ObjectPool(() => ({}), { maxSize: 2 });

    const objs = [pool.acquire(), pool.acquire(), pool.acquire()];
    objs.forEach((obj) => pool.release(obj));

    const stats = pool.stats();
    expect(stats.poolSize).toBe(2);
  });

  it('應該調用 reset 方法', () => {
    const reset = jest.fn();
    const factory = () => ({ reset });
    const pool = new ObjectPool(factory);

    const obj = pool.acquire();
    pool.release(obj);

    expect(reset).toHaveBeenCalled();
  });
});

describe('getMemoryUsage', () => {
  it('應該返回記憶體使用資訊', () => {
    const usage = getMemoryUsage();

    expect(usage).toHaveProperty('heapUsed');
    expect(usage).toHaveProperty('heapTotal');
    expect(usage).toHaveProperty('rss');
    expect(usage).toHaveProperty('external');
  });
});
