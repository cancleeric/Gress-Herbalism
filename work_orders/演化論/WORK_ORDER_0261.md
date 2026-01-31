# 工作單 0261

## 編號
0261

## 日期
2026-01-31

## 工作單標題
整合 Socket 事件

## 工單主旨
在後端 `server.js` 加入演化論遊戲的 Socket.io 事件處理

## 內容

### 任務描述

擴展現有的 Socket.io 伺服器，加入演化論遊戲的所有事件處理。

### 事件清單

#### 房間管理事件
```javascript
// 創建演化論房間
socket.on('evo:createRoom', ({ roomName, maxPlayers }) => {
  const room = evolutionRoomManager.createRoom(roomName, maxPlayers, socket.id);
  socket.join(room.id);
  socket.emit('evo:roomCreated', room);
  io.emit('evo:roomListUpdated', evolutionRoomManager.getRoomList());
});

// 加入房間
socket.on('evo:joinRoom', ({ roomId, playerName }) => {
  const result = evolutionRoomManager.joinRoom(roomId, socket.id, playerName);
  if (result.success) {
    socket.join(roomId);
    io.to(roomId).emit('evo:playerJoined', result.player);
  } else {
    socket.emit('evo:error', { message: result.error });
  }
});

// 開始遊戲
socket.on('evo:startGame', ({ roomId }) => {
  const result = evolutionRoomManager.startGame(roomId, socket.id);
  if (result.success) {
    io.to(roomId).emit('evo:gameStarted', result.gameState);
  }
});
```

#### 演化階段事件
```javascript
// 創造生物
socket.on('evo:createCreature', ({ roomId, cardId }) => {
  const result = evolutionRoomManager.processAction(roomId, socket.id, {
    type: 'createCreature',
    cardId
  });
  if (result.success) {
    io.to(roomId).emit('evo:creatureCreated', result.data);
    io.to(roomId).emit('evo:gameState', result.gameState);
  }
});

// 賦予性狀
socket.on('evo:addTrait', ({ roomId, cardId, creatureId, targetCreatureId }) => {
  const result = evolutionRoomManager.processAction(roomId, socket.id, {
    type: 'addTrait',
    cardId,
    creatureId,
    targetCreatureId
  });
  if (result.success) {
    io.to(roomId).emit('evo:traitAdded', result.data);
    io.to(roomId).emit('evo:gameState', result.gameState);
  }
});

// 跳過演化
socket.on('evo:passEvolution', ({ roomId }) => {
  const result = evolutionRoomManager.processAction(roomId, socket.id, {
    type: 'pass'
  });
  io.to(roomId).emit('evo:gameState', result.gameState);
});
```

#### 進食階段事件
```javascript
// 進食
socket.on('evo:feedCreature', ({ roomId, creatureId }) => {
  const result = evolutionRoomManager.processAction(roomId, socket.id, {
    type: 'feed',
    creatureId
  });
  if (result.success) {
    io.to(roomId).emit('evo:creatureFed', result.data);
    // 處理連鎖效應
    if (result.chainEffects) {
      io.to(roomId).emit('evo:chainTriggered', result.chainEffects);
    }
  }
});

// 肉食攻擊
socket.on('evo:attack', ({ roomId, attackerId, defenderId }) => {
  const result = evolutionRoomManager.processAction(roomId, socket.id, {
    type: 'attack',
    attackerId,
    defenderId
  });
  if (result.pendingResponse) {
    io.to(roomId).emit('evo:attackPending', result.pendingResponse);
  } else if (result.success) {
    io.to(roomId).emit('evo:attackResolved', result.data);
  }
});

// 回應攻擊（斷尾、擬態、敏捷）
socket.on('evo:respondAttack', ({ roomId, response }) => {
  const result = evolutionRoomManager.resolveAttack(roomId, socket.id, response);
  io.to(roomId).emit('evo:attackResolved', result);
  io.to(roomId).emit('evo:gameState', result.gameState);
});

// 使用性狀能力
socket.on('evo:useTrait', ({ roomId, creatureId, traitType, targetId }) => {
  const result = evolutionRoomManager.processAction(roomId, socket.id, {
    type: 'useTrait',
    creatureId,
    traitType,
    targetId
  });
  io.to(roomId).emit('evo:traitUsed', result.data);
  io.to(roomId).emit('evo:gameState', result.gameState);
});
```

### 房間管理器
```javascript
// backend/services/evolutionRoomManager.js
class EvolutionRoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(name, maxPlayers, hostId) { }
  joinRoom(roomId, playerId, playerName) { }
  startGame(roomId, playerId) { }
  processAction(roomId, playerId, action) { }
  resolveAttack(roomId, playerId, response) { }
  getRoomList() { }
  handleDisconnect(playerId) { }
}
```

### 前置條件
- 工單 0228-0232 已完成（後端邏輯）
- 工單 0260 已完成（大廳修改）

### 驗收標準
- [ ] 所有事件正確註冊
- [ ] 房間管理功能正常
- [ ] 遊戲動作正確處理
- [ ] 狀態同步正確
- [ ] 錯誤處理完善

### 相關檔案
- `backend/server.js` — 修改
- `backend/services/evolutionRoomManager.js` — 新建
- `backend/logic/evolution/` — 依賴

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第四章 4.2 節
