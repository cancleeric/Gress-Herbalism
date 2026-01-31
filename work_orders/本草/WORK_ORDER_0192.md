# 工作單 0192

## 編號
0192

## 日期
2026-01-28

## 工作單標題
整合測試：前端重連流程

## 工單主旨
測試前端從頁面重整到重連完成的完整流程（Lobby 組件 + socketService + localStorage + Redux）

## 內容

### 測試範圍
跨模組整合：
- `Lobby.js`：重連觸發邏輯（第 210-235 行）
- `socketService.js`：Socket 事件收發
- `localStorage.js`：房間資訊持久化
- `gameStore.js`：Redux 狀態恢復

### 測試項目

#### TC-0192-01：重整前資料保存流程
追蹤流程：
1. 玩家在 GameRoom → 按 F5
2. `beforeunload` 事件觸發
3. `emitPlayerRefreshing()` 發送
4. 頁面卸載

驗證：
- `beforeunload` handler 是否正確讀取 `getCurrentRoom()`
- `emitPlayerRefreshing` 是否能在頁面卸載前成功發送

#### TC-0192-02：重整後重連觸發流程
追蹤流程：
1. 頁面重新載入 → Lobby 組件 mount
2. Socket 建立連線 → `isConnected = true`
3. useEffect 觸發重連檢查
4. `getCurrentRoom()` 讀取儲存的房間資訊
5. `attemptReconnect()` 發送重連請求

驗證：
- `isConnected` 狀態更新時機
- `reconnectAttempted` 防重複邏輯
- `getCurrentRoom()` 返回的資料完整性

#### TC-0192-03：重連成功後的狀態恢復
追蹤流程：
1. 後端發送 `reconnected` 事件
2. Lobby `onReconnected` handler 接收
3. dispatch `updateGameState`
4. navigate 到 `/game/${gameId}`

驗證：
- handler 存取 `gameState.players`, `gameState.maxPlayers`, `gameState.gamePhase` 是否安全
- Redux store 是否正確更新
- 導航是否正確

#### TC-0192-04：重連失敗的處理
追蹤流程：
1. 後端發送 `reconnectFailed` 事件
2. Lobby `onReconnectFailed` handler 接收
3. 清除 currentRoom
4. 顯示錯誤訊息

驗證：
- 失敗原因是否正確顯示
- localStorage 是否正確清除

#### TC-0192-05：playerId 一致性
- 驗證 Lobby.js 第 66 行新生成的 `playerId` 不會影響重連
- 驗證重連使用的是 `savedRoom.playerId`（localStorage 中的舊值）

### 測試方式
程式碼審查 + 流程追蹤（不修改程式碼）

### 驗收標準
- 完成所有流程的完整追蹤
- 標記每個流程步驟的 PASS/FAIL
- 記錄流程中斷點
