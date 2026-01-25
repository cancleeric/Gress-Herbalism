# Socket 連線同步修復計畫書

**專案名稱：** Gress 推理桌遊 - Socket 連線同步修復
**日期：** 2026-01-25
**版本：** 1.0
**狀態：** 待執行

---

## 一、問題描述

### 1.1 現象
玩家問牌完成後，預測選項未顯示，遊戲直接跳到下一位玩家。

### 1.2 根本原因

**核心 Bug：重連時未更新 `player.socketId`**

```javascript
// backend/server.js - handlePlayerReconnect (line 1099-1154)
function handlePlayerReconnect(socket, roomId, playerId, playerName) {
  // ...

  // ✅ 有更新 playerSockets Map
  playerSockets.set(socket.id, { gameId: roomId, playerId });

  // ❌ 沒有更新 player.socketId！
  // player.socketId = socket.id;  // 這行缺失！

  // ...
}
```

**導致的問題：**

```javascript
// backend/server.js - findSocketByPlayerId (line 354-362)
function findSocketByPlayerId(gameId, playerId) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || !player.socketId) return null;

  // ❌ 使用舊的 socketId，找不到新的 socket
  return io.sockets.sockets.get(player.socketId);
}
```

### 1.3 問題發生情境

| 情境 | 說明 | 影響 |
|------|------|------|
| 瀏覽器重新整理 | 建立新 socket，但 player.socketId 未更新 | 嚴重 |
| 網路斷線重連 | socket.io 自動重連，socketId 改變 | 嚴重 |
| 長時間閒置後操作 | socket 可能已斷開重連 | 中等 |
| 多個分頁開啟同一遊戲 | socketId 衝突 | 中等 |

---

## 二、修復方案

### 2.1 核心修復

#### BUG-1: 重連時更新 socketId
**位置：** `backend/server.js` - `handlePlayerReconnect()`
**修復：** 重連時同步更新 `player.socketId`

```javascript
// 修復後
player.isDisconnected = false;
player.disconnectedAt = null;
player.socketId = socket.id;  // 新增這行
```

#### BUG-2: 加入房間時確保 socketId 正確
**位置：** `backend/server.js` - `joinRoom` 處理器
**修復：** 確認 socketId 正確設定

#### BUG-3: Socket.io 自動重連處理
**位置：** 前端 + 後端
**修復：** 當 socket.io 自動重連時，觸發手動 reconnect 事件

### 2.2 增強功能

#### 增強-1: 心跳檢測機制
定期確認 socket 連線有效性

#### 增強-2: 連線狀態監控
新增連線狀態追蹤和日誌

#### 增強-3: 優雅降級處理
當 socket 找不到時的備用方案

---

## 三、詳細修復內容

### 3.1 後端修復清單

| 項目 | 檔案 | 函數/位置 | 修改內容 |
|------|------|----------|----------|
| 1 | server.js | handlePlayerReconnect | 新增 `player.socketId = socket.id` |
| 2 | server.js | joinRoom handler | 確認 socketId 設定正確 |
| 3 | server.js | createRoom handler | 確認 socketId 設定正確 |
| 4 | server.js | findSocketByPlayerId | 新增 fallback 機制 |
| 5 | server.js | 新增 | validateSocketConnection 函數 |
| 6 | server.js | 新增 | 心跳機制強化 |

### 3.2 前端修復清單

| 項目 | 檔案 | 修改內容 |
|------|------|----------|
| 1 | socketService.js | socket.io reconnect 事件處理 |
| 2 | socketService.js | 新增連線狀態追蹤 |
| 3 | GameRoom.js | 連線狀態 UI 提示 |
| 4 | Lobby.js | 重連失敗處理改善 |

### 3.3 測試清單

| 項目 | 測試內容 |
|------|----------|
| 1 | 瀏覽器重新整理後問牌流程 |
| 2 | 網路斷線重連後問牌流程 |
| 3 | 長時間閒置後操作 |
| 4 | 多分頁情境處理 |
| 5 | 心跳機制驗證 |

---

## 四、程式碼修改詳情

### 4.1 handlePlayerReconnect 修復

```javascript
// backend/server.js - handlePlayerReconnect
function handlePlayerReconnect(socket, roomId, playerId, playerName) {
  // ... 現有驗證邏輯 ...

  const player = gameState.players[playerIndex];

  // 清除斷線計時器
  const timeoutKey = `${roomId}:${playerId}`;
  if (disconnectTimeouts.has(timeoutKey)) {
    clearTimeout(disconnectTimeouts.get(timeoutKey));
    disconnectTimeouts.delete(timeoutKey);
  }

  // 恢復玩家狀態
  player.isDisconnected = false;
  player.disconnectedAt = null;

  // ⭐ 新增：更新 socketId
  const oldSocketId = player.socketId;
  player.socketId = socket.id;
  console.log(`[重連] 更新 socketId: ${oldSocketId} → ${socket.id}`);

  // 更新 socket 對應
  playerSockets.set(socket.id, { gameId: roomId, playerId });
  socket.join(roomId);

  // ... 其餘邏輯 ...
}
```

