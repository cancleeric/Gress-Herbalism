/**
 * Supabase 資料庫連線設定
 * 工單 0055, 0060
 */

const { createClient } = require('@supabase/supabase-js');
const {
  DEFAULT_ELO_RATING,
  getCurrentSeasonId,
  calculateMultiplayerEloChanges,
} = require('../services/eloService');

// 從環境變數讀取設定，若無則使用預設值（開發用）
const supabaseUrl = process.env.SUPABASE_URL || 'https://rvlmpnovbrksqwtihwqi.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bG1wbm92YnJrc3F3dGlod3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDMxNDUsImV4cCI6MjA4NDc3OTE0NX0.wLuRDB0gaNc2rRyDOZ8ea8aTBzT2jF8f7m3TCCaCcMU';

// 建立 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 測試資料庫連線
 * @returns {Promise<boolean>} 連線是否成功
 */
async function testConnection() {
  try {
    const { data, error } = await supabase.from('players').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      // PGRST116 表示表不存在，這是預期的（尚未建立表）
      console.error('Supabase 連線測試失敗:', error.message);
      return false;
    }
    console.log('Supabase 連線成功');
    return true;
  } catch (err) {
    console.error('Supabase 連線錯誤:', err.message);
    return false;
  }
}

// ==================== 玩家相關操作 ====================

/**
 * 建立或取得玩家資料
 * @param {string} odername - 玩家暱稱
 * @param {string|null} oderfirebaseUid - Firebase UID（可選）
 * @returns {Promise<object|null>} 玩家資料
 */
async function getOrCreatePlayer(displayName, firebaseUid = null) {
  try {
    // 如果有 Firebase UID，先嘗試用 UID 找
    if (firebaseUid) {
      const { data: existingPlayer, error: findError } = await supabase
        .from('players')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (existingPlayer) {
        return existingPlayer;
      }
    }

    // 建立新玩家
    const { data: newPlayer, error: createError } = await supabase
      .from('players')
      .insert({
        display_name: displayName,
        firebase_uid: firebaseUid,
      })
      .select()
      .single();

    if (createError) {
      console.error('建立玩家失敗:', createError.message);
      return null;
    }

    return newPlayer;
  } catch (err) {
    console.error('getOrCreatePlayer 錯誤:', err.message);
    return null;
  }
}

/**
 * 更新玩家統計資料
 * @param {string} playerId - 玩家 ID
 * @param {object} stats - 統計資料
 */
