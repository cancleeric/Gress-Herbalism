/**
 * 深海生態擴充包整合測試
 * @module expansions/deepSea/__tests__/expansion.test
 */

const { deepSeaExpansion, DEEP_SEA_TRAIT_TYPES, DEEP_SEA_EXPECTED_TOTAL } = require('../index');
const { validateDeepSeaCardDefinitions } = require('../cards');
const {
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaTotalCardCount,
} = require('../traits/definitions');

// ===== 擴充包基本資訊測試 =====

describe('deepSeaExpansion - Basic Info', () => {
  test('should have correct id', () => {
    expect(deepSeaExpansion.id).toBe('deep-sea');
  });

  test('should have correct version format', () => {
    expect(deepSeaExpansion.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('should require base expansion', () => {
    expect(deepSeaExpansion.requires).toContain('base');
  });

  test('should have no incompatibilities', () => {
    expect(deepSeaExpansion.incompatible).toEqual([]);
  });

  test('should have name and nameEn', () => {
    expect(deepSeaExpansion.name).toBe('深海生態');
    expect(deepSeaExpansion.nameEn).toBe('Deep Sea Ecology');
  });
});

// ===== 性狀定義測試 =====

describe('deepSeaExpansion - Trait Definitions', () => {
  test('should have 6 trait types', () => {
    expect(getAllDeepSeaTraitTypes().length).toBe(6);
  });

  test('should include all expected trait types', () => {
    const types = getAllDeepSeaTraitTypes();
    expect(types).toContain(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
    expect(types).toContain(DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE);
    expect(types).toContain(DEEP_SEA_TRAIT_TYPES.SCHOOLING);
    expect(types).toContain(DEEP_SEA_TRAIT_TYPES.GAPING_MAW);
    expect(types).toContain(DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION);
    expect(types).toContain(DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION);
  });

  test('each trait definition should have required fields', () => {
    for (const [type, def] of Object.entries(DEEP_SEA_TRAIT_DEFINITIONS)) {
      expect(def.type).toBe(type);
      expect(def.name).toBeTruthy();
      expect(def.nameEn).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.expansion).toBe('deep-sea');
      expect(typeof def.isInteractive).toBe('boolean');
      expect(typeof def.isStackable).toBe('boolean');
      expect(Array.isArray(def.incompatible)).toBe(true);
    }
  });

  test('schooling should be interactive', () => {
    const interactiveTraits = getDeepSeaInteractiveTraits();
    expect(interactiveTraits).toContain(DEEP_SEA_TRAIT_TYPES.SCHOOLING);
  });

  test('no deep sea traits should be stackable', () => {
    for (const def of Object.values(DEEP_SEA_TRAIT_DEFINITIONS)) {
      expect(def.isStackable).toBe(false);
    }
  });

  test('deep dive should be in defense category', () => {
    expect(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.DEEP_DIVE].category).toBe('defense');
  });

  test('schooling should be in interactive category', () => {
    expect(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.SCHOOLING].category).toBe('interactive');
  });

  test('gaping maw should be in carnivore category', () => {
    expect(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.GAPING_MAW].category).toBe('carnivore');
  });
});

// ===== 卡牌測試 =====

describe('deepSeaExpansion - Cards', () => {
  test('should have 24 total cards', () => {
    expect(DEEP_SEA_EXPECTED_TOTAL).toBe(24);
    expect(deepSeaExpansion.cards.reduce((s, c) => s + c.count, 0)).toBe(24);
  });

  test('card definitions should be valid', () => {
    const validation = validateDeepSeaCardDefinitions();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('trait card count should match expected total', () => {
    expect(getDeepSeaTotalCardCount()).toBe(DEEP_SEA_EXPECTED_TOTAL);
  });

  test('each card should have valid id, frontTrait, backTrait, count', () => {
    for (const card of deepSeaExpansion.cards) {
      expect(card.id).toBeTruthy();
      expect(card.frontTrait).toBeTruthy();
      expect(card.backTrait).toBeTruthy();
      expect(card.count).toBeGreaterThan(0);
    }
  });
});

// ===== 性狀處理器測試 =====

describe('deepSeaExpansion - Trait Handlers', () => {
  test('should have handler instances for all 6 traits', () => {
    expect(Object.keys(deepSeaExpansion.traits).length).toBe(6);
    for (const traitType of getAllDeepSeaTraitTypes()) {
      expect(deepSeaExpansion.traits[traitType]).toBeDefined();
    }
  });

  test('each handler should have correct type', () => {
    for (const [type, handler] of Object.entries(deepSeaExpansion.traits)) {
      expect(handler.type).toBe(type);
    }
  });
});

// ===== createDeck 測試 =====

describe('deepSeaExpansion - createDeck', () => {
  test('should create 24 card instances', () => {
    const deck = deepSeaExpansion.createDeck();
    expect(deck.length).toBe(24);
  });

  test('each card should have required fields', () => {
    const deck = deepSeaExpansion.createDeck();
    for (const card of deck) {
      expect(card.id).toBeTruthy();
      expect(card.frontTrait).toBeTruthy();
      expect(card.backTrait).toBeTruthy();
      expect(card.expansion).toBe('deep-sea');
      expect(card.selectedSide).toBeNull();
    }
  });

  test('createShuffledDeck should return 24 cards', () => {
    const deck = deepSeaExpansion.createShuffledDeck();
    expect(deck.length).toBe(24);
  });
});

// ===== validate 測試 =====

describe('deepSeaExpansion - validate', () => {
  test('should pass validation', () => {
    const result = deepSeaExpansion.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ===== ExpansionRegistry 整合測試 =====

describe('deepSeaExpansion - Registry Integration', () => {
  const { ExpansionRegistry } = require('../../ExpansionRegistry');

  test('should register successfully with ExpansionRegistry', () => {
    const registry = new ExpansionRegistry();

    // 先註冊 base（因為 deep-sea 依賴它）
    registry.register({
      id: 'base',
      name: 'Base',
      version: '1.0.0',
      traits: {},
      cards: [],
    });
    registry.enable('base');

    expect(() => registry.register(deepSeaExpansion)).not.toThrow();
    expect(registry.getExpansion('deep-sea')).toBeDefined();
  });

  test('should enable successfully after base is enabled', () => {
    const registry = new ExpansionRegistry();

    registry.register({
      id: 'base',
      name: 'Base',
      version: '1.0.0',
      traits: {},
      cards: [],
    });
    registry.enable('base');
    registry.register(deepSeaExpansion);
    registry.enable('deep-sea');

    expect(registry.isEnabled('deep-sea')).toBe(true);
  });

  test('should disable successfully', () => {
    const registry = new ExpansionRegistry();

    registry.register({
      id: 'base',
      name: 'Base',
      version: '1.0.0',
      traits: {},
      cards: [],
    });
    registry.enable('base');
    registry.register(deepSeaExpansion);
    registry.enable('deep-sea');
    registry.disable('deep-sea');

    expect(registry.isEnabled('deep-sea')).toBe(false);
  });

  test('should not enable without base expansion enabled', () => {
    const registry = new ExpansionRegistry();

    registry.register({
      id: 'base',
      name: 'Base',
      version: '1.0.0',
      traits: {},
      cards: [],
    });
    // 不 enable base
    registry.register(deepSeaExpansion);

    expect(() => registry.enable('deep-sea')).toThrow();
  });
});
