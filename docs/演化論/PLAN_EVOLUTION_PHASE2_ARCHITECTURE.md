# 演化論第二階段 - 可擴展架構設計計畫書

**文件編號**：PLAN-EVO-P2-A
**版本**：1.0
**建立日期**：2026-02-01
**負責人**：Claude Code
**狀態**：規劃中
**工單範圍**：0317-0330

---

## 一、目標

建立可擴展的遊戲架構，支援：
1. 未來擴充包（飛翔、時間線、大陸等）
2. 新增性狀無需修改核心代碼
3. 規則變體支援
4. 向後相容現有遊戲邏輯

---

## 二、現有架構分析

### 2.1 當前結構問題

```
問題 1：性狀定義硬編碼
─────────────────────────────────────
shared/constants/evolution.js
├── TRAIT_TYPES (硬編碼 19 種)
├── TRAIT_DEFINITIONS (硬編碼定義)
└── 新增性狀需要修改此檔案

問題 2：性狀邏輯分散
─────────────────────────────────────
creatureLogic.js
├── canBeAttacked() 內含多個 if-else 判斷
├── 每個性狀的邏輯混在一起
└── 新增性狀需修改多處

問題 3：規則硬編碼
─────────────────────────────────────
phaseLogic.js / feedingLogic.js
├── 規則邏輯直接寫在函數內
├── 無法動態調整規則
└── 擴充包可能有不同規則
```

### 2.2 目標架構

```
解決方案：外掛式架構
─────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                     ExpansionRegistry                            │
│                     擴充包註冊中心                               │
├─────────────────────────────────────────────────────────────────┤
│  register(expansion)     ← 註冊擴充包                           │
│  getTraitHandler(type)   ← 取得性狀處理器                        │
│  getCardSet()            ← 取得所有啟用的卡牌                    │
│  getRules()              ← 取得所有啟用的規則                    │
└─────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   BaseExpansion │  │ FlightExpansion │  │TimelineExpansion│
│   基礎版        │  │ 飛翔擴充        │  │ 時間線擴充      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ traits: 19種    │  │ traits: 新性狀  │  │ traits: 新性狀  │
│ cards: 84張     │  │ cards: 新卡牌   │  │ cards: 新卡牌   │
│ rules: 基礎規則 │  │ rules: 飛翔規則 │  │ rules: 時間規則 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 三、詳細設計

### 3.1 擴充包介面定義

```javascript
// shared/expansions/ExpansionInterface.js

/**
 * 擴充包介面
 * 所有擴充包必須實作此介面
 */
const ExpansionInterface = {
  // 擴充包基本資訊
  id: 'string',           // 唯一識別碼，如 'base', 'flight'
  name: 'string',         // 顯示名稱，如 '物種起源', '飛翔'
  version: 'string',      // 版本號，如 '1.0.0'
  description: 'string',  // 描述

  // 依賴關係
  requires: ['string'],   // 依賴的擴充包 ID，如 ['base']
  incompatible: ['string'], // 不相容的擴充包 ID

  // 擴充內容
  traits: {},             // 性狀定義
  cards: [],              // 卡牌定義
  rules: {},              // 規則修改

  // 生命週期鉤子
  onRegister: Function,   // 註冊時調用
  onGameInit: Function,   // 遊戲初始化時調用
  onPhaseStart: Function, // 階段開始時調用
};
```

### 3.2 性狀處理器介面

```javascript
// backend/logic/evolution/traits/TraitHandler.js

/**
 * 性狀處理器介面
 * 每個性狀一個處理器，封裝該性狀的所有邏輯
 */
class TraitHandler {
  constructor(definition) {
    this.type = definition.type;        // 性狀類型
    this.name = definition.name;        // 性狀名稱
    this.foodBonus = definition.foodBonus || 0;
    this.description = definition.description;
    this.category = definition.category; // 肉食/防禦/進食/互動/特殊
    this.isInteractive = definition.isInteractive || false;
    this.isStackable = definition.isStackable || false;
    this.incompatible = definition.incompatible || [];
  }

