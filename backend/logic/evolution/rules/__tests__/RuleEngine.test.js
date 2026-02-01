/**
 * 規則引擎測試
 * @module logic/evolution/rules/__tests__/RuleEngine.test
 */

const RuleEngine = require('../RuleEngine');
const { RULE_IDS } = require('../ruleIds');
const { HOOK_NAMES } = require('../hookNames');
const { createRuleEngine, createRuleEngineWithDefaults } = require('../createRuleEngine');

describe('RuleEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  describe('constructor', () => {
    test('should initialize with empty rules and hooks', () => {
      expect(engine.getRuleCount()).toBe(0);
      expect(engine.getRuleIds()).toEqual([]);
      expect(engine.getHookNames()).toEqual([]);
    });
  });

  // ==================== 規則管理 ====================

  describe('registerRule', () => {
    test('should register a rule', () => {
      engine.registerRule('test', {
        execute: (ctx) => ctx,
        description: 'Test rule',
      });
      expect(engine.getRule('test')).toBeDefined();
      expect(engine.hasRule('test')).toBe(true);
    });

    test('should reject empty rule ID', () => {
      expect(() => engine.registerRule('', { execute: () => {} })).toThrow('Rule ID must be a non-empty string');
    });

    test('should reject null rule ID', () => {
      expect(() => engine.registerRule(null, { execute: () => {} })).toThrow('Rule ID must be a non-empty string');
    });

    test('should reject rule without execute function', () => {
      expect(() => engine.registerRule('test', {})).toThrow('Rule must have an execute function');
    });

    test('should reject rule with non-function execute', () => {
      expect(() => engine.registerRule('test', { execute: 'not a function' })).toThrow('Rule must have an execute function');
    });

    test('should store registeredAt timestamp', () => {
      const before = Date.now();
      engine.registerRule('test', { execute: () => {} });
      const after = Date.now();

      const rule = engine.getRule('test');
      expect(rule.registeredAt).toBeGreaterThanOrEqual(before);
      expect(rule.registeredAt).toBeLessThanOrEqual(after);
    });
  });

  describe('getRule', () => {
    test('should return undefined for non-existent rule', () => {
      expect(engine.getRule('nonexistent')).toBeUndefined();
    });

    test('should return the registered rule', () => {
      const rule = { execute: () => 'result', description: 'Test' };
      engine.registerRule('test', rule);

      const retrieved = engine.getRule('test');
      expect(retrieved.execute).toBe(rule.execute);
      expect(retrieved.description).toBe('Test');
    });
  });

  describe('hasRule', () => {
    test('should return false for non-existent rule', () => {
      expect(engine.hasRule('nonexistent')).toBe(false);
    });

    test('should return true for existing rule', () => {
      engine.registerRule('test', { execute: () => {} });
      expect(engine.hasRule('test')).toBe(true);
    });
  });

  describe('removeRule', () => {
    test('should remove existing rule', () => {
      engine.registerRule('test', { execute: () => {} });
      expect(engine.removeRule('test')).toBe(true);
      expect(engine.hasRule('test')).toBe(false);
    });

    test('should return false for non-existent rule', () => {
      expect(engine.removeRule('nonexistent')).toBe(false);
    });
  });

  describe('executeRule', () => {
    test('should execute rule and return result', async () => {
      engine.registerRule('double', {
        execute: (ctx) => ({ ...ctx, value: ctx.value * 2 }),
      });

      const result = await engine.executeRule('double', { value: 5 });
      expect(result.value).toBe(10);
    });

    test('should throw for non-existent rule', async () => {
      await expect(engine.executeRule('nonexistent', {})).rejects.toThrow('Rule not found: nonexistent');
    });

    test('should include ruleEngine in context', async () => {
      let receivedContext;
      engine.registerRule('capture', {
        execute: (ctx) => {
          receivedContext = ctx;
          return ctx;
        },
      });

      await engine.executeRule('capture', {});
      expect(receivedContext.ruleEngine).toBe(engine);
    });

    test('should apply middleware', async () => {
      const order = [];

      engine.use(async (ctx, ruleId) => {
        order.push('middleware');
        return ctx;
      });

      engine.registerRule('test', {
        execute: (ctx) => {
          order.push('rule');
          return ctx;
        },
      });

      await engine.executeRule('test', {});
      expect(order).toEqual(['middleware', 'rule']);
    });
  });

  describe('overrideRule', () => {
    test('should override existing rule', async () => {
      engine.registerRule('greet', {
        execute: () => 'Hello',
      });

      engine.overrideRule('greet', (original) => ({
        ...original,
        execute: () => 'Hi there!',
      }));

      const result = await engine.executeRule('greet', {});
      expect(result).toBe('Hi there!');
    });

    test('should preserve original rule reference', () => {
      const originalExecute = () => 'original';
      engine.registerRule('test', { execute: originalExecute });

      engine.overrideRule('test', (original) => ({
        ...original,
        execute: () => 'overridden',
      }));

      const rule = engine.getRule('test');
      expect(rule.originalRule.execute).toBe(originalExecute);
    });

    test('should throw for non-existent rule', () => {
      expect(() => engine.overrideRule('nonexistent', () => {}))
        .toThrow('Cannot override non-existent rule: nonexistent');
    });

    test('should store overriddenAt timestamp', () => {
      engine.registerRule('test', { execute: () => {} });

      const before = Date.now();
      engine.overrideRule('test', (r) => ({ ...r, execute: () => 'new' }));
      const after = Date.now();

      const rule = engine.getRule('test');
      expect(rule.overriddenAt).toBeGreaterThanOrEqual(before);
      expect(rule.overriddenAt).toBeLessThanOrEqual(after);
    });
  });

  describe('extendRule', () => {
    test('should extend rule with before processing', async () => {
      engine.registerRule('process', {
        execute: (ctx) => ({ ...ctx, main: true }),
      });

      engine.extendRule('process', {
        before: (ctx) => ({ ...ctx, before: true }),
      });

      const result = await engine.executeRule('process', {});
      expect(result.before).toBe(true);
      expect(result.main).toBe(true);
    });

    test('should extend rule with after processing', async () => {
      engine.registerRule('process', {
        execute: (ctx) => ({ ...ctx, main: true }),
      });

      engine.extendRule('process', {
        after: (ctx) => ({ ...ctx, after: true }),
      });

      const result = await engine.executeRule('process', {});
      expect(result.main).toBe(true);
      expect(result.after).toBe(true);
    });

    test('should process in correct order', async () => {
      const order = [];

      engine.registerRule('test', {
        execute: (ctx) => {
          order.push('main');
          return ctx;
        },
      });

      engine.extendRule('test', {
        before: (ctx) => {
          order.push('before');
          return ctx;
        },
        after: (ctx) => {
          order.push('after');
          return ctx;
        },
      });

      await engine.executeRule('test', {});
      expect(order).toEqual(['before', 'main', 'after']);
    });

    test('should throw for non-existent rule', () => {
      expect(() => engine.extendRule('nonexistent', {}))
        .toThrow('Cannot extend non-existent rule: nonexistent');
    });

    test('should mark rule as extended', () => {
      engine.registerRule('test', { execute: () => {} });
      engine.extendRule('test', { before: () => {} });

      expect(engine.getRule('test').extended).toBe(true);
    });
  });

  // ==================== 鉤子管理 ====================

  describe('addHook', () => {
    test('should add hook', () => {
      const callback = () => {};
      engine.addHook('test', callback);

      expect(engine.getHookCount('test')).toBe(1);
    });

    test('should add multiple hooks', () => {
      engine.addHook('test', () => {});
      engine.addHook('test', () => {});

      expect(engine.getHookCount('test')).toBe(2);
    });
  });

  describe('removeHook', () => {
    test('should remove hook', () => {
      const callback = () => {};
      engine.addHook('test', callback);

      expect(engine.removeHook('test', callback)).toBe(true);
      expect(engine.getHookCount('test')).toBe(0);
    });

    test('should return false for non-existent hook', () => {
      expect(engine.removeHook('nonexistent', () => {})).toBe(false);
    });

    test('should return false for non-matching callback', () => {
      engine.addHook('test', () => {});
      expect(engine.removeHook('test', () => {})).toBe(false);
    });
  });

  describe('clearHook', () => {
    test('should clear all hooks for a name', () => {
      engine.addHook('test', () => {});
      engine.addHook('test', () => {});

      engine.clearHook('test');
      expect(engine.getHookCount('test')).toBe(0);
    });
  });

  describe('getHookCount', () => {
    test('should return 0 for non-existent hook', () => {
      expect(engine.getHookCount('nonexistent')).toBe(0);
    });
  });

  describe('triggerHook', () => {
    test('should trigger hooks in priority order', async () => {
      const order = [];

      engine.addHook('test', () => { order.push('second'); return {}; }, 200);
      engine.addHook('test', () => { order.push('first'); return {}; }, 100);
      engine.addHook('test', () => { order.push('third'); return {}; }, 300);

      await engine.triggerHook('test', {});

      expect(order).toEqual(['first', 'second', 'third']);
    });

    test('should pass context through hooks', async () => {
      engine.addHook('test', (ctx) => ({ ...ctx, a: 1 }));
      engine.addHook('test', (ctx) => ({ ...ctx, b: 2 }));

      const result = await engine.triggerHook('test', {});
      expect(result).toEqual({ a: 1, b: 2 });
    });

    test('should stop on null return', async () => {
      const order = [];

      engine.addHook('test', () => { order.push('first'); return null; }, 100);
      engine.addHook('test', () => { order.push('second'); return {}; }, 200);

      const result = await engine.triggerHook('test', {});

      expect(order).toEqual(['first']);
      expect(result).toBeNull();
    });

    test('should return context for non-existent hook', async () => {
      const ctx = { value: 1 };
      const result = await engine.triggerHook('nonexistent', ctx);
      expect(result).toBe(ctx);
    });
  });

  // ==================== 中間件 ====================

  describe('use', () => {
    test('should add middleware', () => {
      engine.use(() => {});
      expect(engine.middleware.length).toBe(1);
    });

    test('should throw for non-function middleware', () => {
      expect(() => engine.use('not a function')).toThrow('Middleware must be a function');
    });
  });

  describe('removeMiddleware', () => {
    test('should remove middleware', () => {
      const mw = () => {};
      engine.use(mw);

      expect(engine.removeMiddleware(mw)).toBe(true);
      expect(engine.middleware.length).toBe(0);
    });

    test('should return false for non-existent middleware', () => {
      expect(engine.removeMiddleware(() => {})).toBe(false);
    });
  });

  describe('clearMiddleware', () => {
    test('should clear all middleware', () => {
      engine.use(() => {});
      engine.use(() => {});

      engine.clearMiddleware();
      expect(engine.middleware.length).toBe(0);
    });
  });

  // ==================== 上下文 ====================

  describe('createContext', () => {
    test('should include ruleEngine reference', () => {
      const ctx = engine.createContext({});
      expect(ctx.ruleEngine).toBe(engine);
    });

    test('should include traitRegistry', () => {
      const registry = { get: () => {} };
      engine.setTraitRegistry(registry);

      const ctx = engine.createContext({});
      expect(ctx.traitRegistry).toBe(registry);
    });

    test('should include helper methods', () => {
      const ctx = engine.createContext({});
      expect(typeof ctx.getTraitHandler).toBe('function');
      expect(typeof ctx.executeRule).toBe('function');
      expect(typeof ctx.triggerHook).toBe('function');
    });

    test('should preserve original context properties', () => {
      const ctx = engine.createContext({ value: 42, data: 'test' });
      expect(ctx.value).toBe(42);
      expect(ctx.data).toBe('test');
    });
  });

  describe('setTraitRegistry/getTraitRegistry', () => {
    test('should set and get trait registry', () => {
      const registry = { get: () => {} };
      engine.setTraitRegistry(registry);

      expect(engine.getTraitRegistry()).toBe(registry);
    });

    test('should return null by default', () => {
      expect(engine.getTraitRegistry()).toBeNull();
    });
  });

  // ==================== 工具方法 ====================

  describe('getRuleIds', () => {
    test('should return array of rule IDs', () => {
      engine.registerRule('a', { execute: () => {} });
      engine.registerRule('b', { execute: () => {} });

      const ids = engine.getRuleIds();
      expect(ids).toContain('a');
      expect(ids).toContain('b');
    });
  });

  describe('getHookNames', () => {
    test('should return array of hook names', () => {
      engine.addHook('hookA', () => {});
      engine.addHook('hookB', () => {});

      const names = engine.getHookNames();
      expect(names).toContain('hookA');
      expect(names).toContain('hookB');
    });
  });

  describe('getRuleCount', () => {
    test('should return correct count', () => {
      expect(engine.getRuleCount()).toBe(0);

      engine.registerRule('a', { execute: () => {} });
      expect(engine.getRuleCount()).toBe(1);

      engine.registerRule('b', { execute: () => {} });
      expect(engine.getRuleCount()).toBe(2);
    });
  });

  describe('reset', () => {
    test('should clear all rules', () => {
      engine.registerRule('test', { execute: () => {} });
      engine.reset();

      expect(engine.getRuleCount()).toBe(0);
    });

    test('should clear all hooks', () => {
      engine.addHook('test', () => {});
      engine.reset();

      expect(engine.getHookCount('test')).toBe(0);
    });

    test('should clear middleware', () => {
      engine.use(() => {});
      engine.reset();

      expect(engine.middleware.length).toBe(0);
    });

    test('should clear trait registry', () => {
      engine.setTraitRegistry({ get: () => {} });
      engine.reset();

      expect(engine.getTraitRegistry()).toBeNull();
    });
  });

  describe('exportState', () => {
    test('should export current state', () => {
      engine.registerRule('rule1', { execute: () => {} });
      engine.addHook('hook1', () => {});
      engine.use(() => {});
      engine.setTraitRegistry({ get: () => {} });

      const state = engine.exportState();

      expect(state.ruleCount).toBe(1);
      expect(state.ruleIds).toContain('rule1');
      expect(state.hookCount).toBe(1);
      expect(state.hookNames).toContain('hook1');
      expect(state.middlewareCount).toBe(1);
      expect(state.hasTraitRegistry).toBe(true);
    });
  });
});

