/**
 * 排行榜控制器
 *
 * 處理排行榜相關的 API 請求
 */

const { gameRecordService } = require('../../services/evolution/gameRecordService');

/**
 * 簡易記憶體快取
 */
const cache = {
  data: new Map(),
  ttl: new Map(),

  get(key) {
    const expiry = this.ttl.get(key);
    if (!expiry || Date.now() > expiry) {
      this.data.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.data.get(key);
  },

  set(key, value, ttlMs = 60000) {
    this.data.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  },

  clear() {
    this.data.clear();
    this.ttl.clear();
  },
};

/**
 * 快取 TTL 設定（毫秒）
 */
const CACHE_TTL = {
  LEADERBOARD: 60000, // 1 分鐘
  DAILY: 30000, // 30 秒
  WEEKLY: 60000, // 1 分鐘
};

/**
 * 取得總排行榜
 */
async function getLeaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const cacheKey = `leaderboard:${limit}:${offset}`;

    // 檢查快取
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    const data = await gameRecordService.getLeaderboard(limit);

    // 處理分頁
    const paginatedData = data.slice(offset, offset + limit);

    // 設定快取
    cache.set(cacheKey, paginatedData, CACHE_TTL.LEADERBOARD);

    res.json({
      success: true,
      data: paginatedData,
      total: data.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[LeaderboardController] 取得排行榜失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得排行榜失敗',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * 取得每日排行榜
 */
async function getDailyLeaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const cacheKey = `daily:${limit}`;

    // 檢查快取
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    const data = await gameRecordService.getDailyLeaderboard(limit);

    // 設定快取
    cache.set(cacheKey, data, CACHE_TTL.DAILY);

    res.json({
      success: true,
      data,
      date: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('[LeaderboardController] 取得每日排行榜失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得每日排行榜失敗',
    });
  }
}

/**
 * 取得每週排行榜
 */
async function getWeeklyLeaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const cacheKey = `weekly:${limit}`;

    // 檢查快取
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    const data = await gameRecordService.getWeeklyLeaderboard(limit);

    // 設定快取
    cache.set(cacheKey, data, CACHE_TTL.WEEKLY);

    // 計算本週起始日
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    res.json({
      success: true,
      data,
      weekStart: startOfWeek.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('[LeaderboardController] 取得每週排行榜失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得每週排行榜失敗',
    });
  }
}

/**
 * 清除快取（管理用）
 */
function clearCache(req, res) {
  cache.clear();
  res.json({
    success: true,
    message: '快取已清除',
  });
}

module.exports = {
  getLeaderboard,
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  clearCache,
  cache, // 匯出供測試使用
};
