# 工作單 0319

## 編號
0319

## 日期
2026-02-01

## 工作單標題
建立性狀處理器介面

## 工單主旨
演化論第二階段 - 可擴展架構（P2-A）

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_PHASE2_ARCHITECTURE.md`

## 優先級
P0

## 內容

### 目標
定義 TraitHandler 抽象基礎類別，封裝性狀的所有邏輯。每個性狀將實作此介面，使性狀邏輯模組化、可擴展。

### 設計理念

```
傳統方式（當前）：
─────────────────────────────────────
creatureLogic.js:
  function canBeAttacked(creature, attacker) {
    if (hasTrait(creature, 'camouflage')) {
      if (!hasTrait(attacker, 'sharpVision')) return false;
    }
    if (hasTrait(creature, 'burrowing') && isFed(creature)) {
      return false;
    }
    // ... 更多 if-else
  }

問題：
- 新增性狀需修改多個函數
- 邏輯分散難以維護
- 難以測試單一性狀

新方式（TraitHandler）：
─────────────────────────────────────
每個性狀一個處理器：
  CamouflageHandler.checkDefense()
  BurrowingHandler.checkDefense()
  MassiveHandler.checkDefense()

優點：
- 新增性狀只需建立新處理器
- 邏輯集中易於維護
- 可獨立測試每個性狀
```

### 詳細需求

#### 1. TraitHandler 基礎類別

**檔案**：`backend/logic/evolution/traits/TraitHandler.js`

```javascript
/**
 * 性狀處理器基礎類別
 * 所有性狀處理器必須繼承此類別
 *
 * @abstract
 */
class TraitHandler {
  /**
   * @param {Object} definition - 性狀定義
   * @param {string} definition.type - 性狀類型
   * @param {string} definition.name - 性狀名稱
   * @param {number} definition.foodBonus - 食量加成
   * @param {string} definition.description - 描述
   * @param {string} definition.category - 類別
   * @param {boolean} definition.isInteractive - 是否為互動性狀
   * @param {boolean} definition.isStackable - 是否可疊加
   * @param {string[]} definition.incompatible - 互斥性狀列表
   */
  constructor(definition) {
    if (new.target === TraitHandler) {
      throw new Error('TraitHandler is abstract and cannot be instantiated directly');
    }

    this.type = definition.type;
    this.name = definition.name;
    this.foodBonus = definition.foodBonus || 0;
    this.description = definition.description || '';
    this.category = definition.category;
    this.isInteractive = definition.isInteractive || false;
    this.isStackable = definition.isStackable || false;
    this.incompatible = definition.incompatible || [];
    this.expansion = definition.expansion || 'base';
  }

  // ==================== 放置相關 ====================

  /**
   * 驗證是否可以將此性狀放置到生物上
   *
   * @param {Object} context - 上下文
   * @param {Object} context.creature - 目標生物
   * @param {Object} context.player - 操作玩家
   * @param {Object} context.gameState - 遊戲狀態
   * @param {Object} [context.targetCreature] - 第二隻生物（互動性狀用）
   * @returns {{ valid: boolean, reason: string }}
   */
  canPlace(context) {
    const { creature, player, targetCreature } = context;

    // 基礎檢查：生物擁有者
    if (this.isParasite) {
      // 寄生蟲必須放在對手生物上
      if (creature.ownerId === player.id) {
        return { valid: false, reason: '寄生蟲只能放在對手的生物上' };
      }
    } else {
      // 一般性狀必須放在自己生物上
      if (creature.ownerId !== player.id) {
        return { valid: false, reason: '只能將性狀放在自己的生物上' };
      }
    }

    // 互動性狀檢查
    if (this.isInteractive) {
      if (!targetCreature) {
        return { valid: false, reason: '互動性狀需要指定第二隻生物' };
      }
      if (targetCreature.ownerId !== player.id) {
        return { valid: false, reason: '互動性狀的兩隻生物都必須是自己的' };
      }
      if (creature.id === targetCreature.id) {
        return { valid: false, reason: '不能與自己建立互動' };
      }
    }

    // 可疊加性檢查
    if (!this.isStackable) {
      const hasSameTrait = creature.traits?.some(t => t.type === this.type);
      if (hasSameTrait) {
        return { valid: false, reason: '此生物已經擁有這個性狀' };
      }
    }

    // 互斥性檢查
    for (const existingTrait of creature.traits || []) {
      if (this.incompatible.includes(existingTrait.type)) {
        return {
          valid: false,
          reason: `${this.name}與${existingTrait.name || existingTrait.type}互斥`,
        };
      }
    }

    return { valid: true, reason: '' };
  }

  /**
   * 放置性狀後的效果
   * 子類別可覆寫以實作特殊效果
   *
   * @param {Object} context
   * @returns {Object} 修改後的 gameState
   */
  onPlace(context) {
    return context.gameState;
  }

