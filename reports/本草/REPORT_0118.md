# 完成報告 0118

**工作單編號：** 0118

**工作單標題：** 重連時序優化 - beforeunload 處理

**完成日期：** 2026-01-25

---

## 一、工作摘要

在前端頁面重整前通知後端，讓後端能區分「故意重整」和「意外斷線」，避免重連時序競爭問題。

---

## 二、問題描述

**原本行為：**
- 玩家重整頁面時，後端無法區分是故意重整還是意外斷線
- 可能因為 disconnect timeout 太短（等待階段 15 秒）而在重整完成前移除玩家
- 重連和斷線處理存在時序競爭

**修復後行為：**
- 玩家重整前會發送 `playerRefreshing` 事件通知後端
- 後端收到通知後給予適當的重整寬限期（10 秒）
- 重連成功時自動清理重整狀態

---

## 三、修改內容

### 3.1 前端 socketService.js

**檔案：** `frontend/src/services/socketService.js`

**新增內容：** `emitPlayerRefreshing` 函數

```javascript
// ==================== 工單 0118：重連時序優化 ====================

/**
 * 通知後端玩家正在重整頁面
 * @param {string} gameId - 遊戲 ID
 * @param {string} playerId - 玩家 ID
 */
export function emitPlayerRefreshing(gameId, playerId) {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('playerRefreshing', { gameId, playerId });
  }
}
```

### 3.2 前端 GameRoom.js

**檔案：** `frontend/src/components/GameRoom/GameRoom.js`

**新增內容：** beforeunload 事件處理

```javascript
// 工單 0118：頁面重整前通知後端
useEffect(() => {
  const myPlayer = getMyPlayer();
  const currentGameId = gameState.storeGameId || gameId;
  const currentPlayerId = myPlayer?.id;

  const handleBeforeUnload = () => {
    if (currentGameId && currentPlayerId) {
      emitPlayerRefreshing(currentGameId, currentPlayerId);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [gameState.storeGameId, gameId, getMyPlayer]);
```

### 3.3 前端 Lobby.js

**檔案：** `frontend/src/components/Lobby/Lobby.js`

**新增內容：**
1. 引入 `emitPlayerRefreshing`
2. beforeunload 事件處理

```javascript
// 工單 0118：頁面重整前通知後端
useEffect(() => {
  const handleBeforeUnload = () => {
    const savedRoom = getCurrentRoom();
    if (savedRoom && savedRoom.roomId && savedRoom.playerId) {
      emitPlayerRefreshing(savedRoom.roomId, savedRoom.playerId);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

### 3.4 後端 server.js

**檔案：** `backend/server.js`

**新增常數：**
```javascript
// 工單 0118：追蹤正在重整的玩家（給予更長寬限期）
const refreshingPlayers = new Set();
const REFRESH_GRACE_PERIOD = 10000; // 10 秒重整寬限期
```

**新增 Socket 事件處理：**
```javascript
// 工單 0118：玩家正在重整頁面
socket.on('playerRefreshing', ({ gameId, playerId }) => {
  const refreshKey = `${gameId}:${playerId}`;
  refreshingPlayers.add(refreshKey);
  console.log(`[重整] 玩家 ${playerId} 正在重整頁面，加入寬限列表`);

  // 10 秒後自動移除（避免記憶體洩漏）
  setTimeout(() => {
    refreshingPlayers.delete(refreshKey);
  }, REFRESH_GRACE_PERIOD);
});
```

**修改 `handlePlayerDisconnect` 函數：**
- 檢查玩家是否在重整列表中
- 如果是重整中，使用 `REFRESH_GRACE_PERIOD`（10 秒）
- 標記 `player.isRefreshing = true`
- 在 timeout 回調中處理重整玩家

**修改 `handlePlayerReconnect` 函數：**
- 重連成功時清除 `refreshingPlayers` 中的記錄
- 清除 `player.isRefreshing` 標記

---

## 四、測試結果

### 前端測試
```
Test Suites: 32 passed, 32 total
Tests:       780 passed, 780 total
```

### 後端測試
```
Test Suites: 4 passed, 4 total
Tests:       49 passed, 49 total
```

---

## 五、驗收確認

- [x] `emitPlayerRefreshing` 函數正確實作
- [x] GameRoom.js beforeunload 處理正確
- [x] Lobby.js beforeunload 處理正確
- [x] 後端 `playerRefreshing` 事件處理正確
- [x] `handlePlayerDisconnect` 正確處理重整玩家
- [x] `handlePlayerReconnect` 正確清理重整狀態
- [x] 記憶體洩漏防護（自動清理 Set）
- [x] 所有測試通過

---

## 六、影響範圍

| 檔案 | 修改類型 |
|------|----------|
| `frontend/src/services/socketService.js` | 新增函數 |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增 useEffect |
| `frontend/src/components/Lobby/Lobby.js` | 新增 import 和 useEffect |
| `backend/server.js` | 新增常數、事件處理、修改函數 |

---

## 七、時序流程說明

### 玩家重整頁面流程

```
1. 使用者按 F5 或點擊重整
2. beforeunload 事件觸發
3. 前端發送 playerRefreshing 事件
4. 後端將玩家加入 refreshingPlayers Set
5. Socket 斷線，觸發 disconnect
6. handlePlayerDisconnect 檢測到玩家在 refreshingPlayers 中
7. 使用 10 秒重整寬限期（而非 15 秒等待階段或 60 秒遊戲中）
8. 頁面重新載入，建立新 Socket 連線
9. 前端發送 reconnect 請求
10. handlePlayerReconnect 恢復玩家狀態
11. 清除 refreshingPlayers 記錄和 disconnect timeout
12. 玩家成功重連，繼續遊戲
```

---

## 八、備註

此工單配合工單 0115（等待階段寬限期）、0116（localStorage 有效期延長）、0117（Redux 持久化）共同解決頁面重整時玩家被踢出的問題。

重整寬限期設定為 10 秒的理由：
- 足夠長：讓頁面完成重新載入和 Socket 重連
- 足夠短：如果玩家真的關閉頁面離開，不會佔用位置太久
- 與等待階段 15 秒和遊戲中 60 秒形成合理的層級
