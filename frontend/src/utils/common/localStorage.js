/**
 * LocalStorage 工具函數
 *
 * @module localStorage
 * @description 提供玩家資料的本地儲存功能
 */

const STORAGE_KEYS = {
  PLAYER_NAME: 'gress_player_name',  // 保留向後相容（舊版暱稱）
  NICKNAME: 'gress_nickname',        // 工單 0122：遊戲暱稱
  PLAYER_SETTINGS: 'gress_player_settings',
  CURRENT_ROOM: 'gress_current_room',  // 工單 0079：重連資訊
  RECENT_PLAYERS: 'gress_recent_players',  // 最近遊玩的玩家
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

// ==================== 工單 0122：遊戲暱稱 ====================

/**
 * 儲存遊戲暱稱
 * @param {string} nickname - 遊戲暱稱
 */
export function saveNickname(nickname) {
  if (nickname && nickname.trim()) {
    try {
      localStorage.setItem(STORAGE_KEYS.NICKNAME, nickname.trim());
      // 同時更新舊的 key 以保持向後相容
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, nickname.trim());
    } catch (e) {
      console.warn('無法儲存遊戲暱稱到 localStorage:', e);
    }
  }
}

/**
 * 取得儲存的遊戲暱稱
 * @returns {string} 遊戲暱稱，如果沒有則返回空字串
 */
export function getNickname() {
  try {
    // 優先使用新的 key，如果沒有則嘗試舊的 key（向後相容）
    return localStorage.getItem(STORAGE_KEYS.NICKNAME) ||
           localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
  } catch (e) {
    console.warn('無法從 localStorage 讀取遊戲暱稱:', e);
    return '';
  }
}

/**
 * 清除遊戲暱稱
 */
export function clearNickname() {
  try {
    localStorage.removeItem(STORAGE_KEYS.NICKNAME);
  } catch (e) {
    console.warn('無法從 localStorage 清除遊戲暱稱:', e);
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

// ==================== 最近遊玩的玩家 ====================

const MAX_RECENT_PLAYERS = 10;

/**
 * 記錄一位最近遊玩過的玩家
 * @param {{ id: string, name: string, photoURL?: string }} player
 */
export function addRecentPlayer(player) {
  if (!player || !player.id || !player.name) return;
  try {
    const existing = getRecentPlayers();
    const filtered = existing.filter(p => p.id !== player.id);
    const updated = [{ id: player.id, name: player.name, photoURL: player.photoURL || null }, ...filtered].slice(0, MAX_RECENT_PLAYERS);
    localStorage.setItem(STORAGE_KEYS.RECENT_PLAYERS, JSON.stringify(updated));
  } catch (e) {
    console.warn('無法儲存最近玩家:', e);
  }
}

/**
 * 取得最近遊玩的玩家列表
 * @returns {Array<{ id: string, name: string, photoURL?: string }>}
 */
export function getRecentPlayers() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_PLAYERS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('無法讀取最近玩家:', e);
    return [];
  }
}
