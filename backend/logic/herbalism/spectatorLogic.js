/**
 * 觀戰模式邏輯
 * 工單 0062 - 觀戰模式：旁觀進行中對局 + 即時同步
 *
 * @module logic/herbalism/spectatorLogic
 */

'use strict';

const MAX_SPECTATORS = 10;

/**
 * 產生唯一觀戰者 ID
 * @returns {string}
 */
function generateSpectatorId() {
  return `spectator_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 判斷遊戲是否可觀戰（進行中且未結束）
 * @param {Object} gameState - 遊戲狀態
 * @returns {boolean}
 */
function isGameSpectatable(gameState) {
  if (!gameState) return false;
  const phase = gameState.gamePhase;
  return (
    phase !== 'waiting' &&
    phase !== 'finished'
  );
}

/**
 * 讓觀戰者加入對局
 * @param {Map} spectatorRooms - 觀戰房間 Map<gameId, Map<spectatorId, info>>
 * @param {string} gameId - 遊戲 ID
 * @param {Object} spectator - { id, name, socketId }
 * @returns {{ success: boolean, spectatorId?: string, error?: string }}
 */
function joinSpectator(spectatorRooms, gameId, spectator) {
  if (!spectatorRooms.has(gameId)) {
    spectatorRooms.set(gameId, new Map());
  }

  const room = spectatorRooms.get(gameId);

  if (room.size >= MAX_SPECTATORS) {
    return { success: false, error: '觀戰人數已達上限' };
  }

  const spectatorId = spectator.id || generateSpectatorId();
  room.set(spectatorId, {
    id: spectatorId,
    name: spectator.name || '觀戰者',
    socketId: spectator.socketId,
    joinedAt: new Date().toISOString()
  });

  return { success: true, spectatorId };
}

/**
 * 讓觀戰者離開對局
 * @param {Map} spectatorRooms
 * @param {string} gameId
 * @param {string} spectatorId
 * @returns {boolean} 是否成功移除
 */
function leaveSpectator(spectatorRooms, gameId, spectatorId) {
  const room = spectatorRooms.get(gameId);
  if (!room) return false;
  const removed = room.delete(spectatorId);
  if (room.size === 0) {
    spectatorRooms.delete(gameId);
  }
  return removed;
}

/**
 * 根據 socketId 找到觀戰者所在的遊戲和觀戰者 ID
 * @param {Map} spectatorRooms
 * @param {string} socketId
 * @returns {{ gameId: string|null, spectatorId: string|null }}
 */
function findSpectatorBySocket(spectatorRooms, socketId) {
  for (const [gameId, room] of spectatorRooms.entries()) {
    for (const [spectatorId, info] of room.entries()) {
      if (info.socketId === socketId) {
        return { gameId, spectatorId };
      }
    }
  }
  return { gameId: null, spectatorId: null };
}

/**
 * 取得某遊戲的觀戰者人數
 * @param {Map} spectatorRooms
 * @param {string} gameId
 * @returns {number}
 */
function getSpectatorCount(spectatorRooms, gameId) {
  const room = spectatorRooms.get(gameId);
  return room ? room.size : 0;
}

/**
 * 建立發給觀戰者的遊戲狀態快照（隱藏牌不揭露顏色）
 * @param {Object} gameState - 完整遊戲狀態
 * @returns {Object} 觀戰者版本的遊戲狀態
 */
function buildSpectatorGameState(gameState) {
  if (!gameState) return null;

  return {
    gameId: gameState.gameId,
    gamePhase: gameState.gamePhase,
    currentPlayerIndex: gameState.currentPlayerIndex,
    currentRound: gameState.currentRound,
    winner: gameState.winner,
    // 玩家資訊（不含手牌，僅含得分和狀態）
    players: (gameState.players || []).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isActive: p.isActive,
      isCurrentTurn: p.isCurrentTurn,
      isHost: p.isHost,
      handCount: p.hand ? p.hand.length : 0
    })),
    // 蓋牌：只顯示數量和位置，不揭露顏色
    hiddenCardCount: Array.isArray(gameState.hiddenCards) ? gameState.hiddenCards.length : 0,
    // 遊戲紀錄（可完整顯示）
    gameHistory: gameState.gameHistory || [],
    roundHistory: gameState.roundHistory || [],
    scores: gameState.scores || {}
  };
}

/**
 * 清理已結束遊戲的觀戰房間
 * @param {Map} spectatorRooms
 * @param {string} gameId
 */
function cleanupSpectatorRoom(spectatorRooms, gameId) {
  spectatorRooms.delete(gameId);
}

module.exports = {
  MAX_SPECTATORS,
  generateSpectatorId,
  isGameSpectatable,
  joinSpectator,
  leaveSpectator,
  findSpectatorBySocket,
  getSpectatorCount,
  buildSpectatorGameState,
  cleanupSpectatorRoom
};
