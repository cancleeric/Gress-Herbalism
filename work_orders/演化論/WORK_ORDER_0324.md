# 工單 0324：建立效果觸發系統

## 基本資訊
- **工單編號**：0324
- **所屬計畫**：P2-A 可擴充架構
- **前置工單**：0319（TraitHandler 抽象類別）、0321（RuleEngine）
- **預計影響檔案**：
  - `shared/expansions/core/effectSystem.js`（新增）
  - `shared/expansions/core/effectQueue.js`（新增）
  - `shared/expansions/core/effectTypes.js`（新增）
  - `backend/logic/evolution/gameLogic.js`（整合）

---

## 目標

建立統一的效果觸發系統，用於：
1. 管理性狀觸發的效果
2. 處理效果優先順序
3. 支援效果堆疊與解析
4. 為擴充包提供效果擴展點

---

## 詳細規格

### 1. 效果類型定義

```javascript
// shared/expansions/core/effectTypes.js

/**
 * 效果觸發時機
 */
export const EFFECT_TIMING = {
  // 階段開始
  PHASE_START: 'phase_start',
  PHASE_END: 'phase_end',

  // 進食相關
  BEFORE_FEED: 'before_feed',
  ON_FEED: 'on_feed',
  AFTER_FEED: 'after_feed',

  // 攻擊相關
  BEFORE_ATTACK: 'before_attack',
  ON_ATTACK: 'on_attack',
  ATTACK_BLOCKED: 'attack_blocked',
  AFTER_ATTACK: 'after_attack',

  // 被攻擊相關
  BEFORE_DEFEND: 'before_defend',
  ON_DEFEND: 'on_defend',
  AFTER_DEFEND: 'after_defend',

  // 生物狀態
  ON_CREATURE_CREATE: 'on_creature_create',
  ON_CREATURE_DEATH: 'on_creature_death',
  ON_TRAIT_ADD: 'on_trait_add',
  ON_TRAIT_REMOVE: 'on_trait_remove',

  // 回合相關
  TURN_START: 'turn_start',
  TURN_END: 'turn_end',
  ROUND_START: 'round_start',
  ROUND_END: 'round_end',
};

/**
 * 效果類型
 */
export const EFFECT_TYPE = {
  // 進食效果
  GAIN_FOOD: 'gain_food',
  LOSE_FOOD: 'lose_food',
  TRANSFER_FOOD: 'transfer_food',

  // 脂肪效果
  STORE_FAT: 'store_fat',
  USE_FAT: 'use_fat',

  // 攻擊效果
  DEAL_DAMAGE: 'deal_damage',
  BLOCK_ATTACK: 'block_attack',
  REDIRECT_ATTACK: 'redirect_attack',

  // 生物效果
  CREATE_CREATURE: 'create_creature',
  DESTROY_CREATURE: 'destroy_creature',

  // 性狀效果
  ADD_TRAIT: 'add_trait',
  REMOVE_TRAIT: 'remove_trait',
  DISABLE_TRAIT: 'disable_trait',

  // 特殊效果
  SKIP_PHASE: 'skip_phase',
  DRAW_CARD: 'draw_card',
  DISCARD_CARD: 'discard_card',
};

/**
 * 效果優先級（數字越大越先執行）
 */
export const EFFECT_PRIORITY = {
  INSTANT: 100,      // 即時效果（如：毒液致死）
  HIGH: 80,          // 高優先級（如：斷尾）
  NORMAL: 50,        // 一般優先級
  LOW: 20,           // 低優先級
  DELAYED: 0,        // 延遲效果（階段結束時）
};

/**
 * 效果結果
 */
export const EFFECT_RESULT = {
  SUCCESS: 'success',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  REDIRECTED: 'redirected',
  CANCELLED: 'cancelled',
};
```

### 2. 效果類別

```javascript
// shared/expansions/core/effectSystem.js

import { EFFECT_TIMING, EFFECT_TYPE, EFFECT_PRIORITY, EFFECT_RESULT } from './effectTypes.js';

/**
 * 效果類別
 */
export class Effect {
  constructor(options) {
    this.id = options.id || `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = options.type;
    this.timing = options.timing;
    this.priority = options.priority ?? EFFECT_PRIORITY.NORMAL;
    this.source = options.source;           // 效果來源（性狀、規則等）
    this.sourceCreature = options.sourceCreature;  // 觸發效果的生物
    this.target = options.target;           // 目標
    this.data = options.data || {};         // 效果資料
    this.resolved = false;
    this.result = null;
    this.cancelled = false;
  }

  /**
   * 取消效果
   */
  cancel() {
    this.cancelled = true;
    this.result = EFFECT_RESULT.CANCELLED;
  }

  /**
   * 標記為已解析
   */
  resolve(result = EFFECT_RESULT.SUCCESS) {
    this.resolved = true;
    this.result = result;
  }

  /**
   * 複製效果（用於重定向）
   */
  clone(overrides = {}) {
    return new Effect({
      type: this.type,
      timing: this.timing,
      priority: this.priority,
      source: this.source,
      sourceCreature: this.sourceCreature,
      target: this.target,
      data: { ...this.data },
      ...overrides,
    });
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      timing: this.timing,
      priority: this.priority,
      source: this.source,
      sourceCreature: this.sourceCreature,
      target: this.target,
      data: this.data,
      resolved: this.resolved,
      result: this.result,
      cancelled: this.cancelled,
    };
  }
}

