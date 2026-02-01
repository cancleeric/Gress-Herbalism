# 工單 0326：建立擴充包載入機制

## 基本資訊
- **工單編號**：0326
- **所屬計畫**：P2-A 可擴充架構
- **前置工單**：0317（ExpansionRegistry）、0323（卡牌系統）
- **預計影響檔案**：
  - `shared/expansions/loader.js`（新增）
  - `shared/expansions/manifest.js`（新增）
  - `shared/expansions/registry.js`（更新）
  - `backend/logic/evolution/gameLogic.js`（整合）

---

## 目標

建立擴充包動態載入機制，實現：
1. 擴充包 Manifest 規範定義
2. 動態載入擴充包模組
3. 擴充包依賴解析
4. 載入狀態追蹤

---

## 詳細規格

### 1. 擴充包 Manifest 規範

```javascript
// shared/expansions/manifest.js

/**
 * Manifest 版本
 */
export const MANIFEST_VERSION = '1.0.0';

/**
 * 擴充包類型
 */
export const EXPANSION_TYPE = {
  BASE: 'base',           // 基礎版
  EXPANSION: 'expansion', // 擴充包
  PROMO: 'promo',         // 促銷卡
  FAN_MADE: 'fan_made',   // 玩家自製
};

/**
 * 擴充包狀態
 */
export const EXPANSION_STATUS = {
  NOT_LOADED: 'not_loaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  ERROR: 'error',
};

/**
 * Manifest 介面定義
 * @typedef {Object} ExpansionManifest
 * @property {string} id - 唯一識別碼
 * @property {string} name - 中文名稱
 * @property {string} nameEn - 英文名稱
 * @property {string} version - 版本號 (semver)
 * @property {string} type - 擴充包類型
 * @property {string} description - 描述
 * @property {string[]} authors - 作者
 * @property {Object} dependencies - 依賴的擴充包 { id: version }
 * @property {Object} conflicts - 衝突的擴充包 { id: reason }
 * @property {number} minPlayers - 最少玩家數
 * @property {number} maxPlayers - 最多玩家數
 * @property {Object} contents - 內容摘要
 */

/**
 * 驗證 Manifest
 * @param {Object} manifest
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateManifest(manifest) {
  const errors = [];

  // 必要欄位
  const required = ['id', 'name', 'version', 'type'];
  for (const field of required) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // ID 格式驗證
  if (manifest.id && !/^[a-z][a-z0-9_-]*$/.test(manifest.id)) {
    errors.push('Invalid id format. Must be lowercase, start with letter, contain only letters, numbers, underscores, or hyphens.');
  }

  // 版本格式驗證 (semver)
  if (manifest.version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
    errors.push('Invalid version format. Must follow semver (e.g., 1.0.0)');
  }

  // 類型驗證
  if (manifest.type && !Object.values(EXPANSION_TYPE).includes(manifest.type)) {
    errors.push(`Invalid type. Must be one of: ${Object.values(EXPANSION_TYPE).join(', ')}`);
  }

  // 玩家數驗證
  if (manifest.minPlayers !== undefined && manifest.maxPlayers !== undefined) {
    if (manifest.minPlayers > manifest.maxPlayers) {
      errors.push('minPlayers cannot be greater than maxPlayers');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 建立基礎版 Manifest
 */
export const BASE_MANIFEST = {
  id: 'base',
  name: '演化論：物種起源',
  nameEn: 'Evolution: The Origin of Species',
  version: '1.0.0',
  type: EXPANSION_TYPE.BASE,
  description: '基礎版遊戲，包含84張卡牌和19種性狀',
  authors: ['Dmitry Knorre', 'Sergey Machin'],
  dependencies: {},
  conflicts: {},
  minPlayers: 2,
  maxPlayers: 4,
  contents: {
    cards: 84,
    traits: 19,
    newMechanics: [],
  },
};

/**
 * 範例擴充包 Manifest（飛行擴充）
 */
export const FLIGHT_MANIFEST_EXAMPLE = {
  id: 'flight',
  name: '飛行擴充',
  nameEn: 'Evolution: Flight',
  version: '1.0.0',
  type: EXPANSION_TYPE.EXPANSION,
  description: '加入飛行相關性狀，支援5-6人遊戲',
  authors: ['Publisher'],
  dependencies: {
    'base': '>=1.0.0',
  },
  conflicts: {},
  minPlayers: 2,
  maxPlayers: 6,
  contents: {
    cards: 42,
    traits: 12,
    newMechanics: ['flying', 'nesting'],
  },
};
```

