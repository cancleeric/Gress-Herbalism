/**
 * API 服務層
 * 工單 0060
 *
 * P1 安全修復：所有需要身份驗證的 API 呼叫，
 * 必須帶 Authorization: Bearer <Firebase ID token>。
 * Firebase 匿名用戶（訪客）也有合法 ID token，一併送出。
 */

import { auth } from '../firebase/config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * 取得 Firebase ID token（含匿名用戶）
 * - 用戶已登入（含匿名）→ 取得有效 ID token
 * - 未登入 → 回傳 null（不附 Authorization header）
 *
 * @returns {Promise<string|null>}
 */
async function getFirebaseIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    // forceRefresh=false：若 token 仍有效直接用快取，過期才重取
    return await user.getIdToken(false);
  } catch (err) {
    console.warn('[apiService] 取得 Firebase ID token 失敗:', err.message);
    return null;
  }
}

/**
 * 發送 API 請求
 * P1：自動附上 Firebase ID token（若已登入）
 *
 * 此函式為 named export，供 friendService 等服務層重用，
 * 確保所有後端 API 呼叫統一帶 Authorization header。
 */
export async function apiRequest(url, options = {}) {
  const idToken = await getFirebaseIdToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 有 token 時自動帶入 Authorization header
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '請求失敗');
  }

  return data;
}

/**
 * 同步玩家資料（登入後呼叫）
 * P1：不再傳 firebaseUid（後端從 token 取），只傳 displayName/email/avatarUrl
 * @param {object} userData - { displayName, email, avatarUrl }
 */
export async function syncPlayer(userData) {
  // 移除 firebaseUid（後端以 token 為準，前端傳的 uid 不被信任）
  const { firebaseUid: _ignored, ...safeData } = userData;
  return apiRequest('/api/players/sync', {
    method: 'POST',
    body: JSON.stringify(safeData),
  });
}

/**
 * 取得玩家統計
 * P1：URL param 仍傳 firebaseUid（向下相容 URL 格式），但後端以 token 為準
 * @param {string} firebaseUid - Firebase UID（用於 URL 路徑）
 */
export async function getPlayerStats(firebaseUid) {
  return apiRequest(`/api/players/${firebaseUid}/stats`);
}

/**
 * 取得玩家遊戲歷史
 * P1：URL param 仍傳 firebaseUid（向下相容 URL 格式），但後端以 token 為準
 * @param {string} firebaseUid - Firebase UID（用於 URL 路徑）
 * @param {number} limit - 限制筆數
 */
export async function getPlayerHistory(firebaseUid, limit = 20) {
  return apiRequest(`/api/players/${firebaseUid}/history?limit=${limit}`);
}

/**
 * 取得排行榜（公開端點，不需驗證）
 * @param {string} orderBy - 排序欄位 ('total_score' | 'games_won' | 'win_rate')
 * @param {number} limit - 限制筆數
 */
export async function getLeaderboard(orderBy = 'total_score', limit = 10) {
  return apiRequest(`/api/leaderboard?orderBy=${orderBy}&limit=${limit}`);
}

/**
 * 健康檢查（公開端點，不需驗證）
 */
export async function healthCheck() {
  return apiRequest('/api/health');
}

export default {
  syncPlayer,
  getPlayerStats,
  getPlayerHistory,
  getLeaderboard,
  healthCheck,
};
