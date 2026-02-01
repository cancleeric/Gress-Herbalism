/**
 * 效果系統測試
 * @module expansions/core/__tests__/effectSystem.test
 */

const { Effect, EffectHandler } = require('../effectSystem');
const { EffectQueue } = require('../effectQueue');
const {
  EFFECT_TYPE,
  EFFECT_TIMING,
  EFFECT_PRIORITY,
  EFFECT_RESULT,
} = require('../effectTypes');
const {
  GainFoodHandler,
  LoseFoodHandler,
  StoreFatHandler,
  UseFatHandler,
  DestroyCreatureHandler,
  RemoveTraitHandler,
  ApplyPoisonHandler,
  registerBuiltinHandlers,
} = require('../handlers/builtinEffectHandlers');

// ==================== Effect 類別測試 ====================

describe('Effect', () => {
  test('should create effect with defaults', () => {
    const effect = new Effect({
      type: EFFECT_TYPE.GAIN_FOOD,
      timing: EFFECT_TIMING.ON_FEED,
    });

    expect(effect.type).toBe(EFFECT_TYPE.GAIN_FOOD);
    expect(effect.timing).toBe(EFFECT_TIMING.ON_FEED);
    expect(effect.priority).toBe(EFFECT_PRIORITY.NORMAL);
    expect(effect.resolved).toBe(false);
    expect(effect.cancelled).toBe(false);
    expect(effect.id).toBeTruthy();
  });

  test('should create effect with custom priority', () => {
    const effect = new Effect({
      type: EFFECT_TYPE.BLOCK_ATTACK,
      priority: EFFECT_PRIORITY.HIGH,
    });

    expect(effect.priority).toBe(EFFECT_PRIORITY.HIGH);
  });

  test('should cancel effect', () => {
    const effect = new Effect({ type: EFFECT_TYPE.GAIN_FOOD });
    effect.cancel();

    expect(effect.cancelled).toBe(true);
    expect(effect.result).toBe(EFFECT_RESULT.CANCELLED);
  });

  test('should not cancel already resolved effect', () => {
    const effect = new Effect({ type: EFFECT_TYPE.GAIN_FOOD });
    effect.resolve(EFFECT_RESULT.SUCCESS);
    effect.cancel();

    expect(effect.cancelled).toBe(false);
    expect(effect.result).toBe(EFFECT_RESULT.SUCCESS);
  });

  test('should resolve effect', () => {
    const effect = new Effect({ type: EFFECT_TYPE.GAIN_FOOD });
    effect.resolve(EFFECT_RESULT.SUCCESS);

    expect(effect.resolved).toBe(true);
    expect(effect.result).toBe(EFFECT_RESULT.SUCCESS);
  });

  test('should check canExecute', () => {
    const effect = new Effect({ type: EFFECT_TYPE.GAIN_FOOD });
    expect(effect.canExecute()).toBe(true);

    effect.cancel();
    expect(effect.canExecute()).toBe(false);
  });

  test('should clone effect', () => {
    const effect = new Effect({
      type: EFFECT_TYPE.GAIN_FOOD,
      data: { amount: 2 },
    });

    const cloned = effect.clone({ target: 'creature-1' });

    expect(cloned.type).toBe(effect.type);
    expect(cloned.data.amount).toBe(2);
    expect(cloned.target).toBe('creature-1');
    expect(cloned.id).not.toBe(effect.id);
  });

  test('should serialize to JSON', () => {
    const effect = new Effect({
      type: EFFECT_TYPE.GAIN_FOOD,
      timing: EFFECT_TIMING.ON_FEED,
      data: { amount: 1 },
    });

    const json = effect.toJSON();

    expect(json.id).toBe(effect.id);
    expect(json.type).toBe(EFFECT_TYPE.GAIN_FOOD);
    expect(json.data.amount).toBe(1);
  });

  test('should deserialize from JSON', () => {
    const original = new Effect({
      type: EFFECT_TYPE.GAIN_FOOD,
      data: { amount: 1 },
    });
    original.resolve(EFFECT_RESULT.SUCCESS);

    const json = original.toJSON();
    const restored = Effect.fromJSON(json);

    expect(restored.id).toBe(original.id);
    expect(restored.type).toBe(original.type);
    expect(restored.resolved).toBe(true);
    expect(restored.result).toBe(EFFECT_RESULT.SUCCESS);
  });
});

