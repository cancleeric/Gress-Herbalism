/**
 * 深海生態擴充包性狀定義
 * Deep Sea Ecology Expansion
 *
 * 此模組定義了深海生態擴充包的 6 種性狀。
 *
 * @module expansions/deep-sea/traits/definitions
 */

// 從基礎版匯入類別常數，保持一致性
const { TRAIT_CATEGORIES } = require('../../base/traits/definitions');

// ========== 深海性狀類型常數 ==========

/**
 * 深海擴充包性狀類型定義（共 6 種）
 * @readonly
 * @enum {string}
 */
const DEEP_SEA_TRAIT_TYPES = {
  /** 深潛 - 只有擁有電感的肉食才能攻擊 */
  DEEP_DIVE: 'deepDive',
  /** 發光 - 進食階段可額外從食物池取得 1 個食物 */
  BIOLUMINESCENCE: 'bioluminescence',
  /** 群游 - 你控制 2 隻以上群游生物時，被攻擊擲骰 4-6 逃脫 */
  SCHOOLING: 'schooling',
  /** 巨口 - 攻擊成功獲得 3 個藍色食物（需有肉食） */
  GIANT_MAW: 'giantMaw',
  /** 電感 - 可攻擊有深潛的生物 */
  ELECTRORECEPTION: 'electroreception',
  /** 墨汁 - 每回合一次，被攻擊時可取消攻擊（不需棄牌） */
  INK_CLOUD: 'inkCloud',
};

// ========== 深海性狀詳細定義 ==========

/**
 * 深海擴充包性狀詳細定義
 * @type {Object<string, import('../../base/traits/definitions').TraitDefinition>}
 */
const DEEP_SEA_TRAIT_DEFINITIONS = {
  // ==================== 防禦相關 ====================

  [DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]: {
    type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE,
    name: '深潛',
    nameEn: 'Deep Dive',
    foodBonus: 0,
    description: '此生物潛入深海。肉食生物必須擁有電感性狀才能攻擊此生物',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'deep-dive.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.SCHOOLING]: {
    type: DEEP_SEA_TRAIT_TYPES.SCHOOLING,
    name: '群游',
    nameEn: 'Schooling',
    foodBonus: 0,
    description: '若你控制 2 隻以上擁有群游的生物，被攻擊時擲骰，4-6 逃脫成功',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'schooling.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.INK_CLOUD]: {
    type: DEEP_SEA_TRAIT_TYPES.INK_CLOUD,
    name: '墨汁',
    nameEn: 'Ink Cloud',
    foodBonus: 0,
    description: '每回合一次，被攻擊時可噴出墨汁取消攻擊。不需棄置性狀，但每回合只能使用一次',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'ink-cloud.svg',
    cardCount: 4,
  },

  // ==================== 進食相關 ====================

  [DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]: {
    type: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE,
    name: '發光',
    nameEn: 'Bioluminescence',
    foodBonus: 0,
    description: '進食階段輪到自己時，可額外從食物池取得 1 個食物（食物池有食物時）',
    category: TRAIT_CATEGORIES.FEEDING,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'bioluminescence.svg',
    cardCount: 4,
  },

  // ==================== 肉食相關 ====================

  [DEEP_SEA_TRAIT_TYPES.GIANT_MAW]: {
    type: DEEP_SEA_TRAIT_TYPES.GIANT_MAW,
    name: '巨口',
    nameEn: 'Giant Maw',
    foodBonus: 0,
    description: '此生物攻擊成功時，獲得 3 個藍色食物（而非標準的 2 個）。只能放在有肉食性狀的生物上',
    category: TRAIT_CATEGORIES.CARNIVORE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'giant-maw.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]: {
    type: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION,
    name: '電感',
    nameEn: 'Electroreception',
    foodBonus: 0,
    description: '此生物可攻擊擁有深潛性狀的生物（如同銳目之於偽裝）',
    category: TRAIT_CATEGORIES.CARNIVORE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'electroreception.svg',
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
 * 取得深海性狀定義
 * @param {string} traitType - 性狀類型
 * @returns {Object|null}
 */
function getDeepSeaTraitDefinition(traitType) {
  return DEEP_SEA_TRAIT_DEFINITIONS[traitType] || null;
}

/**
 * 計算深海擴充包總卡牌數
 * @returns {number}
 */
function getTotalCardCount() {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS)
    .reduce((sum, def) => sum + def.cardCount, 0);
}

module.exports = {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getTotalCardCount,
};
