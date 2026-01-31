# 工作單 0184

## 編號
0184

## 日期
2026-01-28

## 工作單標題
Bug 修復 — 統一 localStorage 重連 key 並強化自動重連

## 工單主旨
修復 socketService.js 自動重連使用錯誤的 localStorage key，統一改用 getCurrentRoom()。

## 內容

### 問題描述
socketService.js 的 `reconnect` 事件讀取 `lastRoomId` 等 key，但 Lobby.js 使用 `saveCurrentRoom()` 存入 `gress_current_room`。且 `createRoom()` 不存 `lastRoomId`，導致房主重連失敗。

### 修改檔案

#### `frontend/src/services/socketService.js`
1. import `getCurrentRoom` 和 `clearCurrentRoom` 從 localStorage.js
2. `reconnect` 事件（第 56-72 行）：改用 `getCurrentRoom()` 讀取房間資訊
3. `createRoom()` 函數（第 263-270 行）：移除分散的 localStorage 操作（由 Lobby.js 的 `saveCurrentRoom` 統一處理）
4. `joinRoom()` 函數（第 276-284 行）：同上移除分散操作
5. `leaveRoom()` 函數（第 321-329 行）：同時清除 `gress_current_room` 和舊的 `lastXxx` key

### 驗收標準
1. 自動重連時使用 `getCurrentRoom()` 正確讀取房間資訊
2. 頁面重整後可成功重連到原房間（無論是房主或加入者）
3. 離開房間時兩組 key 都被清除
