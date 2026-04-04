/**
 * 深海生態擴充包
 * Deep Sea Ecology Expansion
 *
 * 此模組定義了「深海生態」擴充包，包含：
 * - 6 種新性狀（深潛、壓抗、發光、群游、巨口、電感）
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
  getDeepSeaTotalCardCount,
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
  DeepDiveHandler,
  PressureResistanceHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GulperHandler,
  ElectroreceptionHandler,
} = require('./traits');

const {
  DEEP_SEA_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
} = require('./cards');

/**
 * 深海生態擴充包定義
 * 符合 ExpansionInterface 介面
 */
const deepSeaExpansion = {
  id: 'deep-sea',
  name: '深海生態',
  nameEn: 'Deep Sea Ecology',
  version: '1.0.0',
  description: '探索深海世界，包含 6 種新性狀和 24 張雙面卡',

  // 依賴基礎版
  requires: ['base'],
  incompatible: [],

  // 性狀處理器實例
  traits: createAllDeepSeaHandlerInstances(),

  // 性狀定義（供其他模組參考）
  traitDefinitions: DEEP_SEA_TRAIT_DEFINITIONS,

  // 卡牌（24 張）
  cards: DEEP_SEA_CARDS,

  // 深海特殊規則
  rules: {
    deepSeaEnabled: true,
    // 深海環境：食物池初始量增加 1（每個玩家）
    foodPoolBonus: 1,
    // 深潛解除時機：回合開始
    deepDiveResetOnTurnStart: true,
    // 電感干擾持續時間：1 回合
    electroReceptionDuration: 1,
  },

  /**
   * 建立此擴充包的牌庫
   * @returns {Object[]}
   */
  createDeck() {
    const deck = [];
    let cardIndex = 0;

    for (const cardDef of DEEP_SEA_CARDS) {
      const count = cardDef.count || 1;
      for (let i = 0; i < count; i++) {
        deck.push({
          id: `${cardDef.id}-${cardIndex++}`,
          frontTrait: cardDef.frontTrait,
          backTrait: cardDef.backTrait,
          expansionId: 'deep-sea',
        });
      }
    }

    return deck;
  },

  /**
   * 驗證擴充包完整性
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    const cardValidation = validateCardDefinitions();
    if (!cardValidation.valid) {
      errors.push(...cardValidation.errors);
    }

    const totalCards = getTotalCardCount();
    if (totalCards !== 24) {
      errors.push(`Expected 24 cards, got ${totalCards}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // 生命週期鉤子
  onRegister: () => {
    // 深海擴充包已註冊
  },

  onEnable: () => {
    // 深海擴充包已啟用
  },

  onDisable: () => {
    // 深海擴充包已停用
  },

  onGameInit: (gameState) => {
    // 深海環境初始化：食物池額外增加
    if (gameState && gameState.foodPool !== undefined) {
      const playerCount = gameState.players?.length || 0;
      gameState.foodPool = (gameState.foodPool || 0) + playerCount;
    }
  },

  onGameEnd: () => {
    // 無特殊結束邏輯
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
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,

  // 處理器類別
  DeepDiveHandler,
  PressureResistanceHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GulperHandler,
  ElectroreceptionHandler,

  // 卡牌相關
  DEEP_SEA_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
};