### 2. 擴充包載入器

```javascript
// shared/expansions/loader.js

import { EXPANSION_STATUS, validateManifest } from './manifest.js';

/**
 * 擴充包載入結果
 */
export class LoadResult {
  constructor(expansionId) {
    this.expansionId = expansionId;
    this.success = false;
    this.status = EXPANSION_STATUS.NOT_LOADED;
    this.manifest = null;
    this.module = null;
    this.error = null;
    this.loadTime = 0;
  }

  static success(expansionId, manifest, module, loadTime) {
    const result = new LoadResult(expansionId);
    result.success = true;
    result.status = EXPANSION_STATUS.LOADED;
    result.manifest = manifest;
    result.module = module;
    result.loadTime = loadTime;
    return result;
  }

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
export class ExpansionLoader {
  constructor() {
    this.loadedExpansions = new Map();
    this.loadingPromises = new Map();
    this.expansionPaths = new Map();
    this.onLoadCallbacks = [];
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
   */
  registerPaths(pathMap) {
    for (const [id, path] of Object.entries(pathMap)) {
      this.registerPath(id, path);
    }
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

    // 檢查是否正在載入
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
   */
  async _loadExpansion(expansionId) {
    const startTime = Date.now();

    try {
      // 取得擴充包路徑
      const path = this.expansionPaths.get(expansionId);
      if (!path) {
        throw new Error(`Expansion path not registered: ${expansionId}`);
      }

      // 動態載入模組
      const module = await this._importModule(path);

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
   */
  async _importModule(path) {
    // 在 Node.js 環境
    if (typeof require !== 'undefined') {
      try {
        // ES Module
        return await import(path);
      } catch {
        // CommonJS fallback
        return require(path);
      }
    }

    // 瀏覽器環境
    return await import(path);
  }

  /**
   * 解析依賴
   */
  async _resolveDependencies(manifest) {
    if (!manifest.dependencies) return;

    for (const [depId, versionRange] of Object.entries(manifest.dependencies)) {
      // 載入依賴擴充包
      const depResult = await this.load(depId);

      if (!depResult.success) {
        throw new Error(`Failed to load dependency: ${depId}`);
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
   */
  _checkVersion(version, range) {
    // 簡化版本檢查，只支援 >=x.y.z 格式
    if (range.startsWith('>=')) {
      const requiredVersion = range.slice(2);
      return this._compareVersions(version, requiredVersion) >= 0;
    }

    // 精確匹配
    return version === range;
  }

  /**
   * 比較版本號
   */
  _compareVersions(a, b) {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (partsA[i] > partsB[i]) return 1;
      if (partsA[i] < partsB[i]) return -1;
    }

    return 0;
  }

  /**
   * 批次載入擴充包
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
   */
  getLoaded(expansionId) {
    return this.loadedExpansions.get(expansionId);
  }

  /**
   * 取得所有已載入的擴充包 ID
   */
  getLoadedIds() {
    return Array.from(this.loadedExpansions.keys());
  }

  /**
   * 檢查是否已載入
   */
  isLoaded(expansionId) {
    return this.loadedExpansions.has(expansionId);
  }

  /**
   * 取得載入狀態
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

  onLoad(callback) {
    this.onLoadCallbacks.push(callback);
    return () => {
      const index = this.onLoadCallbacks.indexOf(callback);
      if (index !== -1) this.onLoadCallbacks.splice(index, 1);
    };
  }

  onError(callback) {
    this.onErrorCallbacks.push(callback);
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index !== -1) this.onErrorCallbacks.splice(index, 1);
    };
  }

  _notifyLoad(result) {
    for (const callback of this.onLoadCallbacks) {
      try {
        callback(result);
      } catch (e) {
        console.error('Load callback error:', e);
      }
    }
  }

  _notifyError(result) {
    for (const callback of this.onErrorCallbacks) {
      try {
        callback(result);
      } catch (e) {
        console.error('Error callback error:', e);
      }
    }
  }
}

// 預設實例
export const expansionLoader = new ExpansionLoader();

// 註冊基礎版路徑
expansionLoader.registerPath('base', './base/index.js');
```

