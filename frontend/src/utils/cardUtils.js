/**
 * 牌組工具函數
 *
 * 此檔案包含牌組相關的工具函數
 *
 * @module cardUtils
 */

import {
  COLORS,
  CARD_COUNTS,
  ALL_COLORS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  HIDDEN_CARDS_COUNT
} from '../../../shared/constants.js';

/**
 * 牌卡資料結構
 * @typedef {Object} Card
 * @property {string} id - 牌的唯一識別碼（格式：顏色-編號，如 'red-1'）
 * @property {string} color - 牌的顏色（'red' | 'yellow' | 'green' | 'blue'）
 * @property {boolean} isHidden - 是否為蓋牌（預設為 false）
 */

/**
 * 建立完整的牌組
 *
 * 根據 constants.js 中的配置建立牌組，包含：
 * - 紅色 2 張
 * - 黃色 3 張
 * - 綠色 4 張
 * - 藍色 5 張
 *
 * @returns {Card[]} 包含 14 張牌的牌組陣列
 *
 * @example
 * const deck = createDeck();
 * // 返回：
 * // [
 * //   { id: 'red-1', color: 'red', isHidden: false },
 * //   { id: 'red-2', color: 'red', isHidden: false },
 * //   { id: 'yellow-1', color: 'yellow', isHidden: false },
 * //   ...
 * // ]
 */
export function createDeck() {
  const deck = [];

  ALL_COLORS.forEach((color) => {
    const count = CARD_COUNTS[color];
    for (let i = 1; i <= count; i++) {
      deck.push({
        id: `${color}-${i}`,
        color: color,
        isHidden: false
      });
    }
  });

  return deck;
}

/**
 * Fisher-Yates 洗牌演算法
 *
 * 使用 Fisher-Yates (Knuth) shuffle 演算法隨機打亂陣列
 * 時間複雜度：O(n)，空間複雜度：O(n)
 *
 * @param {Card[]} deck - 要洗牌的牌組陣列
 * @returns {Card[]} 洗牌後的新牌組陣列（不修改原陣列）
 *
 * @example
 * const deck = createDeck();
 * const shuffled = shuffleDeck(deck);
 * // deck 保持原順序
 * // shuffled 是隨機打亂後的新陣列
 *
 * // TODO: 可擴展點 - 可替換為其他洗牌演算法
 */
export function shuffleDeck(deck) {
  // 複製陣列，不修改原陣列
  const shuffled = [...deck];

  // Fisher-Yates 洗牌演算法
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * 發牌結果資料結構
 * @typedef {Object} DealResult
 * @property {Card[]} hiddenCards - 2張蓋牌
 * @property {Card[][]} playerHands - 每個玩家的手牌陣列
 */

/**
 * 發牌功能
 *
 * 從牌組中抽出2張蓋牌，並將剩餘的牌平均分配給所有玩家
 *
 * @param {Card[]} deck - 洗牌後的牌組陣列
 * @param {number} playerCount - 玩家數量（3-4人）
 * @returns {DealResult} 發牌結果，包含蓋牌和各玩家手牌
 * @throws {Error} 當玩家數量無效或牌組數量不足時拋出錯誤
 *
 * @example
 * const deck = shuffleDeck(createDeck());
 * const result = dealCards(deck, 3);
 * // result.hiddenCards: 2張蓋牌（isHidden: true）
 * // result.playerHands: [[玩家1的牌], [玩家2的牌], [玩家3的牌]]
 */
export function dealCards(deck, playerCount) {
  // 驗證玩家數量
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(`玩家數量必須在 ${MIN_PLAYERS} 到 ${MAX_PLAYERS} 人之間`);
  }

  // 驗證牌組數量
  if (deck.length < HIDDEN_CARDS_COUNT) {
    throw new Error(`牌組數量不足，至少需要 ${HIDDEN_CARDS_COUNT} 張牌`);
  }

  // 複製牌組，避免修改原陣列
  const deckCopy = deck.map(card => ({ ...card }));

  // 抽出蓋牌
  const hiddenCards = deckCopy.splice(0, HIDDEN_CARDS_COUNT).map(card => ({
    ...card,
    isHidden: true
  }));

  // 計算每位玩家應得的牌數
  const remainingCards = deckCopy.length;
  const baseCardsPerPlayer = Math.floor(remainingCards / playerCount);
  const extraCards = remainingCards % playerCount;

  // 初始化玩家手牌陣列
  const playerHands = [];
  let cardIndex = 0;

  for (let i = 0; i < playerCount; i++) {
    // 計算此玩家的牌數（前 extraCards 個玩家多拿一張）
    const cardsForThisPlayer = baseCardsPerPlayer + (i < extraCards ? 1 : 0);
    const hand = deckCopy.slice(cardIndex, cardIndex + cardsForThisPlayer);
    playerHands.push(hand);
    cardIndex += cardsForThisPlayer;
  }

  return {
    hiddenCards,
    playerHands
  };
}

// ==================== 手牌管理輔助函數 ====================

/**
 * 從手牌中篩選出指定顏色的牌
 *
 * @param {Card[]} hand - 手牌陣列
 * @param {string} color - 要篩選的顏色
 * @returns {Card[]} 指定顏色的牌陣列
 *
 * @example
 * const redCards = getCardsByColor(hand, 'red');
 */
export function getCardsByColor(hand, color) {
  return hand.filter(card => card.color === color);
}

/**
 * 檢查手牌中是否包含指定的牌
 *
 * @param {Card[]} hand - 手牌陣列
 * @param {string} cardId - 要檢查的牌 ID
 * @returns {boolean} 是否包含該牌
 *
 * @example
 * const exists = hasCard(hand, 'red-1');
 */
export function hasCard(hand, cardId) {
  return hand.some(card => card.id === cardId);
}

/**
 * 從手牌中移除指定的牌
 *
 * @param {Card[]} hand - 手牌陣列
 * @param {string} cardId - 要移除的牌 ID
 * @returns {Card[]} 移除後的新手牌陣列（不修改原陣列）
 *
 * @example
 * const newHand = removeCard(hand, 'red-1');
 */
export function removeCard(hand, cardId) {
  return hand.filter(card => card.id !== cardId);
}

/**
 * 將牌加入手牌
 *
 * @param {Card[]} hand - 手牌陣列
 * @param {Card} card - 要加入的牌
 * @returns {Card[]} 加入後的新手牌陣列（不修改原陣列）
 *
 * @example
 * const newHand = addCard(hand, { id: 'red-1', color: 'red', isHidden: false });
 */
export function addCard(hand, card) {
  return [...hand, card];
}

/**
 * 計算手牌中指定顏色的牌數
 *
 * @param {Card[]} hand - 手牌陣列
 * @param {string} color - 要計算的顏色
 * @returns {number} 該顏色的牌數
 *
 * @example
 * const count = countCardsByColor(hand, 'red');
 */
export function countCardsByColor(hand, color) {
  return hand.filter(card => card.color === color).length;
}
