/**
 * 擴充包系統統一匯出點
 *
 * 提供擴充包系統的所有公開 API，包括：
 * - ExpansionRegistry 類別
 * - ExpansionInterface 工具函數
 * - 全域單例 globalRegistry
 *
 * @module expansions
 *
 * @example
 * // 使用全域單例
 * const { globalRegistry } = require('./expansions');
 * globalRegistry.register(myExpansion);
 * globalRegistry.enable('my-expansion');
 *
 * @example
 * // 建立新的註冊表實例
 * const { ExpansionRegistry } = require('./expansions');
 * const customRegistry = new ExpansionRegistry();
 */

const { ExpansionRegistry } = require('./ExpansionRegistry');
const {
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  ID_PATTERN,
  VERSION_PATTERN,
  createExpansionTemplate,
  validateExpansionInterface,
} = require('./ExpansionInterface');

// 工單 0326：新增 Manifest 和 Loader
const {
  MANIFEST_VERSION,
  EXPANSION_TYPE,
  EXPANSION_STATUS,
  validateManifest,
  BASE_MANIFEST,
  FLIGHT_MANIFEST_EXAMPLE,
} = require('./manifest');

const {
  LoadResult,
  ExpansionLoader,
  expansionLoader,
} = require('./loader');

// 工單 0328：新增驗證器和相容性檢查器
const {
  ValidationResult,
  ExpansionValidator,
  expansionValidator,
} = require('./validator');

const {
  CompatibilityResult,
  CompatibilityChecker,
  compatibilityChecker,
} = require('./compatibility');

// 載入 base 擴充包
const { baseExpansion } = require('./base');

// 載入 deep-sea 擴充包
const { deepSeaExpansion } = require('./deepSea');

/**
 * 全域擴充包註冊表單例
 * 用於應用程式範圍內的擴充包管理
 * @type {ExpansionRegistry}
 */
const globalRegistry = new ExpansionRegistry();

// 預先註冊 base 擴充包到 expansionLoader
// 為 baseExpansion 加上 manifest 屬性以符合 loader 規範
const baseModule = {
  ...require('./base'),
  manifest: BASE_MANIFEST,
};
expansionLoader.registerModule('base', baseModule);

module.exports = {
  // 核心類別
  ExpansionRegistry,

  // 介面工具
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  ID_PATTERN,
  VERSION_PATTERN,
  createExpansionTemplate,
  validateExpansionInterface,

  // Manifest 規範（工單 0326）
  MANIFEST_VERSION,
  EXPANSION_TYPE,
  EXPANSION_STATUS,
  validateManifest,
  BASE_MANIFEST,
  FLIGHT_MANIFEST_EXAMPLE,

  // 載入器（工單 0326）
  LoadResult,
  ExpansionLoader,
  expansionLoader,

  // 驗證器（工單 0328）
  ValidationResult,
  ExpansionValidator,
  expansionValidator,

  // 相容性檢查器（工單 0328）
  CompatibilityResult,
  CompatibilityChecker,
  compatibilityChecker,

  // 全域單例
  globalRegistry,

  // 擴充包
  baseExpansion,
  deepSeaExpansion,
};
