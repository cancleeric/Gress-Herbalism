/**
 * Supabase 資料庫連線設定
 * 工單 0055, 0060
 */

const { createClient } = require('@supabase/supabase-js');
const {
  INITIAL_ELO_RATING,
  calculateMultiplayerEloChanges,
} = require('../utils/eloRating');
const PLAYER_ID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 從環境變數讀取設定，若無則使用預設值（開發用）
const supabaseUrl = process.env.SUPABASE_URL || 'https://rvlmpnovbrksqwtihwqi.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bG1wbm92YnJrc3F3dGlod3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDMxNDUsImV4cCI6MjA4NDc3OTE0NX0.wLuRDB0gaNc2rRyDOZ8ea8aTBzT2jF8f7m3TCCaCcMU';

// 建立 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function clampLimit(limit, defaultValue, maxValue = 100) {
  const parsed = Number.parseInt(limit, 10);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
  return Math.min(Math.max(normalized, 1), maxValue);
}

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
async function getLeaderboard(orderBy = 'elo_rating', limit = 10, options = {}) {
  try {
    const safeLimit = clampLimit(limit, 10);
    const validOrderBy = ['elo_rating', 'total_score', 'games_won', 'win_rate'].includes(orderBy)
      ? orderBy
      : 'elo_rating';

    const { data, error } = await supabase
      .from('players')
      .select('id, firebase_uid, display_name, avatar_url, total_score, games_played, games_won, win_rate, highest_score, elo_rating, season_peak_elo')
      .gt('games_played', 0) // 至少玩過一場
      .order(validOrderBy, { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('取得排行榜失敗:', error.message);
      return { entries: [], viewer: null };
    }

    const entries = (data || []).map((player, index) => ({
      rank: index + 1,
      losses: Math.max(0, (player.games_played || 0) - (player.games_won || 0)),
      elo_rating: player.elo_rating ?? INITIAL_ELO_RATING,
      ...player,
    }));

    let viewer = null;
    if (options.viewerFirebaseUid) {
      const target = entries.find((item) => item.firebase_uid === options.viewerFirebaseUid);

      if (target) {
        viewer = {
          rank: target.rank,
          eloRating: target.elo_rating,
          gamesPlayed: target.games_played,
          gamesWon: target.games_won,
        };
      } else {
        const { data: viewerPlayer, error: viewerError } = await supabase
          .from('players')
          .select('id, elo_rating, games_played, games_won')
          .eq('firebase_uid', options.viewerFirebaseUid)
          .single();

        if (!viewerError && viewerPlayer) {
          const viewerElo = viewerPlayer.elo_rating ?? INITIAL_ELO_RATING;
          const { count, error: rankError } = await supabase
            .from('players')
            .select('id', { count: 'exact', head: true })
            .gt('elo_rating', viewerElo);

          if (!rankError) {
            viewer = {
              rank: (count || 0) + 1,
              eloRating: viewerElo,
              gamesPlayed: viewerPlayer.games_played || 0,
              gamesWon: viewerPlayer.games_won || 0,
            };
          }
        }
      }
    }

    return { entries, viewer };
  } catch (err) {
    console.error('getLeaderboard 錯誤:', err.message);
    return { entries: [], viewer: null };
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
      .select('games_played, games_won, total_score, highest_score, win_rate, elo_rating, season_peak_elo')
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
 * 取得目前賽季
 * @returns {Promise<object|null>}
 */
async function getCurrentSeason() {
  try {
    const now = new Date().toISOString();

    const { data: activeSeason, error: activeError } = await supabase
      .from('seasons')
      .select('id, season_name, start_date, end_date, status')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activeError && activeSeason) {
      return activeSeason;
    }

    const { data: dateSeason, error: dateError } = await supabase
      .from('seasons')
      .select('id, season_name, start_date, end_date, status')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dateError || !dateSeason) {
      return null;
    }

    return dateSeason;
  } catch (err) {
    console.error('getCurrentSeason 錯誤:', err.message);
    return null;
  }
}

/**
 * 取得賽季排行榜
 * @param {number} limit
 * @param {number|null} seasonId
 * @returns {Promise<{entries: Array, season: object|null}>}
 */
async function getSeasonLeaderboard(limit = 100, seasonId = null) {
  try {
    const safeLimit = clampLimit(limit, 100);
    let targetSeason = null;

    if (seasonId) {
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('id, season_name, start_date, end_date, status')
        .eq('id', seasonId)
        .maybeSingle();
      targetSeason = seasonData || null;
    } else {
      targetSeason = await getCurrentSeason();
    }

    const { data, error } = await supabase
      .from('players')
      .select('id, firebase_uid, display_name, avatar_url, games_played, games_won, win_rate, elo_rating, season_peak_elo')
      .gt('games_played', 0)
      .order('season_peak_elo', { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('取得賽季排行榜失敗:', error.message);
      return { entries: [], season: targetSeason };
    }

    const entries = (data || []).map((player, index) => ({
      rank: index + 1,
      losses: Math.max(0, (player.games_played || 0) - (player.games_won || 0)),
      elo_rating: player.elo_rating ?? INITIAL_ELO_RATING,
      season_peak_elo: player.season_peak_elo ?? player.elo_rating ?? INITIAL_ELO_RATING,
      ...player,
    }));

    return { entries, season: targetSeason };
  } catch (err) {
    console.error('getSeasonLeaderboard 錯誤:', err.message);
    return { entries: [], season: null };
  }
}

/**
 * 取得玩家 ELO 歷史
 * @param {string} playerIdentifier - Firebase UID 或 player UUID
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getPlayerEloHistory(playerIdentifier, limit = 20) {
  try {
    const safeLimit = clampLimit(limit, 20);
    const isUuid = PLAYER_ID_UUID_REGEX.test(playerIdentifier);

    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq(isUuid ? 'id' : 'firebase_uid', playerIdentifier)
      .maybeSingle();
    if (playerError || !playerData) {
      return [];
    }

    const { data, error } = await supabase
      .from('player_elo_history')
      .select('id, game_history_id, season_id, old_elo, new_elo, elo_change, created_at')
      .eq('player_id', playerData.id)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('取得玩家 ELO 歷史失敗:', error.message);
      return [];
    }

    return (data || []).reverse();
  } catch (err) {
    console.error('getPlayerEloHistory 錯誤:', err.message);
    return [];
  }
}

/**
 * 更新一場遊戲中所有玩家的 ELO
 * @param {Array} players - [{ playerId, score }]
 * @param {number|null} gameHistoryId
 */
async function updatePlayersEloRatings(players = [], gameHistoryId = null) {
  if (!Array.isArray(players) || players.length < 2) {
    return [];
  }

  try {
    const playerIds = players.map((p) => p.playerId).filter(Boolean);
    if (playerIds.length < 2) return [];

    const { data: dbPlayers, error } = await supabase
      .from('players')
      .select('id, games_played, elo_rating, season_peak_elo')
      .in('id', playerIds);

    if (error || !dbPlayers || dbPlayers.length < 2) {
      console.error('讀取 ELO 玩家資料失敗:', error?.message);
      return [];
    }

    const playerMap = new Map(dbPlayers.map((p) => [p.id, p]));
    const eloInput = players
      .filter((p) => playerMap.has(p.playerId))
      .map((p) => {
        const dbPlayer = playerMap.get(p.playerId);
        return {
          playerId: p.playerId,
          gamesPlayed: dbPlayer.games_played || 0,
          rating: dbPlayer.elo_rating ?? INITIAL_ELO_RATING,
          score: Number(p.score || 0),
        };
      });

    if (eloInput.length < 2) return [];

    const eloChanges = calculateMultiplayerEloChanges(eloInput);
    const now = new Date().toISOString();
    const currentSeason = await getCurrentSeason();

    await Promise.all(eloChanges.map(async (change) => {
      const dbPlayer = playerMap.get(change.playerId);
      const currentPeak = dbPlayer?.season_peak_elo ?? change.oldRating;

      const { error: updateError } = await supabase
        .from('players')
        .update({
          elo_rating: change.newRating,
          season_peak_elo: Math.max(currentPeak, change.newRating),
          updated_at: now,
        })
        .eq('id', change.playerId);

      if (updateError) {
        console.error(`更新玩家 ${change.playerId} ELO 失敗:`, updateError.message);
      }

      const { error: historyError } = await supabase
        .from('player_elo_history')
        .insert({
          player_id: change.playerId,
          game_history_id: gameHistoryId,
          season_id: currentSeason?.id || null,
          old_elo: change.oldRating,
          new_elo: change.newRating,
          elo_change: change.change,
        });

      if (historyError) {
        console.error(`寫入玩家 ${change.playerId} ELO 歷史失敗:`, historyError.message);
      }
    }));

    return eloChanges;
  } catch (err) {
    console.error('updatePlayersEloRatings 錯誤:', err.message);
    return [];
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

module.exports = {
  supabase,
  testConnection,
  getOrCreatePlayer,
  updatePlayerStats,
  saveGameRecord,
  saveGameParticipants,
  getLeaderboard,
  getSeasonLeaderboard,
  getCurrentSeason,
  getPlayerEloHistory,
  // 工單 0060 新增
  getPlayerStats,
  getPlayerHistory,
  updatePlayerGameStats,
  updatePlayersEloRatings,
  getPlayerIdByFirebaseUid,
};
