/**
 * 擴充包載入器
 *
 * 負責動態載入擴充包模組、解析依賴關係、追蹤載入狀態
 *
 * @module expansions/loader
 */

const { EXPANSION_STATUS, validateManifest } = require('./manifest');

/**
 * 擴充包載入結果
 */
class LoadResult {
  /**
   * @param {string} expansionId - 擴充包 ID
   */
  constructor(expansionId) {
    this.expansionId = expansionId;
    this.success = false;
    this.status = EXPANSION_STATUS.NOT_LOADED;
    this.manifest = null;
    this.module = null;
    this.error = null;
    this.loadTime = 0;
  }

  /**
   * 建立成功結果
   * @param {string} expansionId
   * @param {Object} manifest
   * @param {Object} module
   * @param {number} loadTime
   * @returns {LoadResult}
   */
  static success(expansionId, manifest, module, loadTime) {
    const result = new LoadResult(expansionId);
    result.success = true;
    result.status = EXPANSION_STATUS.LOADED;
    result.manifest = manifest;
    result.module = module;
    result.loadTime = loadTime;
    return result;
  }

  /**
   * 建立失敗結果
   * @param {string} expansionId
   * @param {string} error
   * @returns {LoadResult}
   */
  static failure(expansionId, error) {
    const result = new LoadResult(expansionId);
    result.success = false;
    result.status = EXPANSION_STATUS.ERROR;
    result.error = error;
    return result;
  }
}

/**
 * 擴充包載入器
 */
class ExpansionLoader {
  constructor() {
    /** @type {Map<string, LoadResult>} 已載入的擴充包 */
    this.loadedExpansions = new Map();

    /** @type {Map<string, Promise<LoadResult>>} 正在載入的 Promise */
    this.loadingPromises = new Map();

    /** @type {Map<string, string>} 擴充包路徑註冊 */
    this.expansionPaths = new Map();

    /** @type {Map<string, Object>} 直接註冊的模組（用於測試或預載入） */
    this.registeredModules = new Map();

    /** @type {Function[]} 載入成功回調 */
    this.onLoadCallbacks = [];

    /** @type {Function[]} 載入失敗回調 */
    this.onErrorCallbacks = [];
  }

  /**
   * 註冊擴充包路徑
   * @param {string} expansionId
   * @param {string} path - 模組路徑
   */
  registerPath(expansionId, path) {
    this.expansionPaths.set(expansionId, path);
  }

  /**
   * 批次註冊擴充包路徑
   * @param {Object} pathMap - { expansionId: path }
   */
  registerPaths(pathMap) {
    for (const [id, path] of Object.entries(pathMap)) {
      this.registerPath(id, path);
    }
  }

  /**
   * 直接註冊模組（用於測試或預載入）
   * @param {string} expansionId
   * @param {Object} module - 模組物件，需包含 manifest
   */
  registerModule(expansionId, module) {
    this.registeredModules.set(expansionId, module);
  }

  /**
   * 載入擴充包
   * @param {string} expansionId
   * @returns {Promise<LoadResult>}
   */
  async load(expansionId) {
    // 檢查是否已載入
    if (this.loadedExpansions.has(expansionId)) {
      return this.loadedExpansions.get(expansionId);
    }

    // 檢查是否正在載入（避免重複載入）
    if (this.loadingPromises.has(expansionId)) {
      return await this.loadingPromises.get(expansionId);
    }

    // 開始載入
    const loadPromise = this._loadExpansion(expansionId);
    this.loadingPromises.set(expansionId, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedExpansions.set(expansionId, result);

      if (result.success) {
        this._notifyLoad(result);
      } else {
        this._notifyError(result);
      }

      return result;
    } finally {
      this.loadingPromises.delete(expansionId);
    }
  }

