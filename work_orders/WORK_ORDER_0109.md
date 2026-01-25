# 工作單 0109

**日期：** 2026-01-25

**工作單標題：** Socket 連線日誌增強

**工單主旨：** 功能增強 - 增加連線相關的詳細日誌

**計畫書：** [Socket 連線同步修復計畫書](../docs/SOCKET_SYNC_FIX_PLAN.md)

**優先級：** 低

---

## 功能描述

增加詳細的 Socket 連線日誌，便於追蹤和除錯連線問題。

## 修改內容

### 1. 連線事件日誌

```javascript
socket.on('connection', (socket) => {
  console.log(`[連線] 新連線: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`[連線] 斷線: ${socket.id}, 原因: ${reason}`);
  });
});
```

### 2. 房間操作日誌

```javascript
// 創建房間
console.log(`[房間] 創建: ${gameId}, 房主: ${player.name} (${player.id}), socketId: ${socket.id}`);

// 加入房間
console.log(`[房間] 加入: ${gameId}, 玩家: ${player.name} (${player.id}), socketId: ${socket.id}`);

// 離開房間
console.log(`[房間] 離開: ${gameId}, 玩家: ${playerId}`);
```

### 3. 重連日誌

```javascript
// 重連請求
console.log(`[重連] 請求: 房間 ${roomId}, 玩家 ${playerId}`);

// 重連成功
console.log(`[重連] 成功: 玩家 ${player.name}, 舊 socketId: ${oldSocketId}, 新 socketId: ${socket.id}`);

// 重連失敗
console.log(`[重連] 失敗: ${reason}`);
```

### 4. Socket 查找日誌

```javascript
// findSocketByPlayerId 日誌
console.log(`[Socket查找] 玩家: ${playerId}, 結果: ${socket ? 'found' : 'not found'}`);
```

## 日誌格式規範

```
[類別] 動作: 詳情

類別：連線、房間、重連、Socket查找、心跳、遊戲
動作：新連線、斷線、創建、加入、離開、請求、成功、失敗等
```

## 測試項目

- [ ] 連線/斷線日誌正確
- [ ] 房間操作日誌完整
- [ ] 重連流程日誌清晰
- [ ] 日誌格式一致

## 驗收標準

- [ ] 日誌格式統一
- [ ] 關鍵操作都有日誌
- [ ] 便於追蹤問題
