# 工作單 0079

**日期：** 2026-01-25

**工作單標題：** 重新整理後應能重新連線回房間

**工單主旨：** BUG/功能改善 - 支援玩家重新整理後自動重連房間

**分類：** BUG

---

## 問題描述

玩家在遊玩時，如果重新整理畫面（F5 或點擊重新整理），會直接退出房間，無法繼續遊戲。

## 目前行為

```
玩家在房間中遊玩
       │
       ▼
重新整理畫面 (F5)
       │
       ▼
退出房間，回到大廳  ← 問題
```

## 預期行為

```
玩家在房間中遊玩
       │
       ▼
重新整理畫面 (F5)
       │
       ▼
自動重新連線到原本的房間
       │
       ├─ 房間存在 → 繼續遊戲
       │
       └─ 房間不存在 → 顯示提示，回到大廳
```

## 功能需求

### 1. 保存連線資訊

重新整理前，保存以下資訊到 localStorage 或 sessionStorage：

| 資訊 | 說明 |
|------|------|
| roomId | 房間 ID |
| playerId | 玩家 ID |
| playerName | 玩家暱稱 |

### 2. 重新連線流程

```
頁面載入
    │
    ▼
檢查是否有保存的房間資訊
    │
    ├─ 有 → 嘗試重新連線
    │       │
    │       ├─ 成功 → 恢復遊戲狀態
    │       │
    │       └─ 失敗 → 清除資訊，顯示提示
    │
    └─ 無 → 正常流程（顯示大廳）
```

### 3. 後端支援

後端需要支援玩家重連：

- 保留斷線玩家的位置一段時間（如 60 秒）
- 接受重連請求並恢復玩家狀態
- 同步當前遊戲狀態給重連的玩家

### 4. 重連失敗情境

| 情境 | 處理方式 |
|------|---------|
| 房間已不存在 | 顯示「房間已結束」，回到大廳 |
| 玩家已被移除 | 顯示「已離開房間」，回到大廳 |
| 遊戲已結束 | 顯示「遊戲已結束」，回到大廳 |
| 位置已被取代 | 顯示「位置已被其他玩家取代」，回到大廳 |

### 5. 提示訊息

**重連中：**
```
┌─────────────────────────────────────────┐
│                                         │
│         🔄 正在重新連線...               │
│                                         │
└─────────────────────────────────────────┘
```

**重連失敗：**
```
┌─────────────────────────────────────────┐
│                                         │
│   ⚠️ 無法重新連線                        │
│                                         │
│   房間已不存在或遊戲已結束               │
│                                         │
│            [返回大廳]                    │
└─────────────────────────────────────────┘
```

## 技術實作方向

### 前端

```javascript
// 加入房間時保存資訊
localStorage.setItem('currentRoom', JSON.stringify({
  roomId: 'xxx',
  playerId: 'xxx',
  playerName: '小明',
  timestamp: Date.now()
}));

// 離開房間時清除
localStorage.removeItem('currentRoom');

// 頁面載入時檢查
const savedRoom = localStorage.getItem('currentRoom');
if (savedRoom) {
  attemptReconnect(JSON.parse(savedRoom));
}
```

### 後端

```javascript
// 玩家斷線時，保留位置
socket.on('disconnect', () => {
  // 不立即移除玩家，設定重連等待時間
  player.disconnectedAt = Date.now();
  player.isDisconnected = true;

  // 60 秒後若未重連，才移除
  setTimeout(() => {
    if (player.isDisconnected) {
      removePlayer(player.id);
    }
  }, 60000);
});

// 處理重連請求
socket.on('reconnect', ({ roomId, playerId }) => {
  const room = getRoom(roomId);
  const player = room?.getPlayer(playerId);

  if (room && player && player.isDisconnected) {
    player.isDisconnected = false;
    player.socketId = socket.id;
    // 同步遊戲狀態
    socket.emit('reconnected', { gameState: room.getState() });
  } else {
    socket.emit('reconnectFailed', { reason: '...' });
  }
});
```

## 驗收標準

- [ ] 重新整理後自動嘗試重新連線
- [ ] 重連成功後恢復遊戲狀態
- [ ] 重連成功後可繼續遊戲
- [ ] 房間不存在時顯示適當提示
- [ ] 離開房間時清除保存的資訊
- [ ] 重連等待期間，其他玩家看到該玩家為「斷線中」狀態
