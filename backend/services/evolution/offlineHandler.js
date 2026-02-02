/**
 * 演化論離線狀態處理服務
 * 處理玩家離線標記、自動跳過回合、超時踢出
 */

/**
 * 離線狀態
 */
const OFFLINE_STATUS = {
  ONLINE: 'online',
  TEMPORARILY_OFFLINE: 'temporarily_offline',
  FORFEITED: 'forfeited',
};

/**
 * 離線處理配置
 */
const OFFLINE_CONFIG = {
  temporaryOfflineTimeout: 30000,  // 暫時離線超時（30 秒）
  forfeitTimeout: 120000,          // 棄權超時（2 分鐘）
  turnTimeout: 60000,              // 回合超時（60 秒）
  autoPassEnabled: true,           // 是否自動跳過
};

/**
 * 玩家離線資訊
 */
class PlayerOfflineInfo {
  constructor(playerId, roomId) {
    this.playerId = playerId;
    this.roomId = roomId;
    this.status = OFFLINE_STATUS.ONLINE;
    this.disconnectedAt = null;
    this.lastActivityAt = Date.now();
    this.missedTurns = 0;
    this.turnTimeoutId = null;
  }

  /**
   * 標記為離線
   */
  markOffline() {
    this.status = OFFLINE_STATUS.TEMPORARILY_OFFLINE;
    this.disconnectedAt = Date.now();
  }

  /**
   * 標記為線上
   */
  markOnline() {
    this.status = OFFLINE_STATUS.ONLINE;
    this.disconnectedAt = null;
    this.lastActivityAt = Date.now();
  }

  /**
   * 標記為棄權
   */
  markForfeited() {
    this.status = OFFLINE_STATUS.FORFEITED;
  }

  /**
   * 記錄活動
   */
  recordActivity() {
    this.lastActivityAt = Date.now();
  }

  /**
   * 增加錯過回合計數
   */
  incrementMissedTurns() {
    this.missedTurns++;
    return this.missedTurns;
  }

  /**
   * 重置錯過回合計數
   */
  resetMissedTurns() {
    this.missedTurns = 0;
  }

  /**
   * 取得離線時長
   */
  getOfflineDuration() {
    if (!this.disconnectedAt) return 0;
    return Date.now() - this.disconnectedAt;
  }

  /**
   * 是否在線
   */
  isOnline() {
    return this.status === OFFLINE_STATUS.ONLINE;
  }

  /**
   * 是否已棄權
   */
  isForfeited() {
    return this.status === OFFLINE_STATUS.FORFEITED;
  }

  /**
   * 轉換為 JSON
   */
  toJSON() {
    return {
      playerId: this.playerId,
      roomId: this.roomId,
      status: this.status,
      disconnectedAt: this.disconnectedAt,
      lastActivityAt: this.lastActivityAt,
      missedTurns: this.missedTurns,
      offlineDuration: this.getOfflineDuration(),
    };
  }
}

/**
 * 離線處理器
 */
class OfflineHandler {
  constructor(config = {}) {
    this.config = { ...OFFLINE_CONFIG, ...config };
    this.players = new Map(); // playerId -> PlayerOfflineInfo
    this.roomPlayers = new Map(); // roomId -> Set<playerId>
    this.forfeitTimeouts = new Map(); // playerId -> timeoutId
    this.turnTimeouts = new Map(); // playerId -> timeoutId
  }

  /**
   * 註冊玩家
   * @param {string} playerId - 玩家 ID
   * @param {string} roomId - 房間 ID
   * @returns {PlayerOfflineInfo}
   */
  registerPlayer(playerId, roomId) {
    if (!playerId || !roomId) {
      return null;
    }

    const info = new PlayerOfflineInfo(playerId, roomId);
    this.players.set(playerId, info);

    // 加入房間玩家列表
    if (!this.roomPlayers.has(roomId)) {
      this.roomPlayers.set(roomId, new Set());
    }
    this.roomPlayers.get(roomId).add(playerId);

    return info;
  }

