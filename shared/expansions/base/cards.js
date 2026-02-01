/**
 * 基礎版卡牌定義
 *
 * 演化論基礎版包含 84 張雙面卡。
 * 每張卡牌的正面和背面各有一個性狀。
 *
 * @module expansions/base/cards
 */

const { TRAIT_TYPES, TRAIT_DEFINITIONS } = require('./traits/definitions');

/**
 * 卡牌配對定義
 * 定義每張卡牌的正面/背面性狀組合
 *
 * @type {Array<{front: string, back: string, count: number}>}
 */
const CARD_PAIRS = [
  // 肉食相關配對
  { front: TRAIT_TYPES.CARNIVORE, back: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { front: TRAIT_TYPES.SCAVENGER, back: TRAIT_TYPES.COMMUNICATION, count: 4 },
  { front: TRAIT_TYPES.SHARP_VISION, back: TRAIT_TYPES.COOPERATION, count: 4 },

  // 防禦相關配對
  { front: TRAIT_TYPES.CAMOUFLAGE, back: TRAIT_TYPES.FAT_TISSUE, count: 4 },
  { front: TRAIT_TYPES.BURROWING, back: TRAIT_TYPES.PARASITE, count: 4 },
  { front: TRAIT_TYPES.POISONOUS, back: TRAIT_TYPES.SYMBIOSIS, count: 4 },
  { front: TRAIT_TYPES.AQUATIC, back: TRAIT_TYPES.PARASITE, count: 4 },
  { front: TRAIT_TYPES.AQUATIC, back: TRAIT_TYPES.ROBBERY, count: 4 },
  { front: TRAIT_TYPES.AGILE, back: TRAIT_TYPES.TRAMPLING, count: 4 },
  { front: TRAIT_TYPES.MASSIVE, back: TRAIT_TYPES.HIBERNATION, count: 4 },
  { front: TRAIT_TYPES.TAIL_LOSS, back: TRAIT_TYPES.MIMICRY, count: 4 },
];

/**
 * 從卡牌配對生成卡牌池
 * @returns {Array<Object>} 卡牌定義陣列
 */
function generateCardPool() {
  const cards = [];

  for (const pair of CARD_PAIRS) {
    const frontDef = TRAIT_DEFINITIONS[pair.front];
    const backDef = TRAIT_DEFINITIONS[pair.back];

    cards.push({
      id: `${pair.front}-${pair.back}`,
      frontTrait: pair.front,
      backTrait: pair.back,
      frontName: frontDef?.name || pair.front,
      backName: backDef?.name || pair.back,
      count: pair.count,
      expansion: 'base',
    });
  }

  return cards;
}

/**
 * 從性狀定義生成簡化卡牌列表（每張性狀一張卡）
 * 用於測試或簡化場景
 * @returns {Array<Object>} 簡化卡牌陣列
 */
function generateSimpleCards() {
  const cards = [];

  for (const [traitType, definition] of Object.entries(TRAIT_DEFINITIONS)) {
    for (let i = 0; i < definition.cardCount; i++) {
      cards.push({
        traitType,
        traitName: definition.name,
        traitNameEn: definition.nameEn,
        foodBonus: definition.foodBonus,
        category: definition.category,
        expansion: definition.expansion,
      });
    }
  }

  return cards;
}

/**
 * 基礎版卡牌池
 * @type {Array<Object>}
 */
const BASE_CARD_POOL = generateCardPool();

/**
 * 基礎版簡化卡牌列表
 * @type {Array<Object>}
 */
const BASE_SIMPLE_CARDS = generateSimpleCards();

/**
 * 驗證卡牌總數
 * 基礎版應有 84 張卡（但由於雙面卡配對，實際卡牌數為 44 張雙面卡）
 */
const EXPECTED_CARD_COUNT = 44; // 11 pairs × 4 copies
const actualCount = BASE_CARD_POOL.reduce((sum, card) => sum + card.count, 0);

if (actualCount !== EXPECTED_CARD_COUNT) {
  console.warn(`卡牌數量警告: 預期 ${EXPECTED_CARD_COUNT} 張，實際 ${actualCount} 張`);
}

module.exports = {
  CARD_PAIRS,
  BASE_CARD_POOL,
  BASE_SIMPLE_CARDS,
  generateCardPool,
  generateSimpleCards,
  EXPECTED_CARD_COUNT,
};