// ==================== EffectQueue 測試 ====================

describe('EffectQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new EffectQueue();
  });

  test('should enqueue effect', () => {
    const effect = queue.enqueue({ type: EFFECT_TYPE.GAIN_FOOD });

    expect(effect).toBeInstanceOf(Effect);
    expect(queue.length).toBe(1);
  });

  test('should sort by priority (high first)', () => {
    queue.enqueue({ type: 'A', priority: EFFECT_PRIORITY.LOW });
    queue.enqueue({ type: 'B', priority: EFFECT_PRIORITY.HIGH });
    queue.enqueue({ type: 'C', priority: EFFECT_PRIORITY.NORMAL });

    const peeked = queue.peek(3);
    expect(peeked[0].priority).toBe(EFFECT_PRIORITY.HIGH);
    expect(peeked[1].priority).toBe(EFFECT_PRIORITY.NORMAL);
    expect(peeked[2].priority).toBe(EFFECT_PRIORITY.LOW);
  });

  test('should batch enqueue', () => {
    const effects = queue.enqueueBatch([
      { type: 'A', priority: 10 },
      { type: 'B', priority: 20 },
    ]);

    expect(effects.length).toBe(2);
    expect(queue.length).toBe(2);
  });

  test('should cancel specific effect', () => {
    const effect = queue.enqueue({ type: 'TEST' });
    const cancelled = queue.cancel(effect.id);

    expect(cancelled).toBe(true);
    expect(effect.cancelled).toBe(true);
  });

  test('should cancel where predicate matches', () => {
    queue.enqueue({ type: 'KEEP', priority: 10 });
    queue.enqueue({ type: 'CANCEL', priority: 20 });
    queue.enqueue({ type: 'CANCEL', priority: 30 });

    const cancelled = queue.cancelWhere(e => e.type === 'CANCEL');

    expect(cancelled.length).toBe(2);
    expect(queue.findEffects(e => e.type === 'CANCEL' && !e.cancelled).length).toBe(0);
  });

  test('should resolve all effects', () => {
    queue.enqueue({ type: 'A' });
    queue.enqueue({ type: 'B' });

    const results = queue.resolveAll({});

    expect(results.length).toBe(2);
    expect(queue.isEmpty()).toBe(true);
    expect(queue.getHistory().length).toBe(2);
  });

  test('should resolve next effect', () => {
    queue.enqueue({ type: 'A' });
    queue.enqueue({ type: 'B' });

    const result = queue.resolveNext({});

    expect(result).toBeTruthy();
    expect(queue.length).toBe(1);
  });

  test('should handle cancelled effects during resolve', () => {
    const effect = queue.enqueue({ type: 'TEST' });
    effect.cancel();

    const results = queue.resolveAll({});

    expect(results[0].status).toBe(EFFECT_RESULT.CANCELLED);
  });

  test('should clear queue', () => {
    queue.enqueue({ type: 'A' });
    queue.enqueue({ type: 'B' });

    queue.clear();

    expect(queue.isEmpty()).toBe(true);
  });

  test('should clear history', () => {
    queue.enqueue({ type: 'A' });
    queue.resolveAll({});

    queue.clearHistory();

    expect(queue.getHistory().length).toBe(0);
  });

  test('should emit events', () => {
    const events = [];
    queue.on('effectEnqueued', (e) => events.push(['enqueued', e.id]));
    queue.on('effectCancelled', (e) => events.push(['cancelled', e.id]));

    const effect = queue.enqueue({ type: 'TEST' });
    queue.cancel(effect.id);

    expect(events.length).toBe(2);
    expect(events[0][0]).toBe('enqueued');
    expect(events[1][0]).toBe('cancelled');
  });

  test('should remove event listener', () => {
    const events = [];
    const handler = (e) => events.push(e.id);

    queue.on('effectEnqueued', handler);
    queue.enqueue({ type: 'A' });
    queue.off('effectEnqueued', handler);
    queue.enqueue({ type: 'B' });

    expect(events.length).toBe(1);
  });

  test('should register and use handler', () => {
    class TestHandler extends EffectHandler {
      canHandle(effect) { return effect.type === 'TEST'; }
      handle() { return { status: EFFECT_RESULT.SUCCESS, custom: true }; }
    }

    queue.registerHandler(new TestHandler());
    queue.enqueue({ type: 'TEST' });

    const results = queue.resolveAll({});

    expect(results[0].status).toBe(EFFECT_RESULT.SUCCESS);
    expect(results[0].custom).toBe(true);
  });

  test('should sort handlers by priority', () => {
    class LowHandler extends EffectHandler {
      canHandle() { return true; }
      handle() { return { handler: 'low' }; }
      getHandlerPriority() { return 10; }
    }
    class HighHandler extends EffectHandler {
      canHandle() { return true; }
      handle() { return { handler: 'high' }; }
      getHandlerPriority() { return 100; }
    }

    queue.registerHandler(new LowHandler());
    queue.registerHandler(new HighHandler());
    queue.enqueue({ type: 'TEST' });

    const results = queue.resolveAll({});

    // 高優先級處理器應該先處理
    expect(results[0].handler).toBe('high');
  });

  test('should handle handler errors gracefully', () => {
    class ErrorHandler extends EffectHandler {
      canHandle() { return true; }
      handle() { throw new Error('Test error'); }
    }

    queue.registerHandler(new ErrorHandler());
    queue.enqueue({ type: 'TEST' });

    const results = queue.resolveAll({});

    expect(results[0].status).toBe(EFFECT_RESULT.FAILED);
    expect(results[0].error).toBe('Test error');
  });
});

