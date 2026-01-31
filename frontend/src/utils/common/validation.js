/**
 * 驗證工具函數
 *
 * @module validation
 * @description 提供各種輸入驗證功能
 */

/**
 * 驗證暱稱是否有效
 * @param {string} name - 暱稱
 * @returns {boolean} 是否有效
 */
export function validatePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmedName = name.trim();

  // 長度檢查：2-12 個字元
  if (trimmedName.length < 2 || trimmedName.length > 12) {
    return false;
  }

  // 過濾危險字元
  const dangerousChars = /[<>"'&]/;
  if (dangerousChars.test(trimmedName)) {
    return false;
  }

  return true;
}

/**
 * 取得暱稱驗證錯誤訊息
 * @param {string} name - 暱稱
 * @returns {string|null} 錯誤訊息，如果有效則返回 null
 */
export function getPlayerNameError(name) {
  if (!name || !name.trim()) {
    return '請輸入暱稱';
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return '暱稱至少需要 2 個字元';
  }

  if (trimmedName.length > 12) {
    return '暱稱不能超過 12 個字元';
  }

  const dangerousChars = /[<>"'&]/;
  if (dangerousChars.test(trimmedName)) {
    return '暱稱不能包含特殊字元（<, >, ", \', &）';
  }

  return null;
}

/**
 * 驗證房間密碼是否有效
 * @param {string} password - 密碼
 * @returns {boolean} 是否有效
 */
export function validateRoomPassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // 長度檢查：4-16 個字元
  if (password.length < 4 || password.length > 16) {
    return false;
  }

  return true;
}

/**
 * 取得房間密碼驗證錯誤訊息
 * @param {string} password - 密碼
 * @returns {string|null} 錯誤訊息，如果有效則返回 null
 */
export function getRoomPasswordError(password) {
  if (!password) {
    return '請輸入密碼';
  }

  if (password.length < 4) {
    return '密碼至少需要 4 個字元';
  }

  if (password.length > 16) {
    return '密碼不能超過 16 個字元';
  }

  return null;
}
