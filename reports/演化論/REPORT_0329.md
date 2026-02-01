# 完成報告 0329

## 編號
0329

## 日期
2026-02-01

## 工作單標題
更新單元測試（新架構）

## 完成摘要

成功建立擴充包測試工具函式和 Mock 擴充包，提供完整的測試輔助功能。

## 實作內容

### 1. 測試工具函式 (`testUtils.js`)

**建立 Mock 物件函數**：

| 函數 | 說明 |
|------|------|
| `createMockGameState(overrides)` | 建立 Mock 遊戲狀態 |
| `createMockPlayer(playerId, overrides)` | 建立 Mock 玩家 |
| `createMockCreature(creatureId, ownerId, overrides)` | 建立 Mock 生物 |
| `createMockCard(cardId, frontTrait, backTrait)` | 建立 Mock 卡牌 |
| `createMockEventEmitter()` | 建立 Mock 事件發射器 |
| `createMockEffectQueue()` | 建立 Mock 效果佇列 |
| `createMockExpansion(id, overrides)` | 建立 Mock 擴充包 |
| `createMockTraitHandler(traitType, overrides)` | 建立 Mock 性狀處理器 |

**操作函數**：

| 函數 | 說明 |
|------|------|
| `addCreatureToPlayer(gameState, playerId, creature)` | 為玩家添加生物 |
| `addTraitToCreature(creature, traitType, options)` | 為生物添加性狀 |
| `setGamePhase(gameState, phase)` | 設定遊戲階段 |
| `simulateFeed(gameState, creatureId, amount)` | 模擬進食行動 |

**斷言輔助 (`assertHelpers`)**：

| 函數 | 說明 |
|------|------|
| `assertCreatureAlive(gameState, creatureId)` | 斷言生物存活 |
| `assertCreatureDead(gameState, creatureId)` | 斷言生物死亡 |
| `assertCreatureHasTrait(gameState, creatureId, traitType)` | 斷言生物有指定性狀 |
| `assertFoodPool(gameState, expectedAmount)` | 斷言食物池數量 |

### 2. Mock 擴充包 (`mockExpansion.js`)

**mockBaseExpansion**：
- 3 個性狀：MOCK_CARNIVORE、MOCK_DEFENSE、MOCK_FAT
- 3 張卡牌定義（共 12 張）
- 完整的 traitHandlers
- createDeck() 方法

**mockFlightExpansion**：
- 依賴 mock-base >=1.0.0
- 支援 2-6 人
- 2 個性狀：MOCK_FLYING、MOCK_NESTING
- 2 張卡牌定義（共 8 張）

**mockConflictExpansion**：
- 依賴 mock-base >=1.0.0
- 與 mock-flight 衝突
- 用於測試衝突檢測

### 3. 測試檔案

建立 `testUtils.test.js`，涵蓋所有工具函數：
- 31 個測試案例
- 覆蓋所有建立函數、操作函數、斷言輔助

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       31 passed, 31 total (testUtils.test.js)
```

**完整測試套件**：
```
Test Suites: 11 passed, 11 total
Tests:       484 passed, 484 total
```

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `shared/expansions/__tests__/testUtils.js` | 測試工具函式 |
| `shared/expansions/__tests__/mockExpansion.js` | Mock 擴充包 |
| `shared/expansions/__tests__/testUtils.test.js` | 工具函式測試 |

## 驗收標準達成

- [x] 測試工具函式提供完整建立 Mock 物件功能
- [x] Mock 擴充包可正常使用
- [x] 操作函數正確運作
- [x] 斷言輔助正確驗證狀態
- [x] 所有測試通過（31 個新測試 + 453 個既有測試）

## 備註

- 使用 Jest 語法（專案使用 Jest 而非 Vitest）
- Mock 物件支援 overrides 以便靈活測試
- assertHelpers 減少測試中的重複代碼
- mockConflictExpansion 專門用於衝突檢測測試
- 卡牌支援 selectSide() 和 getSelectedTrait() 方法