  /**
   * 驗證是否可以放置此性狀
   * @param {Object} context - { creature, player, gameState, targetCreature? }
   * @returns {{ valid: boolean, reason: string }}
   */
  canPlace(context) {
    throw new Error('Must implement canPlace');
  }

  /**
   * 放置性狀時的效果
   * @param {Object} context - { creature, player, gameState, targetCreature? }
   * @returns {Object} 修改後的 gameState
   */
  onPlace(context) {
    return context.gameState; // 預設無效果
  }

  /**
   * 檢查是否可以被攻擊（防禦性狀用）
   * @param {Object} context - { defender, attacker, gameState }
   * @returns {{ canAttack: boolean, reason: string }}
   */
  checkDefense(context) {
    return { canAttack: true, reason: '' }; // 預設可被攻擊
  }

  /**
   * 被攻擊時的回應選項（斷尾、擬態等）
   * @param {Object} context - { defender, attacker, gameState }
   * @returns {{ canRespond: boolean, responseType: string }}
   */
  getDefenseResponse(context) {
    return { canRespond: false, responseType: null };
  }

  /**
   * 進食時的效果（溝通、合作等）
   * @param {Object} context - { creature, foodType, gameState }
   * @returns {Object} 修改後的 gameState
   */
  onFeed(context) {
    return context.gameState;
  }

  /**
   * 主動使用能力（掠奪、踐踏、冬眠等）
   * @param {Object} context - { creature, target?, gameState }
   * @returns {{ success: boolean, gameState: Object }}
   */
  useAbility(context) {
    return { success: false, gameState: context.gameState };
  }

  /**
   * 滅絕階段處理（毒液等）
   * @param {Object} context - { creature, gameState }
   * @returns {Object} 修改後的 gameState
   */
  onExtinction(context) {
    return context.gameState;
  }

  /**
   * 計分時的額外分數
   * @param {Object} context - { creature, gameState }
   * @returns {number} 額外分數
   */
  getScoreBonus(context) {
    return this.foodBonus;
  }
}

module.exports = TraitHandler;
```

### 3.3 規則引擎設計

```javascript
// backend/logic/evolution/rules/RuleEngine.js

/**
 * 規則引擎
 * 管理遊戲規則，支援規則覆寫和擴展
 */
class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.hooks = new Map();
  }

  /**
   * 註冊規則
   * @param {string} ruleId - 規則 ID
   * @param {Object} rule - 規則定義
   */
  registerRule(ruleId, rule) {
    this.rules.set(ruleId, rule);
  }

  /**
   * 覆寫規則（擴充包用）
   * @param {string} ruleId - 規則 ID
   * @param {Function} modifier - 修改函數
   */
  overrideRule(ruleId, modifier) {
    const originalRule = this.rules.get(ruleId);
    if (originalRule) {
      this.rules.set(ruleId, modifier(originalRule));
    }
  }

  /**
   * 執行規則
   * @param {string} ruleId - 規則 ID
   * @param {Object} context - 執行上下文
   */
  execute(ruleId, context) {
    const rule = this.rules.get(ruleId);
    if (rule && typeof rule.execute === 'function') {
      return rule.execute(context);
    }
    throw new Error(`Rule ${ruleId} not found`);
  }

  /**
   * 註冊鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Function} callback - 回調函數
   */
  addHook(hookName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push(callback);
  }

  /**
   * 觸發鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Object} context - 上下文
   */
  triggerHook(hookName, context) {
    const hooks = this.hooks.get(hookName) || [];
    let result = context;
    for (const hook of hooks) {
      result = hook(result);
    }
    return result;
  }
}

