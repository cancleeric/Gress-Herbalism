/**
 * 排行榜路由
 *
 * 處理演化論遊戲排行榜相關的 API 端點
 */

const express = require('express');
const router = express.Router();

const leaderboardController = require('../../controllers/evolution/leaderboardController');

/**
 * GET /api/evolution/leaderboard
 * 取得總排行榜
 *
 * Query 參數：
 * - limit: 限制筆數（預設 100，最大 500）
 * - offset: 跳過筆數（分頁用）
 */
router.get('/', leaderboardController.getLeaderboard);

/**
 * GET /api/evolution/leaderboard/daily
 * 取得每日排行榜
 *
 * Query 參數：
 * - limit: 限制筆數（預設 50，最大 200）
 */
router.get('/daily', leaderboardController.getDailyLeaderboard);

/**
 * GET /api/evolution/leaderboard/weekly
 * 取得每週排行榜
 *
 * Query 參數：
 * - limit: 限制筆數（預設 50，最大 200）
 */
router.get('/weekly', leaderboardController.getWeeklyLeaderboard);

/**
 * POST /api/evolution/leaderboard/cache/clear
 * 清除排行榜快取（管理用）
 */
router.post('/cache/clear', leaderboardController.clearCache);

module.exports = router;
