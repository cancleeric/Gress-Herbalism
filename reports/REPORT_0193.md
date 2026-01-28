# 報告書 0193

## 工作單編號
0193

## 完成日期
2026-01-28

## 完成內容摘要
完成後端斷線與重連事件鏈的整合測試（跨函數流程追蹤）。

## 測試結果

### TC-0193-01：正常重整流程（快速重連）— PARTIAL PASS

**流程追蹤：**

```
步驟 1: 前端發送 playerRefreshing 事件
  → server.js 第 1117-1126 行
  → refreshKey = `${gameId}:${playerId}`
  → refreshingPlayers.add(refreshKey)
  → 10 秒後自動 delete（第 1123-1125 行）
  結果：PASS ✅

步驟 2: Socket 斷線觸發 disconnect 事件
  → server.js 第 1129-1147 行
  → playerSockets.get(socket.id) 取得 playerInfo
  → handlePlayerDisconnect(socket, gameId, playerId)
  結果：PASS ✅

步驟 3: handlePlayerDisconnect 判斷重整狀態
  → server.js 第 1219-1220 行
  → refreshKey = `${gameId}:${playerId}`
  → isRefreshing = refreshingPlayers.has(refreshKey)
  → isRefreshing = true → timeout_duration = REFRESH_GRACE_PERIOD (10秒)
  → player.isRefreshing = true
  結果：PASS ✅

步驟 4: 標記斷線、設置計時器
  → player.isDisconnected = true
  → socket.leave(gameId)
  → playerSockets.delete(socket.id)
  → disconnectTimeouts.set(timeoutKey, timer)
  → broadcastGameState(gameId) 通知其他玩家
  結果：PASS ✅

步驟 5: 新連線 → reconnect 事件
  → server.js 第 1150-1152 行
  → handlePlayerReconnect(socket, roomId, playerId, playerName)
  結果：觸發正確 ✅

步驟 6: handlePlayerReconnect 處理
  → 清除計時器 ✅
  → 清除 refreshingPlayers ✅
  → 恢復 player 狀態 ✅
  → 更新 socketId ✅
  → socket.emit('reconnected', { gameState: getClientGameState(...) })
  結果：**FAIL ❌** — getClientGameState 未定義
```

**結論：** 步驟 1-5 全部正確，步驟 6 因 `getClientGameState` BUG 失敗。但即使修復此 BUG，此流程還依賴前端是否有成功發送 `playerRefreshing` 事件（TC-0192-01 發現 GameRoom 頁面不一定能發送）。

### TC-0193-02：重整超時流程 — PASS

**流程追蹤：**

1. 10 秒計時器到期
2. 第 1251-1294 行的 setTimeout callback 執行
3. `refreshingPlayers.delete(refreshKey)` ✅
4. 檢查玩家是否仍在房間中且 `isDisconnected === true` ✅
5. 因為 `isRefreshing === true`，進入第 1262 行分支
6. `currentState.players.splice(currentPlayerIndex, 1)` 移除玩家 ✅
7. 如果房間空了，刪除房間 ✅
8. 否則轉移房主、廣播狀態 ✅

結論：超時處理邏輯正確。

### TC-0193-03：非重整斷線流程 — PASS

**流程追蹤：**

1. 直接斷線，`isRefreshing = false`
2. `isWaitingPhase`：
   - true → 15 秒超時 ✅
   - false → 60 秒超時 ✅
3. 超時後處理：
   - 等待階段：移除玩家 ✅
   - 遊戲中：標記 `isActive = false`，`isDisconnected = false` ✅

### TC-0193-04：broadcastGameState 與重連的配合 — PASS（附註）

- `handlePlayerDisconnect` 末尾呼叫 `broadcastGameState(gameId)`（第 1298 行）✅
- `handlePlayerReconnect` 末尾呼叫 `broadcastGameState(roomId)`（第 1367 行）✅
- `broadcastGameState` 使用 `io.to(gameId).emit('gameState', gameState)`（第 457 行）✅

**附註：** `broadcastGameState` 直接發送完整 `gameState`，不使用 `getClientGameState`。所以重連後的廣播可以正常到達。但因為 `reconnected` 事件在前面失敗，前端可能不在正確的頁面上接收廣播。

### TC-0193-05：playerSockets Map 一致性 — PASS

**斷線時：**
- 第 1241 行：`playerSockets.delete(socket.id)` — 刪除舊映射 ✅

**重連時：**
- 第 1344 行：`playerSockets.set(socket.id, { gameId: roomId, playerId })` — 建立新映射 ✅
- 舊 socketId 的映射已在斷線時被清除，不會有孤立記錄

## 發現的問題

### 問題 1（Critical）：getClientGameState 中斷重連事件鏈
- 重連流程在最後一步失敗
- 前面所有正確的處理（清計時器、更新 socketId、恢復狀態）都白費

### 問題 2（Medium）：重連後 broadcastGameState 的接收問題
- 即使 `broadcastGameState` 在重連後被呼叫
- 新 socket 已 join 房間，應該能收到廣播
- 但前端 GameRoom 需要有正確的事件監聽才能處理

## 結論
後端斷線與重連的事件鏈邏輯基本正確（計時器管理、狀態標記、映射維護）。唯一的中斷點是 `getClientGameState` BUG。
