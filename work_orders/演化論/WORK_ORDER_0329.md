# 工單 0329：更新單元測試（新架構）

## 基本資訊
- **工單編號**：0329
- **所屬計畫**：P2-A 可擴充架構
- **前置工單**：0317-0328（全部架構工單）
- **預計影響檔案**：
  - `tests/unit/expansions/**/*.test.js`（新增/更新）
  - `tests/setup/expansionTestUtils.js`（新增）
  - `vitest.config.js`（更新）

---

## 目標

為新擴充架構建立完整的單元測試，確保：
1. 所有核心模組有測試覆蓋
2. 測試工具方便擴充包開發
3. Mock 機制完整
4. 測試覆蓋率達到 80% 以上

---

## 詳細規格

### 1. 測試目錄結構

```
tests/
├── unit/
│   └── expansions/
│       ├── core/
│       │   ├── effectSystem.test.js     # 效果系統測試
│       │   ├── effectQueue.test.js      # 效果佇列測試
│       │   ├── eventEmitter.test.js     # 事件系統測試
│       │   └── traitEventBridge.test.js # 性狀事件橋接測試
│       ├── registry/
│       │   ├── expansionRegistry.test.js # 擴充包註冊表測試
│       │   ├── loader.test.js           # 載入器測試
│       │   └── validator.test.js        # 驗證器測試
│       ├── base/
│       │   ├── traits/
│       │   │   ├── definitions.test.js  # 性狀定義測試
│       │   │   └── handlers.test.js     # 處理器測試
│       │   └── cards/
│       │       ├── definitions.test.js  # 卡牌定義測試
│       │       └── cardFactory.test.js  # 卡牌工廠測試
│       └── rules/
│           ├── ruleEngine.test.js       # 規則引擎測試
│           └── baseRules.test.js        # 基礎規則測試
├── setup/
│   ├── expansionTestUtils.js            # 擴充包測試工具
│   └── mockExpansion.js                 # Mock 擴充包
└── integration/
    └── expansions/
        └── fullGame.test.js             # 完整遊戲流程測試
```

### 2. 測試工具函式

