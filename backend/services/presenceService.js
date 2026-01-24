/**
 * 線上狀態服務
 * 工單 0061
 */

const { supabase } = require('../db/supabase');

/**
 * 更新使用者線上狀態
 * @param {string} userId - 使用者 ID (UUID)
 * @param {string} status - 'online' | 'offline' | 'in_game'
 * @param {string} roomId - 房間 ID（遊戲中時）
 */
async function updatePresence(userId, status, roomId = null) {
  try {
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        status,
        current_room_id: roomId,
        last_seen_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (err) {
    console.error('updatePresence 錯誤:', err.message);
  }
}

/**
 * 設為離線
 * @param {string} userId - 使用者 ID
 */
async function setOffline(userId) {
  await updatePresence(userId, 'offline', null);
}

/**
 * 設為線上
 * @param {string} userId - 使用者 ID
 */
async function setOnline(userId) {
  await updatePresence(userId, 'online', null);
}

/**
 * 設為遊戲中
 * @param {string} userId - 使用者 ID
 * @param {string} roomId - 房間 ID
 */
async function setInGame(userId, roomId) {
  await updatePresence(userId, 'in_game', roomId);
}

/**
 * 取得好友的線上狀態
 * @param {string[]} friendIds - 好友 ID 列表
 */
async function getFriendsPresence(friendIds) {
  try {
    if (!friendIds || friendIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_presence')
      .select('user_id, status, current_room_id, last_seen_at')
      .in('user_id', friendIds);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getFriendsPresence 錯誤:', err.message);
    return [];
  }
}

module.exports = {
  updatePresence,
  setOffline,
  setOnline,
  setInGame,
  getFriendsPresence,
};
