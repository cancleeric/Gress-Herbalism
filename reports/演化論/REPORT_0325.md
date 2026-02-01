# 完成報告 0325

## 編號
0325

## 日期
2026-02-01

## 工作單標題
實作事件發布訂閱系統

## 完成摘要

成功建立遊戲內部事件系統，實現鬆耦合的模組間通訊、性狀對遊戲事件的監聽和響應、以及遊戲狀態變化的追蹤。

## 實作內容

### 1. 遊戲事件定義 (`core/gameEvents.js`)

**事件類型 (GAME_EVENTS)**：

| 類別 | 事件 |
|------|------|
| 遊戲生命週期 | `game:created`, `game:started`, `game:ended`, `game:paused`, `game:resumed` |
| 回合與階段 | `round:start`, `round:end`, `phase:enter`, `phase:exit`, `turn:start`, `turn:end` |
| 玩家行動 | `player:action`, `player:pass`, `player:timeout`, `player:reconnect`, `player:disconnect` |
| 卡牌操作 | `card:drawn`, `card:played`, `card:discarded`, `deck:shuffled`, `deck:empty` |
| 生物相關 | `creature:created`, `creature:died`, `creature:fed`, `creature:hungry`, `creature:satisfied` |
| 性狀相關 | `trait:added`, `trait:removed`, `trait:activated`, `trait:deactivated` |
| 進食相關 | `food:pool_set`, `food:taken`, `food:exhausted`, `fat:stored`, `fat:consumed` |
| 攻擊相關 | `attack:declared`, `attack:resolved`, `attack:blocked`, `attack:succeeded`, `attack:failed` |
| 互動性狀 | `link:created`, `link:broken`, `food:shared` |
| 滅絕計分 | `extinction:start`, `extinction:end`, `score:updated`, `winner:determined` |

**EventData 工廠**：
- `base()` - 基礎事件資料
- `phase()` - 階段事件資料
- `player()` - 玩家事件資料
- `creature()` - 生物事件資料
- `attack()` - 攻擊事件資料
- `card()` - 卡牌事件資料
- `trait()` - 性狀事件資料
- `link()` - 連結事件資料

### 2. GameEventEmitter (`core/eventEmitter.js`)

**核心功能**：
- `on()` - 訂閱事件（支援優先級、過濾器）
- `once()` - 訂閱一次性事件
- `onAny()` - 訂閱所有事件（萬用字元）
- `off()` / `offAll()` - 取消訂閱
- `emit()` - 非同步發送事件
- `emitSync()` - 同步發送事件
- `pause()` / `resume()` - 暫停/恢復事件發送

**事件功能**：
- 優先級排序（數字越大越先執行）
- 事件取消（`event.cancelled = true`）
- 事件歷史記錄
- 過濾器支援

### 3. TraitEventBridge (`core/traitEventBridge.js`)

**橋接事件**：
- `CREATURE_FED` → `onFeed`
- `ATTACK_DECLARED` → `onAttackDeclared`, `onDefend`
- `ATTACK_SUCCEEDED` → `onAttackSuccess`
- `ATTACK_BLOCKED` → `onAttackBlocked`
- `PHASE_ENTER` → `onPhaseEnter`
- `PHASE_EXIT` → `onPhaseExit`
- `ROUND_START` → `onRoundStart`
- `ROUND_END` → `onRoundEnd`
- `LINK_CREATED` → `onLinkCreated`
- `LINK_BROKEN` → `onLinkBroken`
- `CREATURE_CREATED` → `onCreatureCreated`
- `CREATURE_DIED` → `onCreatureDied`
- `TRAIT_ADDED` → `onTraitAdded`
- `TRAIT_REMOVED` → `onTraitRemoved`
- `EXTINCTION_START` → `onExtinctionStart`
- `EXTINCTION_END` → `onExtinctionEnd`

**方法**：
- `initialize()` - 初始化事件監聽
- `triggerTraitEvent()` - 觸發性狀事件
- `triggerCreatureTraits()` - 直接觸發特定生物的性狀
- `cleanup()` - 清理訂閱

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       48 passed, 48 total
```

**測試覆蓋**：
- GameEventEmitter on/emit: 6 個測試
- once: 1 個測試
- off/offAll: 3 個測試
- onAny: 2 個測試
- emitSync: 1 個測試
- pause/resume: 3 個測試
- event history: 4 個測試
- event cancellation: 1 個測試
- listenerCount/eventNames/hasListeners: 5 個測試
- reset: 1 個測試
- GAME_EVENTS: 4 個測試
- EventData: 6 個測試
- TraitEventBridge: 7 個測試
- 整合測試: 1 個測試

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `shared/expansions/core/gameEvents.js` | 遊戲事件定義、EventData 工廠 |
| `shared/expansions/core/eventEmitter.js` | GameEventEmitter 類別 |
| `shared/expansions/core/traitEventBridge.js` | 性狀事件橋接器 |
| `shared/expansions/core/index.js` | 更新模組入口 |
| `shared/expansions/core/__tests__/eventEmitter.test.js` | 單元測試 |

## 驗收標準達成

- [x] `GameEventEmitter` 支援基本的 on/off/emit
- [x] 事件優先級正確排序
- [x] once 事件只觸發一次
- [x] onAny 可監聽所有事件
- [x] pause/resume 正確處理事件佇列
- [x] 事件歷史正確記錄
- [x] `TraitEventBridge` 正確橋接遊戲事件到性狀
- [x] 所有單元測試通過（48 個）

## 備註

- 事件系統是擴充包與核心遊戲溝通的橋樑
- 高優先級監聽器可取消事件傳播
- 歷史記錄便於除錯和重播功能
- 整合到 gameLogic.js 將在後續工單完成
