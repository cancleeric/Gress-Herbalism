# 完成報告 0324

## 編號
0324

## 日期
2026-02-01

## 工作單標題
建立效果觸發系統

## 完成摘要

成功建立統一的效果觸發系統，用於管理性狀觸發的效果、處理效果優先順序、支援效果堆疊與解析，並為擴充包提供效果擴展點。

## 實作內容

### 1. 效果類型定義 (`core/effectTypes.js`)

**觸發時機 (EFFECT_TIMING)**：
- 階段相關：`PHASE_START`, `PHASE_END`
- 進食相關：`BEFORE_FEED`, `ON_FEED`, `AFTER_FEED`
- 攻擊相關：`BEFORE_ATTACK`, `ON_ATTACK`, `ATTACK_BLOCKED`, `AFTER_ATTACK`
- 被攻擊相關：`BEFORE_DEFEND`, `ON_DEFEND`, `AFTER_DEFEND`
- 生物狀態：`ON_CREATURE_CREATE`, `ON_CREATURE_DEATH`, `ON_TRAIT_ADD`, `ON_TRAIT_REMOVE`
- 回合相關：`TURN_START`, `TURN_END`, `ROUND_START`, `ROUND_END`

**效果類型 (EFFECT_TYPE)**：
- 進食：`GAIN_FOOD`, `LOSE_FOOD`, `TRANSFER_FOOD`
- 脂肪：`STORE_FAT`, `USE_FAT`
- 攻擊：`DEAL_DAMAGE`, `BLOCK_ATTACK`, `REDIRECT_ATTACK`
- 生物：`CREATE_CREATURE`, `DESTROY_CREATURE`
- 性狀：`ADD_TRAIT`, `REMOVE_TRAIT`, `DISABLE_TRAIT`
- 特殊：`SKIP_PHASE`, `DRAW_CARD`, `DISCARD_CARD`, `APPLY_POISON`

**優先級 (EFFECT_PRIORITY)**：
| 等級 | 數值 | 用途 |
|------|------|------|
| INSTANT | 100 | 即時效果（毒液） |
| HIGH | 80 | 高優先級（斷尾） |
| NORMAL | 50 | 一般優先級 |
| LOW | 20 | 低優先級 |
| DELAYED | 0 | 延遲效果 |

### 2. Effect 類別 (`core/effectSystem.js`)

```javascript
class Effect {
  id           // 唯一識別碼
  type         // 效果類型
  timing       // 觸發時機
  priority     // 優先級
  source       // 效果來源
  sourceCreature // 觸發生物
  target       // 目標
  data         // 效果資料
  resolved     // 是否已解析
  result       // 解析結果
  cancelled    // 是否已取消

  cancel()     // 取消效果
  resolve()    // 標記已解析
  canExecute() // 檢查是否可執行
  clone()      // 複製效果
}
```

### 3. EffectQueue 佇列 (`core/effectQueue.js`)

**核心功能**：
- `enqueue()` / `enqueueBatch()` - 加入效果
- `cancel()` / `cancelWhere()` - 取消效果
- `resolveAll()` / `resolveNext()` - 解析效果
- `peek()` / `findEffects()` - 查詢效果
- 事件系統：`on()`, `off()`, `emit()`

**事件**：
- `effectEnqueued` - 效果加入佇列
- `effectCancelled` - 效果被取消
- `beforeResolve` - 解析前
- `effectResolved` - 解析完成
- `effectFailed` - 解析失敗
- `queueCleared` - 佇列清空

### 4. 內建效果處理器 (`core/handlers/builtinEffectHandlers.js`)

| 處理器 | 效果類型 | 優先級 |
|--------|----------|--------|
| ApplyPoisonHandler | APPLY_POISON | 95 |
| BlockAttackHandler | BLOCK_ATTACK | 90 |
| RedirectAttackHandler | REDIRECT_ATTACK | 85 |
| GainFoodHandler | GAIN_FOOD | 50 |
| LoseFoodHandler | LOSE_FOOD | 50 |
| StoreFatHandler | STORE_FAT | 45 |
| UseFatHandler | USE_FAT | 45 |
| RemoveTraitHandler | REMOVE_TRAIT | 40 |
| DestroyCreatureHandler | DESTROY_CREATURE | 30 |

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       36 passed, 36 total
```

**測試覆蓋**：
- Effect 類別: 9 個測試
- EffectQueue: 15 個測試
- GainFoodHandler: 3 個測試
- StoreFatHandler: 3 個測試
- DestroyCreatureHandler: 2 個測試
- ApplyPoisonHandler: 1 個測試
- registerBuiltinHandlers: 1 個測試
- 整合測試: 2 個測試

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `shared/expansions/core/effectTypes.js` | 效果類型常數 |
| `shared/expansions/core/effectSystem.js` | Effect 類別、EffectHandler 介面 |
| `shared/expansions/core/effectQueue.js` | EffectQueue 佇列 |
| `shared/expansions/core/handlers/builtinEffectHandlers.js` | 9 個內建處理器 |
| `shared/expansions/core/index.js` | 模組入口 |
| `shared/expansions/core/__tests__/effectSystem.test.js` | 單元測試 |

## 驗收標準達成

- [x] `Effect` 類別可建立、取消、解析效果
- [x] `EffectQueue` 正確排序和處理效果
- [x] 效果處理器可註冊和執行
- [x] 內建處理器（進食、脂肪、攻擊阻擋、死亡等）正常運作
- [x] 事件系統正確觸發
- [x] 所有單元測試通過（36 個）

## 備註

- 效果系統是擴充包的核心基礎設施
- 新擴充包可透過 `registerHandler()` 註冊自訂處理器
- 優先級系統確保效果按正確順序解析
- 事件系統便於監聽效果生命週期
- 整合到 gameLogic.js 將在後續工單完成
