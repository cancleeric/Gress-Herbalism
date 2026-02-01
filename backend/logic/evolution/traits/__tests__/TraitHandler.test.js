/**
 * TraitHandler 單元測試
 */

const TraitHandler = require('../TraitHandler');
const { TraitRegistry, globalTraitRegistry } = require('../traitRegistry');

// ========== 測試用的具體實作 ==========

class TestHandler extends TraitHandler {
  constructor(definition) {
    super({
      name: 'Test',
      description: 'Test trait',
      category: 'test',
      ...definition,
    });
  }
}

// ========== TraitHandler 測試 ==========

describe('TraitHandler', () => {
  describe('constructor', () => {
    test('should throw when instantiated directly', () => {
      expect(() => new TraitHandler({ type: 'test' })).toThrow('abstract');
    });

    test('should throw when definition has no type', () => {
      expect(() => new TestHandler({})).toThrow('requires a definition with type');
    });

    test('should set default values', () => {
      const handler = new TestHandler({ type: 'test' });

      expect(handler.type).toBe('test');
      expect(handler.name).toBe('Test');
      expect(handler.foodBonus).toBe(0);
      expect(handler.isInteractive).toBe(false);
      expect(handler.isStackable).toBe(false);
      expect(handler.incompatible).toEqual([]);
      expect(handler.expansion).toBe('base');
    });

    test('should accept all properties', () => {
      const handler = new TestHandler({
        type: 'custom',
        name: 'Custom Name',
        foodBonus: 2,
        description: 'Custom description',
        category: 'special',
        isInteractive: true,
        isStackable: true,
        incompatible: ['other'],
        expansion: 'expansion1',
        isParasite: true,
      });

      expect(handler.type).toBe('custom');
      expect(handler.name).toBe('Custom Name');
      expect(handler.foodBonus).toBe(2);
      expect(handler.description).toBe('Custom description');
      expect(handler.category).toBe('special');
      expect(handler.isInteractive).toBe(true);
      expect(handler.isStackable).toBe(true);
      expect(handler.incompatible).toEqual(['other']);
      expect(handler.expansion).toBe('expansion1');
      expect(handler.isParasite).toBe(true);
    });
  });

  describe('canPlace', () => {
    test('should reject placing on enemy creature (non-parasite)', () => {
      const handler = new TestHandler({ type: 'test' });
      const result = handler.canPlace({
        creature: { ownerId: 'enemy' },
        player: { id: 'player' },
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('自己的生物');
    });

    test('should allow placing on own creature', () => {
      const handler = new TestHandler({ type: 'test' });
      const result = handler.canPlace({
        creature: { ownerId: 'player', traits: [] },
        player: { id: 'player' },
      });

      expect(result.valid).toBe(true);
    });

    test('should require placing parasite on enemy', () => {
      const handler = new TestHandler({ type: 'parasite', isParasite: true });
      const result = handler.canPlace({
        creature: { ownerId: 'player' },
        player: { id: 'player' },
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('對手');
    });

    test('should allow placing parasite on enemy', () => {
      const handler = new TestHandler({ type: 'parasite', isParasite: true });
      const result = handler.canPlace({
        creature: { ownerId: 'enemy', traits: [] },
        player: { id: 'player' },
      });

      expect(result.valid).toBe(true);
    });

    test('should reject duplicate non-stackable trait', () => {
      const handler = new TestHandler({ type: 'test', isStackable: false });
      const result = handler.canPlace({
        creature: {
          ownerId: 'player',
          traits: [{ type: 'test' }],
        },
        player: { id: 'player' },
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('已經擁有');
    });

    test('should allow duplicate stackable trait', () => {
      const handler = new TestHandler({ type: 'fat', isStackable: true });
      const result = handler.canPlace({
        creature: {
          ownerId: 'player',
          traits: [{ type: 'fat' }],
        },
        player: { id: 'player' },
      });

      expect(result.valid).toBe(true);
    });

    test('should reject incompatible traits', () => {
      const handler = new TestHandler({
        type: 'carnivore',
        name: '肉食',
        incompatible: ['scavenger'],
      });
      const result = handler.canPlace({
        creature: {
          ownerId: 'player',
          traits: [{ type: 'scavenger', name: '腐食' }],
        },
        player: { id: 'player' },
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('互斥');
    });

    test('should allow compatible traits', () => {
      const handler = new TestHandler({
        type: 'carnivore',
        incompatible: ['scavenger'],
      });
      const result = handler.canPlace({
        creature: {
          ownerId: 'player',
          traits: [{ type: 'camouflage' }],
        },
        player: { id: 'player' },
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('interactive traits', () => {
    test('should require target creature', () => {
      const handler = new TestHandler({ type: 'comm', isInteractive: true });
      const result = handler.canPlace({
        creature: { id: 'c1', ownerId: 'player', traits: [] },
        player: { id: 'player' },
        targetCreature: null,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('第二隻生物');
    });

    test('should require target owned by same player', () => {
      const handler = new TestHandler({ type: 'comm', isInteractive: true });
      const result = handler.canPlace({
        creature: { id: 'c1', ownerId: 'player', traits: [] },
        player: { id: 'player' },
        targetCreature: { id: 'c2', ownerId: 'enemy' },
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('自己的');
    });

    test('should reject self-link', () => {
      const handler = new TestHandler({ type: 'comm', isInteractive: true });
      const result = handler.canPlace({
        creature: { id: 'c1', ownerId: 'player', traits: [] },
        player: { id: 'player' },
        targetCreature: { id: 'c1', ownerId: 'player' },
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('自己');
    });

    test('should allow valid interactive placement', () => {
      const handler = new TestHandler({ type: 'comm', isInteractive: true });
      const result = handler.canPlace({
        creature: { id: 'c1', ownerId: 'player', traits: [] },
        player: { id: 'player' },
        targetCreature: { id: 'c2', ownerId: 'player' },
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('default methods', () => {
    let handler;
    const mockGameState = { test: true };
    const context = { gameState: mockGameState };

    beforeEach(() => {
      handler = new TestHandler({ type: 'test' });
    });

    test('onPlace should return gameState unchanged', () => {
      expect(handler.onPlace(context)).toBe(mockGameState);
    });

    test('onRemove should return gameState unchanged', () => {
      expect(handler.onRemove(context)).toBe(mockGameState);
    });

    test('checkDefense should allow attack by default', () => {
      const result = handler.checkDefense(context);
      expect(result.canAttack).toBe(true);
    });

    test('getDefenseResponse should return no response by default', () => {
      const result = handler.getDefenseResponse(context);
      expect(result.canRespond).toBe(false);
    });

    test('handleDefenseResponse should return failure by default', () => {
      const result = handler.handleDefenseResponse(context, {});
      expect(result.success).toBe(false);
      expect(result.attackCancelled).toBe(false);
    });

    test('checkCanFeed should allow feeding by default', () => {
      const result = handler.checkCanFeed(context);
      expect(result.canFeed).toBe(true);
    });

    test('onFeed should return gameState unchanged', () => {
      expect(handler.onFeed(context)).toBe(mockGameState);
    });

    test('onGainFood should return gameState unchanged', () => {
      expect(handler.onGainFood(context, 'red', new Set())).toBe(mockGameState);
    });

    test('canUseAbility should return false by default', () => {
      const result = handler.canUseAbility(context);
      expect(result.canUse).toBe(false);
    });

    test('getAbilityTargets should return empty array by default', () => {
      expect(handler.getAbilityTargets(context)).toEqual([]);
    });

    test('useAbility should return failure by default', () => {
      const result = handler.useAbility(context, null);
      expect(result.success).toBe(false);
    });

    test('onPhaseStart should return gameState unchanged', () => {
      expect(handler.onPhaseStart(context, 'evolution')).toBe(mockGameState);
    });

    test('onPhaseEnd should return gameState unchanged', () => {
      expect(handler.onPhaseEnd(context, 'evolution')).toBe(mockGameState);
    });

    test('onTurnStart should return gameState unchanged', () => {
      expect(handler.onTurnStart(context)).toBe(mockGameState);
    });

    test('checkExtinction should return not survive by default', () => {
      const result = handler.checkExtinction(context);
      expect(result.shouldSurvive).toBe(false);
    });

    test('onExtinct should return gameState unchanged', () => {
      expect(handler.onExtinct(context, null)).toBe(mockGameState);
    });

    test('onOtherExtinct should return gameState unchanged', () => {
      expect(handler.onOtherExtinct(context, {}, {})).toBe(mockGameState);
    });

    test('getScoreBonus should return foodBonus', () => {
      const handlerWithBonus = new TestHandler({ type: 'test', foodBonus: 2 });
      expect(handlerWithBonus.getScoreBonus(context)).toBe(2);
    });
  });

  describe('getInfo', () => {
    test('should return all trait info', () => {
      const handler = new TestHandler({
        type: 'test',
        name: 'Test Name',
        nameEn: 'Test Name En',
        foodBonus: 1,
        description: 'Test desc',
        category: 'test-cat',
        isInteractive: true,
        isStackable: true,
        incompatible: ['other'],
        expansion: 'test-exp',
        isParasite: true,
        hasRepresentative: true,
      });

      const info = handler.getInfo();

      expect(info.type).toBe('test');
      expect(info.name).toBe('Test Name');
      expect(info.nameEn).toBe('Test Name En');
      expect(info.foodBonus).toBe(1);
      expect(info.description).toBe('Test desc');
      expect(info.category).toBe('test-cat');
      expect(info.isInteractive).toBe(true);
      expect(info.isStackable).toBe(true);
      expect(info.incompatible).toEqual(['other']);
      expect(info.expansion).toBe('test-exp');
      expect(info.isParasite).toBe(true);
      expect(info.hasRepresentative).toBe(true);
    });
  });

  describe('getType', () => {
    test('should return type', () => {
      const handler = new TestHandler({ type: 'myType' });
      expect(handler.getType()).toBe('myType');
    });
  });
});

// ========== TraitRegistry 測試 ==========

describe('TraitRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new TraitRegistry();
  });

  describe('register', () => {
    test('should register handler', () => {
      const handler = new TestHandler({ type: 'test' });
      registry.register(handler);

      expect(registry.has('test')).toBe(true);
    });

    test('should throw for handler without type', () => {
      expect(() => registry.register({})).toThrow('type property');
      expect(() => registry.register(null)).toThrow('type property');
    });

    test('should throw for duplicate registration', () => {
      const handler = new TestHandler({ type: 'test' });
      registry.register(handler);

      expect(() => registry.register(handler)).toThrow('already registered');
    });
  });

  describe('get', () => {
    test('should return registered handler', () => {
      const handler = new TestHandler({ type: 'test' });
      registry.register(handler);

      expect(registry.get('test')).toBe(handler);
    });

    test('should return undefined for unknown type', () => {
      expect(registry.get('unknown')).toBeUndefined();
    });
  });

  describe('has', () => {
    test('should return true for registered type', () => {
      registry.register(new TestHandler({ type: 'test' }));
      expect(registry.has('test')).toBe(true);
    });

    test('should return false for unknown type', () => {
      expect(registry.has('unknown')).toBe(false);
    });
  });

  describe('getAll', () => {
    test('should return all handlers', () => {
      registry.register(new TestHandler({ type: 'a' }));
      registry.register(new TestHandler({ type: 'b' }));

      const all = registry.getAll();
      expect(all.length).toBe(2);
      expect(all.map(h => h.type)).toContain('a');
      expect(all.map(h => h.type)).toContain('b');
    });

    test('should return empty array when empty', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getAllTypes', () => {
    test('should return all types', () => {
      registry.register(new TestHandler({ type: 'a' }));
      registry.register(new TestHandler({ type: 'b' }));

      const types = registry.getAllTypes();
      expect(types).toContain('a');
      expect(types).toContain('b');
    });
  });

  describe('registerAll', () => {
    test('should register array of handlers', () => {
      const handlers = [
        new TestHandler({ type: 'a' }),
        new TestHandler({ type: 'b' }),
      ];

      registry.registerAll(handlers);

      expect(registry.size).toBe(2);
    });

    test('should register object of handlers', () => {
      const handlers = {
        a: new TestHandler({ type: 'a' }),
        b: new TestHandler({ type: 'b' }),
      };

      registry.registerAll(handlers);

      expect(registry.size).toBe(2);
    });
  });

  describe('unregister', () => {
    test('should remove handler', () => {
      registry.register(new TestHandler({ type: 'test' }));
      const result = registry.unregister('test');

      expect(result).toBe(true);
      expect(registry.has('test')).toBe(false);
    });

    test('should return false for unknown type', () => {
      expect(registry.unregister('unknown')).toBe(false);
    });
  });

  describe('clear', () => {
    test('should remove all handlers', () => {
      registry.register(new TestHandler({ type: 'a' }));
      registry.register(new TestHandler({ type: 'b' }));

      registry.clear();

      expect(registry.size).toBe(0);
    });
  });

  describe('size', () => {
    test('should return number of handlers', () => {
      expect(registry.size).toBe(0);

      registry.register(new TestHandler({ type: 'a' }));
      expect(registry.size).toBe(1);

      registry.register(new TestHandler({ type: 'b' }));
      expect(registry.size).toBe(2);
    });
  });

  describe('getByCategory', () => {
    test('should return handlers by category', () => {
      registry.register(new TestHandler({ type: 'a', category: 'cat1' }));
      registry.register(new TestHandler({ type: 'b', category: 'cat1' }));
      registry.register(new TestHandler({ type: 'c', category: 'cat2' }));

      const cat1 = registry.getByCategory('cat1');
      expect(cat1.length).toBe(2);
      expect(cat1.map(h => h.type)).toContain('a');
      expect(cat1.map(h => h.type)).toContain('b');
    });
  });

  describe('getByExpansion', () => {
    test('should return handlers by expansion', () => {
      registry.register(new TestHandler({ type: 'a', expansion: 'base' }));
      registry.register(new TestHandler({ type: 'b', expansion: 'exp1' }));
      registry.register(new TestHandler({ type: 'c', expansion: 'base' }));

      const base = registry.getByExpansion('base');
      expect(base.length).toBe(2);
      expect(base.map(h => h.type)).toContain('a');
      expect(base.map(h => h.type)).toContain('c');
    });
  });
});

// ========== globalTraitRegistry 測試 ==========

describe('globalTraitRegistry', () => {
  beforeEach(() => {
    globalTraitRegistry.clear();
  });

  test('should be a TraitRegistry instance', () => {
    expect(globalTraitRegistry).toBeInstanceOf(TraitRegistry);
  });

  test('should be shared across imports', () => {
    globalTraitRegistry.register(new TestHandler({ type: 'shared' }));

    const { globalTraitRegistry: sameRegistry } = require('../traitRegistry');
    expect(sameRegistry.has('shared')).toBe(true);
  });
});
