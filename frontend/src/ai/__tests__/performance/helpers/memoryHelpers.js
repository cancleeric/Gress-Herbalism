/**
 * Memory testing helper utilities
 * 記憶體測試輔助工具
 */

class MemoryTracker {
  constructor() {
    this.snapshots = [];
    this.baseline = null;
  }

  /**
   * Take a memory snapshot
   * 建立記憶體快照
   */
  takeSnapshot(label) {
    const usage = process.memoryUsage();
    this.snapshots.push({
      label,
      usage,
      timestamp: Date.now()
    });

    if (!this.baseline) {
      this.baseline = usage;
    }

    return usage;
  }

  /**
   * Get memory growth since baseline
   * 取得記憶體成長量
   */
  getGrowth() {
    if (this.snapshots.length === 0) {
      return { heapUsed: 0, external: 0, total: 0 };
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    return {
      heapUsed: latest.usage.heapUsed - this.baseline.heapUsed,
      external: latest.usage.external - this.baseline.external,
      total: (latest.usage.heapUsed + latest.usage.external) -
             (this.baseline.heapUsed + this.baseline.external)
    };
  }

  /**
   * Get memory growth between two snapshots
   * 取得兩個快照之間的記憶體成長
   */
  getGrowthBetween(fromIndex, toIndex) {
    if (fromIndex >= this.snapshots.length || toIndex >= this.snapshots.length) {
      throw new Error('Invalid snapshot indices');
    }

    const from = this.snapshots[fromIndex];
    const to = this.snapshots[toIndex];

    return {
      heapUsed: to.usage.heapUsed - from.usage.heapUsed,
      external: to.usage.external - from.usage.external,
      total: (to.usage.heapUsed + to.usage.external) -
             (from.usage.heapUsed + from.usage.external)
    };
  }

  /**
   * Analyze memory growth pattern
   * 分析記憶體成長模式（線性或指數）
   */
  analyzeGrowthPattern() {
    if (this.snapshots.length < 3) {
      return { pattern: 'insufficient_data', isLinear: null };
    }

    const growths = [];
    for (let i = 1; i < this.snapshots.length; i++) {
      const growth = this.getGrowthBetween(i - 1, i);
      growths.push(growth.heapUsed);
    }

    // 計算平均成長率
    const avgGrowth = growths.reduce((sum, g) => sum + g, 0) / growths.length;

    // 計算變異係數 (CV = std / mean)
    const variance = growths.reduce((sum, g) => sum + Math.pow(g - avgGrowth, 2), 0) / growths.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / Math.abs(avgGrowth);

    // CV < 0.5 表示線性成長
    const isLinear = cv < 0.5;

    return {
      pattern: isLinear ? 'linear' : 'non-linear',
      isLinear,
      avgGrowth,
      stdDev,
      cv,
      growths
    };
  }

  /**
   * Get all snapshots
   * 取得所有快照
   */
  getSnapshots() {
    return this.snapshots;
  }

  /**
   * Reset tracker
   * 重設追蹤器
   */
  reset() {
    this.snapshots = [];
    this.baseline = null;
  }
}

/**
 * Format bytes to MB
 * 格式化位元組為 MB
 */
function formatMemory(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Trigger garbage collection if available
 * 觸發垃圾回收（需要 --expose-gc flag）
 */
function triggerGC() {
  if (global.gc) {
    global.gc();
    return true;
  }
  return false;
}

/**
 * Wait for a short period to allow GC to complete
 * 等待一段時間讓 GC 完成
 */
function waitForGC() {
  return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Get current memory usage
 * 取得當前記憶體使用量
 */
function getCurrentMemory() {
  return process.memoryUsage();
}

/**
 * Check if memory leak exists
 * 檢查是否有記憶體洩漏
 */
function hasMemoryLeak(baseline, current, thresholdMB = 2) {
  const growth = current.heapUsed - baseline.heapUsed;
  const growthMB = growth / 1024 / 1024;
  return growthMB > thresholdMB;
}

module.exports = {
  MemoryTracker,
  formatMemory,
  triggerGC,
  waitForGC,
  getCurrentMemory,
  hasMemoryLeak
};
