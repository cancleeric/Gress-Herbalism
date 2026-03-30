/**
 * 深海生態擴充包
 * Deep Sea Ecology Expansion
 *
 * 第一個官方擴充包，新增 6 種深海性狀與 24 張雙面卡。
 *
 * 新性狀：
 * - 深潛（deepDive）：只有水生肉食才能攻擊
 * - 發光（bioluminescence）：照亮目標，消除偽裝/穴居防禦
 * - 群游（schooling）：互動性狀，夥伴獲得食物時另一隻得藍色食物
 * - 巨口（gapingMaw）：可攻擊巨化生物
 * - 電感知（electroreception）：可攻擊已飽食的穴居生物
 * - 深淵適應（abyssalAdaptation）：每局一次在滅絕階段存活
 *
 * @module expansions/deepSea
 */

const {
  DEEP_SEA_TRAIT_CATEGORIES,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitsByCategory,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,
} = require('./traits/definitions');

const {
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getDeepSeaCardCount,
  validateDeepSeaCardDefinitions,
} = require('./cards');

const {
  registerDeepSeaRules,
  DEEP_SEA_RULE_IDS,
  DEEP_SEA_RULES,
} = require('./rules');

const {
  createAllDeepSeaHandlerInstances,
} = require('./traits/handlers');

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
  traits: createAllDeepSeaHandlerInstances(),

  // 性狀定義
  traitDefinitions: DEEP_SEA_TRAIT_DEFINITIONS,

  // 卡牌（24 張）
  cards: DEEP_SEA_CARDS,

  // 規則
  rules: {
    ...DEEP_SEA_RULES,
  },

  /**
   * 建立此擴充包的牌庫（展開每張卡的 count）
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
          selectedSide: null,
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
   * 註冊深海規則到引擎
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

    const totalTraitCards = getDeepSeaTotalCardCount();
    if (totalTraitCards !== DEEP_SEA_EXPECTED_TOTAL) {
      errors.push(`Trait card count mismatch: expected ${DEEP_SEA_EXPECTED_TOTAL}, got ${totalTraitCards}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // 生命週期鉤子
  onRegister: (_registry) => {
    // 深海生態擴充包已註冊
  },

  onEnable: (_registry) => {
    // 深海生態擴充包已啟用
  },

  onDisable: (_registry) => {
    // 深海生態擴充包已停用
  },

  onGameInit: (_gameState) => {
    // 深海生態無特殊初始化邏輯
  },

  onGameEnd: (_gameState) => {
    // 深海生態無特殊結束邏輯
  },
};

module.exports = {
  // 擴充包主體
  deepSeaExpansion,

  // 性狀相關
  DEEP_SEA_TRAIT_CATEGORIES,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitsByCategory,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,

  // 卡牌相關
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getDeepSeaCardCount,
  validateDeepSeaCardDefinitions,

  // 規則相關
  registerDeepSeaRules,
  DEEP_SEA_RULE_IDS,
  DEEP_SEA_RULES,
};
