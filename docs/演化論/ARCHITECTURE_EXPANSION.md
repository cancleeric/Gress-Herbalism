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
│  │ GameState   │  │  RuleEngine │       │   Loader    │     │
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

**位置**: `shared/expansions/ExpansionRegistry.js`

```javascript
// 使用範例
const registry = new ExpansionRegistry();
registry.register(baseExpansion);
registry.enable('base');

const handler = registry.getTraitHandler('carnivore');
```

### ExpansionInterface

擴充包介面規範，定義所有擴充包必須遵循的格式：

**位置**: `shared/expansions/ExpansionInterface.js`

**必要欄位**:
- `id`: 唯一識別碼（小寫字母、數字、連字號）
- `name`: 顯示名稱（中文）
- `version`: 語意化版本號（x.y.z）

**選用欄位**:
- `requires`: 依賴的擴充包 ID 列表
- `incompatible`: 不相容的擴充包 ID 列表
- `traits`: 性狀處理器映射
- `cards`: 卡牌定義陣列
- `rules`: 規則定義

### TraitHandler

性狀處理器抽象類別，定義性狀行為：

**位置**: `shared/expansions/base/traits/handlers/`

```javascript
class TraitHandler {
  get traitType() { return 'traitName'; }  // 性狀類型
  canPlace(creature, gameState) { }         // 是否可放置
  onPlace(creature, gameState) { }          // 放置時觸發
  checkDefense(attacker, defender) { }      // 防禦檢查
  onFeed(creature, gameState) { }           // 進食時觸發
  useAbility(creature, target) { }          // 主動能力
  getFoodBonus() { }                        // 食量加成
}
```

### RuleEngine

規則引擎，支援規則覆寫：

**位置**: `shared/expansions/base/rules/`

包含以下規則模組：
- `foodRules.js`: 食物計算規則
- `attackRules.js`: 攻擊規則
- `feedingRules.js`: 進食規則
- `extinctionRules.js`: 滅絕規則
- `scoreRules.js`: 計分規則
- `phaseRules.js`: 階段規則

### EffectQueue

效果佇列，管理效果觸發順序：

**位置**: `shared/expansions/core/effectQueue.js`

```javascript
queue.enqueue({
  type: EFFECT_TYPE.GAIN_FOOD,
  priority: EFFECT_PRIORITY.NORMAL,
  data: { creatureId, amount: 1 },
});

queue.resolveAll(gameState);
```

### EventEmitter

事件發布訂閱系統：

**位置**: `shared/expansions/core/eventEmitter.js`

支援的事件類型定義於 `gameEvents.js`

## 資料流

### 遊戲初始化流程

```
1. 房主選擇擴充包
2. ExpansionRegistry 註冊並啟用擴充包
3. 驗證依賴和相容性
4. 註冊性狀處理器
5. 建立合併的卡牌池
6. GameInitializer 建立遊戲狀態
7. 發牌並開始遊戲
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

## 目錄結構

```
shared/expansions/
├── ExpansionInterface.js     # 擴充包介面定義
├── ExpansionRegistry.js      # 擴充包註冊系統
├── index.js                  # 模組匯出
├── loader.js                 # 擴充包載入器
├── manifest.js               # Manifest 定義
├── validator.js              # 驗證系統
├── compatibility.js          # 相容性檢查
│
├── core/                     # 核心系統
│   ├── effectTypes.js        # 效果類型定義
│   ├── effectSystem.js       # 效果系統
│   ├── effectQueue.js        # 效果佇列
│   ├── eventEmitter.js       # 事件發布器
│   ├── gameEvents.js         # 遊戲事件定義
│   ├── traitEventBridge.js   # 性狀事件橋接
│   └── index.js              # 核心模組匯出
│
├── base/                     # 基礎版擴充包
│   ├── index.js              # 擴充包主入口
│   ├── cards.js              # 舊版卡牌（向後相容）
│   │
│   ├── traits/               # 性狀模組
│   │   ├── definitions.js    # 性狀定義
│   │   ├── index.js          # 性狀匯出
│   │   └── handlers/         # 性狀處理器
│   │       ├── carnivore/    # 肉食相關
│   │       ├── defense/      # 防禦相關
│   │       ├── feeding/      # 進食相關
│   │       ├── interactive/  # 互動相關
│   │       └── special/      # 特殊能力
│   │
│   ├── cards/                # 卡牌模組
│   │   ├── definitions.js    # 卡牌定義
│   │   ├── cardFactory.js    # 卡牌工廠
│   │   └── index.js          # 卡牌匯出
│   │
│   └── rules/                # 規則模組
│       ├── foodRules.js      # 食物規則
│       ├── attackRules.js    # 攻擊規則
│       ├── feedingRules.js   # 進食規則
│       ├── extinctionRules.js # 滅絕規則
│       ├── scoreRules.js     # 計分規則
│       ├── phaseRules.js     # 階段規則
│       └── index.js          # 規則匯出
│
└── __tests__/                # 測試
    ├── testUtils.js          # 測試工具
    ├── mockExpansion.js      # Mock 擴充包
    └── integration/          # 整合測試
        ├── fullGameFlow.test.js
        ├── traitInteractions.test.js
        └── expansionCombination.test.js
```

## 擴充點

### 1. 新增性狀

實作 `TraitHandler` 介面並在擴充包的 `traits` 中註冊。

### 2. 新增規則

在擴充包的 `rules` 中定義規則或覆寫現有規則。

### 3. 新增卡牌

在擴充包的 `cards` 陣列中新增卡牌定義。

### 4. 生命週期鉤子

擴充包可實作以下鉤子：
- `onRegister(registry)`: 註冊時調用
- `onEnable(registry)`: 啟用時調用
- `onDisable(registry)`: 停用時調用
- `onGameInit(gameState)`: 遊戲初始化時調用
- `onGameEnd(gameState)`: 遊戲結束時調用

## 最佳實踐

1. **不要直接修改遊戲狀態**：使用 EffectQueue 發送效果
2. **使用事件系統**：透過 EventEmitter 通知其他模組
3. **性狀之間不要直接依賴**：使用 Registry 查詢
4. **完整測試**：每個性狀都要有單元測試
5. **向後相容**：新版本應支援舊版本的遊戲存檔

---

**文件版本**: 1.0
**最後更新**: 2026-02-02
**作者**: Claude Code
