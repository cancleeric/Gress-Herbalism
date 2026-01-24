/**
 * 性能監控工具測試
 * @module utils/performance.test
 */

import {
  performanceMonitor,
  withTiming,
  withAsyncTiming,
  trackRender,
  getRenderStats,
  clearRenderStats
} from './performance';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.enable();
    clearRenderStats();
  });

  afterEach(() => {
    performanceMonitor.disable();
  });

  describe('mark', () => {
    test('應設置標記點', () => {
      performanceMonitor.mark('test-mark');
      expect(performanceMonitor.marks.has('test-mark')).toBe(true);
    });

    test('禁用時不應設置標記', () => {
      performanceMonitor.disable();
      performanceMonitor.mark('disabled-mark');
      expect(performanceMonitor.marks.has('disabled-mark')).toBe(false);
    });
  });

  describe('measure', () => {
    test('應測量兩個標記點之間的時間', () => {
      performanceMonitor.mark('start');
      performanceMonitor.mark('end');
      const result = performanceMonitor.measure('test', 'start', 'end');

      expect(result).toBeDefined();
      expect(result.name).toBe('test');
      expect(typeof result.duration).toBe('number');
      expect(typeof result.startTime).toBe('number');
      expect(typeof result.endTime).toBe('number');
    });

    test('缺少標記時應返回 null', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      performanceMonitor.mark('only-start');
      const result = performanceMonitor.measure('incomplete', 'only-start', 'missing');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('禁用時應返回 null', () => {
      performanceMonitor.disable();
      performanceMonitor.marks.set('start', 100);
      performanceMonitor.marks.set('end', 200);
      const result = performanceMonitor.measure('test', 'start', 'end');

      expect(result).toBeNull();
    });
  });

  describe('measureSync', () => {
    test('應測量同步函數執行時間', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = performanceMonitor.measureSync('sync-test', () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
      expect(performanceMonitor.measurements.length).toBe(1);
      expect(performanceMonitor.measurements[0].name).toBe('sync-test');
      consoleSpy.mockRestore();
    });

    test('禁用時應直接執行函數', () => {
      performanceMonitor.disable();
      const result = performanceMonitor.measureSync('disabled-sync', () => 'result');

      expect(result).toBe('result');
      expect(performanceMonitor.measurements.length).toBe(0);
    });

    test('函數拋出錯誤時仍應記錄', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      expect(() => {
        performanceMonitor.measureSync('error-test', () => {
          throw new Error('test error');
        });
      }).toThrow('test error');

      expect(performanceMonitor.measurements.length).toBe(1);
      consoleSpy.mockRestore();
    });
  });

  describe('measureAsync', () => {
    test('應測量異步函數執行時間', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await performanceMonitor.measureAsync('async-test', async () => {
        return 'async-result';
      });

      expect(result).toBe('async-result');
      expect(performanceMonitor.measurements.length).toBe(1);
      expect(performanceMonitor.measurements[0].name).toBe('async-test');
      consoleSpy.mockRestore();
    });

    test('禁用時應直接執行函數', async () => {
      performanceMonitor.disable();
      const result = await performanceMonitor.measureAsync('disabled-async', async () => 'result');

      expect(result).toBe('result');
      expect(performanceMonitor.measurements.length).toBe(0);
    });
  });

  describe('logMeasurement', () => {
    test('應記錄測量結果（快速 - 綠色）', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      performanceMonitor.logMeasurement({ name: 'fast', duration: 10, startTime: 0, endTime: 10 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] fast'),
        'color: green'
      );
      consoleSpy.mockRestore();
    });

    test('應記錄測量結果（中等 - 橙色）', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      performanceMonitor.logMeasurement({ name: 'medium', duration: 75, startTime: 0, endTime: 75 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] medium'),
        'color: orange'
      );
      consoleSpy.mockRestore();
    });

    test('應記錄測量結果（慢 - 紅色）', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      performanceMonitor.logMeasurement({ name: 'slow', duration: 150, startTime: 0, endTime: 150 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] slow'),
        'color: red'
      );
      consoleSpy.mockRestore();
    });

    test('禁用時不應記錄', () => {
      performanceMonitor.disable();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      performanceMonitor.logMeasurement({ name: 'test', duration: 10, startTime: 0, endTime: 10 });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getMeasurements', () => {
    test('應返回所有測量結果的副本', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      performanceMonitor.measureSync('test1', () => {});
      performanceMonitor.measureSync('test2', () => {});

      const measurements = performanceMonitor.getMeasurements();
      expect(measurements.length).toBe(2);
      expect(measurements).not.toBe(performanceMonitor.measurements);
      consoleSpy.mockRestore();
    });
  });

  describe('getSummary', () => {
    test('無測量時應返回空摘要', () => {
      const summary = performanceMonitor.getSummary();
      expect(summary).toEqual({ count: 0, total: 0, average: 0, max: 0, min: 0 });
    });

    test('應返回正確的摘要', () => {
      performanceMonitor.measurements = [
        { name: 'test1', duration: 10, startTime: 0, endTime: 10 },
        { name: 'test2', duration: 20, startTime: 10, endTime: 30 },
        { name: 'test3', duration: 30, startTime: 30, endTime: 60 }
      ];

      const summary = performanceMonitor.getSummary();
      expect(summary.count).toBe(3);
      expect(summary.total).toBe('60.00');
      expect(summary.average).toBe('20.00');
      expect(summary.max).toBe('30.00');
      expect(summary.min).toBe('10.00');
    });
  });

  describe('clear', () => {
    test('應清除所有標記和測量', () => {
      performanceMonitor.mark('test');
      performanceMonitor.measurements.push({ name: 'test', duration: 10 });

      performanceMonitor.clear();

      expect(performanceMonitor.marks.size).toBe(0);
      expect(performanceMonitor.measurements.length).toBe(0);
    });
  });

  describe('enable/disable', () => {
    test('enable 應啟用監控', () => {
      performanceMonitor.disable();
      performanceMonitor.enable();
      expect(performanceMonitor.enabled).toBe(true);
    });

    test('disable 應禁用監控', () => {
      performanceMonitor.enable();
      performanceMonitor.disable();
      expect(performanceMonitor.enabled).toBe(false);
    });
  });
});

