# 報告書 0282

## 工作單編號
0282

## 完成日期
2026-01-31

## 完成內容摘要

確保 playerLeft 事件正確處理，添加調試日誌。

### 已完成項目

1. **前端 EvolutionLobby.js 增強日誌**
```javascript
const unsubPlayerLeft = onEvoPlayerLeft(({ playerId, room: updatedRoom }) => {
  console.log('[EvolutionLobby] 收到 playerLeft 事件');
  console.log('[EvolutionLobby] 離開的 playerId:', playerId);
  console.log('[EvolutionLobby] 更新後的玩家:', updatedRoom?.players?.map(p => p.name));
  setRoom(updatedRoom);
});
```

2. **後端 server.js 增強日誌**
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

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`
- `backend/server.js`

## 驗收結果
- [x] 調試日誌已添加
- [x] 可以追蹤事件流程

## 下一步
- 測試驗證 BUG 是否修復
