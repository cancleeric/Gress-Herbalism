/**
 * Performance testing helper utilities
 * 效能測試輔助工具
 */

/**
 * Measure decision time for DecisionMaker
 * 測量 DecisionMaker 決策時間
 */
function measureDecisionTime(decisionMaker, gameState, knowledge) {
  const start = performance.now();
  const decision = decisionMaker.decide(gameState, knowledge);
  const end = performance.now();

  return {
    decision,
    duration: end - start
  };
}

/**
 * Measure async function execution time
 * 測量非同步函數執行時間
 */
async function measureAsyncTime(fn) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  return {
    result,
    duration: end - start
  };
}

/**
 * Assert performance meets requirement
 * 斷言效能符合要求
 */
function assertPerformance(duration, maxDuration, context) {
  expect(duration).toBeLessThan(maxDuration);
  console.log(`✓ ${context}: ${duration.toFixed(2)}ms (limit: ${maxDuration}ms)`);
}

/**
 * Run multiple measurements and return statistics
 * 執行多次測量並回傳統計資料
 */
function measureMultipleTimes(fn, iterations = 10) {
  const durations = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    durations.push(end - start);
  }

  const total = durations.reduce((sum, d) => sum + d, 0);
  const avg = total / iterations;
  const max = Math.max(...durations);
  const min = Math.min(...durations);

  // 計算標準差
  const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  return {
    durations,
    total,
    avg,
    max,
    min,
    stdDev,
    iterations
  };
}

/**
 * Create performance report
 * 建立效能報告
 */
function createPerformanceReport(measurements) {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: measurements.length,
      passed: measurements.filter(m => m.passed).length,
      failed: measurements.filter(m => !m.passed).length
    },
    details: measurements
  };
}

/**
 * Format duration in milliseconds
 * 格式化時間（毫秒）
 */
function formatDuration(ms) {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}µs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Calculate percentile
 * 計算百分位數
 */
function calculatePercentile(values, percentile) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Generate performance statistics
 * 產生效能統計資料
 */
function generateStats(durations) {
  const sorted = [...durations].sort((a, b) => a - b);
  const total = durations.reduce((sum, d) => sum + d, 0);

  return {
    count: durations.length,
    total,
    avg: total / durations.length,
    max: Math.max(...durations),
    min: Math.min(...durations),
    p50: calculatePercentile(sorted, 50),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99)
  };
}

module.exports = {
  measureDecisionTime,
  measureAsyncTime,
  assertPerformance,
  measureMultipleTimes,
  createPerformanceReport,
  formatDuration,
  calculatePercentile,
  generateStats
};
