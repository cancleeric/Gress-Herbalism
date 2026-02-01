/**
 * 效果系統核心
 *
 * 提供 Effect 類別和 EffectHandler 介面
 *
 * @module expansions/core/effectSystem
 */

const { EFFECT_PRIORITY, EFFECT_RESULT } = require('./effectTypes');

/**
 * 效果類別
 */
class Effect {
  /**
   * @param {Object} options - 效果選項
   * @param {string} options.type - 效果類型
   * @param {string} [options.timing] - 觸發時機
   * @param {number} [options.priority] - 優先級
   * @param {string} [options.source] - 效果來源
   * @param {string} [options.sourceCreature] - 觸發效果的生物
   * @param {string} [options.target] - 目標
   * @param {Object} [options.data] - 效果資料
   */
  constructor(options) {
    this.id = options.id || `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = options.type;
    this.timing = options.timing || null;
    this.priority = options.priority ?? EFFECT_PRIORITY.NORMAL;
    this.source = options.source || null;
    this.sourceCreature = options.sourceCreature || null;
    this.target = options.target || null;
    this.data = options.data || {};
    this.resolved = false;
    this.result = null;
    this.cancelled = false;
    this.createdAt = Date.now();
  }

  /**
   * 取消效果
   */
  cancel() {
    if (!this.resolved) {
      this.cancelled = true;
      this.result = EFFECT_RESULT.CANCELLED;
    }
  }

  /**
   * 標記為已解析
   * @param {string} result - 結果狀態
   */
  resolve(result = EFFECT_RESULT.SUCCESS) {
    if (!this.cancelled) {
      this.resolved = true;
      this.result = result;
    }
  }

  /**
   * 檢查是否可執行
   * @returns {boolean}
   */
  canExecute() {
    return !this.resolved && !this.cancelled;
  }

  /**
   * 複製效果（用於重定向）
   * @param {Object} overrides - 覆寫屬性
   * @returns {Effect}
   */
  clone(overrides = {}) {
    return new Effect({
      type: this.type,
      timing: this.timing,
      priority: this.priority,
      source: this.source,
      sourceCreature: this.sourceCreature,
      target: this.target,
      data: { ...this.data },
      ...overrides,
    });
  }

  /**
   * 序列化為 JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      timing: this.timing,
      priority: this.priority,
      source: this.source,
      sourceCreature: this.sourceCreature,
      target: this.target,
      data: this.data,
      resolved: this.resolved,
      result: this.result,
      cancelled: this.cancelled,
      createdAt: this.createdAt,
    };
  }

  /**
   * 從 JSON 還原
   * @param {Object} json
   * @returns {Effect}
   */
  static fromJSON(json) {
    const effect = new Effect(json);
    effect.resolved = json.resolved || false;
    effect.result = json.result || null;
    effect.cancelled = json.cancelled || false;
    effect.createdAt = json.createdAt || Date.now();
    return effect;
  }
}

/**
 * 效果處理器抽象類別
 */
class EffectHandler {
  /**
   * 是否可以處理此效果
   * @param {Effect} effect
   * @returns {boolean}
   */
  canHandle(effect) {
    throw new Error('Must implement canHandle()');
  }

  /**
   * 處理效果
   * @param {Effect} effect
   * @param {Object} gameState
   * @returns {Object} 處理結果
   */
  handle(effect, gameState) {
    throw new Error('Must implement handle()');
  }

  /**
   * 效果處理優先級（處理器之間的優先級）
   * @returns {number}
   */
  getHandlerPriority() {
    return 0;
  }
}

module.exports = {
  Effect,
  EffectHandler,
};
