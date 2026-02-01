# 工單 0361：斷線重連系統

## 基本資訊
- **工單編號**：0361
- **所屬計畫**：P2-D 品質保證
- **前置工單**：0346（Socket 整合）
- **預計影響檔案**：
  - `backend/services/evolution/reconnectionService.js`（新增）
  - `frontend/src/services/reconnectionHandler.js`（新增）

## 目標
實現斷線重連機制

## 詳細規格

### 後端
```javascript
// 遊戲狀態快照
class GameStateSnapshot {
  constructor(gameState, playerId) {
    this.gameId = gameState.id;
    this.playerId = playerId;
    this.phase = gameState.currentPhase;
    this.round = gameState.round;
    this.players = this.sanitizePlayers(gameState.players, playerId);
    this.foodPool = gameState.foodPool;
    this.timestamp = Date.now();
  }

  sanitizePlayers(players, myId) {
    // 隱藏其他玩家手牌內容
    return Object.entries(players).reduce((acc, [id, player]) => {
      acc[id] = id === myId ? player : {
        ...player,
        hand: player.hand.map(() => ({ hidden: true })),
      };
      return acc;
    }, {});
  }
}

// 重連處理
async handleReconnect(socket, gameId, playerId) {
  const snapshot = await this.getSnapshot(gameId, playerId);
  socket.emit('reconnect:state', snapshot);
}
```

### 前端
- 自動重連（指數退避）
- 重連進度顯示
- 狀態恢復動畫
- 離線行動佇列

## 驗收標準
1. [ ] 短時斷線自動重連
2. [ ] 狀態正確恢復
3. [ ] 不影響其他玩家
4. [ ] 超時正確處理
