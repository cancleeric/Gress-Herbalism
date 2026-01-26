# BUG 修復計畫書

**日期：** 2026-01-27

**計畫編號：** PLAN-BUG-0147-0148

---

## 一、問題概述

本計畫針對以下兩個 BUG 進行修復：

| BUG 編號 | 問題描述 |
|----------|----------|
| BUG-0147 | 創建 4 人房間時，部分玩家看不到可用房間列表 |
| BUG-0148 | 房間有人退出時，所有人都斷線 |

---

## 二、BUG-0147：4 人房間可用房間不顯示

### 2.1 問題分析

#### 現象
- 創建 4 人房間後，部分玩家在大廳看不到可用房間
- 問題不一定發生，有時序相關性

#### 根本原因分析

**可能原因 1：Socket 時序問題**
- 玩家連線時，伺服器會發送 `roomList` 事件
- 如果前端 `onRoomList` 訂閱尚未完成，會遺漏首次更新
- 後續的 `broadcastRoomList()` 也可能因時序問題被遺漏

**可能原因 2：Socket 連線狀態**
- 某些 Socket 可能處於不穩定狀態
- `io.emit()` 可能無法到達所有客戶端

#### 相關程式碼位置

| 檔案 | 行號 | 功能 |
|------|------|------|
| `backend/server.js` | 432-447 | `broadcastRoomList()` 函數 |
| `backend/server.js` | 464 | 新連線時發送房間列表 |
| `frontend/src/services/socketService.js` | 135-139 | `onRoomList()` 訂閱 |
| `frontend/src/components/Lobby/Lobby.js` | 118-120 | Lobby 訂閱房間列表 |

### 2.2 修復方案

**方案：主動請求房間列表機制**

新增「主動請求房間列表」功能，確保前端在訂閱完成後能獲取最新房間列表。

#### 實施步驟

**步驟 1：後端新增房間列表請求事件**

修改 `backend/server.js`，在 `io.on('connection')` 中新增：

```javascript
// 房間列表請求事件
socket.on('requestRoomList', () => {
  socket.emit('roomList', getAvailableRooms());
});
```

**步驟 2：前端新增請求函數**

修改 `frontend/src/services/socketService.js`，新增：

```javascript
/**
 * 主動請求房間列表
 */
export function requestRoomList() {
  const s = getSocket();
  s.emit('requestRoomList');
}
```

**步驟 3：Lobby 掛載後主動請求**

修改 `frontend/src/components/Lobby/Lobby.js`：

```javascript
import { ..., requestRoomList } from '../../services/socketService';

// 在 useEffect 中
useEffect(() => {
  const unsubRooms = onRoomList((updatedRooms) => {
    setRooms(updatedRooms);
  });

  // 訂閱完成後，主動請求房間列表
  requestRoomList();

  // ... 其他訂閱
}, []);
```

### 2.3 修改檔案清單

| 檔案 | 修改類型 | 說明 |
|------|----------|------|
| `backend/server.js` | 修改 | 新增 `requestRoomList` 事件處理 |
| `frontend/src/services/socketService.js` | 修改 | 新增 `requestRoomList()` 函數 |
| `frontend/src/components/Lobby/Lobby.js` | 修改 | 掛載後主動請求房間列表 |

---

## 三、BUG-0148：房間退出導致所有人斷線

### 3.1 問題分析

#### 現象
- 房間中有玩家退出時，其他玩家也會斷線
- 可能發生在等待階段或遊戲中

#### 根本原因分析

**可能原因 1：廣播遊戲狀態錯誤**
- `handlePlayerLeave()` 中呼叫 `broadcastGameState()`
- 如果房間已被刪除但仍嘗試廣播，可能導致錯誤

**可能原因 2：Socket 事件傳播**
- 某個 Socket 錯誤可能影響整個房間
- `io.to(gameId).emit()` 可能有問題

**可能原因 3：前端錯誤處理**
- 收到更新後的 gameState 時，前端可能因找不到自己而觸發錯誤

#### 相關程式碼位置

| 檔案 | 行號 | 功能 |
|------|------|------|
| `backend/server.js` | 1093-1126 | `handlePlayerLeave()` 函數 |
| `backend/server.js` | 1134-1229 | `handlePlayerDisconnect()` 函數 |
| `backend/server.js` | 452-457 | `broadcastGameState()` 函數 |

### 3.2 修復方案

**方案：加強離開房間的錯誤處理**

#### 實施步驟

**步驟 1：修復 handlePlayerLeave 的廣播順序**

修改 `backend/server.js`：

