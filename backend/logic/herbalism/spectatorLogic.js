/**
 * 觀戰邏輯 - Issue #62
 * 純函數，可單獨測試
 */

const MAX_SPECTATORS = 10;

/**
 * 加入觀戰的驗證與狀態更新
 * @param {Map} spectatorRooms - 觀戰者 Map
 * @param {Map} gameRooms - 遊戲房間 Map
 * @param {string} gameId - 遊戲 ID
 * @param {{ id: string, name: string, socketId: string }} spectator - 觀戰者資訊
 * @returns {{ success: boolean, message?: string, spectatorCount?: number }}
 */
function joinSpectator(spectatorRooms, gameRooms, gameId, spectator) {
  const gameState = gameRooms.get(gameId);

  if (!gameState) {
    return { success: false, message: '遊戲不存在' };
  }

  if (gameState.gamePhase === 'waiting') {
    return { success: false, message: '遊戲尚未開始，請加入房間等待' };
  }

  if (gameState.gamePhase === 'finished') {
    return { success: false, message: '遊戲已結束' };
  }

  if (!spectatorRooms.has(gameId)) {
    spectatorRooms.set(gameId, new Map());
  }

  const room = spectatorRooms.get(gameId);

  if (room.size >= MAX_SPECTATORS) {
    return { success: false, message: `觀戰人數已達上限（${MAX_SPECTATORS} 人）` };
  }

  // 防止重複加入
  if (room.has(spectator.id)) {
    room.get(spectator.id).socketId = spectator.socketId;
    return { success: true, spectatorCount: room.size };
  }

  room.set(spectator.id, {
    id: spectator.id,
    name: spectator.name,
    socketId: spectator.socketId,
    joinedAt: Date.now()
  });

  return { success: true, spectatorCount: room.size };
}

/**
 * 離開觀戰
 * @param {Map} spectatorRooms
 * @param {string} gameId
 * @param {string} spectatorId
 * @returns {{ success: boolean, spectatorCount: number }}
 */
function leaveSpectator(spectatorRooms, gameId, spectatorId) {
  const room = spectatorRooms.get(gameId);
  if (!room) {
    return { success: false, spectatorCount: 0 };
  }

  room.delete(spectatorId);

  if (room.size === 0) {
    spectatorRooms.delete(gameId);
  }

  return { success: true, spectatorCount: room ? room.size : 0 };
}

/**
 * 根據 socketId 找出所有觀戰房間並移除該觀戰者
 * @param {Map} spectatorRooms
 * @param {string} socketId
 * @returns {Array<{ gameId: string, spectatorId: string }>} 被移除的記錄
 */
function removeSpectatorBySocketId(spectatorRooms, socketId) {
  const removed = [];

  spectatorRooms.forEach((room, gameId) => {
    room.forEach((spectator, spectatorId) => {
      if (spectator.socketId === socketId) {
        room.delete(spectatorId);
        removed.push({ gameId, spectatorId });
      }
    });

    if (room.size === 0) {
      spectatorRooms.delete(gameId);
    }
  });

  return removed;
}

/**
 * 取得某房間的觀戰者列表
 * @param {Map} spectatorRooms
 * @param {string} gameId
 * @returns {Array<{ id: string, name: string }>}
 */
function getSpectators(spectatorRooms, gameId) {
  const room = spectatorRooms.get(gameId);
  if (!room) return [];
  return Array.from(room.values()).map(s => ({ id: s.id, name: s.name }));
}

/**
 * 取得某房間的觀戰人數
 * @param {Map} spectatorRooms
 * @param {string} gameId
 * @returns {number}
 */
function getSpectatorCount(spectatorRooms, gameId) {
  const room = spectatorRooms.get(gameId);
  return room ? room.size : 0;
}

/**
 * 建立給觀戰者的遊戲快照（包含所有玩家手牌 — 上帝視角）
 * @param {Object} gameState - 遊戲狀態
 * @param {Array} spectators - 觀戰者列表
 * @returns {Object} 快照
 */
function buildSpectatorSnapshot(gameState, spectators) {
  return {
    ...gameState,
    spectators,
    isSpectatorView: true
  };
}

module.exports = {
  MAX_SPECTATORS,
  joinSpectator,
  leaveSpectator,
  removeSpectatorBySocketId,
  getSpectators,
  getSpectatorCount,
  buildSpectatorSnapshot
};