```javascript
// tests/setup/expansionTestUtils.js

import { vi } from 'vitest';
import { EXPANSION_TYPE } from '@shared/expansions/manifest.js';

/**
 * 建立 Mock 遊戲狀態
 */
export function createMockGameState(overrides = {}) {
  return {
    id: 'test-game',
    config: {
      expansions: ['base'],
      variants: {},
      timeouts: {},
      settings: {},
    },
    status: 'playing',
    round: 1,
    currentPhase: 'feeding',
    currentPlayerIndex: 0,
    turnOrder: ['player1', 'player2'],
    players: {
      player1: createMockPlayer('player1'),
      player2: createMockPlayer('player2'),
    },
    deck: [],
    discardPile: [],
    foodPool: 5,
    eventEmitter: createMockEventEmitter(),
    effectQueue: createMockEffectQueue(),
    ...overrides,
  };
}

/**
 * 建立 Mock 玩家
 */
export function createMockPlayer(playerId, overrides = {}) {
  return {
    id: playerId,
    name: `Player ${playerId}`,
    hand: [],
    creatures: [],
    graveyard: [],
    passed: false,
    connected: true,
    lastAction: Date.now(),
    ...overrides,
  };
}

/**
 * 建立 Mock 生物
 */
export function createMockCreature(creatureId, ownerId, overrides = {}) {
  return {
    id: creatureId,
    ownerId,
    traits: [],
    food: 0,
    maxFood: 1,
    fat: 0,
    ...overrides,
  };
}

/**
 * 為玩家添加生物
 */
export function addCreatureToPlayer(gameState, playerId, creature) {
  const player = gameState.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);
  player.creatures.push(creature);
  return creature;
}

/**
 * 為生物添加性狀
 */
export function addTraitToCreature(creature, traitType, options = {}) {
  const trait = {
    type: traitType,
    ...options,
  };
  creature.traits.push(trait);

  // 更新食量
  if (options.foodBonus) {
    creature.maxFood += options.foodBonus;
  }

  return trait;
}

/**
 * 建立 Mock 卡牌
 */
export function createMockCard(cardId, frontTrait, backTrait) {
  return {
    id: cardId,
    instanceId: `${cardId}_${Date.now()}`,
    frontTrait,
    backTrait,
    expansion: 'base',
    selectedSide: null,
    selectSide(side) {
      this.selectedSide = side;
      return this;
    },
    getSelectedTrait() {
      if (!this.selectedSide) return null;
      return this.selectedSide === 'front' ? this.frontTrait : this.backTrait;
    },
  };
}

/**
 * 建立 Mock 事件發射器
 */
export function createMockEventEmitter() {
  return {
    emit: vi.fn().mockResolvedValue([]),
    emitSync: vi.fn().mockReturnValue([]),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
    once: vi.fn().mockReturnValue(() => {}),
    getHistory: vi.fn().mockReturnValue([]),
  };
}

/**
 * 建立 Mock 效果佇列
 */
export function createMockEffectQueue() {
  return {
    enqueue: vi.fn(),
    enqueueBatch: vi.fn(),
    resolveAll: vi.fn().mockReturnValue([]),
    resolveNext: vi.fn().mockReturnValue(null),
    cancel: vi.fn().mockReturnValue(true),
    isEmpty: vi.fn().mockReturnValue(true),
    length: 0,
  };
}

/**
 * 建立 Mock 擴充包
 */
export function createMockExpansion(id, overrides = {}) {
  return {
    manifest: {
      id,
      name: `Mock ${id}`,
      nameEn: `Mock ${id}`,
      version: '1.0.0',
      type: EXPANSION_TYPE.EXPANSION,
      dependencies: {},
      conflicts: {},
      minPlayers: 2,
      maxPlayers: 4,
      ...overrides.manifest,
    },
    traits: overrides.traits || {},
    cards: overrides.cards || [],
    traitHandlers: overrides.traitHandlers || {},
    createDeck: vi.fn().mockReturnValue([]),
    ...overrides,
  };
}

/**
 * 建立 Mock TraitHandler
 */
export function createMockTraitHandler(traitType, overrides = {}) {
  return {
    traitType,
    canPlace: vi.fn().mockReturnValue({ allowed: true }),
    onPlace: vi.fn(),
    checkDefense: vi.fn().mockReturnValue({ blocked: false }),
    getDefenseResponse: vi.fn().mockReturnValue(null),
    onFeed: vi.fn(),
    useAbility: vi.fn(),
    onRoundStart: vi.fn(),
    onRoundEnd: vi.fn(),
    getFoodBonus: vi.fn().mockReturnValue(0),
    getDefinition: vi.fn().mockReturnValue({ type: traitType, name: traitType }),
    ...overrides,
  };
}

/**
 * 設定遊戲進入特定階段
 */
export function setGamePhase(gameState, phase) {
  gameState.currentPhase = phase;
  return gameState;
}

/**
 * 模擬進食行動
 */
export function simulateFeed(gameState, creatureId, amount = 1) {
  for (const player of Object.values(gameState.players)) {
    const creature = player.creatures.find(c => c.id === creatureId);
    if (creature) {
      const available = creature.maxFood - creature.food;
      const gained = Math.min(amount, available);
      creature.food += gained;
      gameState.foodPool -= gained;
      return { creature, gained };
    }
  }
  throw new Error(`Creature ${creatureId} not found`);
}

/**
 * 建立測試斷言輔助
 */
export const assertHelpers = {
  /**
   * 斷言生物存活
   */
  assertCreatureAlive(gameState, creatureId) {
    for (const player of Object.values(gameState.players)) {
      if (player.creatures.some(c => c.id === creatureId)) {
        return true;
      }
    }
    throw new Error(`Expected creature ${creatureId} to be alive`);
  },

  /**
   * 斷言生物死亡
   */
  assertCreatureDead(gameState, creatureId) {
    for (const player of Object.values(gameState.players)) {
      if (player.graveyard.some(c => c.id === creatureId)) {
        return true;
      }
    }
    throw new Error(`Expected creature ${creatureId} to be dead`);
  },

  /**
   * 斷言生物有指定性狀
   */
  assertCreatureHasTrait(gameState, creatureId, traitType) {
    for (const player of Object.values(gameState.players)) {
      const creature = player.creatures.find(c => c.id === creatureId);
      if (creature && creature.traits.some(t => t.type === traitType)) {
        return true;
      }
    }
    throw new Error(`Expected creature ${creatureId} to have trait ${traitType}`);
  },

  /**
   * 斷言食物池數量
   */
  assertFoodPool(gameState, expectedAmount) {
    if (gameState.foodPool !== expectedAmount) {
      throw new Error(`Expected food pool ${expectedAmount}, got ${gameState.foodPool}`);
    }
    return true;
  },
};
```