// 預定義的規則 ID
const RULE_IDS = {
  // 食物供給規則
  FOOD_FORMULA: 'food.formula',

  // 攻擊規則
  ATTACK_VALIDATION: 'attack.validation',
  ATTACK_RESOLUTION: 'attack.resolution',

  // 進食規則
  FEED_VALIDATION: 'feed.validation',
  FEED_CHAIN: 'feed.chain',

  // 階段規則
  PHASE_TRANSITION: 'phase.transition',
  EXTINCTION_CHECK: 'extinction.check',

  // 計分規則
  SCORE_CALCULATION: 'score.calculation',
  WINNER_DETERMINATION: 'winner.determination',
};

// 預定義的鉤子名稱
const HOOK_NAMES = {
  BEFORE_PHASE_START: 'beforePhaseStart',
  AFTER_PHASE_END: 'afterPhaseEnd',
  BEFORE_ACTION: 'beforeAction',
  AFTER_ACTION: 'afterAction',
  BEFORE_ATTACK: 'beforeAttack',
  AFTER_ATTACK: 'afterAttack',
  BEFORE_FEED: 'beforeFeed',
  AFTER_FEED: 'afterFeed',
  ON_CREATURE_CREATE: 'onCreatureCreate',
  ON_CREATURE_EXTINCT: 'onCreatureExtinct',
  ON_TRAIT_ADD: 'onTraitAdd',
  ON_TRAIT_REMOVE: 'onTraitRemove',
};

module.exports = { RuleEngine, RULE_IDS, HOOK_NAMES };
```

### 3.4 擴充包註冊中心

```javascript
// shared/expansions/ExpansionRegistry.js

/**
 * 擴充包註冊中心
 * 管理所有擴充包的註冊和啟用
 */
class ExpansionRegistry {
  constructor() {
    this.expansions = new Map();     // 所有已註冊的擴充包
    this.enabled = new Set();        // 啟用的擴充包 ID
    this.traitHandlers = new Map();  // 性狀處理器映射
    this.cardPool = [];              // 啟用的卡牌池
    this.ruleEngine = null;          // 規則引擎實例
  }

  /**
   * 註冊擴充包
   */
  register(expansion) {
    // 驗證擴充包格式
    this.validateExpansion(expansion);

    // 儲存擴充包
    this.expansions.set(expansion.id, expansion);

    // 調用生命週期鉤子
    if (expansion.onRegister) {
      expansion.onRegister(this);
    }

    console.log(`Expansion registered: ${expansion.name} (${expansion.id})`);
  }

  /**
   * 啟用擴充包
   */
  enable(expansionId) {
    const expansion = this.expansions.get(expansionId);
    if (!expansion) {
      throw new Error(`Expansion ${expansionId} not found`);
    }

    // 檢查依賴
    for (const reqId of expansion.requires || []) {
      if (!this.enabled.has(reqId)) {
        throw new Error(`Expansion ${expansionId} requires ${reqId}`);
      }
    }

    // 檢查相容性
    for (const incompatId of expansion.incompatible || []) {
      if (this.enabled.has(incompatId)) {
        throw new Error(`Expansion ${expansionId} incompatible with ${incompatId}`);
      }
    }

    this.enabled.add(expansionId);

    // 註冊性狀處理器
    this.registerTraitHandlers(expansion);

    // 加入卡牌池
    this.addToCardPool(expansion);

    // 註冊規則
    this.registerRules(expansion);
  }

  /**
   * 取得性狀處理器
   */
  getTraitHandler(traitType) {
    return this.traitHandlers.get(traitType);
  }

  /**
   * 取得所有啟用的卡牌
   */
  getCardPool() {
    return [...this.cardPool];
  }

  /**
   * 取得啟用的擴充包清單
   */
  getEnabledExpansions() {
    return Array.from(this.enabled).map(id => this.expansions.get(id));
  }

  /**
   * 創建遊戲用的牌組
   */
  createDeck() {
    const deck = [];
    for (const card of this.cardPool) {
      for (let i = 0; i < card.count; i++) {
        deck.push({
          id: `card_${deck.length + 1}`,
          ...card
        });
      }
    }
    return deck;
  }

