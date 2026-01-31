# 工作單 0231

## 編號
0231

## 日期
2026-01-31

## 工作單標題
建立進食邏輯模組

## 工單主旨
建立演化論遊戲的進食邏輯模組 `backend/logic/evolution/feedingLogic.js`，實作一般進食、肉食攻擊、腐食觸發、互動性狀連鎖等功能

## 內容

### 任務描述

實作演化論遊戲的完整進食系統，這是遊戲最複雜的核心機制之一。

### 函數規格

#### feedCreature(gameState, creatureId, foodType)
```javascript
/**
 * 餵食生物（從食物池取得食物）
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @param {string} foodType - 食物類型 ('red')
 * @returns {{ success: boolean, gameState: GameState, chainEffects: Effect[] }}
 */
function feedCreature(gameState, creatureId, foodType) { }
```

#### attackCreature(gameState, attackerId, defenderId)
```javascript
/**
 * 肉食生物發動攻擊
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} attackerId - 攻擊者 ID
 * @param {string} defenderId - 防守者 ID
 * @returns {{ success: boolean, gameState: GameState, pendingResponse: Response }}
 */
function attackCreature(gameState, attackerId, defenderId) { }
```

#### resolveAttack(gameState, attackResult)
```javascript
/**
 * 解析攻擊結果
 * 處理：斷尾、擬態、敏捷骰子結果
 * @param {GameState} gameState - 遊戲狀態
 * @param {AttackResult} attackResult - 攻擊結果
 * @returns {{ gameState: GameState, attackerFood: number, defenderDead: boolean }}
 */
function resolveAttack(gameState, attackResult) { }
```

#### triggerScavenger(gameState, deadCreatureId)
```javascript
/**
 * 觸發腐食效果
 * 當生物被肉食攻擊滅絕時，所有腐食生物獲得藍色食物
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} deadCreatureId - 死亡生物 ID
 * @returns {GameState}
 */
function triggerScavenger(gameState, deadCreatureId) { }
```

#### processCommunication(gameState, fedCreatureId)
```javascript
/**
 * 處理溝通連鎖
 * 當生物獲得紅色食物時，連結的生物也從中央獲得紅色食物
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} fedCreatureId - 被餵食的生物 ID
 * @returns {{ gameState: GameState, chainedCreatures: string[] }}
 */
function processCommunication(gameState, fedCreatureId) { }
```

#### processCooperation(gameState, fedCreatureId, foodType)
```javascript
/**
 * 處理合作連鎖
 * 當生物獲得紅/藍食物時，連結的生物獲得藍色食物
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} fedCreatureId - 被餵食的生物 ID
 * @param {string} foodType - 食物類型
 * @returns {{ gameState: GameState, chainedCreatures: string[] }}
 */
function processCooperation(gameState, fedCreatureId, foodType) { }
```

#### checkSymbiosis(gameState, creatureId)
```javascript
/**
 * 檢查共生限制
 * 被保護者只有在代表吃飽後才能進食
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} creatureId - 想進食的生物 ID
 * @returns {{ canFeed: boolean, reason: string }}
 */
function checkSymbiosis(gameState, creatureId) { }
```

#### canCreatureFeed(gameState, creatureId)
```javascript
/**
 * 檢查生物是否可進食
 * 考慮：已吃飽、冬眠、共生限制
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @returns {{ canFeed: boolean, reason: string }}
 */
function canCreatureFeed(gameState, creatureId) { }
```

### 攻擊流程
1. 驗證攻擊者是否為肉食
2. 驗證防守者是否可被攻擊（canBeAttacked）
3. 檢查防守者防禦性狀：
   - 斷尾：可棄置性狀取消攻擊，攻擊者獲得 1 藍色食物
   - 擬態：可轉移攻擊給另一隻生物
   - 敏捷：擲骰，4-6 逃脫，1-3 被攻擊成功
4. 攻擊成功：攻擊者獲得 2 藍色食物，防守者滅絕
5. 觸發腐食效果
6. 若防守者有毒液，攻擊者標記中毒（滅絕階段死亡）

### 前置條件
- 工單 0228 已完成（常數定義）
- 工單 0229 已完成（卡牌邏輯）
- 工單 0230 已完成（生物邏輯）

### 驗收標準
- [ ] 一般進食功能正確
- [ ] 肉食攻擊流程正確
- [ ] 腐食觸發正確
- [ ] 溝通連鎖正確（包含多重連鎖）
- [ ] 合作連鎖正確
- [ ] 共生限制正確
- [ ] 單元測試覆蓋率 ≥ 80%

### 相關檔案
- `backend/logic/evolution/feedingLogic.js` — 新建
- `backend/logic/evolution/creatureLogic.js` — 依賴
- `shared/constants/evolution.js` — 依賴

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.3 節
