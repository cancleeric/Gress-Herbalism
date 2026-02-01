/**
 * 基礎版擴充包
 * Evolution: The Origin of Species
 *
 * 此模組定義了演化論的基礎版擴充包，包含：
 * - 19 種性狀
 * - 84 張雙面卡
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
  getTotalCardCount: getTraitTotalCardCount,
} = require('./traits');

const {
  BASE_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
  Card,
  CardFactory,
  cardFactory,
} = require('./cards');

const { registerBaseRules } = require('./rules');

// 向後相容：保留舊的 cards.js 匯出
const {
  CARD_PAIRS,
  BASE_CARD_POOL,
  BASE_SIMPLE_CARDS,
  generateCardPool,
  generateSimpleCards,
  EXPECTED_CARD_COUNT,
} = require('./cards.js');

/**
 * 基礎版擴充包定義
 * 符合 ExpansionInterface 介面
 */
const baseExpansion = {
  id: 'base',
  name: '物種起源',
  nameEn: 'Evolution: The Origin of Species',
  version: '1.0.0',
  description: '演化論基礎版，包含 19 種性狀和 84 張雙面卡',

  // 無依賴
  requires: [],
  incompatible: [],

  // 性狀定義
  traits: TRAIT_DEFINITIONS,

  // 新版卡牌（84 張）
  cards: BASE_CARDS,

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

  /**
   * 建立此擴充包的牌庫
   * @returns {Card[]}
   */
  createDeck() {
    return cardFactory.createDeck(BASE_CARDS, this.id);
  },

  /**
   * 建立並洗好的牌庫
   * @returns {Card[]}
   */
  createShuffledDeck() {
    return cardFactory.createShuffledDeck(BASE_CARDS, this.id);
  },

  /**
   * 註冊規則到引擎
   * @param {RuleEngine} engine - 規則引擎
   */
  registerRules(engine) {
    registerBaseRules(engine);
  },

  /**
   * 驗證擴充包完整性
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    // 驗證卡牌定義
    const cardValidation = validateCardDefinitions();
    if (!cardValidation.valid) {
      errors.push(...cardValidation.errors);
    }

    // 檢查卡牌總數
    const totalCards = getTotalCardCount();
    if (totalCards !== 84) {
      errors.push(`Expected 84 cards, got ${totalCards}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
  getTraitTotalCardCount,

  // 新版卡牌模組
  BASE_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
  Card,
  CardFactory,
  cardFactory,

  // 向後相容：舊版卡牌
  CARD_PAIRS,
  BASE_CARD_POOL,
  BASE_SIMPLE_CARDS,
  generateCardPool,
  generateSimpleCards,
  EXPECTED_CARD_COUNT,

  // 規則
  registerBaseRules,
};