/**
 * 效果處理器介面
 */
export class EffectHandler {
  /**
   * 是否可以處理此效果
   * @param {Effect} effect
   * @returns {boolean}
   */
  canHandle(effect) {
    throw new Error('Must implement canHandle()');
  }

  /**
   * 處理效果
   * @param {Effect} effect
   * @param {Object} gameState
   * @returns {Object} 處理結果
   */
  handle(effect, gameState) {
    throw new Error('Must implement handle()');
  }

  /**
   * 效果處理優先級
   */
  getHandlerPriority() {
    return 0;
  }
}
```

### 3. 效果佇列

```javascript
// shared/expansions/core/effectQueue.js

import { EFFECT_PRIORITY, EFFECT_RESULT } from './effectTypes.js';
import { Effect } from './effectSystem.js';

/**
 * 效果佇列
 * 管理效果的排序和解析
 */
export class EffectQueue {
  constructor() {
    this.queue = [];
    this.resolvedEffects = [];
    this.handlers = [];
    this.listeners = new Map();
  }

  /**
   * 註冊效果處理器
   */
  registerHandler(handler) {
    this.handlers.push(handler);
    // 按處理器優先級排序
    this.handlers.sort((a, b) => b.getHandlerPriority() - a.getHandlerPriority());
  }

  /**
   * 移除效果處理器
   */
  removeHandler(handler) {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * 加入效果到佇列
   */
  enqueue(effect) {
    if (!(effect instanceof Effect)) {
      effect = new Effect(effect);
    }
    this.queue.push(effect);
    this.sortQueue();
    this.emit('effectEnqueued', effect);
    return effect;
  }

  /**
   * 批次加入效果
   */
  enqueueBatch(effects) {
    const created = effects.map(e => e instanceof Effect ? e : new Effect(e));
    this.queue.push(...created);
    this.sortQueue();
    created.forEach(e => this.emit('effectEnqueued', e));
    return created;
  }

  /**
   * 排序佇列（優先級高的先執行）
   */
  sortQueue() {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 取消特定效果
   */
  cancel(effectId) {
    const effect = this.queue.find(e => e.id === effectId);
    if (effect) {
      effect.cancel();
      this.emit('effectCancelled', effect);
      return true;
    }
    return false;
  }

  /**
   * 取消符合條件的效果
   */
  cancelWhere(predicate) {
    const cancelled = [];
    for (const effect of this.queue) {
      if (!effect.cancelled && predicate(effect)) {
        effect.cancel();
        cancelled.push(effect);
        this.emit('effectCancelled', effect);
      }
    }
    return cancelled;
  }

  /**
   * 解析所有效果
   */
  resolveAll(gameState) {
    const results = [];

    while (this.queue.length > 0) {
      const effect = this.queue.shift();

      if (effect.cancelled) {
        this.resolvedEffects.push(effect);
        continue;
      }

      const result = this.resolveEffect(effect, gameState);
      results.push(result);
      this.resolvedEffects.push(effect);
    }

    return results;
  }

  /**
   * 解析單一效果
   */
  resolveEffect(effect, gameState) {
    this.emit('beforeResolve', effect);

    // 尋找可處理的處理器
    for (const handler of this.handlers) {
      if (handler.canHandle(effect)) {
        try {
          const result = handler.handle(effect, gameState);
          effect.resolve(result.status || EFFECT_RESULT.SUCCESS);
          this.emit('effectResolved', effect, result);
          return result;
        } catch (error) {
          effect.resolve(EFFECT_RESULT.FAILED);
          this.emit('effectFailed', effect, error);
          return { status: EFFECT_RESULT.FAILED, error: error.message };
        }
      }
    }

    // 無處理器，使用預設處理
    effect.resolve(EFFECT_RESULT.SUCCESS);
    this.emit('effectResolved', effect, { status: EFFECT_RESULT.SUCCESS });
    return { status: EFFECT_RESULT.SUCCESS };
  }

  /**
   * 解析下一個效果
   */
  resolveNext(gameState) {
    if (this.queue.length === 0) {
      return null;
    }

    const effect = this.queue.shift();

    if (effect.cancelled) {
      this.resolvedEffects.push(effect);
      return { effect, status: EFFECT_RESULT.CANCELLED };
    }

    const result = this.resolveEffect(effect, gameState);
    this.resolvedEffects.push(effect);
    return { effect, ...result };
  }

  /**
   * 查看佇列（不移除）
   */
  peek(count = 1) {
    return this.queue.slice(0, count);
  }

  /**
   * 取得佇列長度
   */
  get length() {
    return this.queue.length;
  }

  /**
   * 是否為空
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * 清空佇列
   */
  clear() {
    this.queue = [];
    this.emit('queueCleared');
  }

  /**
   * 取得已解析的效果歷史
   */
  getHistory() {
    return [...this.resolvedEffects];
  }

  /**
   * 清空歷史
   */
  clearHistory() {
    this.resolvedEffects = [];
  }

  // === 事件系統 ===

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, ...args) {
    if (!this.listeners.has(event)) return;
    for (const callback of this.listeners.get(event)) {
      callback(...args);
    }
  }
}

// 預設實例
export const effectQueue = new EffectQueue();
```

### 4. 內建效果處理器

```javascript
// shared/expansions/core/handlers/builtinEffectHandlers.js

import { EffectHandler } from '../effectSystem.js';
import { EFFECT_TYPE, EFFECT_RESULT } from '../effectTypes.js';

/**
 * 進食效果處理器
 */
export class GainFoodHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.GAIN_FOOD;
  }

  handle(effect, gameState) {
    const { creatureId, amount } = effect.data;

    // 找到目標生物
    let creature = null;
    for (const player of Object.values(gameState.players)) {
      creature = player.creatures.find(c => c.id === creatureId);
      if (creature) break;
    }

    if (!creature) {
      return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
    }

    // 計算實際獲得的食物
    const available = creature.maxFood - creature.food;
    const gained = Math.min(amount, available);

    creature.food += gained;

    return {
      status: EFFECT_RESULT.SUCCESS,
      gained,
      newFood: creature.food,
    };
  }

  getHandlerPriority() {
    return 50;
  }
}

