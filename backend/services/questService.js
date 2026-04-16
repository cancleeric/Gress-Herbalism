/**
 * 每日任務服務
 * Issue #61 - 每日任務系統
 *
 * 負責 daily_quests 和 player_checkins 資料表的 CRUD 操作
 */

const { supabase } = require('../db/supabase');
const {
  getTodayUTC8,
  getYesterdayUTC8,
  generateDailyQuests,
  calculateProgressIncrement,
  calculateCheckinReward,
  QUEST_TYPES,
} = require('../logic/herbalism/questLogic');

// ==================== 每日任務 ====================

/**
 * 取得（或建立）玩家今日任務
 * @param {string} playerId - 玩家 UUID
 * @returns {Promise<Array>} 今日任務列表
 */
async function getDailyQuests(playerId) {
  const today = getTodayUTC8();

  try {
    // 查詢今日任務
    const { data: existing, error: fetchError } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('player_id', playerId)
      .eq('date', today);

    if (fetchError) {
      console.error('取得每日任務失敗:', fetchError.message);
      return [];
    }

    // 已有今日任務，直接回傳
    if (existing && existing.length > 0) {
      return existing;
    }

    // 尚無今日任務，自動生成 3 個
    return await refreshDailyQuests(playerId, today);
  } catch (err) {
    console.error('getDailyQuests 錯誤:', err.message);
    return [];
  }
}

/**
 * 為玩家生成並儲存今日任務
 * @param {string} playerId - 玩家 UUID
 * @param {string} date - 日期字串（YYYY-MM-DD）
 * @returns {Promise<Array>} 新建立的任務列表
 */
