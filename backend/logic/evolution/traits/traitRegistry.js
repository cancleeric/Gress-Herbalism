/**
 * 性狀處理器註冊中心
 *
 * 管理所有性狀處理器的註冊與取得。
 * 提供全域單例以供整個應用程式使用。
 *
 * @module logic/evolution/traits/traitRegistry
 */

/**
 * 性狀處理器註冊表類別
 */
class TraitRegistry {
  /**
   * 建立性狀處理器註冊表
   */
  constructor() {
    /** @type {Map<string, TraitHandler>} */
    this.handlers = new Map();
  }

  /**
   * 註冊性狀處理器
   *
   * @param {TraitHandler} handler - 性狀處理器實例
   * @throws {Error} 如果處理器沒有 type 屬性
   * @throws {Error} 如果該類型已被註冊
   */
  register(handler) {
    if (!handler || !handler.type) {
      throw new Error('Handler must have a type property');
    }

    if (this.handlers.has(handler.type)) {
      throw new Error(`Handler for type "${handler.type}" is already registered`);
    }

    this.handlers.set(handler.type, handler);
  }

  /**
   * 取得性狀處理器
   *
   * @param {string} traitType - 性狀類型
   * @returns {TraitHandler|undefined} 處理器實例
   */
  get(traitType) {
    return this.handlers.get(traitType);
  }

  /**
   * 檢查是否存在處理器
   *
   * @param {string} traitType - 性狀類型
   * @returns {boolean} 是否存在
   */
  has(traitType) {
    return this.handlers.has(traitType);
  }

  /**
   * 取得所有處理器
   *
   * @returns {TraitHandler[]} 處理器陣列
   */
  getAll() {
    return Array.from(this.handlers.values());
  }

  /**
   * 取得所有已註冊的性狀類型
   *
   * @returns {string[]} 性狀類型陣列
   */
  getAllTypes() {
    return Array.from(this.handlers.keys());
  }

  /**
   * 批量註冊處理器
   *
   * @param {Object|Array} handlers - 處理器物件或陣列
   */
  registerAll(handlers) {
    const handlerArray = Array.isArray(handlers)
      ? handlers
      : Object.values(handlers);

    for (const handler of handlerArray) {
      this.register(handler);
    }
  }

  /**
   * 移除處理器
   *
   * @param {string} traitType - 性狀類型
   * @returns {boolean} 是否成功移除
   */
  unregister(traitType) {
    return this.handlers.delete(traitType);
  }

  /**
   * 清除所有處理器（測試用）
   */
  clear() {
    this.handlers.clear();
  }

  /**
   * 取得處理器數量
   *
   * @returns {number} 處理器數量
   */
  get size() {
    return this.handlers.size;
  }

  /**
   * 依類別取得處理器
   *
   * @param {string} category - 類別
   * @returns {TraitHandler[]} 該類別的處理器陣列
   */
  getByCategory(category) {
    return this.getAll().filter(handler => handler.category === category);
  }

  /**
   * 依擴充包取得處理器
   *
   * @param {string} expansionId - 擴充包 ID
   * @returns {TraitHandler[]} 該擴充包的處理器陣列
   */
  getByExpansion(expansionId) {
    return this.getAll().filter(handler => handler.expansion === expansionId);
  }
}

/**
 * 全域性狀處理器註冊表單例
 * @type {TraitRegistry}
 */
const globalTraitRegistry = new TraitRegistry();

module.exports = {
  TraitRegistry,
  globalTraitRegistry,
};
