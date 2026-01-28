# 報告書 0190

## 工作單編號
0190

## 完成日期
2026-01-28

## 完成內容摘要
完成 `frontend/src/services/socketService.js` 重連相關函數的單元測試（程式碼審查）。

## 測試結果

### TC-0190-01：attemptReconnect 參數傳遞 — PASS
- 第 198-201 行：`s.emit('reconnect', { roomId, playerId, playerName })`
- 事件名稱 `'reconnect'` 與後端 `socket.on('reconnect', ...)` 對應 ✅
- 參數結構正確 ✅

### TC-0190-02：emitPlayerRefreshing 條件檢查 — PASS
- 第 464-469 行：
  ```javascript
  if (s && s.connected) {
    s.emit('playerRefreshing', { gameId, playerId });
  }
  ```
- 雙重條件檢查（socket 存在 + 已連線）✅
- 事件名稱 `'playerRefreshing'` 與後端對應 ✅

### TC-0190-03：Socket.io 自動重連邏輯 — PASS（附註）
- 第 57-79 行：`socket.on('reconnect', ...)` 監聽 Socket.io 自動重連成功事件
- 第 61 行：優先使用 `getCurrentRoom()` 讀取新版 key ✅
- 第 63-65 行：fallback 到 legacy keys（`lastRoomId`, `lastPlayerId`, `lastPlayerName`）✅
- 第 67-69 行：使用 `||` 合併兩組資料 ✅
- 第 71 行：三個條件都存在才發送重連 ✅

**附註**：Socket.io 的 `reconnect` 事件名稱可能與自訂事件 `'reconnect'` 衝突。Socket.io 的系統事件為 `reconnect`（在 manager 層），而自訂事件也用 `'reconnect'` 名稱 emit。但經查看，第 57 行是監聽 Socket.io manager 事件，第 73 行是 emit 自訂事件到 server，兩者不衝突。

### TC-0190-04：safeOn 包裝函數 — PASS
- 第 146-158 行：完善的容錯機制
- 呼叫 `getSocket()` 取得 socket 實例
- socket 不存在時返回空的取消訂閱函數 `() => {}` ✅
- 有 try-catch 包裝 ✅
- 正常情況返回 `() => s.off(eventName, callback)` ✅

### TC-0190-05：legacy key 相容性 — PASS（附註）

**寫入時機：**
- `createRoom`（第 275-276 行）：儲存 `lastPlayerId`, `lastPlayerName`（無 `lastRoomId`）
- `joinRoom`（第 288-290 行）：儲存 `lastRoomId`, `lastPlayerId`, `lastPlayerName`

**清除時機：**
- `leaveRoom`（第 332-336 行）：清除 `clearCurrentRoom()` + 三個 legacy keys ✅

**附註**：`createRoom` 沒有儲存 `lastRoomId`，因為 roomId 要等 `roomCreated` 事件回來才知道。而 `saveCurrentRoom` 在 Lobby.js 的 `onRoomCreated` handler（第 132-136 行）中負責儲存完整的新版 key。所以 legacy keys 中的 `lastRoomId` 在創建房間場景下會是舊值或 null。這不影響功能因為新版 key 優先。

## 發現的問題

無嚴重問題。

## 結論
socketService 重連相關函數實作正確，事件名稱與後端一致，容錯機制完善。
