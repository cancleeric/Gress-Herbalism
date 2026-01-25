# 工單完成報告 0079

**日期：** 2026-01-25

**工作單標題：** 重新整理後應能重新連線回房間

**工單主旨：** BUG/功能改善 - 支援玩家重新整理後自動重連房間

**分類：** BUG

---

## 實作內容

### 1. 前端 - localStorage 儲存（localStorage.js）

新增房間資訊儲存功能：

```javascript
// 儲存當前房間資訊（用於重連）
export function saveCurrentRoom(roomInfo) {
  const data = { ...roomInfo, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(data));
}

// 取得儲存的房間資訊（5 分鐘內有效）
export function getCurrentRoom() {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM);
  if (!data) return null;

  const roomInfo = JSON.parse(data);
  const EXPIRY_TIME = 5 * 60 * 1000;
  if (Date.now() - roomInfo.timestamp > EXPIRY_TIME) {
    clearCurrentRoom();
    return null;
  }
  return roomInfo;
}

// 清除房間資訊
export function clearCurrentRoom() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM);
}
```

### 2. 前端 - Socket 服務（socketService.js）

新增重連相關 socket 函數：

```javascript
// 嘗試重新連線到房間
export function attemptReconnect(roomId, playerId, playerName) {
  const s = getSocket();
  s.emit('reconnect', { roomId, playerId, playerName });
}

// 監聽重連成功
export function onReconnected(callback) { ... }

// 監聽重連失敗
export function onReconnectFailed(callback) { ... }
```

### 3. 前端 - 大廳組件（Lobby.js）

- 加入房間時儲存房間資訊
- 頁面載入時檢查並嘗試重連
- 重連中顯示 loading 覆蓋層
- 重連失敗顯示錯誤訊息

```javascript
// 嘗試重連
useEffect(() => {
  if (isConnected && !reconnectAttempted) {
    setReconnectAttempted(true);
    const savedRoom = getCurrentRoom();
    if (savedRoom && savedRoom.roomId && savedRoom.playerId) {
      setIsReconnecting(true);
      attemptReconnect(savedRoom.roomId, savedRoom.playerId, savedRoom.playerName);
    }
  }
}, [isConnected, reconnectAttempted]);
```

### 4. 前端 - 遊戲房間組件（GameRoom.js）

離開房間時清除儲存的房間資訊：

```javascript
const handleLeaveRoom = () => {
  // ...
  clearCurrentRoom(); // 正常離開不需要重連
  // ...
};
```

### 5. 前端 - 玩家狀態顯示（GameStatus.js）

新增斷線狀態顯示：

```jsx
<span className={`player-status ${player.isDisconnected ? 'disconnected' : 'active'}`}>
  {player.isDisconnected ? '斷線中' : '活躍'}
</span>
```

### 6. 後端 - 斷線處理（server.js）

新增斷線保留機制：

```javascript
// 斷線時標記為斷線狀態，60 秒後才移除
function handlePlayerDisconnect(socket, gameId, playerId) {
  // 遊戲進行中，標記為斷線狀態但保留位置
  player.isDisconnected = true;
  player.disconnectedAt = Date.now();

  // 設定計時器，60 秒後若未重連則移除
  const timeout = setTimeout(() => {
    if (player.isDisconnected) {
      player.isActive = false;
      player.isDisconnected = false;
      broadcastGameState(gameId);
    }
  }, DISCONNECT_TIMEOUT);
}
```

### 7. 後端 - 重連處理（server.js）

新增重連事件處理：

```javascript
socket.on('reconnect', ({ roomId, playerId, playerName }) => {
  handlePlayerReconnect(socket, roomId, playerId, playerName);
});

function handlePlayerReconnect(socket, roomId, playerId, playerName) {
  // 驗證房間和玩家
  // 清除斷線計時器
  // 恢復玩家狀態
  // 發送重連成功事件
  socket.emit('reconnected', {
    gameId: roomId,
    playerId: playerId,
    gameState: getClientGameState(gameState, playerId)
  });
}
```

## 新增測試

新增 4 個測試案例：

1. **有儲存的房間資訊時應嘗試重連** - 驗證自動重連邏輯
2. **重連成功時應導航到遊戲頁面** - 驗證重連成功處理
3. **重連失敗時應顯示錯誤訊息** - 驗證重連失敗處理
4. **房間資訊過期時不應嘗試重連** - 驗證 5 分鐘過期機制

## 重連流程

```
頁面載入
    │
    ▼
檢查 localStorage 是否有房間資訊
    │
    ├─ 有且未過期 → 顯示「正在重新連線...」
    │       │
    │       ▼
    │   發送 reconnect 事件
    │       │
    │       ├─ 成功 → 導航到遊戲頁面
    │       │
    │       └─ 失敗 → 清除資訊，顯示錯誤
    │
    └─ 無或已過期 → 正常顯示大廳
```

## 驗收項目

- [x] 重新整理後自動嘗試重新連線
- [x] 重連成功後恢復遊戲狀態
- [x] 重連成功後可繼續遊戲
- [x] 房間不存在時顯示適當提示
- [x] 離開房間時清除保存的資訊
- [x] 重連等待期間，其他玩家看到該玩家為「斷線中」狀態

## 測試結果

所有測試通過：780 個測試（新增 4 個）

---

**狀態：** ✅ 完成
