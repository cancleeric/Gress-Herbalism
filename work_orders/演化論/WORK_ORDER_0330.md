# 工單 0330：整合測試與架構文件

## 基本資訊
- **工單編號**：0330
- **所屬計畫**：P2-A 可擴充架構
- **前置工單**：0329（單元測試）
- **預計影響檔案**：
  - `tests/integration/expansions/*.test.js`（新增）
  - `docs/演化論/ARCHITECTURE_EXPANSION.md`（新增）
  - `docs/演化論/GUIDE_EXPANSION_DEVELOPMENT.md`（新增）

---

## 目標

1. 建立完整的整合測試，驗證擴充包架構端到端運作
2. 撰寫架構文件說明系統設計
3. 撰寫擴充包開發指南供未來擴充使用

---

## 詳細規格

### 1. 整合測試

```javascript
// tests/integration/expansions/fullGameFlow.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameInitializer } from '@backend/logic/evolution/gameInitializer.js';
import { ExpansionRegistry } from '@shared/expansions/registry.js';
import { expansionLoader } from '@shared/expansions/loader.js';
import { GAME_PHASES } from '@shared/constants/evolution.js';
import { mockBaseExpansion } from '@tests/setup/mockExpansion.js';

describe('Full Game Flow Integration', () => {
  let gameInitializer;
  let gameState;

  beforeEach(async () => {
    // 重置註冊表
    ExpansionRegistry.enabledExpansions.clear();
    ExpansionRegistry.traitHandlers.clear();

    // 載入基礎版
    expansionLoader.registerPath('base', '@shared/expansions/base/index.js');
    await ExpansionRegistry.enableExpansion('base');

    gameInitializer = new GameInitializer();
  });

  describe('Game Initialization', () => {
    it('should initialize game with 2 players', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(gameState.id).toBe('test-game');
      expect(Object.keys(gameState.players)).toHaveLength(2);
      expect(gameState.deck.length).toBeGreaterThan(0);
      expect(gameState.status).toBe('ready');
    });

    it('should deal initial cards to all players', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(gameState.players.p1.hand.length).toBeGreaterThan(0);
      expect(gameState.players.p2.hand.length).toBeGreaterThan(0);
    });

    it('should reject invalid player count', async () => {
      const players = [{ id: 'p1', name: 'Player 1' }];

      await expect(
        gameInitializer.initialize('test-game', players)
      ).rejects.toThrow(/Invalid player count/);
    });
  });

  describe('Game Start', () => {
    beforeEach(async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];
      gameState = await gameInitializer.initialize('test-game', players);
    });

    it('should start game and enter evolution phase', () => {
      gameInitializer.startGame(gameState);

      expect(gameState.status).toBe('playing');
      expect(gameState.round).toBe(1);
      expect(gameState.currentPhase).toBe(GAME_PHASES.EVOLUTION);
    });

    it('should emit game started event', () => {
      const events = [];
      gameState.eventEmitter.on('game:started', (e) => events.push(e));

      gameInitializer.startGame(gameState);

      expect(events).toHaveLength(1);
    });
  });
});

// tests/integration/expansions/traitInteractions.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockGameState, createMockCreature, addCreatureToPlayer, addTraitToCreature } from '@tests/setup/expansionTestUtils.js';
import { ExpansionRegistry } from '@shared/expansions/registry.js';

describe('Trait Interactions Integration', () => {
  let gameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Carnivore Attack', () => {
    it('should allow carnivore to attack unprotected creature', () => {
      // 設定攻擊者（肉食）
      const attacker = createMockCreature('c1', 'player1');
      addTraitToCreature(attacker, 'CARNIVORE', { foodBonus: 1 });
      addCreatureToPlayer(gameState, 'player1', attacker);

      // 設定防禦者（無防禦）
      const defender = createMockCreature('c2', 'player2');
      addCreatureToPlayer(gameState, 'player2', defender);

      // 執行攻擊檢查
      const handler = ExpansionRegistry.getTraitHandler('CARNIVORE');
      const canAttack = handler.checkDefense(attacker, defender, gameState);

      expect(canAttack.blocked).toBe(false);
    });

    it('should block carnivore attack with camouflage', () => {
      const attacker = createMockCreature('c1', 'player1');
      addTraitToCreature(attacker, 'CARNIVORE');
      addCreatureToPlayer(gameState, 'player1', attacker);

      const defender = createMockCreature('c2', 'player2');
      addTraitToCreature(defender, 'CAMOUFLAGE');
      addCreatureToPlayer(gameState, 'player2', defender);

      const handler = ExpansionRegistry.getTraitHandler('CAMOUFLAGE');
      const defense = handler.checkDefense(attacker, defender, gameState);

      expect(defense.blocked).toBe(true);
    });

    it('should allow attack on camouflaged creature with sharp vision', () => {
      const attacker = createMockCreature('c1', 'player1');
      addTraitToCreature(attacker, 'CARNIVORE');
      addTraitToCreature(attacker, 'SHARP_VISION');
      addCreatureToPlayer(gameState, 'player1', attacker);

      const defender = createMockCreature('c2', 'player2');
      addTraitToCreature(defender, 'CAMOUFLAGE');
      addCreatureToPlayer(gameState, 'player2', defender);

      // 銳目應該無視偽裝
      const sharpVisionHandler = ExpansionRegistry.getTraitHandler('SHARP_VISION');
      const canBypass = sharpVisionHandler.canBypassDefense?.(attacker, defender, 'CAMOUFLAGE');

      expect(canBypass).toBe(true);
    });
  });

  describe('Feeding Chain', () => {
    it('should trigger communication food sharing', () => {
      // 建立兩隻有溝通連結的生物
      const creature1 = createMockCreature('c1', 'player1', { maxFood: 2 });
      const creature2 = createMockCreature('c2', 'player1', { maxFood: 2 });

      addTraitToCreature(creature1, 'COMMUNICATION', {
        link: { creatures: ['c1', 'c2'] },
      });
      addTraitToCreature(creature2, 'COMMUNICATION', {
        link: { creatures: ['c1', 'c2'] },
      });

      addCreatureToPlayer(gameState, 'player1', creature1);
      addCreatureToPlayer(gameState, 'player1', creature2);

      // 餵食 creature1
      creature1.food = 1;

      // 溝通應該觸發
      const handler = ExpansionRegistry.getTraitHandler('COMMUNICATION');
      const effects = handler.onFeed?.(creature1, gameState);

      expect(effects).toBeDefined();
    });
  });
});

// tests/integration/expansions/expansionCombination.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { ExpansionRegistry } from '@shared/expansions/registry.js';
import { expansionLoader } from '@shared/expansions/loader.js';
import { compatibilityChecker } from '@shared/expansions/compatibility.js';
import { mockBaseExpansion, mockFlightExpansion } from '@tests/setup/mockExpansion.js';

describe('Expansion Combination Integration', () => {
  beforeEach(() => {
    // 重置
    ExpansionRegistry.enabledExpansions.clear();

    // 註冊 mock 擴充包
    expansionLoader._importModule = async (path) => {
      if (path.includes('mock-base')) return mockBaseExpansion;
      if (path.includes('mock-flight')) return mockFlightExpansion;
      throw new Error('Unknown expansion');
    };

    expansionLoader.registerPath('mock-base', './mock-base');
    expansionLoader.registerPath('mock-flight', './mock-flight');
  });

  it('should check compatibility of expansions', async () => {
    const result = await compatibilityChecker.check(['mock-base', 'mock-flight']);

    expect(result.compatible).toBe(true);
  });

  it('should detect missing dependencies', async () => {
    const result = await compatibilityChecker.check(['mock-flight']);

    expect(result.compatible).toBe(false);
    expect(result.issues.some(i => i.type === 'missing_base')).toBe(true);
  });

  it('should merge traits from multiple expansions', async () => {
    await ExpansionRegistry.enableExpansion('mock-base');
    await ExpansionRegistry.enableExpansion('mock-flight');

    const allTraits = ExpansionRegistry.getAllTraits();

    expect(allTraits).toHaveProperty('MOCK_CARNIVORE');
    expect(allTraits).toHaveProperty('MOCK_FLYING');
  });

  it('should calculate combined player range', async () => {
    await ExpansionRegistry.enableExpansion('mock-base');
    await ExpansionRegistry.enableExpansion('mock-flight');

    const playerRange = ExpansionRegistry.getPlayerRange();

    // mock-base: 2-4, mock-flight: 2-6
    expect(playerRange.minPlayers).toBe(2);
    expect(playerRange.maxPlayers).toBe(6);
  });
});
```

