/**
 * 效果佇列
 *
 * 管理效果的排序和解析
 *
 * @module expansions/core/effectQueue
 */

const { EFFECT_RESULT } = require('./effectTypes');
const { Effect } = require('./effectSystem');

/**
 * 效果佇列類別
 */
class EffectQueue {
  constructor() {
    this.queue = [];
    this.resolvedEffects = [];
    this.handlers = [];
    this.listeners = new Map();
  }

  /**
   * 註冊效果處理器
   * @param {EffectHandler} handler
   */
  registerHandler(handler) {
    this.handlers.push(handler);
    // 按處理器優先級排序（高優先級先處理）
    this.handlers.sort((a, b) => b.getHandlerPriority() - a.getHandlerPriority());
  }

  /**
   * 移除效果處理器
   * @param {EffectHandler} handler
   */
  removeHandler(handler) {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * 清除所有處理器
   */
  clearHandlers() {
    this.handlers = [];
  }

  /**
   * 加入效果到佇列
   * @param {Effect|Object} effect
   * @returns {Effect}
   */
  enqueue(effect) {
    if (!(effect instanceof Effect)) {
      effect = new Effect(effect);
    }
    this.queue.push(effect);
    this.sortQueue();
    this.emit('effectEnqueued', effect);
    return effect;
  }

  /**
   * 批次加入效果
   * @param {Array<Effect|Object>} effects
   * @returns {Effect[]}
   */
  enqueueBatch(effects) {
    const created = effects.map(e => e instanceof Effect ? e : new Effect(e));
    this.queue.push(...created);
    this.sortQueue();
    created.forEach(e => this.emit('effectEnqueued', e));
    return created;
  }

  /**
   * 排序佇列（優先級高的先執行）
   */
  sortQueue() {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 取消特定效果
   * @param {string} effectId
   * @returns {boolean}
   */
  cancel(effectId) {
    const effect = this.queue.find(e => e.id === effectId);
    if (effect && !effect.cancelled && !effect.resolved) {
      effect.cancel();
      this.emit('effectCancelled', effect);
      return true;
    }
    return false;
  }

  /**
   * 取消符合條件的效果
   * @param {Function} predicate
   * @returns {Effect[]}
   */
  cancelWhere(predicate) {
    const cancelled = [];
    for (const effect of this.queue) {
      if (!effect.cancelled && !effect.resolved && predicate(effect)) {
        effect.cancel();
        cancelled.push(effect);
        this.emit('effectCancelled', effect);
      }
    }
    return cancelled;
  }

  /**
   * 解析所有效果
   * @param {Object} gameState
   * @returns {Array}
   */
  resolveAll(gameState) {
    const results = [];

    while (this.queue.length > 0) {
      const effect = this.queue.shift();

      if (effect.cancelled) {
        this.resolvedEffects.push(effect);
        results.push({ effect, status: EFFECT_RESULT.CANCELLED });
        continue;
      }

      const result = this.resolveEffect(effect, gameState);
      results.push({ effect, ...result });
      this.resolvedEffects.push(effect);
    }

    return results;
  }

  /**
   * 解析單一效果
   * @param {Effect} effect
   * @param {Object} gameState
   * @returns {Object}
   */
  resolveEffect(effect, gameState) {
    this.emit('beforeResolve', effect);

    // 尋找可處理的處理器
    for (const handler of this.handlers) {
      if (handler.canHandle(effect)) {
        try {
          const result = handler.handle(effect, gameState);
          effect.resolve(result.status || EFFECT_RESULT.SUCCESS);
          this.emit('effectResolved', effect, result);
          return result;
        } catch (error) {
          effect.resolve(EFFECT_RESULT.FAILED);
          this.emit('effectFailed', effect, error);
          return { status: EFFECT_RESULT.FAILED, error: error.message };
        }
      }
    }

    // 無處理器，使用預設處理
    effect.resolve(EFFECT_RESULT.SUCCESS);
    this.emit('effectResolved', effect, { status: EFFECT_RESULT.SUCCESS });
    return { status: EFFECT_RESULT.SUCCESS };
  }

  /**
   * 解析下一個效果
   * @param {Object} gameState
   * @returns {Object|null}
   */
  resolveNext(gameState) {
    if (this.queue.length === 0) {
      return null;
    }

    const effect = this.queue.shift();

    if (effect.cancelled) {
      this.resolvedEffects.push(effect);
      return { effect, status: EFFECT_RESULT.CANCELLED };
    }

    const result = this.resolveEffect(effect, gameState);
    this.resolvedEffects.push(effect);
    return { effect, ...result };
  }

  /**
   * 查看佇列（不移除）
   * @param {number} count
   * @returns {Effect[]}
   */
  peek(count = 1) {
    return this.queue.slice(0, count);
  }

  /**
   * 取得佇列中符合條件的效果
   * @param {Function} predicate
   * @returns {Effect[]}
   */
  findEffects(predicate) {
    return this.queue.filter(predicate);
  }

  /**
   * 取得佇列長度
   * @returns {number}
   */
  get length() {
    return this.queue.length;
  }

  /**
   * 是否為空
   * @returns {boolean}
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * 清空佇列
   */
  clear() {
    this.queue = [];
    this.emit('queueCleared');
  }

  /**
   * 取得已解析的效果歷史
   * @returns {Effect[]}
   */
  getHistory() {
    return [...this.resolvedEffects];
  }

  /**
   * 清空歷史
   */
  clearHistory() {
    this.resolvedEffects = [];
  }

  /**
   * 完全重置（佇列和歷史）
   */
  reset() {
    this.queue = [];
    this.resolvedEffects = [];
    this.emit('queueReset');
  }

  // === 事件系統 ===

  /**
   * 註冊事件監聽器
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件監聽器
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 觸發事件
   * @param {string} event
   * @param {...any} args
   */
  emit(event, ...args) {
    if (!this.listeners.has(event)) return;
    for (const callback of this.listeners.get(event)) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    }
  }

  /**
   * 移除所有監聽器
   */
  removeAllListeners() {
    this.listeners.clear();
  }
}

/**
 * 預設效果佇列實例
 */
const effectQueue = new EffectQueue();

module.exports = {
  EffectQueue,
  effectQueue,
};
