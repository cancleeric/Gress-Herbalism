# 報告書 0184

## 工作單編號
0184

## 完成日期
2026-01-28

## 完成內容摘要

統一 localStorage 重連 key，修復自動重連讀取錯誤 key 導致重連失敗的問題。

### 修改檔案

#### `frontend/src/services/socketService.js`
1. 新增 import：`getCurrentRoom` 和 `clearCurrentRoom`（來自 `../utils/localStorage`）
2. `reconnect` 事件（第 56-79 行）：優先使用 `getCurrentRoom()` 讀取房間資訊，並向後相容舊的 `lastXxx` key
3. `leaveRoom()` 函數（第 328-337 行）：同時清除 `gress_current_room`（新 key）和 `lastRoomId/lastPlayerId/lastPlayerName`（舊 key）

## 遇到的問題與解決方案

### 問題：localStorage key 不一致
- **原因**：`Lobby.js` 使用 `saveCurrentRoom()` 存入 `gress_current_room` key，但 `socketService.js` 的 `reconnect` 事件讀取 `lastRoomId` 等舊 key，導致自動重連時找不到房間資訊
- **解決**：改用 `getCurrentRoom()` 統一讀取，同時保留舊 key 的向後相容

### 問題：房主重連失敗
- **原因**：`createRoom()` 未存入 `lastRoomId`，但 `Lobby.js` 的 `saveCurrentRoom` 有正確處理。自動重連只讀舊 key 導致房主無法重連
- **解決**：統一使用 `getCurrentRoom()` 後，房主和加入者都能正確重連

## 測試結果
- 前端編譯成功
- `getCurrentRoom()` 有 2 小時過期機制，避免過期房間資訊干擾

## 下一步計劃
- 無額外工作需求