  /**
   * 內部載入邏輯
   * @private
   * @param {string} expansionId
   * @returns {Promise<LoadResult>}
   */
  async _loadExpansion(expansionId) {
    const startTime = Date.now();

    try {
      // 優先使用直接註冊的模組
      let module = this.registeredModules.get(expansionId);

      if (!module) {
        // 取得擴充包路徑
        const path = this.expansionPaths.get(expansionId);
        if (!path) {
          throw new Error(`Expansion path not registered: ${expansionId}`);
        }

        // 動態載入模組
        module = await this._importModule(path);
      }

      // 驗證模組結構
      if (!module.manifest) {
        throw new Error('Expansion module missing manifest');
      }

      // 驗證 Manifest
      const validation = validateManifest(module.manifest);
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
      }

      // 檢查依賴
      await this._resolveDependencies(module.manifest);

      const loadTime = Date.now() - startTime;
      return LoadResult.success(expansionId, module.manifest, module, loadTime);

    } catch (error) {
      return LoadResult.failure(expansionId, error.message);
    }
  }

  /**
   * 動態載入模組
   * @private
   * @param {string} path
   * @returns {Promise<Object>}
   */
  async _importModule(path) {
    // Node.js 環境
    if (typeof require !== 'undefined') {
      try {
        // 嘗試 CommonJS require
        return require(path);
      } catch (e) {
        // 如果 require 失敗，嘗試動態 import
        try {
          return await import(path);
        } catch (importError) {
          throw new Error(`Failed to load module: ${path}`);
        }
      }
    }

    // 瀏覽器環境
    return await import(path);
  }

  /**
   * 解析依賴
   * @private
   * @param {Object} manifest
   */
  async _resolveDependencies(manifest) {
    if (!manifest.dependencies) return;

    for (const [depId, versionRange] of Object.entries(manifest.dependencies)) {
      // 載入依賴擴充包
      const depResult = await this.load(depId);

      if (!depResult.success) {
        throw new Error(`Failed to load dependency: ${depId} - ${depResult.error}`);
      }

      // 檢查版本相容性
      if (!this._checkVersion(depResult.manifest.version, versionRange)) {
        throw new Error(
          `Dependency version mismatch: ${depId} requires ${versionRange}, got ${depResult.manifest.version}`
        );
      }
    }
  }

  /**
   * 檢查版本相容性
   * @private
   * @param {string} version - 實際版本
   * @param {string} range - 要求的版本範圍
   * @returns {boolean}
   */
  _checkVersion(version, range) {
    // 支援 >=x.y.z 格式
    if (range.startsWith('>=')) {
      const requiredVersion = range.slice(2);
      return this._compareVersions(version, requiredVersion) >= 0;
    }

    // 支援 ^x.y.z 格式（相容主版本）
    if (range.startsWith('^')) {
      const requiredVersion = range.slice(1);
      const [reqMajor] = requiredVersion.split('.').map(Number);
      const [actMajor] = version.split('.').map(Number);
      return actMajor === reqMajor && this._compareVersions(version, requiredVersion) >= 0;
    }

    // 精確匹配
    return version === range;
  }

  /**
   * 比較版本號
   * @private
   * @param {string} a
   * @param {string} b
   * @returns {number} 1 if a > b, -1 if a < b, 0 if equal
   */
  _compareVersions(a, b) {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA > numB) return 1;
      if (numA < numB) return -1;
    }

    return 0;
  }

  /**
   * 批次載入擴充包
   * @param {string[]} expansionIds
   * @returns {Promise<{ success: boolean, results: LoadResult[], failed: string[] }>}
   */
  async loadMultiple(expansionIds) {
    const results = await Promise.all(
      expansionIds.map(id => this.load(id))
    );

    return {
      success: results.every(r => r.success),
      results,
      failed: results.filter(r => !r.success).map(r => r.expansionId),
    };
  }

  /**
   * 解除載入
   * @param {string} expansionId
   * @returns {boolean}
   */
  unload(expansionId) {
    if (this.loadedExpansions.has(expansionId)) {
      this.loadedExpansions.delete(expansionId);
      return true;
    }
    return false;
  }

  /**
   * 取得已載入的擴充包
   * @param {string} expansionId
   * @returns {LoadResult|undefined}
   */
  getLoaded(expansionId) {
    return this.loadedExpansions.get(expansionId);
  }

  /**
   * 取得所有已載入的擴充包 ID
   * @returns {string[]}
   */
  getLoadedIds() {
    return Array.from(this.loadedExpansions.keys());
  }

  /**
   * 檢查是否已載入
   * @param {string} expansionId
   * @returns {boolean}
   */
  isLoaded(expansionId) {
    return this.loadedExpansions.has(expansionId);
  }

  /**
   * 取得載入狀態
   * @param {string} expansionId
   * @returns {string}
   */
  getStatus(expansionId) {
    if (this.loadingPromises.has(expansionId)) {
      return EXPANSION_STATUS.LOADING;
    }

    const result = this.loadedExpansions.get(expansionId);
    if (result) {
      return result.status;
    }

    return EXPANSION_STATUS.NOT_LOADED;
  }

  // === 回調註冊 ===

  /**
   * 註冊載入成功回調
   * @param {Function} callback
   * @returns {Function} 取消註冊函數
   */
  onLoad(callback) {
    this.onLoadCallbacks.push(callback);
    return () => {
      const index = this.onLoadCallbacks.indexOf(callback);
      if (index !== -1) this.onLoadCallbacks.splice(index, 1);
    };
  }

  /**
   * 註冊載入失敗回調
   * @param {Function} callback
   * @returns {Function} 取消註冊函數
   */
  onError(callback) {
    this.onErrorCallbacks.push(callback);
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index !== -1) this.onErrorCallbacks.splice(index, 1);
    };
  }

  /**
   * 通知載入成功
   * @private
   * @param {LoadResult} result
   */
  _notifyLoad(result) {
    for (const callback of this.onLoadCallbacks) {
      try {
        callback(result);
      } catch (e) {
        console.error('Load callback error:', e);
      }
    }
  }

  /**
   * 通知載入失敗
   * @private
   * @param {LoadResult} result
   */
  _notifyError(result) {
    for (const callback of this.onErrorCallbacks) {
      try {
        callback(result);
      } catch (e) {
        console.error('Error callback error:', e);
      }
    }
  }

  /**
   * 重置載入器
   */
  reset() {
    this.loadedExpansions.clear();
    this.loadingPromises.clear();
    this.registeredModules.clear();
    // 保留 expansionPaths，因為這通常是靜態配置
  }
}

// 預設實例
const expansionLoader = new ExpansionLoader();

module.exports = {
  LoadResult,
  ExpansionLoader,
  expansionLoader,
};