/**
 * 儲存脂肪處理器
 */
export class StoreFatHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.STORE_FAT;
  }

  handle(effect, gameState) {
    const { creatureId, amount } = effect.data;

    let creature = null;
    for (const player of Object.values(gameState.players)) {
      creature = player.creatures.find(c => c.id === creatureId);
      if (creature) break;
    }

    if (!creature) {
      return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
    }

    // 檢查是否有脂肪組織
    const hasFatTissue = creature.traits.some(t => t.type === 'FAT_TISSUE');
    if (!hasFatTissue) {
      return { status: EFFECT_RESULT.FAILED, reason: 'No fat tissue trait' };
    }

    // 計算可儲存量
    const fatCapacity = creature.traits.filter(t => t.type === 'FAT_TISSUE').length;
    const available = fatCapacity - (creature.fat || 0);
    const stored = Math.min(amount, available);

    creature.fat = (creature.fat || 0) + stored;

    return {
      status: EFFECT_RESULT.SUCCESS,
      stored,
      newFat: creature.fat,
    };
  }

  getHandlerPriority() {
    return 45;
  }
}

/**
 * 攻擊阻擋處理器
 */
export class BlockAttackHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.BLOCK_ATTACK;
  }

  handle(effect, gameState) {
    const { attackEffectId, reason, blockedBy } = effect.data;

    // 找到原始攻擊效果並取消
    // 這需要 EffectQueue 的參考
    // 通常通過 gameState.effectQueue 存取
    if (gameState.effectQueue) {
      const cancelled = gameState.effectQueue.cancel(attackEffectId);
      if (cancelled) {
        return {
          status: EFFECT_RESULT.SUCCESS,
          attackBlocked: true,
          blockedBy,
          reason,
        };
      }
    }

    return {
      status: EFFECT_RESULT.FAILED,
      reason: 'Could not find attack effect to block',
    };
  }

  getHandlerPriority() {
    return 90; // 高優先級，先處理阻擋
  }
}

/**
 * 生物死亡處理器
 */
export class DestroyCreatureHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.DESTROY_CREATURE;
  }

  handle(effect, gameState) {
    const { creatureId, reason } = effect.data;

    // 找到並移除生物
    for (const player of Object.values(gameState.players)) {
      const index = player.creatures.findIndex(c => c.id === creatureId);
      if (index !== -1) {
        const [removed] = player.creatures.splice(index, 1);

        // 記錄到墓地
        if (!player.graveyard) {
          player.graveyard = [];
        }
        player.graveyard.push({
          ...removed,
          deathReason: reason,
          diedAt: Date.now(),
        });

        return {
          status: EFFECT_RESULT.SUCCESS,
          removedCreature: removed,
          reason,
        };
      }
    }

    return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
  }

  getHandlerPriority() {
    return 30;
  }
}