### 2. 架構文件

```markdown
<!-- docs/演化論/ARCHITECTURE_EXPANSION.md -->

# 演化論擴充包架構設計

## 概述

本文件說明演化論遊戲的可擴充架構設計，讓未來擴充包可以無縫整合到現有系統中。

## 核心設計原則

### 1. 開放封閉原則 (OCP)

系統對擴充開放，對修改封閉。新增擴充包不需要修改核心代碼。

### 2. 依賴反轉 (DIP)

核心系統依賴抽象介面（如 `TraitHandler`），擴充包實作這些介面。

### 3. 單一職責 (SRP)

每個模組只負責一件事：
- `ExpansionRegistry`: 管理擴充包註冊
- `TraitHandler`: 封裝單一性狀邏輯
- `RuleEngine`: 管理遊戲規則
- `EffectQueue`: 處理效果解析

## 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                      遊戲前端 (React)                        │
├─────────────────────────────────────────────────────────────┤
│                      Socket.io 通訊層                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  RoomHandler │  │ GameLogic   │  │ ExpansionRegistry   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         │         ┌──────┴──────┐              │             │
│         │         │             │              │             │
│  ┌──────▼──────┐  ▼             ▼       ┌──────▼──────┐     │
│  │ GameState   │  │  RuleEngine │       │  Loader     │     │
│  └─────────────┘  └──────┬──────┘       └──────┬──────┘     │
│                          │                      │            │
│                   ┌──────┴──────┐        ┌──────▼──────┐    │
│                   │             │        │             │    │
│                   ▼             ▼        ▼             ▼    │
│            ┌───────────┐ ┌───────────┐ ┌───────┐ ┌───────┐  │
│            │EffectQueue│ │EventEmitter│ │ Base  │ │Flight │  │
│            └───────────┘ └───────────┘ └───────┘ └───────┘  │
│                                         (擴充包)  (擴充包)   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心模組說明

### ExpansionRegistry

擴充包註冊表，負責：
- 載入和啟用擴充包
- 管理性狀處理器
- 合併卡牌定義
- 處理規則覆寫

```javascript
// 使用範例
await ExpansionRegistry.enableExpansion('base');
await ExpansionRegistry.enableExpansion('flight');

