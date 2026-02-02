/**
 * 玩家統計控制器
 *
 * 處理玩家統計相關的 API 請求
 */

const { gameRecordService } = require('../../services/evolution/gameRecordService');
const { achievementService } = require('../../services/evolution/achievementService');

/**
 * 取得玩家統計
 */
async function getPlayerStats(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少 userId 參數',
      });
    }

    const stats = await gameRecordService.getPlayerStats(userId);

    // 計算衍生統計
    const derivedStats = calculateDerivedStats(stats);

    res.json({
      success: true,
      data: {
        ...stats,
        ...derivedStats,
      },
    });
  } catch (error) {
    console.error('[StatsController] 取得玩家統計失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得玩家統計失敗',
    });
  }
}

/**
 * 取得玩家遊戲歷史
 */
async function getPlayerHistory(req, res) {
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

    // 取得較多資料以支援分頁
    const allHistory = await gameRecordService.getPlayerHistory(userId, 1000);

    // 分頁處理
    const paginatedHistory = allHistory.slice(offset, offset + limit);

    // 格式化歷史記錄
    const formattedHistory = paginatedHistory.map(formatHistoryRecord);

    res.json({
      success: true,
      data: formattedHistory,
      total: allHistory.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[StatsController] 取得玩家歷史失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得玩家歷史失敗',
    });
  }
}

/**
 * 取得玩家成就
 */
async function getPlayerAchievements(req, res) {
  try {
    const { userId } = req.params;
    const includeProgress = req.query.progress === 'true';

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少 userId 參數',
      });
    }

    // 取得已解鎖的成就
    const unlockedAchievements = await achievementService.getPlayerAchievements(userId);

    let response = {
      success: true,
      data: {
        unlocked: unlockedAchievements,
        totalPoints: calculateTotalPoints(unlockedAchievements),
      },
    };

    // 如果需要進度資訊
    if (includeProgress) {
      const stats = await gameRecordService.getPlayerStats(userId);
      const progress = await achievementService.getAchievementProgress(userId, stats);

      response.data.progress = progress;
      response.data.totalAchievements = progress.length;
      response.data.unlockedCount = unlockedAchievements.length;
    }

    res.json(response);
  } catch (error) {
    console.error('[StatsController] 取得玩家成就失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得玩家成就失敗',
    });
  }
}

/**
 * 計算衍生統計
 */
function calculateDerivedStats(stats) {
  if (!stats) return {};

  const gamesPlayed = stats.games_played || 0;
  const gamesWon = stats.games_won || 0;

  return {
    win_rate: gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 1000) / 10 : 0,
    avg_score: gamesPlayed > 0 ? Math.round((stats.total_score || 0) / gamesPlayed * 10) / 10 : 0,
    avg_creatures: gamesPlayed > 0 ? Math.round((stats.total_creatures || 0) / gamesPlayed * 10) / 10 : 0,
    avg_traits: gamesPlayed > 0 ? Math.round((stats.total_traits || 0) / gamesPlayed * 10) / 10 : 0,
    kd_ratio: (stats.total_deaths || 0) > 0
      ? Math.round((stats.total_kills || 0) / stats.total_deaths * 100) / 100
      : stats.total_kills || 0,
  };
}

/**
 * 格式化歷史記錄
 */
function formatHistoryRecord(record) {
  if (!record) return null;

  const game = record.game || {};

  return {
    id: record.id,
    gameId: record.game_id,
    playedAt: game.ended_at || record.created_at,
    duration: game.duration_seconds,
    rounds: game.rounds,
    score: record.final_score,
    rank: record.final_rank,
    isWinner: record.is_winner,
    creatures: record.creatures_count,
    traits: record.traits_count,
    foodBonus: record.food_bonus,
  };
}

/**
 * 計算成就總點數
 */
function calculateTotalPoints(achievements) {
  if (!achievements || !Array.isArray(achievements)) return 0;
  return achievements.reduce((sum, a) => sum + (a.points || 0), 0);
}

module.exports = {
  getPlayerStats,
  getPlayerHistory,
  getPlayerAchievements,
  calculateDerivedStats,
  formatHistoryRecord,
  calculateTotalPoints,
};
