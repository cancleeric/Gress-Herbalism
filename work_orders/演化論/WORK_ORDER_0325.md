# 工單 0325：實作事件發布訂閱系統

## 基本資訊
- **工單編號**：0325
- **所屬計畫**：P2-A 可擴充架構
- **前置工單**：0324（效果觸發系統）
- **預計影響檔案**：
  - `shared/expansions/core/eventEmitter.js`（新增）
  - `shared/expansions/core/gameEvents.js`（新增）
  - `backend/logic/evolution/gameLogic.js`（整合）

---

## 目標

建立遊戲內部事件系統，實現：
1. 鬆耦合的模組間通訊
2. 性狀對遊戲事件的監聽和響應
3. 擴充包對核心事件的擴展
4. 遊戲狀態變化的追蹤

---

## 詳細規格

### 1. 遊戲事件定義

```javascript
// shared/expansions/core/gameEvents.js

/**
 * 遊戲事件類型
 */
export const GAME_EVENTS = {
  // === 遊戲生命週期 ===
  GAME_CREATED: 'game:created',
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',

  // === 回合與階段 ===
  ROUND_START: 'round:start',
  ROUND_END: 'round:end',
  PHASE_ENTER: 'phase:enter',
  PHASE_EXIT: 'phase:exit',
  TURN_START: 'turn:start',
  TURN_END: 'turn:end',

  // === 玩家行動 ===
  PLAYER_ACTION: 'player:action',
  PLAYER_PASS: 'player:pass',
  PLAYER_TIMEOUT: 'player:timeout',
  PLAYER_RECONNECT: 'player:reconnect',
  PLAYER_DISCONNECT: 'player:disconnect',

  // === 卡牌操作 ===
  CARD_DRAWN: 'card:drawn',
  CARD_PLAYED: 'card:played',
  CARD_DISCARDED: 'card:discarded',
  DECK_SHUFFLED: 'deck:shuffled',
  DECK_EMPTY: 'deck:empty',

  // === 生物相關 ===
  CREATURE_CREATED: 'creature:created',
  CREATURE_DIED: 'creature:died',
  CREATURE_FED: 'creature:fed',
  CREATURE_HUNGRY: 'creature:hungry',
  CREATURE_SATISFIED: 'creature:satisfied',

  // === 性狀相關 ===
  TRAIT_ADDED: 'trait:added',
  TRAIT_REMOVED: 'trait:removed',
  TRAIT_ACTIVATED: 'trait:activated',
  TRAIT_DEACTIVATED: 'trait:deactivated',

  // === 進食相關 ===
  FOOD_POOL_SET: 'food:pool_set',
  FOOD_TAKEN: 'food:taken',
  FOOD_EXHAUSTED: 'food:exhausted',
  FAT_STORED: 'fat:stored',
  FAT_CONSUMED: 'fat:consumed',

  // === 攻擊相關 ===
  ATTACK_DECLARED: 'attack:declared',
  ATTACK_RESOLVED: 'attack:resolved',
  ATTACK_BLOCKED: 'attack:blocked',
  ATTACK_SUCCEEDED: 'attack:succeeded',
  ATTACK_FAILED: 'attack:failed',

  // === 互動性狀 ===
  LINK_CREATED: 'link:created',
  LINK_BROKEN: 'link:broken',
  FOOD_SHARED: 'food:shared',

  // === 滅絕 ===
  EXTINCTION_START: 'extinction:start',
  EXTINCTION_END: 'extinction:end',

  // === 計分 ===
  SCORE_UPDATED: 'score:updated',
  WINNER_DETERMINED: 'winner:determined',
};

/**
 * 事件資料介面
 */
export const EventData = {
  // 基礎事件資料
  base: (gameId, timestamp = Date.now()) => ({
    gameId,
    timestamp,
  }),

  // 階段事件資料
  phase: (gameId, phase, round) => ({
    ...EventData.base(gameId),
    phase,
    round,
  }),

  // 玩家事件資料
  player: (gameId, playerId, action, data = {}) => ({
    ...EventData.base(gameId),
    playerId,
    action,
    ...data,
  }),

  // 生物事件資料
  creature: (gameId, creatureId, ownerId, data = {}) => ({
    ...EventData.base(gameId),
    creatureId,
    ownerId,
    ...data,
  }),

  // 攻擊事件資料
  attack: (gameId, attackerId, attackerCreatureId, defenderId, defenderCreatureId) => ({
    ...EventData.base(gameId),
    attackerId,
    attackerCreatureId,
    defenderId,
    defenderCreatureId,
  }),
};
```

### 2. 遊戲事件發射器