```javascript
function handlePlayerLeave(socket, gameId, playerId) {
  console.log(`[房間] 離開: ${gameId}, 玩家: ${playerId}`);

  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;

  const player = gameState.players[playerIndex];

  // 先離開 Socket 房間
  socket.leave(gameId);
  playerSockets.delete(socket.id);

  if (gameState.gamePhase === 'waiting') {
    gameState.players.splice(playerIndex, 1);

    if (gameState.players.length === 0) {
      gameRooms.delete(gameId);
      // 房間已刪除，只更新房間列表，不廣播遊戲狀態
      broadcastRoomList();
      return;
    } else if (player.isHost) {
      gameState.players[0].isHost = true;
    }
  } else {
    gameState.players[playerIndex].isActive = false;
  }

  // 通知房間內剩餘玩家有人離開
  io.to(gameId).emit('playerLeft', { playerId, playerName: player.name });

  broadcastGameState(gameId);
  broadcastRoomList();
}
```

**步驟 2：前端新增 playerLeft 事件處理**

修改 `frontend/src/services/socketService.js`：

```javascript
/**
 * 監聽玩家離開事件
 */
export function onPlayerLeft(callback) {
  const s = getSocket();
  s.on('playerLeft', callback);
  return () => s.off('playerLeft', callback);
}
```

**步驟 3：前端 GameRoom 處理玩家離開**

修改 `frontend/src/components/GameRoom/GameRoom.js`：

```javascript
// 訂閱玩家離開事件
const unsubPlayerLeft = onPlayerLeft(({ playerId, playerName }) => {
  console.log(`玩家 ${playerName} 離開了房間`);
  // 可選：顯示通知
});
```

**步驟 4：加強 broadcastGameState 的防護**

修改 `backend/server.js`：

```javascript
function broadcastGameState(gameId) {
  const gameState = gameRooms.get(gameId);
  if (gameState && gameState.players && gameState.players.length > 0) {
    io.to(gameId).emit('gameState', gameState);
  }
}
```

### 3.3 修改檔案清單

| 檔案 | 修改類型 | 說明 |
|------|----------|------|
| `backend/server.js` | 修改 | 改進 `handlePlayerLeave()`、`broadcastGameState()` |
| `frontend/src/services/socketService.js` | 修改 | 新增 `onPlayerLeft()` |
| `frontend/src/components/GameRoom/GameRoom.js` | 修改 | 處理玩家離開事件 |

---

## 四、實施計畫

### 4.1 工單規劃

| 工單編號 | 標題 | 優先級 | 預估工時 |
|----------|------|--------|----------|
| 0147 | 修復 4 人房間可用房間不顯示 | 高 | 30 分鐘 |
| 0148 | 修復房間退出導致所有人斷線 | 高 | 45 分鐘 |

### 4.2 實施順序

```
1. 工單 0147：房間列表顯示
   │
   ├── 後端新增 requestRoomList 事件
   ├── 前端新增 requestRoomList 函數
   └── Lobby 掛載後主動請求
   │
2. 工單 0148：斷線問題
   │
   ├── 修改 handlePlayerLeave 邏輯
   ├── 新增 playerLeft 事件
   ├── 加強 broadcastGameState 防護
   └── 前端處理玩家離開
```

### 4.3 測試計畫

#### 工單 0147 測試
1. 開啟 4 個瀏覽器視窗
2. 視窗 A 創建 4 人房間
3. 確認 B、C、D 都能看到房間
4. B 重新整理頁面，確認仍能看到房間

#### 工單 0148 測試
1. 創建房間，3 人加入
2. 在等待階段，讓一人退出
3. 確認其他 2 人不斷線
4. 開始遊戲後，讓一人退出
5. 確認其他玩家不斷線，遊戲繼續

---

## 五、驗收標準

### 工單 0147
- [ ] 創建房間後所有玩家都能看到
- [ ] 重新整理頁面後房間列表正確
- [ ] 不影響現有功能

### 工單 0148
- [ ] 等待階段退出不影響其他玩家
- [ ] 遊戲中退出不影響其他玩家
- [ ] 退出玩家正確標記為不活躍
- [ ] 房間列表正確更新

---

## 六、風險評估

| 風險 | 等級 | 緩解措施 |
|------|------|----------|
| 修改廣播邏輯可能影響現有功能 | 中 | 充分測試各種場景 |
| Socket 事件命名衝突 | 低 | 使用獨特的事件名稱 |
| 前端訂閱順序問題 | 低 | 確保訂閱在請求前完成 |

---

**文件版本：** 1.0
**建立日期：** 2026-01-27

