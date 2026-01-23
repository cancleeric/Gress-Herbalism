# 報告書 0037

**工作單編號：** 0037

**完成日期：** 2026-01-23

## 完成內容摘要

修復房間加入與房間列表顯示問題。

### 問題一修復：以房間 ID 加入房間失敗

**問題原因：** Lobby 組件直接使用 `getGameState` 檢查房間狀態，但邏輯不完整，且未正確處理加入房間的流程。

**修復方式：**
1. 在 `gameService.js` 新增 `joinRoom` 函數，統一處理加入房間邏輯
2. 更新 Lobby 組件使用 `joinRoom` 函數
3. `joinRoom` 函數包含完整驗證：
   - 房間是否存在
   - 房間是否已滿
   - 遊戲是否已開始
   - 玩家是否已在房間中

### 問題二修復：可用房間列表不更新

**問題原因：** 創建房間後沒有機制通知其他客戶端更新房間列表。

**修復方式：**
1. 新增 `roomListeners` 集合儲存監聽器
2. 新增 `subscribeToRoomList` 函數供組件訂閱房間列表變更
3. 新增 `getAvailableRooms` 函數取得可用房間列表
4. 新增 `notifyRoomListChange` 函數通知所有監聽器
5. 在 `createGameRoom` 和 `joinRoom` 中調用通知函數
6. Lobby 組件使用 `useEffect` 訂閱房間列表更新

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `frontend/src/services/gameService.js` | 新增房間列表管理函數（subscribeToRoomList, getAvailableRooms, joinRoom, notifyRoomListChange） |
| `frontend/src/components/Lobby/Lobby.js` | 使用新的房間管理函數，訂閱房間列表更新 |
| `frontend/src/components/Lobby/Lobby.test.js` | 更新測試以使用新的 mock 函數 |

### 新增 API

```javascript
// 訂閱房間列表變更
subscribeToRoomList(listener: Function): Function

// 取得可用房間列表
getAvailableRooms(): Array<{id, name, playerCount, maxPlayers}>

// 加入房間
joinRoom(gameId: string, player: Object): {success, gameState, message}
```

### 錯誤訊息

| 情況 | 錯誤訊息 |
|------|----------|
| 房間不存在 | 房間不存在，請確認房間ID是否正確 |
| 房間已滿 | 房間已滿，無法加入 |
| 遊戲已開始 | 遊戲已開始，無法加入 |
| 玩家已在房間 | 玩家已在房間中 |

## 單元測試

**Tests: 476 passed**（全部測試通過）

Lobby 組件測試：32 passed

## 驗收標準完成狀態

- [x] 輸入有效房間 ID 可以成功加入房間
- [x] 輸入無效房間 ID 顯示適當錯誤訊息
- [x] 創建房間後，「可用房間」列表立即顯示新房間
- [x] 其他玩家的「可用房間」列表能即時同步更新（透過訂閱機制）
