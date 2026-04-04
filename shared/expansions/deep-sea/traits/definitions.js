/**
 * 深海生態擴充包性狀定義
 *
 * 此模組定義了「深海生態」擴充包的 6 種新性狀。
 *
 * @module expansions/deep-sea/traits/definitions
 */

const { TRAIT_CATEGORIES } = require('../../base/traits/definitions');

// ========== 深海性狀類型常數 ==========

/**
 * 深海擴充包性狀類型定義（6 種）
 * @readonly
 * @enum {string}
 */
const DEEP_SEA_TRAIT_TYPES = {
  // ===== 防禦相關 =====
  /** 深潛 - 潛入深海，每回合一次可躲避攻擊，下回合開始時浮出 */
  DEEP_DIVE: 'deepDive',
  /** 壓抗 - 深海壓力適應，對巨化肉食免疫（無法被巨化肉食攻擊） */
  PRESSURE_RESISTANCE: 'pressureResistance',

  // ===== 進食相關 =====
  /** 發光 - 可引誘其他生物，每回合一次從食物池額外取得 1 個紅色食物 */
  BIOLUMINESCENCE: 'bioluminescence',
  /** 群游 - 連結兩隻生物，每當其中一隻進食時另一隻免疫下一次攻擊（至回合結束） */
  SCHOOLING: 'schooling',

  // ===== 肉食相關 =====
  /** 巨口 - 食量+1，攻擊時忽略目標的斷尾防禦效果 */
  GULPER: 'gulper',

  // ===== 特殊 =====
  /** 電感 - 每回合開始時，可選擇一隻生物使其本回合無法進食（包括自己，需謹慎使用）*/
  ELECTRORECEPTION: 'electroreception',
};

// ========== 深海性狀詳細定義 ==========

/**
 * 深海擴充包性狀詳細定義
 * @type {Object<string, import('../../base/traits/definitions').TraitDefinition>}
 */
const DEEP_SEA_TRAIT_DEFINITIONS = {
  [DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]: {
    type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE,
    name: '深潛',
    nameEn: 'Deep Dive',
    foodBonus: 0,
    description: '每回合可使用一次。使用後此生物本回合無法被攻擊，下回合開始時自動解除',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'deep-dive.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.PRESSURE_RESISTANCE]: {
    type: DEEP_SEA_TRAIT_TYPES.PRESSURE_RESISTANCE,
    name: '壓抗',
    nameEn: 'Pressure Resistance',
    foodBonus: 0,
    description: '此生物對巨化肉食免疫，巨化肉食無法攻擊此生物',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'pressure-resistance.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]: {
    type: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE,
    name: '發光',
    nameEn: 'Bioluminescence',
    foodBonus: 0,
    description: '每回合可使用一次，從中央食物池額外取得 1 個紅色食物',
    category: TRAIT_CATEGORIES.FEEDING,
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
    description: '連結兩隻生物，每當其中一隻獲得食物時，另一隻本回合獲得一次免疫攻擊保護',
    category: TRAIT_CATEGORIES.INTERACTIVE,
    incompatible: [],
    isInteractive: true,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'schooling.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.GULPER]: {
    type: DEEP_SEA_TRAIT_TYPES.GULPER,
    name: '巨口',
    nameEn: 'Gulper',
    foodBonus: 1,
    description: '食量+1。攻擊時忽略目標的斷尾防禦效果，目標無法使用斷尾取消此次攻擊',
    category: TRAIT_CATEGORIES.CARNIVORE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deep-sea',
    icon: 'gulper.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]: {
    type: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION,
    name: '電感',
    nameEn: 'Electroreception',
    foodBonus: 0,
    description: '每回合開始時可使用一次，指定任意一隻生物（包含自己），使其本回合無法從食物池進食',
    category: TRAIT_CATEGORIES.SPECIAL,
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
 * 取得所有深海性狀類型
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
 * 計算深海擴充包卡牌總數
 * @returns {number}
 */
function getDeepSeaTotalCardCount() {
  return Object.values(DEEP_SEA_TRAIT_DEFINITIONS)
    .reduce((sum, def) => sum + def.cardCount, 0);
}

module.exports = {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,
};
