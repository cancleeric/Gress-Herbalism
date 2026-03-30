/**
 * 演化論遊戲常數（前端版）
 *
 * 重新匯出演化論相關常數，供前端 AI 和本地控制器使用。
 * 與後端 shared/constants/evolution.js 保持同步。
 *
 * @module shared/evolutionConstants
 */

// ==================== 遊戲基本常數 ====================

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const INITIAL_HAND_SIZE = 6;
export const CARDS_PER_ROUND = 1;

// ==================== 遊戲階段 ====================

export const GAME_PHASES = {
  WAITING: 'waiting',
  EVOLUTION: 'evolution',
  FOOD_SUPPLY: 'foodSupply',
  FEEDING: 'feeding',
  EXTINCTION: 'extinction',
  GAME_END: 'gameEnd'
};

// ==================== 食物數量計算公式 ====================

export const FOOD_FORMULA = {
  2: { dice: 1, bonus: 2 },
  3: { dice: 2, bonus: 0 },
  4: { dice: 2, bonus: 2 }
};

// ==================== 性狀類型 ====================

export const TRAIT_TYPES = {
  // 肉食相關 (3)
  CARNIVORE: 'carnivore',
  SCAVENGER: 'scavenger',
  SHARP_VISION: 'sharpVision',

  // 防禦相關 (8)
  CAMOUFLAGE: 'camouflage',
  BURROWING: 'burrowing',
  POISONOUS: 'poisonous',
  AQUATIC: 'aquatic',
  AGILE: 'agile',
  MASSIVE: 'massive',
  TAIL_LOSS: 'tailLoss',
  MIMICRY: 'mimicry',

  // 進食相關 (4)
  FAT_TISSUE: 'fatTissue',
  HIBERNATION: 'hibernation',
  PARASITE: 'parasite',
  ROBBERY: 'robbery',

  // 互動相關 (3)
  COMMUNICATION: 'communication',
  COOPERATION: 'cooperation',
  SYMBIOSIS: 'symbiosis',

  // 特殊能力 (1)
  TRAMPLING: 'trampling'
};

export const ALL_TRAIT_TYPES = Object.values(TRAIT_TYPES);

// ==================== 互動性狀 ====================

export const INTERACTIVE_TRAITS = [
  TRAIT_TYPES.COMMUNICATION,
  TRAIT_TYPES.COOPERATION,
  TRAIT_TYPES.SYMBIOSIS
];

// ==================== 性狀互斥規則 ====================

export const TRAIT_INCOMPATIBILITIES = {
  [TRAIT_TYPES.CARNIVORE]: [TRAIT_TYPES.SCAVENGER],
  [TRAIT_TYPES.SCAVENGER]: [TRAIT_TYPES.CARNIVORE]
};

// ==================== 可疊加性狀 ====================

export const STACKABLE_TRAITS = [
  TRAIT_TYPES.FAT_TISSUE
];

// ==================== 性狀詳細定義 ====================

export const TRAIT_DEFINITIONS = {
  [TRAIT_TYPES.CARNIVORE]: { name: '肉食', foodBonus: 1, cardCount: 4 },
  [TRAIT_TYPES.SCAVENGER]: { name: '腐食', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.SHARP_VISION]: { name: '銳目', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.CAMOUFLAGE]: { name: '偽裝', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.BURROWING]: { name: '穴居', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.POISONOUS]: { name: '毒液', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.AQUATIC]: { name: '水生', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.AGILE]: { name: '敏捷', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.MASSIVE]: { name: '巨化', foodBonus: 1, cardCount: 4 },
  [TRAIT_TYPES.TAIL_LOSS]: { name: '斷尾', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.MIMICRY]: { name: '擬態', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.FAT_TISSUE]: { name: '脂肪組織', foodBonus: 1, cardCount: 4 },
  [TRAIT_TYPES.HIBERNATION]: { name: '冬眠', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.PARASITE]: { name: '寄生蟲', foodBonus: 2, cardCount: 4 },
  [TRAIT_TYPES.ROBBERY]: { name: '掠奪', foodBonus: 0, cardCount: 4 },
  [TRAIT_TYPES.COMMUNICATION]: { name: '溝通', foodBonus: 0, cardCount: 4, isInteractive: true },
  [TRAIT_TYPES.COOPERATION]: { name: '合作', foodBonus: 0, cardCount: 4, isInteractive: true },
  [TRAIT_TYPES.SYMBIOSIS]: { name: '共生', foodBonus: 0, cardCount: 4, isInteractive: true },
  [TRAIT_TYPES.TRAMPLING]: { name: '踐踏', foodBonus: 0, cardCount: 4 }
};

// ==================== 工具函數 ====================

export function isInteractiveTrait(traitType) {
  return INTERACTIVE_TRAITS.includes(traitType);
}

export function isStackableTrait(traitType) {
  return STACKABLE_TRAITS.includes(traitType);
}

export function areTraitsIncompatible(traitA, traitB) {
  return TRAIT_INCOMPATIBILITIES[traitA]?.includes(traitB) || false;
}

export function getTraitName(traitType) {
  return TRAIT_DEFINITIONS[traitType]?.name || traitType;
}

export function getTraitInfo(traitType) {
  return TRAIT_DEFINITIONS[traitType] || null;
}

// ==================== 計分常數 ====================

export const SCORE_PER_CREATURE = 2;
export const SCORE_PER_TRAIT = 1;
