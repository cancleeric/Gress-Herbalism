/**
 * 深海生態擴充包
 * Deep Sea Ecology Expansion
 *
 * 此模組定義了演化論的深海生態擴充包，包含：
 * - 6 種深海性狀（深潛、群游、噴墨、發光、電感、巨口）
 * - 28 張雙面卡
 * - 深海環境特殊規則
 *
 * 使用說明：
 *   const { deepSeaExpansion } = require('shared/expansions/deepSea');
 *   registry.register(deepSeaExpansion);
 *   registry.enable('base');
 *   registry.enable('deepSea');
 *
 * @module expansions/deepSea
 */

const {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,
  createAllDeepSeaHandlerInstances,
} = require('./traits');

const {
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getDeepSeaCardCount,
  getDeepSeaCardDefinition,
  getDeepSeaCardsByTrait,
  validateDeepSeaCardDefinitions,
} = require('./cards');

const { DEEP_SEA_RULES, registerDeepSeaRules } = require('./rules');

/**
 * 深海生態擴充包定義
 * 符合 ExpansionInterface 介面
 */
const deepSeaExpansion = {
  id: 'deepSea',
  name: '深海生態',
  nameEn: 'Deep Sea Ecology',
  version: '1.0.0',
  description: '深海生態擴充包，新增 6 種深海性狀和 28 張雙面卡',

  // 依賴基礎版
  requires: ['base'],
  incompatible: [],

  // 性狀處理器實例
  traits: createAllDeepSeaHandlerInstances(),

  // 性狀定義（供其他模組參考）
  traitDefinitions: DEEP_SEA_TRAIT_DEFINITIONS,

  // 卡牌定義（28 張）
  cards: DEEP_SEA_CARDS,

  // 規則
  rules: {
    ...DEEP_SEA_RULES,
  },

  /**
   * 建立此擴充包的牌庫
   * @returns {Object[]}
   */
  createDeck() {
    const deck = [];
    for (const card of DEEP_SEA_CARDS) {
      for (let i = 0; i < card.count; i++) {
        deck.push({
          id: card.id,
          instanceId: `deepSea_${card.id}_${i}`,
          frontTrait: card.frontTrait,
          backTrait: card.backTrait,
          expansion: 'deepSea',
        });
      }
    }
    return deck;
  },

  /**
   * 建立並洗好的牌庫
   * @returns {Object[]}
   */
  createShuffledDeck() {
    const deck = this.createDeck();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  /**
   * 向規則引擎注冊深海規則
   * @param {RuleEngine} engine - 規則引擎
   */
  registerRules(engine) {
    registerDeepSeaRules(engine);
  },

  /**
   * 驗證擴充包完整性
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    const cardValidation = validateDeepSeaCardDefinitions();
    if (!cardValidation.valid) {
      errors.push(...cardValidation.errors);
    }

    const totalCards = getDeepSeaCardCount();
    if (totalCards !== DEEP_SEA_EXPECTED_TOTAL) {
      errors.push(`Expected ${DEEP_SEA_EXPECTED_TOTAL} cards, got ${totalCards}`);
    }

    return { valid: errors.length === 0, errors };
  },

  // 生命週期鉤子
  onRegister: (registry) => {
    // 深海擴充包已注冊
  },

  onEnable: (registry) => {
    // 深海擴充包已啟用
  },

  onDisable: (registry) => {
    // 深海擴充包已停用
  },

  onGameInit: (gameState) => {
    // 初始化深海模式標記
    if (!gameState.expansionFlags) {
      gameState.expansionFlags = {};
    }
    gameState.expansionFlags.deepSeaEnabled = true;
  },

  onGameEnd: (gameState) => {
    // 清理深海模式標記
    if (gameState.expansionFlags) {
      delete gameState.expansionFlags.deepSeaEnabled;
    }
  },
};

module.exports = {
  // 擴充包定義
  deepSeaExpansion,

  // 性狀相關
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,

  // 卡牌相關
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getDeepSeaCardCount,
  getDeepSeaCardDefinition,
  getDeepSeaCardsByTrait,
  validateDeepSeaCardDefinitions,

  // 規則
  DEEP_SEA_RULES,
  registerDeepSeaRules,
};
