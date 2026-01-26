# 工單 0148 完成報告

**完成日期：** 2026-01-27

**工單標題：** 修復房間有人退出時所有人斷線的問題

---

## 一、完成摘要

已修復房間中有玩家退出時，其他玩家也會斷線的問題。改進了離開房間的處理邏輯，並新增玩家離開通知機制。

---

## 二、修改內容

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `backend/server.js` | 修改 `handlePlayerLeave()` 邏輯、加強 `broadcastGameState()` |
| `frontend/src/services/socketService.js` | 新增 `onPlayerLeft()` |
| `frontend/src/components/GameRoom/GameRoom.js` | 訂閱玩家離開事件 |

### 具體變更

#### 後端 handlePlayerLeave
1. 調整執行順序：先離開 Socket 房間再處理狀態
2. 房間刪除後不呼叫 `broadcastGameState()`
3. 新增 `playerLeft` 事件通知剩餘玩家

```javascript
// 先離開 Socket 房間，避免收到後續廣播
socket.leave(gameId);
playerSockets.delete(socket.id);

// ...處理玩家移除/標記不活躍...

// 通知房間內剩餘玩家有人離開
io.to(gameId).emit('playerLeft', { playerId, playerName });
```

#### 後端 broadcastGameState
```javascript
function broadcastGameState(gameId) {
  const gameState = gameRooms.get(gameId);
  // 確保房間存在且有玩家時才廣播
  if (gameState && gameState.players && gameState.players.length > 0) {
    io.to(gameId).emit('gameState', gameState);
  }
}
```

#### 前端 socketService.js
```javascript
export function onPlayerLeft(callback) {
  const s = getSocket();
  s.on('playerLeft', callback);
  return () => s.off('playerLeft', callback);
}
```

---

## 三、驗收結果

- [x] 等待階段退出不影響其他玩家
- [x] 遊戲中退出不影響其他玩家
- [x] 退出玩家正確標記為不活躍
- [x] 房間列表正確更新
- [x] 其他玩家收到離開通知

---

## 四、技術說明

### 問題根源
原本的 `handlePlayerLeave` 函數在離開 Socket 房間之前就呼叫 `broadcastGameState()`，可能導致狀態不一致。此外，當房間被刪除後仍嘗試廣播遊戲狀態，可能引發錯誤。

### 修復方式
1. 調整執行順序：先執行 `socket.leave()` 確保離開的玩家不會收到後續廣播
2. 當房間空了被刪除時，提前返回只更新房間列表
3. 新增 `playerLeft` 事件讓其他玩家知道有人離開
4. 加強 `broadcastGameState` 的防護檢查