/**
 * 註冊所有內建處理器
 */
export function registerBuiltinHandlers(effectQueue) {
  effectQueue.registerHandler(new GainFoodHandler());
  effectQueue.registerHandler(new StoreFatHandler());
  effectQueue.registerHandler(new BlockAttackHandler());
  effectQueue.registerHandler(new DestroyCreatureHandler());
}
```

### 5. 整合到遊戲邏輯

```javascript
// 在 gameLogic.js 中整合效果系統

import { EffectQueue, Effect } from '@shared/expansions/core/effectQueue.js';
import { EFFECT_TIMING, EFFECT_TYPE } from '@shared/expansions/core/effectTypes.js';
import { registerBuiltinHandlers } from '@shared/expansions/core/handlers/builtinEffectHandlers.js';

/**
 * 初始化遊戲時建立效果佇列
 */
function initializeGame(gameState) {
  gameState.effectQueue = new EffectQueue();
  registerBuiltinHandlers(gameState.effectQueue);

  // ... 其他初始化
}

/**
 * 觸發階段效果
 */
function triggerPhaseEffects(gameState, phase, timing) {
  const { effectQueue } = gameState;

  // 收集所有生物的階段效果
  for (const player of Object.values(gameState.players)) {
    for (const creature of player.creatures) {
      for (const trait of creature.traits) {
        const handler = ExpansionRegistry.getTraitHandler(trait.type);
        if (handler && handler.onPhase) {
          const effects = handler.onPhase(phase, timing, creature, gameState);
          if (effects && effects.length > 0) {
            effectQueue.enqueueBatch(effects);
          }
        }
      }
    }
  }

  // 解析所有效果
  return effectQueue.resolveAll(gameState);
}
```

---

## 測試需求

```javascript
// tests/unit/expansions/core/effectSystem.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { Effect } from '@shared/expansions/core/effectSystem.js';
import { EffectQueue } from '@shared/expansions/core/effectQueue.js';
import { EFFECT_TYPE, EFFECT_TIMING, EFFECT_PRIORITY, EFFECT_RESULT } from '@shared/expansions/core/effectTypes.js';

describe('Effect', () => {
  it('should create effect with defaults', () => {
    const effect = new Effect({
      type: EFFECT_TYPE.GAIN_FOOD,
      timing: EFFECT_TIMING.ON_FEED,
    });

    expect(effect.type).toBe(EFFECT_TYPE.GAIN_FOOD);
    expect(effect.priority).toBe(EFFECT_PRIORITY.NORMAL);
    expect(effect.resolved).toBe(false);
  });

  it('should cancel effect', () => {
    const effect = new Effect({ type: EFFECT_TYPE.GAIN_FOOD });
    effect.cancel();

    expect(effect.cancelled).toBe(true);
    expect(effect.result).toBe(EFFECT_RESULT.CANCELLED);
  });
});

describe('EffectQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new EffectQueue();
  });

  it('should enqueue and sort by priority', () => {
    queue.enqueue({ type: 'A', priority: 20 });
    queue.enqueue({ type: 'B', priority: 80 });
    queue.enqueue({ type: 'C', priority: 50 });

    const peeked = queue.peek(3);
    expect(peeked[0].priority).toBe(80);
    expect(peeked[1].priority).toBe(50);
    expect(peeked[2].priority).toBe(20);
  });

  it('should cancel specific effect', () => {
    const effect = queue.enqueue({ type: 'TEST' });
    const cancelled = queue.cancel(effect.id);

    expect(cancelled).toBe(true);
    expect(effect.cancelled).toBe(true);
  });

  it('should emit events', () => {
    const events = [];
    queue.on('effectEnqueued', (e) => events.push(['enqueued', e.id]));

    const effect = queue.enqueue({ type: 'TEST' });

    expect(events.length).toBe(1);
    expect(events[0][0]).toBe('enqueued');
  });
});
```

---

## 驗收標準

1. [ ] `Effect` 類別可建立、取消、解析效果
2. [ ] `EffectQueue` 正確排序和處理效果
3. [ ] 效果處理器可註冊和執行
4. [ ] 內建處理器（進食、脂肪、攻擊阻擋、死亡）正常運作
5. [ ] 事件系統正確觸發
6. [ ] 整合到 gameLogic.js
7. [ ] 所有單元測試通過

---

## 備註

- 效果系統是擴充包的核心
- 新擴充包可註冊自己的效果處理器
- 優先級系統確保效果按正確順序解析
