/**
 * 演化論斷線重連服務
 * 處理玩家斷線、重連、遊戲狀態快照
 */

/**
 * 遊戲狀態快照管理器
 */
class GameStateSnapshotManager {
  constructor() {
    this.snapshots = new Map(); // roomId -> snapshot
    this.SNAPSHOT_TTL = 30 * 60 * 1000; // 30 分鐘
  }

  /**
   * 儲存遊戲狀態快照
   * @param {string} roomId - 房間 ID
   * @param {Object} gameState - 遊戲狀態
   * @returns {Object} 儲存的快照
   */
  save(roomId, gameState) {
    if (!roomId || !gameState) {
      return null;
    }

    const snapshot = {
      timestamp: Date.now(),
      state: this.serialize(gameState),
      version: 1,
    };

    this.snapshots.set(roomId, snapshot);
    return snapshot;
  }

  /**
   * 載入遊戲狀態快照
   * @param {string} roomId - 房間 ID
   * @returns {Object|null} 遊戲狀態或 null
   */
  load(roomId) {
    const snapshot = this.snapshots.get(roomId);
    if (!snapshot) return null;

    // 檢查是否過期
    if (Date.now() - snapshot.timestamp > this.SNAPSHOT_TTL) {
      this.snapshots.delete(roomId);
      return null;
    }

    return this.deserialize(snapshot.state);
  }

  /**
   * 刪除快照
   * @param {string} roomId - 房間 ID
   */
  delete(roomId) {
    this.snapshots.delete(roomId);
  }

  /**
   * 檢查快照是否存在
   * @param {string} roomId - 房間 ID
   * @returns {boolean}
   */
  has(roomId) {
    const snapshot = this.snapshots.get(roomId);
    if (!snapshot) return false;

    // 檢查是否過期
    if (Date.now() - snapshot.timestamp > this.SNAPSHOT_TTL) {
      this.snapshots.delete(roomId);
      return false;
    }

    return true;
  }

  /**
   * 序列化遊戲狀態（移除不必要的資料）
   * @param {Object} gameState - 遊戲狀態
   * @returns {Object} 序列化後的狀態
   */
  serialize(gameState) {
    return {
      phase: gameState.phase,
      round: gameState.round,
      currentPlayerIndex: gameState.currentPlayerIndex,
      isLastRound: gameState.isLastRound,
      foodPool: gameState.foodPool,
      deck: gameState.deck,
      discardPile: gameState.discardPile,
      players: gameState.players?.map(p => ({
        id: p.id,
        name: p.name,
        hand: p.hand,
        creatures: p.creatures,
        score: p.score,
        hasPassed: p.hasPassed,
      })) || [],
      pendingAttack: gameState.pendingAttack,
      actionLog: gameState.actionLog?.slice(-50) || [], // 只保留最近 50 條
    };
  }

  /**
   * 反序列化遊戲狀態
   * @param {Object} data - 序列化的資料
   * @returns {Object} 遊戲狀態
   */
  deserialize(data) {
    return { ...data };
  }

  /**
   * 清除所有快照
   */
  clear() {
    this.snapshots.clear();
  }

  /**
   * 取得快照數量
   * @returns {number}
   */
  size() {
    return this.snapshots.size;
  }
}

/**
 * 斷線重連處理器
 */
class ReconnectionHandler {
  constructor(snapshotManager = null) {
    this.snapshots = snapshotManager || new GameStateSnapshotManager();
    this.pendingReconnections = new Map(); // playerId -> { roomId, timeout, disconnectedAt }
    this.RECONNECT_TIMEOUT = 30000; // 30 秒
  }

  /**
   * 處理玩家斷線
   * @param {string} roomId - 房間 ID
   * @param {string} playerId - 玩家 ID
   * @param {Object} gameState - 當前遊戲狀態
   * @param {Function} onTimeout - 超時回調
   * @returns {Object} 斷線處理結果
   */
  handleDisconnect(roomId, playerId, gameState, onTimeout = null) {
    if (!roomId || !playerId) {
      return { success: false, error: 'Invalid parameters' };
    }

    // 儲存快照
    if (gameState) {
      this.snapshots.save(roomId, gameState);
    }

    // 設定超時
    const timeout = setTimeout(() => {
      this.handleTimeout(playerId);
      if (onTimeout) {
        onTimeout(roomId, playerId);
      }
    }, this.RECONNECT_TIMEOUT);

    // 記錄待重連狀態
    this.pendingReconnections.set(playerId, {
      roomId,
      timeout,
      disconnectedAt: Date.now(),
    });

    return {
      success: true,
      playerId,
      roomId,
      timeout: this.RECONNECT_TIMEOUT,
    };
  }

