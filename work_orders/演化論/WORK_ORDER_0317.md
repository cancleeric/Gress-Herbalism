# 工作單 0317

## 編號
0317

## 日期
2026-02-01

## 工作單標題
建立擴充包註冊系統核心

## 工單主旨
演化論第二階段 - 可擴展架構（P2-A）

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_PHASE2_ARCHITECTURE.md`

## 優先級
P0（核心基礎，其他工單依賴此工單）

## 內容

### 目標
建立 ExpansionRegistry 核心模組，作為擴充包系統的基礎設施。

### 詳細需求

#### 1. 建立 ExpansionInterface 介面定義

**檔案**：`shared/expansions/ExpansionInterface.js`

```javascript
/**
 * 擴充包介面定義
 * 所有擴充包必須符合此介面
 */
const ExpansionInterface = {
  // === 必要欄位 ===
  id: 'string',           // 唯一識別碼，如 'base', 'flight', 'timeline'
  name: 'string',         // 顯示名稱（中文），如 '物種起源', '飛翔'
  version: 'string',      // 語意化版本號，如 '1.0.0'
  description: 'string',  // 擴充包描述

  // === 依賴關係 ===
  requires: ['string'],      // 依賴的擴充包 ID 列表
  incompatible: ['string'],  // 不相容的擴充包 ID 列表

  // === 擴充內容 ===
  traits: {},      // 性狀處理器映射 { traitType: TraitHandler }
  cards: [],       // 卡牌定義陣列
  rules: {},       // 規則定義

  // === 生命週期鉤子（可選）===
  onRegister: Function,     // 註冊時調用
  onEnable: Function,       // 啟用時調用
  onDisable: Function,      // 停用時調用
  onGameInit: Function,     // 遊戲初始化時調用
  onGameEnd: Function,      // 遊戲結束時調用
};

module.exports = { ExpansionInterface };
```

#### 2. 建立 ExpansionRegistry 類別

**檔案**：`shared/expansions/ExpansionRegistry.js`

**核心方法**：

| 方法 | 說明 | 參數 | 回傳值 |
|------|------|------|--------|
| `register(expansion)` | 註冊擴充包 | expansion: Object | void |
| `unregister(expansionId)` | 移除擴充包 | expansionId: string | boolean |
| `enable(expansionId)` | 啟用擴充包 | expansionId: string | void |
| `disable(expansionId)` | 停用擴充包 | expansionId: string | void |
| `isEnabled(expansionId)` | 檢查是否啟用 | expansionId: string | boolean |
| `getExpansion(expansionId)` | 取得擴充包 | expansionId: string | Object |
| `getEnabledExpansions()` | 取得所有啟用的擴充包 | - | Array |
| `getTraitHandler(traitType)` | 取得性狀處理器 | traitType: string | TraitHandler |
| `getAllTraitHandlers()` | 取得所有性狀處理器 | - | Map |
| `getCardPool()` | 取得啟用的卡牌池 | - | Array |
| `createDeck()` | 建立遊戲牌組 | - | Array |
| `validateExpansion(expansion)` | 驗證擴充包格式 | expansion: Object | { valid, errors } |
| `checkDependencies(expansionId)` | 檢查依賴 | expansionId: string | { satisfied, missing } |
| `checkCompatibility(expansionId)` | 檢查相容性 | expansionId: string | { compatible, conflicts } |

**內部狀態**：

```javascript
class ExpansionRegistry {
  constructor() {
    this.expansions = new Map();      // 所有已註冊的擴充包
    this.enabled = new Set();         // 已啟用的擴充包 ID
    this.traitHandlers = new Map();   // 性狀處理器映射
    this.cardPool = [];               // 啟用的卡牌池
  }
}
```

#### 3. 建立統一匯出點

**檔案**：`shared/expansions/index.js`

```javascript
const { ExpansionRegistry } = require('./ExpansionRegistry');
const { ExpansionInterface } = require('./ExpansionInterface');

// 全域單例
const globalRegistry = new ExpansionRegistry();