  /**
   * 取消註冊玩家
   * @param {string} playerId - 玩家 ID
   */
  unregisterPlayer(playerId) {
    const info = this.players.get(playerId);
    if (!info) return;

    // 清除超時
    this.clearForfeitTimeout(playerId);
    this.clearTurnTimeout(playerId);

    // 從房間玩家列表移除
    const roomPlayers = this.roomPlayers.get(info.roomId);
    if (roomPlayers) {
      roomPlayers.delete(playerId);
      if (roomPlayers.size === 0) {
        this.roomPlayers.delete(info.roomId);
      }
    }

    this.players.delete(playerId);
  }

  /**
   * 處理玩家離線
   * @param {string} playerId - 玩家 ID
   * @param {Function} onForfeit - 棄權回調
   * @returns {Object} 處理結果
   */
  handleOffline(playerId, onForfeit = null) {
    const info = this.players.get(playerId);
    if (!info) {
      return { success: false, error: 'Player not found' };
    }

    if (info.isForfeited()) {
      return { success: false, error: 'Player already forfeited' };
    }

    info.markOffline();

    // 設定棄權超時
    this.setForfeitTimeout(playerId, onForfeit);

    return {
      success: true,
      playerId,
      status: info.status,
      timeout: this.config.forfeitTimeout,
    };
  }

  /**
   * 處理玩家上線
   * @param {string} playerId - 玩家 ID
   * @returns {Object} 處理結果
   */
  handleOnline(playerId) {
    const info = this.players.get(playerId);
    if (!info) {
      return { success: false, error: 'Player not found' };
    }

    if (info.isForfeited()) {
      return { success: false, error: 'Player has forfeited' };
    }

    info.markOnline();
    this.clearForfeitTimeout(playerId);

    return {
      success: true,
      playerId,
      status: info.status,
      offlineDuration: info.getOfflineDuration(),
    };
  }

  /**
   * 處理玩家棄權
   * @param {string} playerId - 玩家 ID
   * @returns {Object} 處理結果
   */
  handleForfeit(playerId) {
    const info = this.players.get(playerId);
    if (!info) {
      return { success: false, error: 'Player not found' };
    }

    info.markForfeited();
    this.clearForfeitTimeout(playerId);
    this.clearTurnTimeout(playerId);

    return {
      success: true,
      playerId,
      status: info.status,
    };
  }

  /**
   * 設定棄權超時
   * @param {string} playerId - 玩家 ID
   * @param {Function} onForfeit - 棄權回調
   */
  setForfeitTimeout(playerId, onForfeit) {
    this.clearForfeitTimeout(playerId);

    const timeoutId = setTimeout(() => {
      this.handleForfeit(playerId);
      if (onForfeit) {
        const info = this.players.get(playerId);
        onForfeit(playerId, info?.roomId);
      }
    }, this.config.forfeitTimeout);

    this.forfeitTimeouts.set(playerId, timeoutId);
  }

  /**
   * 清除棄權超時
   * @param {string} playerId - 玩家 ID
   */
  clearForfeitTimeout(playerId) {
    const timeoutId = this.forfeitTimeouts.get(playerId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.forfeitTimeouts.delete(playerId);
    }
  }

  /**
   * 設定回合超時
   * @param {string} playerId - 玩家 ID
   * @param {Function} onTimeout - 超時回調
   */
  setTurnTimeout(playerId, onTimeout) {
    this.clearTurnTimeout(playerId);

    if (!this.config.autoPassEnabled) {
      return;
    }

    const info = this.players.get(playerId);
    if (!info || !info.isOnline()) {
      // 離線玩家立即觸發
      if (onTimeout) {
        onTimeout(playerId, info?.roomId);
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      if (onTimeout) {
        onTimeout(playerId, info?.roomId);
      }
    }, this.config.turnTimeout);

    this.turnTimeouts.set(playerId, timeoutId);
    info.turnTimeoutId = timeoutId;
  }

