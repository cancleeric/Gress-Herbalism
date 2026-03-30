/**
 * 深海生態擴充包性狀定義
 * Deep Sea Ecology Expansion
 *
 * 此模組定義了深海生態擴充包的 6 種新性狀。
 *
 * @module expansions/deepSea/traits/definitions
 */

// ========== 性狀類別（繼承自基礎版）==========

const DEEP_SEA_TRAIT_CATEGORIES = {
  CARNIVORE: 'carnivore',
  DEFENSE: 'defense',
  FEEDING: 'feeding',
  INTERACTIVE: 'interactive',
  SPECIAL: 'special',
};

// ========== 性狀類型常數 ==========

/**
 * 深海生態性狀類型定義（共 6 種）
 * @readonly
 * @enum {string}
 */
const DEEP_SEA_TRAIT_TYPES = {
  /** 深潛 - 只有水生肉食生物才能攻擊此生物 */
  DEEP_DIVE: 'deepDive',
  /** 發光 - 每階段一次，可消除目標的偽裝或穴居防禦效果 */
  BIOLUMINESCENCE: 'bioluminescence',
  /** 群游 - 互動性狀：連結兩隻生物，任一獲得紅色食物時另一獲得1藍色食物 */
  SCHOOLING: 'schooling',
  /** 巨口 - 可攻擊巨化生物（無需攻擊者擁有巨化性狀） */
  GAPING_MAW: 'gapingMaw',
  /** 電感知 - 可攻擊已吃飽的穴居生物 */
  ELECTRORECEPTION: 'electroreception',
  /** 深淵適應 - 每局一次，可在滅絕階段食物不足時存活 */
  ABYSSAL_ADAPTATION: 'abyssalAdaptation',
};

// ========== 詳細性狀定義 ==========

/**
 * 深海生態性狀詳細定義
 * @type {Object<string, import('../../base/traits/definitions').TraitDefinition>}
 */
const DEEP_SEA_TRAIT_DEFINITIONS = {
  [DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]: {
    type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE,
    name: '深潛',
    nameEn: 'Deep Dive',
    foodBonus: 0,
    description: '此生物潛入深海，只有擁有水生性狀的肉食生物才能攻擊牠',
    category: DEEP_SEA_TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'deepDive.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]: {
    type: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE,
    name: '發光',
    nameEn: 'Bioluminescence',
    foodBonus: 0,
    description: '每進食階段一次，可照亮目標生物，使其偽裝或穴居防禦效果在本階段失效',
    category: DEEP_SEA_TRAIT_CATEGORIES.SPECIAL,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'bioluminescence.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.SCHOOLING]: {
    type: DEEP_SEA_TRAIT_TYPES.SCHOOLING,
    name: '群游',
    nameEn: 'Schooling',
    foodBonus: 0,
    description: '連結兩隻自己的生物。當其中一隻從食物池獲得紅色食物時，另一隻獲得1個藍色食物作為群游獎勵（不從食物池扣除）',
    category: DEEP_SEA_TRAIT_CATEGORIES.INTERACTIVE,
    incompatible: [],
    isInteractive: true,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'schooling.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.GAPING_MAW]: {
    type: DEEP_SEA_TRAIT_TYPES.GAPING_MAW,
    name: '巨口',
    nameEn: 'Gaping Maw',
    foodBonus: 0,
    description: '此肉食生物的大口可攻擊巨化生物，無需自身擁有巨化性狀',
    category: DEEP_SEA_TRAIT_CATEGORIES.CARNIVORE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'gapingMaw.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]: {
    type: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION,
    name: '電感知',
    nameEn: 'Electroreception',
    foodBonus: 0,
    description: '此肉食生物能感知生物電場，可攻擊穴居生物，即使其已吃飽亦然',
    category: DEEP_SEA_TRAIT_CATEGORIES.SPECIAL,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'electroreception.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION]: {
    type: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION,
    name: '深淵適應',
    nameEn: 'Abyssal Adaptation',
    foodBonus: 0,
    description: '每局一次，此生物可在食物不足的滅絕階段存活，並消耗此能力標記',
    category: DEEP_SEA_TRAIT_CATEGORIES.FEEDING,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'abyssalAdaptation.svg',
    cardCount: 4,
  },
};

// ========== 輔助函數 ==========

/**
 * 取得所有深海性狀類型
 * @returns {string[]}
 */
function getAllDeepSeaTraitTypes() {
  return Object.values(DEEP_SEA_TRAIT_TYPES);
}

/**
 * 取得深海互動性狀列表
 * @returns {string[]}
 */
function getDeepSeaInteractiveTraits() {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS)
    .filter(def => def.isInteractive)
    .map(def => def.type);
}

/**
 * 取得深海可疊加性狀列表
 * @returns {string[]}
 */
function getDeepSeaStackableTraits() {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS)
    .filter(def => def.isStackable)
    .map(def => def.type);
}

/**
 * 依類別取得深海性狀
 * @param {string} category - 類別
 * @returns {string[]}
 */
function getDeepSeaTraitsByCategory(category) {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS)
    .filter(def => def.category === category)
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
 * 計算深海性狀總卡牌數
 * @returns {number}
 */
function getDeepSeaTotalCardCount() {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS).reduce(
    (sum, def) => sum + (def.cardCount || 0),
    0
  );
}

module.exports = {
  DEEP_SEA_TRAIT_CATEGORIES,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitsByCategory,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,
};