### 4.2 findSocketByPlayerId 增強

```javascript
// backend/server.js - findSocketByPlayerId 增強版
function findSocketByPlayerId(gameId, playerId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return null;

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  // 優先使用 player.socketId
  if (player.socketId) {
    const socket = io.sockets.sockets.get(player.socketId);
    if (socket) return socket;

    // socketId 無效，記錄警告
    console.warn(`[Socket] 玩家 ${playerId} 的 socketId ${player.socketId} 無效`);
  }

  // Fallback: 從 playerSockets Map 反查
  for (const [socketId, info] of playerSockets.entries()) {
    if (info.gameId === gameId && info.playerId === playerId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        // 自動修復 player.socketId
        player.socketId = socketId;
        console.log(`[Socket] 自動修復玩家 ${playerId} 的 socketId`);
        return socket;
      }
    }
  }

  return null;
}
```

### 4.3 Socket.io 自動重連處理

```javascript
// frontend/src/services/socketService.js
socket.on('reconnect', (attemptNumber) => {
  console.log(`[Socket] 重連成功 (第 ${attemptNumber} 次嘗試)`);

  // 檢查是否有保存的遊戲狀態
  const savedRoom = localStorage.getItem('lastRoomId');
  const savedPlayer = localStorage.getItem('lastPlayerId');
  const savedName = localStorage.getItem('lastPlayerName');

  if (savedRoom && savedPlayer && savedName) {
    // 自動觸發重連邏輯
    socket.emit('reconnect', {
      roomId: savedRoom,
      playerId: savedPlayer,
      playerName: savedName
    });
  }
});
```

### 4.4 心跳機制強化

```javascript
// backend/server.js - 心跳檢測
function validateSocketConnections(gameId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  gameState.players.forEach(player => {
    if (player.socketId) {
      const socket = io.sockets.sockets.get(player.socketId);
      if (!socket || !socket.connected) {
        console.warn(`[心跳] 玩家 ${player.name} 的 socket 已失效`);
        player.socketId = null;
      }
    }
  });
}
```

---

## 五、執行計畫

### 階段一：核心修復（優先）
| 工單 | 標題 | 內容 |
|------|------|------|
| 0104 | 修復重連時 socketId 未更新問題 | 核心 Bug 修復 |
| 0105 | 增強 findSocketByPlayerId 容錯機制 | 新增 fallback 邏輯 |

### 階段二：前端強化
| 工單 | 標題 | 內容 |
|------|------|------|
| 0106 | 前端 Socket.io 自動重連處理 | 自動觸發 reconnect |
| 0107 | 新增連線狀態 UI 提示 | 顯示連線狀態 |

### 階段三：穩定性增強
| 工單 | 標題 | 內容 |
|------|------|------|
| 0108 | 心跳檢測機制強化 | 定期驗證連線 |
| 0109 | Socket 連線日誌增強 | 追蹤連線問題 |

### 階段四：測試驗證
| 工單 | 標題 | 內容 |
|------|------|------|
| 0110 | Socket 同步機制單元測試 | 後端測試 |
| 0111 | 重連流程整合測試 | E2E 測試 |

### 附加功能
| 工單 | 標題 | 內容 |
|------|------|------|
| 0112 | 新增遊戲版本編號顯示 | 版本管理 |

---

## 六、驗收標準

### 基本功能
- [ ] 瀏覽器重新整理後，問牌→預測流程正常
- [ ] 網路斷線重連後，遊戲狀態正確恢復
- [ ] socketId 在所有情境下保持同步

### 容錯機制
- [ ] findSocketByPlayerId 有 fallback 機制
- [ ] 連線異常時有適當的錯誤處理

### 使用者體驗
- [ ] 連線狀態有視覺提示
- [ ] 重連過程透明，使用者無感

### 測試覆蓋
- [ ] 單元測試覆蓋核心修復
- [ ] 整合測試覆蓋重連流程

---

## 七、風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| 修改影響其他功能 | 中 | 完整回歸測試 |
| 多分頁衝突 | 低 | 新增衝突檢測 |
| 舊版客戶端相容性 | 低 | 漸進式更新 |

---

## 八、相關文件

- [遊戲規則](./GAME_RULES.md)
- [預測功能計畫書](./PREDICTION_FEATURE_PLAN.md)
- [工單規則](../WORK_ORDER_RULES.md)
