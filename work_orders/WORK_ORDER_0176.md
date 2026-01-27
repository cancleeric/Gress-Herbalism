# 工作單 0176

**編號**：0176

**日期**：2026-01-27

**工作單標題**：後端 — 好友線上狀態自動更新

**工單主旨**：修復好友線上狀態從未更新的問題，整合 presenceService 到 Socket.io 事件

---

## 內容

### 背景

`presenceService` 已實作 `setOnline`、`setOffline`、`setInGame` 函數，但 Socket.io 事件中從未呼叫這些函數，導致好友列表的線上狀態永遠不會變化。

### 工作內容

#### 1. Socket.io 連線時設為上線

在 `io.on('connection')` 回調中，當玩家有 `firebaseUid` 時呼叫 `setOnline`：

```javascript
socket.on('setPresence', async ({ firebaseUid }) => {
  if (firebaseUid) {
    const playerId = await getPlayerIdByFirebaseUid(firebaseUid);
    if (playerId) {
      await presenceService.setOnline(playerId);
      socket.firebasePlayerId = playerId;  // 保存以便斷線時使用
    }
  }
});
```

#### 2. Socket.io 斷線時設為離線

```javascript
socket.on('disconnect', async () => {
  if (socket.firebasePlayerId) {
    await presenceService.setOffline(socket.firebasePlayerId);
  }
});
```

#### 3. 加入遊戲房間時設為遊戲中

在 `joinRoom` / `createRoom` 成功後：

```javascript
if (socket.firebasePlayerId) {
  await presenceService.setInGame(socket.firebasePlayerId, gameId);
}
```

#### 4. 離開房間時恢復為上線

在 `leaveRoom` 時：

```javascript
if (socket.firebasePlayerId) {
  await presenceService.setOnline(socket.firebasePlayerId);
}
```

#### 5. 前端發送 setPresence 事件

登入後在 Socket 連線時發送 `firebaseUid`，讓後端能追蹤線上狀態。

### 驗收標準

| 標準 | 說明 |
|------|------|
| 連線時上線 | 登入後 user_presence 狀態為 online |
| 斷線時離線 | 關閉頁面後狀態變為 offline |
| 進遊戲時遊戲中 | 加入房間後狀態為 in_game |
| 離開房間恢復上線 | 離開房間後狀態回到 online |
| 既有後端測試通過 | 190/190 |

---

**相關計畫書**：`docs/TEST_PLAN_PROFILE_FRIENDS.md`

**相關檔案**：
- `backend/server.js`
- `backend/services/presenceService.js`
- `frontend/src/services/socketService.js`
- `frontend/src/firebase/AuthContext.js`（或適當位置發送 setPresence）
