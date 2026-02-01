/**
 * 基礎版擴充包
 * Evolution: The Origin of Species
 *
 * 此模組定義了演化論的基礎版擴充包，包含：
 * - 19 種性狀
 * - 44 張雙面卡（88 面）
 * - 基礎遊戲規則
 *
 * @module expansions/base
 */

const {
  TRAIT_CATEGORIES,
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
  getAllTraitTypes,
  getInteractiveTraits,
  getStackableTraits,
  getTraitsByCategory,
  areTraitsIncompatible,
  getTraitDefinition,
  getTotalCardCount,
} = require('./traits');

const {
  CARD_PAIRS,
  BASE_CARD_POOL,
  BASE_SIMPLE_CARDS,
  generateCardPool,
  generateSimpleCards,
  EXPECTED_CARD_COUNT,
} = require('./cards');

/**
 * 基礎版擴充包定義
 * 符合 ExpansionInterface 介面
 */
const baseExpansion = {
  id: 'base',
  name: '物種起源',
  nameEn: 'Evolution: The Origin of Species',
  version: '1.0.0',
  description: '演化論基礎版，包含 19 種性狀和 44 張雙面卡',

  // 無依賴
  requires: [],
  incompatible: [],

  // 性狀定義（稍後會被 TraitHandler 取代）
  traits: TRAIT_DEFINITIONS,

  // 卡牌池
  cards: BASE_CARD_POOL,

  // 規則
  rules: {
    minPlayers: 2,
    maxPlayers: 4,
    initialHandSize: 6,
    foodFormula: {
      2: { dice: 1, bonus: 2 },
      3: { dice: 2, bonus: 0 },
      4: { dice: 2, bonus: 2 },
    },
    agileEscapeThreshold: 4,
    carnivoreAttackReward: 2,
    tailLossReward: 1,
    scavengerReward: 1,
    scoring: {
      creatureBase: 2,
      traitBase: 1,
      foodBonus1: 1,
      foodBonus2: 2,
    },
  },

  // 生命週期鉤子
  onRegister: (registry) => {
    // console.log('Base expansion registered');
  },

  onEnable: (registry) => {
    // console.log('Base expansion enabled');
  },

  onDisable: (registry) => {
    // console.log('Base expansion disabled');
  },

  onGameInit: (gameState) => {
    // 基礎版無特殊初始化邏輯
  },

  onGameEnd: (gameState) => {
    // 基礎版無特殊結束邏輯
  },
};

module.exports = {
  // 擴充包定義
  baseExpansion,

  // 性狀相關
  TRAIT_CATEGORIES,
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
  getAllTraitTypes,
  getInteractiveTraits,
  getStackableTraits,
  getTraitsByCategory,
  areTraitsIncompatible,
  getTraitDefinition,
  getTotalCardCount,

  // 卡牌相關
  CARD_PAIRS,
  BASE_CARD_POOL,
  BASE_SIMPLE_CARDS,
  generateCardPool,
  generateSimpleCards,
  EXPECTED_CARD_COUNT,
};