const handler = ExpansionRegistry.getTraitHandler('FLYING');
```

### TraitHandler

性狀處理器抽象類別，定義性狀行為：

```javascript
class TraitHandler {
  canPlace(creature, gameState) { }      // 是否可放置
  onPlace(creature, gameState) { }       // 放置時觸發
  checkDefense(attacker, defender) { }   // 防禦檢查
  onFeed(creature, gameState) { }        // 進食時觸發
  useAbility(creature, target) { }       // 主動能力
}
```

### RuleEngine

規則引擎，支援規則覆寫：

```javascript
// 基礎規則
RuleEngine.registerRule('FOOD_FORMULA', (playerCount) => {
  return roll() + playerCount;
});

// 擴充包覆寫
RuleEngine.overrideRule('FOOD_FORMULA', (playerCount, original) => {
  return original(playerCount) + 2; // 增加額外食物
});
```

### EffectQueue

效果佇列，管理效果觸發順序：

```javascript
queue.enqueue({
  type: EFFECT_TYPE.GAIN_FOOD,
  priority: EFFECT_PRIORITY.NORMAL,
  data: { creatureId, amount: 1 },
});

queue.resolveAll(gameState);
```

## 資料流

### 遊戲初始化流程

```
1. 房主選擇擴充包
2. ExpansionLoader 載入擴充包模組
3. CompatibilityChecker 驗證相容性
4. ExpansionRegistry 註冊內容
5. GameInitializer 建立遊戲狀態
6. 發牌並開始遊戲
```

### 攻擊解析流程

```
1. 玩家宣告攻擊
2. RuleEngine 執行攻擊規則
3. 遍歷防禦者性狀，呼叫 checkDefense()
4. 遍歷攻擊者性狀，檢查是否可無視防禦
5. 產生攻擊效果並加入 EffectQueue
6. EffectQueue 解析效果
7. EventEmitter 發送事件通知
```

## 擴充點

### 1. 新增性狀

實作 `TraitHandler` 介面：

```javascript
class NewTraitHandler extends TraitHandler {
  get traitType() { return 'NEW_TRAIT'; }