async function refreshDailyQuests(playerId, date) {
  try {
    const templates = generateDailyQuests();
    const records = templates.map(t => ({
      player_id: playerId,
      quest_type: t.quest_type,
      difficulty: t.difficulty,
      target: t.target,
      progress: 0,
      completed: false,
      reward_claimed: false,
      reward_coins: t.reward_coins,
      date,
    }));

    const { data, error } = await supabase
      .from('daily_quests')
      .insert(records)
      .select();

    if (error) {
      console.error('建立每日任務失敗:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('refreshDailyQuests 錯誤:', err.message);
    return [];
  }
}

/**
 * 更新任務進度（遊戲結束時呼叫）
 * @param {string} playerId - 玩家 UUID
 * @param {object} gameResult - 遊戲結果 { isWinner, consecutiveWins }
 * @returns {Promise<Array>} 更新後的任務列表（含剛完成的任務）
 */
async function updateQuestProgress(playerId, gameResult) {
  const today = getTodayUTC8();
  const justCompleted = [];

  try {
    // 取得今日未完成任務
    const { data: quests, error: fetchError } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('player_id', playerId)
      .eq('date', today)
      .eq('completed', false);

    if (fetchError || !quests) {
      console.error('取得任務進度失敗:', fetchError?.message);
      return justCompleted;
    }

    for (const quest of quests) {
      const increment = calculateProgressIncrement(quest.quest_type, gameResult);
      let newProgress;

      if (increment === null) {
        // WIN_STREAK 失敗：重置進度
        newProgress = 0;
      } else {
        newProgress = quest.progress + increment;
      }

      const completed = newProgress >= quest.target;

      const { error: updateError } = await supabase
        .from('daily_quests')
        .update({ progress: newProgress, completed })
        .eq('id', quest.id);

      if (updateError) {
        console.error(`更新任務 ${quest.id} 進度失敗:`, updateError.message);
        continue;
      }

      if (completed) {
        justCompleted.push({ ...quest, progress: newProgress, completed: true });
      }
    }

    return justCompleted;
  } catch (err) {
    console.error('updateQuestProgress 錯誤:', err.message);
    return justCompleted;
  }
}

/**
 * 領取任務獎勵（冪等性保護）
 * @param {string} questId - 任務 ID
 * @param {string} playerId - 玩家 UUID（驗證用）
 * @returns {Promise<{success: boolean, coins: number, message: string}>}
 */
async function claimQuestReward(questId, playerId) {
  try {
    // 取得任務資料
    const { data: quest, error: fetchError } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('id', questId)
      .eq('player_id', playerId)
      .single();

    if (fetchError || !quest) {
      return { success: false, coins: 0, message: '任務不存在' };
    }
    if (!quest.completed) {
      return { success: false, coins: 0, message: '任務尚未完成' };
    }
    if (quest.reward_claimed) {
      return { success: false, coins: 0, message: '獎勵已領取' };
    }

    // 標記已領取
    const { error: updateError } = await supabase
      .from('daily_quests')
      .update({ reward_claimed: true })
      .eq('id', questId);

    if (updateError) {
      console.error('標記獎勵已領取失敗:', updateError.message);
      return { success: false, coins: 0, message: '領取失敗，請稍後再試' };
    }

    // 發放金幣
    const { error: coinsError } = await supabase.rpc('add_player_coins', {
      p_player_id: playerId,
      p_coins: quest.reward_coins,
    }).catch(() => ({ error: null })); // 若 RPC 不存在則跳過

    if (coinsError) {
      // 備援：直接用 SQL 更新
      await supabase
        .from('players')
        .update({ coins: supabase.raw(`coins + ${quest.reward_coins}`) })
        .eq('id', playerId)
        .catch(() => {});
    }

    return { success: true, coins: quest.reward_coins, message: '獎勵領取成功' };
  } catch (err) {
    console.error('claimQuestReward 錯誤:', err.message);
    return { success: false, coins: 0, message: '系統錯誤' };
  }
}

// ==================== 簽到系統 ====================

/**
 * 玩家每日簽到
 * @param {string} playerId - 玩家 UUID
 * @returns {Promise<{success: boolean, alreadyCheckedIn: boolean, streakCount: number, coins: number}>}
 */
async function dailyCheckin(playerId) {
  const today = getTodayUTC8();
  const yesterday = getYesterdayUTC8();

  try {
    // 確認今日是否已簽到（冪等性）
    const { data: existing } = await supabase
      .from('player_checkins')
      .select('*')
      .eq('player_id', playerId)
      .eq('date', today)
      .single();

    if (existing) {
      return {
        success: true,
        alreadyCheckedIn: true,
        streakCount: existing.streak_count,
        coins: existing.reward_coins,
      };
    }

    // 查昨天的簽到，計算連續天數
    const { data: yesterdayRecord } = await supabase
      .from('player_checkins')
      .select('streak_count')
      .eq('player_id', playerId)
      .eq('date', yesterday)
      .single();

    const streakCount = yesterdayRecord ? yesterdayRecord.streak_count + 1 : 1;
    const coins = calculateCheckinReward(streakCount);

    // 插入今日簽到
    const { error: insertError } = await supabase
      .from('player_checkins')
      .insert({
        player_id: playerId,
        date: today,
        streak_count: streakCount,
        reward_coins: coins,
      });

    if (insertError) {
      // 若發生 unique 衝突（並發請求），視為已簽到
      if (insertError.code === '23505') {
        const { data: existing2 } = await supabase
          .from('player_checkins')
          .select('*')
          .eq('player_id', playerId)
          .eq('date', today)
          .single();
        return {
          success: true,
          alreadyCheckedIn: true,
          streakCount: existing2?.streak_count || 1,
          coins: existing2?.reward_coins || 0,
        };
      }
      console.error('簽到失敗:', insertError.message);
      return { success: false, alreadyCheckedIn: false, streakCount: 0, coins: 0 };
    }

    // 發放簽到金幣
    await supabase
      .from('players')
      .select('coins')
      .eq('id', playerId)
      .single()
      .then(async ({ data: player }) => {
        if (player) {
          await supabase
            .from('players')
            .update({ coins: (player.coins || 0) + coins })
            .eq('id', playerId);
        }
      })
      .catch(() => {});

    return { success: true, alreadyCheckedIn: false, streakCount, coins };
  } catch (err) {
    console.error('dailyCheckin 錯誤:', err.message);
    return { success: false, alreadyCheckedIn: false, streakCount: 0, coins: 0 };
  }
}

/**
 * 取得玩家簽到資訊（連續天數、本月簽到日期）
 * @param {string} playerId - 玩家 UUID
 * @returns {Promise<{streakCount: number, todayCheckedIn: boolean, thisMonthDates: string[]}>}
 */
async function getCheckinInfo(playerId) {
  const today = getTodayUTC8();
  const monthStart = today.slice(0, 7) + '-01';

  try {
    const { data, error } = await supabase
      .from('player_checkins')
      .select('date, streak_count')
      .eq('player_id', playerId)
      .gte('date', monthStart)
      .order('date', { ascending: false });

    if (error) {
      console.error('取得簽到資訊失敗:', error.message);
      return { streakCount: 0, todayCheckedIn: false, thisMonthDates: [] };
    }

    const records = data || [];
    const todayRecord = records.find(r => r.date === today);
    const thisMonthDates = records.map(r => r.date);

    return {
      streakCount: todayRecord ? todayRecord.streak_count : (records[0]?.streak_count || 0),
      todayCheckedIn: !!todayRecord,
      thisMonthDates,
    };
  } catch (err) {
    console.error('getCheckinInfo 錯誤:', err.message);
    return { streakCount: 0, todayCheckedIn: false, thisMonthDates: [] };
  }
}

module.exports = {
  getDailyQuests,
  refreshDailyQuests,
  updateQuestProgress,
  claimQuestReward,
  dailyCheckin,
  getCheckinInfo,
};
