/**
 * 牌組工具函數單元測試
 * 工作單 0003, 0004, 0005
 */

import { createDeck, shuffleDeck, dealCards } from './cardUtils';
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
