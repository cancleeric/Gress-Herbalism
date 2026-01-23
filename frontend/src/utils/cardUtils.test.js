/**
 * 牌組工具函數單元測試
 * 工作單 0003, 0004, 0005, 0006
 */

import {
  createDeck,
  shuffleDeck,
  dealCards,
  getCardsByColor,
  hasCard,
  removeCard,
  addCard,
  countCardsByColor
} from './cardUtils';
import {
  COLORS,
  CARD_COUNTS,
  TOTAL_CARDS,
  ALL_COLORS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  HIDDEN_CARDS_COUNT
} from '../../../shared/constants.js';

describe('createDeck - 工作單 0003', () => {
  let deck;

  beforeEach(() => {
    deck = createDeck();
  });

  test('應建立 14 張牌', () => {
    expect(deck).toHaveLength(TOTAL_CARDS);
  });

  test('每張牌應有正確的屬性', () => {
    deck.forEach(card => {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('color');
      expect(card).toHaveProperty('isHidden');
      expect(typeof card.id).toBe('string');
      expect(typeof card.color).toBe('string');
      expect(typeof card.isHidden).toBe('boolean');
    });
  });

  test('所有牌的 isHidden 應為 false', () => {
    deck.forEach(card => {
      expect(card.isHidden).toBe(false);
    });
  });

  test('應有正確數量的各顏色牌', () => {
    ALL_COLORS.forEach(color => {
      const colorCards = deck.filter(card => card.color === color);
      expect(colorCards).toHaveLength(CARD_COUNTS[color]);
    });
  });

  test('紅色應有 2 張牌', () => {
    const redCards = deck.filter(card => card.color === 'red');
    expect(redCards).toHaveLength(2);
  });

  test('黃色應有 3 張牌', () => {
    const yellowCards = deck.filter(card => card.color === 'yellow');
    expect(yellowCards).toHaveLength(3);
  });

  test('綠色應有 4 張牌', () => {
    const greenCards = deck.filter(card => card.color === 'green');
    expect(greenCards).toHaveLength(4);
  });

  test('藍色應有 5 張牌', () => {
    const blueCards = deck.filter(card => card.color === 'blue');
    expect(blueCards).toHaveLength(5);
  });

  test('每張牌的 id 應符合格式 "顏色-編號"', () => {
    deck.forEach(card => {
      const [color, number] = card.id.split('-');
      expect(ALL_COLORS).toContain(color);
      expect(parseInt(number)).toBeGreaterThan(0);
    });
  });

  test('所有牌的 id 應該是唯一的', () => {
    const ids = deck.map(card => card.id);
    const uniqueIds = [...new Set(ids)];
    expect(uniqueIds).toHaveLength(ids.length);
  });

  test('牌的 id 應與 color 一致', () => {
    deck.forEach(card => {
      const colorFromId = card.id.split('-')[0];
      expect(colorFromId).toBe(card.color);
    });
  });
});

describe('shuffleDeck - 工作單 0004', () => {
  let originalDeck;

  beforeEach(() => {
    originalDeck = createDeck();
  });

  test('洗牌後應返回相同數量的牌', () => {
    const shuffled = shuffleDeck(originalDeck);
    expect(shuffled).toHaveLength(originalDeck.length);
  });

  test('洗牌不應修改原陣列', () => {
    const originalCopy = JSON.parse(JSON.stringify(originalDeck));
    shuffleDeck(originalDeck);
    expect(originalDeck).toEqual(originalCopy);
  });

  test('洗牌後應包含所有原有的牌', () => {
    const shuffled = shuffleDeck(originalDeck);
    const originalIds = originalDeck.map(card => card.id).sort();
    const shuffledIds = shuffled.map(card => card.id).sort();
    expect(shuffledIds).toEqual(originalIds);
  });

  test('洗牌應產生不同順序（多次測試確保隨機性）', () => {
    // 多次洗牌，至少有一次順序應該不同
    let hasDifferentOrder = false;
    for (let i = 0; i < 10; i++) {
      const shuffled = shuffleDeck(originalDeck);
      const originalOrder = originalDeck.map(card => card.id).join(',');
      const shuffledOrder = shuffled.map(card => card.id).join(',');
      if (originalOrder !== shuffledOrder) {
        hasDifferentOrder = true;
        break;
      }
    }
    expect(hasDifferentOrder).toBe(true);
  });

  test('空陣列洗牌應返回空陣列', () => {
    const shuffled = shuffleDeck([]);
    expect(shuffled).toEqual([]);
  });

  test('單張牌洗牌應返回相同的牌', () => {
    const singleCard = [{ id: 'red-1', color: 'red', isHidden: false }];
    const shuffled = shuffleDeck(singleCard);
    expect(shuffled).toHaveLength(1);
    expect(shuffled[0].id).toBe('red-1');
  });
});