  /**
   * 清除回合超時
   * @param {string} playerId - 玩家 ID
   */
  clearTurnTimeout(playerId) {
    const timeoutId = this.turnTimeouts.get(playerId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.turnTimeouts.delete(playerId);
    }

    const info = this.players.get(playerId);
    if (info) {
      info.turnTimeoutId = null;
    }
  }

  /**
   * 記錄玩家活動
   * @param {string} playerId - 玩家 ID
   */
  recordActivity(playerId) {
    const info = this.players.get(playerId);
    if (info) {
      info.recordActivity();
      info.resetMissedTurns();
    }
  }

  /**
   * 檢查是否應該自動跳過
   * @param {string} playerId - 玩家 ID
   * @returns {boolean}
   */
  shouldAutoPass(playerId) {
    if (!this.config.autoPassEnabled) {
      return false;
    }

    const info = this.players.get(playerId);
    if (!info) {
      return false;
    }

    return !info.isOnline() || info.isForfeited();
  }

  /**
   * 取得玩家狀態
   * @param {string} playerId - 玩家 ID
   * @returns {PlayerOfflineInfo|null}
   */
  getPlayerInfo(playerId) {
    return this.players.get(playerId) || null;
  }

  /**
   * 取得玩家狀態（JSON）
   * @param {string} playerId - 玩家 ID
   * @returns {Object|null}
   */
  getPlayerStatus(playerId) {
    const info = this.players.get(playerId);
    return info ? info.toJSON() : null;
  }

  /**
   * 取得房間所有玩家狀態
   * @param {string} roomId - 房間 ID
   * @returns {Array}
   */
  getRoomPlayersStatus(roomId) {
    const playerIds = this.roomPlayers.get(roomId);
    if (!playerIds) {
      return [];
    }

    return Array.from(playerIds)
      .map(id => this.getPlayerStatus(id))
      .filter(status => status !== null);
  }

  /**
   * 取得房間在線玩家數
   * @param {string} roomId - 房間 ID
   * @returns {number}
   */
  getOnlineCount(roomId) {
    const playerIds = this.roomPlayers.get(roomId);
    if (!playerIds) {
      return 0;
    }

    let count = 0;
    for (const playerId of playerIds) {
      const info = this.players.get(playerId);
      if (info && info.isOnline()) {
        count++;
      }
    }
    return count;
  }

  /**
   * 取得房間活躍玩家數（非棄權）
   * @param {string} roomId - 房間 ID
   * @returns {number}
   */
  getActiveCount(roomId) {
    const playerIds = this.roomPlayers.get(roomId);
    if (!playerIds) {
      return 0;
    }

    let count = 0;
    for (const playerId of playerIds) {
      const info = this.players.get(playerId);
      if (info && !info.isForfeited()) {
        count++;
      }
    }
    return count;
  }

  /**
   * 清除房間所有玩家
   * @param {string} roomId - 房間 ID
   */
  clearRoom(roomId) {
    const playerIds = this.roomPlayers.get(roomId);
    if (!playerIds) {
      return;
    }

    for (const playerId of playerIds) {
      this.clearForfeitTimeout(playerId);
      this.clearTurnTimeout(playerId);
      this.players.delete(playerId);
    }
    this.roomPlayers.delete(roomId);
  }

  /**
   * 清除所有狀態
   */
  clear() {
    for (const timeoutId of this.forfeitTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    for (const timeoutId of this.turnTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.players.clear();
    this.roomPlayers.clear();
    this.forfeitTimeouts.clear();
    this.turnTimeouts.clear();
  }
}

// 建立單例
const offlineHandler = new OfflineHandler();

module.exports = {
  OfflineHandler,
  PlayerOfflineInfo,
  OFFLINE_STATUS,
  OFFLINE_CONFIG,
  offlineHandler,
};
