/**
 * 本草百科收藏服務
 * Issue #63 - 本草百科集收藏系統
 *
 * 負責 herb_encyclopedia 和 player_collection 資料表的 CRUD 操作
 */

const { supabase } = require('../db/supabase');
const {
  getNewlyUnlockedHerbs,
  getCollectionProgress,
} = require('../logic/herbalism/collectionLogic');

// ==================== 本草百科 ====================

/**
 * 取得完整本草百科列表
 * @returns {Promise<Array>} 所有草藥資料
 */
async function getEncyclopedia() {
  try {
    const { data, error } = await supabase
      .from('herb_encyclopedia')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('取得本草百科失敗:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getEncyclopedia 錯誤:', err.message);
    return [];
  }
}

/**
 * 取得特定草藥詳細資訊
 * @param {string} herbId - 草藥 ID（red/yellow/green/blue）
 * @returns {Promise<object|null>} 草藥資料
 */
async function getHerbById(herbId) {
  try {
    const { data, error } = await supabase
      .from('herb_encyclopedia')
      .select('*')
      .eq('herb_id', herbId)
      .single();

    if (error) {
      console.error(`取得草藥 ${herbId} 失敗:`, error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('getHerbById 錯誤:', err.message);
    return null;
  }
}

// ==================== 玩家收藏 ====================

/**
 * 取得玩家收藏狀態（包含進度統計）
 * @param {string} playerId - 玩家 UUID
 * @returns {Promise<{collection: Array, progress: object}>}
 */
async function getPlayerCollection(playerId) {
  try {
    const { data, error } = await supabase
      .from('player_collection')
      .select('herb_id, unlocked_at, times_seen')
      .eq('player_id', playerId);

    if (error) {
      console.error('取得玩家收藏失敗:', error.message);
      return { collection: [], progress: getCollectionProgress([]) };
    }

    const collection = data || [];
    const unlockedHerbIds = collection.map(c => c.herb_id);
    const progress = getCollectionProgress(unlockedHerbIds);

    return { collection, progress };
  } catch (err) {
    console.error('getPlayerCollection 錯誤:', err.message);
    return { collection: [], progress: getCollectionProgress([]) };
  }
}

/**
 * 在遊戲結束後更新玩家收藏（解鎖新草藥）
 * @param {string} playerId - 玩家 UUID
 * @param {object} playerStats - 玩家統計 { games_played, games_won }
 * @returns {Promise<string[]>} 本次新解鎖的草藥 ID 列表
 */
async function updateCollectionAfterGame(playerId, playerStats) {
  try {
    // 取得目前已解鎖的草藥
    const { data: existing } = await supabase
      .from('player_collection')
      .select('herb_id')
      .eq('player_id', playerId);

    const alreadyUnlocked = (existing || []).map(c => c.herb_id);

    // 計算本次新解鎖
    const newlyUnlocked = getNewlyUnlockedHerbs(playerStats, alreadyUnlocked);

    if (newlyUnlocked.length === 0) {
      return [];
    }

    // 插入新解鎖記錄
    const records = newlyUnlocked.map(herbId => ({
      player_id: playerId,
      herb_id: herbId,
      times_seen: 1,
    }));

    const { error: insertError } = await supabase
      .from('player_collection')
      .insert(records);

    if (insertError) {
      // 忽略 unique 衝突（並發保護）
      if (insertError.code !== '23505') {
        console.error('插入收藏記錄失敗:', insertError.message);
      }
    }

    return newlyUnlocked;
  } catch (err) {
    console.error('updateCollectionAfterGame 錯誤:', err.message);
    return [];
  }
}

/**
 * 增加玩家見過特定草藥的次數（每局遊戲結束時）
 * @param {string} playerId - 玩家 UUID
 * @param {string[]} seenHerbIds - 本局見過的草藥 ID 列表
 * @returns {Promise<void>}
 */
async function incrementTimesSeen(playerId, seenHerbIds) {
  if (!seenHerbIds || seenHerbIds.length === 0) return;

  try {
    for (const herbId of seenHerbIds) {
      // 嘗試更新已解鎖的記錄
      const { data: existing } = await supabase
        .from('player_collection')
        .select('id, times_seen')
        .eq('player_id', playerId)
        .eq('herb_id', herbId)
        .single();

      if (existing) {
        await supabase
          .from('player_collection')
          .update({ times_seen: (existing.times_seen || 1) + 1 })
          .eq('id', existing.id);
      }
    }
  } catch (err) {
    console.error('incrementTimesSeen 錯誤:', err.message);
  }
}

module.exports = {
  getEncyclopedia,
  getHerbById,
  getPlayerCollection,
  updateCollectionAfterGame,
  incrementTimesSeen,
};
