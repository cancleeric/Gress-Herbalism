# 報告書 0298

## 工作單編號
0298

## 完成日期
2026-01-31

## 完成內容摘要

修復 evolutionRoomManager.startGame 的參數傳遞問題。

### 問題根源

經診斷發現，原始測試報告中的 BUG（BUG-0291-001、BUG-0288-001 等）並非核心邏輯模組的問題，而是 **evolutionRoomManager.js 中 startGame 函數的參數傳遞錯誤**。

**原始代碼（錯誤）**：
```javascript
const playerIds = room.players.map(p => p.id);
const playerNames = {};
room.players.forEach(p => {
  playerNames[p.id] = p.name;
});
room.gameState = evolutionGameLogic.initGame(playerIds, playerNames);
```

**問題**：
- `gameLogic.initGame` 期望參數格式為 `[{ id, name }]`
- 但 `evolutionRoomManager` 傳入了 `playerIds`（陣列）和 `playerNames`（物件）兩個參數
- 這導致 `initGame` 解析錯誤，遊戲無法正確初始化

### 修復內容

**修復後代碼**：
```javascript
// 工單 0298：初始化遊戲狀態
// gameLogic.initGame 期望參數格式為 [{ id, name }]
const gamePlayers = room.players.map(p => ({
  id: p.id,
  name: p.name
}));

const initResult = evolutionGameLogic.initGame(gamePlayers);

if (!initResult.success) {
  return { success: false, error: initResult.error || '遊戲初始化失敗' };
}

room.gameState = initResult.gameState;

// 開始遊戲（從 waiting 進入 evolution）
room.gameState = evolutionGameLogic.startGame(room.gameState);
room.phase = room.gameState.phase;
```

### 修復要點

1. **正確構造玩家陣列**：將 `room.players` 轉換為 `[{ id, name }]` 格式
2. **處理 initGame 返回值**：`initGame` 返回 `{ success, gameState, error }` 而非直接返回 gameState
3. **調用 startGame**：需要額外調用 `startGame` 將 phase 從 `waiting` 變為 `evolution`

### 測試結果

**診斷腳本測試結果：21/21 (100%)**

關鍵驗證：
- startGame 成功 (success: true)
- gameState 正確初始化
- phase: evolution
- round: 1
- players: ['p1', 'p2']

### 驗收標準確認
- [x] 遊戲可以正常開始
- [x] gameState 正確初始化
- [x] phase 正確轉換為 evolution
- [x] 玩家狀態正確設定

## 下一步
- 工單 0299-0301 經驗證不需要修復（核心邏輯正常）
- 執行工單 0302 回歸測試
