# 工作單 0315

## 編號
0315

## 日期
2026-01-31

## 工作單標題
修改 server.js 使用新模組

## 工單主旨
演化論房間處理重寫 - 階段三

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_ROOM_REWRITE.md`

## 內容

### 目標
修改 `server.js`，使用新的 `evolutionGameHandler.js` 處理演化論 Socket 事件。

### 工作項目

#### 1. 引入新模組
```javascript
const evolutionHandler = require('./evolutionGameHandler');
```

#### 2. 替換 Socket 事件處理

將原有的演化論事件處理替換為新模組：

```javascript
// 演化論房間操作
socket.on('evo:createRoom', (data) => evolutionHandler.createRoom(socket, io, data));
socket.on('evo:joinRoom', (data) => evolutionHandler.joinRoom(socket, io, data));
socket.on('evo:leaveRoom', (data) => evolutionHandler.leaveRoom(socket, io, data));
socket.on('evo:setReady', (data) => evolutionHandler.setReady(socket, io, data));
socket.on('evo:startGame', (data) => evolutionHandler.startGame(socket, io, data));
socket.on('evo:requestRoomList', () => evolutionHandler.requestRoomList(socket));

// 演化論遊戲操作
socket.on('evo:createCreature', (data) => evolutionHandler.createCreature(socket, io, data));
socket.on('evo:addTrait', (data) => evolutionHandler.addTrait(socket, io, data));
socket.on('evo:passEvolution', (data) => evolutionHandler.passEvolution(socket, io, data));
socket.on('evo:feedCreature', (data) => evolutionHandler.feedCreature(socket, io, data));
socket.on('evo:attack', (data) => evolutionHandler.attack(socket, io, data));
socket.on('evo:respondAttack', (data) => evolutionHandler.respondAttack(socket, io, data));
socket.on('evo:useTrait', (data) => evolutionHandler.useTrait(socket, io, data));
```

#### 3. 處理斷線
```javascript
socket.on('disconnect', () => {
  // 原有本草處理...

  // 演化論斷線處理
  evolutionHandler.handleDisconnect(socket, io);
});
```

#### 4. 移除舊的 evolutionRoomManager 引用
- 保留 `evolutionRoomManager.js` 檔案不刪除
- 在 `server.js` 中註解或移除舊引用

### 驗收標準
1. server.js 正確引入新模組
2. 所有 `evo:` 事件正確轉發到新模組
3. 斷線處理正確
4. 原有本草遊戲功能不受影響
5. 原有 evolutionRoomManager.js 保持不變

### 相關檔案
- `backend/server.js`
- `backend/evolutionGameHandler.js`

### 依賴工單
- 0313, 0314

### 被依賴工單
- 0316
