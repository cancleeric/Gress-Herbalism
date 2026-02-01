# 工作單 0321

## 編號
0321

## 日期
2026-02-01

## 工作單標題
建立規則引擎核心

## 工單主旨
演化論第二階段 - 可擴展架構（P2-A）

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_PHASE2_ARCHITECTURE.md`

## 優先級
P0

## 內容

### 目標
建立規則引擎（RuleEngine），管理遊戲規則的註冊、執行和覆寫。支援擴充包修改或擴展基礎規則。

### 設計理念

```
規則引擎架構：
─────────────────────────────────────

                   ┌─────────────────┐
                   │   RuleEngine    │
                   └────────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │   Rules   │     │   Hooks   │     │  Context  │
    │  規則集   │     │  生命週期  │     │   上下文   │
    └───────────┘     └───────────┘     └───────────┘

Rules（規則）：
- 可被覆寫和擴展
- 每個規則有唯一 ID
- 擴充包可修改規則行為

Hooks（鉤子）：
- 在特定時機觸發
- 多個監聽器可同時註冊
- 按優先級順序執行

Context（上下文）：
- 包含 gameState
- 包含 TraitRegistry
- 提供輔助方法
```

### 詳細需求

#### 1. RuleEngine 類別

**檔案**：`backend/logic/evolution/rules/RuleEngine.js`

```javascript
/**
 * 規則引擎
 * 管理遊戲規則的註冊、執行和覆寫
 */
class RuleEngine {
  constructor() {
    this.rules = new Map();      // 規則映射
    this.hooks = new Map();      // 鉤子映射
    this.middleware = [];        // 中間件
    this.traitRegistry = null;   // 性狀註冊中心引用
  }

  // ==================== 規則管理 ====================

  /**
   * 註冊規則
   * @param {string} ruleId - 規則 ID
   * @param {Object} rule - 規則物件
   * @param {Function} rule.execute - 執行函數
   * @param {string} rule.description - 描述
   * @param {string} rule.expansion - 來源擴充包
   */
  registerRule(ruleId, rule) {
    if (!ruleId || typeof ruleId !== 'string') {
      throw new Error('Rule ID must be a non-empty string');
    }
    if (!rule.execute || typeof rule.execute !== 'function') {
      throw new Error('Rule must have an execute function');
    }

    this.rules.set(ruleId, {
      ...rule,
      id: ruleId,
      registeredAt: Date.now(),
    });
  }

  /**
   * 覆寫規則
   * @param {string} ruleId - 規則 ID
   * @param {Function} modifier - 修改函數 (originalRule) => newRule
   */
  overrideRule(ruleId, modifier) {
    const original = this.rules.get(ruleId);
    if (!original) {
      throw new Error(`Cannot override non-existent rule: ${ruleId}`);
    }

    const modified = modifier(original);
    this.rules.set(ruleId, {
      ...modified,
      id: ruleId,
      originalRule: original,
      overriddenAt: Date.now(),
    });
  }

  /**
   * 擴展規則（在原規則前後添加邏輯）
   * @param {string} ruleId - 規則 ID
   * @param {Object} extensions - 擴展配置
   * @param {Function} extensions.before - 前置處理
   * @param {Function} extensions.after - 後置處理
   */
  extendRule(ruleId, extensions) {
    const original = this.rules.get(ruleId);
    if (!original) {
      throw new Error(`Cannot extend non-existent rule: ${ruleId}`);
    }

    const extended = {
      ...original,
      execute: async (context) => {
        let result = context;

        // 前置處理
        if (extensions.before) {
          result = await extensions.before(result);
        }

        // 原規則
        result = await original.execute(result);

        // 後置處理
        if (extensions.after) {
          result = await extensions.after(result);
        }

        return result;
      },
      extended: true,
    };

    this.rules.set(ruleId, extended);
  }

  /**
   * 取得規則
   */
  getRule(ruleId) {
    return this.rules.get(ruleId);
  }

