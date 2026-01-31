/**
 * 牌組邏輯 - 純函數
 *
 * 負責牌組初始化、洗牌、發牌等操作。
 * 工單 0164：從 server.js 提取
 *
 * @module logic/cardLogic
 */

const CARD_COLORS = ['red', 'yellow', 'green', 'blue'];
const CARD_COUNTS = { red: 2, yellow: 3, green: 4, blue: 5 };
const TOTAL_CARDS = 14;
const HIDDEN_CARDS_COUNT = 2;

/**
 * 建立完整牌組
 * @returns {Object[]} 牌組陣列，每張牌含 { id, color }
 */
function createDeck() {
  const deck = [];
  let cardId = 1;

  for (const color of CARD_COLORS) {
    const count = CARD_COUNTS[color];
    for (let i = 0; i < count; i++) {
      deck.push({ id: `card_${cardId++}`, color });
    }
  }

  return deck;
}

/**
 * 洗牌（Fisher-Yates 演算法）
 * @param {Object[]} deck - 牌組
 * @returns {Object[]} 洗好的牌組（新陣列）
 */
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 發牌給玩家
 * @param {Object[]} deck - 牌組
 * @param {number} playerCount - 玩家數量
 * @returns {{ hiddenCards: Object[], playerHands: Object[][] }}
 */
function dealCards(deck, playerCount) {
  const hiddenCards = [deck[0], deck[1]];
  const remainingDeck = deck.slice(2);

  const playerHands = Array.from({ length: playerCount }, () => []);

  remainingDeck.forEach((card, index) => {
    playerHands[index % playerCount].push(card);
  });

  return { hiddenCards, playerHands };
}

module.exports = {
  CARD_COLORS,
  CARD_COUNTS,
  TOTAL_CARDS,
  HIDDEN_CARDS_COUNT,
  createDeck,
  shuffleDeck,
  dealCards
};