  /**
   * 性狀被移除時的效果
   *
   * @param {Object} context
   * @returns {Object} 修改後的 gameState
   */
  onRemove(context) {
    return context.gameState;
  }

  // ==================== 防禦相關 ====================

  /**
   * 檢查此性狀是否阻止攻擊
   *
   * @param {Object} context
   * @param {Object} context.defender - 防禦方生物
   * @param {Object} context.attacker - 攻擊方生物
   * @param {Object} context.gameState - 遊戲狀態
   * @returns {{ canAttack: boolean, reason: string }}
   */
  checkDefense(context) {
    // 預設不阻止攻擊
    return { canAttack: true, reason: '' };
  }

  /**
   * 取得防禦回應選項
   *
   * @param {Object} context
   * @returns {{ canRespond: boolean, responseType: string, options: Object }}
   */
  getDefenseResponse(context) {
    return { canRespond: false, responseType: null, options: null };
  }

  /**
   * 處理防禦回應
   *
   * @param {Object} context
   * @param {Object} response - 玩家的回應
   * @returns {{ success: boolean, gameState: Object, attackCancelled: boolean }}
   */
  handleDefenseResponse(context, response) {
    return {
      success: false,
      gameState: context.gameState,
      attackCancelled: false,
    };
  }

  // ==================== 進食相關 ====================

  /**
   * 檢查是否可以進食
   *
   * @param {Object} context
   * @returns {{ canFeed: boolean, reason: string }}
   */
  checkCanFeed(context) {
    return { canFeed: true, reason: '' };
  }

  /**
   * 進食時的效果
   *
   * @param {Object} context
   * @param {string} context.foodType - 食物類型 ('red' | 'blue')
   * @returns {Object} 修改後的 gameState
   */
  onFeed(context) {
    return context.gameState;
  }

  /**
   * 獲得食物時觸發（溝通、合作用）
   *
   * @param {Object} context
   * @param {string} foodType
   * @param {Set} processedCreatures - 已處理的生物（避免無限迴圈）
   * @returns {Object} 修改後的 gameState
   */
  onGainFood(context, foodType, processedCreatures) {
    return context.gameState;
  }

  // ==================== 主動能力 ====================

  /**
   * 檢查是否可以使用主動能力
   *
   * @param {Object} context
   * @returns {{ canUse: boolean, reason: string }}
   */
  canUseAbility(context) {
    return { canUse: false, reason: '此性狀沒有主動能力' };
  }

  /**
   * 取得能力使用的目標選項
   *
   * @param {Object} context
   * @returns {Object[]} 可選目標列表
   */
  getAbilityTargets(context) {
    return [];
  }

  /**
   * 使用主動能力
   *
   * @param {Object} context
   * @param {Object} target - 目標
   * @returns {{ success: boolean, gameState: Object, message: string }}
   */
  useAbility(context, target) {
    return {
      success: false,
      gameState: context.gameState,
      message: '此性狀沒有主動能力',
    };
  }

  // ==================== 階段相關 ====================

  /**
   * 階段開始時觸發
   *
   * @param {Object} context
   * @param {string} phase - 階段名稱
   * @returns {Object} 修改後的 gameState
   */
  onPhaseStart(context, phase) {
    return context.gameState;
  }

  /**
   * 階段結束時觸發
   *
   * @param {Object} context
   * @param {string} phase
   * @returns {Object} 修改後的 gameState
   */
  onPhaseEnd(context, phase) {
    return context.gameState;
  }

  /**
   * 回合開始時重置狀態
   *
   * @param {Object} context
   * @returns {Object} 修改後的 gameState
   */
  onTurnStart(context) {
    return context.gameState;
  }

  // ==================== 滅絕相關 ====================

  /**
   * 檢查滅絕條件
   *
   * @param {Object} context
   * @returns {{ shouldSurvive: boolean, reason: string }}
   */
  checkExtinction(context) {
    return { shouldSurvive: false, reason: '' };
  }

  /**
   * 生物滅絕時觸發（如毒液）
   *
   * @param {Object} context
   * @param {Object} attacker - 攻擊者（如果有）
   * @returns {Object} 修改後的 gameState
   */
  onExtinct(context, attacker) {
    return context.gameState;
  }

  // ==================== 計分相關 ====================

  /**
   * 取得額外分數
   *
   * @param {Object} context
   * @returns {number} 額外分數
   */
  getScoreBonus(context) {
    return this.foodBonus;
  }

  // ==================== 輔助方法 ====================

  /**
   * 取得性狀資訊（用於 UI 顯示）
   *
   * @returns {Object}
   */
  getInfo() {
    return {
      type: this.type,
      name: this.name,
      foodBonus: this.foodBonus,
      description: this.description,
      category: this.category,
      isInteractive: this.isInteractive,
      isStackable: this.isStackable,
      incompatible: this.incompatible,
      expansion: this.expansion,
    };
  }
}

