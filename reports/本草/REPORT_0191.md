# 報告書 0191

## 工作單編號
0191

## 完成日期
2026-01-28

## 完成內容摘要
完成 `backend/server.js` 中 `handlePlayerReconnect` 函數的單元測試（程式碼審查）。

## 測試結果

### TC-0191-01：房間不存在的處理 — PASS
- 第 1305-1311 行：
  ```javascript
  const gameState = gameRooms.get(roomId);
  if (!gameState) {
    socket.emit('reconnectFailed', { reason: 'room_not_found', message: '房間已不存在' });
    return;
  }
  ```
- 驗證邏輯正確 ✅
- 錯誤訊息包含 reason 和 message ✅

### TC-0191-02：玩家不在房間中的處理 — PASS
- 第 1313-1319 行：
  ```javascript
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    socket.emit('reconnectFailed', { reason: 'player_not_found', message: '你已不在此房間中' });
    return;
  }
  ```
- 驗證邏輯正確 ✅

### TC-0191-03：getClientGameState 函數存在性 — **CRITICAL FAIL**

**搜尋結果：**
- `getClientGameState` 在 `server.js` 第 1353 行被呼叫
- **整個 `backend/` 目錄中沒有任何 `getClientGameState` 函數定義**
- 在 `reports/REPORT_0079.md` 中有出現，但那是報告書而非程式碼

**影響分析：**
- 當玩家重連時，第 1350-1354 行的 `socket.emit('reconnected', ...)` 會觸發 `ReferenceError: getClientGameState is not defined`
- 此錯誤發生在 socket event handler 中，Node.js 會捕獲但不會崩潰
- **前端永遠收不到 `reconnected` 事件**
- 前端的 `onReconnected` handler 永遠不會被觸發
- 玩家看到的現象：重整後卡在大廳，無法回到遊戲

**對比正常運作的事件：**
| 事件 | 行號 | gameState 傳遞方式 | 結果 |
|------|------|-------------------|------|
| `roomCreated` | 531 | `gameState: roomState`（直接傳遞） | 正常 ✅ |
| `joinedRoom` | 591 | `gameState`（直接傳遞） | 正常 ✅ |
| `gameState` (broadcast) | 457 | `gameState`（直接傳遞） | 正常 ✅ |
| `reconnected` | 1353 | `getClientGameState(gameState, playerId)` | **錯誤 ❌** |

**此 BUG 是玩家無法重連的直接原因。**

### TC-0191-04：socketId 更新邏輯 — PASS
- 第 1339-1340 行：正確記錄舊 socketId 並更新為新的 `socket.id` ✅
- 第 1344 行：`playerSockets.set(socket.id, { gameId: roomId, playerId })` 建立新映射 ✅
- 第 1345 行：`socket.join(roomId)` 加入房間 ✅

### TC-0191-05：斷線計時器清除 — PASS
- 第 1324-1328 行：
  ```javascript
  const timeoutKey = `${roomId}:${playerId}`;
  if (disconnectTimeouts.has(timeoutKey)) {
    clearTimeout(disconnectTimeouts.get(timeoutKey));
    disconnectTimeouts.delete(timeoutKey);
  }
  ```
- key 格式與 `handlePlayerDisconnect` 中的 `timeoutKey`（第 1244 行）一致 ✅

### TC-0191-06：refreshingPlayers 清除 — PASS
- 第 1331 行：`refreshingPlayers.delete(timeoutKey)` ✅
- key 格式與 `playerRefreshing` 事件中的 `refreshKey`（第 1118 行）一致 ✅

### TC-0191-07：預測階段恢復 — CONDITIONAL PASS
- 第 1357-1364 行：檢查 `postQuestionStates` 是否存在此玩家的預測狀態
- 如果存在，重新發送 `postQuestionPhase` 事件 ✅
- **但由於 TC-0191-03 的 BUG，此段程式碼永遠無法執行到**（因為前面的 `socket.emit('reconnected', ...)` 會拋出錯誤）

## 發現的問題

### 問題 1（Critical）：getClientGameState 函數未定義
- 嚴重度：Critical
- 位置：`backend/server.js` 第 1353 行
- 影響：所有重連嘗試都會失敗
- 修復建議：將 `getClientGameState(gameState, playerId)` 改為直接傳遞 `gameState`（與 `roomCreated`、`joinedRoom` 事件一致）

### 問題 2（Medium）：舊 socketId 映射未清除
- 嚴重度：Medium
- 位置：`handlePlayerReconnect` 函數中
- 描述：重連時更新了 `player.socketId` 和 `playerSockets.set(socket.id, ...)`，但未刪除舊的 `playerSockets` 映射（`playerSockets.delete(oldSocketId)`）。舊映射在 `handlePlayerDisconnect` 的 `playerSockets.delete(socket.id)`（第 1241 行）中已被清除，所以實際影響有限。
- 影響：`playerSockets` Map 中可能短暫存在孤立記錄

## 結論
`handlePlayerReconnect` 的驗證、計時器清除、狀態恢復邏輯正確，但 **`getClientGameState` 函數未定義是 Critical BUG**，直接導致重連功能完全失效。
