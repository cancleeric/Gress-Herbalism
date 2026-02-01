/**
 * 擴充包 Manifest 規範
 *
 * 定義擴充包的元資料格式與驗證規則
 *
 * @module expansions/manifest
 */

/**
 * Manifest 版本
 */
const MANIFEST_VERSION = '1.0.0';

/**
 * 擴充包類型
 */
const EXPANSION_TYPE = {
  BASE: 'base',           // 基礎版
  EXPANSION: 'expansion', // 擴充包
  PROMO: 'promo',         // 促銷卡
  FAN_MADE: 'fan_made',   // 玩家自製
};

/**
 * 擴充包狀態
 */
const EXPANSION_STATUS = {
  NOT_LOADED: 'not_loaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  ERROR: 'error',
};

/**
 * 驗證 Manifest
 * @param {Object} manifest
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateManifest(manifest) {
  const errors = [];

  if (!manifest) {
    return { valid: false, errors: ['Manifest is null or undefined'] };
  }

  // 必要欄位
  const required = ['id', 'name', 'version', 'type'];
  for (const field of required) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // ID 格式驗證（小寫字母開頭，只能包含小寫字母、數字、底線、連字號）
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

  // 依賴格式驗證
  if (manifest.dependencies && typeof manifest.dependencies !== 'object') {
    errors.push('dependencies must be an object');
  }

  // 衝突格式驗證
  if (manifest.conflicts && typeof manifest.conflicts !== 'object') {
    errors.push('conflicts must be an object');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 建立基礎版 Manifest
 */
const BASE_MANIFEST = {
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
const FLIGHT_MANIFEST_EXAMPLE = {
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

module.exports = {
  MANIFEST_VERSION,
  EXPANSION_TYPE,
  EXPANSION_STATUS,
  validateManifest,
  BASE_MANIFEST,
  FLIGHT_MANIFEST_EXAMPLE,
};
