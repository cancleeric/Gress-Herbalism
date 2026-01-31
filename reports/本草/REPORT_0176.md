# 完成報告 0176

**工作單編號**：0176

**完成日期**：2026-01-27

## 完成內容摘要

修復好友線上狀態從未更新的問題，整合 presenceService 到 Socket.io 事件。

### 修改檔案

#### 1. `backend/server.js`
- **新增 `setPresence` 事件**：玩家連線時透過 firebaseUid 查詢 player_id，呼叫 `presenceService.setOnline`，並將 player_id 保存到 `socket.firebasePlayerId`
- **斷線時離線**：`disconnect` 事件中呼叫 `presenceService.setOffline`
- **建立/加入房間時遊戲中**：`createRoom` 和 `joinRoom` 成功後呼叫 `presenceService.setInGame`
- **離開房間時恢復上線**：`leaveRoom` 事件中呼叫 `presenceService.setOnline`

#### 2. `frontend/src/services/socketService.js`
- 新增 `setPresence(firebaseUid)` 函數，發送 `setPresence` 事件給後端

#### 3. `frontend/src/firebase/AuthContext.js`
- 登入同步完成後，對非匿名玩家呼叫 `initSocket()` + `setPresence(user.uid)`
- 確保後端能追蹤 Google 登入玩家的線上狀態

## 遇到的問題與解決方案

無特殊問題。

## 測試結果

| 測試項目 | 結果 |
|---------|------|
| 後端測試 | 190/190 通過 |
| 前端 Auth 測試 | 38/38 通過 |

## 下一步計劃

- 工單 0177：功能驗證測試