```javascript
// shared/expansions/core/eventEmitter.js

/**
 * 遊戲事件發射器
 * 擴展 Node.js EventEmitter，添加遊戲特定功能
 */
export class GameEventEmitter {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.wildcardListeners = [];
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.paused = false;
    this.queuedEvents = [];
  }

  /**
   * 訂閱事件
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函數
   * @param {Object} options - 選項
   * @returns {Function} 取消訂閱函數
   */
  on(event, callback, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = {
      callback,
      priority: options.priority ?? 0,
      context: options.context || null,
      filter: options.filter || null,
    };

    this.listeners.get(event).push(listener);

    // 按優先級排序（高優先級先執行）
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);

    // 返回取消訂閱函數
    return () => this.off(event, callback);
  }

  /**
   * 訂閱一次性事件
   */
  once(event, callback, options = {}) {
    const wrappedCallback = (...args) => {
      this.off(event, wrappedCallback);
      callback.apply(options.context || null, args);
    };

    return this.on(event, wrappedCallback, options);
  }

  /**
   * 訂閱所有事件（萬用字元）
   */
  onAny(callback, options = {}) {
    const listener = {
      callback,
      priority: options.priority ?? 0,
      context: options.context || null,
    };

    this.wildcardListeners.push(listener);
    this.wildcardListeners.sort((a, b) => b.priority - a.priority);

    return () => {
      const index = this.wildcardListeners.indexOf(listener);
      if (index !== -1) {
        this.wildcardListeners.splice(index, 1);
      }
    };
  }

  /**
   * 取消訂閱
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return false;

    const listeners = this.listeners.get(event);
    const index = listeners.findIndex(l => l.callback === callback);

    if (index !== -1) {
      listeners.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * 取消特定事件的所有訂閱
   */
  offAll(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
      this.wildcardListeners = [];
    }
  }

  /**
   * 發送事件
   * @param {string} event - 事件名稱
   * @param {Object} data - 事件資料
   * @returns {Promise<Object[]>} 所有監聽器的回傳值
   */
  async emit(event, data = {}) {
    // 暫停時加入佇列
    if (this.paused) {
      this.queuedEvents.push({ event, data });
      return [];
    }

    const eventObject = {
      type: event,
      data,
      timestamp: Date.now(),
      cancelled: false,
    };

    // 記錄歷史
    this.recordEvent(eventObject);

    const results = [];

    // 執行萬用字元監聽器
    for (const listener of this.wildcardListeners) {
      if (eventObject.cancelled) break;
      try {
        const result = await this.executeListener(listener, eventObject);
        results.push(result);
      } catch (error) {
        console.error(`Error in wildcard listener for ${event}:`, error);
      }
    }

    // 執行特定事件監聽器
    if (this.listeners.has(event) && !eventObject.cancelled) {
      for (const listener of this.listeners.get(event)) {
        if (eventObject.cancelled) break;

        // 檢查過濾器
        if (listener.filter && !listener.filter(data)) {
          continue;
        }

        try {
          const result = await this.executeListener(listener, eventObject);
          results.push(result);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * 同步發送事件
   */
  emitSync(event, data = {}) {
    if (this.paused) {
      this.queuedEvents.push({ event, data });
      return [];
    }

    const eventObject = {
      type: event,
      data,
      timestamp: Date.now(),
      cancelled: false,
    };

    this.recordEvent(eventObject);

    const results = [];

    for (const listener of this.wildcardListeners) {
      if (eventObject.cancelled) break;
      try {
        const result = listener.callback.call(listener.context, eventObject);
        results.push(result);
      } catch (error) {
        console.error(`Error in wildcard listener for ${event}:`, error);
      }
    }

    if (this.listeners.has(event) && !eventObject.cancelled) {
      for (const listener of this.listeners.get(event)) {
        if (eventObject.cancelled) break;
        if (listener.filter && !listener.filter(data)) continue;

        try {
          const result = listener.callback.call(listener.context, eventObject);
          results.push(result);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * 執行監聽器
   */
  async executeListener(listener, eventObject) {
    const result = listener.callback.call(listener.context, eventObject);

    // 支援 Promise
    if (result instanceof Promise) {
      return await result;
    }

    return result;
  }

  /**
   * 暫停事件發送
   */
  pause() {
    this.paused = true;
  }

  /**
   * 恢復事件發送並處理佇列
   */
  async resume() {
    this.paused = false;

    const queued = [...this.queuedEvents];
    this.queuedEvents = [];

    for (const { event, data } of queued) {
      await this.emit(event, data);
    }
  }

  /**
   * 記錄事件歷史
   */
  recordEvent(eventObject) {
    this.eventHistory.push(eventObject);

    // 限制歷史大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 取得事件歷史
   */
  getHistory(filter = null) {
    if (!filter) {
      return [...this.eventHistory];
    }

    return this.eventHistory.filter(filter);
  }

  /**
   * 取得特定類型的事件歷史
   */
  getHistoryByType(eventType) {
    return this.eventHistory.filter(e => e.type === eventType);
  }

  /**
   * 清空歷史
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * 取得監聽器數量
   */
  listenerCount(event) {
    if (!event) {
      let count = this.wildcardListeners.length;
      for (const listeners of this.listeners.values()) {
        count += listeners.length;
      }
      return count;
    }

    return (this.listeners.get(event)?.length || 0);
  }

  /**
   * 取得所有已註冊的事件類型
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }
}

// 預設實例
export const gameEventEmitter = new GameEventEmitter();
```

