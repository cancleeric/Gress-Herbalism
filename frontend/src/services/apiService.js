/**
 * API 服務層
 * 工單 0060
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * 發送 API 請求
 */
async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '請求失敗');
  }

  return data;
}

/**
 * 同步玩家資料（登入後呼叫）
 * @param {object} userData - { firebaseUid, displayName, email, avatarUrl }
 */
export async function syncPlayer(userData) {
  return apiRequest('/api/players/sync', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * 取得玩家統計
 * @param {string} firebaseUid - Firebase UID
 */
export async function getPlayerStats(firebaseUid) {
  return apiRequest(`/api/players/${firebaseUid}/stats`);
}

/**
 * 取得玩家遊戲歷史
 * @param {string} firebaseUid - Firebase UID
 * @param {number} limit - 限制筆數
 */
export async function getPlayerHistory(firebaseUid, limit = 20) {
  return apiRequest(`/api/players/${firebaseUid}/history?limit=${limit}`);
}

/**
 * 取得排行榜
 * @param {string} orderBy - 排序欄位 ('total_score' | 'games_won' | 'win_rate')
 * @param {number} limit - 限制筆數
 */
export async function getLeaderboard(orderBy = 'total_score', limit = 10) {
  return apiRequest(`/api/leaderboard?orderBy=${orderBy}&limit=${limit}`);
}

/**
 * 取得玩家 ELO 歷史
 * @param {string} firebaseUid - Firebase UID
 * @param {number} limit - 限制筆數
 */
export async function getEloHistory(firebaseUid, limit = 20) {
  return apiRequest(`/api/players/${firebaseUid}/elo-history?limit=${limit}`);
}

/**
 * 取得當前賽季資訊（含玩家段位和倒計時）
 * 工單 0064 - 賽季聯賽系統
 * @param {string|null} firebaseUid - Firebase UID（可選，用於取得個人段位）
 */
export async function getCurrentSeason(firebaseUid = null) {
  const query = firebaseUid ? `?firebaseUid=${encodeURIComponent(firebaseUid)}` : '';
  return apiRequest(`/api/seasons/current${query}`);
}

/**
 * 領取賽季獎勵（冪等性保護）
 * 工單 0064 - 賽季聯賽系統
 * @param {string} firebaseUid - Firebase UID
 * @param {number} seasonId - 賽季 ID
 */
export async function claimSeasonReward(firebaseUid, seasonId) {
  return apiRequest('/api/seasons/claim-reward', {
    method: 'POST',
    body: JSON.stringify({ firebaseUid, seasonId }),
  });
}

/**
 * 健康檢查
 */
export async function healthCheck() {
  return apiRequest('/api/health');
}

const apiService = {
  syncPlayer,
  getPlayerStats,
  getPlayerHistory,
  getLeaderboard,
  getEloHistory,
  getCurrentSeason,
  claimSeasonReward,
  healthCheck,
};

export default apiService;
