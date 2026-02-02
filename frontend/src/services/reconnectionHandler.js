/**
 * 前端斷線重連處理器
 * 處理 Socket 斷線偵測、自動重連、狀態恢復
 */

/**
 * 重連配置
 */
const RECONNECT_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  timeout: 30000,
};

/**
 * 重連狀態
 */
const RECONNECT_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
};

/**
 * 斷線重連處理器
 */
class ReconnectionHandler {
  constructor(socket = null, config = {}) {
    this.socket = socket;
    this.config = { ...RECONNECT_CONFIG, ...config };
    this.status = RECONNECT_STATUS.CONNECTED;
    this.retryCount = 0;
    this.retryTimeout = null;
    this.listeners = new Map();
    this.roomId = null;
    this.playerId = null;
    this.disconnectedAt = null;
  }

  /**
   * 設定 Socket
   * @param {Object} socket - Socket.io 客戶端實例
   */
  setSocket(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  /**
   * 設定房間和玩家資訊
   * @param {string} roomId - 房間 ID
   * @param {string} playerId - 玩家 ID
   */
  setGameInfo(roomId, playerId) {
    this.roomId = roomId;
    this.playerId = playerId;
  }

  /**
   * 設定 Socket 監聽器
   */
  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      this.handleDisconnect(reason);
    });

    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on('connect_error', (error) => {
      this.handleConnectError(error);
    });

    this.socket.on('evo:reconnected', (data) => {
      this.handleReconnectSuccess(data);
    });

    this.socket.on('evo:reconnectFailed', (data) => {
      this.handleReconnectFailed(data);
    });
  }

  /**
   * 處理斷線
   * @param {string} reason - 斷線原因
   */
  handleDisconnect(reason) {
    this.status = RECONNECT_STATUS.DISCONNECTED;
    this.disconnectedAt = Date.now();
    this.retryCount = 0;

    this.emit('disconnect', { reason });

    // 如果不是主動斷線，開始自動重連
    if (reason !== 'io client disconnect') {
      this.startReconnect();
    }
  }

  /**
   * 處理連線成功
   */
  handleConnect() {
    // 如果是重連
    if (this.status === RECONNECT_STATUS.RECONNECTING) {
      this.attemptGameReconnect();
    } else {
      this.status = RECONNECT_STATUS.CONNECTED;
      this.clearRetryTimeout();
      this.emit('connect');
    }
  }

  /**
   * 處理連線錯誤
   * @param {Error} error - 錯誤
   */
  handleConnectError(error) {
    this.emit('connectError', { error: error.message });
  }

  /**
   * 開始重連
   */
  startReconnect() {
    if (this.status === RECONNECT_STATUS.RECONNECTING) {
      return;
    }

    this.status = RECONNECT_STATUS.RECONNECTING;
    this.emit('reconnecting', { attempt: this.retryCount + 1 });
    this.scheduleRetry();
  }

  /**
   * 排程重試
   */
  scheduleRetry() {
    if (this.retryCount >= this.config.maxRetries) {
      this.handleReconnectFailed({ reason: 'Max retries reached' });
      return;
    }

    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, this.retryCount),
      this.config.maxDelay
    );

    this.retryTimeout = setTimeout(() => {
      this.retryCount++;
      this.emit('retrying', {
        attempt: this.retryCount,
        maxRetries: this.config.maxRetries,
        delay,
      });

      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      } else if (this.socket && this.socket.connected) {
        this.attemptGameReconnect();
      } else {
        this.scheduleRetry();
      }
    }, delay);
  }

  /**
   * 嘗試遊戲重連
   */
  attemptGameReconnect() {
    if (!this.socket || !this.roomId || !this.playerId) {
      this.scheduleRetry();
      return;
    }

    this.socket.emit('evo:reconnect', {
      roomId: this.roomId,
      playerId: this.playerId,
    });
  }

  /**
   * 處理重連成功
   * @param {Object} data - 重連資料
   */
  handleReconnectSuccess(data) {
    this.status = RECONNECT_STATUS.CONNECTED;
    this.clearRetryTimeout();
    this.retryCount = 0;

    const disconnectedDuration = this.disconnectedAt
      ? Date.now() - this.disconnectedAt
      : 0;

    this.emit('reconnected', {
      ...data,
      disconnectedDuration,
    });

    this.disconnectedAt = null;
  }

  /**
   * 處理重連失敗
   * @param {Object} data - 失敗資料
   */
  handleReconnectFailed(data) {
    this.status = RECONNECT_STATUS.FAILED;
    this.clearRetryTimeout();

    this.emit('reconnectFailed', data);
  }

  /**
   * 清除重試計時器
   */
  clearRetryTimeout() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * 手動重連
   * @returns {boolean} 是否開始重連
   */
  manualReconnect() {
    if (this.status === RECONNECT_STATUS.CONNECTED) {
      return false;
    }

    this.retryCount = 0;
    this.status = RECONNECT_STATUS.RECONNECTING;
    this.clearRetryTimeout();

    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    } else if (this.socket && this.socket.connected) {
      this.attemptGameReconnect();
    }

    return true;
  }

  /**
   * 取得當前狀態
   * @returns {Object}
   */
  getStatus() {
    return {
      status: this.status,
      retryCount: this.retryCount,
      maxRetries: this.config.maxRetries,
      disconnectedAt: this.disconnectedAt,
      remainingTime: this.disconnectedAt
        ? Math.max(0, this.config.timeout - (Date.now() - this.disconnectedAt))
        : null,
    };
  }

  /**
   * 訂閱事件
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函式
   * @returns {Function} 取消訂閱函式
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * 取消訂閱事件
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函式
   */
  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * 發送事件
   * @param {string} event - 事件名稱
   * @param {Object} data - 事件資料
   */
  emit(event, data = {}) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`[ReconnectionHandler] Error in ${event} listener:`, error);
        }
      }
    }
  }

  /**
   * 重置狀態
   */
  reset() {
    this.clearRetryTimeout();
    this.status = RECONNECT_STATUS.CONNECTED;
    this.retryCount = 0;
    this.roomId = null;
    this.playerId = null;
    this.disconnectedAt = null;
  }

  /**
   * 銷毀處理器
   */
  destroy() {
    this.clearRetryTimeout();
    this.listeners.clear();
    this.socket = null;
  }
}

/**
 * 建立重連處理器
 * @param {Object} socket - Socket.io 客戶端實例
 * @param {Object} config - 配置選項
 * @returns {ReconnectionHandler}
 */
function createReconnectionHandler(socket = null, config = {}) {
  return new ReconnectionHandler(socket, config);
}

export {
  ReconnectionHandler,
  createReconnectionHandler,
  RECONNECT_CONFIG,
  RECONNECT_STATUS,
};

export default ReconnectionHandler;
