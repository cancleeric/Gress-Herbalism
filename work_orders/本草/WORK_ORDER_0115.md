# 工作單 0115

**日期：** 2026-01-25

**工作單標題：** 後端等待階段新增重連寬限期

**工單主旨：** BUG 修復 - 解決等待階段斷線後無法重連的問題

**計畫書：** [斷線重連問題修復計畫書](../docs/RECONNECT_FIX_PLAN.md)

**優先級：** 高

---

## 一、問題描述

目前在等待階段（waiting phase）時，玩家斷線會被**立即移除**，沒有任何重連機會。這導致：

1. 玩家按 F5 重整頁面時，會被踢出房間
2. 網路短暫中斷時，玩家會消失
3. 房間可能因此被刪除（如果變空）

**問題位置：** `backend/server.js:1062-1066`

```javascript
if (gameState.gamePhase === 'waiting') {
  // ❌ 直接移除玩家，沒有重連機會
  handlePlayerLeave(socket, gameId, playerId);
  return;
}
```

---

## 二、解決方案

為等待階段新增 **15 秒寬限期**，讓玩家有時間重新連線。

### 2.1 新增常數

```javascript
// backend/server.js
const WAITING_PHASE_DISCONNECT_TIMEOUT = 15000;  // 等待階段：15 秒
const PLAYING_PHASE_DISCONNECT_TIMEOUT = 60000;  // 遊戲中：60 秒（現有）
```

### 2.2 修改 handlePlayerDisconnect 函數

**修改前邏輯：**
```
等待階段 → 立即移除玩家
遊戲中 → 60 秒寬限期
```

**修改後邏輯：**
```
等待階段 → 15 秒寬限期
遊戲中 → 60 秒寬限期
```

### 2.3 完整修改程式碼

```javascript
/**
 * 處理玩家斷線
 */
function handlePlayerDisconnect(socket, gameId, playerId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;

  const player = gameState.players[playerIndex];

  // 判斷寬限期時間
  const isWaitingPhase = gameState.gamePhase === 'waiting';
  const timeout = isWaitingPhase
    ? WAITING_PHASE_DISCONNECT_TIMEOUT
    : PLAYING_PHASE_DISCONNECT_TIMEOUT;

  // 標記為斷線狀態
  player.isDisconnected = true;
  player.disconnectedAt = Date.now();
  console.log(`[${isWaitingPhase ? '等待階段' : '遊戲中'}] 玩家 ${player.name} 斷線，保留位置 ${timeout/1000} 秒等待重連`);

  socket.leave(gameId);
  playerSockets.delete(socket.id);

  // 設定計時器
  const timeoutKey = `${gameId}:${playerId}`;
  if (disconnectTimeouts.has(timeoutKey)) {
    clearTimeout(disconnectTimeouts.get(timeoutKey));
  }

  const disconnectTimer = setTimeout(() => {
    const currentState = gameRooms.get(gameId);
    if (currentState) {
      const currentPlayerIndex = currentState.players.findIndex(p => p.id === playerId);
      if (currentPlayerIndex !== -1 && currentState.players[currentPlayerIndex].isDisconnected) {
        console.log(`玩家 ${playerId} 重連超時，${isWaitingPhase ? '移除玩家' : '標記為不活躍'}`);

        if (isWaitingPhase) {
          // 等待階段：超時後移除玩家
          currentState.players.splice(currentPlayerIndex, 1);

          if (currentState.players.length === 0) {
            // 房間空了，刪除房間
            gameRooms.delete(gameId);
            broadcastRoomList();
          } else if (player.isHost) {
            // 房主離開，轉移房主
            currentState.players[0].isHost = true;
            broadcastGameState(gameId);
            broadcastRoomList();
          } else {
            broadcastGameState(gameId);
            broadcastRoomList();
          }
        } else {
          // 遊戲中：標記為不活躍
          currentState.players[currentPlayerIndex].isActive = false;
          currentState.players[currentPlayerIndex].isDisconnected = false;
          broadcastGameState(gameId);
        }
      }
    }
    disconnectTimeouts.delete(timeoutKey);
  }, timeout);

  disconnectTimeouts.set(timeoutKey, disconnectTimer);

  // 廣播狀態更新
  broadcastGameState(gameId);
}
```

---

## 三、修改清單

| 檔案 | 修改內容 |
|------|---------|
| `backend/server.js` | 新增 `WAITING_PHASE_DISCONNECT_TIMEOUT` 常數 |
| `backend/server.js` | 修改 `handlePlayerDisconnect` 函數 |

---

## 四、測試案例

### 案例 1：等待階段正常重連

**步驟：**
1. 玩家 A 建立房間
2. 玩家 A 按 F5 重整頁面
3. 15 秒內完成重連

**預期結果：**
- 玩家 A 保留在房間中
- 房間不會被刪除

### 案例 2：等待階段超時

**步驟：**
1. 玩家 A 建立房間
2. 玩家 A 斷線
3. 等待超過 15 秒

**預期結果：**
- 玩家 A 被移除
- 房間被刪除（因為空了）

### 案例 3：等待階段房主重連

**步驟：**
1. 玩家 A（房主）建立房間
2. 玩家 B 加入房間
3. 玩家 A 斷線
4. 玩家 A 15 秒內重連

**預期結果：**
- 玩家 A 保持房主身分
- 房間狀態正常

### 案例 4：等待階段房主超時

**步驟：**
1. 玩家 A（房主）建立房間
2. 玩家 B 加入房間
3. 玩家 A 斷線
4. 等待超過 15 秒

**預期結果：**
- 玩家 A 被移除
- 玩家 B 成為新房主

---

## 五、驗收標準

- [ ] 等待階段斷線後，玩家被標記為 `isDisconnected: true`
- [ ] 15 秒內重連成功
- [ ] 超過 15 秒後玩家被正確移除
- [ ] 房主轉移邏輯正常運作
- [ ] 房間刪除邏輯正常運作
- [ ] 所有測試案例通過

---

## 六、注意事項

1. **寬限期選擇 15 秒的理由：**
   - 足夠讓頁面重整完成（通常 2-5 秒）
   - 不會讓其他玩家等待太久
   - 等待階段玩家還沒開始遊戲，15 秒是合理的

2. **與遊戲中的差異：**
   - 等待階段：超時後**移除**玩家
   - 遊戲中：超時後**標記為不活躍**（保留位置）
