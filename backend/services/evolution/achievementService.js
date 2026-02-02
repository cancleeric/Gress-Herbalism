/**
 * 成就系統服務
 *
 * 負責檢查、解鎖和查詢玩家成就
 */

const { getSupabase, isSupabaseEnabled } = require('../supabaseClient');
const {
  ACHIEVEMENTS,
  getAchievementById,
} = require('../../../shared/constants/evolutionAchievements');

/**
 * 成就服務類別
 */
class AchievementService {
  /**
   * 檢查服務是否可用
   * @returns {boolean}
   */
  isAvailable() {
    return isSupabaseEnabled();
  }

  /**
   * 檢查並解鎖成就
   * @param {string} userId - 用戶 ID
   * @param {Object} gameResult - 遊戲結果資料
   * @param {Object} stats - 玩家統計資料
   * @returns {Promise<Array>} 新解鎖的成就列表
   */
  async checkAndUnlock(userId, gameResult, stats) {
    if (!this.isAvailable()) {
      console.warn('[AchievementService] Supabase 未啟用，跳過成就檢查');
      return [];
    }

    const supabase = getSupabase();
    const unlocked = [];

    try {
      // 取得玩家已解鎖的成就
      const { data: existing, error: fetchError } = await supabase
        .from('evolution_player_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (fetchError) {
        console.error('[AchievementService] 取得已解鎖成就失敗:', fetchError);
        return [];
      }

      const unlockedIds = new Set(
        (existing || []).map((a) => a.achievement_id)
      );

      // 檢查每個成就
      for (const achievement of Object.values(ACHIEVEMENTS)) {
        if (unlockedIds.has(achievement.id)) continue;

        const isUnlocked = this.checkCondition(
          achievement.condition,
          stats,
          gameResult
        );

        if (isUnlocked) {
          const success = await this.unlockAchievement(
            userId,
            achievement.id,
            gameResult?.gameId
          );

          if (success) {
            unlocked.push(achievement);
          }
        }
      }

      if (unlocked.length > 0) {
        console.log(
          `[AchievementService] 玩家 ${userId} 解鎖了 ${unlocked.length} 個成就`
        );
      }

      return unlocked;
    } catch (error) {
      console.error('[AchievementService] 檢查成就失敗:', error);
      return [];
    }
  }

  /**
   * 檢查成就條件是否滿足
   * @param {Object} condition - 成就條件
   * @param {Object} stats - 玩家統計
   * @param {Object} gameResult - 遊戲結果
   * @returns {boolean}
   */
  checkCondition(condition, stats, gameResult) {
    if (!condition || !condition.type) return false;

    switch (condition.type) {
      // 累計統計類
      case 'games_played':
        return (stats?.games_played || 0) >= condition.value;

      case 'games_won':
        return (stats?.games_won || 0) >= condition.value;

      case 'total_creatures':
        return (stats?.total_creatures || 0) >= condition.value;

      case 'total_traits':
        return (stats?.total_traits || 0) >= condition.value;

      case 'total_kills':
        return (stats?.total_kills || 0) >= condition.value;

      // 勝率類
      case 'win_rate': {
        const gamesPlayed = stats?.games_played || 0;
        const minGames = condition.minGames || 0;
        if (gamesPlayed < minGames) return false;
        const winRate = ((stats?.games_won || 0) / gamesPlayed) * 100;
        return winRate >= condition.value;
      }

      // 單場遊戲類
      case 'score_in_game':
        return (gameResult?.score || 0) >= condition.value;

      case 'creatures_in_game':
        return (gameResult?.creaturesCount || 0) >= condition.value;

      case 'kills_in_game':
        return (gameResult?.killsCount || 0) >= condition.value;

      case 'win_in_rounds':
        return (
          gameResult?.isWinner === true &&
          (gameResult?.rounds || 999) <= condition.value
        );

      // 布林條件類
      case 'all_survived':
        return gameResult?.allSurvived === true;

      case 'win_without_kills':
        return (
          gameResult?.isWinner === true &&
          (gameResult?.killsCount || 0) === 0
        );

      case 'perfect_game':
        return (
          gameResult?.isWinner === true && gameResult?.allFed === true
        );

      default:
        return false;
    }
  }