  canPlace(creature, gameState) {
    return { allowed: true };
  }

  // 實作其他方法...
}
```

### 2. 新增規則

在擴充包中定義規則覆寫：

```javascript
export const ruleOverrides = [
  {
    ruleId: 'EXISTING_RULE',
    override: (original) => (...args) => {
      // 修改邏輯
      return original(...args);
    },
  },
];
```

### 3. 新增遊戲階段

（需要核心支援，較複雜）

## 最佳實踐

1. **不要直接修改遊戲狀態**：使用 EffectQueue 發送效果
2. **使用事件系統**：透過 EventEmitter 通知其他模組
3. **性狀之間不要直接依賴**：使用 Registry 查詢
4. **完整測試**：每個性狀都要有單元測試
```

### 3. 擴充包開發指南

```markdown
<!-- docs/演化論/GUIDE_EXPANSION_DEVELOPMENT.md -->

# 演化論擴充包開發指南

本指南說明如何為演化論遊戲開發新的擴充包。

## 快速開始

### 1. 建立擴充包目錄

```
shared/expansions/
├── base/              # 基礎版（參考）
└── your-expansion/    # 你的擴充包
    ├── index.js       # 主入口
    ├── manifest.json  # 擴充包資訊
    ├── traits/
    │   ├── definitions.js
    │   └── handlers/
    │       └── YourTraitHandler.js
    └── cards/
        └── definitions.js
```

### 2. 定義 Manifest

```javascript
// your-expansion/manifest.json
{
  "id": "your-expansion",
  "name": "你的擴充包",
  "nameEn": "Your Expansion",
  "version": "1.0.0",
  "type": "expansion",
  "description": "擴充包描述",
  "authors": ["你的名字"],
  "dependencies": {
    "base": ">=1.0.0"
  },
  "conflicts": {},
  "minPlayers": 2,
  "maxPlayers": 4,
  "contents": {
    "cards": 20,
    "traits": 5
  }
}
```

### 3. 定義性狀

```javascript
// your-expansion/traits/definitions.js
export const YOUR_TRAITS = {
  YOUR_TRAIT: {
    type: 'YOUR_TRAIT',
    name: '你的性狀',
    nameEn: 'Your Trait',
    foodBonus: 0,
    category: 'special',
    description: '性狀效果描述',
  },
};
```

### 4. 實作性狀處理器

```javascript
// your-expansion/traits/handlers/YourTraitHandler.js
import { TraitHandler } from '@shared/expansions/core/TraitHandler.js';

export class YourTraitHandler extends TraitHandler {
  get traitType() {
    return 'YOUR_TRAIT';
  }

  canPlace(creature, gameState) {
    // 檢查是否可以放置
    // 例如：不能與某性狀共存
    const hasConflict = creature.traits.some(t => t.type === 'CONFLICT_TRAIT');
    if (hasConflict) {
      return { allowed: false, reason: '與衝突性狀不相容' };
    }
    return { allowed: true };
  }

  onPlace(creature, gameState) {
    // 放置時的效果
    console.log(`${this.traitType} placed on creature ${creature.id}`);
  }

  getFoodBonus() {
    return 0;
  }

  // 如果是防禦性狀，實作 checkDefense
  checkDefense(attacker, defender, gameState) {
    // 返回是否阻擋攻擊
    return {
      blocked: true,
      reason: '你的性狀阻擋了攻擊',
    };
  }

  // 如果有進食觸發效果
  onFeed(creature, gameState) {
    // 返回觸發的效果
    return [];
  }

