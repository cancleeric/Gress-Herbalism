# 完成報告 0327

## 編號
0327

## 日期
2026-02-01

## 工作單標題
重構遊戲初始化（支援擴充包選擇）

## 完成摘要

成功實作遊戲配置類別和遊戲初始化器，支援擴充包選擇、配置驗證、牌庫建立、發牌和事件系統初始化。

## 實作內容

### 1. 遊戲配置類別 (`gameConfig.js`)

**DEFAULT_GAME_CONFIG**：

| 類別 | 設定項 | 預設值 |
|------|--------|--------|
| expansions | 擴充包列表 | `['base']` |
| variants.hiddenCards | 隱藏對手手牌數量 | `false` |
| variants.fastMode | 快速模式 | `false` |
| variants.friendlyFire | 允許攻擊自己的生物 | `true` |
| variants.simultaneousFeed | 同時進食 | `false` |
| timeouts.evolutionPhase | 演化階段時限 | 120000ms |
| timeouts.feedingPhase | 進食階段時限 | 60000ms |
| timeouts.turnTimeout | 單次行動時限 | 30000ms |
| timeouts.inactivityTimeout | 掛機踢出時限 | 180000ms |
| settings.shufflePlayerOrder | 隨機玩家順序 | `true` |
| settings.autoPass | 無可用行動時自動跳過 | `true` |
| settings.showFoodPool | 顯示食物池數值 | `true` |

**GameConfig 類別方法**：

| 方法 | 說明 |
|------|------|
| `constructor(options)` | 合併預設配置與自訂選項 |
| `validate()` | 異步驗證配置（檢查擴充包、時間設定） |
| `getPlayerRange()` | 根據擴充包計算玩家數範圍 |
| `getInitialHandSize(playerCount)` | 計算初始發牌數 |
| `toJSON()` | 序列化為 JSON |
| `fromJSON(json)` | 從 JSON 還原 |

### 2. 遊戲狀態工廠 (`GameStateFactory`)

**createEmpty(gameId, config)** 建立的遊戲狀態結構：

```javascript
{
  id, config, status: 'waiting',
  round: 0, currentPhase: null,
  currentPlayerIndex: 0, turnOrder: [],
  players: {}, deck: [], discardPile: [],
  foodPool: 0, lastFoodRoll: null,
  createdAt, startedAt: null, endedAt: null,
  winner: null, scores: {},
  eventEmitter: null, effectQueue: null
}
```

### 3. 遊戲初始化器 (`GameInitializer`)

| 方法 | 說明 |
|------|------|
| `initialize(gameId, players, configOptions)` | 完整初始化遊戲 |
| `startGame(gameState)` | 開始遊戲（狀態 ready → playing） |
| `resetRegistry()` | 重置擴充包註冊表 |

**初始化流程**：
1. 建立並驗證配置
2. 驗證玩家數（2-4人）
3. 載入並啟用擴充包
4. 建立空白遊戲狀態
5. 初始化玩家物件
6. 建立牌庫（含洗牌、instanceId）
7. 初始化事件系統
8. 初始化效果系統
9. 發放初始手牌
10. 設定回合順序
11. 更新狀態為 ready

### 4. 擴充包載入修復

**問題發現**：
- `shared/expansions/base/index.js` 中的 `require('./cards')` 解析到 `cards.js` 而非 `cards/index.js`
- 導致 `BASE_CARDS` 為 undefined，牌庫無法建立

**修復方式**：
- 修改 `require('./cards')` 為 `require('./cards/index')`
- 在 `shared/expansions/index.js` 預先註冊 base 擴充包到 expansionLoader

### 5. 常數更新

在 `shared/constants/evolution.js` 新增：

```javascript
const GAME_STATUS = { WAITING, READY, PLAYING, PAUSED, FINISHED, ABANDONED };
const DEFAULT_PLAYER_RANGE = { MIN: 2, MAX: 4 };
const AVAILABLE_EXPANSIONS = [{ id: 'base', name: '基礎版', required: true }];
```

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
```

**測試覆蓋**：
- GameConfig.constructor: 3 個測試
- GameConfig.validate: 4 個測試
- GameConfig.getPlayerRange: 1 個測試
- GameConfig.getInitialHandSize: 2 個測試
- GameConfig.toJSON/fromJSON: 1 個測試
- GameStateFactory.createEmpty: 2 個測試
- GameInitializer.initialize: 10 個測試
- GameInitializer.startGame: 3 個測試
- shuffled deck: 1 個測試
- 3-4 players: 2 個測試

**相關測試**：
```
shared/expansions: 382 passed
```

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `backend/logic/evolution/gameConfig.js` | 遊戲配置類別 |
| `backend/logic/evolution/gameInitializer.js` | 遊戲初始化器 |
| `backend/logic/evolution/__tests__/gameInitializer.test.js` | 單元測試 |
| `shared/expansions/index.js` | 更新：預先註冊 base 擴充包 |
| `shared/expansions/base/index.js` | 修復：正確的 cards 路徑 |
| `shared/expansions/base/__tests__/traits.test.js` | 更新：正確的卡牌數量 |
| `shared/constants/evolution.js` | 更新：新增常數 |

## 驗收標準達成

- [x] `GameConfig` 正確處理配置選項
- [x] 配置驗證正常運作（base 必須、timeout 驗證）
- [x] `GameInitializer` 正確初始化遊戲狀態
- [x] 玩家數驗證正常（2-4人限制）
- [x] 牌庫正確建立並洗牌
- [x] 初始手牌正確發放（6張或4張快速模式）
- [x] 回合順序正確設定（可隨機）
- [x] 事件系統正確初始化
- [x] 效果系統正確初始化
- [x] 所有單元測試通過（29 個 + 382 個相關測試）

## 備註

- 修復了 base 擴充包的卡牌載入問題
- 預設實例 `gameInitializer` 使用全域註冊表 `globalRegistry`
- 支援快速模式（發 4 張牌）和一般模式（發 6 張牌）
- 測試中使用 `resetRegistry()` 確保每個測試獨立
- 事件系統在初始化時即發送 GAME_CREATED 事件
- 房間處理器整合將在後續工單完成