describe('dealCards - 工作單 0005', () => {
  let deck;

  beforeEach(() => {
    deck = shuffleDeck(createDeck());
  });

  test('應正確抽出 2 張蓋牌', () => {
    const result = dealCards(deck, 3);
    expect(result.hiddenCards).toHaveLength(HIDDEN_CARDS_COUNT);
  });

  test('蓋牌的 isHidden 應為 true', () => {
    const result = dealCards(deck, 3);
    result.hiddenCards.forEach(card => {
      expect(card.isHidden).toBe(true);
    });
  });

  test('3 人遊戲時每人應有 4 張牌', () => {
    const result = dealCards(deck, 3);
    expect(result.playerHands).toHaveLength(3);
    result.playerHands.forEach(hand => {
      expect(hand).toHaveLength(4);
    });
  });

  test('4 人遊戲時每人應有 3 張牌', () => {
    const result = dealCards(deck, 4);
    expect(result.playerHands).toHaveLength(4);
    result.playerHands.forEach(hand => {
      expect(hand).toHaveLength(3);
    });
  });

  test('所有牌應被分配完畢', () => {
    const result = dealCards(deck, 3);
    const hiddenCount = result.hiddenCards.length;
    const handCount = result.playerHands.reduce((sum, hand) => sum + hand.length, 0);
    expect(hiddenCount + handCount).toBe(TOTAL_CARDS);
  });

  test('不應修改原牌組', () => {
    const originalDeck = createDeck();
    const originalCopy = JSON.parse(JSON.stringify(originalDeck));
    dealCards(originalDeck, 3);
    expect(originalDeck).toEqual(originalCopy);
  });

  test('玩家手牌不應包含蓋牌', () => {
    const result = dealCards(deck, 3);
    const hiddenIds = result.hiddenCards.map(card => card.id);
    result.playerHands.forEach(hand => {
      hand.forEach(card => {
        expect(hiddenIds).not.toContain(card.id);
      });
    });
  });

  test('玩家手牌的 isHidden 應為 false', () => {
    const result = dealCards(deck, 3);
    result.playerHands.forEach(hand => {
      hand.forEach(card => {
        expect(card.isHidden).toBe(false);
      });
    });
  });

  test('玩家數量少於 3 人應拋出錯誤', () => {
    expect(() => dealCards(deck, 2)).toThrow();
  });

  test('玩家數量多於 4 人應拋出錯誤', () => {
    expect(() => dealCards(deck, 5)).toThrow();
  });

  test('牌組數量不足應拋出錯誤', () => {
    const smallDeck = [{ id: 'red-1', color: 'red', isHidden: false }];
    expect(() => dealCards(smallDeck, 3)).toThrow();
  });

  test('所有牌的 id 應該是唯一的', () => {
    const result = dealCards(deck, 3);
    const allIds = [
      ...result.hiddenCards.map(card => card.id),
      ...result.playerHands.flat().map(card => card.id)
    ];
    const uniqueIds = [...new Set(allIds)];
    expect(uniqueIds).toHaveLength(allIds.length);
  });
});