// ==================== 內建處理器測試 ====================

describe('GainFoodHandler', () => {
  let queue;
  let gameState;

  beforeEach(() => {
    queue = new EffectQueue();
    queue.registerHandler(new GainFoodHandler());
    gameState = {
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          food: { red: 0, blue: 0, yellow: 0 },
          foodNeeded: 2,
          traits: [],
        }],
      }],
    };
  });

  test('should gain food', () => {
    queue.enqueue({
      type: EFFECT_TYPE.GAIN_FOOD,
      data: { creatureId: 'creature1', amount: 1, foodType: 'red' },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].status).toBe(EFFECT_RESULT.SUCCESS);
    expect(results[0].gained).toBe(1);
    expect(gameState.players[0].creatures[0].food.red).toBe(1);
  });

  test('should not exceed food needed', () => {
    queue.enqueue({
      type: EFFECT_TYPE.GAIN_FOOD,
      data: { creatureId: 'creature1', amount: 5, foodType: 'red' },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].gained).toBe(2);
    expect(gameState.players[0].creatures[0].food.red).toBe(2);
  });

  test('should fail if creature not found', () => {
    queue.enqueue({
      type: EFFECT_TYPE.GAIN_FOOD,
      data: { creatureId: 'unknown', amount: 1 },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].status).toBe(EFFECT_RESULT.FAILED);
  });
});

describe('StoreFatHandler', () => {
  let queue;
  let gameState;

  beforeEach(() => {
    queue = new EffectQueue();
    queue.registerHandler(new StoreFatHandler());
    gameState = {
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          food: { red: 0, blue: 0, yellow: 0 },
          traits: [{ type: 'fatTissue' }, { type: 'fatTissue' }],
        }],
      }],
    };
  });

  test('should store fat', () => {
    queue.enqueue({
      type: EFFECT_TYPE.STORE_FAT,
      data: { creatureId: 'creature1', amount: 1 },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].status).toBe(EFFECT_RESULT.SUCCESS);
    expect(results[0].stored).toBe(1);
    expect(gameState.players[0].creatures[0].food.yellow).toBe(1);
  });

  test('should not exceed capacity', () => {
    queue.enqueue({
      type: EFFECT_TYPE.STORE_FAT,
      data: { creatureId: 'creature1', amount: 5 },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].stored).toBe(2); // 2 fat tissue cards
  });

  test('should fail without fat tissue', () => {
    gameState.players[0].creatures[0].traits = [];

    queue.enqueue({
      type: EFFECT_TYPE.STORE_FAT,
      data: { creatureId: 'creature1', amount: 1 },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].status).toBe(EFFECT_RESULT.FAILED);
  });
});