  /**
   * 執行規則
   * @param {string} ruleId - 規則 ID
   * @param {Object} context - 執行上下文
   * @returns {*} 規則執行結果
   */
  async executeRule(ruleId, context) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    // 建立完整上下文
    const fullContext = this.createContext(context);

    // 執行中間件
    let processedContext = fullContext;
    for (const mw of this.middleware) {
      processedContext = await mw(processedContext, ruleId);
    }

    // 執行規則
    return rule.execute(processedContext);
  }

  // ==================== 鉤子管理 ====================

  /**
   * 註冊鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Function} callback - 回調函數
   * @param {number} priority - 優先級（數字越小越先執行）
   */
  addHook(hookName, callback, priority = 100) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hooks = this.hooks.get(hookName);
    hooks.push({ callback, priority });

    // 按優先級排序
    hooks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 移除鉤子
   */
  removeHook(hookName, callback) {
    const hooks = this.hooks.get(hookName);
    if (!hooks) return;

    const index = hooks.findIndex(h => h.callback === callback);
    if (index !== -1) {
      hooks.splice(index, 1);
    }
  }

  /**
   * 觸發鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Object} context - 上下文
   * @returns {Object} 處理後的上下文
   */
  async triggerHook(hookName, context) {
    const hooks = this.hooks.get(hookName);
    if (!hooks || hooks.length === 0) {
      return context;
    }

    let result = context;
    for (const { callback } of hooks) {
      result = await callback(result);
      if (result === null || result === undefined) {
        // 鉤子可以返回 null 來中斷後續處理
        break;
      }
    }

    return result;
  }

  // ==================== 中間件 ====================

  /**
   * 添加中間件
   * @param {Function} middleware - 中間件函數
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  // ==================== 上下文 ====================

  /**
   * 建立執行上下文
   */
  createContext(context) {
    return {
      ...context,
      ruleEngine: this,
      traitRegistry: this.traitRegistry,

      // 輔助方法
      getTraitHandler: (traitType) => this.traitRegistry?.get(traitType),
      executeRule: (ruleId, ctx) => this.executeRule(ruleId, ctx),
      triggerHook: (hookName, ctx) => this.triggerHook(hookName, ctx),
    };
  }

  /**
   * 設定性狀註冊中心
   */
  setTraitRegistry(registry) {
    this.traitRegistry = registry;
  }

  // ==================== 工具方法 ====================

  /**
   * 取得所有規則 ID
   */
  getRuleIds() {
    return Array.from(this.rules.keys());
  }

  /**
   * 取得所有鉤子名稱
   */
  getHookNames() {
    return Array.from(this.hooks.keys());
  }

  /**
   * 重置（測試用）
   */
  reset() {
    this.rules.clear();
    this.hooks.clear();
    this.middleware = [];
  }
}

module.exports = RuleEngine;
```

#### 2. 預定義規則 ID

**檔案**：`backend/logic/evolution/rules/ruleIds.js`

```javascript
/**
 * 預定義的規則 ID
 */
