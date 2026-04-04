/**
 * 深海擴充包卡牌定義
 *
 * 深海生態擴充包共 24 張雙面卡（6 種配對 × 4 張）
 *
 * @module expansions/deep-sea/cards/definitions
 */

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');

/**
 * 深海擴充包卡牌定義
 * @type {Array<{id: string, frontTrait: string, backTrait: string, count: number}>}
 */
const DEEP_SEA_CARDS = [
  // 深潛 + 發光（4張）
  { id: 'DEEP_001', frontTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, backTrait: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE, count: 4 },
  // 群游 + 深潛（4張）
  { id: 'DEEP_002', frontTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, backTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, count: 4 },
  // 巨口 + 電感（4張）
  { id: 'DEEP_003', frontTrait: DEEP_SEA_TRAIT_TYPES.GIANT_MAW, backTrait: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION, count: 4 },
  // 電感 + 深潛（4張）
  { id: 'DEEP_004', frontTrait: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION, backTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, count: 4 },
  // 墨汁 + 群游（4張）
  { id: 'DEEP_005', frontTrait: DEEP_SEA_TRAIT_TYPES.INK_CLOUD, backTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, count: 4 },
  // 發光 + 墨汁（4張）
  { id: 'DEEP_006', frontTrait: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE, backTrait: DEEP_SEA_TRAIT_TYPES.INK_CLOUD, count: 4 },
];

/**
 * 預期總卡牌數
 */
const EXPECTED_DEEP_SEA_TOTAL = 24;

/**
 * 計算深海擴充包總卡牌數
 * @returns {number}
 */
function getTotalCardCount() {
  return DEEP_SEA_CARDS.reduce((sum, card) => sum + card.count, 0);
}

/**
 * 取得指定 ID 的卡牌定義
 * @param {string} cardId
 * @returns {Object|null}
 */
function getCardDefinition(cardId) {
  return DEEP_SEA_CARDS.find(c => c.id === cardId) || null;
}

/**
 * 取得指定性狀的所有卡牌
 * @param {string} traitType
 * @returns {Object[]}
 */
function getCardsByTrait(traitType) {
  return DEEP_SEA_CARDS.filter(
    c => c.frontTrait === traitType || c.backTrait === traitType
  );
}

/**
 * 驗證卡牌定義完整性
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCardDefinitions() {
  const errors = [];
  const total = getTotalCardCount();

  if (total !== EXPECTED_DEEP_SEA_TOTAL) {
    errors.push(`Expected ${EXPECTED_DEEP_SEA_TOTAL} cards, got ${total}`);
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  DEEP_SEA_CARDS,
  EXPECTED_DEEP_SEA_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
};
