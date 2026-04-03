/**
 * 遊戲回放路由
 *
 * 處理遊戲回放相關的 API 端點
 */

const express = require('express');
const router = express.Router();

const replayController = require('../../controllers/evolution/replayController');

/**
 * GET /api/evolution/replays/list/:userId
 * 取得玩家遊戲歷史（含回放狀態）
 *
 * Query 參數：
 * - limit: 限制筆數（預設 20，最大 100）
 * - offset: 跳過筆數（分頁用）
 */
router.get('/list/:userId', replayController.getUserGameHistory);

/**
 * GET /api/evolution/replays/:gameId
 * 取得指定遊戲的回放資料
 */
router.get('/:gameId', replayController.getReplay);

module.exports = router;