describe('手牌管理輔助函數 - 工作單 0006', () => {
  let hand;

  beforeEach(() => {
    hand = [
      { id: 'red-1', color: 'red', isHidden: false },
      { id: 'red-2', color: 'red', isHidden: false },
      { id: 'yellow-1', color: 'yellow', isHidden: false },
      { id: 'blue-1', color: 'blue', isHidden: false }
    ];
  });

  describe('getCardsByColor', () => {
    test('應返回指定顏色的所有牌', () => {
      const redCards = getCardsByColor(hand, 'red');
      expect(redCards).toHaveLength(2);
      redCards.forEach(card => {
        expect(card.color).toBe('red');
      });
    });

    test('沒有該顏色時應返回空陣列', () => {
      const greenCards = getCardsByColor(hand, 'green');
      expect(greenCards).toHaveLength(0);
    });

    test('空手牌應返回空陣列', () => {
      const result = getCardsByColor([], 'red');
      expect(result).toEqual([]);
    });
  });

  describe('hasCard', () => {
    test('手牌中有該牌時應返回 true', () => {
      expect(hasCard(hand, 'red-1')).toBe(true);
    });

    test('手牌中沒有該牌時應返回 false', () => {
      expect(hasCard(hand, 'green-1')).toBe(false);
    });

    test('空手牌應返回 false', () => {
      expect(hasCard([], 'red-1')).toBe(false);
    });
  });

  describe('removeCard', () => {
    test('應正確移除指定的牌', () => {
      const newHand = removeCard(hand, 'red-1');
      expect(newHand).toHaveLength(3);
      expect(hasCard(newHand, 'red-1')).toBe(false);
    });

    test('不應修改原陣列', () => {
      const originalLength = hand.length;
      removeCard(hand, 'red-1');
      expect(hand).toHaveLength(originalLength);
    });

    test('移除不存在的牌應返回相同的陣列', () => {
      const newHand = removeCard(hand, 'green-1');
      expect(newHand).toHaveLength(hand.length);
    });

    test('空手牌應返回空陣列', () => {
      const result = removeCard([], 'red-1');
      expect(result).toEqual([]);
    });
  });

  describe('addCard', () => {
    test('應正確加入牌', () => {
      const newCard = { id: 'green-1', color: 'green', isHidden: false };
      const newHand = addCard(hand, newCard);
      expect(newHand).toHaveLength(5);
      expect(hasCard(newHand, 'green-1')).toBe(true);
    });

    test('不應修改原陣列', () => {
      const originalLength = hand.length;
      const newCard = { id: 'green-1', color: 'green', isHidden: false };
      addCard(hand, newCard);
      expect(hand).toHaveLength(originalLength);
    });

    test('新牌應加在陣列最後', () => {
      const newCard = { id: 'green-1', color: 'green', isHidden: false };
      const newHand = addCard(hand, newCard);
      expect(newHand[newHand.length - 1].id).toBe('green-1');
    });

    test('空手牌加入牌後應有一張牌', () => {
      const newCard = { id: 'red-1', color: 'red', isHidden: false };
      const newHand = addCard([], newCard);
      expect(newHand).toHaveLength(1);
    });
  });

  describe('countCardsByColor', () => {
    test('應正確計算指定顏色的牌數', () => {
      expect(countCardsByColor(hand, 'red')).toBe(2);
      expect(countCardsByColor(hand, 'yellow')).toBe(1);
      expect(countCardsByColor(hand, 'blue')).toBe(1);
    });

    test('沒有該顏色時應返回 0', () => {
      expect(countCardsByColor(hand, 'green')).toBe(0);
    });

    test('空手牌應返回 0', () => {
      expect(countCardsByColor([], 'red')).toBe(0);
    });
  });
});
