# 工作單 0232

## 編號
0232

## 日期
2026-01-31

## 工作單標題
建立階段邏輯模組

## 工單主旨
建立演化論遊戲的階段邏輯模組 `backend/logic/evolution/phaseLogic.js` 和遊戲主邏輯 `backend/logic/evolution/gameLogic.js`，實作四階段回合制流程

## 內容

### 任務描述

實作演化論遊戲的完整回合制流程：演化 → 食物供給 → 進食 → 滅絕與抽牌。

### 遊戲流程

```
┌─────────────┐
│  等待開始   │
└──────┬──────┘
       ▼
┌─────────────┐
│  演化階段   │ ← 玩家輪流出牌或跳過，全部跳過時結束
└──────┬──────┘
       ▼
┌─────────────┐
│ 食物供給階段│ ← 起始玩家擲骰決定食物數量
└──────┬──────┘
       ▼
┌─────────────┐
│  進食階段   │ ← 玩家輪流進食/攻擊，全部跳過或吃飽時結束
└──────┬──────┘
       ▼
┌─────────────┐
│ 滅絕與抽牌  │ ← 判定滅絕、清理、抽牌
└──────┬──────┘
       ▼
   牌庫空？
   ├─ 否 → 回到演化階段
   └─ 是 → 進入最後一回合 → 遊戲結束 → 計分
```

### phaseLogic.js 函數規格

#### startEvolutionPhase(gameState)
```javascript
/**
 * 開始演化階段
 * @param {GameState} gameState
 * @returns {GameState}
 */
function startEvolutionPhase(gameState) { }
```

#### startFoodPhase(gameState)
```javascript
/**
 * 開始食物供給階段
 * @param {GameState} gameState
 * @returns {GameState}
 */
function startFoodPhase(gameState) { }
```

#### rollDice(playerCount)
```javascript
/**
 * 擲骰決定食物數量
 * 2人: 1d6 + 2
 * 3人: 2d6
 * 4人: 2d6 + 2
 * @param {number} playerCount - 玩家數
 * @returns {{ dice: number[], total: number }}
 */
function rollDice(playerCount) { }
```

#### startFeedingPhase(gameState)
```javascript
/**
 * 開始進食階段
 * @param {GameState} gameState
 * @returns {GameState}
 */
function startFeedingPhase(gameState) { }
```

#### startExtinctionPhase(gameState)
```javascript
/**
 * 開始滅絕階段
 * 處理：滅絕判定、中毒生物死亡、食物清理、抽牌
 * @param {GameState} gameState
 * @returns {GameState}
 */
function startExtinctionPhase(gameState) { }
```

#### checkGameEnd(gameState)
```javascript
/**
 * 檢查遊戲是否結束
 * 結束條件：最後一回合的滅絕階段結束
 * @param {GameState} gameState
 * @returns {boolean}
 */
function checkGameEnd(gameState) { }
```

### gameLogic.js 函數規格

#### initGame(players)
```javascript
/**
 * 初始化遊戲
 * @param {Player[]} players - 玩家列表
 * @returns {GameState}
 */
function initGame(players) { }
```

#### processAction(gameState, playerId, action)
```javascript
/**
 * 處理玩家動作
 * @param {GameState} gameState
 * @param {string} playerId
 * @param {Action} action - { type, payload }
 * @returns {{ success: boolean, gameState: GameState, error: string }}
 */
function processAction(gameState, playerId, action) { }
```

#### getGameState(gameState, playerId)
```javascript
/**
 * 取得玩家視角的遊戲狀態
 * 隱藏其他玩家手牌
 * @param {GameState} gameState
 * @param {string} playerId
 * @returns {GameState}
 */
function getGameState(gameState, playerId) { }
```

#### validateAction(gameState, playerId, action)
```javascript
/**
 * 驗證動作合法性
 * @param {GameState} gameState
 * @param {string} playerId
 * @param {Action} action
 * @returns {{ valid: boolean, reason: string }}
 */
function validateAction(gameState, playerId, action) { }
```

#### advancePhase(gameState)
```javascript
/**
 * 推進到下一階段
 * @param {GameState} gameState
 * @returns {GameState}
 */
function advancePhase(gameState) { }
```

### 抽牌規則
- 每回合結束時，每位玩家抽牌數 = 存活生物數 + 1
- 若牌庫不足，抽取剩餘的牌，標記為最後一回合

### 前置條件
- 工單 0228 已完成（常數定義）
- 工單 0229 已完成（卡牌邏輯）
- 工單 0230 已完成（生物邏輯）
- 工單 0231 已完成（進食邏輯）

### 驗收標準
- [ ] 四階段流程正確切換
- [ ] 擲骰公式正確（各玩家數）
- [ ] 滅絕判定正確執行
- [ ] 抽牌數量正確計算
- [ ] 最後一回合標記正確
- [ ] 遊戲結束判定正確
- [ ] 單元測試覆蓋率 ≥ 80%

### 相關檔案
- `backend/logic/evolution/phaseLogic.js` — 新建
- `backend/logic/evolution/gameLogic.js` — 新建
- `backend/logic/evolution/index.js` — 新建（統一匯出）
- `backend/logic/evolution/feedingLogic.js` — 依賴
- `backend/logic/evolution/creatureLogic.js` — 依賴

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.3 節
