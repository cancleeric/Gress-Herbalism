/**
 * 好友服務 - 前端 API
 * 工單 0061
 *
 * P1 安全修復（雙審補項）：
 * 移除本地 apiRequest（不帶 Authorization），改用 apiService.apiRequest，
 * 確保所有 /api/friends/* 呼叫都帶 Authorization: Bearer <Firebase ID token>。
 * 先前版本：本地 apiRequest 純 fetch，無 token → 後端 verifyAuth → 全 401。
 */

import { apiRequest } from './apiService';

/**
 * 帶 Authorization 的 friends API 請求包裝器。
 * apiService.apiRequest 回傳整個 response body（{ success, data, message }），
 * 此包裝器額外處理 success: false 的錯誤拋出，並取出 data 層。
 *
 * @param {string} url - API 路徑
 * @param {object} options - fetch options
 * @returns {Promise<*>} response.data
 */
async function friendApiRequest(url, options = {}) {
  const responseBody = await apiRequest(url, options);
  if (!responseBody.success) {
    throw new Error(responseBody.message || '請求失敗');
  }
  return responseBody.data;
}

/**
 * 搜尋玩家
 * @param {string} query - 搜尋關鍵字
 * @param {string} firebaseUid - 自己的 Firebase UID
 */
export async function searchPlayers(query, firebaseUid) {
  return friendApiRequest(`/api/friends/search?q=${encodeURIComponent(query)}&firebaseUid=${firebaseUid}`);
}

/**
 * 取得好友列表
 * @param {string} firebaseUid - Firebase UID
 */
export async function getFriends(firebaseUid) {
  return friendApiRequest(`/api/friends?firebaseUid=${firebaseUid}`);
}

/**
 * 取得好友請求列表
 * @param {string} firebaseUid - Firebase UID
 */
export async function getFriendRequests(firebaseUid) {
  return friendApiRequest(`/api/friends/requests?firebaseUid=${firebaseUid}`);
}

/**
 * 取得好友請求數量
 * @param {string} firebaseUid - Firebase UID
 */
export async function getFriendRequestCount(firebaseUid) {
  const result = await friendApiRequest(`/api/friends/requests/count?firebaseUid=${firebaseUid}`);
  return result.count;
}

/**
 * 發送好友請求
 * @param {string} firebaseUid - 自己的 Firebase UID
 * @param {string} toUserId - 目標使用者 ID (UUID)
 * @param {string} message - 附加訊息
 */
export async function sendFriendRequest(firebaseUid, toUserId, message = '') {
  return friendApiRequest('/api/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ firebaseUid, toUserId, message }),
  });
}

/**
 * 回應好友請求
 * @param {number} requestId - 請求 ID
 * @param {string} firebaseUid - Firebase UID
 * @param {string} action - 'accept' | 'reject'
 */
export async function respondToFriendRequest(requestId, firebaseUid, action) {
  return friendApiRequest(`/api/friends/requests/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify({ firebaseUid, action }),
  });
}

/**
 * 刪除好友
 * @param {string} friendId - 好友 ID (UUID)
 * @param {string} firebaseUid - Firebase UID
 */
export async function removeFriend(friendId, firebaseUid) {
  return friendApiRequest(`/api/friends/${friendId}?firebaseUid=${firebaseUid}`, {
    method: 'DELETE',
  });
}

/**
 * 發送遊戲邀請
 * @param {string} firebaseUid - Firebase UID
 * @param {string} toUserId - 目標使用者 ID
 * @param {string} roomId - 房間 ID
 */
export async function sendGameInvitation(firebaseUid, toUserId, roomId) {
  return friendApiRequest('/api/friends/invitations', {
    method: 'POST',
    body: JSON.stringify({ firebaseUid, toUserId, roomId }),
  });
}

/**
 * 取得遊戲邀請
 * @param {string} firebaseUid - Firebase UID
 */
export async function getGameInvitations(firebaseUid) {
  return friendApiRequest(`/api/friends/invitations?firebaseUid=${firebaseUid}`);
}

/**
 * 回應遊戲邀請
 * @param {number} invitationId - 邀請 ID
 * @param {string} firebaseUid - Firebase UID
 * @param {string} action - 'accept' | 'reject'
 */
export async function respondToGameInvitation(invitationId, firebaseUid, action) {
  return friendApiRequest(`/api/friends/invitations/${invitationId}`, {
    method: 'PUT',
    body: JSON.stringify({ firebaseUid, action }),
  });
}

export default {
  searchPlayers,
  getFriends,
  getFriendRequests,
  getFriendRequestCount,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  sendGameInvitation,
  getGameInvitations,
  respondToGameInvitation,
};