async function updatePlayerStats(playerId, stats) {
  try {
    const { error } = await supabase
      .from('players')
      .update({
        total_score: stats.totalScore,
        games_played: stats.gamesPlayed,
        games_won: stats.gamesWon,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerId);

    if (error) {
      console.error('更新玩家統計失敗:', error.message);
    }
  } catch (err) {
    console.error('updatePlayerStats 錯誤:', err.message);
  }
}

// ==================== 遊戲記錄相關操作 ====================

/**
 * 儲存遊戲記錄
 * @param {object} gameData - 遊戲資料
 * @returns {Promise<number|null>} 遊戲記錄 ID
 */
async function saveGameRecord(gameData) {
  try {
    const { data, error } = await supabase
      .from('game_history')
      .insert({
        game_id: gameData.gameId,
        winner_name: gameData.winnerName,
        winner_id: gameData.winnerId || null,
        player_count: gameData.playerCount,
        rounds_played: gameData.roundsPlayed,
        duration_seconds: gameData.durationSeconds,
      })
      .select('id')
      .single();

    if (error) {
      console.error('儲存遊戲記錄失敗:', error.message);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('saveGameRecord 錯誤:', err.message);
    return null;
  }
}

/**
 * 儲存遊戲參與者記錄
 * @param {number} gameHistoryId - 遊戲記錄 ID
 * @param {Array} participants - 參與者列表
 */
async function saveGameParticipants(gameHistoryId, participants) {
  try {
    const records = participants.map(p => ({
      game_history_id: gameHistoryId,
      player_name: p.name,
      player_id: p.playerId || null,
      final_score: p.score,
      is_winner: p.isWinner,
    }));

    const { error } = await supabase
      .from('game_participants')
      .insert(records);

    if (error) {
      console.error('儲存遊戲參與者失敗:', error.message);
    }
  } catch (err) {
    console.error('saveGameParticipants 錯誤:', err.message);
  }
}

// ==================== 排行榜相關操作 ====================

/**
 * 取得排行榜
 * @param {string} orderBy - 排序欄位 ('total_score' | 'games_won' | 'win_rate')
 * @param {number} limit - 限制筆數
 * @returns {Promise<Array>} 排行榜資料
 */
async function getLeaderboard(orderBy = 'elo_rating', limit = 100, rankingType = 'global') {
  try {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 100);
    const seasonId = getCurrentSeasonId();
    const isSeason = rankingType === 'season';
    const allowedOrderBy = isSeason
      ? ['season_current_elo', 'season_games_won', 'season_peak_elo', 'season_games_played']
      : ['elo_rating', 'games_won', 'win_rate', 'total_score', 'games_played'];

    const safeOrderBy = allowedOrderBy.includes(orderBy)
      ? orderBy
      : (isSeason ? 'season_current_elo' : 'elo_rating');

    let query = supabase
      .from('players')
      .select('id, firebase_uid, display_name, avatar_url, total_score, games_played, games_won, win_rate, highest_score, elo_rating, season_current_elo, season_peak_elo, current_season_id, season_games_played, season_games_won')
      .gt('games_played', 0) // 至少玩過一場
      .order(safeOrderBy, { ascending: false })
      .limit(safeLimit);

    if (isSeason) {
      query = query.eq('current_season_id', seasonId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('取得排行榜失敗:', error.message);
      return [];
    }

    // 加上排名
    return (data || []).map((player, index) => ({
      rank: index + 1,
      ranking_type: isSeason ? 'season' : 'global',
      season_id: player.current_season_id || seasonId,
      ...player,
    }));
  } catch (err) {
    console.error('getLeaderboard 錯誤:', err.message);
    return [];
  }
}

// ==================== 工單 0060 新增功能 ====================

/**
 * 取得玩家統計資料
 * @param {string} firebaseUid - Firebase UID
 * @returns {Promise<object|null>} 玩家統計資料
 */
async function getPlayerStats(firebaseUid) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('games_played, games_won, total_score, highest_score, win_rate')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (error) {
      console.error('取得玩家統計失敗:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('getPlayerStats 錯誤:', err.message);
    return null;
  }
}

/**
 * 取得玩家遊戲歷史
 * @param {string} playerId - 玩家 ID (UUID)
 * @param {number} limit - 限制筆數
 * @returns {Promise<Array>} 遊戲歷史記錄
 */
async function getPlayerHistory(playerId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        final_score,
        is_winner,
        created_at,
        game_history (
          game_id,
          player_count,
          rounds_played,
          winner_name
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('取得玩家歷史失敗:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getPlayerHistory 錯誤:', err.message);
    return [];
  }
}

/**
 * 完整更新玩家遊戲統計（遊戲結束時呼叫）
 * @param {string} playerId - 玩家 ID (UUID)
 * @param {object} gameResult - 遊戲結果 { score, isWinner }
 */
async function updatePlayerGameStats(playerId, gameResult) {
  try {
    // 先取得目前統計
    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('games_played, games_won, total_score, highest_score')
      .eq('id', playerId)
      .single();

    if (fetchError || !player) {
      console.error('取得玩家資料失敗:', fetchError?.message);
      return;
    }

    // 計算新統計
    const newStats = {
      games_played: player.games_played + 1,
      games_won: player.games_won + (gameResult.isWinner ? 1 : 0),
      total_score: player.total_score + gameResult.score,
      highest_score: Math.max(player.highest_score, gameResult.score),
      last_played_at: new Date().toISOString(),
    };

    // 更新資料
    const { error: updateError } = await supabase
      .from('players')
      .update(newStats)
      .eq('id', playerId);

    if (updateError) {
      console.error('更新玩家統計失敗:', updateError.message);
    }
  } catch (err) {
    console.error('updatePlayerGameStats 錯誤:', err.message);
  }
}

/**
 * 更新多位玩家 ELO（全域 + 賽季）並寫入歷史
 * @param {Object} params
 * @param {Array<{playerId: string, isWinner: boolean}>} params.participants
 * @param {string|null} params.winnerId
 * @param {string} params.gameId
 * @returns {Promise<{seasonId: string, changes: object}>}
 */
async function updatePlayersElo({ participants = [], winnerId = null, gameId = null }) {
  try {
    if (!Array.isArray(participants) || participants.length < 2 || !winnerId) {
      return { seasonId: getCurrentSeasonId(), changes: {} };
    }

    const seasonId = getCurrentSeasonId();
    const participantIds = participants.map(p => p.playerId).filter(Boolean);

    const { data: playerRows, error: fetchError } = await supabase
      .from('players')
      .select('id, elo_rating, games_played, current_season_id, season_current_elo, season_peak_elo, season_games_played, season_games_won')
      .in('id', participantIds);

    if (fetchError || !playerRows || playerRows.length < 2) {
      return { seasonId, changes: {} };
    }

    const playersForElo = playerRows.map(row => ({
      playerId: row.id,
      eloRating: row.elo_rating ?? DEFAULT_ELO_RATING,
      gamesPlayed: row.games_played ?? 0,
    }));

    const eloChanges = calculateMultiplayerEloChanges(playersForElo, winnerId);
    const updates = [];
    const historyRows = [];

    for (const row of playerRows) {
      const change = eloChanges[row.id];
      if (!change) continue;

      const isNewSeason = row.current_season_id !== seasonId;
      const seasonBefore = isNewSeason
        ? DEFAULT_ELO_RATING
        : (row.season_current_elo ?? DEFAULT_ELO_RATING);
      const seasonAfter = Math.max(0, seasonBefore + change.delta);
      const seasonPeakBefore = isNewSeason
        ? DEFAULT_ELO_RATING
        : (row.season_peak_elo ?? DEFAULT_ELO_RATING);
      const participant = participants.find(p => p.playerId === row.id);
      const isWinner = Boolean(participant?.isWinner);

      updates.push(
        supabase
          .from('players')
          .update({
            elo_rating: change.afterRating,
            current_season_id: seasonId,
            season_current_elo: seasonAfter,
            season_peak_elo: Math.max(seasonPeakBefore, seasonAfter),
            season_games_played: (isNewSeason ? 0 : (row.season_games_played ?? 0)) + 1,
            season_games_won: (isNewSeason ? 0 : (row.season_games_won ?? 0)) + (isWinner ? 1 : 0),
          })
          .eq('id', row.id)
      );

      historyRows.push({
        player_id: row.id,
        game_id: gameId,
        season_id: seasonId,
        elo_before: change.beforeRating,
        elo_after: change.afterRating,
        elo_change: change.delta,
      });
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    if (historyRows.length > 0) {
      await supabase.from('player_elo_history').insert(historyRows);
    }

    return { seasonId, changes: eloChanges };
  } catch (err) {
    console.error('updatePlayersElo 錯誤:', err.message);
    return { seasonId: getCurrentSeasonId(), changes: {} };
  }
}

/**
 * 根據 Firebase UID 取得玩家 ID
 * @param {string} firebaseUid - Firebase UID
 * @returns {Promise<string|null>} 玩家 ID (UUID)
 */
async function getPlayerIdByFirebaseUid(firebaseUid) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('getPlayerIdByFirebaseUid 錯誤:', err.message);
    return null;
  }
}

/**
 * 取得玩家 ELO 歷史
 * @param {string} playerId - 玩家 UUID
 * @param {number} limit - 筆數
 * @returns {Promise<Array>}
 */
async function getPlayerEloHistory(playerId, limit = 20) {
  try {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const { data, error } = await supabase
      .from('player_elo_history')
      .select('id, game_id, season_id, elo_before, elo_after, elo_change, created_at')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('getPlayerEloHistory 錯誤:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getPlayerEloHistory 錯誤:', err.message);
    return [];
  }
}

module.exports = {
  supabase,
  testConnection,
  getOrCreatePlayer,
  updatePlayerStats,
  saveGameRecord,
  saveGameParticipants,
  getLeaderboard,
  updatePlayersElo,
  // 工單 0060 新增
  getPlayerStats,
  getPlayerHistory,
  updatePlayerGameStats,
  getPlayerIdByFirebaseUid,
  getPlayerEloHistory,
};
