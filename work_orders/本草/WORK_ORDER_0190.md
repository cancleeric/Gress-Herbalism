# 工作單 0190

## 編號
0190

## 日期
2026-01-28

## 工作單標題
單元測試：socketService 重連相關函數

## 工單主旨
測試 `frontend/src/services/socketService.js` 中重連相關函數的正確性

## 內容

### 測試範圍
- `attemptReconnect(roomId, playerId, playerName)` — 發送重連請求
- `emitPlayerRefreshing(gameId, playerId)` — 通知後端玩家正在重整
- `onReconnected(callback)` — 監聽重連成功
- `onReconnectFailed(callback)` — 監聽重連失敗
- Socket.io `reconnect` 事件自動重連邏輯（第 57-79 行）

### 測試項目

#### TC-0190-01：attemptReconnect 參數傳遞
- 驗證 emit 的事件名稱為 `'reconnect'`
- 驗證傳遞的參數結構 `{ roomId, playerId, playerName }`

#### TC-0190-02：emitPlayerRefreshing 條件檢查
- 驗證只在 socket 存在且已連線時才發送
- 驗證事件名稱為 `'playerRefreshing'`

#### TC-0190-03：Socket.io 自動重連邏輯
- 驗證 `reconnect` 事件觸發時的房間資訊讀取邏輯
- 驗證 `getCurrentRoom()` 與 legacy keys 的 fallback 機制
- 驗證三個條件（roomId, playerId, playerName）都存在才發送重連

#### TC-0190-04：safeOn 包裝函數
- 驗證事件監聽的容錯機制
- 驗證返回的取消訂閱函數

#### TC-0190-05：legacy key 相容性
- 驗證 `lastRoomId`, `lastPlayerId`, `lastPlayerName` 的讀寫一致性
- 驗證 leaveRoom 時是否完整清除所有相關 key

### 測試方式
程式碼審查 + 靜態分析（不修改程式碼）

### 驗收標準
- 完成所有測試項目的驗證
- 記錄所有發現的問題
