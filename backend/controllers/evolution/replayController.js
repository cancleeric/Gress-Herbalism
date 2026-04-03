/**
 * 遊戲回放控制器
 *
 * 處理遊戲回放相關的 API 請求
 */

const { replayService } = require('../../services/evolution/replayService');
const { gameRecordService } = require('../../services/evolution/gameRecordService');

/**
 * 取得指定遊戲的回放資料
 */
async function getReplay(req, res) {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: '缺少 gameId 參數',
      });
    }

    const replay = await replayService.getReplay(gameId);

    if (!replay) {
      return res.status(404).json({
        success: false,
        message: '找不到回放資料',
      });
    }

    res.json({
      success: true,
      data: replay,
    });
  } catch (error) {
    console.error('[ReplayController] 取得回放失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得回放失敗',
    });
  }
}

/**
 * 取得玩家的遊戲歷史（含回放狀態）
 */
async function getUserGameHistory(req, res) {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少 userId 參數',
      });
    }

    const history = await gameRecordService.getPlayerHistory(userId, limit);

    // 為每筆遊戲記錄標記是否有回放
    const historyWithReplayStatus = history.map((record) => ({
      ...record,
      hasReplay: replayService.isAvailable(),
    }));

    res.json({
      success: true,
      data: historyWithReplayStatus,
      pagination: {
        limit,
        offset,
        total: history.length,
      },
    });
  } catch (error) {
    console.error('[ReplayController] 取得遊戲歷史失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得遊戲歷史失敗',
    });
  }
}

module.exports = {
  getReplay,
  getUserGameHistory,
};
