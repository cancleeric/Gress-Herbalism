# 工作單 0191

## 編號
0191

## 日期
2026-01-28

## 工作單標題
單元測試：後端 handlePlayerReconnect 函數

## 工單主旨
測試 `backend/server.js` 中 `handlePlayerReconnect` 函數的正確性（第 1304-1368 行）

## 內容

### 測試範圍
- `handlePlayerReconnect(socket, roomId, playerId, playerName)` 函數完整邏輯
- 房間存在性驗證
- 玩家存在性驗證
- 斷線計時器清除
- 玩家狀態恢復
- socketId 更新
- 重連回應事件發送
- 預測階段恢復

### 測試項目

#### TC-0191-01：房間不存在的處理
- 驗證 `gameRooms.get(roomId)` 返回 undefined 時的行為
- 驗證 emit 的 `reconnectFailed` 事件和 reason

#### TC-0191-02：玩家不在房間中的處理
- 驗證 `players.findIndex(p => p.id === playerId)` 返回 -1 時的行為
- 驗證 emit 的 `reconnectFailed` 事件和 reason

#### TC-0191-03：getClientGameState 函數存在性（CRITICAL）
- **驗證 `getClientGameState` 函數是否在 server.js 中被定義**
- 搜尋整個後端程式碼確認此函數是否存在
- 分析此 BUG 的影響範圍

#### TC-0191-04：socketId 更新邏輯
- 驗證 `player.socketId = socket.id` 更新
- 驗證 `playerSockets.set(socket.id, ...)` 更新
- 驗證 `socket.join(roomId)` 呼叫

#### TC-0191-05：斷線計時器清除
- 驗證 `disconnectTimeouts` 的 key 格式 `${roomId}:${playerId}`
- 驗證 clearTimeout 和 delete 操作

#### TC-0191-06：refreshingPlayers 清除
- 驗證重連時是否正確清除重整狀態

#### TC-0191-07：預測階段恢復
- 驗證 `postQuestionStates` 的檢查邏輯
- 驗證 `postQuestionPhase` 事件的重新發送

### 測試方式
程式碼審查 + 靜態分析（不修改程式碼）

### 驗收標準
- 完成所有測試項目的驗證
- **特別確認 TC-0191-03 的結果**
- 記錄所有發現的問題