  // 私有方法
  validateExpansion(expansion) { /* ... */ }
  registerTraitHandlers(expansion) { /* ... */ }
  addToCardPool(expansion) { /* ... */ }
  registerRules(expansion) { /* ... */ }
}

module.exports = ExpansionRegistry;
```

### 3.5 基礎版擴充包範例

```javascript
// shared/expansions/base/index.js

const TraitHandler = require('../../traits/TraitHandler');
const { TRAIT_TYPES, TRAIT_DEFINITIONS } = require('./traits');
const { CARDS } = require('./cards');
const { RULES } = require('./rules');

/**
 * 基礎版擴充包
 * Evolution: The Origin of Species
 */
const BaseExpansion = {
  id: 'base',
  name: '物種起源',
  version: '1.0.0',
  description: '演化論基礎版，包含 19 種性狀和 84 張卡牌',

  requires: [],       // 無依賴
  incompatible: [],   // 無不相容

  // 性狀處理器
  traits: {
    // 肉食相關
    [TRAIT_TYPES.CARNIVORE]: new CarnivoreHandler(),
    [TRAIT_TYPES.SCAVENGER]: new ScavengerHandler(),
    [TRAIT_TYPES.SHARP_VISION]: new SharpVisionHandler(),

    // 防禦相關
    [TRAIT_TYPES.CAMOUFLAGE]: new CamouflageHandler(),
    [TRAIT_TYPES.BURROWING]: new BurrowingHandler(),
    [TRAIT_TYPES.POISONOUS]: new PoisonousHandler(),
    [TRAIT_TYPES.AQUATIC]: new AquaticHandler(),
    [TRAIT_TYPES.AGILE]: new AgileHandler(),
    [TRAIT_TYPES.MASSIVE]: new MassiveHandler(),
    [TRAIT_TYPES.TAIL_LOSS]: new TailLossHandler(),
    [TRAIT_TYPES.MIMICRY]: new MimicryHandler(),

    // 進食相關
    [TRAIT_TYPES.FAT_TISSUE]: new FatTissueHandler(),
    [TRAIT_TYPES.HIBERNATION]: new HibernationHandler(),
    [TRAIT_TYPES.PARASITE]: new ParasiteHandler(),
    [TRAIT_TYPES.ROBBERY]: new RobberyHandler(),

    // 互動相關
    [TRAIT_TYPES.COMMUNICATION]: new CommunicationHandler(),
    [TRAIT_TYPES.COOPERATION]: new CooperationHandler(),
    [TRAIT_TYPES.SYMBIOSIS]: new SymbiosisHandler(),

    // 特殊能力
    [TRAIT_TYPES.TRAMPLING]: new TramplingHandler(),
  },

  // 卡牌定義（84 張）
  cards: CARDS,

  // 規則定義
  rules: RULES,

  // 生命週期鉤子
  onRegister(registry) {
    console.log('Base expansion registered');
  },

  onGameInit(gameState, registry) {
    // 基礎版初始化邏輯
    return gameState;
  },
};

module.exports = BaseExpansion;
```

---

## 四、性狀處理器範例實作

### 4.1 肉食性狀處理器

```javascript
// shared/expansions/base/traits/CarnivoreHandler.js

class CarnivoreHandler extends TraitHandler {
  constructor() {
    super({
      type: 'carnivore',
      name: '肉食',
      foodBonus: 1,
      description: '不能吃現有食物，必須攻擊其他生物獲得食物',
      category: 'carnivore',
      incompatible: ['scavenger'],
    });
  }

  canPlace(context) {
    const { creature } = context;

    // 檢查是否已有腐食
    if (creature.traits.some(t => t.type === 'scavenger')) {
      return { valid: false, reason: '肉食與腐食互斥' };
    }

    return { valid: true, reason: '' };
  }

