/**
 * cardLogic 單元測試
 * 工單 0164
 */

const {
  CARD_COLORS,
  CARD_COUNTS,
  TOTAL_CARDS,
  createDeck,
  shuffleDeck,
  dealCards
} = require('../../logic/herbalism/cardLogic');

describe('cardLogic', () => {
  describe('常數', () => {
    test('CARD_COLORS 應包含 4 種顏色', () => {
      expect(CARD_COLORS).toEqual(['red', 'yellow', 'green', 'blue']);
    });

    test('CARD_COUNTS 應符合遊戲規則', () => {
      expect(CARD_COUNTS.red).toBe(2);
      expect(CARD_COUNTS.yellow).toBe(3);
      expect(CARD_COUNTS.green).toBe(4);
      expect(CARD_COUNTS.blue).toBe(5);
    });

    test('TOTAL_CARDS 應為 14', () => {
      expect(TOTAL_CARDS).toBe(14);
    });
  });

  describe('createDeck', () => {
    test('應產生 14 張牌', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(14);
    });

    test('應包含正確的牌組配置', () => {
      const deck = createDeck();
      expect(deck.filter(c => c.color === 'red')).toHaveLength(2);
      expect(deck.filter(c => c.color === 'yellow')).toHaveLength(3);
      expect(deck.filter(c => c.color === 'green')).toHaveLength(4);
      expect(deck.filter(c => c.color === 'blue')).toHaveLength(5);
    });

    test('每張牌應有唯一 id', () => {
      const deck = createDeck();
      const ids = deck.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(14);
    });

    test('每張牌應有 id 和 color 屬性', () => {
      const deck = createDeck();
      deck.forEach(card => {
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('color');
        expect(typeof card.id).toBe('string');
        expect(CARD_COLORS).toContain(card.color);
      });
    });
  });

  describe('shuffleDeck', () => {
    test('洗牌後牌數應相同', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).toHaveLength(deck.length);
    });

    test('洗牌應返回新陣列', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).not.toBe(deck);
    });

    test('洗牌後牌面組成應相同', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const deckColors = deck.map(c => c.color).sort();
      const shuffledColors = shuffled.map(c => c.color).sort();
      expect(shuffledColors).toEqual(deckColors);
    });

    test('不應修改原始陣列', () => {
      const deck = createDeck();
      const originalIds = deck.map(c => c.id);
      shuffleDeck(deck);
      const afterIds = deck.map(c => c.id);
      expect(afterIds).toEqual(originalIds);
    });
  });

  describe('dealCards', () => {
    test('3 人遊戲應正確發牌', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealCards(deck, 3);

      expect(result.hiddenCards).toHaveLength(2);
      expect(result.playerHands).toHaveLength(3);
      // 14 - 2 = 12 張，12 / 3 = 4 張/人
      result.playerHands.forEach(hand => {
        expect(hand).toHaveLength(4);
      });
    });

    test('4 人遊戲應正確發牌', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealCards(deck, 4);

      expect(result.hiddenCards).toHaveLength(2);
      expect(result.playerHands).toHaveLength(4);
      // 14 - 2 = 12 張，12 / 4 = 3 張/人
      result.playerHands.forEach(hand => {
        expect(hand).toHaveLength(3);
      });
    });

    test('發出的牌總數應等於原始牌數', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealCards(deck, 3);

      const totalDealt = result.hiddenCards.length +
        result.playerHands.reduce((sum, hand) => sum + hand.length, 0);
      expect(totalDealt).toBe(14);
    });

    test('蓋牌應是牌組前兩張', () => {
      const deck = createDeck(); // 不洗牌，方便驗證
      const result = dealCards(deck, 3);

      expect(result.hiddenCards[0]).toBe(deck[0]);
      expect(result.hiddenCards[1]).toBe(deck[1]);
    });
  });
});