### 3. 事件與性狀整合

```javascript
// shared/expansions/core/traitEventBridge.js

import { GAME_EVENTS } from './gameEvents.js';
import { GameEventEmitter } from './eventEmitter.js';

/**
 * 性狀事件橋接器
 * 將遊戲事件轉換為性狀可處理的形式
 */
export class TraitEventBridge {
  constructor(eventEmitter, expansionRegistry) {
    this.eventEmitter = eventEmitter;
    this.expansionRegistry = expansionRegistry;
    this.subscriptions = [];
  }

  /**
   * 初始化事件監聽
   */
  initialize() {
    // 監聽進食事件
    this.subscribe(GAME_EVENTS.CREATURE_FED, (event) => {
      this.triggerTraitEvent('onFeed', event.data);
    });

    // 監聽攻擊事件
    this.subscribe(GAME_EVENTS.ATTACK_DECLARED, (event) => {
      this.triggerTraitEvent('onAttackDeclared', event.data);
    });

    // 監聽被攻擊事件
    this.subscribe(GAME_EVENTS.ATTACK_DECLARED, (event) => {
      this.triggerTraitEvent('onDefend', event.data, event.data.defenderCreatureId);
    });

    // 監聽階段進入事件
    this.subscribe(GAME_EVENTS.PHASE_ENTER, (event) => {
      this.triggerTraitEvent('onPhaseEnter', event.data);
    });

    // 監聽階段離開事件
    this.subscribe(GAME_EVENTS.PHASE_EXIT, (event) => {
      this.triggerTraitEvent('onPhaseExit', event.data);
    });

    // 監聽回合開始
    this.subscribe(GAME_EVENTS.ROUND_START, (event) => {
      this.triggerTraitEvent('onRoundStart', event.data);
    });

    // 監聽回合結束
    this.subscribe(GAME_EVENTS.ROUND_END, (event) => {
      this.triggerTraitEvent('onRoundEnd', event.data);
    });

    // 監聯結創建
    this.subscribe(GAME_EVENTS.LINK_CREATED, (event) => {
      this.triggerTraitEvent('onLinkCreated', event.data);
    });
  }

  /**
   * 訂閱事件
   */
  subscribe(event, callback) {
    const unsubscribe = this.eventEmitter.on(event, callback);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * 觸發性狀事件
   */
  triggerTraitEvent(methodName, eventData, specificCreatureId = null) {
    const { gameState } = eventData;
    if (!gameState) return;

    const results = [];

    for (const player of Object.values(gameState.players)) {
      for (const creature of player.creatures) {
        // 如果指定了特定生物，只處理該生物
        if (specificCreatureId && creature.id !== specificCreatureId) {
          continue;
        }

        for (const trait of creature.traits) {
          const handler = this.expansionRegistry.getTraitHandler(trait.type);

          if (handler && typeof handler[methodName] === 'function') {
            try {
              const result = handler[methodName](creature, gameState, eventData);
              if (result) {
                results.push({
                  creatureId: creature.id,
                  traitType: trait.type,
                  result,
                });
              }
            } catch (error) {
              console.error(`Error in trait ${trait.type}.${methodName}:`, error);
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * 清理所有訂閱
   */
  cleanup() {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions = [];
  }
}
```

### 4. 整合到遊戲邏輯