  checkDefense(context) {
    // 肉食不是防禦性狀，直接返回可攻擊
    return { canAttack: true, reason: '' };
  }

  // 肉食生物的攻擊邏輯在 attackLogic 中處理
  // 這裡只是標記此生物為肉食性
}
```

### 4.2 偽裝性狀處理器

```javascript
// shared/expansions/base/traits/CamouflageHandler.js

class CamouflageHandler extends TraitHandler {
  constructor() {
    super({
      type: 'camouflage',
      name: '偽裝',
      foodBonus: 0,
      description: '肉食生物必須擁有銳目性狀才能攻擊此生物',
      category: 'defense',
    });
  }

  checkDefense(context) {
    const { attacker } = context;

    // 檢查攻擊者是否有銳目
    const hasSharpVision = attacker.traits.some(t => t.type === 'sharpVision');

    if (!hasSharpVision) {
      return {
        canAttack: false,
        reason: '需要銳目才能攻擊偽裝生物'
      };
    }

    return { canAttack: true, reason: '' };
  }
}
```

### 4.3 溝通性狀處理器

```javascript
// shared/expansions/base/traits/CommunicationHandler.js

class CommunicationHandler extends TraitHandler {
  constructor() {
    super({
      type: 'communication',
      name: '溝通',
      foodBonus: 0,
      description: '當一隻生物拿取紅色食物時，連結的生物也拿取紅色食物',
      category: 'interactive',
      isInteractive: true,
    });
  }

  canPlace(context) {
    const { creature, targetCreature, player } = context;

    if (!targetCreature) {
      return { valid: false, reason: '溝通需要指定第二隻生物' };
    }

    if (creature.ownerId !== player.id || targetCreature.ownerId !== player.id) {
      return { valid: false, reason: '溝通的兩隻生物都必須是自己的' };
    }

    if (creature.id === targetCreature.id) {
      return { valid: false, reason: '不能與自己建立溝通' };
    }

    // 檢查是否已有溝通連結
    const hasLink = creature.interactionLinks?.some(
      link => link.type === 'communication' &&
              link.targetId === targetCreature.id
    );

    if (hasLink) {
      return { valid: false, reason: '這兩隻生物之間已有溝通' };
    }

    return { valid: true, reason: '' };
  }

  onFeed(context) {
    const { creature, foodType, gameState } = context;

    // 只有拿取紅色食物才觸發
    if (foodType !== 'red') {
      return gameState;
    }

    // 找到所有溝通連結的生物
    const linkedCreatures = this.getLinkedCreatures(creature, gameState);

    // 觸發連鎖（需要追蹤已處理的生物避免無限迴圈）
    return this.triggerChain(linkedCreatures, gameState, new Set([creature.id]));
  }

  getLinkedCreatures(creature, gameState) {
    // 從 interactionLinks 找到連結的生物
    return creature.interactionLinks
      ?.filter(link => link.type === 'communication')
      .map(link => findCreatureById(gameState, link.targetId))
      .filter(Boolean);
  }

  triggerChain(creatures, gameState, processed) {
    let newState = { ...gameState };

    for (const creature of creatures) {
      if (processed.has(creature.id)) continue;

      // 從食物池拿取紅色食物
      if (newState.foodPool.red > 0) {
        newState = feedCreature(newState, creature.id, 'red');
        processed.add(creature.id);

        // 遞迴觸發此生物的溝通連結
        const nextCreatures = this.getLinkedCreatures(creature, newState);
        newState = this.triggerChain(nextCreatures, newState, processed);
      }
    }

    return newState;
  }
}
```

---

## 五、工單詳細內容

### 工單 0317：建立擴充包註冊系統

**目標**：建立 ExpansionRegistry 核心模組

**檔案**：
- `shared/expansions/ExpansionRegistry.js`
- `shared/expansions/ExpansionInterface.js`
- `shared/expansions/index.js`

**驗收標準**：
- [ ] ExpansionRegistry 可註冊擴充包
- [ ] 支援依賴檢查
- [ ] 支援相容性檢查
- [ ] 單元測試通過

---

### 工單 0318：重構性狀定義結構

**目標**：將硬編碼的性狀定義改為可註冊模組

**檔案**：
- `shared/expansions/base/traits/index.js`
- `shared/expansions/base/traits/definitions.js`

**變更**：
```javascript
// 舊結構
const TRAIT_DEFINITIONS = {
  carnivore: { name: '肉食', ... }
};

