# 工作單 0285

## 編號
0285

## 日期
2026-01-31

## 工作單標題
後端支援 firebaseUid 玩家查找

## 工單主旨
BUG 修復 - 演化論遊戲無法開始（後端玩家查找增強）

## 內容

### 問題描述
後端 `evolutionRoomManager.js` 中的玩家查找方法只支援 `player.id` 比對，需要增加 `firebaseUid` 支援以確保相容性。

### 修改項目

1. **修改 setReady 方法**
   - 支援使用 `id` 或 `firebaseUid` 查找玩家：
     ```javascript
     const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
     ```

2. **修改 startGame 方法**
   - 驗證房主時支援 `firebaseUid`：
     ```javascript
     const isHost = room.hostPlayerId === hostPlayerId ||
                    room.players.find(p => p.isHost && p.firebaseUid === hostPlayerId);
     ```

3. **修改 leaveRoom 方法**
   - 支援使用 `firebaseUid` 查找玩家：
     ```javascript
     const playerIndex = room.players.findIndex(p => p.id === playerId || p.firebaseUid === playerId);
     ```

4. **修改 processAction 方法**
   - 確保遊戲動作使用正確的玩家識別

### 修改檔案
- `backend/services/evolutionRoomManager.js`

### 驗收標準
- [ ] setReady 可以正確識別玩家
- [ ] startGame 可以正確驗證房主
- [ ] leaveRoom 可以正確移除玩家
- [ ] 所有遊戲動作可以正確處理

### 依賴工單
- 工單 0283（EvolutionLobby.js 修復）
- 工單 0284（EvolutionRoom.js 修復）

### 參考文件
- `work_orders/演化論/BUG/BUG_PLAN_EVOLUTION_START.md`
