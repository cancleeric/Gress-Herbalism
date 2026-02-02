# 演化論擴充包開發指南

本指南說明如何為演化論遊戲開發新的擴充包。

## 快速開始

### 1. 建立擴充包目錄

```
shared/expansions/
├── base/              # 基礎版（參考）
└── your-expansion/    # 你的擴充包
    ├── index.js       # 主入口
    ├── traits/
    │   ├── definitions.js
    │   └── handlers/
    │       └── YourTraitHandler.js
    └── cards/
        └── definitions.js
```

### 2. 定義擴充包主入口

```javascript
// your-expansion/index.js

/**
 * 你的擴充包
 * 符合 ExpansionInterface 介面
 */
const yourExpansion = {
  // 必要欄位
  id: 'your-expansion',
  name: '你的擴充包',
  version: '1.0.0',
  description: '擴充包描述',

  // 依賴與不相容
  requires: ['base'],      // 依賴基礎版
  incompatible: [],        // 不相容的擴充包

  // 性狀處理器
  traits: {
    YOUR_TRAIT: new YourTraitHandler(),
    // ...更多處理器
  },

  // 卡牌定義
  cards: [
    { id: 'YOUR_001', frontTrait: 'yourTrait', backTrait: 'fatTissue', count: 4 },
    // ...更多卡牌
  ],

  // 規則
  rules: {
    minPlayers: 2,
    maxPlayers: 4,
    // ...其他規則
  },

  // 建立牌庫
  createDeck() {
    const deck = [];
    for (const card of this.cards) {
      for (let i = 0; i < card.count; i++) {
        deck.push({
          id: card.id,
          instanceId: `${this.id}_${card.id}_${i}`,
          frontTrait: card.frontTrait,
          backTrait: card.backTrait,
          expansion: this.id,
        });
      }
    }
    return deck;
  },

  // 生命週期鉤子（可選）
  onRegister(registry) {
    console.log(`${this.name} registered`);
  },

  onEnable(registry) {
    console.log(`${this.name} enabled`);
  },

  onDisable(registry) {
    console.log(`${this.name} disabled`);
  },
};

module.exports = { yourExpansion };
```

### 3. 實作性狀處理器

```javascript
// your-expansion/traits/handlers/YourTraitHandler.js

/**
 * 你的性狀處理器
 */
class YourTraitHandler {
  /**
   * 性狀類型
   * @returns {string}
   */
  get traitType() {
    return 'yourTrait';
  }

  /**
   * 檢查是否可以放置此性狀
   * @param {Object} creature - 目標生物
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} [linkedCreature] - 連結的生物（互動性狀用）
   * @returns {{ allowed: boolean, reason?: string }}
   */
  canPlace(creature, gameState, linkedCreature = null) {
    // 範例：不能與某性狀共存
    const hasConflict = creature.traits.some(t => t.type === 'conflictTrait');
    if (hasConflict) {
      return { allowed: false, reason: '與衝突性狀不相容' };
    }
    return { allowed: true };
  }

  /**
   * 放置性狀時觸發
   * @param {Object} creature - 目標生物
   * @param {Object} gameState - 遊戲狀態
   */
  onPlace(creature, gameState) {
    console.log(`${this.traitType} placed on creature ${creature.id}`);
  }

  /**
   * 取得食量加成
   * @returns {number}
   */
  getFoodBonus() {
    return 0;
  }

  /**
   * 防禦檢查（防禦性狀用）
   * @param {Object} attacker - 攻擊者
   * @param {Object} defender - 防禦者
   * @param {Object} gameState - 遊戲狀態
   * @returns {{ blocked: boolean, reason?: string }}
   */
  checkDefense(attacker, defender, gameState) {
    // 範例：阻擋攻擊
    return {
      blocked: true,
      reason: '你的性狀阻擋了攻擊',
    };
  }

  /**
   * 進食時觸發
   * @param {Object} creature - 生物
   * @param {Object} gameState - 遊戲狀態
   * @returns {Array} 觸發的效果
   */
  onFeed(creature, gameState) {
    return [];
  }

  /**
   * 主動能力
   * @param {Object} creature - 使用能力的生物
   * @param {Object} target - 目標
   * @param {Object} gameState - 遊戲狀態
   * @returns {{ success: boolean, reason?: string }}
   */
  useAbility(creature, target, gameState) {
    return { success: true };
  }

  /**
   * 是否為連結性狀（互動性狀用）
   * @returns {boolean}
   */
  isLinkTrait() {
    return false;
  }
}

module.exports = { YourTraitHandler };
```

### 4. 定義卡牌

```javascript
// your-expansion/cards/definitions.js

const YOUR_CARDS = [
  {
    id: 'YOUR_001',
    frontTrait: 'yourTrait',
    backTrait: 'fatTissue',  // 可使用基礎版性狀
    count: 4,
  },
  {
    id: 'YOUR_002',
    frontTrait: 'anotherTrait',
    backTrait: 'yourTrait',
    count: 4,
  },
  // ...更多卡牌
];

module.exports = { YOUR_CARDS };
```

## 性狀類型參考

### 防禦性狀

防禦性狀需要實作 `checkDefense()` 方法：

