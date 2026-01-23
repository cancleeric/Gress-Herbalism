/**
 * 性能監控工具
 *
 * @module utils/performance
 * @description 提供性能監控和測量功能
 * 工作單 0034
 */

/**
 * 性能測量結果
 * @typedef {Object} PerformanceResult
 * @property {string} name - 測量名稱
 * @property {number} duration - 執行時間（毫秒）
 * @property {number} startTime - 開始時間
 * @property {number} endTime - 結束時間
 */

/**
 * 性能監控器
 * 用於追蹤和記錄操作的執行時間
 */
class PerformanceMonitor {
  constructor() {
    /** @type {Map<string, number>} */
    this.marks = new Map();
    /** @type {PerformanceResult[]} */
    this.measurements = [];
    /** @type {boolean} */
    this.enabled = process.env.NODE_ENV === 'development';
  }

  /**
   * 設置標記點
   * @param {string} name - 標記名稱
   */
  mark(name) {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }

  /**
   * 測量兩個標記點之間的時間
   * @param {string} name - 測量名稱
   * @param {string} startMark - 開始標記
   * @param {string} endMark - 結束標記
   * @returns {PerformanceResult|null} 測量結果
   */
  measure(name, startMark, endMark) {
    if (!this.enabled) return null;

    const startTime = this.marks.get(startMark);
    const endTime = this.marks.get(endMark);

    if (startTime === undefined || endTime === undefined) {
      console.warn(`Performance: Missing mark(s) for measurement "${name}"`);
      return null;
    }

    const result = {
      name,
      duration: endTime - startTime,
      startTime,
      endTime
    };

    this.measurements.push(result);
    return result;
  }

  /**
   * 測量函數執行時間
   * @template T
   * @param {string} name - 測量名稱
   * @param {function(): T} fn - 要測量的函數
   * @returns {T} 函數返回值
   */
  measureSync(name, fn) {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    try {
      return fn();
    } finally {
      const endTime = performance.now();
      const result = {
        name,
        duration: endTime - startTime,
        startTime,
        endTime
      };
      this.measurements.push(result);
      this.logMeasurement(result);
    }
  }

  /**
   * 測量異步函數執行時間
   * @template T
   * @param {string} name - 測量名稱
   * @param {function(): Promise<T>} fn - 要測量的異步函數
   * @returns {Promise<T>} 函數返回值
   */
  async measureAsync(name, fn) {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    try {
      return await fn();
    } finally {
      const endTime = performance.now();
      const result = {
        name,
        duration: endTime - startTime,
        startTime,
        endTime
      };
      this.measurements.push(result);
      this.logMeasurement(result);
    }
  }

  /**
   * 記錄測量結果
   * @param {PerformanceResult} result - 測量結果
   */
  logMeasurement(result) {
    if (!this.enabled) return;

    const color = result.duration > 100 ? 'color: red' :
                  result.duration > 50 ? 'color: orange' :
                  'color: green';

    console.log(
      `%c[Performance] ${result.name}: ${result.duration.toFixed(2)}ms`,
      color
    );
  }

  /**
   * 獲取所有測量結果
   * @returns {PerformanceResult[]} 測量結果列表
   */
  getMeasurements() {
    return [...this.measurements];
  }

  /**
   * 獲取測量摘要
   * @returns {Object} 測量摘要
   */
  getSummary() {
    if (this.measurements.length === 0) {
      return { count: 0, total: 0, average: 0, max: 0, min: 0 };
    }

    const durations = this.measurements.map(m => m.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);

    return {
      count: this.measurements.length,
      total: total.toFixed(2),
      average: (total / this.measurements.length).toFixed(2),
      max: Math.max(...durations).toFixed(2),
      min: Math.min(...durations).toFixed(2)
    };
  }

  /**
   * 清除所有記錄
   */
  clear() {
    this.marks.clear();
    this.measurements = [];
  }

  /**
   * 啟用監控
   */
  enable() {
    this.enabled = true;
  }

  /**
   * 禁用監控
   */
  disable() {
    this.enabled = false;
  }
}

// 創建單例實例
const performanceMonitor = new PerformanceMonitor();

/**
 * 創建計時器高階函數
 * 用於裝飾需要測量的函數
 *
 * @template T
 * @param {string} name - 測量名稱
 * @param {function(...args: any[]): T} fn - 要包裝的函數
 * @returns {function(...args: any[]): T} 包裝後的函數
 *
 * @example
 * const timedFunction = withTiming('myFunction', originalFunction);
 */
function withTiming(name, fn) {
  return function (...args) {
    return performanceMonitor.measureSync(name, () => fn.apply(this, args));
  };
}

/**
 * 創建異步計時器高階函數
 *
 * @template T
 * @param {string} name - 測量名稱
 * @param {function(...args: any[]): Promise<T>} fn - 要包裝的異步函數
 * @returns {function(...args: any[]): Promise<T>} 包裝後的函數
 */
function withAsyncTiming(name, fn) {
  return async function (...args) {
    return performanceMonitor.measureAsync(name, () => fn.apply(this, args));
  };
}

/**
 * 記錄渲染次數
 * 用於追蹤 React 組件渲染
 */
const renderCounts = new Map();

/**
 * 追蹤組件渲染
 * @param {string} componentName - 組件名稱
 */
function trackRender(componentName) {
  if (process.env.NODE_ENV !== 'development') return;

  const count = (renderCounts.get(componentName) || 0) + 1;
  renderCounts.set(componentName, count);

  if (count % 10 === 0) {
    console.log(`[Render Tracking] ${componentName} rendered ${count} times`);
  }
}

/**
 * 獲取渲染統計
 * @returns {Object} 渲染統計
 */
function getRenderStats() {
  const stats = {};
  renderCounts.forEach((count, name) => {
    stats[name] = count;
  });
  return stats;
}

/**
 * 清除渲染統計
 */
function clearRenderStats() {
  renderCounts.clear();
}

export {
  performanceMonitor,
  withTiming,
  withAsyncTiming,
  trackRender,
  getRenderStats,
  clearRenderStats
};

export default performanceMonitor;
