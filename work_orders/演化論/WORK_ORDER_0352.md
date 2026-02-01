# 工單 0352：遊戲記錄服務

## 基本資訊
- **工單編號**：0352
- **所屬計畫**：P2-C 資料庫統計
- **前置工單**：0351（資料庫結構）
- **預計影響檔案**：
  - `backend/services/evolution/gameRecordService.js`（新增）
  - `backend/services/supabaseClient.js`（新增/更新）

---

## 目標

建立遊戲記錄服務：
1. 遊戲開始記錄
2. 遊戲結束記錄
3. 參與者記錄
4. 統計更新

---

## 詳細規格

### 1. Supabase 客戶端

```javascript
// backend/services/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
```

### 2. 遊戲記錄服務

```javascript
// backend/services/evolution/gameRecordService.js

import supabase from '../supabaseClient.js';

/**
 * 遊戲記錄服務
 */
class GameRecordService {
  /**
   * 記錄遊戲開始
   */
  async recordGameStart(gameState) {
    const { id, config, turnOrder } = gameState;

    try {
      // 建立遊戲記錄
      const { data: game, error: gameError } = await supabase
        .from('evolution_games')
        .insert({
          id,
          status: 'playing',
          config,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // 建立參與者記錄
      const participants = turnOrder.map((playerId, index) => ({
        game_id: id,
        user_id: playerId,
        player_index: index,
      }));

      const { error: participantsError } = await supabase
        .from('evolution_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      return game;
    } catch (error) {
      console.error('Failed to record game start:', error);
      throw error;
    }
  }

  /**
   * 記錄遊戲結束
   */
  async recordGameEnd(gameState, scores) {
    const { id, round, winner } = gameState;
    const startedAt = new Date(gameState.startedAt);
    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt - startedAt) / 1000);

    try {
      // 更新遊戲記錄
      const { error: gameError } = await supabase
        .from('evolution_games')
        .update({
          status: 'finished',
          rounds: round,
          winner_id: winner,
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', id);

      if (gameError) throw gameError;

      // 更新參與者記錄
      const sortedScores = Object.entries(scores)
        .sort((a, b) => b[1].total - a[1].total);

      for (let i = 0; i < sortedScores.length; i++) {
        const [playerId, score] = sortedScores[i];

        const { error: participantError } = await supabase
          .from('evolution_participants')
          .update({
            final_score: score.total,
            final_rank: i + 1,
            creatures_count: score.creatures || 0,
            traits_count: score.traits || 0,
            food_bonus: score.foodBonus || 0,
            is_winner: playerId === winner,
          })
          .eq('game_id', id)
          .eq('user_id', playerId);

        if (participantError) throw participantError;

        // 更新玩家統計
        await this.updatePlayerStats(playerId, score, playerId === winner, round);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to record game end:', error);
      throw error;
    }
  }

  /**
   * 更新玩家統計
   */
  async updatePlayerStats(userId, score, isWinner, rounds) {
    try {
      // 先取得現有統計
      const { data: existing } = await supabase
        .from('evolution_player_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      const currentStats = existing || {
        games_played: 0,
        games_won: 0,
        total_score: 0,
        total_creatures: 0,
        total_traits: 0,
        highest_score: 0,
        longest_game_rounds: 0,
      };

      const newStats = {
        games_played: currentStats.games_played + 1,
        games_won: currentStats.games_won + (isWinner ? 1 : 0),
        total_score: currentStats.total_score + score.total,
        total_creatures: currentStats.total_creatures + (score.creatures || 0),
        total_traits: currentStats.total_traits + (score.traits || 0),
        highest_score: Math.max(currentStats.highest_score, score.total),
        longest_game_rounds: Math.max(currentStats.longest_game_rounds, rounds),
        last_played_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('evolution_player_stats')
        .upsert({
          user_id: userId,
          ...newStats,
        });

      if (error) throw error;

      return newStats;
    } catch (error) {
      console.error('Failed to update player stats:', error);
      throw error;
    }
  }

  /**
   * 取得玩家統計
   */
  async getPlayerStats(userId) {
    const { data, error } = await supabase
      .from('evolution_player_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || this.getDefaultStats();
  }

  /**
   * 取得玩家遊戲歷史
   */
  async getPlayerHistory(userId, limit = 20) {
    const { data, error } = await supabase
      .from('evolution_participants')
      .select(`
        *,
        game:evolution_games(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * 取得排行榜
   */
  async getLeaderboard(limit = 100) {
    const { data, error } = await supabase
      .from('evolution_leaderboard')
      .select('*')
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * 取得每日排行榜
   */
  async getDailyLeaderboard(limit = 50) {
    const { data, error } = await supabase
      .from('evolution_daily_leaderboard')
      .select('*')
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * 預設統計
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
    };
  }
}

export const gameRecordService = new GameRecordService();
export default gameRecordService;
```

---

## 驗收標準

1. [ ] 遊戲開始正確記錄
2. [ ] 遊戲結束正確記錄
3. [ ] 玩家統計正確更新
4. [ ] 歷史記錄可查詢
5. [ ] 排行榜正常運作
6. [ ] 錯誤處理完善

---

## 備註

- 使用 Supabase JS 客戶端
- 服務端使用 Service Key
- 需處理網路錯誤
