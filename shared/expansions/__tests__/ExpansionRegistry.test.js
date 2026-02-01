/**
 * ExpansionRegistry 單元測試
 */

const { ExpansionRegistry } = require('../ExpansionRegistry');
const { validateExpansionInterface, createExpansionTemplate } = require('../ExpansionInterface');

describe('ExpansionRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ExpansionRegistry();
  });

  // ========== 測試輔助函數 ==========

  const createValidExpansion = (overrides = {}) => ({
    id: 'test',
    name: 'Test Expansion',
    version: '1.0.0',
    description: 'For testing',
    traits: {},
    cards: [],
    ...overrides,
  });

  // ========== register 測試 ==========

  describe('register', () => {
    test('should register valid expansion', () => {
      const expansion = createValidExpansion();

      registry.register(expansion);

      expect(registry.expansions.has('test')).toBe(true);
      expect(registry.getExpansion('test')).toMatchObject({
        id: 'test',
        name: 'Test Expansion',
      });
    });

    test('should reject expansion without id', () => {
      const invalid = { name: 'No ID', version: '1.0.0' };

      expect(() => registry.register(invalid)).toThrow('缺少必要欄位');
    });

    test('should reject expansion without name', () => {
      const invalid = { id: 'test', version: '1.0.0' };

      expect(() => registry.register(invalid)).toThrow('缺少必要欄位');
    });

    test('should reject expansion without version', () => {
      const invalid = { id: 'test', name: 'Test' };

      expect(() => registry.register(invalid)).toThrow('缺少必要欄位');
    });

    test('should reject duplicate ID', () => {
      const expansion = createValidExpansion();
      registry.register(expansion);

      expect(() => registry.register(expansion)).toThrow('已存在');
    });

    test('should reject invalid ID format', () => {
      const invalid = createValidExpansion({ id: 'Invalid_ID' });

      expect(() => registry.register(invalid)).toThrow('小寫字母');
    });

    test('should reject invalid version format', () => {
      const invalid = createValidExpansion({ version: 'v1.0' });

      expect(() => registry.register(invalid)).toThrow('語意化版本');
    });

    test('should call onRegister hook', () => {
      const onRegister = jest.fn();
      const expansion = createValidExpansion({ onRegister });

      registry.register(expansion);

      expect(onRegister).toHaveBeenCalledWith(registry);
    });

    test('should initialize empty arrays for optional fields', () => {
      const expansion = { id: 'minimal', name: 'Minimal', version: '1.0.0' };

      registry.register(expansion);

      const registered = registry.getExpansion('minimal');
      expect(registered.requires).toEqual([]);
      expect(registered.incompatible).toEqual([]);
      expect(registered.cards).toEqual([]);
    });
  });

  // ========== unregister 測試 ==========

  describe('unregister', () => {
    test('should unregister expansion', () => {
      registry.register(createValidExpansion());

      const result = registry.unregister('test');

      expect(result).toBe(true);
      expect(registry.expansions.has('test')).toBe(false);
    });

    test('should return false for non-existent expansion', () => {
      const result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });

    test('should disable expansion before unregister', () => {
      registry.register(createValidExpansion());
      registry.enable('test');

      registry.unregister('test');

      expect(registry.isEnabled('test')).toBe(false);
    });

    test('should throw if other enabled expansion depends on it', () => {
      registry.register(createValidExpansion({ id: 'parent' }));
      registry.register(createValidExpansion({ id: 'child', requires: ['parent'] }));
      registry.enable('parent');
      registry.enable('child');

      expect(() => registry.unregister('parent')).toThrow('依賴');
    });
  });

  // ========== enable 測試 ==========

  describe('enable', () => {
    test('should enable expansion', () => {
      registry.register(createValidExpansion());

      registry.enable('test');

      expect(registry.isEnabled('test')).toBe(true);
    });

    test('should throw for non-existent expansion', () => {
      expect(() => registry.enable('non-existent')).toThrow('不存在');
    });

    test('should do nothing if already enabled', () => {
      registry.register(createValidExpansion());
      registry.enable('test');

      expect(() => registry.enable('test')).not.toThrow();
    });

    test('should throw if dependencies not met', () => {
      registry.register(createValidExpansion({
        id: 'child',
        requires: ['parent'],
      }));

      expect(() => registry.enable('child')).toThrow('依賴的擴充包未啟用');
    });

    test('should enable after dependencies are met', () => {
      registry.register(createValidExpansion({ id: 'parent' }));
      registry.register(createValidExpansion({
        id: 'child',
        requires: ['parent'],
      }));

      registry.enable('parent');
      registry.enable('child');

      expect(registry.isEnabled('child')).toBe(true);
    });

    test('should throw if incompatible expansion enabled', () => {
      registry.register(createValidExpansion({ id: 'a' }));
      registry.register(createValidExpansion({
        id: 'b',
        incompatible: ['a'],
      }));
      registry.enable('a');

      expect(() => registry.enable('b')).toThrow('不相容');
    });

    test('should throw if bidirectionally incompatible', () => {
      registry.register(createValidExpansion({
        id: 'a',
        incompatible: ['b'],
      }));
      registry.register(createValidExpansion({ id: 'b' }));
      registry.enable('b');

      expect(() => registry.enable('a')).toThrow('不相容');
    });

    test('should call onEnable hook', () => {
      const onEnable = jest.fn();
      registry.register(createValidExpansion({ onEnable }));

      registry.enable('test');

      expect(onEnable).toHaveBeenCalledWith(registry);
    });

    test('should register trait handlers', () => {
      const mockHandler = { type: 'testTrait', handle: jest.fn() };
      registry.register(createValidExpansion({
        traits: { testTrait: mockHandler },
      }));

      registry.enable('test');

      expect(registry.getTraitHandler('testTrait')).toBe(mockHandler);
    });
  });

  // ========== disable 測試 ==========

  describe('disable', () => {
    test('should disable expansion', () => {
      registry.register(createValidExpansion());
      registry.enable('test');

      registry.disable('test');

      expect(registry.isEnabled('test')).toBe(false);
    });

    test('should do nothing if not enabled', () => {
      registry.register(createValidExpansion());

      expect(() => registry.disable('test')).not.toThrow();
    });

    test('should throw if other expansion depends on it', () => {
      registry.register(createValidExpansion({ id: 'parent' }));
      registry.register(createValidExpansion({
        id: 'child',
        requires: ['parent'],
      }));
      registry.enable('parent');
      registry.enable('child');

      expect(() => registry.disable('parent')).toThrow('依賴');
    });

    test('should call onDisable hook', () => {
      const onDisable = jest.fn();
      registry.register(createValidExpansion({ onDisable }));
      registry.enable('test');

      registry.disable('test');

      expect(onDisable).toHaveBeenCalledWith(registry);
    });

    test('should unregister trait handlers', () => {
      const mockHandler = { type: 'testTrait' };
      registry.register(createValidExpansion({
        traits: { testTrait: mockHandler },
      }));
      registry.enable('test');
      registry.disable('test');

      expect(registry.getTraitHandler('testTrait')).toBeUndefined();
    });
  });

  // ========== getTraitHandler 測試 ==========

  describe('getTraitHandler', () => {
    test('should return trait handler after enable', () => {
      const mockHandler = { type: 'testTrait' };
      registry.register(createValidExpansion({
        traits: { testTrait: mockHandler },
      }));
      registry.enable('test');

      expect(registry.getTraitHandler('testTrait')).toBe(mockHandler);
    });

    test('should return undefined for unknown trait', () => {
      expect(registry.getTraitHandler('unknown')).toBeUndefined();
    });

    test('should return handler from correct expansion when multiple enabled', () => {
      const handler1 = { source: 'exp1' };
      const handler2 = { source: 'exp2' };

      registry.register(createValidExpansion({
        id: 'exp1',
        traits: { trait1: handler1 },
      }));
      registry.register(createValidExpansion({
        id: 'exp2',
        traits: { trait2: handler2 },
      }));
      registry.enable('exp1');
      registry.enable('exp2');

      expect(registry.getTraitHandler('trait1')).toBe(handler1);
      expect(registry.getTraitHandler('trait2')).toBe(handler2);
    });
  });

  // ========== getAllTraitHandlers 測試 ==========

  describe('getAllTraitHandlers', () => {
    test('should return all registered trait handlers', () => {
      const handler1 = { type: 'trait1' };
      const handler2 = { type: 'trait2' };
      registry.register(createValidExpansion({
        traits: { trait1: handler1, trait2: handler2 },
      }));
      registry.enable('test');

      const handlers = registry.getAllTraitHandlers();

      expect(handlers.size).toBe(2);
      expect(handlers.get('trait1')).toBe(handler1);
      expect(handlers.get('trait2')).toBe(handler2);
    });

    test('should return copy of handlers map', () => {
      registry.register(createValidExpansion({
        traits: { trait1: {} },
      }));
      registry.enable('test');

      const handlers = registry.getAllTraitHandlers();
      handlers.set('newTrait', {});

      expect(registry.traitHandlers.has('newTrait')).toBe(false);
    });
  });

  // ========== createDeck 測試 ==========

  describe('createDeck', () => {
    test('should create deck from enabled expansions', () => {
      registry.register(createValidExpansion({
        cards: [
          { frontTrait: 'trait1', backTrait: 'trait2', count: 2 },
          { frontTrait: 'trait3', backTrait: 'trait4', count: 3 },
        ],
      }));
      registry.enable('test');

      const deck = registry.createDeck();

      expect(deck.length).toBe(5);
    });

    test('should use count of 1 if not specified', () => {
      registry.register(createValidExpansion({
        cards: [
          { frontTrait: 'trait1', backTrait: 'trait2' },
        ],
      }));
      registry.enable('test');

      const deck = registry.createDeck();

      expect(deck.length).toBe(1);
    });

    test('should include expansion ID in each card', () => {
      registry.register(createValidExpansion({
        cards: [{ frontTrait: 'trait1', backTrait: 'trait2' }],
      }));
      registry.enable('test');

      const deck = registry.createDeck();

      expect(deck[0].expansionId).toBe('test');
    });

    test('should combine cards from multiple expansions', () => {
      registry.register(createValidExpansion({
        id: 'exp1',
        cards: [{ frontTrait: 'trait1', backTrait: 'trait2', count: 2 }],
      }));
      registry.register(createValidExpansion({
        id: 'exp2',
        cards: [{ frontTrait: 'trait3', backTrait: 'trait4', count: 3 }],
      }));
      registry.enable('exp1');
      registry.enable('exp2');

      const deck = registry.createDeck();

      expect(deck.length).toBe(5);
      expect(deck.filter(c => c.expansionId === 'exp1').length).toBe(2);
      expect(deck.filter(c => c.expansionId === 'exp2').length).toBe(3);
    });

    test('should return empty array if no expansions enabled', () => {
      const deck = registry.createDeck();

      expect(deck).toEqual([]);
    });
  });

  // ========== getCardPool 測試 ==========

  describe('getCardPool', () => {
    test('should return card pool', () => {
      registry.register(createValidExpansion({
        cards: [{ frontTrait: 'trait1', backTrait: 'trait2' }],
      }));
      registry.enable('test');

      const pool = registry.getCardPool();

      expect(pool.length).toBe(1);
      expect(pool[0].frontTrait).toBe('trait1');
    });

    test('should return copy of card pool', () => {
      registry.register(createValidExpansion({
        cards: [{ frontTrait: 'trait1', backTrait: 'trait2' }],
      }));
      registry.enable('test');

      const pool = registry.getCardPool();
      pool.push({ frontTrait: 'new' });

      expect(registry.cardPool.length).toBe(1);
    });
  });

  // ========== checkDependencies 測試 ==========

  describe('checkDependencies', () => {
    test('should return satisfied when no dependencies', () => {
      registry.register(createValidExpansion());

      const result = registry.checkDependencies('test');

      expect(result.satisfied).toBe(true);
      expect(result.missing).toEqual([]);
    });

    test('should return missing dependencies', () => {
      registry.register(createValidExpansion({
        requires: ['parent1', 'parent2'],
      }));

      const result = registry.checkDependencies('test');

      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('parent1');
      expect(result.missing).toContain('parent2');
    });

    test('should return satisfied when all dependencies enabled', () => {
      registry.register(createValidExpansion({ id: 'parent' }));
      registry.register(createValidExpansion({
        id: 'child',
        requires: ['parent'],
      }));
      registry.enable('parent');

      const result = registry.checkDependencies('child');

      expect(result.satisfied).toBe(true);
    });

    test('should return not satisfied for non-existent expansion', () => {
      const result = registry.checkDependencies('non-existent');

      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('non-existent');
    });
  });

  // ========== checkCompatibility 測試 ==========

  describe('checkCompatibility', () => {
    test('should return compatible when no conflicts', () => {
      registry.register(createValidExpansion());

      const result = registry.checkCompatibility('test');

      expect(result.compatible).toBe(true);
      expect(result.conflicts).toEqual([]);
    });

    test('should return conflicts when incompatible expansion enabled', () => {
      registry.register(createValidExpansion({ id: 'a' }));
      registry.register(createValidExpansion({
        id: 'b',
        incompatible: ['a'],
      }));
      registry.enable('a');

      const result = registry.checkCompatibility('b');

      expect(result.compatible).toBe(false);
      expect(result.conflicts).toContain('a');
    });

    test('should detect bidirectional incompatibility', () => {
      registry.register(createValidExpansion({
        id: 'a',
        incompatible: ['b'],
      }));
      registry.register(createValidExpansion({ id: 'b' }));
      registry.enable('b');

      const result = registry.checkCompatibility('a');

      expect(result.compatible).toBe(false);
      expect(result.conflicts).toContain('b');
    });

    test('should return not compatible for non-existent expansion', () => {
      const result = registry.checkCompatibility('non-existent');

      expect(result.compatible).toBe(false);
    });
  });

  // ========== validateExpansion 測試 ==========

  describe('validateExpansion', () => {
    test('should validate valid expansion', () => {
      const result = registry.validateExpansion(createValidExpansion());

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should return errors for invalid expansion', () => {
      const result = registry.validateExpansion({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ========== getEnabledExpansions 測試 ==========

  describe('getEnabledExpansions', () => {
    test('should return empty array when nothing enabled', () => {
      const result = registry.getEnabledExpansions();

      expect(result).toEqual([]);
    });

    test('should return enabled expansions', () => {
      registry.register(createValidExpansion({ id: 'a' }));
      registry.register(createValidExpansion({ id: 'b' }));
      registry.enable('a');
      registry.enable('b');

      const result = registry.getEnabledExpansions();

      expect(result.length).toBe(2);
      expect(result.map(e => e.id)).toContain('a');
      expect(result.map(e => e.id)).toContain('b');
    });
  });

  // ========== getAllExpansions 測試 ==========

  describe('getAllExpansions', () => {
    test('should return all registered expansions', () => {
      registry.register(createValidExpansion({ id: 'a' }));
      registry.register(createValidExpansion({ id: 'b' }));

      const result = registry.getAllExpansions();

      expect(result.length).toBe(2);
    });
  });

  // ========== reset 測試 ==========

  describe('reset', () => {
    test('should clear all state', () => {
      registry.register(createValidExpansion({
        traits: { trait1: {} },
        cards: [{ frontTrait: 'a', backTrait: 'b' }],
      }));
      registry.enable('test');

      registry.reset();

      expect(registry.expansions.size).toBe(0);
      expect(registry.enabled.size).toBe(0);
      expect(registry.traitHandlers.size).toBe(0);
      expect(registry.cardPool.length).toBe(0);
    });

    test('should call onDisable hooks', () => {
      const onDisable = jest.fn();
      registry.register(createValidExpansion({ onDisable }));
      registry.enable('test');

      registry.reset();

      expect(onDisable).toHaveBeenCalled();
    });
  });

  // ========== rules 測試 ==========

  describe('rules', () => {
    test('should merge rules from enabled expansions', () => {
      registry.register(createValidExpansion({
        rules: { maxCreatures: 5, customRule: true },
      }));
      registry.enable('test');

      expect(registry.getRule('maxCreatures')).toBe(5);
      expect(registry.getRule('customRule')).toBe(true);
    });

    test('should return all rules when no key specified', () => {
      registry.register(createValidExpansion({
        rules: { rule1: 'a', rule2: 'b' },
      }));
      registry.enable('test');

      const allRules = registry.getRule();

      expect(allRules).toEqual({ rule1: 'a', rule2: 'b' });
    });

    test('should override rules from later expansion', () => {
      registry.register(createValidExpansion({
        id: 'base',
        rules: { maxCreatures: 5 },
      }));
      registry.register(createValidExpansion({
        id: 'override',
        rules: { maxCreatures: 10 },
      }));
      registry.enable('base');
      registry.enable('override');

      expect(registry.getRule('maxCreatures')).toBe(10);
    });

    test('should rebuild rules after disable', () => {
      registry.register(createValidExpansion({
        id: 'base',
        rules: { rule1: 'base' },
      }));
      registry.register(createValidExpansion({
        id: 'addon',
        rules: { rule1: 'addon', rule2: 'addon' },
      }));
      registry.enable('base');
      registry.enable('addon');
      registry.disable('addon');

      expect(registry.getRule('rule1')).toBe('base');
      expect(registry.getRule('rule2')).toBeUndefined();
    });
  });

  // ========== game lifecycle hooks 測試 ==========

  describe('game lifecycle hooks', () => {
    test('triggerGameInit should call all enabled expansion hooks', () => {
      const onGameInit1 = jest.fn();
      const onGameInit2 = jest.fn();
      registry.register(createValidExpansion({ id: 'a', onGameInit: onGameInit1 }));
      registry.register(createValidExpansion({ id: 'b', onGameInit: onGameInit2 }));
      registry.enable('a');
      registry.enable('b');

      const gameState = { players: [] };
      registry.triggerGameInit(gameState);

      expect(onGameInit1).toHaveBeenCalledWith(gameState);
      expect(onGameInit2).toHaveBeenCalledWith(gameState);
    });

    test('triggerGameEnd should call all enabled expansion hooks', () => {
      const onGameEnd = jest.fn();
      registry.register(createValidExpansion({ onGameEnd }));
      registry.enable('test');

      const gameState = { winner: 'player1' };
      registry.triggerGameEnd(gameState);

      expect(onGameEnd).toHaveBeenCalledWith(gameState);
    });
  });
});

// ========== ExpansionInterface 測試 ==========

describe('ExpansionInterface', () => {
  describe('validateExpansionInterface', () => {
    test('should validate valid expansion', () => {
      const result = validateExpansionInterface({
        id: 'test',
        name: 'Test',
        version: '1.0.0',
      });

      expect(result.valid).toBe(true);
    });

    test('should reject self-dependency', () => {
      const result = validateExpansionInterface({
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        requires: ['test'],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('擴充包不能依賴自己');
    });

    test('should reject self-incompatibility', () => {
      const result = validateExpansionInterface({
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        incompatible: ['test'],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('擴充包不能與自己不相容');
    });

    test('should reject wrong type for optional fields', () => {
      const result = validateExpansionInterface({
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        traits: 'not an object',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('traits'))).toBe(true);
    });
  });

  describe('createExpansionTemplate', () => {
    test('should create template with defaults', () => {
      const template = createExpansionTemplate();

      expect(template.id).toBe('');
      expect(template.requires).toEqual([]);
      expect(template.traits).toEqual({});
      expect(template.cards).toEqual([]);
    });

    test('should allow overrides', () => {
      const template = createExpansionTemplate({
        id: 'my-expansion',
        name: 'My Expansion',
      });

      expect(template.id).toBe('my-expansion');
      expect(template.name).toBe('My Expansion');
    });
  });
});
