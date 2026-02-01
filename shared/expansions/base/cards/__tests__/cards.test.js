/**
 * 卡牌系統測試
 * @module expansions/base/cards/__tests__/cards.test
 */

const {
  BASE_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
} = require('../definitions');

const {
  Card,
  CardFactory,
  cardFactory,
} = require('../cardFactory');

const { TRAIT_TYPES } = require('../../traits/definitions');

// ==================== 卡牌定義測試 ====================

describe('Card Definitions', () => {
  test('should have 84 total cards', () => {
    expect(getTotalCardCount()).toBe(84);
  });

  test('should match EXPECTED_TOTAL', () => {
    expect(getTotalCardCount()).toBe(EXPECTED_TOTAL);
  });

  test('should have unique card IDs', () => {
    const ids = BASE_CARDS.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('should have 21 card definitions', () => {
    expect(BASE_CARDS.length).toBe(21);
  });

  test('all cards should have count of 4', () => {
    for (const card of BASE_CARDS) {
      expect(card.count).toBe(4);
    }
  });

  test('getCardDefinition should find card by ID', () => {
    const card = getCardDefinition('BASE_001');
    expect(card).toBeDefined();
    expect(card.id).toBe('BASE_001');
    expect(card.frontTrait).toBe(TRAIT_TYPES.CARNIVORE);
    expect(card.backTrait).toBe(TRAIT_TYPES.CARNIVORE);
  });

  test('getCardDefinition should return null for unknown ID', () => {
    expect(getCardDefinition('UNKNOWN')).toBeNull();
  });

  test('getCardsByTrait should find all carnivore cards', () => {
    const cards = getCardsByTrait(TRAIT_TYPES.CARNIVORE);
    expect(cards.length).toBeGreaterThan(0);

    // 應該包含 BASE_001, BASE_002, BASE_013, BASE_021
    const ids = cards.map(c => c.id);
    expect(ids).toContain('BASE_001');
    expect(ids).toContain('BASE_002');
  });

  test('validateCardDefinitions should pass', () => {
    const result = validateCardDefinitions();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('all frontTrait should be valid', () => {
    const validTraits = Object.values(TRAIT_TYPES);
    for (const card of BASE_CARDS) {
      expect(validTraits).toContain(card.frontTrait);
    }
  });

  test('all backTrait should be valid', () => {
    const validTraits = Object.values(TRAIT_TYPES);
    for (const card of BASE_CARDS) {
      expect(validTraits).toContain(card.backTrait);
    }
  });
});

// ==================== Card 類別測試 ====================

describe('Card', () => {
  let card;

  beforeEach(() => {
    card = new Card('BASE_001', 'base_001_1', TRAIT_TYPES.CARNIVORE, TRAIT_TYPES.FAT_TISSUE);
  });

  test('should create card with correct properties', () => {
    expect(card.id).toBe('BASE_001');
    expect(card.instanceId).toBe('base_001_1');
    expect(card.frontTrait).toBe(TRAIT_TYPES.CARNIVORE);
    expect(card.backTrait).toBe(TRAIT_TYPES.FAT_TISSUE);
    expect(card.expansion).toBe('base');
    expect(card.selectedSide).toBeNull();
  });

  test('should select front side', () => {
    card.selectSide('front');
    expect(card.selectedSide).toBe('front');
    expect(card.getSelectedTrait()).toBe(TRAIT_TYPES.CARNIVORE);
  });

  test('should select back side', () => {
    card.selectSide('back');
    expect(card.selectedSide).toBe('back');
    expect(card.getSelectedTrait()).toBe(TRAIT_TYPES.FAT_TISSUE);
  });

  test('should support chained selectSide', () => {
    const result = card.selectSide('front');
    expect(result).toBe(card);
  });

  test('should throw on invalid side', () => {
    expect(() => card.selectSide('invalid')).toThrow('Invalid side');
  });

  test('should clear selection', () => {
    card.selectSide('front');
    card.clearSelection();
    expect(card.selectedSide).toBeNull();
    expect(card.getSelectedTrait()).toBeNull();
  });

  test('getFrontTraitInfo should return trait info', () => {
    const info = card.getFrontTraitInfo();
    expect(info).toBeDefined();
    expect(info.type).toBe(TRAIT_TYPES.CARNIVORE);
    expect(info.name).toBe('肉食');
  });

  test('getBackTraitInfo should return trait info', () => {
    const info = card.getBackTraitInfo();
    expect(info).toBeDefined();
    expect(info.type).toBe(TRAIT_TYPES.FAT_TISSUE);
    expect(info.name).toBe('脂肪組織');
  });

  test('getSelectedTraitInfo should return info for selected trait', () => {
    card.selectSide('front');
    const info = card.getSelectedTraitInfo();
    expect(info).toBeDefined();
    expect(info.name).toBe('肉食');
  });

  test('getSelectedTraitInfo should return null when not selected', () => {
    expect(card.getSelectedTraitInfo()).toBeNull();
  });

  test('isSameBothSides should return false for different traits', () => {
    expect(card.isSameBothSides()).toBe(false);
  });

  test('isSameBothSides should return true for same traits', () => {
    const sameCard = new Card('BASE_001', 'test', TRAIT_TYPES.CARNIVORE, TRAIT_TYPES.CARNIVORE);
    expect(sameCard.isSameBothSides()).toBe(true);
  });

  test('should serialize to JSON', () => {
    card.selectSide('front');
    const json = card.toJSON();

    expect(json.id).toBe('BASE_001');
    expect(json.instanceId).toBe('base_001_1');
    expect(json.frontTrait).toBe(TRAIT_TYPES.CARNIVORE);
    expect(json.backTrait).toBe(TRAIT_TYPES.FAT_TISSUE);
    expect(json.expansion).toBe('base');
    expect(json.selectedSide).toBe('front');
  });

  test('should deserialize from JSON', () => {
    card.selectSide('front');
    const json = card.toJSON();
    const restored = Card.fromJSON(json);

    expect(restored.id).toBe(card.id);
    expect(restored.instanceId).toBe(card.instanceId);
    expect(restored.frontTrait).toBe(card.frontTrait);
    expect(restored.backTrait).toBe(card.backTrait);
    expect(restored.expansion).toBe(card.expansion);
    expect(restored.selectedSide).toBe(card.selectedSide);
    expect(restored.getSelectedTrait()).toBe(card.getSelectedTrait());
  });

  test('should deserialize without selected side', () => {
    const json = card.toJSON();
    const restored = Card.fromJSON(json);
    expect(restored.selectedSide).toBeNull();
  });
});

// ==================== CardFactory 測試 ====================

describe('CardFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new CardFactory();
  });

  test('should create single card', () => {
    const cardDef = BASE_CARDS[0];
    const card = factory.createCard(cardDef, 'base');

    expect(card).toBeInstanceOf(Card);
    expect(card.id).toBe(cardDef.id);
    expect(card.frontTrait).toBe(cardDef.frontTrait);
    expect(card.backTrait).toBe(cardDef.backTrait);
    expect(card.expansion).toBe('base');
    expect(card.instanceId).toBeTruthy();
  });

  test('should create cards with unique instance IDs', () => {
    const cardDef = BASE_CARDS[0];
    const card1 = factory.createCard(cardDef, 'base');
    const card2 = factory.createCard(cardDef, 'base');

    expect(card1.instanceId).not.toBe(card2.instanceId);
  });

  test('should create multiple cards from definition', () => {
    const cardDef = BASE_CARDS[0];
    const cards = factory.createCards(cardDef, 'base');

    expect(cards.length).toBe(cardDef.count);

    // 所有卡牌應有相同定義但不同 instanceId
    const instanceIds = new Set(cards.map(c => c.instanceId));
    expect(instanceIds.size).toBe(cardDef.count);
  });

  test('should create full deck with correct count', () => {
    const deck = factory.createDeck(BASE_CARDS, 'base');
    expect(deck.length).toBe(84);
  });

  test('should assign unique instance IDs in deck', () => {
    const deck = factory.createDeck(BASE_CARDS, 'base');
    const instanceIds = deck.map(c => c.instanceId);
    const uniqueIds = new Set(instanceIds);
    expect(uniqueIds.size).toBe(84);
  });

  test('should reset counter on createDeck', () => {
    factory.createCard(BASE_CARDS[0], 'base');
    factory.createCard(BASE_CARDS[0], 'base');

    // createDeck 應該重置計數器
    const deck = factory.createDeck(BASE_CARDS, 'base');
    expect(deck[0].instanceId).toContain('_1');
  });

  test('should shuffle deck', () => {
    const deck1 = factory.createDeck(BASE_CARDS, 'base');
    const deck2 = factory.shuffle([...deck1]);

    // 洗牌後長度相同
    expect(deck2.length).toBe(deck1.length);

    // 洗牌後順序應該不同（極小機率會相同）
    const sameOrder = deck1.every((card, i) => card.instanceId === deck2[i].instanceId);
    expect(sameOrder).toBe(false);
  });

  test('shuffle should not modify original deck', () => {
    const deck = factory.createDeck(BASE_CARDS, 'base');
    const originalFirst = deck[0].instanceId;

    factory.shuffle(deck);

    expect(deck[0].instanceId).toBe(originalFirst);
  });

  test('should create shuffled deck', () => {
    const deck1 = factory.createShuffledDeck(BASE_CARDS, 'base');
    const deck2 = factory.createShuffledDeck(BASE_CARDS, 'base');

    expect(deck1.length).toBe(84);
    expect(deck2.length).toBe(84);

    // 兩次洗牌應該產生不同順序
    const sameOrder = deck1.every((card, i) => card.id === deck2[i].id);
    expect(sameOrder).toBe(false);
  });

  test('reset should reset counter', () => {
    factory.createCard(BASE_CARDS[0], 'base');
    factory.createCard(BASE_CARDS[0], 'base');

    factory.reset();

    const card = factory.createCard(BASE_CARDS[0], 'base');
    expect(card.instanceId).toContain('_1');
  });
});

// ==================== 預設工廠實例測試 ====================

describe('cardFactory (default instance)', () => {
  test('should be a CardFactory instance', () => {
    expect(cardFactory).toBeInstanceOf(CardFactory);
  });

  test('should create deck', () => {
    const deck = cardFactory.createDeck(BASE_CARDS, 'base');
    expect(deck.length).toBe(84);
  });
});

// ==================== 整合測試 ====================

describe('Card System Integration', () => {
  test('all cards in deck should have valid trait info', () => {
    const deck = cardFactory.createDeck(BASE_CARDS, 'base');

    for (const card of deck) {
      const frontInfo = card.getFrontTraitInfo();
      const backInfo = card.getBackTraitInfo();

      expect(frontInfo).toBeDefined();
      expect(backInfo).toBeDefined();
      expect(frontInfo.name).toBeTruthy();
      expect(backInfo.name).toBeTruthy();
    }
  });

  test('deck should contain all trait types', () => {
    const deck = cardFactory.createDeck(BASE_CARDS, 'base');
    const traitSet = new Set();

    for (const card of deck) {
      traitSet.add(card.frontTrait);
      traitSet.add(card.backTrait);
    }

    // 應該包含大部分性狀
    expect(traitSet.has(TRAIT_TYPES.CARNIVORE)).toBe(true);
    expect(traitSet.has(TRAIT_TYPES.FAT_TISSUE)).toBe(true);
    expect(traitSet.has(TRAIT_TYPES.CAMOUFLAGE)).toBe(true);
    expect(traitSet.has(TRAIT_TYPES.COMMUNICATION)).toBe(true);
  });

  test('card selection should work correctly', () => {
    const deck = cardFactory.createDeck(BASE_CARDS, 'base');
    const card = deck[0];

    // 模擬玩家選擇使用正面
    card.selectSide('front');
    const trait = card.getSelectedTrait();
    const traitInfo = card.getSelectedTraitInfo();

    expect(trait).toBeTruthy();
    expect(traitInfo).toBeDefined();
    expect(traitInfo.type).toBe(trait);
  });

  test('card JSON round-trip should preserve all data', () => {
    const deck = cardFactory.createDeck(BASE_CARDS, 'base');

    for (const card of deck.slice(0, 10)) {
      card.selectSide(Math.random() > 0.5 ? 'front' : 'back');

      const json = card.toJSON();
      const restored = Card.fromJSON(json);

      expect(restored.id).toBe(card.id);
      expect(restored.instanceId).toBe(card.instanceId);
      expect(restored.frontTrait).toBe(card.frontTrait);
      expect(restored.backTrait).toBe(card.backTrait);
      expect(restored.expansion).toBe(card.expansion);
      expect(restored.selectedSide).toBe(card.selectedSide);
    }
  });
});
