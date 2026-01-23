/**
 * 牌組工具函數
 *
 * 此檔案包含牌組相關的工具函數
 *
 * @module cardUtils
 */

import { COLORS, CARD_COUNTS, ALL_COLORS } from '../../../shared/constants.js';

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
