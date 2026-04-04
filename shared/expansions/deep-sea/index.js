/**
 * 深海生態擴充包
 * Deep Sea Ecology Expansion
 *
 * 此模組定義了演化論深海生態擴充包，包含：
 * - 6 種深海性狀（深潛、電擊、發光、群游、巨口、深淵適應）
 * - 28 張雙面卡
 * - 深海環境特殊規則
 *
 * 使用現有 ExpansionRegistry 架構，不修改核心邏輯。
 * 需要基礎版（base）才能運作。
 *
 * @module expansions/deep-sea
 */

const {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitDefinition,
} = require('./traits/definitions');

const {
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getTotalDeepSeaCardCount,
  validateDeepSeaCardDefinitions,
} = require('./cards');

const {
  DEEP_SEA_RULES,
  registerDeepSeaRules,
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
  description: '演化論深海生態擴充包，新增 6 種深海性狀和 28 張雙面卡',

  // 需要基礎版
  requires: ['base'],
  incompatible: [],

  // 性狀處理器實例（ExpansionRegistry 需要的格式）
  traits: createAllDeepSeaHandlerInstances(),

  // 性狀定義（供其他模組參考）
  traitDefinitions: DEEP_SEA_TRAIT_DEFINITIONS,

  // 卡牌定義（28 張）
  cards: DEEP_SEA_CARDS,

  // 深海環境規則常數
  rules: {
    deepSeaFoodBonus: DEEP_SEA_RULES.deepSeaFoodBonus,
    megamouthAttackReward: DEEP_SEA_RULES.megamouthAttackReward,
    electricFoodPenalty: DEEP_SEA_RULES.electricFoodPenalty,
  },

  /**
   * 驗證擴充包完整性
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    // 驗證卡牌定義
    const cardValidation = validateDeepSeaCardDefinitions();
    if (!cardValidation.valid) {
      errors.push(...cardValidation.errors);
    }

    // 檢查卡牌總數
    const totalCards = getTotalDeepSeaCardCount();
    if (totalCards !== DEEP_SEA_EXPECTED_TOTAL) {
      errors.push(`Expected ${DEEP_SEA_EXPECTED_TOTAL} cards, got ${totalCards}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * 註冊規則到引擎
   * @param {Object} engine - 規則引擎
   */
  registerRules(engine) {
    registerDeepSeaRules(engine);
  },

  // 生命週期鉤子
  onRegister: () => {
    // 深海生態擴充包已註冊
  },

  onEnable: () => {
    // 深海生態擴充包已啟用
  },

  onDisable: () => {
    // 深海生態擴充包已停用
  },

  onGameInit: (gameState) => {
    // 遊戲初始化時無特殊邏輯（深海規則在規則引擎處理）
  },

  onGameEnd: (gameState) => {
    // 遊戲結束時無特殊邏輯
  },
};

module.exports = {
  // 擴充包定義
  deepSeaExpansion,

  // 性狀相關
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitDefinition,

  // 卡牌相關
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getTotalDeepSeaCardCount,
  validateDeepSeaCardDefinitions,

  // 規則相關
  DEEP_SEA_RULES,
  registerDeepSeaRules,
};