  /**
   * 處理玩家重連
   * @param {string} playerId - 玩家 ID
   * @returns {Object} 重連結果
   */
  handleReconnect(playerId) {
    const pending = this.pendingReconnections.get(playerId);
    if (!pending) {
      return {
        success: false,
        error: 'No pending reconnection',
      };
    }

    // 清除超時
    clearTimeout(pending.timeout);
    this.pendingReconnections.delete(playerId);

    // 載入快照
    const gameState = this.snapshots.load(pending.roomId);

    return {
      success: true,
      roomId: pending.roomId,
      gameState,
      disconnectedDuration: Date.now() - pending.disconnectedAt,
    };
  }

  /**
   * 處理超時
   * @param {string} playerId - 玩家 ID
   * @returns {Object|null} 超時的玩家資訊
   */
  handleTimeout(playerId) {
    const pending = this.pendingReconnections.get(playerId);
    if (!pending) return null;

    this.pendingReconnections.delete(playerId);
    return {
      playerId,
      roomId: pending.roomId,
      disconnectedAt: pending.disconnectedAt,
    };
  }

  /**
   * 檢查玩家是否有待重連狀態
   * @param {string} playerId - 玩家 ID
   * @returns {boolean}
   */
  hasPendingReconnection(playerId) {
    return this.pendingReconnections.has(playerId);
  }

  /**
   * 取得玩家的待重連資訊
   * @param {string} playerId - 玩家 ID
   * @returns {Object|null}
   */
  getPendingReconnection(playerId) {
    const pending = this.pendingReconnections.get(playerId);
    if (!pending) return null;

    return {
      roomId: pending.roomId,
      disconnectedAt: pending.disconnectedAt,
      remainingTime: Math.max(0, this.RECONNECT_TIMEOUT - (Date.now() - pending.disconnectedAt)),
    };
  }

  /**
   * 取消待重連狀態
   * @param {string} playerId - 玩家 ID
   */
  cancelPendingReconnection(playerId) {
    const pending = this.pendingReconnections.get(playerId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingReconnections.delete(playerId);
    }
  }

  /**
   * 清除房間的所有待重連狀態
   * @param {string} roomId - 房間 ID
   */
  clearRoomReconnections(roomId) {
    for (const [playerId, pending] of this.pendingReconnections.entries()) {
      if (pending.roomId === roomId) {
        clearTimeout(pending.timeout);
        this.pendingReconnections.delete(playerId);
      }
    }
    this.snapshots.delete(roomId);
  }

  /**
   * 取得待重連數量
   * @returns {number}
   */
  getPendingCount() {
    return this.pendingReconnections.size;
  }

  /**
   * 清除所有狀態
   */
  clear() {
    for (const pending of this.pendingReconnections.values()) {
      clearTimeout(pending.timeout);
    }
    this.pendingReconnections.clear();
    this.snapshots.clear();
  }
}

/**
 * 為玩家準備客戶端遊戲狀態（隱藏其他玩家手牌）
 * @param {Object} gameState - 完整遊戲狀態
 * @param {string} playerId - 當前玩家 ID
 * @returns {Object} 客戶端遊戲狀態
 */
function getClientGameState(gameState, playerId) {
  if (!gameState) return null;

  return {
    ...gameState,
    players: gameState.players?.map(p => ({
      ...p,
      hand: p.id === playerId
        ? (p.hand || [])
        : (p.hand?.map(() => ({ hidden: true })) || []),
    })) || [],
  };
}

// 建立單例
const snapshotManager = new GameStateSnapshotManager();
const reconnectionHandler = new ReconnectionHandler(snapshotManager);

module.exports = {
  GameStateSnapshotManager,
  ReconnectionHandler,
  getClientGameState,
  snapshotManager,
  reconnectionHandler,
};