### 3. Mock 擴充包

```javascript
// tests/setup/mockExpansion.js

import { EXPANSION_TYPE } from '@shared/expansions/manifest.js';

/**
 * 完整的 Mock 擴充包（用於整合測試）
 */
export const mockBaseExpansion = {
  manifest: {
    id: 'mock-base',
    name: 'Mock 基礎版',
    nameEn: 'Mock Base',
    version: '1.0.0',
    type: EXPANSION_TYPE.BASE,
    dependencies: {},
    conflicts: {},
    minPlayers: 2,
    maxPlayers: 4,
    contents: {
      cards: 12,
      traits: 3,
    },
  },

  traits: {
    MOCK_CARNIVORE: {
      type: 'MOCK_CARNIVORE',
      name: 'Mock 肉食',
      nameEn: 'Mock Carnivore',
      foodBonus: 1,
      category: 'carnivore',
      description: '用於測試的肉食性狀',
    },
    MOCK_DEFENSE: {
      type: 'MOCK_DEFENSE',
      name: 'Mock 防禦',
      nameEn: 'Mock Defense',
      foodBonus: 0,
      category: 'defense',
      description: '用於測試的防禦性狀',
    },
    MOCK_FAT: {
      type: 'MOCK_FAT',
      name: 'Mock 脂肪',
      nameEn: 'Mock Fat',
      foodBonus: 0,
      category: 'feeding',
      description: '用於測試的脂肪性狀',
    },
  },

  cards: [
    { id: 'MOCK_001', frontTrait: 'MOCK_CARNIVORE', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'MOCK_002', frontTrait: 'MOCK_DEFENSE', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'MOCK_003', frontTrait: 'MOCK_FAT', backTrait: 'MOCK_FAT', count: 4 },
  ],

  traitHandlers: {
    MOCK_CARNIVORE: {
      traitType: 'MOCK_CARNIVORE',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 1,
      checkDefense: () => ({ blocked: false }),
    },
    MOCK_DEFENSE: {
      traitType: 'MOCK_DEFENSE',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
      checkDefense: (attacker, defender) => ({
        blocked: true,
        reason: 'Mock defense blocks attack',
      }),
    },
    MOCK_FAT: {
      traitType: 'MOCK_FAT',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
    },
  },

  createDeck() {
    const deck = [];
    for (const card of this.cards) {
      for (let i = 0; i < card.count; i++) {
        deck.push({
          id: card.id,
          instanceId: `mock-base_${card.id}_${i}`,
          frontTrait: card.frontTrait,
          backTrait: card.backTrait,
          expansion: 'mock-base',
        });
      }
    }
    return deck;
  },
};

/**
 * Mock 飛行擴充包
 */
export const mockFlightExpansion = {
  manifest: {
    id: 'mock-flight',
    name: 'Mock 飛行',
    nameEn: 'Mock Flight',
    version: '1.0.0',
    type: EXPANSION_TYPE.EXPANSION,
    dependencies: { 'mock-base': '>=1.0.0' },
    conflicts: {},
    minPlayers: 2,
    maxPlayers: 6,
    contents: {
      cards: 8,
      traits: 2,
    },
  },

  traits: {
    MOCK_FLYING: {
      type: 'MOCK_FLYING',
      name: 'Mock 飛行',
      nameEn: 'Mock Flying',
      foodBonus: 0,
      category: 'special',
    },
    MOCK_NESTING: {
      type: 'MOCK_NESTING',
      name: 'Mock 築巢',
      nameEn: 'Mock Nesting',
      foodBonus: 0,
      category: 'special',
    },
  },

  cards: [
    { id: 'FLIGHT_001', frontTrait: 'MOCK_FLYING', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'FLIGHT_002', frontTrait: 'MOCK_NESTING', backTrait: 'MOCK_FAT', count: 4 },
  ],

  traitHandlers: {
    MOCK_FLYING: {
      traitType: 'MOCK_FLYING',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
    },
    MOCK_NESTING: {
      traitType: 'MOCK_NESTING',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
    },
  },
};
```

### 4. 核心測試範例