```javascript
// backend/logic/evolution/gameLogic.js（事件系統整合）

import { GameEventEmitter } from '@shared/expansions/core/eventEmitter.js';
import { GAME_EVENTS, EventData } from '@shared/expansions/core/gameEvents.js';
import { TraitEventBridge } from '@shared/expansions/core/traitEventBridge.js';
import { ExpansionRegistry } from '@shared/expansions/registry.js';

/**
 * 初始化遊戲事件系統
 */
function initializeEventSystem(gameState) {
  // 建立事件發射器
  gameState.eventEmitter = new GameEventEmitter();

  // 建立性狀事件橋接器
  gameState.traitEventBridge = new TraitEventBridge(
    gameState.eventEmitter,
    ExpansionRegistry
  );
  gameState.traitEventBridge.initialize();

  // 發送遊戲創建事件
  gameState.eventEmitter.emit(
    GAME_EVENTS.GAME_CREATED,
    EventData.base(gameState.id)
  );
}

/**
 * 開始遊戲
 */
async function startGame(gameState) {
  // ... 初始化邏輯

  await gameState.eventEmitter.emit(
    GAME_EVENTS.GAME_STARTED,
    EventData.base(gameState.id)
  );
}

/**
 * 進入階段
 */
async function enterPhase(gameState, phase) {
  const previousPhase = gameState.currentPhase;

  // 離開前一階段
  if (previousPhase) {
    await gameState.eventEmitter.emit(
      GAME_EVENTS.PHASE_EXIT,
      EventData.phase(gameState.id, previousPhase, gameState.round)
    );
  }

  // 更新階段
  gameState.currentPhase = phase;

  // 進入新階段
  await gameState.eventEmitter.emit(
    GAME_EVENTS.PHASE_ENTER,
    EventData.phase(gameState.id, phase, gameState.round)
  );
}

/**
 * 生物進食
 */
async function feedCreature(gameState, creatureId, foodAmount) {
  // ... 進食邏輯

  await gameState.eventEmitter.emit(
    GAME_EVENTS.CREATURE_FED,
    EventData.creature(gameState.id, creatureId, creature.ownerId, {
      foodGained: foodAmount,
      totalFood: creature.food,
      gameState, // 傳遞遊戲狀態供性狀處理
    })
  );

  // 檢查是否吃飽
  if (creature.food >= creature.maxFood) {
    await gameState.eventEmitter.emit(
      GAME_EVENTS.CREATURE_SATISFIED,
      EventData.creature(gameState.id, creatureId, creature.ownerId)
    );
  }
}
```

---

## 測試需求

```javascript
// tests/unit/expansions/core/eventEmitter.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEventEmitter } from '@shared/expansions/core/eventEmitter.js';
import { GAME_EVENTS } from '@shared/expansions/core/gameEvents.js';

describe('GameEventEmitter', () => {
  let emitter;

  beforeEach(() => {
    emitter = new GameEventEmitter();
  });

  describe('on/emit', () => {
    it('should emit and receive events', async () => {
      const callback = vi.fn();
      emitter.on('test', callback);

      await emitter.emit('test', { value: 42 });

      expect(callback).toHaveBeenCalledOnce();
      expect(callback.mock.calls[0][0].data.value).toBe(42);
    });

    it('should respect priority order', async () => {
      const order = [];

      emitter.on('test', () => order.push('low'), { priority: 10 });
      emitter.on('test', () => order.push('high'), { priority: 100 });
      emitter.on('test', () => order.push('medium'), { priority: 50 });

      await emitter.emit('test');

      expect(order).toEqual(['high', 'medium', 'low']);
    });
  });

  describe('once', () => {
    it('should only trigger once', async () => {
      const callback = vi.fn();
      emitter.once('test', callback);

      await emitter.emit('test');
      await emitter.emit('test');

      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('off', () => {
    it('should remove listener', async () => {
      const callback = vi.fn();
      emitter.on('test', callback);
      emitter.off('test', callback);

      await emitter.emit('test');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('onAny', () => {
    it('should receive all events', async () => {
      const callback = vi.fn();
      emitter.onAny(callback);

      await emitter.emit('event1');
      await emitter.emit('event2');

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('pause/resume', () => {
    it('should queue events when paused', async () => {
      const callback = vi.fn();
      emitter.on('test', callback);

      emitter.pause();
      await emitter.emit('test');

      expect(callback).not.toHaveBeenCalled();

      await emitter.resume();

      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('history', () => {
    it('should record event history', async () => {
      await emitter.emit('test1', { a: 1 });
      await emitter.emit('test2', { b: 2 });

      const history = emitter.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].type).toBe('test1');
      expect(history[1].type).toBe('test2');
    });

    it('should filter history by type', async () => {
      await emitter.emit('type1');
      await emitter.emit('type2');
      await emitter.emit('type1');

      const history = emitter.getHistoryByType('type1');
      expect(history.length).toBe(2);
    });
  });

  describe('event cancellation', () => {
    it('should stop propagation when cancelled', async () => {
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
});
```

---

## 驗收標準

1. [ ] `GameEventEmitter` 支援基本的 on/off/emit
2. [ ] 事件優先級正確排序
3. [ ] once 事件只觸發一次
4. [ ] onAny 可監聽所有事件
5. [ ] pause/resume 正確處理事件佇列
6. [ ] 事件歷史正確記錄
7. [ ] `TraitEventBridge` 正確橋接遊戲事件到性狀
8. [ ] 整合到 gameLogic.js
9. [ ] 所有單元測試通過

---

## 備註

- 事件系統是擴充包與核心遊戲溝通的橋樑
- 高優先級監聽器可取消事件傳播
- 歷史記錄便於除錯和重播功能
