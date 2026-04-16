/**
 * 賽季服務
 *
 * 負責賽季相關的資料庫操作，包含：
 * - 取得當前賽季資訊
 * - 賽季結算（發獎 + 軟重置 ELO）
 * - 賽季獎勵領取（冪等性保護）
 *
 * 工單 0064 - 賽季聯賽系統
 *
 * @module services/seasonService
 */

const { supabase } = require('../db/supabase');
const {
  getTierByElo,
  getTierProgress,
  getSeasonRemainingSeconds,
  formatSeasonCountdown,
  getSeasonRewards,
  calculateSoftResetElo,
} = require('../logic/common/seasonLogic');
const { DEFAULT_ELO } = require('../logic/common/eloLogic');

// ==================== 取得賽季資訊 ====================

/**
 * 取得目前活躍賽季（含倒計時和玩家段位）
 * @param {string|null} playerId - 玩家 ID（可選，用來計算個人段位）
 * @returns {Promise<object|null>}
 */
async function getCurrentSeason(playerId = null) {
  try {
    const { data: season, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !season) {
      return null;
    }

    const remainingSeconds = getSeasonRemainingSeconds(season.end_date);
    const countdown = formatSeasonCountdown(remainingSeconds);

    let playerInfo = null;

    if (playerId) {
      const { data: player } = await supabase
        .from('players')
        .select('id, display_name, elo_rating, season_peak_elo')
        .eq('id', playerId)
        .single();

      if (player) {
        const elo = player.elo_rating || DEFAULT_ELO;
        const tier = getTierByElo(elo);
        const progress = getTierProgress(elo);

        // 查詢賽季排名（依 ELO 降序）
        const { count: rankCount } = await supabase
          .from('players')
          .select('id', { count: 'exact', head: true })
          .gt('elo_rating', elo);

        playerInfo = {
          playerId: player.id,
          displayName: player.display_name,
          eloRating: elo,
          seasonPeakElo: player.season_peak_elo || DEFAULT_ELO,
          tier,
          progress,
          rank: (rankCount || 0) + 1,
        };
      }
    }

    return {
      season: {
        id: season.id,
        name: season.name,
        startDate: season.start_date,
        endDate: season.end_date,
        status: season.status,
      },
      countdown,
      remainingSeconds,
      player: playerInfo,
    };
  } catch (err) {
    console.error('[seasonService] getCurrentSeason 錯誤:', err.message);
    return null;
  }
}

// ==================== 賽季獎勵領取 ====================

/**
 * 玩家領取賽季獎勵（冪等性保護：同一賽季只能領一次）
 * @param {number} seasonId - 賽季 ID
 * @param {string} playerId - 玩家 ID (UUID)
 * @returns {Promise<{ success: boolean, message: string, rewards?: object }>}
 */
async function claimSeasonReward(seasonId, playerId) {
  try {
    // 1. 查詢賽季是否存在
    const { data: season } = await supabase
      .from('seasons')
      .select('id, name, status')
      .eq('id', seasonId)
      .single();

    if (!season) {
      return { success: false, message: '賽季不存在' };
    }

    // 2. 查詢是否已領取（冪等性保護）
    const { data: existing } = await supabase
      .from('season_results')
      .select('id, rewards_claimed')
      .eq('season_id', seasonId)
      .eq('player_id', playerId)
      .single();

    if (existing && existing.rewards_claimed) {
      return { success: false, message: '本賽季獎勵已領取' };
    }

    // 3. 取得玩家當前 ELO 和段位
    const { data: player } = await supabase
      .from('players')
      .select('id, elo_rating, season_peak_elo')
      .eq('id', playerId)
      .single();

    if (!player) {
      return { success: false, message: '玩家不存在' };
    }

    const elo = player.elo_rating || DEFAULT_ELO;
    const tier = getTierByElo(elo);
    const rewards = getSeasonRewards(tier.id);

    // 4. 寫入或更新 season_results
    if (existing) {
      const { error: updateError } = await supabase
        .from('season_results')
        .update({
          final_elo: elo,
          tier: tier.id,
          rewards_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[seasonService] 更新 season_results 失敗:', updateError.message);
        return { success: false, message: '領取失敗，請稍後再試' };
      }
    } else {
      const { error: insertError } = await supabase
        .from('season_results')
        .insert({
          season_id: seasonId,
          player_id: playerId,
          final_elo: elo,
          tier: tier.id,
          rewards_claimed: true,
          claimed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[seasonService] 寫入 season_results 失敗:', insertError.message);
        return { success: false, message: '領取失敗，請稍後再試' };
      }
    }

    return {
      success: true,
      message: '獎勵領取成功',
      rewards: {
        tier: tier.id,
        tierName: tier.name,
        ...rewards,
      },
    };
  } catch (err) {
    console.error('[seasonService] claimSeasonReward 錯誤:', err.message);
    return { success: false, message: '系統錯誤' };
  }
}

// ==================== 賽季結算（Cron job 用） ====================

/**
 * 執行賽季結算：記錄所有玩家最終段位、軟重置 ELO
 * @param {number} seasonId - 要結算的賽季 ID
 * @returns {Promise<{ success: boolean, processed: number, message: string }>}
 */
async function endSeason(seasonId) {
  try {
    // 1. 確認賽季存在且為 active
    const { data: season } = await supabase
      .from('seasons')
      .select('id, name, status')
      .eq('id', seasonId)
      .single();

    if (!season) {
      return { success: false, processed: 0, message: '賽季不存在' };
    }

    if (season.status === 'ended') {
      return { success: false, processed: 0, message: '賽季已結算' };
    }

    // 2. 取得所有玩過遊戲的玩家
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, elo_rating, season_peak_elo')
      .gt('games_played', 0);

    if (playersError || !players) {
      return { success: false, processed: 0, message: '無法取得玩家資料' };
    }

    let processed = 0;

    for (const player of players) {
      const elo = player.elo_rating || DEFAULT_ELO;
      const tier = getTierByElo(elo);
      const newElo = calculateSoftResetElo(elo);

      // 記錄賽季結果（upsert 防止重複）
      await supabase
        .from('season_results')
        .upsert(
          {
            season_id: seasonId,
            player_id: player.id,
            final_elo: elo,
            tier: tier.id,
            rewards_claimed: false,
          },
          { onConflict: 'season_id,player_id', ignoreDuplicates: true }
        );

      // 軟重置 ELO 並重置賽季峰值
      await supabase
        .from('players')
        .update({
          elo_rating: newElo,
          season_peak_elo: newElo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', player.id);

      processed++;
    }

    // 3. 將賽季標記為已結束
    await supabase
      .from('seasons')
      .update({ status: 'ended' })
      .eq('id', seasonId);

    return {
      success: true,
      processed,
      message: `賽季 ${season.name} 結算完成，共處理 ${processed} 位玩家`,
    };
  } catch (err) {
    console.error('[seasonService] endSeason 錯誤:', err.message);
    return { success: false, processed: 0, message: '系統錯誤' };
  }
}

module.exports = {
  getCurrentSeason,
  claimSeasonReward,
  endSeason,
};
