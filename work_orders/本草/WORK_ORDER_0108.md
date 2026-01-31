# 工作單 0108

**日期：** 2026-01-25

**工作單標題：** 心跳檢測機制強化

**工單主旨：** 功能增強 - 定期驗證 Socket 連線有效性

**計畫書：** [Socket 連線同步修復計畫書](../docs/SOCKET_SYNC_FIX_PLAN.md)

**優先級：** 中

---

## 功能描述

強化心跳機制，定期驗證遊戲中玩家的 socket 連線狀態，自動清理無效連線。

## 修改內容

### 1. 新增 validateSocketConnections 函數

**檔案：** `backend/server.js`

```javascript
/**
 * 驗證遊戲房間中所有玩家的 socket 連線狀態
 * @param {string} gameId - 遊戲房間 ID
 */
function validateSocketConnections(gameId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  let hasInvalidSocket = false;

  gameState.players.forEach(player => {
    if (player.socketId && !player.isDisconnected) {
      const socket = io.sockets.sockets.get(player.socketId);
      if (!socket || !socket.connected) {
        console.warn(`[心跳] 玩家 ${player.name} 的 socket ${player.socketId} 已失效`);
        player.socketId = null;
        hasInvalidSocket = true;
      }
    }
  });

  if (hasInvalidSocket) {
    console.log(`[心跳] 房間 ${gameId} 有無效 socket，已清理`);
  }
}
```

### 2. 定期執行心跳檢測

```javascript
// 每 30 秒檢測一次所有房間的連線狀態
setInterval(() => {
  gameRooms.forEach((_, gameId) => {
    validateSocketConnections(gameId);
  });
}, 30000);
```

### 3. 關鍵操作前驗證

在發送重要事件前驗證連線：

```javascript
// 在發送 postQuestionPhase 前
const playerSocket = findSocketByPlayerId(gameId, result.currentPlayerId);
if (!playerSocket) {
  console.error(`[問牌] 無法發送 postQuestionPhase: 玩家 socket 無效`);
  // 嘗試通過 gameState 廣播通知
  broadcastGameState(gameId);
  return;
}
```

## 測試項目

- [ ] 心跳檢測正確識別無效 socket
- [ ] 無效 socket 被正確清理
- [ ] 不影響正常連線的玩家

## 驗收標準

- [ ] 心跳機制正確運作
- [ ] 無效連線被及時清理
- [ ] 日誌記錄完整
