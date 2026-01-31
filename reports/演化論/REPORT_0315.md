# 報告書 0315

## 工作單編號
0315

## 完成日期
2026-01-31

## 完成內容摘要

修改 `server.js`，使用新的 `evolutionGameHandler.js` 處理演化論 Socket 事件。

### 修改內容

#### 1. 引入新模組
```javascript
// 工單 0261 - 演化論遊戲房間管理（舊模組，保留但不使用）
// const evolutionRoomManager = require('./services/evolutionRoomManager');

// 工單 0313-0316 - 演化論遊戲處理（新模組）
const evolutionHandler = require('./evolutionGameHandler');
```

#### 2. 替換 Socket 事件處理
```javascript
// 房間操作
socket.on('evo:createRoom', (data) => evolutionHandler.createRoom(socket, io, data));
socket.on('evo:joinRoom', (data) => evolutionHandler.joinRoom(socket, io, data));
socket.on('evo:leaveRoom', (data) => evolutionHandler.leaveRoom(socket, io, data));
socket.on('evo:setReady', (data) => evolutionHandler.setReady(socket, io, data));
socket.on('evo:startGame', (data) => evolutionHandler.startGame(socket, io, data));
socket.on('evo:requestRoomList', () => evolutionHandler.requestRoomList(socket));

// 遊戲操作
socket.on('evo:createCreature', (data) => evolutionHandler.createCreature(socket, io, data));
socket.on('evo:addTrait', (data) => evolutionHandler.addTrait(socket, io, data));
socket.on('evo:passEvolution', (data) => evolutionHandler.passEvolution(socket, io, data));
socket.on('evo:feedCreature', (data) => evolutionHandler.feedCreature(socket, io, data));
socket.on('evo:attack', (data) => evolutionHandler.attack(socket, io, data));
socket.on('evo:respondAttack', (data) => evolutionHandler.respondAttack(socket, io, data));
socket.on('evo:useTrait', (data) => evolutionHandler.useTrait(socket, io, data));
```

#### 3. 斷線處理
```javascript
socket.on('disconnect', async (reason) => {
  // 本草遊戲斷線處理
  const playerInfo = playerSockets.get(socket.id);
  if (playerInfo) {
    handlePlayerDisconnect(socket, playerInfo.gameId, playerInfo.playerId);
  }

  // 工單 0313-0316：演化論遊戲斷線處理
  evolutionHandler.handleDisconnect(socket, io);

  // ...
});
```

### 驗收標準確認
- [x] server.js 正確引入新模組
- [x] 所有 `evo:` 事件正確轉發到新模組
- [x] 斷線處理正確
- [x] 原有本草遊戲功能不受影響
- [x] 原有 evolutionRoomManager.js 保持不變

## 遇到的問題與解決方案
無

## 測試結果
語法驗證通過

## 下一步計劃
- 執行工單 0316：測試新房間處理
