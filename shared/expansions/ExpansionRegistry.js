/**
 * 擴充包註冊系統
 *
 * ExpansionRegistry 是演化論遊戲擴充包系統的核心，負責：
 * - 管理擴充包的註冊與移除
 * - 控制擴充包的啟用與停用
 * - 驗證擴充包格式與依賴關係
 * - 整合性狀處理器與卡牌池
 *
 * @module expansions/ExpansionRegistry
 */

const { validateExpansionInterface } = require('./ExpansionInterface');

/**
 * 擴充包註冊表類別
 * 管理所有擴充包的生命週期
 */
class ExpansionRegistry {
  /**
   * 建立新的擴充包註冊表
   */
  constructor() {
    /** @type {Map<string, Object>} 所有已註冊的擴充包 */
    this.expansions = new Map();

    /** @type {Set<string>} 已啟用的擴充包 ID */
    this.enabled = new Set();

    /** @type {Map<string, Object>} 性狀處理器映射 */
    this.traitHandlers = new Map();

    /** @type {Array} 啟用的卡牌池 */
    this.cardPool = [];

    /** @type {Map<string, Object>} 合併的規則 */
    this.mergedRules = new Map();
  }

  /**
   * 註冊擴充包
   * @param {Object} expansion - 擴充包物件
   * @throws {Error} 如果擴充包格式無效或 ID 已存在
   */
  register(expansion) {
    // 驗證擴充包格式
    const validation = this.validateExpansion(expansion);
    if (!validation.valid) {
      throw new Error(`擴充包格式無效: ${validation.errors.join(', ')}`);
    }

    // 檢查 ID 是否已存在
    if (this.expansions.has(expansion.id)) {
      throw new Error(`擴充包 ID "${expansion.id}" 已存在`);
    }

    // 註冊擴充包
    this.expansions.set(expansion.id, {
      ...expansion,
      requires: expansion.requires || [],
      incompatible: expansion.incompatible || [],
      traits: expansion.traits || {},
      cards: expansion.cards || [],
      rules: expansion.rules || {},
    });

    // 調用註冊鉤子
    if (typeof expansion.onRegister === 'function') {
      expansion.onRegister(this);
    }
  }

  /**
   * 移除擴充包
   * @param {string} expansionId - 擴充包 ID
   * @returns {boolean} 是否成功移除
   */
  unregister(expansionId) {
    if (!this.expansions.has(expansionId)) {
      return false;
    }

    // 如果已啟用，先停用
    if (this.enabled.has(expansionId)) {
      this.disable(expansionId);
    }

    // 檢查是否有其他擴充包依賴此擴充包
    for (const [id, exp] of this.expansions.entries()) {
      if (exp.requires.includes(expansionId) && this.enabled.has(id)) {
        throw new Error(`無法移除 "${expansionId}"：擴充包 "${id}" 依賴它`);
      }
    }

    this.expansions.delete(expansionId);
    return true;
  }

  /**
   * 啟用擴充包
   * @param {string} expansionId - 擴充包 ID
   * @throws {Error} 如果擴充包不存在、依賴未滿足或有相容性衝突
   */
  enable(expansionId) {
    const expansion = this.expansions.get(expansionId);
    if (!expansion) {
      throw new Error(`擴充包 "${expansionId}" 不存在`);
    }

    // 檢查是否已啟用
    if (this.enabled.has(expansionId)) {
      return;
    }

    // 檢查依賴
    const depCheck = this.checkDependencies(expansionId);
    if (!depCheck.satisfied) {
      throw new Error(
        `擴充包 "${expansionId}" 依賴的擴充包未啟用: ${depCheck.missing.join(', ')}`
      );
    }

    // 檢查相容性
    const compatCheck = this.checkCompatibility(expansionId);
    if (!compatCheck.compatible) {
      throw new Error(
        `擴充包 "${expansionId}" 與已啟用的擴充包不相容: ${compatCheck.conflicts.join(', ')}`
      );
    }

    // 啟用擴充包
    this.enabled.add(expansionId);

    // 註冊性狀處理器
    for (const [traitType, handler] of Object.entries(expansion.traits)) {
      this.traitHandlers.set(traitType, handler);
    }

    // 更新卡牌池
    this._rebuildCardPool();

    // 合併規則
    this._mergeRules(expansion.rules);

    // 調用啟用鉤子
    if (typeof expansion.onEnable === 'function') {
      expansion.onEnable(this);
    }
  }

