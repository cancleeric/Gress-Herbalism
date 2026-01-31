# 工作單 0272

## 編號
0272

## 日期
2026-01-31

## 標題
演化論 Socket 服務擴展

## 主旨
BUG 修復 - Socket 連接

## 關聯計畫書
`BUG/BUG_PLAN_EVOLUTION_SOCKET.md`

## 內容

### 目標
在 `socketService.js` 中添加演化論遊戲的 Socket 函數，使前端能夠與後端通訊。

### 工作項目

#### 1. 添加演化論事件發送函數

```javascript
// ==================== 演化論遊戲 ====================

/**
 * 創建演化論房間
 */
export function evoCreateRoom(roomName, maxPlayers, player) {
  const s = getSocket();
  s.emit('evo:createRoom', { roomName, maxPlayers, player });
}

/**
 * 加入演化論房間
 */
export function evoJoinRoom(roomId, player) {
  const s = getSocket();
  s.emit('evo:joinRoom', { roomId, player });
}

/**
 * 離開演化論房間
 */
export function evoLeaveRoom(roomId, playerId) {
  const s = getSocket();
  s.emit('evo:leaveRoom', { roomId, playerId });
}

/**
 * 設定準備狀態
 */
export function evoSetReady(roomId, playerId, isReady) {
  const s = getSocket();
  s.emit('evo:setReady', { roomId, playerId, isReady });
}

/**
 * 開始遊戲
 */
export function evoStartGame(roomId, playerId) {
  const s = getSocket();
  s.emit('evo:startGame', { roomId, playerId });
}

/**
 * 創造生物
 */
export function evoCreateCreature(roomId, playerId, cardId) {
  const s = getSocket();
  s.emit('evo:createCreature', { roomId, playerId, cardId });
}

/**
 * 賦予性狀
 */
export function evoAddTrait(roomId, playerId, cardId, creatureId, targetCreatureId = null) {
  const s = getSocket();
  s.emit('evo:addTrait', { roomId, playerId, cardId, creatureId, targetCreatureId });
}

/**
 * 跳過演化
 */
export function evoPassEvolution(roomId, playerId) {
  const s = getSocket();
  s.emit('evo:passEvolution', { roomId, playerId });
}

/**
 * 進食
 */
export function evoFeedCreature(roomId, playerId, creatureId) {
  const s = getSocket();
  s.emit('evo:feedCreature', { roomId, playerId, creatureId });
}

/**
 * 攻擊
 */
export function evoAttack(roomId, playerId, attackerId, defenderId) {
  const s = getSocket();
  s.emit('evo:attack', { roomId, playerId, attackerId, defenderId });
}

/**
 * 回應攻擊
 */
export function evoRespondAttack(roomId, playerId, response) {
  const s = getSocket();
  s.emit('evo:respondAttack', { roomId, playerId, response });
}

/**
 * 使用性狀能力
 */
export function evoUseTrait(roomId, playerId, creatureId, traitType, targetId = null) {
  const s = getSocket();
  s.emit('evo:useTrait', { roomId, playerId, creatureId, traitType, targetId });
}

/**
 * 請求演化論房間列表
 */
export function evoRequestRoomList() {
  const s = getSocket();
  s.emit('evo:requestRoomList');
}
```

#### 2. 添加演化論事件監聽函數

```javascript
/**
 * 監聽房間創建成功
 */
export function onEvoRoomCreated(callback) {
  return safeOn('evo:roomCreated', callback);
}

/**
 * 監聽加入房間成功
 */
export function onEvoJoinedRoom(callback) {
  return safeOn('evo:joinedRoom', callback);
}

/**
 * 監聽玩家加入
 */
export function onEvoPlayerJoined(callback) {
  return safeOn('evo:playerJoined', callback);
}

/**
 * 監聽玩家離開
 */
export function onEvoPlayerLeft(callback) {
  return safeOn('evo:playerLeft', callback);
}

/**
 * 監聽玩家準備狀態變更
 */
export function onEvoPlayerReady(callback) {
  return safeOn('evo:playerReady', callback);
}

/**
 * 監聽遊戲開始
 */
export function onEvoGameStarted(callback) {
  return safeOn('evo:gameStarted', callback);
}

/**
 * 監聽遊戲狀態更新
 */
export function onEvoGameState(callback) {
  return safeOn('evo:gameState', callback);
}

/**
 * 監聯生物創建
 */
export function onEvoCreatureCreated(callback) {
  return safeOn('evo:creatureCreated', callback);
}

/**
 * 監聽性狀添加
 */
export function onEvoTraitAdded(callback) {
  return safeOn('evo:traitAdded', callback);
}

/**
 * 監聽玩家跳過
 */
export function onEvoPlayerPassed(callback) {
  return safeOn('evo:playerPassed', callback);
}

/**
 * 監聽生物進食
 */
export function onEvoCreatureFed(callback) {
  return safeOn('evo:creatureFed', callback);
}

/**
 * 監聽連鎖效應
 */
export function onEvoChainTriggered(callback) {
  return safeOn('evo:chainTriggered', callback);
}

/**
 * 監聽攻擊待處理
 */
export function onEvoAttackPending(callback) {
  return safeOn('evo:attackPending', callback);
}

/**
 * 監聽攻擊結果
 */
export function onEvoAttackResolved(callback) {
  return safeOn('evo:attackResolved', callback);
}

/**
 * 監聽性狀使用
 */
export function onEvoTraitUsed(callback) {
  return safeOn('evo:traitUsed', callback);
}

/**
 * 監聽房間列表更新
 */
export function onEvoRoomListUpdated(callback) {
  return safeOn('evo:roomListUpdated', callback);
}

/**
 * 監聽錯誤訊息
 */
export function onEvoError(callback) {
  return safeOn('evo:error', callback);
}
```

### 驗收標準
1. 所有演化論 Socket 函數已添加
2. 函數可正確發送和接收 `evo:` 前綴的事件
3. 不影響現有本草遊戲的 Socket 功能
4. 程式碼風格與現有程式碼一致

### 相關檔案
- `frontend/src/services/socketService.js`

### 依賴工單
無

### 被依賴工單
- 0273, 0274