// 新結構
const traits = {
  carnivore: new CarnivoreHandler(),
};
```

**驗收標準**：
- [ ] 保持向後相容
- [ ] 所有 19 種性狀有獨立定義
- [ ] 測試通過

---

### 工單 0319：建立性狀處理器介面

**目標**：定義 TraitHandler 抽象類別

**檔案**：
- `backend/logic/evolution/traits/TraitHandler.js`

**方法**：
- `canPlace()` - 驗證放置
- `onPlace()` - 放置效果
- `checkDefense()` - 防禦檢查
- `getDefenseResponse()` - 防禦回應
- `onFeed()` - 進食效果
- `useAbility()` - 主動能力
- `onExtinction()` - 滅絕效果
- `getScoreBonus()` - 計分加成

**驗收標準**：
- [ ] 介面定義完整
- [ ] 有詳細 JSDoc 註解
- [ ] 有範例實作

---

### 工單 0320：實作基礎版性狀處理器

**目標**：將 19 種性狀重構為處理器模式

**檔案**：
- `shared/expansions/base/traits/CarnivoreHandler.js`
- `shared/expansions/base/traits/ScavengerHandler.js`
- `shared/expansions/base/traits/SharpVisionHandler.js`
- ... （共 19 個處理器）

**驗收標準**：
- [ ] 19 種性狀全部重構
- [ ] 邏輯與原有實作一致
- [ ] 測試通過

---

### 工單 0321-0330：（略，詳見總覽）

---

## 六、測試策略

### 6.1 向後相容測試

```javascript
describe('Backward Compatibility', () => {
  test('existing game logic should work without changes', () => {
    // 使用舊的 API 調用方式
    const result = gameLogic.initGame(players);
    expect(result.success).toBe(true);
  });

  test('all 76 existing tests should pass', () => {
    // 執行所有現有測試
  });
});
```

### 6.2 擴展性測試

```javascript
describe('Extensibility', () => {
  test('can register custom expansion', () => {
    const customExpansion = {
      id: 'test',
      traits: { customTrait: new CustomHandler() },
    };

    registry.register(customExpansion);
    expect(registry.expansions.has('test')).toBe(true);
  });

  test('can add new trait without modifying core', () => {
    // 不修改核心代碼的情況下新增性狀
  });
});
```

---

## 七、遷移計畫

### 7.1 第一階段：並行運行

```
現有代碼 ──────────────────────────────────┐
                                           │
                                           ▼
                                     ┌─────────┐
                                     │ 適配器  │
                                     └────┬────┘
                                          │
新架構 ───────────────────────────────────▶ 遊戲邏輯
```

### 7.2 第二階段：漸進遷移

1. 先遷移常數定義
2. 再遷移性狀邏輯
3. 最後遷移規則引擎
4. 每步都保持測試通過

### 7.3 第三階段：移除舊代碼

完成遷移後，移除舊的硬編碼邏輯。

---

## 八、風險與緩解

| 風險 | 緩解措施 |
|------|----------|
| 重構導致 BUG | 完整測試覆蓋、漸進遷移 |
| 效能下降 | 效能基準測試、優化熱點 |
| 複雜度增加 | 詳細文檔、範例代碼 |

---

**文件結束**

*建立者：Claude Code*
*建立日期：2026-02-01*
