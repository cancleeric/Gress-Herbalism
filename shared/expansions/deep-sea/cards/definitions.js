/**
 * 深海生態擴充包卡牌定義
 *
 * 每張卡都是雙面卡，可選擇作為生物或性狀使用
 * 深海生態擴充包共 24 張卡（6 種性狀配對）
 *
 * @module expansions/deep-sea/cards/definitions
 */

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');
const { TRAIT_TYPES } = require('../../base/traits/definitions');

/**
 * 深海擴充包卡牌定義
 * @type {Array<{id: string, frontTrait: string, backTrait: string, count: number}>}
 */
const DEEP_SEA_CARDS = [
  // 深潛卡牌（4張）：正面深潛 / 背面脂肪組織
  { id: 'DS_001', frontTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },

  // 壓抗卡牌（4張）：正面壓抗 / 背面脂肪組織
  { id: 'DS_002', frontTrait: DEEP_SEA_TRAIT_TYPES.PRESSURE_RESISTANCE, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },

  // 發光卡牌（4張）：正面發光 / 背面水生
  { id: 'DS_003', frontTrait: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE, backTrait: TRAIT_TYPES.AQUATIC, count: 4 },

  // 群游卡牌（4張）：正面群游 / 背面群游
  { id: 'DS_004', frontTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, backTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, count: 4 },

  // 巨口卡牌（4張）：正面巨口 / 背面肉食
  { id: 'DS_005', frontTrait: DEEP_SEA_TRAIT_TYPES.GULPER, backTrait: TRAIT_TYPES.CARNIVORE, count: 4 },

  // 電感卡牌（4張）：正面電感 / 背面脂肪組織
  { id: 'DS_006', frontTrait: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
];

/**
 * 預期總卡牌數
 */
const EXPECTED_TOTAL = 24;

/**
 * 計算總卡牌數
 * @returns {number}
 */
function getTotalCardCount() {
  return DEEP_SEA_CARDS.reduce((sum, card) => sum + card.count, 0);
}

/**
 * 取得卡牌定義
 * @param {string} cardId
 * @returns {Object|null}
 */
function getCardDefinition(cardId) {
  return DEEP_SEA_CARDS.find(card => card.id === cardId) || null;
}

/**
 * 根據性狀取得相關卡牌
 * @param {string} traitType
 * @returns {Object[]}
 */
function getCardsByTrait(traitType) {
  return DEEP_SEA_CARDS.filter(
    card => card.frontTrait === traitType || card.backTrait === traitType
  );
}

/**
 * 驗證卡牌定義
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCardDefinitions() {
  const errors = [];
  const total = getTotalCardCount();

  if (total !== EXPECTED_TOTAL) {
    errors.push(`Expected ${EXPECTED_TOTAL} cards, got ${total}`);
  }

  for (const card of DEEP_SEA_CARDS) {
    if (!card.id) errors.push('Card missing id');
    if (!card.frontTrait) errors.push(`Card ${card.id} missing frontTrait`);
    if (!card.backTrait) errors.push(`Card ${card.id} missing backTrait`);
    if (!card.count || card.count <= 0) errors.push(`Card ${card.id} invalid count`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  DEEP_SEA_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
};