  /**
   * 停用擴充包
   * @param {string} expansionId - 擴充包 ID
   * @throws {Error} 如果有其他啟用的擴充包依賴此擴充包
   */
  disable(expansionId) {
    if (!this.enabled.has(expansionId)) {
      return;
    }

    // 檢查是否有其他啟用的擴充包依賴此擴充包
    for (const [id, exp] of this.expansions.entries()) {
      if (this.enabled.has(id) && exp.requires.includes(expansionId)) {
        throw new Error(`無法停用 "${expansionId}"：擴充包 "${id}" 依賴它`);
      }
    }

    const expansion = this.expansions.get(expansionId);

    // 調用停用鉤子
    if (expansion && typeof expansion.onDisable === 'function') {
      expansion.onDisable(this);
    }

    // 停用擴充包
    this.enabled.delete(expansionId);

    // 移除性狀處理器
    if (expansion) {
      for (const traitType of Object.keys(expansion.traits)) {
        this.traitHandlers.delete(traitType);
      }
    }

    // 重建卡牌池
    this._rebuildCardPool();

    // 重建規則
    this._rebuildRules();
  }

  /**
   * 檢查擴充包是否已啟用
   * @param {string} expansionId - 擴充包 ID
   * @returns {boolean} 是否已啟用
   */
  isEnabled(expansionId) {
    return this.enabled.has(expansionId);
  }

  /**
   * 取得擴充包
   * @param {string} expansionId - 擴充包 ID
   * @returns {Object|undefined} 擴充包物件
   */
  getExpansion(expansionId) {
    return this.expansions.get(expansionId);
  }

  /**
   * 取得所有已註冊的擴充包
   * @returns {Array<Object>} 擴充包陣列
   */
  getAllExpansions() {
    return Array.from(this.expansions.values());
  }

  /**
   * 取得所有啟用的擴充包
   * @returns {Array<Object>} 啟用的擴充包陣列
   */
  getEnabledExpansions() {
    return Array.from(this.enabled).map(id => this.expansions.get(id));
  }

  /**
   * 取得性狀處理器
   * @param {string} traitType - 性狀類型
   * @returns {Object|undefined} 性狀處理器
   */
  getTraitHandler(traitType) {
    return this.traitHandlers.get(traitType);
  }

  /**
   * 取得所有性狀處理器
   * @returns {Map<string, Object>} 性狀處理器映射
   */
  getAllTraitHandlers() {
    return new Map(this.traitHandlers);
  }

  /**
   * 取得啟用的卡牌池
   * @returns {Array} 卡牌定義陣列
   */
  getCardPool() {
    return [...this.cardPool];
  }

  /**
   * 建立遊戲牌組
   * 根據卡牌定義的 count 屬性展開成實際的牌組
   * @returns {Array} 展開後的卡牌陣列
   */
  createDeck() {
    const deck = [];
    let cardIndex = 0;

    for (const cardDef of this.cardPool) {
      const count = cardDef.count || 1;
      for (let i = 0; i < count; i++) {
        deck.push({
          id: `${cardDef.id || cardDef.frontTrait}-${cardIndex++}`,
          frontTrait: cardDef.frontTrait,
          backTrait: cardDef.backTrait,
          expansionId: cardDef.expansionId,
        });
      }
    }

    return deck;
  }

  /**
   * 取得合併的規則
   * @param {string} [ruleKey] - 規則鍵名，若未指定則返回所有規則
   * @returns {*} 規則值或所有規則
   */
  getRule(ruleKey) {
    if (ruleKey === undefined) {
      return Object.fromEntries(this.mergedRules);
    }
    return this.mergedRules.get(ruleKey);
  }

