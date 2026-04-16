/**
 * 本草圖鑑收藏服務
 * Issue #63 - 本草圖鑑收藏系統
 *
 * 負責 herb_encyclopedia 和 player_collection 資料表的 CRUD 操作
 */

const { supabase } = require('../db/supabase');

// ==================== 圖鑑資料 ====================

/**
 * 取得所有圖鑑條目（不含未解鎖者的敏感欄位）
 * @returns {Promise<Array>} 圖鑑條目列表（id, herb_id, name_zh, rarity）
 */
async function getAllEncyclopediaEntries() {
  try {
    const { data, error } = await supabase
      .from('herb_encyclopedia')
      .select('id, herb_id, name_zh, name_latin, rarity')
      .order('id', { ascending: true });

    if (error) {
      console.error('取得圖鑑條目失敗:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getAllEncyclopediaEntries 錯誤:', err.message);
    return [];
  }
}

/**
 * 取得單一圖鑑條目的完整資訊
 * @param {string} herbId - 藥草 ID（卡牌顏色）
 * @returns {Promise<Object|null>} 圖鑑條目，找不到時回傳 null
 */
async function getEncyclopediaEntry(herbId) {
  try {
    const { data, error } = await supabase
      .from('herb_encyclopedia')
      .select('*')
      .eq('herb_id', herbId)
      .single();

    if (error) {
      console.error(`取得圖鑑條目 ${herbId} 失敗:`, error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('getEncyclopediaEntry 錯誤:', err.message);
    return null;
  }
}

// ==================== 玩家收藏 ====================

/**
 * 取得玩家的收藏清單（含圖鑑資料）
 * @param {string} playerId - 玩家 UUID
 * @returns {Promise<{entries: Array, unlockedIds: string[], progress: Object}>}
 */
async function getPlayerCollection(playerId) {
  try {
    const [allEntries, collection] = await Promise.all([
      getAllEncyclopediaEntries(),
      getCollectionByPlayer(playerId),
    ]);

    const unlockedIds = collection.map(c => c.herb_id);
    const unlockedMap = {};
    collection.forEach(c => {
      unlockedMap[c.herb_id] = {
        unlockedAt: c.unlocked_at,
        useCount: c.use_count,
      };
    });

    const entries = allEntries.map(entry => ({
      ...entry,
      unlocked: unlockedIds.includes(entry.herb_id),
      unlockedAt: unlockedMap[entry.herb_id]?.unlockedAt || null,
      useCount: unlockedMap[entry.herb_id]?.useCount || 0,
    }));

    return {
      entries,
      unlockedCount: unlockedIds.length,
      totalCount: allEntries.length,
    };
  } catch (err) {
    console.error('getPlayerCollection 錯誤:', err.message);
    return { entries: [], unlockedCount: 0, totalCount: 0 };
  }
}

/**
 * 查詢玩家已解鎖的收藏記錄
 * @param {string} playerId - 玩家 UUID
 * @returns {Promise<Array>}
 */
async function getCollectionByPlayer(playerId) {
  try {
    const { data, error } = await supabase
      .from('player_collection')
      .select('herb_id, unlocked_at, use_count')
      .eq('player_id', playerId);

    if (error) {
      console.error('取得玩家收藏記錄失敗:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getCollectionByPlayer 錯誤:', err.message);
    return [];
  }
}

/**
 * 記錄玩家使用卡牌（解鎖或更新 use_count）
 * 對局結束時呼叫，每位玩家手牌中每個顏色算一次
 * @param {string} playerId - 玩家 UUID
 * @param {string[]} herbIds - 本局使用到的藥草 ID 陣列（去重後的顏色）
 * @returns {Promise<string[]>} 本次新解鎖的 herbId 列表
 */
async function recordCardUsage(playerId, herbIds) {
  const newlyUnlocked = [];

  if (!playerId || !herbIds || herbIds.length === 0) {
    return newlyUnlocked;
  }

  try {
    // 取得玩家目前已解鎖清單
    const existing = await getCollectionByPlayer(playerId);
    const existingMap = {};
    existing.forEach(c => {
      existingMap[c.herb_id] = c.use_count;
    });

    for (const herbId of herbIds) {
      if (existingMap[herbId] !== undefined) {
        // 已解鎖，僅更新使用次數
        await supabase
          .from('player_collection')
          .update({ use_count: existingMap[herbId] + 1 })
          .eq('player_id', playerId)
          .eq('herb_id', herbId);
      } else {
        // 尚未解鎖，插入新記錄
        const { error: insertError } = await supabase
          .from('player_collection')
          .insert({
            player_id: playerId,
            herb_id: herbId,
            use_count: 1,
          });

        if (!insertError) {
          newlyUnlocked.push(herbId);
        } else if (insertError.code === '23505') {
          // 並發衝突（unique 違反），另一個請求剛插入，改為遞增 use_count
          await supabase
            .from('player_collection')
            .update({ use_count: 2 })
            .eq('player_id', playerId)
            .eq('herb_id', herbId)
            .lt('use_count', 2); // 僅更新 use_count 為 1 的記錄，避免覆蓋更高的值
        } else {
          console.error(`解鎖藥草 ${herbId} 失敗:`, insertError.message);
        }
      }
    }

    return newlyUnlocked;
  } catch (err) {
    console.error('recordCardUsage 錯誤:', err.message);
    return newlyUnlocked;
  }
}

module.exports = {
  getAllEncyclopediaEntries,
  getEncyclopediaEntry,
  getPlayerCollection,
  recordCardUsage,
};
