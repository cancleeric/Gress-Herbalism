/**
 * 基礎版卡牌定義
 *
 * 每張卡都是雙面卡，可選擇作為生物或性狀使用
 * 基礎版共 84 張卡（21 種配對 × 4 張）
 *
 * @module expansions/base/cards/definitions
 */

const { TRAIT_TYPES } = require('../traits/definitions');

/**
 * 基礎版卡牌定義
 * @type {Array<{id: string, frontTrait: string, backTrait: string, count: number}>}
 */
const BASE_CARDS = [
  // === 肉食相關卡牌 (8張) ===
  { id: 'BASE_001', frontTrait: TRAIT_TYPES.CARNIVORE, backTrait: TRAIT_TYPES.CARNIVORE, count: 4 },
  { id: 'BASE_002', frontTrait: TRAIT_TYPES.CARNIVORE, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },

  // === 防禦性狀卡牌 (32張) ===
  { id: 'BASE_003', frontTrait: TRAIT_TYPES.CAMOUFLAGE, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_004', frontTrait: TRAIT_TYPES.BURROWING, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_005', frontTrait: TRAIT_TYPES.POISONOUS, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_006', frontTrait: TRAIT_TYPES.AQUATIC, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_007', frontTrait: TRAIT_TYPES.AGILE, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_008', frontTrait: TRAIT_TYPES.MASSIVE, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_009', frontTrait: TRAIT_TYPES.TAIL_LOSS, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_010', frontTrait: TRAIT_TYPES.MIMICRY, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },

  // === 進食相關卡牌 (16張) ===
  { id: 'BASE_011', frontTrait: TRAIT_TYPES.FAT_TISSUE, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_012', frontTrait: TRAIT_TYPES.HIBERNATION, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_013', frontTrait: TRAIT_TYPES.PARASITE, backTrait: TRAIT_TYPES.CARNIVORE, count: 4 },
  { id: 'BASE_014', frontTrait: TRAIT_TYPES.ROBBERY, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },

  // === 互動性狀卡牌 (12張) ===
  { id: 'BASE_015', frontTrait: TRAIT_TYPES.COMMUNICATION, backTrait: TRAIT_TYPES.COMMUNICATION, count: 4 },
  { id: 'BASE_016', frontTrait: TRAIT_TYPES.COOPERATION, backTrait: TRAIT_TYPES.COOPERATION, count: 4 },
  { id: 'BASE_017', frontTrait: TRAIT_TYPES.SYMBIOSIS, backTrait: TRAIT_TYPES.SYMBIOSIS, count: 4 },

  // === 特殊能力卡牌 (8張) ===
  { id: 'BASE_018', frontTrait: TRAIT_TYPES.SCAVENGER, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_019', frontTrait: TRAIT_TYPES.SHARP_VISION, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },

  // === 踐踏卡牌 (8張) ===
  { id: 'BASE_020', frontTrait: TRAIT_TYPES.TRAMPLING, backTrait: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { id: 'BASE_021', frontTrait: TRAIT_TYPES.TRAMPLING, backTrait: TRAIT_TYPES.CARNIVORE, count: 4 },
];

/**
 * 預期總卡牌數
 */
const EXPECTED_TOTAL = 84;

/**
 * 計算總卡牌數
 * @returns {number}
 */
function getTotalCardCount() {
  return BASE_CARDS.reduce((sum, card) => sum + card.count, 0);
}

/**
 * 取得卡牌定義
 * @param {string} cardId - 卡牌 ID
 * @returns {Object|null} 卡牌定義
 */
function getCardDefinition(cardId) {
  return BASE_CARDS.find(card => card.id === cardId) || null;
}

/**
 * 根據性狀取得相關卡牌
 * @param {string} traitType - 性狀類型
 * @returns {Object[]} 包含此性狀的卡牌定義
 */
function getCardsByTrait(traitType) {
  return BASE_CARDS.filter(
    card => card.frontTrait === traitType || card.backTrait === traitType
  );
}

/**
 * 驗證卡牌定義
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateCardDefinitions() {
  const errors = [];
  const ids = new Set();

  for (const card of BASE_CARDS) {
    // 檢查 ID 唯一性
    if (ids.has(card.id)) {
      errors.push(`Duplicate card ID: ${card.id}`);
    }
    ids.add(card.id);

    // 檢查性狀是否存在
    if (!Object.values(TRAIT_TYPES).includes(card.frontTrait)) {
      errors.push(`Card ${card.id}: invalid front trait ${card.frontTrait}`);
    }
    if (!Object.values(TRAIT_TYPES).includes(card.backTrait)) {
      errors.push(`Card ${card.id}: invalid back trait ${card.backTrait}`);
    }

    // 檢查數量
    if (card.count <= 0) {
      errors.push(`Card ${card.id}: invalid count ${card.count}`);
    }
  }

  // 檢查總數
  const total = getTotalCardCount();
  if (total !== EXPECTED_TOTAL) {
    errors.push(`Expected ${EXPECTED_TOTAL} cards, got ${total}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  BASE_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
};
