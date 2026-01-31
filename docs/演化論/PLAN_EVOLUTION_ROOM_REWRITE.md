# 演化論房間處理重寫計畫書

**文件編號**：PLAN-EVO-ROOM-REWRITE
**建立日期**：2026-01-31

---

## 1. 背景

原有的演化論房間處理使用 `evolutionRoomManager.js` 類來管理，但與 `gameLogic.js` 之間存在參數傳遞問題，導致遊戲無法正常開始。

本計畫將參考本草遊戲的房間處理方式，重新設計演化論的房間處理邏輯。

## 2. 本草房間處理分析

### 2.1 核心結構

```javascript
// 房間狀態儲存
const gameRooms = new Map();

// 玩家 Socket 對應
const playerSockets = new Map();

// 廣播函數
function broadcastGameState(gameId) { ... }
function broadcastRoomList() { ... }
```

### 2.2 Socket 事件處理

本草的處理方式是直接在 server.js 中處理所有 Socket 事件：

| 事件 | 處理方式 |
|------|----------|
| createRoom | 直接建立房間狀態並存入 gameRooms |
| joinRoom | 直接修改房間狀態 |
| startGame | 直接調用遊戲邏輯函數 |
| gameAction | 直接調用 processGameAction |
| leaveRoom | 直接移除玩家 |

### 2.3 優點

1. **簡單直接**：不需要經過中間層轉換
2. **狀態清晰**：所有狀態都在同一個地方管理
3. **避免參數轉換錯誤**：直接操作狀態，不需要額外的參數轉換

## 3. 重寫計畫

### 3.1 保留原有檔案

- `backend/services/evolutionRoomManager.js` → 保留不刪除

### 3.2 新增檔案

- `backend/evolutionGameHandler.js` → 新的演化論遊戲處理模組

### 3.3 新模組設計

```javascript
// evolutionGameHandler.js

// 演化論房間狀態
const evoRooms = new Map();

// 玩家 Socket 對應
const evoPlayerSockets = new Map();

// 模組化的處理函數
module.exports = {
  // 初始化 Socket 事件
  setupSocketHandlers(io),

  // 房間操作
  createRoom(socket, data),
  joinRoom(socket, data),
  leaveRoom(socket, data),
  setReady(socket, data),
  startGame(socket, io, data),

  // 遊戲操作
  processGameAction(socket, io, data),

  // 輔助函數
  getRoomList(),
  broadcastGameState(io, roomId),
};
```

### 3.4 遊戲狀態結構（參考本草）

```javascript
const roomState = {
  id: roomId,
  name: roomName,
  maxPlayers: 4,
  hostId: socketId,
  phase: 'waiting', // waiting | playing | finished

  players: [{
    id: playerId,
    name: playerName,
    socketId: socketId,
    firebaseUid: uid,
    isHost: boolean,
    isReady: boolean,
    hand: [],        // 手牌
    creatures: [],   // 生物
  }],

  // 遊戲狀態（開始後才有）
  gameState: {
    phase: 'evolution', // evolution | foodSupply | feeding | extinction | gameEnd
    round: 1,
    deck: [],
    foodPool: 0,
    currentPlayerIndex: 0,
    currentPlayerId: '',
    isLastRound: false,
  },

  createdAt: timestamp,
};
```

## 4. 實施計畫

### 4.1 工單分配

| 工單編號 | 標題 | 內容 |
|----------|------|------|
| 0313 | 建立 evolutionGameHandler 基礎結構 | 建立新模組，實作房間管理 |
| 0314 | 實作遊戲開始邏輯 | 整合 gameLogic.initGame |
| 0315 | 修改 server.js 使用新模組 | 替換 Socket 事件處理 |
| 0316 | 測試新房間處理 | 驗證功能正常 |

### 4.2 關鍵實作要點

1. **直接使用 gameLogic**：
   ```javascript
   // 正確調用方式
   const result = gameLogic.initGame(players);
   if (result.success) {
     room.gameState = result.gameState;
     room.gameState = gameLogic.startGame(room.gameState);
   }
   ```

2. **Socket 事件直接處理**：
   ```javascript
   socket.on('evo:startGame', ({ roomId, playerId }) => {
     const room = evoRooms.get(roomId);
     // 直接處理，不經過 roomManager
   });
   ```

3. **狀態廣播**：
   ```javascript
   function broadcastEvoGameState(io, roomId) {
     const room = evoRooms.get(roomId);
     if (room) {
       io.to(roomId).emit('evo:gameState', getClientState(room));
     }
   }
   ```

## 5. 驗收標準

1. 創建房間正常
2. 加入房間正常
3. **遊戲可以正常開始**（核心驗收）
4. 遊戲狀態正確廣播
5. 原有 evolutionRoomManager.js 保持不變

---

**計畫書結束**

*建立者：Claude Code*
*建立日期：2026-01-31*
