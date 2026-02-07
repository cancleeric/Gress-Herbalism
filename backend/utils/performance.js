/**
 * 後端效能優化工具
 *
 * @module utils/performance
 */

/**
 * 批次處理器
 * 將多次操作合併為單次批次處理
 */
class BatchProcessor {
  constructor(handler, options = {}) {
    this.handler = handler;
    this.maxBatchSize = options.maxBatchSize || 50;
    this.maxWaitTime = options.maxWaitTime || 16;
    this.batch = [];
    this.timer = null;
  }

  add(item) {
    this.batch.push(item);

    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.maxWaitTime);
    }
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length === 0) return;

    const items = this.batch;
    this.batch = [];

    this.handler(items);
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.batch = [];
  }
}

/**
 * 差異計算器
 * 計算兩個狀態之間的差異
 */
class DeltaCalculator {
  /**
   * 計算物件差異
   * @param {Object} oldState - 舊狀態
   * @param {Object} newState - 新狀態
   * @returns {Object|null} 差異物件，無差異時返回 null
   */
  static diff(oldState, newState) {
    if (oldState === newState) return null;
    if (!oldState) return { type: 'set', value: newState };
    if (!newState) return { type: 'delete' };

    const changes = {};
    let hasChanges = false;

    // 檢查新增和修改的屬性
    for (const key of Object.keys(newState)) {
      const oldVal = oldState[key];
      const newVal = newState[key];

      if (oldVal === newVal) continue;

      if (typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)) {
        if (typeof oldVal === 'object' && oldVal !== null && !Array.isArray(oldVal)) {
          const nestedDiff = this.diff(oldVal, newVal);
          if (nestedDiff) {
            changes[key] = nestedDiff;
            hasChanges = true;
          }
        } else {
          changes[key] = { type: 'set', value: newVal };
          hasChanges = true;
        }
      } else if (Array.isArray(newVal)) {
        // 陣列處理：發送完整陣列
        if (!this.arraysEqual(oldVal, newVal)) {
          changes[key] = { type: 'set', value: newVal };
          hasChanges = true;
        }
      } else {
        changes[key] = { type: 'set', value: newVal };
        hasChanges = true;
      }
    }

    // 檢查刪除的屬性
    for (const key of Object.keys(oldState)) {
      if (!(key in newState)) {
        changes[key] = { type: 'delete' };
        hasChanges = true;
      }
    }

    return hasChanges ? changes : null;
  }

  /**
   * 應用差異到狀態
   * @param {Object} state - 原狀態
   * @param {Object} delta - 差異
   * @returns {Object} 新狀態
   */
  static apply(state, delta) {
    if (!delta) return state;
    if (delta.type === 'set') return delta.value;
    if (delta.type === 'delete') return undefined;

    const result = { ...state };

    for (const [key, change] of Object.entries(delta)) {
      if (change.type === 'delete') {
        delete result[key];
      } else if (change.type === 'set') {
        result[key] = change.value;
      } else {
        result[key] = this.apply(state[key], change);
      }
    }

    return result;
  }

  static arraysEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

/**
 * 簡易記憶體快取
 */
class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 60000; // 預設 1 分鐘
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }

    // 更新存取順序（LRU）
    this._updateAccessOrder(key);
    return entry.value;
  }

  set(key, value, ttl = this.ttl) {
    // 檢查容量
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evict();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });

    this._updateAccessOrder(key);
  }

  delete(key) {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  size() {
    return this.cache.size;
  }

  _updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  _evict() {
    // 移除最久未使用的項目
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift();
      this.cache.delete(oldestKey);
    }
  }

  // 清理過期項目
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }
}

/**
 * 效能監控器
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  start(label) {
    this.startTimes.set(label, process.hrtime.bigint());
  }

  end(label) {
    const startTime = this.startTimes.get(label);
    if (!startTime) return 0;

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 轉為毫秒

    this.startTimes.delete(label);

    // 更新指標
    if (!this.metrics.has(label)) {
      this.metrics.set(label, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
      });
    }

    const metric = this.metrics.get(label);
    metric.count++;
    metric.total += duration;
    metric.min = Math.min(metric.min, duration);
    metric.max = Math.max(metric.max, duration);

    return duration;
  }

  getMetrics(label) {
    const metric = this.metrics.get(label);
    if (!metric) return null;

    return {
      count: metric.count,
      total: metric.total,
      avg: metric.count > 0 ? metric.total / metric.count : 0,
      min: metric.min === Infinity ? 0 : metric.min,
      max: metric.max,
    };
  }

  getAllMetrics() {
    const result = {};
    for (const [label, _] of this.metrics) {
      result[label] = this.getMetrics(label);
    }
    return result;
  }

  reset() {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

/**
 * 記憶體使用監控
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
    rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
    external: Math.round(usage.external / 1024 / 1024 * 100) / 100,
  };
}

/**
 * 物件池
 * 重複利用物件以減少 GC 壓力
 */
class ObjectPool {
  constructor(factory, options = {}) {
    this.factory = factory;
    this.maxSize = options.maxSize || 100;
    this.pool = [];
    this.active = 0;
  }

  acquire() {
    this.active++;
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.factory();
  }

  release(obj) {
    this.active--;
    if (this.pool.length < this.maxSize) {
      // 重置物件狀態
      if (typeof obj.reset === 'function') {
        obj.reset();
      }
      this.pool.push(obj);
    }
  }

  stats() {
    return {
      poolSize: this.pool.length,
      active: this.active,
      maxSize: this.maxSize,
    };
  }
}

module.exports = {
  BatchProcessor,
  DeltaCalculator,
  MemoryCache,
  PerformanceMonitor,
  ObjectPool,
  getMemoryUsage,
};