const RULE_IDS = {
  // ==================== 遊戲初始化 ====================
  GAME_INIT: 'game.init',
  GAME_START: 'game.start',

  // ==================== 階段轉換 ====================
  PHASE_TRANSITION: 'phase.transition',
  PHASE_EVOLUTION_START: 'phase.evolution.start',
  PHASE_FOOD_START: 'phase.food.start',
  PHASE_FEEDING_START: 'phase.feeding.start',
  PHASE_EXTINCTION_START: 'phase.extinction.start',

  // ==================== 食物供給 ====================
  FOOD_FORMULA: 'food.formula',
  FOOD_ROLL_DICE: 'food.rollDice',

  // ==================== 動作驗證 ====================
  ACTION_VALIDATE: 'action.validate',
  ACTION_VALIDATE_TURN: 'action.validate.turn',
  ACTION_VALIDATE_PHASE: 'action.validate.phase',

  // ==================== 生物操作 ====================
  CREATURE_CREATE: 'creature.create',
  CREATURE_EXTINCT: 'creature.extinct',

  // ==================== 性狀操作 ====================
  TRAIT_VALIDATE_PLACEMENT: 'trait.validate.placement',
  TRAIT_ADD: 'trait.add',
  TRAIT_REMOVE: 'trait.remove',

  // ==================== 進食 ====================
  FEED_VALIDATE: 'feed.validate',
  FEED_EXECUTE: 'feed.execute',
  FEED_CHAIN_COMMUNICATION: 'feed.chain.communication',
  FEED_CHAIN_COOPERATION: 'feed.chain.cooperation',
  FEED_CHECK_SYMBIOSIS: 'feed.check.symbiosis',

  // ==================== 攻擊 ====================
  ATTACK_VALIDATE: 'attack.validate',
  ATTACK_CHECK_DEFENSE: 'attack.checkDefense',
  ATTACK_RESOLVE: 'attack.resolve',
  ATTACK_EXECUTE: 'attack.execute',

  // ==================== 滅絕 ====================
  EXTINCTION_CHECK: 'extinction.check',
  EXTINCTION_PROCESS: 'extinction.process',
  EXTINCTION_DRAW_CARDS: 'extinction.drawCards',

  // ==================== 計分 ====================
  SCORE_CALCULATE: 'score.calculate',
  SCORE_CREATURE: 'score.creature',
  SCORE_TRAIT: 'score.trait',

  // ==================== 遊戲結束 ====================
  GAME_END_CHECK: 'game.end.check',
  GAME_END_DETERMINE_WINNER: 'game.end.determineWinner',
};

module.exports = { RULE_IDS };
```

#### 3. 預定義鉤子名稱

**檔案**：`backend/logic/evolution/rules/hookNames.js`

```javascript
/**
 * 預定義的鉤子名稱
 */
const HOOK_NAMES = {
  // ==================== 遊戲生命週期 ====================
  BEFORE_GAME_INIT: 'beforeGameInit',
  AFTER_GAME_INIT: 'afterGameInit',
  BEFORE_GAME_START: 'beforeGameStart',
  AFTER_GAME_START: 'afterGameStart',
  BEFORE_GAME_END: 'beforeGameEnd',
  AFTER_GAME_END: 'afterGameEnd',

  // ==================== 階段生命週期 ====================
  BEFORE_PHASE_START: 'beforePhaseStart',
  AFTER_PHASE_START: 'afterPhaseStart',
  BEFORE_PHASE_END: 'beforePhaseEnd',
  AFTER_PHASE_END: 'afterPhaseEnd',

  // ==================== 回合生命週期 ====================
  BEFORE_TURN_START: 'beforeTurnStart',
  AFTER_TURN_START: 'afterTurnStart',
  BEFORE_TURN_END: 'beforeTurnEnd',
  AFTER_TURN_END: 'afterTurnEnd',

  // ==================== 動作相關 ====================
  BEFORE_ACTION: 'beforeAction',
  AFTER_ACTION: 'afterAction',
  ACTION_REJECTED: 'actionRejected',

  // ==================== 生物相關 ====================
  ON_CREATURE_CREATE: 'onCreatureCreate',
  ON_CREATURE_EXTINCT: 'onCreatureExtinct',
  BEFORE_CREATURE_EXTINCT: 'beforeCreatureExtinct',

  // ==================== 性狀相關 ====================
  ON_TRAIT_ADD: 'onTraitAdd',
  ON_TRAIT_REMOVE: 'onTraitRemove',
  BEFORE_TRAIT_ADD: 'beforeTraitAdd',

  // ==================== 進食相關 ====================
  BEFORE_FEED: 'beforeFeed',
  AFTER_FEED: 'afterFeed',
  ON_GAIN_FOOD: 'onGainFood',

  // ==================== 攻擊相關 ====================
  BEFORE_ATTACK: 'beforeAttack',
  AFTER_ATTACK: 'afterAttack',
  ON_ATTACK_SUCCESS: 'onAttackSuccess',
  ON_ATTACK_FAILED: 'onAttackFailed',
  ON_DEFENSE_RESPONSE: 'onDefenseResponse',

  // ==================== 食物池相關 ====================
  ON_FOOD_POOL_CHANGE: 'onFoodPoolChange',
  ON_DICE_ROLL: 'onDiceRoll',

  // ==================== 計分相關 ====================
  BEFORE_SCORE_CALCULATE: 'beforeScoreCalculate',
  AFTER_SCORE_CALCULATE: 'afterScoreCalculate',
};

