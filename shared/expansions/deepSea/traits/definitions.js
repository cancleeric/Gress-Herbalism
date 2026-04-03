/**
 * 深海生態擴充包 - 性狀定義
 * Deep Sea Ecology Expansion - Trait Definitions
 *
 * 新增 6 種深海性狀
 *
 * @module expansions/deepSea/traits/definitions
 */

// ========== 深海性狀類型常數 ==========

/**
 * 深海性狀類型定義（共 6 種）
 * @readonly
 * @enum {string}
 */
const DEEP_SEA_TRAIT_TYPES = {
  // ===== 防禦相關 (3) =====
  /** 深潛 - 攻擊者必須同時擁有水生和肉食才能攻擊此生物 */
  DEEP_DIVE: 'deepDive',
  /** 群游 - 玩家擁有 3 隻以上生物時，此生物無法被攻擊 */
  SCHOOLING: 'schooling',
  /** 噴墨 - 每回合一次，被攻擊時可標記攻擊者使其本回合無法再發動攻擊 */
  INK_SQUIRT: 'inkSquirt',

  // ===== 互動相關 (1) =====
  /** 發光 - 連結兩隻生物，任何一隻進食時另一隻獲得 1 個藍色食物 */
  BIOLUMINESCENCE: 'bioluminescence',

  // ===== 肉食相關 (1) =====
  /** 電感 - 擁有肉食的生物可突破穴居防禦攻擊已吃飽的穴居生物 */
  ELECTRORECEPTION: 'electroreception',

  // ===== 進食相關 (1) =====
  /** 巨口 - 食量 +1，進食階段可額外從食物池取得 1 個藍色食物 */
  GULPER: 'gulper',
};

// ========== 詳細性狀定義 ==========

/**
 * 深海性狀詳細定義
 * @type {Object<string, TraitDefinition>}
 */
const DEEP_SEA_TRAIT_DEFINITIONS = {
  // ==================== 防禦相關 ====================

  [DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]: {
    type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE,
    name: '深潛',
    nameEn: 'Deep Dive',
    foodBonus: 0,
    description: '攻擊者必須同時擁有水生和肉食才能攻擊此生物',
    category: 'defense',
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deepSea',
    icon: 'deep-dive.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.SCHOOLING]: {
    type: DEEP_SEA_TRAIT_TYPES.SCHOOLING,
    name: '群游',
    nameEn: 'Schooling',
    foodBonus: 0,
    description: '當擁有此性狀的玩家有 3 隻以上生物時，此生物無法被攻擊',
    category: 'defense',
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deepSea',
    icon: 'schooling.svg',
    cardCount: 4,
  },

  [DEEP_SEA_TRAIT_TYPES.INK_SQUIRT]: {
    type: DEEP_SEA_TRAIT_TYPES.INK_SQUIRT,
    name: '噴墨',
    nameEn: 'Ink Squirt',
    foodBonus: 0,
    description: '每回合一次，被攻擊時可標記攻擊者，使其本回合無法再發動攻擊',
    category: 'defense',
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deepSea',
    icon: 'ink-squirt.svg',
    cardCount: 4,
  },

  // ==================== 互動相關 ====================

  [DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]: {
    type: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE,
    name: '發光',
    nameEn: 'Bioluminescence',
    foodBonus: 0,
    description: '連結兩隻生物，任何一隻進食時，另一隻從食物池獲得 1 個藍色食物',
    category: 'interactive',
    incompatible: [],
    isInteractive: true,
    isStackable: false,
    expansion: 'deepSea',
    icon: 'bioluminescence.svg',
    cardCount: 4,
  },

  // ==================== 肉食相關 ====================

  [DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]: {
    type: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION,
    name: '電感',
    nameEn: 'Electroreception',
    foodBonus: 0,
    description: '擁有肉食的生物可突破穴居防禦，攻擊已吃飽的穴居生物',
    category: 'carnivore',
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deepSea',
    icon: 'electroreception.svg',
    cardCount: 4,
  },

  // ==================== 進食相關 ====================

  [DEEP_SEA_TRAIT_TYPES.GULPER]: {
    type: DEEP_SEA_TRAIT_TYPES.GULPER,
    name: '巨口',
    nameEn: 'Gulper',
    foodBonus: 1,
    description: '食量 +1，進食階段可額外從食物池取得 1 個藍色食物（每回合一次）',
    category: 'feeding',
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'deepSea',
    icon: 'gulper.svg',
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
 * @returns {TraitDefinition|null}
 */
function getDeepSeaTraitDefinition(traitType) {
  return DEEP_SEA_TRAIT_DEFINITIONS[traitType] || null;
}

/**
 * 計算深海擴充包總卡牌數
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