module.exports = {
  ExpansionRegistry,
  ExpansionInterface,
  globalRegistry,
};
```

### 實作細節

#### 依賴檢查邏輯

```javascript
checkDependencies(expansionId) {
  const expansion = this.expansions.get(expansionId);
  if (!expansion) {
    return { satisfied: false, missing: [expansionId] };
  }

  const missing = [];
  for (const reqId of expansion.requires || []) {
    if (!this.enabled.has(reqId)) {
      missing.push(reqId);
    }
  }

  return {
    satisfied: missing.length === 0,
    missing,
  };
}
```

#### 相容性檢查邏輯

```javascript
checkCompatibility(expansionId) {
  const expansion = this.expansions.get(expansionId);
  if (!expansion) {
    return { compatible: false, conflicts: [] };
  }

  const conflicts = [];
  for (const incompatId of expansion.incompatible || []) {
    if (this.enabled.has(incompatId)) {
      conflicts.push(incompatId);
    }
  }

  return {
    compatible: conflicts.length === 0,
    conflicts,
  };
}
```

#### 擴充包驗證邏輯

```javascript
validateExpansion(expansion) {
  const errors = [];

  // 必要欄位檢查
  if (!expansion.id || typeof expansion.id !== 'string') {
    errors.push('缺少有效的 id 欄位');
  }
  if (!expansion.name || typeof expansion.name !== 'string') {
    errors.push('缺少有效的 name 欄位');
  }
  if (!expansion.version || typeof expansion.version !== 'string') {
    errors.push('缺少有效的 version 欄位');
  }

  // ID 格式檢查（只允許小寫字母、數字、連字號）
  if (expansion.id && !/^[a-z0-9-]+$/.test(expansion.id)) {
    errors.push('id 只能包含小寫字母、數字和連字號');
  }

  // 版本格式檢查（語意化版本）
  if (expansion.version && !/^\d+\.\d+\.\d+$/.test(expansion.version)) {
    errors.push('version 必須符合語意化版本格式 (x.y.z)');
  }

  // 重複 ID 檢查
  if (this.expansions.has(expansion.id)) {
    errors.push(`擴充包 ID "${expansion.id}" 已存在`);
  }

  // 自我依賴檢查
  if (expansion.requires?.includes(expansion.id)) {
    errors.push('擴充包不能依賴自己');
  }

  // 自我不相容檢查
  if (expansion.incompatible?.includes(expansion.id)) {
    errors.push('擴充包不能與自己不相容');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 測試需求

**檔案**：`shared/expansions/__tests__/ExpansionRegistry.test.js`

```javascript
describe('ExpansionRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ExpansionRegistry();
  });

  describe('register', () => {
    test('should register valid expansion', () => {
      const expansion = {
        id: 'test',
        name: 'Test Expansion',
        version: '1.0.0',
        description: 'For testing',
        traits: {},
        cards: [],
      };

      registry.register(expansion);
      expect(registry.expansions.has('test')).toBe(true);
    });

    test('should reject invalid expansion', () => {
      const invalid = { name: 'No ID' };
      expect(() => registry.register(invalid)).toThrow();
    });

    test('should reject duplicate ID', () => {
      const expansion = { id: 'test', name: 'Test', version: '1.0.0' };
      registry.register(expansion);
      expect(() => registry.register(expansion)).toThrow();
    });
  });

  describe('enable', () => {
    test('should enable expansion', () => {
      registry.register({ id: 'test', name: 'Test', version: '1.0.0' });
      registry.enable('test');
      expect(registry.isEnabled('test')).toBe(true);
    });

    test('should throw if dependencies not met', () => {
      registry.register({
        id: 'child',
        name: 'Child',
        version: '1.0.0',
        requires: ['parent'],
      });
      expect(() => registry.enable('child')).toThrow(/requires parent/);
    });

    test('should throw if incompatible expansion enabled', () => {
      registry.register({ id: 'a', name: 'A', version: '1.0.0' });
      registry.register({
        id: 'b',
        name: 'B',
        version: '1.0.0',
        incompatible: ['a'],
      });
      registry.enable('a');
      expect(() => registry.enable('b')).toThrow(/incompatible/);
    });
  });

  describe('getTraitHandler', () => {
    test('should return trait handler after enable', () => {
      const mockHandler = { type: 'testTrait' };
      registry.register({
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        traits: { testTrait: mockHandler },
      });
      registry.enable('test');
      expect(registry.getTraitHandler('testTrait')).toBe(mockHandler);
    });

    test('should return undefined for unknown trait', () => {
      expect(registry.getTraitHandler('unknown')).toBeUndefined();
    });
  });

  describe('createDeck', () => {
    test('should create deck from enabled expansions', () => {
      registry.register({
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        cards: [
          { traitType: 'trait1', count: 2 },
          { traitType: 'trait2', count: 3 },
        ],
      });
      registry.enable('test');

      const deck = registry.createDeck();
      expect(deck.length).toBe(5);
    });
  });
});
```

### 驗收標準

- [ ] `ExpansionInterface.js` 定義完整且有 JSDoc 註解
- [ ] `ExpansionRegistry.js` 實作所有核心方法
- [ ] 所有方法有完整的錯誤處理
- [ ] 單元測試覆蓋率 > 90%
- [ ] 通過所有測試案例
- [ ] 有使用範例文檔

### 相關檔案

**新增檔案**：
- `shared/expansions/ExpansionInterface.js`
- `shared/expansions/ExpansionRegistry.js`
- `shared/expansions/index.js`
- `shared/expansions/__tests__/ExpansionRegistry.test.js`

### 依賴工單
無

### 被依賴工單
- 0318（性狀定義結構）
- 0319（性狀處理器介面）
- 0326（擴充包載入機制）
- 0327（遊戲初始化重構）
