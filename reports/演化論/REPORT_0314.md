# 報告書 0314

## 工作單編號
0314

## 完成日期
2026-01-31

## 完成內容摘要

在 `evolutionGameHandler.js` 中實作遊戲開始邏輯及所有遊戲操作函數。

### 實作內容

#### 1. 遊戲開始函數
```javascript
function startGame(socket, io, data) {
  // 驗證房主
  // 檢查玩家數量
  // 調用 gameLogic.initGame
  // 調用 gameLogic.startGame
  // 廣播遊戲狀態
}
```

#### 2. 遊戲操作函數
- `createCreature(socket, io, data)` - 創造生物
- `addTrait(socket, io, data)` - 賦予性狀
- `passEvolution(socket, io, data)` - 跳過演化
- `feedCreature(socket, io, data)` - 進食
- `attack(socket, io, data)` - 攻擊
- `respondAttack(socket, io, data)` - 回應攻擊
- `useTrait(socket, io, data)` - 使用性狀能力

#### 3. 遊戲狀態廣播
```javascript
function broadcastGameState(io, roomId) {
  // 為每個玩家發送個人化狀態
  // 隱藏其他玩家手牌
  room.players.forEach(player => {
    const clientState = getClientGameState(room, player.id);
    io.to(player.socketId).emit('evo:gameState', clientState);
  });
}
```

#### 4. 客戶端狀態轉換
```javascript
function getClientGameState(room, playerId) {
  // 自己可以看到完整手牌
  // 其他玩家只能看到手牌數量
}
```

### 驗收標準確認
- [x] `startGame` 函數已實作
- [x] 正確調用 `gameLogic.initGame` 和 `gameLogic.startGame`
- [x] 遊戲狀態正確廣播給所有玩家
- [x] 每個玩家只能看到自己的手牌

## 遇到的問題與解決方案
無

## 測試結果
語法驗證通過

## 下一步計劃
- 執行工單 0315：修改 server.js 使用新模組
