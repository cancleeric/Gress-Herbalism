# 工單完成報告 0320

## 工單資訊
- **工單編號**: 0320
- **工單名稱**: 實作 19 種基礎性狀處理器
- **完成日期**: 2026-02-01
- **計畫書**: PLAN_PHASE2_EXPANSION_REGISTRY.md

## 完成內容

### 1. 建立 19 個性狀處理器

#### 肉食相關 (3 個)
- `CarnivoreHandler.js` - 肉食性狀（食量+1，必須攻擊獲得食物）
- `ScavengerHandler.js` - 腐食性狀（其他生物被肉食滅絕時獲得藍色食物）
- `SharpVisionHandler.js` - 銳目性狀（標記性狀，邏輯在偽裝中處理）

#### 防禦相關 (8 個)
- `CamouflageHandler.js` - 偽裝性狀（需要銳目才能攻擊）
- `BurrowingHandler.js` - 穴居性狀（吃飽時無法被攻擊）
- `PoisonousHandler.js` - 毒液性狀（被滅絕時攻擊者中毒）
- `AquaticHandler.js` - 水生性狀（只有水生肉食可攻擊）
- `AgileHandler.js` - 敏捷性狀（擲骰逃脫 4-6 成功）
- `MassiveHandler.js` - 巨化性狀（食量+1，只有巨化可攻擊）
- `TailLossHandler.js` - 斷尾性狀（棄置性狀取消攻擊）
- `MimicryHandler.js` - 擬態性狀（轉移攻擊到其他生物）

#### 進食相關 (4 個)
- `FatTissueHandler.js` - 脂肪組織（可疊加，儲存黃色食物）
- `HibernationHandler.js` - 冬眠性狀（跳過進食視為吃飽）
- `ParasiteHandler.js` - 寄生蟲（食量+2，放在對手生物上）
- `RobberyHandler.js` - 掠奪性狀（偷取未吃飽生物的食物）

#### 互動相關 (3 個)
- `CommunicationHandler.js` - 溝通性狀（連結的生物同時獲得紅色食物）
- `CooperationHandler.js` - 合作性狀（連結的生物獲得藍色食物）
- `SymbiosisHandler.js` - 共生性狀（代表吃飽前被保護者不能進食）

#### 特殊能力 (1 個)
- `TramplingHandler.js` - 踐踏性狀（移除食物池中的紅色食物）

### 2. 建立分類索引檔案

每個類別資料夾都建立了 `index.js`：
- `handlers/carnivore/index.js`
- `handlers/defense/index.js`
- `handlers/feeding/index.js`
- `handlers/interactive/index.js`
- `handlers/special/index.js`

### 3. 建立主要匯出模組

`handlers/index.js`:
- 匯出所有 19 個處理器類別
- 提供 `TRAIT_HANDLERS` 映射表
- 提供 `createHandler()` 工廠函數
- 提供 `getAllHandlerClasses()` 輔助函數
- 提供 `registerAllHandlers()` 註冊函數

### 4. 修復問題

- 修復 `SymbiosisHandler.js` 中的保留字問題（`protected` → `protectedCreature`）
- 在 `TraitHandler.js` 中加入 `this.definition` 屬性以支援測試

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       63 passed, 63 total
Snapshots:   0 total
```

### 測試涵蓋內容

| 處理器 | 測試數 | 測試項目 |
|--------|--------|----------|
| Index Exports | 5 | 匯出驗證、工廠函數 |
| CarnivoreHandler | 4 | 定義、進食限制、攻擊能力、目標選取 |
| ScavengerHandler | 3 | 定義、肉食觸發、非肉食不觸發 |
| SharpVisionHandler | 2 | 定義、標記性狀驗證 |
| CamouflageHandler | 2 | 阻擋攻擊、銳目可攻擊 |
| BurrowingHandler | 2 | 吃飽阻擋、未吃飽可攻擊 |
| PoisonousHandler | 2 | 中毒標記、無攻擊者處理 |
| AquaticHandler | 2 | 非水生阻擋、水生可攻擊 |
| AgileHandler | 3 | 擲骰選項、高點逃脫、低點失敗 |
| MassiveHandler | 3 | 食量加成、非巨化阻擋、巨化可攻擊 |
| TailLossHandler | 3 | 有性狀選項、無性狀不提供、移除與補償 |
| MimicryHandler | 2 | 轉移選項、已使用不提供 |
| FatTissueHandler | 5 | 可疊加、使用條件、無脂肪、轉換食物、滅絕存活 |
| HibernationHandler | 5 | 使用條件、最後回合、冬眠標記、滅絕存活、進食限制 |
| ParasiteHandler | 4 | 食量加成、對手放置、自己不可、食量增加 |
| RobberyHandler | 3 | 已使用限制、目標選取、偷取食物 |
| CommunicationHandler | 2 | 互動性狀、連鎖觸發 |
| CooperationHandler | 2 | 互動性狀、藍色食物 |
| SymbiosisHandler | 4 | 互動性狀、代表未飽限制、代表已飽允許、保護機制 |
| TramplingHandler | 5 | 有食物可用、無食物不可、移除食物、已使用限制、階段重置 |

## 檔案結構

```
shared/expansions/base/traits/handlers/
├── index.js                    # 主要匯出模組
├── __tests__/
│   └── handlers.test.js        # 測試檔案 (63 tests)
├── carnivore/
│   ├── index.js
│   ├── CarnivoreHandler.js
│   ├── ScavengerHandler.js
│   └── SharpVisionHandler.js
├── defense/
│   ├── index.js
│   ├── CamouflageHandler.js
│   ├── BurrowingHandler.js
│   ├── PoisonousHandler.js
│   ├── AquaticHandler.js
│   ├── AgileHandler.js
│   ├── MassiveHandler.js
│   ├── TailLossHandler.js
│   └── MimicryHandler.js
├── feeding/
│   ├── index.js
│   ├── FatTissueHandler.js
│   ├── HibernationHandler.js
│   ├── ParasiteHandler.js
│   └── RobberyHandler.js
├── interactive/
│   ├── index.js
│   ├── CommunicationHandler.js
│   ├── CooperationHandler.js
│   └── SymbiosisHandler.js
└── special/
    ├── index.js
    └── TramplingHandler.js
```

## 相依性

- `TraitHandler` 基礎類別（`backend/logic/evolution/traits/TraitHandler.js`）
- `definitions.js`（`shared/expansions/base/traits/definitions.js`）

## 後續工作

- 工單 0321: 整合處理器到現有遊戲邏輯
- 工單 0322: 實作完整的攻擊/防禦結算引擎
