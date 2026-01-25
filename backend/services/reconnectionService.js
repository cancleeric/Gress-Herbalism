/**
 * 重連服務模組
 * 工單 0120 - 提取重連邏輯以便測試
 */

// 常數
const DISCONNECT_TIMEOUT = 60000; // 60 秒（遊戲中）
const WAITING_PHASE_DISCONNECT_TIMEOUT = 15000; // 15 秒（等待階段）
const REFRESH_GRACE_PERIOD = 10000; // 10 秒重整寬限期

/**
 * 計算斷線超時時間
 * @param {boolean} isWaitingPhase - 是否在等待階段
 * @param {boolean} isRefreshing - 是否正在重整
 * @returns {number} 超時時間（毫秒）
 */
function calculateDisconnectTimeout(isWaitingPhase, isRefreshing) {
  if (isRefreshing) {
    return REFRESH_GRACE_PERIOD;
  }
  if (isWaitingPhase) {
    return WAITING_PHASE_DISCONNECT_TIMEOUT;
  }
  return DISCONNECT_TIMEOUT;
}

/**
 * 驗證重連請求
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 玩家 ID
 * @returns {Object} { valid: boolean, reason?: string, message?: string, playerIndex?: number }
 */
function validateReconnection(gameState, playerId) {
  if (!gameState) {
    return {
      valid: false,
      reason: 'room_not_found',
      message: '房間已不存在'
    };
  }

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return {
      valid: false,
      reason: 'player_not_found',
      message: '你已不在此房間中'
    };
  }

  return {
    valid: true,
    playerIndex
  };
}

/**
 * 處理斷線後的玩家狀態
 * @param {Object} gameState - 遊戲狀態
 * @param {number} playerIndex - 玩家索引
 * @param {boolean} isWaitingPhase - 是否在等待階段
 * @param {boolean} isRefreshing - 是否正在重整
 * @returns {Object} { action: 'remove' | 'deactivate', newHostIndex?: number }
 */
function handleDisconnectTimeout(gameState, playerIndex, isWaitingPhase, isRefreshing) {
  const player = gameState.players[playerIndex];

  // 等待階段或重整中 -> 移除玩家
  if (isWaitingPhase || isRefreshing) {
    const wasHost = player.isHost;
    const result = {
      action: 'remove',
      removedPlayer: player
    };

    // 如果是房主且還有其他玩家，需要轉移房主
    if (wasHost && gameState.players.length > 1) {
      // 找到下一個玩家（移除當前玩家後的第一個）
      const newHostIndex = playerIndex === 0 ? 0 : 0;
      result.newHostIndex = newHostIndex;
    }

    return result;
  }

  // 遊戲中 -> 標記為不活躍
  return {
    action: 'deactivate'
  };
}

/**
 * 處理玩家重連
 * @param {Object} player - 玩家物件
 * @returns {Object} 更新後的玩家物件
 */
function processPlayerReconnect(player) {
  return {
    ...player,
    isDisconnected: false,
    disconnectedAt: null,
    isRefreshing: undefined
  };
}

/**
 * 檢查是否所有非當前玩家都已回應跟猜
 * @param {Object} followGuessState - 跟猜狀態
 * @param {string} currentPlayerId - 當前玩家 ID
 * @returns {boolean}
 */
function allPlayersResponded(followGuessState, currentPlayerId) {
  if (!followGuessState || !followGuessState.responses) {
    return false;
  }

  const { responses, eligiblePlayers } = followGuessState;

  for (const playerId of eligiblePlayers) {
    if (playerId !== currentPlayerId && !responses.has(playerId)) {
      return false;
    }
  }

  return true;
}

/**
 * 處理房主轉移
 * @param {Array} players - 玩家陣列
 * @param {number} removedIndex - 被移除玩家的索引
 * @returns {Array} 更新後的玩家陣列
 */
function transferHost(players, removedIndex) {
  const updatedPlayers = [...players];

  // 移除玩家
  const removedPlayer = updatedPlayers.splice(removedIndex, 1)[0];

  // 如果被移除的是房主且還有其他玩家
  if (removedPlayer.isHost && updatedPlayers.length > 0) {
    updatedPlayers[0].isHost = true;
  }

  return updatedPlayers;
}

/**
 * 驗證 localStorage 資料是否過期
 * @param {number} timestamp - 儲存時間戳
 * @param {number} expiryTime - 過期時間（毫秒）
 * @returns {boolean} 是否過期
 */
function isSessionExpired(timestamp, expiryTime = 2 * 60 * 60 * 1000) {
  if (!timestamp) return true;
  return Date.now() - timestamp > expiryTime;
}

/**
 * 生成重連金鑰
 * @param {string} gameId - 遊戲 ID
 * @param {string} playerId - 玩家 ID
 * @returns {string}
 */
function generateRefreshKey(gameId, playerId) {
  return `${gameId}:${playerId}`;
}

/**
 * 檢查玩家是否應該被跳過（不活躍或斷線）
 * @param {Object} player - 玩家物件
 * @returns {boolean}
 */
function shouldSkipPlayer(player) {
  return !player.isActive || player.isDisconnected;
}

/**
 * 計算下一個活躍玩家索引
 * @param {Array} players - 玩家陣列
 * @param {number} currentIndex - 當前索引
 * @returns {number} 下一個活躍玩家索引
 */
function getNextActivePlayerIndex(players, currentIndex) {
  const playerCount = players.length;
  let nextIndex = (currentIndex + 1) % playerCount;
  let attempts = 0;

  while (shouldSkipPlayer(players[nextIndex]) && attempts < playerCount) {
    nextIndex = (nextIndex + 1) % playerCount;
    attempts++;
  }

  return nextIndex;
}

module.exports = {
  // 常數
  DISCONNECT_TIMEOUT,
  WAITING_PHASE_DISCONNECT_TIMEOUT,
  REFRESH_GRACE_PERIOD,

  // 函數
  calculateDisconnectTimeout,
  validateReconnection,
  handleDisconnectTimeout,
  processPlayerReconnect,
  allPlayersResponded,
  transferHost,
  isSessionExpired,
  generateRefreshKey,
  shouldSkipPlayer,
  getNextActivePlayerIndex
};
