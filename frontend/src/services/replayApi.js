/**
 * 遊戲回放 API 服務
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * 發送 API 請求
 */
async function replayRequest(url, options = {}) {
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
 * 取得演化論遊戲回放資料
 * @param {string} gameId - 遊戲 ID
 */
export async function getEvolutionReplay(gameId) {
  return replayRequest(`/api/evolution/replays/${gameId}`);
}

/**
 * 取得演化論玩家遊戲歷史
 * @param {string} userId - 玩家 ID
 * @param {number} limit - 限制筆數
 */
export async function getEvolutionGameHistory(userId, limit = 20) {
  return replayRequest(`/api/evolution/replays/list/${userId}?limit=${limit}`);
}

/**
 * 取得本草遊戲回放資料
 * @param {string} gameId - 遊戲 ID
 */
export async function getHerbalismReplay(gameId) {
  return replayRequest(`/api/herbalism/replays/${gameId}`);
}

export default {
  getEvolutionReplay,
  getEvolutionGameHistory,
  getHerbalismReplay,
};
