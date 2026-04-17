/**
 * 觀戰模式邏輯 - 純函數
 *
 * 處理觀戰者加入/離開的驗證與狀態管理。
 * 工單 0062：觀戰模式
 *
 * @module logic/herbalism/spectatorLogic
 */

const MAX_SPECTATORS = 10;

/**
 * 驗證觀戰者是否可加入遊戲
 * @param {Object} gameState - 遊戲狀態
 * @param {Map} spectatorRoom - 該遊戲的觀戰者 Map
 * @param {string} spectatorId - 觀戰者 ID
 * @returns {{ canJoin: boolean, reason?: string }}
 */
function canJoinAsSpectator(gameState, spectatorRoom, spectatorId) {
  if (!gameState) {
    return { canJoin: false, reason: '遊戲不存在' };
  }

  if (gameState.gamePhase === 'waiting') {
    return { canJoin: false, reason: '遊戲尚未開始，請等待或直接加入' };
  }

  if (gameState.gamePhase === 'finished') {
    return { canJoin: false, reason: '遊戲已結束' };
  }

  // 確認不是正在進行中的玩家
  if (gameState.players && gameState.players.some(p => p.id === spectatorId)) {
    return { canJoin: false, reason: '你已是遊戲中的玩家' };
  }

  if (spectatorRoom && spectatorRoom.size >= MAX_SPECTATORS) {
    return { canJoin: false, reason: `觀戰人數已達上限 (${MAX_SPECTATORS})` };
  }

  return { canJoin: true };
}

/**
 * 建立觀戰者資料
 * @param {string} spectatorId - 觀戰者 ID
 * @param {string} spectatorName - 觀戰者名稱
 * @param {string} socketId - Socket ID
 * @returns {Object} 觀戰者資料
 */
function createSpectatorData(spectatorId, spectatorName, socketId) {
  return {
    id: spectatorId,
    name: spectatorName,
    socketId,
    joinedAt: Date.now()
  };
}

/**
 * 取得觀戰者數量
 * @param {Map} spectatorRoom - 觀戰者 Map
 * @returns {number}
 */
function getSpectatorCount(spectatorRoom) {
  return spectatorRoom ? spectatorRoom.size : 0;
}

/**
 * 取得觀戰者列表（安全版，不含 socketId）
 * @param {Map} spectatorRoom - 觀戰者 Map
 * @returns {Array}
 */
function getSpectatorList(spectatorRoom) {
  if (!spectatorRoom) return [];
  return Array.from(spectatorRoom.values()).map(({ id, name, joinedAt }) => ({
    id,
    name,
    joinedAt
  }));
}

/**
 * 建立供觀戰者查看的遊戲狀態（隱藏私密資訊）
 * @param {Object} gameState - 完整遊戲狀態
 * @returns {Object} 公開遊戲狀態
 */
function buildPublicGameState(gameState) {
  if (!gameState) return null;

  return {
    gameId: gameState.gameId,
    gamePhase: gameState.gamePhase,
    currentPlayerIndex: gameState.currentPlayerIndex,
    currentRound: gameState.currentRound,
    scores: gameState.scores,
    winningScore: gameState.winningScore,
    winner: gameState.winner,
    gameHistory: gameState.gameHistory,
    // 玩家資訊（隱藏手牌）
    players: (gameState.players || []).map(player => ({
      id: player.id,
      name: player.name,
      isCurrentTurn: player.isCurrentTurn,
      isActive: player.isActive,
      isDisconnected: player.isDisconnected,
      isHost: player.isHost,
      score: player.score,
      handCount: (player.hand || []).length  // 只顯示手牌數量，不顯示具體牌面
    })),
    maxPlayers: gameState.maxPlayers
  };
}

module.exports = {
  MAX_SPECTATORS,
  canJoinAsSpectator,
  createSpectatorData,
  getSpectatorCount,
  getSpectatorList,
  buildPublicGameState
};