### 3. Registry 更新

```javascript
// shared/expansions/registry.js（更新版）

import { expansionLoader } from './loader.js';
import { EXPANSION_STATUS } from './manifest.js';

/**
 * 擴充包註冊表（更新版）
 * 整合載入器功能
 */
class ExpansionRegistryClass {
  constructor() {
    this.enabledExpansions = new Set(['base']);
    this.traitHandlers = new Map();
    this.cardDefinitions = new Map();
    this.ruleOverrides = [];
  }

  /**
   * 載入並啟用擴充包
   */
  async enableExpansion(expansionId) {
    // 載入擴充包
    const loadResult = await expansionLoader.load(expansionId);

    if (!loadResult.success) {
      throw new Error(`Failed to load expansion: ${loadResult.error}`);
    }

    // 檢查衝突
    const conflicts = this._checkConflicts(expansionId, loadResult.manifest);
    if (conflicts.length > 0) {
      throw new Error(`Expansion conflicts: ${conflicts.join(', ')}`);
    }

    // 註冊擴充包內容
    this._registerExpansionContent(loadResult.module);

    // 標記為啟用
    this.enabledExpansions.add(expansionId);

    return loadResult;
  }

  /**
   * 停用擴充包
   */
  disableExpansion(expansionId) {
    if (expansionId === 'base') {
      throw new Error('Cannot disable base expansion');
    }

    if (!this.enabledExpansions.has(expansionId)) {
      return false;
    }

    // 移除該擴充包的內容
    this._unregisterExpansionContent(expansionId);

    this.enabledExpansions.delete(expansionId);
    return true;
  }

  /**
   * 檢查衝突
   */
  _checkConflicts(expansionId, manifest) {
    const conflicts = [];

    if (manifest.conflicts) {
      for (const [conflictId, reason] of Object.entries(manifest.conflicts)) {
        if (this.enabledExpansions.has(conflictId)) {
          conflicts.push(`${conflictId}: ${reason}`);
        }
      }
    }

    // 反向檢查：已啟用的擴充包是否與新擴充包衝突
    for (const enabledId of this.enabledExpansions) {
      const enabledResult = expansionLoader.getLoaded(enabledId);
      if (enabledResult?.manifest?.conflicts?.[expansionId]) {
        conflicts.push(
          `${enabledId}: ${enabledResult.manifest.conflicts[expansionId]}`
        );
      }
    }

    return conflicts;
  }

  /**
   * 註冊擴充包內容
   */
  _registerExpansionContent(module) {
    // 註冊性狀處理器
    if (module.traitHandlers) {
      for (const [traitType, handler] of Object.entries(module.traitHandlers)) {
        this.traitHandlers.set(traitType, handler);
      }
    }

    // 註冊卡牌定義
    if (module.cards) {
      this.cardDefinitions.set(module.manifest.id, module.cards);
    }

    // 註冊規則覆寫
    if (module.ruleOverrides) {
      this.ruleOverrides.push(...module.ruleOverrides);
    }
  }

  /**
   * 移除擴充包內容
   */
  _unregisterExpansionContent(expansionId) {
    const loadResult = expansionLoader.getLoaded(expansionId);
    if (!loadResult?.module) return;

    const module = loadResult.module;

    // 移除性狀處理器
    if (module.traitHandlers) {
      for (const traitType of Object.keys(module.traitHandlers)) {
        this.traitHandlers.delete(traitType);
      }
    }

    // 移除卡牌定義
    this.cardDefinitions.delete(expansionId);

    // 移除規則覆寫
    if (module.ruleOverrides) {
      this.ruleOverrides = this.ruleOverrides.filter(
        r => r.expansionId !== expansionId
      );
    }
  }

  /**
   * 取得性狀處理器
   */
  getTraitHandler(traitType) {
    return this.traitHandlers.get(traitType);
  }

  /**
   * 取得所有啟用的擴充包 ID
   */
  getEnabledExpansions() {
    return Array.from(this.enabledExpansions);
  }

  /**
   * 建立合併牌庫
   */
  createCombinedDeck() {
    const allCards = [];

    for (const expansionId of this.enabledExpansions) {
      const cards = this.cardDefinitions.get(expansionId);
      if (cards) {
        allCards.push(...cards);
      }
    }

    return allCards;
  }

  /**
   * 取得所有可用性狀
   */
  getAllTraits() {
    const traits = {};

    for (const [traitType, handler] of this.traitHandlers) {
      traits[traitType] = handler.getDefinition?.() || { type: traitType };
    }

    return traits;
  }

  /**
   * 計算玩家數範圍
   */
  getPlayerRange() {
    let minPlayers = 2;
    let maxPlayers = 4;

    for (const expansionId of this.enabledExpansions) {
      const loadResult = expansionLoader.getLoaded(expansionId);
      if (loadResult?.manifest) {
        const { minPlayers: min, maxPlayers: max } = loadResult.manifest;
        if (min !== undefined) minPlayers = Math.max(minPlayers, min);
        if (max !== undefined) maxPlayers = Math.max(maxPlayers, max);
      }
    }

    return { minPlayers, maxPlayers };
  }
}

export const ExpansionRegistry = new ExpansionRegistryClass();
export default ExpansionRegistry;
```

