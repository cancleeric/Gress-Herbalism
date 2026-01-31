/**
 * 演化論遊戲 - 卡牌邏輯模組
 *
 * 此模組負責卡牌相關的所有邏輯，包括：
 * - 建立 84 張雙面卡牌牌庫
 * - 洗牌和抽牌功能
 * - 性狀資訊查詢
 * - 性狀放置驗證
 *
 * @module logic/evolution/cardLogic
 */

const {
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
  INTERACTIVE_TRAITS,
  TRAIT_INCOMPATIBILITIES,
  STACKABLE_TRAITS,
  isInteractiveTrait,
  isStackableTrait,
  areTraitsIncompatible,
  getTraitInfo: getTraitInfoFromConstants
} = require('../../../shared/constants/evolution');

// ==================== 卡牌 ID 產生器 ====================

let cardIdCounter = 0;

/**
 * 產生唯一的卡牌 ID
 * @returns {string} 唯一的卡牌 ID
 */
function generateCardId() {
  cardIdCounter++;
  return `card_${String(cardIdCounter).padStart(3, '0')}`;
}

/**
 * 重置卡牌 ID 計數器（主要用於測試）
 */
function resetCardIdCounter() {
  cardIdCounter = 0;
}

// ==================== 牌庫建立 ====================

/**
 * 建立完整的 84 張卡牌牌庫
 * 每張卡牌都是雙面卡（一面為生物、一面為性狀）
 *
 * @returns {Card[]} 卡牌陣列
 */
function createDeck() {
  resetCardIdCounter();
  const deck = [];

  // 根據 TRAIT_DEFINITIONS 中的 cardCount 建立卡牌
  Object.entries(TRAIT_DEFINITIONS).forEach(([traitType, definition]) => {
    for (let i = 0; i < definition.cardCount; i++) {
      deck.push({
        id: generateCardId(),
        traitType: traitType,
        foodBonus: definition.foodBonus || 0,
        isInteractive: definition.isInteractive || false
      });
    }
  });

  return deck;
}

/**
 * 驗證牌庫是否完整
 * @param {Card[]} deck - 牌庫
 * @returns {{ valid: boolean, totalCards: number, traitCounts: Object }}
 */
function validateDeck(deck) {
  const traitCounts = {};

  deck.forEach(card => {
    traitCounts[card.traitType] = (traitCounts[card.traitType] || 0) + 1;
  });

  // 檢查每種性狀的數量是否正確
  let valid = true;
  Object.entries(TRAIT_DEFINITIONS).forEach(([traitType, definition]) => {
    if (traitCounts[traitType] !== definition.cardCount) {
      valid = false;
    }
  });

  return {
    valid,
    totalCards: deck.length,
    traitCounts
  };
}

// ==================== 洗牌功能 ====================

/**
 * 洗牌（Fisher-Yates 演算法）
 * 此演算法保證每種排列的機率相等
 *
 * @param {Card[]} deck - 牌庫
 * @returns {Card[]} 洗過的牌庫（新陣列，不修改原陣列）
 */