  /**
   * 解鎖成就
   * @param {string} userId - 用戶 ID
   * @param {string} achievementId - 成就 ID
   * @param {string|null} gameId - 遊戲 ID（可選）
   * @returns {Promise<boolean>}
   */
  async unlockAchievement(userId, achievementId, gameId = null) {
    if (!this.isAvailable()) {
      return false;
    }

    const supabase = getSupabase();

    try {
      const { error } = await supabase
        .from('evolution_player_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          game_id: gameId,
        });

      // 23505 = unique violation（重複解鎖）
      if (error && error.code !== '23505') {
        console.error(
          `[AchievementService] 解鎖成就 ${achievementId} 失敗:`,
          error
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AchievementService] 解鎖成就異常:', error);
      return false;
    }
  }

  /**
   * 取得玩家已解鎖的成就
   * @param {string} userId - 用戶 ID
   * @returns {Promise<Array>}
   */
  async getPlayerAchievements(userId) {
    if (!this.isAvailable()) {
      return [];
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('evolution_player_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('[AchievementService] 取得玩家成就失敗:', error);
        return [];
      }

      return (data || []).map((record) => {
        const achievement = getAchievementById(record.achievement_id);
        return {
          ...achievement,
          unlockedAt: record.unlocked_at,
          gameId: record.game_id,
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('[AchievementService] 取得玩家成就異常:', error);
      return [];
    }
  }

  /**
   * 取得成就進度
   * @param {string} userId - 用戶 ID
   * @param {Object} stats - 玩家統計
   * @returns {Promise<Array>}
   */
  async getAchievementProgress(userId, stats) {
    if (!this.isAvailable()) {
      return this.calculateAllProgress(new Set(), stats);
    }

    const supabase = getSupabase();

    try {
      const { data: unlocked, error } = await supabase
        .from('evolution_player_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (error) {
        console.error('[AchievementService] 取得成就進度失敗:', error);
        return this.calculateAllProgress(new Set(), stats);
      }

      const unlockedIds = new Set(
        (unlocked || []).map((a) => a.achievement_id)
      );

      return this.calculateAllProgress(unlockedIds, stats);
    } catch (error) {
      console.error('[AchievementService] 取得成就進度異常:', error);
      return this.calculateAllProgress(new Set(), stats);
    }
  }

  /**
   * 計算所有成就的進度
   * @param {Set} unlockedIds - 已解鎖的成就 ID
   * @param {Object} stats - 玩家統計
   * @returns {Array}
   */
  calculateAllProgress(unlockedIds, stats) {
    return Object.values(ACHIEVEMENTS).map((achievement) => ({
      ...achievement,
      unlocked: unlockedIds.has(achievement.id),
      progress: this.calculateProgress(achievement.condition, stats),
    }));
  }

  /**
   * 計算單個成就的進度
   * @param {Object} condition - 成就條件
   * @param {Object} stats - 玩家統計
   * @returns {number} 進度百分比 (0-100)
   */
  calculateProgress(condition, stats) {
    if (!condition || !condition.type) return 0;

    const current = this.getCurrentValue(condition.type, stats);
    const target = condition.value;

    if (typeof target !== 'number' || target <= 0) return 0;

    return Math.min(Math.round((current / target) * 100), 100);
  }

  /**
   * 取得條件類型的當前值
   * @param {string} type - 條件類型
   * @param {Object} stats - 玩家統計
   * @returns {number}
   */
  getCurrentValue(type, stats) {
    if (!stats) return 0;

    switch (type) {
      case 'games_played':
        return stats.games_played || 0;
      case 'games_won':
        return stats.games_won || 0;
      case 'total_creatures':
        return stats.total_creatures || 0;
      case 'total_traits':
        return stats.total_traits || 0;
      case 'total_kills':
        return stats.total_kills || 0;
      case 'highest_score':
        return stats.highest_score || 0;
      default:
        return 0;
    }
  }
}

// 單例匯出
const achievementService = new AchievementService();

module.exports = {
  AchievementService,
  achievementService,
};
