# 工作單 0106

**日期：** 2026-01-25

**工作單標題：** 前端 Socket.io 自動重連處理

**工單主旨：** 功能增強 - Socket.io 自動重連時觸發遊戲重連邏輯

**計畫書：** [Socket 連線同步修復計畫書](../docs/SOCKET_SYNC_FIX_PLAN.md)

**優先級：** 高

---

## 問題描述

當 Socket.io 自動重連成功時，前端沒有觸發遊戲層級的重連邏輯，導致：
1. 後端的 player.socketId 沒有更新
2. 遊戲狀態可能不同步

## 修改內容

### 1. socketService.js 增強

**檔案：** `frontend/src/services/socketService.js`

**修改：** 在 socket.io 的 `reconnect` 事件中自動觸發遊戲重連

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log(`[Socket] 自動重連成功 (第 ${attemptNumber} 次嘗試)`);

  // 從 localStorage 取得上次的遊戲資訊
  const savedRoom = localStorage.getItem('lastRoomId');
  const savedPlayer = localStorage.getItem('lastPlayerId');
  const savedName = localStorage.getItem('lastPlayerName');

  if (savedRoom && savedPlayer && savedName) {
    console.log(`[Socket] 自動觸發遊戲重連: 房間 ${savedRoom}`);
    socket.emit('reconnect', {
      roomId: savedRoom,
      playerId: savedPlayer,
      playerName: savedName
    });
  }
});
```

### 2. 保存遊戲資訊

在加入房間和創建房間時保存資訊到 localStorage：

```javascript
export function createRoom(player, maxPlayers, password) {
  // ... 現有邏輯 ...

  // 保存房間資訊以便重連
  localStorage.setItem('lastPlayerId', player.id);
  localStorage.setItem('lastPlayerName', player.name);
}

export function joinRoom(gameId, player) {
  // ... 現有邏輯 ...

  // 保存房間資訊以便重連
  localStorage.setItem('lastRoomId', gameId);
  localStorage.setItem('lastPlayerId', player.id);
  localStorage.setItem('lastPlayerName', player.name);
}
```

### 3. 清除資訊

離開房間或遊戲結束時清除：

```javascript
export function leaveRoom(gameId, playerId) {
  // ... 現有邏輯 ...

  // 清除重連資訊
  localStorage.removeItem('lastRoomId');
  localStorage.removeItem('lastPlayerId');
  localStorage.removeItem('lastPlayerName');
}
```

## 測試項目

- [ ] 網路斷線後自動重連觸發遊戲重連
- [ ] localStorage 正確保存遊戲資訊
- [ ] 離開房間後清除 localStorage
- [ ] 重連後遊戲狀態正確恢復

## 驗收標準

- [ ] 自動重連機制正確實作
- [ ] localStorage 管理正確
- [ ] 重連流程無縫銜接
