/**
 * LocalStorage 工具函數
 *
 * @module localStorage
 * @description 提供玩家資料的本地儲存功能
 */

const STORAGE_KEYS = {
  PLAYER_NAME: 'gress_player_name',
  PLAYER_SETTINGS: 'gress_player_settings',
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

export { STORAGE_KEYS };