module.exports = { HOOK_NAMES };
```

#### 4. 規則引擎工廠

**檔案**：`backend/logic/evolution/rules/createRuleEngine.js`

```javascript
const RuleEngine = require('./RuleEngine');
const { RULE_IDS } = require('./ruleIds');
const { HOOK_NAMES } = require('./hookNames');

/**
 * 建立並初始化規則引擎
 * @param {Object} options - 配置選項
 * @param {TraitRegistry} options.traitRegistry - 性狀註冊中心
 * @param {boolean} options.debug - 是否啟用除錯模式
 * @returns {RuleEngine}
 */
function createRuleEngine(options = {}) {
  const engine = new RuleEngine();

  // 設定性狀註冊中心
  if (options.traitRegistry) {
    engine.setTraitRegistry(options.traitRegistry);
  }

  // 除錯中間件
  if (options.debug) {
    engine.use(async (context, ruleId) => {
      console.log(`[RuleEngine] Executing rule: ${ruleId}`);
      return context;
    });
  }

  return engine;
}

module.exports = {
  createRuleEngine,
  RULE_IDS,
  HOOK_NAMES,
};
```

#### 5. 統一匯出

**檔案**：`backend/logic/evolution/rules/index.js`

```javascript
const RuleEngine = require('./RuleEngine');
const { RULE_IDS } = require('./ruleIds');
const { HOOK_NAMES } = require('./hookNames');
const { createRuleEngine } = require('./createRuleEngine');

module.exports = {
  RuleEngine,
  RULE_IDS,
  HOOK_NAMES,
  createRuleEngine,
};
```

### 測試需求

```javascript
describe('RuleEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  describe('registerRule', () => {
    test('should register a rule', () => {
      engine.registerRule('test', {
        execute: (ctx) => ctx,
        description: 'Test rule',
      });
      expect(engine.getRule('test')).toBeDefined();
    });

    test('should reject rule without execute function', () => {
      expect(() => engine.registerRule('test', {})).toThrow();
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
  });

  describe('hooks', () => {
    test('should trigger hooks in priority order', async () => {
      const order = [];

      engine.addHook('test', () => { order.push('second'); return {}; }, 200);
      engine.addHook('test', () => { order.push('first'); return {}; }, 100);
      engine.addHook('test', () => { order.push('third'); return {}; }, 300);

      await engine.triggerHook('test', {});

      expect(order).toEqual(['first', 'second', 'third']);
    });
  });
});
```

### 驗收標準

- [ ] RuleEngine 類別完整實作
- [ ] 規則可註冊、覆寫、擴展
- [ ] 鉤子可註冊、觸發、按優先級執行
- [ ] 中間件機制正常運作
- [ ] 預定義規則 ID 和鉤子名稱完整
- [ ] 單元測試覆蓋率 > 90%

### 相關檔案

**新增檔案**：
- `backend/logic/evolution/rules/RuleEngine.js`
- `backend/logic/evolution/rules/ruleIds.js`
- `backend/logic/evolution/rules/hookNames.js`
- `backend/logic/evolution/rules/createRuleEngine.js`
- `backend/logic/evolution/rules/index.js`
- `backend/logic/evolution/rules/__tests__/RuleEngine.test.js`

### 依賴工單
- 0319（性狀處理器介面）

### 被依賴工單
- 0322（基礎規則集）
- 0324（效果觸發系統）