describe('DestroyCreatureHandler', () => {
  let queue;
  let gameState;

  beforeEach(() => {
    queue = new EffectQueue();
    queue.registerHandler(new DestroyCreatureHandler());
    gameState = {
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          traits: [{ type: 'carnivore' }],
        }],
        discardPile: [],
      }],
    };
  });

  test('should destroy creature', () => {
    queue.enqueue({
      type: EFFECT_TYPE.DESTROY_CREATURE,
      data: { creatureId: 'creature1', reason: 'attack' },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].status).toBe(EFFECT_RESULT.SUCCESS);
    expect(gameState.players[0].creatures.length).toBe(0);
    expect(gameState.players[0].discardPile.length).toBe(2); // creature + trait
  });

  test('should fail if creature not found', () => {
    queue.enqueue({
      type: EFFECT_TYPE.DESTROY_CREATURE,
      data: { creatureId: 'unknown', reason: 'attack' },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].status).toBe(EFFECT_RESULT.FAILED);
  });
});

describe('ApplyPoisonHandler', () => {
  let queue;
  let gameState;

  beforeEach(() => {
    queue = new EffectQueue();
    queue.registerHandler(new ApplyPoisonHandler());
    gameState = {
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          traits: [],
        }],
      }],
    };
  });

  test('should apply poison', () => {
    queue.enqueue({
      type: EFFECT_TYPE.APPLY_POISON,
      data: { creatureId: 'creature1', source: 'poisonous' },
    });

    const results = queue.resolveAll(gameState);

    expect(results[0].status).toBe(EFFECT_RESULT.SUCCESS);
    expect(gameState.players[0].creatures[0].isPoisoned).toBe(true);
  });
});

describe('registerBuiltinHandlers', () => {
  test('should register all handlers', () => {
    const queue = new EffectQueue();
    registerBuiltinHandlers(queue);

    // 應該有 9 個內建處理器
    expect(queue.handlers.length).toBe(9);
  });
});

// ==================== 整合測試 ====================

describe('Effect System Integration', () => {
  test('should process multiple effects in order', () => {
    const queue = new EffectQueue();
    registerBuiltinHandlers(queue);

    const gameState = {
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          food: { red: 0, blue: 0, yellow: 0 },
          foodNeeded: 2,
          traits: [{ type: 'fatTissue' }],
        }],
        discardPile: [],
      }],
    };

    // 加入多個效果
    queue.enqueue({
      type: EFFECT_TYPE.GAIN_FOOD,
      priority: EFFECT_PRIORITY.NORMAL,
      data: { creatureId: 'creature1', amount: 2, foodType: 'red' },
    });
    queue.enqueue({
      type: EFFECT_TYPE.STORE_FAT,
      priority: EFFECT_PRIORITY.LOW,
      data: { creatureId: 'creature1', amount: 1 },
    });

    const results = queue.resolveAll(gameState);

    expect(results.length).toBe(2);
    expect(gameState.players[0].creatures[0].food.red).toBe(2);
    expect(gameState.players[0].creatures[0].food.yellow).toBe(1);
  });

  test('should handle effect cancellation during processing', () => {
    const queue = new EffectQueue();
    registerBuiltinHandlers(queue);

    const gameState = {
      effectQueue: queue,
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          food: { red: 0, blue: 0, yellow: 0 },
          foodNeeded: 2,
          traits: [],
        }],
      }],
    };

    const effect1 = queue.enqueue({
      type: EFFECT_TYPE.GAIN_FOOD,
      data: { creatureId: 'creature1', amount: 1 },
    });

    // 取消第一個效果
    queue.cancel(effect1.id);

    const results = queue.resolveAll(gameState);

    expect(results[0].status).toBe(EFFECT_RESULT.CANCELLED);
    expect(gameState.players[0].creatures[0].food.red).toBe(0);
  });
});
