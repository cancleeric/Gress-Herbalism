/**
 * 規則引擎
 * 管理遊戲規則的註冊、執行和覆寫
 *
 * @module logic/evolution/rules/RuleEngine
 */

/**
 * 規則引擎類別
 */
class RuleEngine {
  constructor() {
    /** @type {Map<string, Object>} 規則映射 */
    this.rules = new Map();

    /** @type {Map<string, Array>} 鉤子映射 */
    this.hooks = new Map();

    /** @type {Array<Function>} 中間件 */
    this.middleware = [];

    /** @type {Object|null} 性狀註冊中心引用 */
    this.traitRegistry = null;
  }

  // ==================== 規則管理 ====================

  /**
   * 註冊規則
   * @param {string} ruleId - 規則 ID
   * @param {Object} rule - 規則物件
   * @param {Function} rule.execute - 執行函數
   * @param {string} [rule.description] - 描述
   * @param {string} [rule.expansion] - 來源擴充包
   * @throws {Error} 如果規則 ID 無效或缺少 execute 函數
   */
  registerRule(ruleId, rule) {
    if (!ruleId || typeof ruleId !== 'string') {
      throw new Error('Rule ID must be a non-empty string');
    }
    if (!rule || !rule.execute || typeof rule.execute !== 'function') {
      throw new Error('Rule must have an execute function');
    }

    this.rules.set(ruleId, {
      ...rule,
      id: ruleId,
      registeredAt: Date.now(),
    });
  }

  /**
   * 覆寫規則
   * @param {string} ruleId - 規則 ID
   * @param {Function} modifier - 修改函數 (originalRule) => newRule
   * @throws {Error} 如果規則不存在
   */
  overrideRule(ruleId, modifier) {
    const original = this.rules.get(ruleId);
    if (!original) {
      throw new Error(`Cannot override non-existent rule: ${ruleId}`);
    }

    const modified = modifier(original);
    this.rules.set(ruleId, {
      ...modified,
      id: ruleId,
      originalRule: original,
      overriddenAt: Date.now(),
    });
  }

  /**
   * 擴展規則（在原規則前後添加邏輯）
   * @param {string} ruleId - 規則 ID
   * @param {Object} extensions - 擴展配置
   * @param {Function} [extensions.before] - 前置處理
   * @param {Function} [extensions.after] - 後置處理
   * @throws {Error} 如果規則不存在
   */
  extendRule(ruleId, extensions) {
    const original = this.rules.get(ruleId);
    if (!original) {
      throw new Error(`Cannot extend non-existent rule: ${ruleId}`);
    }

    const extended = {
      ...original,
      execute: async (context) => {
        let result = context;

        // 前置處理
        if (extensions.before) {
          result = await extensions.before(result);
        }

        // 原規則
        result = await original.execute(result);

        // 後置處理
        if (extensions.after) {
          result = await extensions.after(result);
        }

        return result;
      },
      extended: true,
      extensions: [...(original.extensions || []), extensions],
    };

    this.rules.set(ruleId, extended);
  }

  /**
   * 取得規則
   * @param {string} ruleId - 規則 ID
   * @returns {Object|undefined} 規則物件
   */
  getRule(ruleId) {
    return this.rules.get(ruleId);
  }

  /**
   * 檢查規則是否存在
   * @param {string} ruleId - 規則 ID
   * @returns {boolean}
   */
  hasRule(ruleId) {
    return this.rules.has(ruleId);
  }

  /**
   * 移除規則
   * @param {string} ruleId - 規則 ID
   * @returns {boolean} 是否成功移除
   */
  removeRule(ruleId) {
    return this.rules.delete(ruleId);
  }

  /**
   * 執行規則
   * @param {string} ruleId - 規則 ID
   * @param {Object} context - 執行上下文
   * @returns {Promise<*>} 規則執行結果
   * @throws {Error} 如果規則不存在
   */
  async executeRule(ruleId, context) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    // 建立完整上下文
    const fullContext = this.createContext(context);

    // 執行中間件
    let processedContext = fullContext;
    for (const mw of this.middleware) {
      processedContext = await mw(processedContext, ruleId);
    }

