/**
 * 深海生態擴充包 - 卡牌定義
 *
 * 共 24 張雙面卡（6 種配對 × 4 張）
 *
 * @module expansions/deepSea/cards/definitions
 */

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');
// 取得基礎版性狀類型（用於組合卡牌）
const FAT_TISSUE = 'fatTissue';
const AQUATIC = 'aquatic';
const CARNIVORE = 'carnivore';

/**
 * 深海擴充包卡牌定義
 * @type {Array<{id: string, frontTrait: string, backTrait: string, count: number}>}
 */
const DEEP_SEA_CARDS = [
  // === 深潛卡牌 (8張) ===
  // 深潛 / 脂肪組織：防禦型配置
  { id: 'DEEP_001', frontTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, backTrait: FAT_TISSUE, count: 4 },
  // 深潛 / 水生：深海組合，增強深海防禦
  { id: 'DEEP_002', frontTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE, backTrait: AQUATIC, count: 4 },

  // === 群游卡牌 (4張) ===
  { id: 'DEEP_003', frontTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING, backTrait: FAT_TISSUE, count: 4 },

  // === 噴墨卡牌 (4張) ===
  { id: 'DEEP_004', frontTrait: DEEP_SEA_TRAIT_TYPES.INK_SQUIRT, backTrait: FAT_TISSUE, count: 4 },

  // === 發光卡牌 (4張) ===
  // 互動性狀，雙面相同
  { id: 'DEEP_005', frontTrait: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE, backTrait: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE, count: 4 },

  // === 電感卡牌 (4張) ===
  // 電感 / 肉食：組合使用效果最佳
  { id: 'DEEP_006', frontTrait: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION, backTrait: CARNIVORE, count: 4 },

  // === 巨口卡牌 (4張) ===
  { id: 'DEEP_007', frontTrait: DEEP_SEA_TRAIT_TYPES.GULPER, backTrait: FAT_TISSUE, count: 4 },
];

/**
 * 預期總卡牌數
 */
const DEEP_SEA_EXPECTED_TOTAL = 28;

/**
 * 計算總卡牌數
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
 * 驗證卡牌定義完整性
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateDeepSeaCardDefinitions() {
  const errors = [];
  const total = getDeepSeaCardCount();

  if (total !== DEEP_SEA_EXPECTED_TOTAL) {
    errors.push(`Expected ${DEEP_SEA_EXPECTED_TOTAL} cards, got ${total}`);
  }

  for (const card of DEEP_SEA_CARDS) {
    if (!card.id) errors.push('Card missing id');
    if (!card.frontTrait) errors.push(`Card ${card.id} missing frontTrait`);
    if (!card.backTrait) errors.push(`Card ${card.id} missing backTrait`);
    if (!card.count || card.count <= 0) errors.push(`Card ${card.id} has invalid count`);
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getDeepSeaCardCount,
  getDeepSeaCardDefinition,
  getDeepSeaCardsByTrait,
  validateDeepSeaCardDefinitions,
};
