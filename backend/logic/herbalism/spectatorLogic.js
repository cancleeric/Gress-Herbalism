/**
 * 觀戰模式邏輯
 *
 * 提供觀戰者可見的遊戲狀態（隱藏蓋牌顏色和手牌資訊）
 *
 * 工單 0062 - 觀戰模式
 * @module logic/herbalism/spectatorLogic
 */

const MAX_SPECTATORS = 10;

/**
 * 將玩家手牌資訊遮蔽（觀戰者不應看到手牌顏色）
 * @param {Object[]} players - 原始玩家陣列
 * @returns {Object[]} 遮蔽手牌後的玩家陣列
 */
function maskPlayerHands(players) {
  if (!Array.isArray(players)) return [];
  return players.map(player => ({
    id: player.id,
    name: player.name,
    score: player.score,
    isActive: player.isActive,
    isCurrentTurn: player.isCurrentTurn,
    isHost: player.isHost,
    isDisconnected: player.isDisconnected || false,
    // 只保留手牌張數，不暴露顏色
    handCount: Array.isArray(player.hand) ? player.hand.length : 0,
  }));
}

/**
 * 建立觀戰用的遊戲狀態（隱藏蓋牌顏色與手牌）
 * @param {Object} gameState - 完整的伺服器端遊戲狀態
 * @returns {Object} 對觀戰者安全的遊戲狀態
 */
function buildSpectatorGameState(gameState) {
  if (!gameState) return null;

  return {
    gameId: gameState.gameId,
    gamePhase: gameState.gamePhase,
    currentPlayerIndex: gameState.currentPlayerIndex,
    currentRound: gameState.currentRound,
    scores: gameState.scores || {},
    winningScore: gameState.winningScore,
    maxPlayers: gameState.maxPlayers,
    isPrivate: gameState.isPrivate || false,
    // 玩家：遮蔽手牌
    players: maskPlayerHands(gameState.players),
    // 蓋牌：只有在揭牌後才顯示（gamePhase === 'roundEnd' 或 'finished'）
    hiddenCards: shouldRevealHiddenCards(gameState.gamePhase)
      ? (gameState.hiddenCards || [])
      : (gameState.hiddenCards || []).map(() => ({ color: null })),
    // 遊戲歷史（供觀戰者了解進度）
    gameHistory: Array.isArray(gameState.gameHistory)
      ? gameState.gameHistory.map(maskHistoryEntry)
      : [],
    // 猜牌結果（公開資訊）
    predictions: Array.isArray(gameState.predictions) ? gameState.predictions : [],
    winner: gameState.winner || null,
    roundHistory: Array.isArray(gameState.roundHistory) ? gameState.roundHistory : [],
  };
}

/**
 * 判斷是否應該向觀戰者揭示蓋牌
 * @param {string} gamePhase - 遊戲階段
 * @returns {boolean}
 */
function shouldRevealHiddenCards(gamePhase) {
  return gamePhase === 'roundEnd' || gamePhase === 'finished';
}

/**
 * 遮蔽歷史紀錄中的私密資訊（手牌）
 * @param {Object} entry - 歷史紀錄條目
 * @returns {Object} 遮蔽後的條目
 */
function maskHistoryEntry(entry) {
  if (!entry) return entry;
  // 移除手牌資訊
  const { hand, ...rest } = entry;
  return rest;
}

/**
 * 建立觀戰者資訊物件
 * @param {string} id - 觀戰者 ID
 * @param {string} name - 觀戰者名稱
 * @param {string} socketId - Socket ID
 * @returns {Object} 觀戰者物件
 */
function createSpectator(id, name, socketId) {
  return {
    id,
    name,
    socketId,
    joinedAt: Date.now(),
  };
}

/**
 * 取得房間觀戰者數量
 * @param {Map} spectatorRooms - 觀戰房間 Map (gameId -> Map<spectatorId, spectator>)
 * @param {string} gameId - 遊戲 ID
 * @returns {number}
 */
function getSpectatorCount(spectatorRooms, gameId) {
  const room = spectatorRooms.get(gameId);
  if (!room) return 0;
  return room.size;
}

/**
 * 檢查是否可加入觀戰（未達上限）
 * @param {Map} spectatorRooms - 觀戰房間 Map
 * @param {string} gameId - 遊戲 ID
 * @returns {boolean}
 */
function canJoinAsSpectator(spectatorRooms, gameId) {
  return getSpectatorCount(spectatorRooms, gameId) < MAX_SPECTATORS;
}

module.exports = {
  MAX_SPECTATORS,
  buildSpectatorGameState,
  shouldRevealHiddenCards,
  maskPlayerHands,
  maskHistoryEntry,
  createSpectator,
  getSpectatorCount,
  canJoinAsSpectator,
};
