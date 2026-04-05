/**
 * 深海生態擴充包
 * Deep Sea Ecology Expansion
 *
 * 此模組定義了演化論深海生態擴充包，包含：
 * - 6 種新性狀（深潛、發光、群游、巨口、電感、墨汁）
 * - 24 張雙面卡
 * - 深海環境特殊規則
 *
 * @module expansions/deep-sea
 */

const {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
} = require('./traits/definitions');

const {
  DEEP_SEA_CARDS,
  EXPECTED_DEEP_SEA_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
} = require('./cards');

const { createAllHandlerInstances, DEEP_SEA_TRAIT_HANDLERS } = require('./traits/handlers');

const { registerDeepSeaRules } = require('./rules');

/**
 * 深海生態擴充包定義
 * 符合 ExpansionInterface 介面
 */
const deepSeaExpansion = {
  id: 'deep-sea',
  name: '深海生態',
  nameEn: 'Deep Sea Ecology',
  version: '1.0.0',
  description: '深海生態擴充包，新增 6 種深海性狀與 24 張雙面卡',

  // 依賴基礎版
  requires: ['base'],
  incompatible: [],

  // 性狀處理器實例
  traits: createAllHandlerInstances(),

  // 性狀定義
  traitDefinitions: DEEP_SEA_TRAIT_DEFINITIONS,

  // 卡牌定義（24 張）
  cards: DEEP_SEA_CARDS,

  // 規則
  rules: {
    giantMawAttackReward: 3,
    schoolingMinCount: 2,
    schoolingEscapeThreshold: 4,
  },

  /**
   * 建立此擴充包的牌庫
   * @returns {Object[]}
   */
  createDeck() {
    const deck = [];
    for (const cardDef of DEEP_SEA_CARDS) {
      for (let i = 0; i < cardDef.count; i++) {
        deck.push({
          id: `${cardDef.id}-${i + 1}`,
          definitionId: cardDef.id,
          frontTrait: cardDef.frontTrait,
          backTrait: cardDef.backTrait,
          expansion: 'deep-sea',
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
   * 註冊規則到引擎
   * @param {Object} engine - 規則引擎
   */
  registerRules(engine) {
    registerDeepSeaRules(engine);
  },

  /**
   * 驗證擴充包完整性
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const cardValidation = validateCardDefinitions();
    return cardValidation;
  },

  // 生命週期鉤子
  onRegister: () => {},
  onEnable: () => {},
  onDisable: () => {},
  onGameInit: () => {},
  onGameEnd: () => {},
};

module.exports = {
  deepSeaExpansion,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  DEEP_SEA_TRAIT_HANDLERS,
  DEEP_SEA_CARDS,
  EXPECTED_DEEP_SEA_TOTAL,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
  registerDeepSeaRules,
};