// ==================== 常數測試 ====================

describe('RULE_IDS', () => {
  test('should have game lifecycle rules', () => {
    expect(RULE_IDS.GAME_INIT).toBe('game.init');
    expect(RULE_IDS.GAME_START).toBe('game.start');
  });

  test('should have phase rules', () => {
    expect(RULE_IDS.PHASE_TRANSITION).toBe('phase.transition');
    expect(RULE_IDS.PHASE_EVOLUTION_START).toBe('phase.evolution.start');
    expect(RULE_IDS.PHASE_FOOD_START).toBe('phase.food.start');
    expect(RULE_IDS.PHASE_FEEDING_START).toBe('phase.feeding.start');
    expect(RULE_IDS.PHASE_EXTINCTION_START).toBe('phase.extinction.start');
  });

  test('should have action rules', () => {
    expect(RULE_IDS.ACTION_VALIDATE).toBe('action.validate');
    expect(RULE_IDS.CREATURE_CREATE).toBe('creature.create');
    expect(RULE_IDS.TRAIT_ADD).toBe('trait.add');
    expect(RULE_IDS.FEED_EXECUTE).toBe('feed.execute');
    expect(RULE_IDS.ATTACK_EXECUTE).toBe('attack.execute');
  });
});

describe('HOOK_NAMES', () => {
  test('should have game lifecycle hooks', () => {
    expect(HOOK_NAMES.BEFORE_GAME_INIT).toBe('beforeGameInit');
    expect(HOOK_NAMES.AFTER_GAME_INIT).toBe('afterGameInit');
    expect(HOOK_NAMES.BEFORE_GAME_START).toBe('beforeGameStart');
    expect(HOOK_NAMES.AFTER_GAME_END).toBe('afterGameEnd');
  });

  test('should have phase hooks', () => {
    expect(HOOK_NAMES.BEFORE_PHASE_START).toBe('beforePhaseStart');
    expect(HOOK_NAMES.AFTER_PHASE_END).toBe('afterPhaseEnd');
  });

  test('should have action hooks', () => {
    expect(HOOK_NAMES.BEFORE_ACTION).toBe('beforeAction');
    expect(HOOK_NAMES.AFTER_ACTION).toBe('afterAction');
    expect(HOOK_NAMES.ON_GAIN_FOOD).toBe('onGainFood');
    expect(HOOK_NAMES.ON_ATTACK_SUCCESS).toBe('onAttackSuccess');
  });
});

// ==================== 工廠函數測試 ====================

describe('createRuleEngine', () => {
  test('should create a new RuleEngine instance', () => {
    const engine = createRuleEngine();
    expect(engine).toBeInstanceOf(RuleEngine);
  });

  test('should set trait registry if provided', () => {
    const registry = { get: () => {} };
    const engine = createRuleEngine({ traitRegistry: registry });

    expect(engine.getTraitRegistry()).toBe(registry);
  });

  test('should add debug middleware if debug is true', () => {
    const engine = createRuleEngine({ debug: true });
    expect(engine.middleware.length).toBe(1);
  });

  test('should use custom logger if provided', async () => {
    const logs = [];
    const logger = (msg) => logs.push(msg);

    const engine = createRuleEngine({ debug: true, logger });
    engine.registerRule('test', { execute: (ctx) => ctx });

    await engine.executeRule('test', {});

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('test');
  });
});

describe('createRuleEngineWithDefaults', () => {
  test('should create a RuleEngine instance', () => {
    const engine = createRuleEngineWithDefaults();
    expect(engine).toBeInstanceOf(RuleEngine);
  });
});