  /**
   * 驗證擴充包格式
   * @param {Object} expansion - 擴充包物件
   * @returns {{ valid: boolean, errors: string[] }} 驗證結果
   */
  validateExpansion(expansion) {
    return validateExpansionInterface(expansion);
  }

  /**
   * 檢查擴充包的依賴是否滿足
   * @param {string} expansionId - 擴充包 ID
   * @returns {{ satisfied: boolean, missing: string[] }} 依賴檢查結果
   */
  checkDependencies(expansionId) {
    const expansion = this.expansions.get(expansionId);
    if (!expansion) {
      return { satisfied: false, missing: [expansionId] };
    }

    const missing = [];
    for (const reqId of expansion.requires || []) {
      if (!this.enabled.has(reqId)) {
        missing.push(reqId);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * 檢查擴充包的相容性
   * @param {string} expansionId - 擴充包 ID
   * @returns {{ compatible: boolean, conflicts: string[] }} 相容性檢查結果
   */
  checkCompatibility(expansionId) {
    const expansion = this.expansions.get(expansionId);
    if (!expansion) {
      return { compatible: false, conflicts: [] };
    }

    const conflicts = [];

    // 檢查此擴充包是否與已啟用的擴充包不相容
    for (const incompatId of expansion.incompatible || []) {
      if (this.enabled.has(incompatId)) {
        conflicts.push(incompatId);
      }
    }

    // 檢查已啟用的擴充包是否與此擴充包不相容
    for (const enabledId of this.enabled) {
      const enabledExp = this.expansions.get(enabledId);
      if (enabledExp && enabledExp.incompatible?.includes(expansionId)) {
        if (!conflicts.includes(enabledId)) {
          conflicts.push(enabledId);
        }
      }
    }

    return {
      compatible: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * 重置註冊表
   * 清除所有已註冊和已啟用的擴充包
   */
  reset() {
    // 調用所有啟用擴充包的停用鉤子
    for (const expansionId of this.enabled) {
      const expansion = this.expansions.get(expansionId);
      if (expansion && typeof expansion.onDisable === 'function') {
        expansion.onDisable(this);
      }
    }

    this.expansions.clear();
    this.enabled.clear();
    this.traitHandlers.clear();
    this.cardPool = [];
    this.mergedRules.clear();
  }

  /**
   * 重建卡牌池
   * @private
   */
  _rebuildCardPool() {
    this.cardPool = [];

    for (const expansionId of this.enabled) {
      const expansion = this.expansions.get(expansionId);
      if (expansion && expansion.cards) {
        for (const card of expansion.cards) {
          this.cardPool.push({
            ...card,
            expansionId,
          });
        }
      }
    }
  }

  /**
   * 合併規則
   * @param {Object} rules - 規則物件
   * @private
   */
  _mergeRules(rules) {
    if (!rules) return;

    for (const [key, value] of Object.entries(rules)) {
      this.mergedRules.set(key, value);
    }
  }

  /**
   * 重建規則
   * @private
   */
  _rebuildRules() {
    this.mergedRules.clear();

    for (const expansionId of this.enabled) {
      const expansion = this.expansions.get(expansionId);
      if (expansion && expansion.rules) {
        this._mergeRules(expansion.rules);
      }
    }
  }

  /**
   * 調用所有啟用擴充包的遊戲初始化鉤子
   * @param {Object} gameState - 遊戲狀態
   */
  triggerGameInit(gameState) {
    for (const expansionId of this.enabled) {
      const expansion = this.expansions.get(expansionId);
      if (expansion && typeof expansion.onGameInit === 'function') {
        expansion.onGameInit(gameState);
      }
    }
  }

  /**
   * 調用所有啟用擴充包的遊戲結束鉤子
   * @param {Object} gameState - 遊戲狀態
   */
  triggerGameEnd(gameState) {
    for (const expansionId of this.enabled) {
      const expansion = this.expansions.get(expansionId);
      if (expansion && typeof expansion.onGameEnd === 'function') {
        expansion.onGameEnd(gameState);
      }
    }
  }
}

module.exports = { ExpansionRegistry };