function shuffleDeck(deck) {
  // 建立副本避免修改原陣列
  const shuffled = [...deck];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// ==================== 抽牌功能 ====================

/**
 * 從牌庫抽取指定數量的牌
 *
 * @param {Card[]} deck - 牌庫
 * @param {number} count - 抽牌數量
 * @returns {{ cards: Card[], remainingDeck: Card[] }} 抽到的牌和剩餘牌庫
 */
function drawCards(deck, count) {
  // 如果要求抽的牌比牌庫多，則抽取所有剩餘的牌
  const actualCount = Math.min(count, deck.length);

  const cards = deck.slice(0, actualCount);
  const remainingDeck = deck.slice(actualCount);

  return {
    cards,
    remainingDeck
  };
}

/**
 * 檢查牌庫是否為空
 * @param {Card[]} deck - 牌庫
 * @returns {boolean}
 */
function isDeckEmpty(deck) {
  return deck.length === 0;
}

/**
 * 取得牌庫剩餘數量
 * @param {Card[]} deck - 牌庫
 * @returns {number}
 */
function getDeckCount(deck) {
  return deck.length;
}

// ==================== 性狀資訊查詢 ====================

/**
 * 取得性狀詳細資訊
 *
 * @param {string} traitType - 性狀類型
 * @returns {TraitInfo|null} 性狀資訊
 */
function getTraitInfo(traitType) {
  return getTraitInfoFromConstants(traitType);
}

/**
 * 取得卡牌的完整資訊
 *
 * @param {Card} card - 卡牌
 * @returns {Object} 卡牌完整資訊（包含性狀詳細說明）
 */
function getCardFullInfo(card) {
  const traitInfo = getTraitInfo(card.traitType);

  return {
    ...card,
    traitName: traitInfo?.name || '未知',
    traitDescription: traitInfo?.description || '',
    isInteractive: traitInfo?.isInteractive || false
  };
}

// ==================== 性狀放置驗證 ====================

/**
 * 驗證性狀是否可放置在指定生物上
 *
 * @param {Creature} creature - 目標生物
 * @param {string} traitType - 性狀類型
 * @param {string} playerId - 放置性狀的玩家 ID
 * @param {Creature} [targetCreature] - 目標生物（互動性狀的第二隻生物）
 * @returns {{ valid: boolean, reason: string }}
 */
function validateTraitPlacement(creature, traitType, playerId, targetCreature = null) {
  // 1. 檢查性狀是否存在
  if (!TRAIT_DEFINITIONS[traitType]) {
    return { valid: false, reason: '無效的性狀類型' };
  }

  // 2. 寄生蟲特殊規則：只能放在對手生物上
  if (traitType === TRAIT_TYPES.PARASITE) {
    if (creature.ownerId === playerId) {
      return { valid: false, reason: '寄生蟲只能放在對手的生物上' };
    }
    // 寄生蟲可以疊加，不需要檢查重複
    return { valid: true, reason: '' };
  }

  // 3. 一般性狀必須放在自己的生物上
  if (creature.ownerId !== playerId) {
    return { valid: false, reason: '只能將性狀放在自己的生物上' };
  }

  // 4. 互動性狀需要兩隻生物
  if (isInteractiveTrait(traitType)) {
    if (!targetCreature) {
      return { valid: false, reason: '互動性狀需要指定第二隻生物' };
    }
    if (targetCreature.ownerId !== playerId) {
      return { valid: false, reason: '互動性狀的兩隻生物都必須是自己的' };
    }
    if (creature.id === targetCreature.id) {
      return { valid: false, reason: '互動性狀必須連結兩隻不同的生物' };
    }
    return { valid: true, reason: '' };
  }

  // 5. 檢查重複性狀（除了可疊加的性狀）
  if (!isStackableTrait(traitType)) {
    const hasSameTrait = creature.traits.some(t => t.type === traitType);
    if (hasSameTrait) {
      return { valid: false, reason: '此生物已經擁有這個性狀' };
    }
  }

  // 6. 檢查互斥性狀
  for (const existingTrait of creature.traits) {
    if (areTraitsIncompatible(traitType, existingTrait.type)) {
      const existingInfo = getTraitInfo(existingTrait.type);
      const newInfo = getTraitInfo(traitType);
      return {
        valid: false,
        reason: `${newInfo?.name || traitType} 與 ${existingInfo?.name || existingTrait.type} 互斥`
      };
    }
  }

  return { valid: true, reason: '' };
}

/**
 * 取得可放置性狀的目標生物列表
 *
 * @param {string} traitType - 性狀類型
 * @param {string} playerId - 玩家 ID
 * @param {Creature[]} allCreatures - 所有生物
 * @returns {Creature[]} 可放置的生物列表
 */
function getValidTraitTargets(traitType, playerId, allCreatures) {
  return allCreatures.filter(creature => {
    const result = validateTraitPlacement(creature, traitType, playerId);
    return result.valid;
  });
}

// ==================== 導出 ====================

module.exports = {
  // 牌庫建立
  createDeck,
  validateDeck,
  resetCardIdCounter,

  // 洗牌和抽牌
  shuffleDeck,
  drawCards,
  isDeckEmpty,
  getDeckCount,

  // 性狀資訊
  getTraitInfo,
  getCardFullInfo,

  // 性狀放置驗證
  validateTraitPlacement,
  getValidTraitTargets
};