---

## 測試需求

```javascript
// tests/unit/expansions/loader.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpansionLoader, LoadResult } from '@shared/expansions/loader.js';
import { validateManifest, EXPANSION_TYPE } from '@shared/expansions/manifest.js';

describe('validateManifest', () => {
  it('should accept valid manifest', () => {
    const manifest = {
      id: 'test',
      name: '測試',
      version: '1.0.0',
      type: EXPANSION_TYPE.EXPANSION,
    };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing required fields', () => {
    const manifest = { id: 'test' };
    const result = validateManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: name');
    expect(result.errors).toContain('Missing required field: version');
  });

  it('should reject invalid id format', () => {
    const manifest = {
      id: 'Test-Invalid',
      name: 'Test',
      version: '1.0.0',
      type: EXPANSION_TYPE.BASE,
    };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
  });
});

describe('ExpansionLoader', () => {
  let loader;

  beforeEach(() => {
    loader = new ExpansionLoader();
  });

  it('should register paths', () => {
    loader.registerPath('test', './test/index.js');
    expect(loader.expansionPaths.get('test')).toBe('./test/index.js');
  });

  it('should track loading status', async () => {
    loader.registerPath('base', './base/index.js');

    // Mock import
    loader._importModule = vi.fn().mockResolvedValue({
      manifest: {
        id: 'base',
        name: 'Base',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
      },
    });

    const result = await loader.load('base');
    expect(result.success).toBe(true);
    expect(loader.isLoaded('base')).toBe(true);
  });

  it('should not load same expansion twice', async () => {
    loader.registerPath('base', './base/index.js');

    loader._importModule = vi.fn().mockResolvedValue({
      manifest: {
        id: 'base',
        name: 'Base',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
      },
    });

    await loader.load('base');
    await loader.load('base');

    expect(loader._importModule).toHaveBeenCalledTimes(1);
  });

  it('should handle load errors', async () => {
    loader.registerPath('invalid', './invalid/index.js');

    loader._importModule = vi.fn().mockRejectedValue(new Error('Module not found'));

    const result = await loader.load('invalid');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Module not found');
  });
});
```

---

## 驗收標準

1. [ ] Manifest 規範完整定義
2. [ ] `validateManifest` 正確驗證
3. [ ] `ExpansionLoader` 可動態載入模組
4. [ ] 依賴解析正常運作
5. [ ] 版本相容性檢查正常
6. [ ] `ExpansionRegistry` 整合載入器
7. [ ] 衝突檢測正確
8. [ ] 所有單元測試通過

---

## 備註

- 載入機制支援 ES Module 和 CommonJS
- 版本檢查使用簡化的 semver 規則
- 未來擴充包開發者只需遵循 Manifest 規範
