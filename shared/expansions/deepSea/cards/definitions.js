/**
 * 深海生態擴充包卡牌定義
 *
 * 每張卡都是雙面卡，可選擇作為生物或性狀使用。
 * 深海生態擴充包共 24 張卡（8 種配對 × 3 張）。
 *
 * @module expansions/deepSea/cards/definitions
 */

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');

/**
 * 深海生態擴充包卡牌定義
 * @type {Array<{id: string, frontTrait: string, backTrait: string, count: number}>}
 */
const DEEP_SEA_CARDS = [
  // === 深潛相關卡牌 (6張) ===
  { id: 'DS_001', frontTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, backTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, count: 3 },
  { id: 'DS_002', frontTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, backTrait: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION, count: 3 },

  // === 發光相關卡牌 (6張) ===
  { id: 'DS_003', frontTrait: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE, backTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, count: 3 },
  { id: 'DS_004', frontTrait: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE, backTrait: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION, count: 3 },

  // === 群游相關卡牌 (6張) ===
  { id: 'DS_005', frontTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, backTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, count: 3 },
  { id: 'DS_006', frontTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, backTrait: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION, count: 3 },

  // === 巨口相關卡牌 (3張) ===
  { id: 'DS_007', frontTrait: DEEP_SEA_TRAIT_TYPES.GAPING_MAW, backTrait: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION, count: 3 },

  // === 深淵適應卡牌 (3張) ===
  { id: 'DS_008', frontTrait: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION, backTrait: DEEP_SEA_TRAIT_TYPES.GAPING_MAW, count: 3 },
];

/**
 * 預期總卡牌數
 */
const DEEP_SEA_EXPECTED_TOTAL = 24;

/**
 * 計算深海生態擴充包總卡牌數
 * @returns {number}
 */
function getDeepSeaCardCount() {
  return DEEP_SEA_CARDS.reduce((sum, card) => sum + card.count, 0);
}

/**
 * 取得卡牌定義
 * @param {string} cardId - 卡牌 ID
 * @returns {Object|null}
 */
function getDeepSeaCardDefinition(cardId) {
  return DEEP_SEA_CARDS.find(card => card.id === cardId) || null;
}

/**
 * 根據性狀取得相關卡牌
 * @param {string} traitType - 性狀類型
 * @returns {Object[]}
 */
function getDeepSeaCardsByTrait(traitType) {
  return DEEP_SEA_CARDS.filter(
    card => card.frontTrait === traitType || card.backTrait === traitType
  );
}

/**
 * 驗證深海卡牌定義
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateDeepSeaCardDefinitions() {
  const errors = [];
  const ids = new Set();

  for (const card of DEEP_SEA_CARDS) {
    if (ids.has(card.id)) {
      errors.push(`Duplicate card ID: ${card.id}`);
    }
    ids.add(card.id);

    if (!Object.values(DEEP_SEA_TRAIT_TYPES).includes(card.frontTrait)) {
      errors.push(`Unknown front trait: ${card.frontTrait} in card ${card.id}`);
    }

    if (!Object.values(DEEP_SEA_TRAIT_TYPES).includes(card.backTrait)) {
      errors.push(`Unknown back trait: ${card.backTrait} in card ${card.id}`);
    }

    if (!card.count || card.count < 1) {
      errors.push(`Invalid count for card: ${card.id}`);
    }
  }

  const total = getDeepSeaCardCount();
  if (total !== DEEP_SEA_EXPECTED_TOTAL) {
    errors.push(`Expected ${DEEP_SEA_EXPECTED_TOTAL} cards, got ${total}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getDeepSeaCardCount,
  getDeepSeaCardDefinition,
  getDeepSeaCardsByTrait,
  validateDeepSeaCardDefinitions,
};
