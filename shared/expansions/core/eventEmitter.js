/**
 * 遊戲事件發射器
 *
 * @module expansions/core/eventEmitter
 */

/**
 * 遊戲事件發射器類別
 * 提供事件訂閱、發送、優先級排序等功能
 */
class GameEventEmitter {
  constructor() {
    this.listeners = new Map();
    this.wildcardListeners = [];
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.paused = false;
    this.queuedEvents = [];
  }

  /**
   * 訂閱事件
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函數
   * @param {Object} options - 選項
   * @param {number} options.priority - 優先級（數字越大越先執行）
   * @param {*} options.context - 回調的 this 上下文
   * @param {Function} options.filter - 過濾函數
   * @returns {Function} 取消訂閱函數
   */
  on(event, callback, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = {
      callback,
      priority: options.priority ?? 0,
      context: options.context || null,
      filter: options.filter || null,
    };

    this.listeners.get(event).push(listener);

    // 按優先級排序（高優先級先執行）
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);

    // 返回取消訂閱函數
    return () => this.off(event, callback);
  }

  /**
   * 訂閱一次性事件
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函數
   * @param {Object} options - 選項
   * @returns {Function} 取消訂閱函數
   */
  once(event, callback, options = {}) {
    const wrappedCallback = (...args) => {
      this.off(event, wrappedCallback);
      return callback.apply(options.context || null, args);
    };

    return this.on(event, wrappedCallback, options);
  }

  /**
   * 訂閱所有事件（萬用字元）
   * @param {Function} callback - 回調函數
   * @param {Object} options - 選項
   * @returns {Function} 取消訂閱函數
   */
  onAny(callback, options = {}) {
    const listener = {
      callback,
      priority: options.priority ?? 0,
      context: options.context || null,
    };

    this.wildcardListeners.push(listener);
    this.wildcardListeners.sort((a, b) => b.priority - a.priority);

    return () => {
      const index = this.wildcardListeners.indexOf(listener);
      if (index !== -1) {
        this.wildcardListeners.splice(index, 1);
      }
    };
  }

  /**
   * 取消訂閱
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函數
   * @returns {boolean} 是否成功取消
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return false;

    const listeners = this.listeners.get(event);
    const index = listeners.findIndex(l => l.callback === callback);

    if (index !== -1) {
      listeners.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * 取消特定事件的所有訂閱
   * @param {string} event - 事件名稱（不傳則清除所有）
   */
  offAll(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
      this.wildcardListeners = [];
    }
  }

  /**
   * 非同步發送事件
   * @param {string} event - 事件名稱
   * @param {Object} data - 事件資料
   * @returns {Promise<Array>} 所有監聽器的回傳值
   */
  async emit(event, data = {}) {
    // 暫停時加入佇列
    if (this.paused) {
      this.queuedEvents.push({ event, data });
      return [];
    }

    const eventObject = {
      type: event,
      data,
      timestamp: Date.now(),
      cancelled: false,
    };

    // 記錄歷史
    this.recordEvent(eventObject);

    const results = [];

    // 執行萬用字元監聽器
    for (const listener of this.wildcardListeners) {
      if (eventObject.cancelled) break;
      try {
        const result = await this.executeListener(listener, eventObject);
        results.push(result);
      } catch (error) {
        console.error(`Error in wildcard listener for ${event}:`, error);
      }
    }

    // 執行特定事件監聽器
    if (this.listeners.has(event) && !eventObject.cancelled) {
      for (const listener of this.listeners.get(event)) {
        if (eventObject.cancelled) break;

        // 檢查過濾器
        if (listener.filter && !listener.filter(data)) {
          continue;
        }

        try {
          const result = await this.executeListener(listener, eventObject);
          results.push(result);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * 同步發送事件
   * @param {string} event - 事件名稱
   * @param {Object} data - 事件資料
   * @returns {Array} 所有監聽器的回傳值
   */
  emitSync(event, data = {}) {
    if (this.paused) {
      this.queuedEvents.push({ event, data });
      return [];
    }

    const eventObject = {
      type: event,
      data,
      timestamp: Date.now(),
      cancelled: false,
    };

    this.recordEvent(eventObject);

    const results = [];

    // 執行萬用字元監聽器
    for (const listener of this.wildcardListeners) {
      if (eventObject.cancelled) break;
      try {
        const result = listener.callback.call(listener.context, eventObject);
        results.push(result);
      } catch (error) {
        console.error(`Error in wildcard listener for ${event}:`, error);
      }
    }

    // 執行特定事件監聽器
    if (this.listeners.has(event) && !eventObject.cancelled) {
      for (const listener of this.listeners.get(event)) {
        if (eventObject.cancelled) break;
        if (listener.filter && !listener.filter(data)) continue;

        try {
          const result = listener.callback.call(listener.context, eventObject);
          results.push(result);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * 執行監聽器
   * @private
   */
  async executeListener(listener, eventObject) {
    const result = listener.callback.call(listener.context, eventObject);

    // 支援 Promise
    if (result instanceof Promise) {
      return await result;
    }

    return result;
  }

  /**
   * 暫停事件發送
   */
  pause() {
    this.paused = true;
  }

  /**
   * 恢復事件發送並處理佇列
   * @returns {Promise<void>}
   */
  async resume() {
    this.paused = false;

    const queued = [...this.queuedEvents];
    this.queuedEvents = [];

    for (const { event, data } of queued) {
      await this.emit(event, data);
    }
  }

  /**
   * 同步恢復事件發送
   */
  resumeSync() {
    this.paused = false;

    const queued = [...this.queuedEvents];
    this.queuedEvents = [];

    for (const { event, data } of queued) {
      this.emitSync(event, data);
    }
  }

  /**
   * 記錄事件歷史
   * @private
   */
  recordEvent(eventObject) {
    this.eventHistory.push({
      type: eventObject.type,
      data: eventObject.data,
      timestamp: eventObject.timestamp,
    });

    // 限制歷史大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 取得事件歷史
   * @param {Function} filter - 過濾函數
   * @returns {Array}
   */
  getHistory(filter = null) {
    if (!filter) {
      return [...this.eventHistory];
    }

    return this.eventHistory.filter(filter);
  }

  /**
   * 取得特定類型的事件歷史
   * @param {string} eventType - 事件類型
   * @returns {Array}
   */
  getHistoryByType(eventType) {
    return this.eventHistory.filter(e => e.type === eventType);
  }

  /**
   * 清空歷史
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * 取得監聽器數量
   * @param {string} event - 事件名稱（不傳則計算所有）
   * @returns {number}
   */
  listenerCount(event) {
    if (!event) {
      let count = this.wildcardListeners.length;
      for (const listeners of this.listeners.values()) {
        count += listeners.length;
      }
      return count;
    }

    return (this.listeners.get(event)?.length || 0);
  }

  /**
   * 取得所有已註冊的事件類型
   * @returns {string[]}
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * 檢查是否有特定事件的監聽器
   * @param {string} event - 事件名稱
   * @returns {boolean}
   */
  hasListeners(event) {
    return this.listenerCount(event) > 0 || this.wildcardListeners.length > 0;
  }

  /**
   * 取得待處理的佇列事件數量
   * @returns {number}
   */
  get queuedCount() {
    return this.queuedEvents.length;
  }

  /**
   * 重置發射器
   */
  reset() {
    this.listeners.clear();
    this.wildcardListeners = [];
    this.eventHistory = [];
    this.queuedEvents = [];
    this.paused = false;
  }
}

/**
 * 預設遊戲事件發射器實例
 */
const gameEventEmitter = new GameEventEmitter();

module.exports = {
  GameEventEmitter,
  gameEventEmitter,
};
