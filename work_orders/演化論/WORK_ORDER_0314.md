# 工作單 0314

## 編號
0314

## 日期
2026-01-31

## 工作單標題
實作遊戲開始邏輯

## 工單主旨
演化論房間處理重寫 - 階段二

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_ROOM_REWRITE.md`

## 內容

### 目標
在 `evolutionGameHandler.js` 中實作遊戲開始邏輯，正確整合 `gameLogic.js`。

### 工作項目

#### 1. 實作遊戲開始函數
```javascript
function startGame(socket, io, data) {
  const { roomId, playerId } = data;
  const room = evoRooms.get(roomId);

  // 驗證
  // 1. 房間存在
  // 2. 是房主
  // 3. 所有玩家準備
  // 4. 玩家數量 2-4 人

  // 初始化遊戲
  const players = room.players.map(p => ({
    id: p.id,
    name: p.name,
  }));

  const result = gameLogic.initGame(players);
  if (result.success) {
    room.gameState = result.gameState;
    room.gameState = gameLogic.startGame(room.gameState);
    room.phase = 'playing';

    // 廣播遊戲狀態
    broadcastGameState(io, roomId);
  }
}
```

#### 2. 實作遊戲狀態廣播
```javascript
function broadcastGameState(io, roomId) {
  const room = evoRooms.get(roomId);
  if (room && room.gameState) {
    // 為每個玩家發送個人化狀態（隱藏其他玩家手牌）
    room.players.forEach(player => {
      const clientState = getClientGameState(room, player.id);
      io.to(player.socketId).emit('evo:gameState', clientState);
    });
  }
}
```

#### 3. 實作客戶端狀態轉換
```javascript
function getClientGameState(room, playerId) {
  // 轉換為前端可用的狀態格式
  // 隱藏其他玩家手牌
  // 包含必要的遊戲資訊
}
```

### 驗收標準
1. `startGame` 函數已實作
2. 正確調用 `gameLogic.initGame` 和 `gameLogic.startGame`
3. 遊戲狀態正確廣播給所有玩家
4. 每個玩家只能看到自己的手牌

### 相關檔案
- `backend/evolutionGameHandler.js`
- `backend/logic/evolution/gameLogic.js`

### 依賴工單
- 0313

### 被依賴工單
- 0315