module.exports = TraitHandler;
```

#### 2. 建立性狀處理器註冊中心

**檔案**：`backend/logic/evolution/traits/traitRegistry.js`

```javascript
/**
 * 性狀處理器註冊中心
 */
class TraitRegistry {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * 註冊性狀處理器
   */
  register(handler) {
    if (!handler.type) {
      throw new Error('Handler must have a type property');
    }
    this.handlers.set(handler.type, handler);
  }

  /**
   * 取得性狀處理器
   */
  get(traitType) {
    return this.handlers.get(traitType);
  }

  /**
   * 檢查是否存在
   */
  has(traitType) {
    return this.handlers.has(traitType);
  }

  /**
   * 取得所有處理器
   */
  getAll() {
    return Array.from(this.handlers.values());
  }

  /**
   * 批量註冊
   */
  registerAll(handlers) {
    for (const handler of Object.values(handlers)) {
      this.register(handler);
    }
  }

  /**
   * 清除所有（測試用）
   */
  clear() {
    this.handlers.clear();
  }
}

// 全域單例
const globalTraitRegistry = new TraitRegistry();

module.exports = {
  TraitRegistry,
  globalTraitRegistry,
};
```

#### 3. 統一匯出

**檔案**：`backend/logic/evolution/traits/index.js`

```javascript
const TraitHandler = require('./TraitHandler');
const { TraitRegistry, globalTraitRegistry } = require('./traitRegistry');

module.exports = {
  TraitHandler,
  TraitRegistry,
  globalTraitRegistry,
};
```

### 測試需求

**檔案**：`backend/logic/evolution/traits/__tests__/TraitHandler.test.js`

```javascript
describe('TraitHandler', () => {
  describe('canPlace', () => {
    test('should reject placing on enemy creature (non-parasite)', () => {
      const handler = new TestHandler({ type: 'test', isParasite: false });
      const result = handler.canPlace({
        creature: { ownerId: 'enemy' },
        player: { id: 'player' },
      });
      expect(result.valid).toBe(false);
    });

    test('should require placing parasite on enemy', () => {
      const handler = new TestHandler({ type: 'parasite', isParasite: true });
      const result = handler.canPlace({
        creature: { ownerId: 'player' },
        player: { id: 'player' },
      });
      expect(result.valid).toBe(false);
    });

    test('should reject duplicate non-stackable trait', () => {
      const handler = new TestHandler({ type: 'test', isStackable: false });
      const result = handler.canPlace({
        creature: {
          ownerId: 'player',
          traits: [{ type: 'test' }],
        },
        player: { id: 'player' },
      });
      expect(result.valid).toBe(false);
    });

    test('should allow duplicate stackable trait', () => {
      const handler = new TestHandler({ type: 'fat', isStackable: true });
      const result = handler.canPlace({
        creature: {
          ownerId: 'player',
          traits: [{ type: 'fat' }],
        },
        player: { id: 'player' },
      });
      expect(result.valid).toBe(true);
    });

    test('should reject incompatible traits', () => {
      const handler = new TestHandler({
        type: 'carnivore',
        incompatible: ['scavenger'],
      });
      const result = handler.canPlace({
        creature: {
          ownerId: 'player',
          traits: [{ type: 'scavenger', name: '腐食' }],
        },
        player: { id: 'player' },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('interactive traits', () => {
    test('should require target creature', () => {
      const handler = new TestHandler({ type: 'comm', isInteractive: true });
      const result = handler.canPlace({
        creature: { ownerId: 'player' },
        player: { id: 'player' },
        targetCreature: null,
      });
      expect(result.valid).toBe(false);
    });

    test('should require target owned by same player', () => {
      const handler = new TestHandler({ type: 'comm', isInteractive: true });
      const result = handler.canPlace({
        creature: { id: 'c1', ownerId: 'player' },
        player: { id: 'player' },
        targetCreature: { id: 'c2', ownerId: 'enemy' },
      });
      expect(result.valid).toBe(false);
    });
  });
});

// 測試用的具體實作
class TestHandler extends TraitHandler {
  constructor(definition) {
    super({
      name: 'Test',
      description: 'Test trait',
      category: 'test',
      ...definition,
    });
    this.isParasite = definition.isParasite || false;
  }
}
```

### 驗收標準

- [ ] TraitHandler 類別完整實作所有方法
- [ ] 所有方法有完整的 JSDoc 註解
- [ ] TraitRegistry 可正確註冊和取得處理器
- [ ] 單元測試覆蓋率 > 90%
- [ ] 基礎驗證邏輯正確

### 相關檔案

**新增檔案**：
- `backend/logic/evolution/traits/TraitHandler.js`
- `backend/logic/evolution/traits/traitRegistry.js`
- `backend/logic/evolution/traits/index.js`
- `backend/logic/evolution/traits/__tests__/TraitHandler.test.js`

### 依賴工單
- 0317（擴充包註冊系統）
- 0318（性狀定義結構）

### 被依賴工單
- 0320（基礎版性狀處理器）
- 0321（規則引擎核心）
