/**
 * 深海生態擴充包卡牌定義
 *
 * 每張卡都是雙面卡，可選擇作為生物或性狀使用
 * 深海生態擴充包共 28 張卡（7 種配對 × 4 張）
 *
 * @module expansions/deep-sea/cards/definitions
 */

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');
const { TRAIT_TYPES } = require('../../base/traits/definitions');

/**
 * 深海生態擴充包卡牌定義
 * @type {Array<{id: string, frontTrait: string, backTrait: string, count: number}>}
 */
const DEEP_SEA_CARDS = [
  // === 深潛卡牌 (8張) ===
  // 深潛 / 脂肪組織 × 4
  {
    id: 'DS_001',
    frontTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE,
    backTrait: TRAIT_TYPES.FAT_TISSUE,
    count: 4,
  },
  // 深潛 / 水生 × 4（配合水生使得防禦更強）
  {
    id: 'DS_002',
    frontTrait: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE,
    backTrait: TRAIT_TYPES.AQUATIC,
    count: 4,
  },

  // === 發光卡牌 (4張) ===
  // 發光 / 脂肪組織 × 4
  {
    id: 'DS_003',
    frontTrait: DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE,
    backTrait: TRAIT_TYPES.FAT_TISSUE,
    count: 4,
  },

  // === 群游卡牌 (4張) ===
  // 群游 / 溝通 × 4（與溝通相互搭配）
  {
    id: 'DS_004',
    frontTrait: DEEP_SEA_TRAIT_TYPES.SCHOOLING,
    backTrait: TRAIT_TYPES.COMMUNICATION,
    count: 4,
  },

  // === 巨口卡牌 (4張) ===
  // 巨口 / 脂肪組織 × 4
  {
    id: 'DS_005',
    frontTrait: DEEP_SEA_TRAIT_TYPES.MEGAMOUTH,
    backTrait: TRAIT_TYPES.FAT_TISSUE,
    count: 4,
  },

  // === 電擊卡牌 (4張) ===
  // 電擊 / 脂肪組織 × 4
  {
    id: 'DS_006',
    frontTrait: DEEP_SEA_TRAIT_TYPES.ELECTRIC,
    backTrait: TRAIT_TYPES.FAT_TISSUE,
    count: 4,
  },

  // === 深淵適應卡牌 (4張) ===
  // 深淵適應 / 脂肪組織 × 4
  {
    id: 'DS_007',
    frontTrait: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION,
    backTrait: TRAIT_TYPES.FAT_TISSUE,
    count: 4,
  },
];

/**
 * 預期總卡牌數
 */
const DEEP_SEA_EXPECTED_TOTAL = 28;

/**
 * 計算總卡牌數
 * @returns {number}
 */
function getTotalDeepSeaCardCount() {
  return DEEP_SEA_CARDS.reduce((sum, card) => sum + card.count, 0);
}

/**
 * 取得指定 ID 的卡牌定義
 * @param {string} cardId - 卡牌 ID
 * @returns {Object|null}
 */
function getDeepSeaCardDefinition(cardId) {
  return DEEP_SEA_CARDS.find(card => card.id === cardId) || null;
}

/**
 * 取得含特定性狀的卡牌列表
 * @param {string} traitType - 性狀類型
 * @returns {Array}
 */
function getDeepSeaCardsByTrait(traitType) {
  return DEEP_SEA_CARDS.filter(
    card => card.frontTrait === traitType || card.backTrait === traitType
  );
}

/**
 * 驗證卡牌定義完整性
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDeepSeaCardDefinitions() {
  const errors = [];
  const seenIds = new Set();

  for (const card of DEEP_SEA_CARDS) {
    if (!card.id) {
      errors.push('卡牌缺少 id 欄位');
    } else if (seenIds.has(card.id)) {
      errors.push(`重複的卡牌 ID: ${card.id}`);
    } else {
      seenIds.add(card.id);
    }

    if (!card.frontTrait) {
      errors.push(`卡牌 ${card.id} 缺少 frontTrait`);
    }
    if (!card.backTrait) {
      errors.push(`卡牌 ${card.id} 缺少 backTrait`);
    }
    if (!card.count || card.count < 1) {
      errors.push(`卡牌 ${card.id} 的 count 必須 >= 1`);
    }
  }

  const totalCount = getTotalDeepSeaCardCount();
  if (totalCount !== DEEP_SEA_EXPECTED_TOTAL) {
    errors.push(`卡牌總數應為 ${DEEP_SEA_EXPECTED_TOTAL}，實際為 ${totalCount}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getTotalDeepSeaCardCount,
  getDeepSeaCardDefinition,
  getDeepSeaCardsByTrait,
  validateDeepSeaCardDefinitions,
};
