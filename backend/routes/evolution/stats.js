/**
 * 玩家統計路由
 *
 * 處理演化論遊戲玩家統計相關的 API 端點
 */

const express = require('express');
const router = express.Router();

const statsController = require('../../controllers/evolution/statsController');

/**
 * GET /api/evolution/stats/:userId
 * 取得玩家統計
 *
 * 回應：
 * - games_played: 遊戲場次
 * - games_won: 勝場數
 * - total_score: 累積分數
 * - win_rate: 勝率
 * - avg_score: 平均分數
 * - ...
 */
router.get('/:userId', statsController.getPlayerStats);

/**
 * GET /api/evolution/stats/:userId/history
 * 取得玩家遊戲歷史
 *
 * Query 參數：
 * - limit: 限制筆數（預設 20，最大 100）
 * - offset: 跳過筆數（分頁用）
 */
router.get('/:userId/history', statsController.getPlayerHistory);

/**
 * GET /api/evolution/stats/:userId/achievements
 * 取得玩家成就
 *
 * Query 參數：
 * - progress: true 時包含所有成就的進度
 */
router.get('/:userId/achievements', statsController.getPlayerAchievements);

module.exports = router;