describe('withTiming', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.enable();
  });

  afterEach(() => {
    performanceMonitor.disable();
  });

  test('應包裝函數並測量時間', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const originalFn = (a, b) => a + b;
    const timedFn = withTiming('add', originalFn);

    const result = timedFn(2, 3);

    expect(result).toBe(5);
    expect(performanceMonitor.measurements.length).toBe(1);
    consoleSpy.mockRestore();
  });

  test('應保留函數的 this 上下文', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const obj = {
      value: 10,
      getValue: withTiming('getValue', function() {
        return this.value;
      })
    };

    expect(obj.getValue()).toBe(10);
    consoleSpy.mockRestore();
  });
});

describe('withAsyncTiming', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.enable();
  });

  afterEach(() => {
    performanceMonitor.disable();
  });

  test('應包裝異步函數並測量時間', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const originalFn = async (a, b) => a + b;
    const timedFn = withAsyncTiming('asyncAdd', originalFn);

    const result = await timedFn(2, 3);

    expect(result).toBe(5);
    expect(performanceMonitor.measurements.length).toBe(1);
    consoleSpy.mockRestore();
  });
});

describe('Render Tracking', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    clearRenderStats();
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('trackRender', () => {
    test('應追蹤組件渲染次數', () => {
      trackRender('TestComponent');
      trackRender('TestComponent');
      trackRender('TestComponent');

      const stats = getRenderStats();
      expect(stats['TestComponent']).toBe(3);
    });

    test('每 10 次渲染應輸出日誌', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      for (let i = 0; i < 10; i++) {
        trackRender('FrequentComponent');
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('FrequentComponent rendered 10 times')
      );
      consoleSpy.mockRestore();
    });

    test('非開發環境不應追蹤', () => {
      process.env.NODE_ENV = 'production';
      trackRender('ProductionComponent');

      const stats = getRenderStats();
      expect(stats['ProductionComponent']).toBeUndefined();
    });
  });

  describe('getRenderStats', () => {
    test('應返回所有渲染統計', () => {
      trackRender('ComponentA');
      trackRender('ComponentB');
      trackRender('ComponentA');

      const stats = getRenderStats();
      expect(stats).toEqual({
        'ComponentA': 2,
        'ComponentB': 1
      });
    });
  });

  describe('clearRenderStats', () => {
    test('應清除所有渲染統計', () => {
      trackRender('TestComponent');
      clearRenderStats();

      const stats = getRenderStats();
      expect(Object.keys(stats).length).toBe(0);
    });
  });
});