```javascript
checkDefense(attacker, defender, gameState) {
  // 檢查攻擊者是否有特定能力可以無視此防禦
  const canBypass = attacker.traits.some(t => t.type === 'bypassTrait');
  if (canBypass) {
    return { blocked: false };
  }
  return { blocked: true, reason: '防禦成功' };
}
```

### 進食性狀

進食性狀需要實作 `onFeed()` 方法：

```javascript
onFeed(creature, gameState) {
  // 返回觸發的效果
  return [{
    type: 'GAIN_FOOD',
    target: creature.id,
    amount: 1,
    source: this.traitType,
  }];
}
```

### 互動性狀（連結兩隻生物）

互動性狀需要：
1. `isLinkTrait()` 返回 `true`
2. `canPlace()` 接受 `linkedCreature` 參數

```javascript
isLinkTrait() {
  return true;
}

canPlace(creature, gameState, linkedCreature) {
  if (!linkedCreature) {
    return { allowed: false, reason: '需要選擇連結的生物' };
  }

  // 只能連結自己的生物
  if (creature.ownerId !== linkedCreature.ownerId) {
    return { allowed: false, reason: '只能連結自己的生物' };
  }

  return { allowed: true };
}
```

## 測試你的擴充包

### 單元測試範例

```javascript
// __tests__/yourExpansion/yourTrait.test.js

const { YourTraitHandler } = require('../traits/handlers/YourTraitHandler');
const { createMockGameState, createMockCreature } = require('../../testUtils');

describe('YourTraitHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new YourTraitHandler();
  });

  describe('canPlace', () => {
    it('should allow placement on empty creature', () => {
      const gameState = createMockGameState();
      const creature = createMockCreature('c1', 'p1');

      const result = handler.canPlace(creature, gameState);

      expect(result.allowed).toBe(true);
    });

    it('should reject placement when conflict exists', () => {
      const gameState = createMockGameState();
      const creature = createMockCreature('c1', 'p1');
      creature.traits.push({ type: 'conflictTrait' });

      const result = handler.canPlace(creature, gameState);

      expect(result.allowed).toBe(false);
    });
  });

  describe('checkDefense', () => {
    it('should block attack', () => {
      const attacker = createMockCreature('c1', 'p1');
      const defender = createMockCreature('c2', 'p2');
      const gameState = createMockGameState();

      const result = handler.checkDefense(attacker, defender, gameState);

      expect(result.blocked).toBe(true);
    });
  });
});
```

### 測試工具函數

使用 `shared/expansions/__tests__/testUtils.js` 提供的工具：

```javascript
const {
  createMockGameState,
  createMockCreature,
  addCreatureToPlayer,
  addTraitToCreature,
} = require('../../__tests__/testUtils');
```

## 驗證擴充包

### 介面驗證

```javascript
const { validateExpansionInterface } = require('shared/expansions/ExpansionInterface');

const result = validateExpansionInterface(yourExpansion);
if (!result.valid) {
  console.error('驗證失敗:', result.errors);
}
```

### 註冊測試

```javascript
const { ExpansionRegistry } = require('shared/expansions/ExpansionRegistry');
const { baseExpansion } = require('shared/expansions/base');
const { yourExpansion } = require('./index');

const registry = new ExpansionRegistry();

// 先註冊並啟用基礎版
registry.register(baseExpansion);
registry.enable('base');

// 註冊並啟用你的擴充包
registry.register(yourExpansion);
registry.enable('your-expansion');

// 驗證處理器已註冊
const handler = registry.getTraitHandler('yourTrait');
console.log('Handler registered:', handler !== undefined);
```

## 性狀命名規範

| 類別 | 命名格式 | 範例 |
|------|----------|------|
| 類型常數 | camelCase | `yourTrait`, `sharpVision` |
| 處理器類別 | PascalCase + Handler | `YourTraitHandler` |
| 檔案名稱 | PascalCase + Handler.js | `YourTraitHandler.js` |

## 發布清單

- [ ] 擴充包 id 為小寫字母、數字、連字號
- [ ] version 符合語意化版本 (x.y.z)
- [ ] 所有性狀有對應的處理器
- [ ] 所有卡牌使用的性狀都存在
- [ ] `createDeck()` 正確建立牌庫
- [ ] 單元測試覆蓋率 >= 75%
- [ ] 整合測試通過
- [ ] 與基礎版相容性測試通過

## 常見問題

### Q: 如何存取其他性狀的處理器？

使用 `ExpansionRegistry`：

```javascript
// 在遊戲邏輯中
const handler = registry.getTraitHandler('carnivore');
```

### Q: 如何覆寫基礎規則？

在擴充包的 `rules` 中定義：

```javascript
rules: {
  // 覆寫食物公式
  foodFormula: {
    2: { dice: 2, bonus: 0 },  // 2 人遊戲擲 2 顆骰子
    3: { dice: 2, bonus: 2 },
    4: { dice: 3, bonus: 0 },
  },
}
```

### Q: 如何處理性狀連鎖效果？

使用 `EffectQueue`：

```javascript
onFeed(creature, gameState) {
  // 返回效果陣列，系統會按優先順序處理
  return [
    {
      type: 'GAIN_FOOD',
      target: linkedCreatureId,
      amount: 1,
      priority: 'NORMAL',
    },
  ];
}
```

---

**文件版本**: 1.0
**最後更新**: 2026-02-02
**作者**: Claude Code
