# 工單報告 0345：Evolution Store 狀態管理

## 基本資訊

- **工單編號**：0345
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. gameSlice.js - 遊戲狀態 Slice

**State 結構**：
- 遊戲基本資訊（gameId, status, round, currentPhase）
- 回合順序（turnOrder, currentPlayerIndex）
- 食物池（foodPool, lastFoodRoll, isRolling）
- 牌庫（deckCount, discardCount）
- 遊戲配置（config, expansions, variants）
- 時間戳記（createdAt, startedAt, endedAt）
- 遊戲結果（winner, scores）
- 載入狀態（loading, error）
- 行動日誌（actionLog）

**Actions**：
- `setGameState` - 設定完整遊戲狀態
- `setPhase/setRound/setCurrentPlayer` - 更新階段/回合/玩家
- `setFoodPool/setIsRolling` - 食物池控制
- `setGameEnd` - 遊戲結束處理
- `addActionLog/clearActionLog` - 日誌管理
- `joinGame` (async thunk) - 加入遊戲

### 2. playerSlice.js - 玩家狀態 Slice

**State 結構**：
- 自己的 ID（myPlayerId）
- 所有玩家（players）
- 選擇狀態（selectedCreatureId, selectedCardId, selectedCardSide）
- 攻擊目標（attackTarget）
- 待處理互動（pendingResponse）

**Actions**：
- `setPlayers/updatePlayer` - 玩家管理
- `setHand/addCardsToHand/removeCardFromHand` - 手牌操作
- `setCreatures/addCreature/removeCreature/updateCreature` - 生物操作
- `selectCreature/selectCard/clearSelection` - 選擇操作
- `setAttackTarget` - 攻擊目標
- `setPendingResponse/clearPendingResponse` - 待處理互動

### 3. selectors.js - 優化選擇器

**基礎選擇器**：
- 遊戲狀態：gameId, status, round, phase, foodPool 等
- 玩家狀態：myPlayerId, players, selections 等

**衍生選擇器（使用 createSelector）**：
- `selectCurrentPlayerId` - 當前玩家 ID
- `selectIsMyTurn` - 是否輪到我
- `selectMyPlayer/selectMyHand/selectMyCreatures` - 我的資料
- `selectOpponents` - 對手列表
- `selectAllCreatures` - 所有生物（含 ownerId）
- `selectSelectedCard/selectSelectedCreature` - 完整選擇資料
- `selectIsGameActive/selectIsGameFinished` - 遊戲狀態判斷

---

## 測試結果

```
Test Suites: 3 passed, 3 total
Tests:       84 passed, 84 total
Snapshots:   0 total
Time:        2.422 s

覆蓋率：
- gameSlice.js: 94.44%
- playerSlice.js: 100%
- selectors.js: 100%
- 整體: 98.12%
```

### 測試涵蓋範圍

**gameSlice.test.js (25 tests)**：
- 所有 reducers 測試
- joinGame async thunk 三種狀態
- 邊界情況處理

**playerSlice.test.js (23 tests)**：
- 玩家管理操作
- 手牌/生物 CRUD
- 選擇操作
- 待處理互動

**selectors.test.js (36 tests)**：
- 基礎選擇器
- 衍生選擇器
- 邊界情況（undefined state, null player）

---

## 新增的檔案

### 模組檔案
- `frontend/src/store/evolution/gameSlice.js`
- `frontend/src/store/evolution/playerSlice.js`
- `frontend/src/store/evolution/selectors.js`

### 測試檔案
- `frontend/src/store/evolution/__tests__/gameSlice.test.js`
- `frontend/src/store/evolution/__tests__/playerSlice.test.js`
- `frontend/src/store/evolution/__tests__/selectors.test.js`

### 報告
- `reports/演化論/REPORT_0345.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| Store 結構清晰模組化 | ✅ |
| Selector 效能優化 | ✅ |
| 狀態更新正確 | ✅ |
| 與 Socket 事件整合 | ✅ |
| TypeScript 型別支援 | ⏳ |
| DevTools 可用 | ✅ |
| 測試覆蓋完整 | ✅ |

---

## 技術決策

### 保留現有 evolutionStore.js

為保持向後兼容，新模組與現有 evolutionStore.js 並存。可漸進式遷移使用新 slice。

### createSelector 使用

衍生選擇器使用 createSelector，避免不必要的重新計算，提升效能。

### 邊界情況處理

所有選擇器都處理 undefined state，返回合理的預設值（空陣列、null 等）。

---

## 下一步計劃

工單 0345 完成，繼續執行：
- 工單 0346：響應式布局

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
