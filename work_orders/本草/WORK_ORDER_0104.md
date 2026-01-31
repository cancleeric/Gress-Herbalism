# 工作單 0104

**日期：** 2026-01-25

**工作單標題：** 修復重連時 socketId 未更新問題

**工單主旨：** BUG 修復 - 確保玩家重連時 socketId 正確同步

**計畫書：** [Socket 連線同步修復計畫書](../docs/SOCKET_SYNC_FIX_PLAN.md)

**優先級：** 緊急

---

## 問題描述

玩家重連時，`handlePlayerReconnect` 函數沒有更新 `player.socketId`，導致：
1. `findSocketByPlayerId` 使用舊的 socketId
2. 找不到正確的 socket
3. `postQuestionPhase` 等事件無法發送

## 修改內容

### 1. handlePlayerReconnect 函數

**檔案：** `backend/server.js`
**位置：** 約 line 1125-1130

**修改前：**
```javascript
// 恢復玩家狀態
player.isDisconnected = false;
player.disconnectedAt = null;

// 更新 socket 對應
playerSockets.set(socket.id, { gameId: roomId, playerId });
```

**修改後：**
```javascript
// 恢復玩家狀態
player.isDisconnected = false;
player.disconnectedAt = null;

// ⭐ 新增：更新 player.socketId
const oldSocketId = player.socketId;
player.socketId = socket.id;
console.log(`[重連] 玩家 ${player.name} socketId 更新: ${oldSocketId} → ${socket.id}`);

// 更新 socket 對應
playerSockets.set(socket.id, { gameId: roomId, playerId });
```

## 測試項目

- [ ] 瀏覽器重新整理後問牌流程正常
- [ ] 斷線重連後問牌流程正常
- [ ] 重連後預測 UI 正確顯示

## 驗收標準

- [ ] player.socketId 在重連時正確更新
- [ ] 控制台顯示 socketId 更新日誌
- [ ] 問牌後 postQuestionPhase 事件正確發送