    // 執行規則
    return rule.execute(processedContext);
  }

  // ==================== 鉤子管理 ====================

  /**
   * 註冊鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Function} callback - 回調函數
   * @param {number} [priority=100] - 優先級（數字越小越先執行）
   */
  addHook(hookName, callback, priority = 100) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hooks = this.hooks.get(hookName);
    hooks.push({ callback, priority });

    // 按優先級排序
    hooks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 移除鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Function} callback - 回調函數
   * @returns {boolean} 是否成功移除
   */
  removeHook(hookName, callback) {
    const hooks = this.hooks.get(hookName);
    if (!hooks) return false;

    const index = hooks.findIndex(h => h.callback === callback);
    if (index !== -1) {
      hooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 清除指定鉤子的所有監聽器
   * @param {string} hookName - 鉤子名稱
   */
  clearHook(hookName) {
    this.hooks.delete(hookName);
  }

  /**
   * 取得鉤子監聽器數量
   * @param {string} hookName - 鉤子名稱
   * @returns {number}
   */
  getHookCount(hookName) {
    const hooks = this.hooks.get(hookName);
    return hooks ? hooks.length : 0;
  }

  /**
   * 觸發鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Object} context - 上下文
   * @returns {Promise<Object|null>} 處理後的上下文
   */
  async triggerHook(hookName, context) {
    const hooks = this.hooks.get(hookName);
    if (!hooks || hooks.length === 0) {
      return context;
    }

    let result = context;
    for (const { callback } of hooks) {
      result = await callback(result);
      if (result === null || result === undefined) {
        // 鉤子可以返回 null 來中斷後續處理
        break;
      }
    }

    return result;
  }

  // ==================== 中間件 ====================

  /**
   * 添加中間件
   * @param {Function} middleware - 中間件函數 (context, ruleId) => context
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middleware.push(middleware);
  }

  /**
   * 移除中間件
   * @param {Function} middleware - 中間件函數
   * @returns {boolean} 是否成功移除
   */
  removeMiddleware(middleware) {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 清除所有中間件
   */
  clearMiddleware() {
    this.middleware = [];
  }

  // ==================== 上下文 ====================

  /**
   * 建立執行上下文
   * @param {Object} context - 基礎上下文
   * @returns {Object} 完整上下文
   */
  createContext(context) {
    return {
      ...context,
      ruleEngine: this,
      traitRegistry: this.traitRegistry,

      // 輔助方法
      getTraitHandler: (traitType) => this.traitRegistry?.get(traitType),
      executeRule: (ruleId, ctx) => this.executeRule(ruleId, ctx),
      triggerHook: (hookName, ctx) => this.triggerHook(hookName, ctx),
    };
  }

  /**
   * 設定性狀註冊中心
   * @param {Object} registry - 性狀註冊中心
   */
  setTraitRegistry(registry) {
    this.traitRegistry = registry;
  }

  /**
   * 取得性狀註冊中心
   * @returns {Object|null}
   */
  getTraitRegistry() {
    return this.traitRegistry;
  }

  // ==================== 工具方法 ====================

  /**
   * 取得所有規則 ID
   * @returns {string[]}
   */
  getRuleIds() {
    return Array.from(this.rules.keys());
  }

  /**
   * 取得所有鉤子名稱
   * @returns {string[]}
   */
  getHookNames() {
    return Array.from(this.hooks.keys());
  }

  /**
   * 取得規則數量
   * @returns {number}
   */
  getRuleCount() {
    return this.rules.size;
  }

  /**
   * 重置（測試用）
   */
  reset() {
    this.rules.clear();
    this.hooks.clear();
    this.middleware = [];
    this.traitRegistry = null;
  }

  /**
   * 匯出引擎狀態（用於除錯）
   * @returns {Object}
   */
  exportState() {
    return {
      ruleCount: this.rules.size,
      ruleIds: this.getRuleIds(),
      hookCount: this.hooks.size,
      hookNames: this.getHookNames(),
      middlewareCount: this.middleware.length,
      hasTraitRegistry: this.traitRegistry !== null,
    };
  }
}

module.exports = RuleEngine;
