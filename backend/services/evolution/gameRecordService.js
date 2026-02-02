/**
 * 遊戲記錄服務
 *
 * 負責將遊戲資料寫入 Supabase 資料庫
 */

const { getSupabase, isSupabaseEnabled } = require('../supabaseClient');

/**
 * 遊戲記錄服務類別
 */
class GameRecordService {
  /**
   * 檢查服務是否可用
   * @returns {boolean}
   */
  isAvailable() {
    return isSupabaseEnabled();
  }

  /**
   * 記錄遊戲開始
   * @param {Object} gameState - 遊戲狀態
   * @returns {Promise<Object|null>}
   */
  async recordGameStart(gameState) {
    if (!this.isAvailable()) {
      console.warn('[GameRecordService] Supabase 未啟用，跳過記錄');
      return null;
    }

    const supabase = getSupabase();
    const { id, config, turnOrder } = gameState;

    try {
      // 建立遊戲記錄
      const { data: game, error: gameError } = await supabase
        .from('evolution_games')
        .insert({
          id,
          status: 'playing',
          config: config || {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (gameError) {
        throw gameError;
      }

      // 建立參與者記錄
      const participants = turnOrder.map((playerId, index) => ({
        game_id: id,
        user_id: playerId,
        player_index: index,
      }));

      const { error: participantsError } = await supabase
        .from('evolution_participants')
        .insert(participants);

      if (participantsError) {
        throw participantsError;
      }

      console.log(`[GameRecordService] 遊戲開始已記錄: ${id}`);
      return game;
    } catch (error) {
      console.error('[GameRecordService] 記錄遊戲開始失敗:', error);
      throw error;
    }
  }

  /**
   * 記錄遊戲結束
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} scores - 分數資料 { playerId: { total, creatures, traits, foodBonus } }
   * @returns {Promise<Object|null>}
   */
  async recordGameEnd(gameState, scores) {
    if (!this.isAvailable()) {
      console.warn('[GameRecordService] Supabase 未啟用，跳過記錄');
      return null;
    }

    const supabase = getSupabase();
    const { id, round, winner, startedAt } = gameState;
    const endedAt = new Date();
    const startTime = startedAt ? new Date(startedAt) : endedAt;
    const durationSeconds = Math.floor((endedAt - startTime) / 1000);

    try {
      // 更新遊戲記錄
      const { error: gameError } = await supabase
        .from('evolution_games')
        .update({
          status: 'finished',
          rounds: round || 1,
          winner_id: winner || null,
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', id);

      if (gameError) {
        throw gameError;
      }

      // 更新參與者記錄（按分數排序）
      const sortedScores = Object.entries(scores).sort(
        (a, b) => (b[1].total || 0) - (a[1].total || 0)
      );

      for (let i = 0; i < sortedScores.length; i++) {
        const [playerId, score] = sortedScores[i];

        const { error: participantError } = await supabase
          .from('evolution_participants')
          .update({
            final_score: score.total || 0,
            final_rank: i + 1,
            creatures_count: score.creatures || 0,
            traits_count: score.traits || 0,
            food_bonus: score.foodBonus || 0,
            is_winner: playerId === winner,
          })
          .eq('game_id', id)
          .eq('user_id', playerId);

        if (participantError) {
          console.error(
            `[GameRecordService] 更新參與者 ${playerId} 失敗:`,
            participantError
          );
        }
      }

      console.log(`[GameRecordService] 遊戲結束已記錄: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('[GameRecordService] 記錄遊戲結束失敗:', error);
      throw error;
    }
  }

  /**
   * 取得玩家統計
   * @param {string} userId - 用戶 ID
   * @returns {Promise<Object>}
   */
  async getPlayerStats(userId) {
    if (!this.isAvailable()) {
      return this.getDefaultStats();
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('evolution_player_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // PGRST116 = 找不到記錄
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || this.getDefaultStats();
    } catch (error) {
      console.error('[GameRecordService] 取得玩家統計失敗:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * 取得玩家遊戲歷史
   * @param {string} userId - 用戶 ID
   * @param {number} limit - 限制筆數
   * @returns {Promise<Array>}
   */
  async getPlayerHistory(userId, limit = 20) {
    if (!this.isAvailable()) {
      return [];
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('evolution_participants')
        .select(
          `
          *,
          game:evolution_games(*)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GameRecordService] 取得玩家歷史失敗:', error);
      return [];
    }
  }

  /**
   * 取得排行榜
   * @param {number} limit - 限制筆數
   * @returns {Promise<Array>}
   */
  async getLeaderboard(limit = 100) {
    if (!this.isAvailable()) {
      return [];
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('evolution_leaderboard')
        .select('*')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GameRecordService] 取得排行榜失敗:', error);
      return [];
    }
  }

  /**
   * 取得每日排行榜
   * @param {number} limit - 限制筆數
   * @returns {Promise<Array>}
   */
  async getDailyLeaderboard(limit = 50) {
    if (!this.isAvailable()) {
      return [];
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('evolution_daily_leaderboard')
        .select('*')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GameRecordService] 取得每日排行榜失敗:', error);
      return [];
    }
  }

  /**
   * 取得每週排行榜
   * @param {number} limit - 限制筆數
   * @returns {Promise<Array>}
   */
  async getWeeklyLeaderboard(limit = 50) {
    if (!this.isAvailable()) {
      return [];
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('evolution_weekly_leaderboard')
        .select('*')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GameRecordService] 取得每週排行榜失敗:', error);
      return [];
    }
  }

  /**
   * 預設統計資料
   * @returns {Object}
   */
  getDefaultStats() {
    return {
      games_played: 0,
      games_won: 0,
      total_score: 0,
      total_creatures: 0,
      total_traits: 0,
      total_kills: 0,
      total_deaths: 0,
      highest_score: 0,
      longest_game_rounds: 0,
      favorite_trait: null,
      last_played_at: null,
    };
  }
}

// 單例匯出
const gameRecordService = new GameRecordService();

module.exports = {
  GameRecordService,
  gameRecordService,
};
