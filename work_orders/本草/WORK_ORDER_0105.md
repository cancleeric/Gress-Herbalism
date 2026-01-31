# 工作單 0105

**日期：** 2026-01-25

**工作單標題：** 增強 findSocketByPlayerId 容錯機制

**工單主旨：** 功能增強 - 新增 socket 查找的 fallback 邏輯

**計畫書：** [Socket 連線同步修復計畫書](../docs/SOCKET_SYNC_FIX_PLAN.md)

**優先級：** 高

---

## 問題描述

當 `player.socketId` 無效時，目前 `findSocketByPlayerId` 直接返回 null，沒有備用方案。

## 修改內容

### findSocketByPlayerId 增強

**檔案：** `backend/server.js`
**位置：** 約 line 354-362

**修改後：**
```javascript
function findSocketByPlayerId(gameId, playerId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return null;

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  // 優先使用 player.socketId
  if (player.socketId) {
    const socket = io.sockets.sockets.get(player.socketId);
    if (socket && socket.connected) {
      return socket;
    }
    // socketId 無效，記錄警告
    console.warn(`[Socket] 玩家 ${player.name} (${playerId}) 的 socketId ${player.socketId} 無效或已斷線`);
  }

  // Fallback: 從 playerSockets Map 反查
  for (const [socketId, info] of playerSockets.entries()) {
    if (info.gameId === gameId && info.playerId === playerId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        // 自動修復 player.socketId
        player.socketId = socketId;
        console.log(`[Socket] 自動修復玩家 ${player.name} 的 socketId: ${socketId}`);
        return socket;
      }
    }
  }

  console.warn(`[Socket] 找不到玩家 ${player.name} (${playerId}) 的有效 socket`);
  return null;
}
```

## 測試項目

- [ ] socketId 有效時正常返回
- [ ] socketId 無效時 fallback 機制生效
- [ ] 自動修復機制正確運作
- [ ] 找不到時返回 null 並記錄日誌

## 驗收標準

- [ ] fallback 機制正確實作
- [ ] 自動修復 socketId 功能運作
- [ ] 日誌記錄完整
