/**
 * Supabase 資料庫連線設定
 * 工單 0055
 */

const { createClient } = require('@supabase/supabase-js');

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
 * @param {string} orderBy - 排序欄位 ('total_score' | 'games_won' | 'games_played')
 * @param {number} limit - 限制筆數
 * @returns {Promise<Array>} 排行榜資料
 */
async function getLeaderboard(orderBy = 'total_score', limit = 10) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, display_name, total_score, games_played, games_won')
      .order(orderBy, { ascending: false })
      .limit(limit);

    if (error) {
      console.error('取得排行榜失敗:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getLeaderboard 錯誤:', err.message);
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
};
