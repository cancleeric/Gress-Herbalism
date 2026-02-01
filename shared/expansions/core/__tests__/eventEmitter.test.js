/**
 * 事件發射器測試
 * @module expansions/core/__tests__/eventEmitter.test
 */

const { GameEventEmitter } = require('../eventEmitter');
const { GAME_EVENTS, EventData } = require('../gameEvents');
const { TraitEventBridge } = require('../traitEventBridge');

// ==================== GameEventEmitter 測試 ====================

describe('GameEventEmitter', () => {
  let emitter;

  beforeEach(() => {
    emitter = new GameEventEmitter();
  });

  describe('on/emit', () => {
    test('should emit and receive events', async () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      await emitter.emit('test', { value: 42 });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].data.value).toBe(42);
    });

    test('should receive event type', async () => {
      const callback = jest.fn();
      emitter.on('test:event', callback);

      await emitter.emit('test:event', { foo: 'bar' });

      expect(callback.mock.calls[0][0].type).toBe('test:event');
    });

    test('should receive timestamp', async () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      const before = Date.now();
      await emitter.emit('test');
      const after = Date.now();

      expect(callback.mock.calls[0][0].timestamp).toBeGreaterThanOrEqual(before);
      expect(callback.mock.calls[0][0].timestamp).toBeLessThanOrEqual(after);
    });

    test('should respect priority order', async () => {
      const order = [];

      emitter.on('test', () => order.push('low'), { priority: 10 });
      emitter.on('test', () => order.push('high'), { priority: 100 });
      emitter.on('test', () => order.push('medium'), { priority: 50 });

      await emitter.emit('test');

      expect(order).toEqual(['high', 'medium', 'low']);
    });

    test('should return unsubscribe function', async () => {
      const callback = jest.fn();
      const unsubscribe = emitter.on('test', callback);

      await emitter.emit('test');
      unsubscribe();
      await emitter.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should support filter', async () => {
      const callback = jest.fn();
      emitter.on('test', callback, {
        filter: (data) => data.pass === true,
      });

      await emitter.emit('test', { pass: false });
      await emitter.emit('test', { pass: true });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('once', () => {
    test('should only trigger once', async () => {
      const callback = jest.fn();
      emitter.once('test', callback);

      await emitter.emit('test');
      await emitter.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('off', () => {
    test('should remove listener', async () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      emitter.off('test', callback);

      await emitter.emit('test');

      expect(callback).not.toHaveBeenCalled();
    });

    test('should return false for non-existent listener', () => {
      const result = emitter.off('test', jest.fn());
      expect(result).toBe(false);
    });
  });

  describe('offAll', () => {
    test('should remove all listeners for event', async () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      emitter.on('test', cb1);
      emitter.on('test', cb2);

      emitter.offAll('test');
      await emitter.emit('test');

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });

    test('should remove all listeners when no event specified', async () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      emitter.on('event1', cb1);
      emitter.on('event2', cb2);

      emitter.offAll();
      await emitter.emit('event1');
      await emitter.emit('event2');

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });
  });

  describe('onAny', () => {
    test('should receive all events', async () => {
      const callback = jest.fn();
      emitter.onAny(callback);

      await emitter.emit('event1');
      await emitter.emit('event2');

      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('should respect priority', async () => {
      const order = [];

      emitter.onAny(() => order.push('wildcard-low'), { priority: 10 });
      emitter.on('test', () => order.push('specific-high'), { priority: 100 });
      emitter.onAny(() => order.push('wildcard-high'), { priority: 90 });

      await emitter.emit('test');

      expect(order).toEqual(['wildcard-high', 'wildcard-low', 'specific-high']);
    });
  });

  describe('emitSync', () => {
    test('should emit synchronously', () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      emitter.emitSync('test', { value: 1 });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause/resume', () => {
    test('should queue events when paused', async () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      emitter.pause();
      await emitter.emit('test');

      expect(callback).not.toHaveBeenCalled();
      expect(emitter.queuedCount).toBe(1);

      await emitter.resume();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(emitter.queuedCount).toBe(0);
    });

    test('should queue multiple events', async () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      emitter.pause();
      await emitter.emit('test', { n: 1 });
      await emitter.emit('test', { n: 2 });
      await emitter.emit('test', { n: 3 });

      expect(emitter.queuedCount).toBe(3);

      await emitter.resume();

      expect(callback).toHaveBeenCalledTimes(3);
    });

    test('should resumeSync correctly', () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      emitter.pause();
      emitter.emitSync('test');

      expect(callback).not.toHaveBeenCalled();

      emitter.resumeSync();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('event history', () => {
    test('should record event history', async () => {
      await emitter.emit('test1', { a: 1 });
      await emitter.emit('test2', { b: 2 });

      const history = emitter.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].type).toBe('test1');
      expect(history[1].type).toBe('test2');
    });

    test('should filter history by type', async () => {
      await emitter.emit('type1');
      await emitter.emit('type2');
      await emitter.emit('type1');

      const history = emitter.getHistoryByType('type1');
      expect(history.length).toBe(2);
    });

    test('should limit history size', async () => {
      emitter.maxHistorySize = 3;

      await emitter.emit('e1');
      await emitter.emit('e2');
      await emitter.emit('e3');
      await emitter.emit('e4');

      const history = emitter.getHistory();
      expect(history.length).toBe(3);
      expect(history[0].type).toBe('e2');
    });

    test('should clear history', async () => {
      await emitter.emit('test');
      emitter.clearHistory();

      expect(emitter.getHistory().length).toBe(0);
    });
  });

  describe('event cancellation', () => {
    test('should stop propagation when cancelled', async () => {
      const results = [];

      emitter.on('test', (event) => {
        results.push(1);
        event.cancelled = true;
      }, { priority: 100 });

      emitter.on('test', () => results.push(2), { priority: 50 });

      await emitter.emit('test');

      expect(results).toEqual([1]);
    });
  });

  describe('listenerCount', () => {
    test('should count listeners for event', () => {
      emitter.on('test', jest.fn());
      emitter.on('test', jest.fn());

      expect(emitter.listenerCount('test')).toBe(2);
    });

    test('should count all listeners', () => {
      emitter.on('test1', jest.fn());
      emitter.on('test2', jest.fn());
      emitter.onAny(jest.fn());

      expect(emitter.listenerCount()).toBe(3);
    });
  });

  describe('eventNames', () => {
    test('should return all event names', () => {
      emitter.on('event1', jest.fn());
      emitter.on('event2', jest.fn());

      const names = emitter.eventNames();
      expect(names).toContain('event1');
      expect(names).toContain('event2');
    });
  });

  describe('hasListeners', () => {
    test('should return true when has listeners', () => {
      emitter.on('test', jest.fn());
      expect(emitter.hasListeners('test')).toBe(true);
    });

    test('should return false when no listeners', () => {
      expect(emitter.hasListeners('test')).toBe(false);
    });

    test('should return true with wildcard listeners', () => {
      emitter.onAny(jest.fn());
      expect(emitter.hasListeners('any-event')).toBe(true);
    });
  });

  describe('reset', () => {
    test('should reset all state', async () => {
      emitter.on('test', jest.fn());
      emitter.onAny(jest.fn());
      await emitter.emit('test');
      emitter.pause();
      await emitter.emit('test');

      emitter.reset();

      expect(emitter.listenerCount()).toBe(0);
      expect(emitter.getHistory().length).toBe(0);
      expect(emitter.queuedCount).toBe(0);
      expect(emitter.paused).toBe(false);
    });
  });
});

// ==================== GAME_EVENTS 測試 ====================

describe('GAME_EVENTS', () => {
  test('should have game lifecycle events', () => {
    expect(GAME_EVENTS.GAME_CREATED).toBe('game:created');
    expect(GAME_EVENTS.GAME_STARTED).toBe('game:started');
    expect(GAME_EVENTS.GAME_ENDED).toBe('game:ended');
  });

  test('should have phase events', () => {
    expect(GAME_EVENTS.PHASE_ENTER).toBe('phase:enter');
    expect(GAME_EVENTS.PHASE_EXIT).toBe('phase:exit');
  });

  test('should have creature events', () => {
    expect(GAME_EVENTS.CREATURE_CREATED).toBe('creature:created');
    expect(GAME_EVENTS.CREATURE_DIED).toBe('creature:died');
    expect(GAME_EVENTS.CREATURE_FED).toBe('creature:fed');
  });

  test('should have attack events', () => {
    expect(GAME_EVENTS.ATTACK_DECLARED).toBe('attack:declared');
    expect(GAME_EVENTS.ATTACK_SUCCEEDED).toBe('attack:succeeded');
    expect(GAME_EVENTS.ATTACK_BLOCKED).toBe('attack:blocked');
  });
});

// ==================== EventData 測試 ====================

describe('EventData', () => {
  test('should create base event data', () => {
    const data = EventData.base('game-1');
    expect(data.gameId).toBe('game-1');
    expect(data.timestamp).toBeDefined();
  });

  test('should create phase event data', () => {
    const data = EventData.phase('game-1', 'feeding', 3);
    expect(data.gameId).toBe('game-1');
    expect(data.phase).toBe('feeding');
    expect(data.round).toBe(3);
  });

  test('should create player event data', () => {
    const data = EventData.player('game-1', 'player-1', 'feed', { extra: true });
    expect(data.playerId).toBe('player-1');
    expect(data.action).toBe('feed');
    expect(data.extra).toBe(true);
  });

  test('should create creature event data', () => {
    const data = EventData.creature('game-1', 'creature-1', 'player-1', { food: 2 });
    expect(data.creatureId).toBe('creature-1');
    expect(data.ownerId).toBe('player-1');
    expect(data.food).toBe(2);
  });

  test('should create attack event data', () => {
    const data = EventData.attack('game-1', 'p1', 'c1', 'p2', 'c2');
    expect(data.attackerId).toBe('p1');
    expect(data.attackerCreatureId).toBe('c1');
    expect(data.defenderId).toBe('p2');
    expect(data.defenderCreatureId).toBe('c2');
  });

  test('should create link event data', () => {
    const data = EventData.link('game-1', 'c1', 'c2', 'communication');
    expect(data.creature1Id).toBe('c1');
    expect(data.creature2Id).toBe('c2');
    expect(data.linkType).toBe('communication');
  });
});

// ==================== TraitEventBridge 測試 ====================

describe('TraitEventBridge', () => {
  let emitter;
  let bridge;
  let mockRegistry;

  beforeEach(() => {
    emitter = new GameEventEmitter();
    mockRegistry = {
      get: jest.fn(),
    };
    bridge = new TraitEventBridge(emitter, mockRegistry);
  });

  test('should initialize', () => {
    bridge.initialize();
    expect(bridge.initialized).toBe(true);
    expect(bridge.subscriptionCount).toBeGreaterThan(0);
  });

  test('should not initialize twice', () => {
    bridge.initialize();
    const count = bridge.subscriptionCount;
    bridge.initialize();
    expect(bridge.subscriptionCount).toBe(count);
  });

  test('should cleanup subscriptions', () => {
    bridge.initialize();
    bridge.cleanup();
    expect(bridge.subscriptionCount).toBe(0);
    expect(bridge.initialized).toBe(false);
  });

  test('should set trait registry', () => {
    const newRegistry = { get: jest.fn() };
    bridge.setTraitRegistry(newRegistry);
    expect(bridge.traitRegistry).toBe(newRegistry);
  });

  test('should trigger trait event', () => {
    const mockHandler = {
      onFeed: jest.fn().mockReturnValue({ result: 'fed' }),
    };
    mockRegistry.get.mockReturnValue(mockHandler);

    const gameState = {
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          traits: [{ type: 'fatTissue' }],
        }],
      }],
    };

    const results = bridge.triggerTraitEvent('onFeed', { gameState });

    expect(mockRegistry.get).toHaveBeenCalledWith('fatTissue');
    expect(mockHandler.onFeed).toHaveBeenCalled();
    expect(results.length).toBe(1);
    expect(results[0].traitType).toBe('fatTissue');
  });

  test('should trigger trait event for specific creature', () => {
    const mockHandler = {
      onDefend: jest.fn().mockReturnValue({ blocked: true }),
    };
    mockRegistry.get.mockReturnValue(mockHandler);

    const gameState = {
      players: [{
        id: 'player1',
        creatures: [
          { id: 'creature1', traits: [{ type: 'camouflage' }] },
          { id: 'creature2', traits: [{ type: 'camouflage' }] },
        ],
      }],
    };

    const results = bridge.triggerTraitEvent('onDefend', { gameState }, 'creature1');

    expect(mockHandler.onDefend).toHaveBeenCalledTimes(1);
    expect(results.length).toBe(1);
    expect(results[0].creatureId).toBe('creature1');
  });

  test('should handle trait error gracefully', () => {
    const mockHandler = {
      onFeed: jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      }),
    };
    mockRegistry.get.mockReturnValue(mockHandler);

    const gameState = {
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          traits: [{ type: 'testTrait' }],
        }],
      }],
    };

    const results = bridge.triggerTraitEvent('onFeed', { gameState });

    expect(results.length).toBe(1);
    expect(results[0].error).toBe('Test error');
  });

  test('should trigger creature traits directly', () => {
    const mockHandler = {
      onAttackDeclared: jest.fn().mockReturnValue({ attacking: true }),
    };
    mockRegistry.get.mockReturnValue(mockHandler);

    const creature = {
      id: 'creature1',
      traits: [{ type: 'carnivore' }],
    };

    const results = bridge.triggerCreatureTraits(creature, 'onAttackDeclared', {
      gameState: {},
    });

    expect(results.length).toBe(1);
    expect(results[0].traitType).toBe('carnivore');
  });
});

// ==================== 整合測試 ====================

describe('Event System Integration', () => {
  test('should bridge game events to trait handlers', async () => {
    const emitter = new GameEventEmitter();
    const mockHandler = {
      onFeed: jest.fn().mockReturnValue({ chain: true }),
    };
    const registry = {
      get: jest.fn().mockReturnValue(mockHandler),
    };

    const bridge = new TraitEventBridge(emitter, registry);
    bridge.initialize();

    const gameState = {
      players: [{
        id: 'player1',
        creatures: [{
          id: 'creature1',
          traits: [{ type: 'communication' }],
        }],
      }],
    };

    await emitter.emit(GAME_EVENTS.CREATURE_FED, { gameState });

    expect(mockHandler.onFeed).toHaveBeenCalled();
  });
});
