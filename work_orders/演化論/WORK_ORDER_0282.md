# 工作單 0282

## 編號
0282

## 日期
2026-01-31

## 標題
確保 playerLeft 事件正確處理

## 主旨
BUG 修復 - 幽靈玩家問題

## 關聯計畫書
`BUG/BUG_PLAN_GHOST_PLAYER.md`

## 內容

### 問題
即使玩家離開房間，前端可能沒有正確處理 `evo:playerLeft` 事件，導致「幽靈玩家」仍顯示在房間中。

### 驗證項目

1. **後端**
   - 確認 `evo:playerLeft` 事件正確廣播到房間內所有 socket
   - 確認返回的 `room` 對象不包含已離開的玩家

2. **前端 EvolutionLobby**
   - 確認 `onEvoPlayerLeft` 監聽器正確設置
   - 確認收到事件後 `setRoom(updatedRoom)` 正確執行

3. **前端 EvolutionRoom**
   - 確認 `room` 狀態更新後正確傳遞給 `EvolutionLobby`

### 添加調試日誌

**後端 server.js**:
```javascript
socket.on('evo:leaveRoom', ({ roomId, playerId }) => {
  console.log('[演化論] 收到離開請求:', { roomId, playerId });
  const result = evolutionRoomManager.leaveRoom(roomId, playerId);
  console.log('[演化論] 離開結果:', {
    success: result.success,
    roomDeleted: result.roomDeleted,
    remainingPlayers: result.room?.players?.map(p => p.name)
  });
  // ...
});
```

**前端 EvolutionLobby.js**:
```javascript
const unsubPlayerLeft = onEvoPlayerLeft(({ playerId, room: updatedRoom }) => {
  console.log('[EvolutionLobby] 收到 playerLeft 事件');
  console.log('[EvolutionLobby] playerId:', playerId);
  console.log('[EvolutionLobby] updatedRoom players:', updatedRoom?.players?.map(p => p.name));
  setRoom(updatedRoom);
});
```

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`
- `backend/server.js`（日誌增強）

### 驗收標準
1. 玩家離開後，房間列表立即更新
2. 控制台顯示正確的事件流程日誌
3. 不會出現幽靈玩家

### 依賴工單
- 0279, 0280, 0281

### 被依賴工單
無
