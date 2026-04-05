/**
 * 好友服務 - 前端 API
 * 工單 0061
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

  if (!response.ok || !data.success) {
    throw new Error(data.message || '請求失敗');
  }

  return data.data;
}

/**
 * 搜尋玩家
 * @param {string} query - 搜尋關鍵字
 * @param {string} firebaseUid - 自己的 Firebase UID
 */
export async function searchPlayers(query, firebaseUid) {
  return apiRequest(`/api/friends/search?q=${encodeURIComponent(query)}&firebaseUid=${firebaseUid}`);
}

/**
 * 取得好友列表
 * @param {string} firebaseUid - Firebase UID
 */
export async function getFriends(firebaseUid) {
  return apiRequest(`/api/friends?firebaseUid=${firebaseUid}`);
}

/**
 * 取得好友請求列表
 * @param {string} firebaseUid - Firebase UID
 */
export async function getFriendRequests(firebaseUid) {
  return apiRequest(`/api/friends/requests?firebaseUid=${firebaseUid}`);
}

/**
 * 取得好友請求數量
 * @param {string} firebaseUid - Firebase UID
 */
export async function getFriendRequestCount(firebaseUid) {
  const result = await apiRequest(`/api/friends/requests/count?firebaseUid=${firebaseUid}`);
  return result.count;
}

/**
 * 發送好友請求
 * @param {string} firebaseUid - 自己的 Firebase UID
 * @param {string} toUserId - 目標使用者 ID (UUID)
 * @param {string} message - 附加訊息
 */
export async function sendFriendRequest(firebaseUid, toUserId, message = '') {
  return apiRequest('/api/friends/requests', {
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
  return apiRequest(`/api/friends/requests/${requestId}`, {
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
  return apiRequest(`/api/friends/${friendId}?firebaseUid=${firebaseUid}`, {
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
  return apiRequest('/api/friends/invitations', {
    method: 'POST',
    body: JSON.stringify({ firebaseUid, toUserId, roomId }),
  });
}

/**
 * 取得遊戲邀請
 * @param {string} firebaseUid - Firebase UID
 */
export async function getGameInvitations(firebaseUid) {
  return apiRequest(`/api/friends/invitations?firebaseUid=${firebaseUid}`);
}

/**
 * 回應遊戲邀請
 * @param {number} invitationId - 邀請 ID
 * @param {string} firebaseUid - Firebase UID
 * @param {string} action - 'accept' | 'reject'
 */
export async function respondToGameInvitation(invitationId, firebaseUid, action) {
  return apiRequest(`/api/friends/invitations/${invitationId}`, {
    method: 'PUT',
    body: JSON.stringify({ firebaseUid, action }),
  });
}

const friendService = {
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

export default friendService;
