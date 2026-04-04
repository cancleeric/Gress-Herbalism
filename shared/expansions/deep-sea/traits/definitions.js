/**
 * 深海生態擴充包性狀定義
 * Deep Sea Ecology Expansion
 *
 * 新增 6 種深海生態性狀。
 *
 * @module expansions/deep-sea/traits/definitions
 */

// ========== 性狀類別 ==========

const { TRAIT_CATEGORIES } = require('../../base/traits/definitions');

// ========== 性狀類型常數 ==========

/**
 * 深海生態擴充包性狀類型（共 6 種）
 * @readonly
 * @enum {string}
 */
const DEEP_SEA_TRAIT_TYPES = {
  // 防禦相關 (2)
  /** 深潛 - 只有水生肉食才能攻擊此生物 */
  DEEP_DIVE: 'deepDive',
  /** 電擊 - 被攻擊後倖存時，攻擊者失去 1 個藍色食物 */
  ELECTRIC: 'electric',

  // 特殊 (1)
  /** 發光 - 進食時，自己控制的另一隻生物獲得 1 個藍色食物 */
  BIOLUMINESCENCE: 'bioluminescence',

  // 互動相關 (1)
  /** 群游 - 連結兩隻生物；其中一隻獲得食物時，另一隻獲得 1 個藍色食物 */
  SCHOOLING: 'schooling',

  // 肉食相關 (1)
  /** 巨口 - 不能從食物池進食，攻擊成功獲得 3 個藍色食物（代替普通肉食的 2 個）。與肉食互斥 */
  MEGAMOUTH: 'megamouth',

  // 進食相關 (1)
  /** 深淵適應 - 此生物的食量需求減少 1（最低 1）。可疊加 */
  ABYSSAL_ADAPTATION: 'abyssalAdaptation',
};

// ========== 詳細性狀定義 ==========

/**
 * 所有深海性狀的詳細定義
 * @type {Object<string, Object>}
 */
const DEEP_SEA_TRAIT_DEFINITIONS = {
  // ==================== 防禦相關 ====================

  [DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]: {
    type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE,
    name: '深潛',
    nameEn: 'Deep Dive',
    foodBonus: 0,
    description: '只有擁有水生性狀的肉食生物才能攻擊此生物',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'deep-dive.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.ELECTRIC]: {
    type: DEEP_SEA_TRAIT_TYPES.ELECTRIC,
    name: '電擊',
    nameEn: 'Electric',
    foodBonus: 0,
    description: '被肉食攻擊時，攻擊者失去 1 個藍色食物（攻擊仍然進行）',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'electric.svg',
    cardCount: 4,
  },

  // ==================== 特殊能力 ====================

  [DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]: {
    type: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE,
    name: '發光',
    nameEn: 'Bioluminescence',
    foodBonus: 0,
    description: '當此生物進食時，自己控制的另一隻生物（若有）從食物池獲得 1 個藍色食物',
    category: TRAIT_CATEGORIES.SPECIAL,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'bioluminescence.svg',
    cardCount: 4,
  },

  // ==================== 互動相關 ====================

  [DEEP_SEA_TRAIT_TYPES.SCHOOLING]: {
    type: DEEP_SEA_TRAIT_TYPES.SCHOOLING,
    name: '群游',
    nameEn: 'Schooling',
    foodBonus: 0,
    description: '連結兩隻生物；其中一隻獲得任意食物時，另一隻從食物池獲得 1 個藍色食物',
    category: TRAIT_CATEGORIES.INTERACTIVE,
    incompatible: [],
    isInteractive: true,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'schooling.svg',
    cardCount: 4,
  },

  // ==================== 肉食相關 ====================

  [DEEP_SEA_TRAIT_TYPES.MEGAMOUTH]: {
    type: DEEP_SEA_TRAIT_TYPES.MEGAMOUTH,
    name: '巨口',
    nameEn: 'Megamouth',
    foodBonus: 1,
    description: '不能從食物池進食，必須攻擊其他生物。攻擊成功獲得 3 個藍色食物。與肉食互斥',
    category: TRAIT_CATEGORIES.CARNIVORE,
    incompatible: ['carnivore'],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'megamouth.svg',
    cardCount: 4,
  },

  // ==================== 進食相關 ====================

  [DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION]: {
    type: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION,
    name: '深淵適應',
    nameEn: 'Abyssal Adaptation',
    foodBonus: -1,
    description: '此生物的食量需求減少 1（最低 1）。可疊加，每張減少 1 點食量需求',
    category: TRAIT_CATEGORIES.FEEDING,
    incompatible: [],
    isInteractive: false,
    isStackable: true,
    expansion: 'deep-sea',
    icon: 'abyssal-adaptation.svg',
    cardCount: 4,
  },
};

// ========== 工具函數 ==========

/**
 * 取得所有深海性狀類型陣列
 * @returns {string[]}
 */
function getAllDeepSeaTraitTypes() {
  return Object.values(DEEP_SEA_TRAIT_TYPES);
}

/**
 * 取得深海互動性狀
 * @returns {string[]}
 */
function getDeepSeaInteractiveTraits() {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS)
    .filter(def => def.isInteractive)
    .map(def => def.type);
}

/**
 * 取得深海可疊加性狀
 * @returns {string[]}
 */
function getDeepSeaStackableTraits() {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS)
    .filter(def => def.isStackable)
    .map(def => def.type);
}

/**
 * 取得深海性狀定義
 * @param {string} traitType - 性狀類型
 * @returns {Object|null}
 */
function getDeepSeaTraitDefinition(traitType) {
  return DEEP_SEA_TRAIT_DEFINITIONS[traitType] || null;
}

/**
 * 計算深海擴充包卡牌總數
 * @returns {number}
 */
function getTotalDeepSeaCardCount() {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS)
    .reduce((sum, def) => sum + def.cardCount, 0);
}

module.exports = {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitDefinition,
  getTotalDeepSeaCardCount,
};