```javascript
// tests/unit/expansions/core/effectQueue.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EffectQueue } from '@shared/expansions/core/effectQueue.js';
import { Effect, EffectHandler } from '@shared/expansions/core/effectSystem.js';
import { EFFECT_TYPE, EFFECT_PRIORITY, EFFECT_RESULT } from '@shared/expansions/core/effectTypes.js';

describe('EffectQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new EffectQueue();
  });

  describe('enqueue', () => {
    it('should add effect to queue', () => {
      const effect = queue.enqueue({ type: EFFECT_TYPE.GAIN_FOOD });
      expect(queue.length).toBe(1);
      expect(effect).toBeInstanceOf(Effect);
    });

    it('should sort by priority (high first)', () => {
      queue.enqueue({ type: 'A', priority: EFFECT_PRIORITY.LOW });
      queue.enqueue({ type: 'B', priority: EFFECT_PRIORITY.HIGH });
      queue.enqueue({ type: 'C', priority: EFFECT_PRIORITY.NORMAL });

      const effects = queue.peek(3);
      expect(effects[0].type).toBe('B');
      expect(effects[1].type).toBe('C');
      expect(effects[2].type).toBe('A');
    });

    it('should emit effectEnqueued event', () => {
      const callback = vi.fn();
      queue.on('effectEnqueued', callback);

      queue.enqueue({ type: 'TEST' });

      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('cancel', () => {
    it('should cancel effect by id', () => {
      const effect = queue.enqueue({ type: 'TEST' });
      const result = queue.cancel(effect.id);

      expect(result).toBe(true);
      expect(effect.cancelled).toBe(true);
    });

    it('should return false for unknown id', () => {
      const result = queue.cancel('unknown');
      expect(result).toBe(false);
    });
  });

  describe('cancelWhere', () => {
    it('should cancel matching effects', () => {
      queue.enqueue({ type: 'A', data: { target: 'creature1' } });
      queue.enqueue({ type: 'B', data: { target: 'creature2' } });
      queue.enqueue({ type: 'A', data: { target: 'creature1' } });

      const cancelled = queue.cancelWhere(e => e.data.target === 'creature1');

      expect(cancelled).toHaveLength(2);
    });
  });

  describe('resolveAll', () => {
    it('should resolve all effects', () => {
      queue.enqueue({ type: 'A' });
      queue.enqueue({ type: 'B' });

      const gameState = {};
      const results = queue.resolveAll(gameState);

      expect(results).toHaveLength(2);
      expect(queue.isEmpty()).toBe(true);
    });

    it('should skip cancelled effects', () => {
      const effect = queue.enqueue({ type: 'A' });
      queue.enqueue({ type: 'B' });

      effect.cancel();

      const results = queue.resolveAll({});

      // 只有 B 被實際解析
      expect(results).toHaveLength(1);
    });

    it('should use registered handlers', () => {
      const handler = {
        canHandle: vi.fn().mockReturnValue(true),
        handle: vi.fn().mockReturnValue({ status: EFFECT_RESULT.SUCCESS }),
        getHandlerPriority: () => 0,
      };

      queue.registerHandler(handler);
      queue.enqueue({ type: 'TEST' });
      queue.resolveAll({});

      expect(handler.handle).toHaveBeenCalledOnce();
    });
  });

  describe('history', () => {
    it('should record resolved effects', () => {
      queue.enqueue({ type: 'A' });
      queue.enqueue({ type: 'B' });

      queue.resolveAll({});

      const history = queue.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should clear history', () => {
      queue.enqueue({ type: 'A' });
      queue.resolveAll({});

      queue.clearHistory();

      expect(queue.getHistory()).toHaveLength(0);
    });
  });
});
```

### 5. Vitest 配置更新

```javascript
// vitest.config.js（更新版）

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'shared/expansions/**/*.js',
        'backend/logic/evolution/**/*.js',
      ],
      exclude: [
        'node_modules',
        'tests',
        '**/*.test.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    setupFiles: ['./tests/setup/vitest.setup.js'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@backend': path.resolve(__dirname, 'backend'),
      '@tests': path.resolve(__dirname, 'tests'),
    },
  },
});
```

---

## 測試需求

本工單本身就是測試相關，需確保：
1. 所有測試工具正常運作
2. Mock 擴充包可用於整合測試
3. 測試覆蓋率達標

---

## 驗收標準

1. [ ] 測試目錄結構建立完成
2. [ ] `expansionTestUtils.js` 提供完整工具
3. [ ] Mock 擴充包可正常使用
4. [ ] 核心模組測試覆蓋 80%+
5. [ ] Vitest 配置正確
6. [ ] `npm test` 執行無錯誤
7. [ ] 覆蓋率報告可生成

---

## 備註

- 測試工具應隨架構演進持續更新
- Mock 擴充包便於測試新功能
- 斷言輔助減少重複代碼
