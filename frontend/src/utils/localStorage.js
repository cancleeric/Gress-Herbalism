/**
 * LocalStorage 工具函數
 *
 * @module localStorage
 * @description 提供玩家資料的本地儲存功能
 */

const STORAGE_KEYS = {
  PLAYER_NAME: 'gress_player_name',
  PLAYER_SETTINGS: 'gress_player_settings',
  CURRENT_ROOM: 'gress_current_room',  // 工單 0079：重連資訊
};

/**
 * 儲存玩家暱稱
 * @param {string} name - 玩家暱稱
 */
export function savePlayerName(name) {
  if (name && name.trim()) {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name.trim());
    } catch (e) {
      console.warn('無法儲存玩家暱稱到 localStorage:', e);
    }
  }
}

/**
 * 取得儲存的玩家暱稱
 * @returns {string} 玩家暱稱，如果沒有則返回空字串
 */
export function getPlayerName() {
  try {
    return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
  } catch (e) {
    console.warn('無法從 localStorage 讀取玩家暱稱:', e);
    return '';
  }
}

/**
 * 清除玩家暱稱
 */
export function clearPlayerName() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
  } catch (e) {
    console.warn('無法從 localStorage 清除玩家暱稱:', e);
  }
}

/**
 * 儲存玩家設定
 * @param {object} settings - 設定物件
 */
export function savePlayerSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('無法儲存玩家設定到 localStorage:', e);
  }
}

/**
 * 取得玩家設定
 * @returns {object} 設定物件
 */
export function getPlayerSettings() {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.PLAYER_SETTINGS);
    return settings ? JSON.parse(settings) : {};
  } catch (e) {
    console.warn('無法從 localStorage 讀取玩家設定:', e);
    return {};
  }
}

// ==================== 工單 0079：房間重連功能 ====================

/**
 * 儲存當前房間資訊（用於重連）
 * @param {object} roomInfo - 房間資訊
 * @param {string} roomInfo.roomId - 房間 ID
 * @param {string} roomInfo.playerId - 玩家 ID
 * @param {string} roomInfo.playerName - 玩家暱稱
 */
export function saveCurrentRoom(roomInfo) {
  try {
    const data = {
      ...roomInfo,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(data));
  } catch (e) {
    console.warn('無法儲存房間資訊到 localStorage:', e);
  }
}

/**
 * 取得儲存的房間資訊
 * @returns {object|null} 房間資訊，如果沒有或已過期則返回 null
 */
export function getCurrentRoom() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM);
    if (!data) return null;

    const roomInfo = JSON.parse(data);

    // 工單 0116：檢查是否過期（2 小時）
    // 原本 5 分鐘太短，一場遊戲可能持續 30-60 分鐘
    const EXPIRY_TIME = 2 * 60 * 60 * 1000;
    if (Date.now() - roomInfo.timestamp > EXPIRY_TIME) {
      clearCurrentRoom();
      return null;
    }

    return roomInfo;
  } catch (e) {
    console.warn('無法從 localStorage 讀取房間資訊:', e);
    return null;
  }
}

/**
 * 清除房間資訊
 */
export function clearCurrentRoom() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM);
  } catch (e) {
    console.warn('無法從 localStorage 清除房間資訊:', e);
  }
}

export { STORAGE_KEYS };