  // 如果有主動能力
  useAbility(creature, target, gameState) {
    return { success: true };
  }
}
```

### 5. 定義卡牌

```javascript
// your-expansion/cards/definitions.js
export const YOUR_CARDS = [
  {
    id: 'YOUR_001',
    frontTrait: 'YOUR_TRAIT',
    backTrait: 'FAT_TISSUE', // 可使用基礎版性狀
    count: 4,
  },
  // 更多卡牌...
];
```

### 6. 建立主入口

```javascript
// your-expansion/index.js
import manifest from './manifest.json';
import { YOUR_TRAITS } from './traits/definitions.js';
import { YOUR_CARDS } from './cards/definitions.js';
import { YourTraitHandler } from './traits/handlers/YourTraitHandler.js';

export { manifest };

export const traits = YOUR_TRAITS;

export const cards = YOUR_CARDS;

export const traitHandlers = {
  YOUR_TRAIT: new YourTraitHandler(),
};

export function createDeck() {
  // 建立此擴充包的牌庫
  const deck = [];
  for (const card of YOUR_CARDS) {
    for (let i = 0; i < card.count; i++) {
      deck.push({
        id: card.id,
        instanceId: `your-expansion_${card.id}_${i}`,
        frontTrait: card.frontTrait,
        backTrait: card.backTrait,
        expansion: 'your-expansion',
      });
    }
  }
  return deck;
}
```

## 進階主題

### 覆寫基礎規則

```javascript
// your-expansion/rules.js
export const ruleOverrides = [
  {
    ruleId: 'FOOD_FORMULA',
    expansionId: 'your-expansion',
    override: (original) => (playerCount) => {
      // 例如：增加額外食物
      return original(playerCount) + 2;
    },
  },
];
```

### 新增遊戲事件

```javascript
// 在處理器中發送自訂事件
onFeed(creature, gameState) {
  gameState.eventEmitter.emit('yourExpansion:specialFeed', {
    creatureId: creature.id,
    // ...其他資料
  });
}
```

### 互動性狀（連結兩隻生物）

```javascript
canPlace(creature, gameState, linkedCreature) {
  if (!linkedCreature) {
    return { allowed: false, reason: '需要選擇連結的生物' };
  }

  // 檢查連結條件
  if (creature.ownerId !== linkedCreature.ownerId) {
    return { allowed: false, reason: '只能連結自己的生物' };
  }

  return { allowed: true };
}

isLinkTrait() {
  return true;
}
```

## 測試你的擴充包

### 單元測試

```javascript
// tests/unit/expansions/your-expansion/yourTrait.test.js
import { describe, it, expect } from 'vitest';
import { YourTraitHandler } from '@shared/expansions/your-expansion/traits/handlers/YourTraitHandler.js';
import { createMockGameState, createMockCreature } from '@tests/setup/expansionTestUtils.js';

describe('YourTraitHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new YourTraitHandler();
  });

  it('should allow placement on empty creature', () => {
    const gameState = createMockGameState();
    const creature = createMockCreature('c1', 'p1');

    const result = handler.canPlace(creature, gameState);

    expect(result.allowed).toBe(true);
  });

  // 更多測試...
});
```

### 驗證擴充包

```javascript
import { validateExpansion } from '@shared/expansions/validateExpansion.js';

const result = await validateExpansion('your-expansion');
console.log(result);
```

## 發布清單

- [ ] Manifest 資訊完整
- [ ] 所有性狀有處理器
- [ ] 所有卡牌性狀存在
- [ ] 單元測試覆蓋率 80%+
- [ ] 整合測試通過
- [ ] 與基礎版相容性測試
- [ ] 文件更新
```

---

## 驗收標準

1. [ ] 完整遊戲流程整合測試通過
2. [ ] 性狀互動整合測試通過
3. [ ] 擴充包組合整合測試通過
4. [ ] 架構設計文件完整
5. [ ] 擴充包開發指南完整
6. [ ] 所有測試可在 CI 環境執行
7. [ ] 文件可讀性良好

---

## 備註

- 整合測試確保系統端到端運作
- 架構文件幫助團隊理解系統設計
- 開發指南降低擴充包開發門檻
- 本工單為 P2-A 收尾工單
