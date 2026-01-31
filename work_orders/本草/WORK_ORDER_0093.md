# 工作單 0093

**日期：** 2026-01-25

**工作單標題：** 預測功能斷線重連處理

**工單主旨：** 功能增強 - 確保斷線重連後預測狀態正確恢復

**計畫書：** [預測功能修復計畫書](../docs/PREDICTION_FIX_PLAN.md)

**優先級：** 中

---

## 問題描述

如果玩家在 `postQuestion` 階段斷線重連，`postQuestionStates` Map 中的狀態可能導致：
- 玩家無法看到預測選項
- 或卡在預測階段無法繼續

## 修改位置

1. `backend/server.js` - 重連處理區塊
2. `frontend/src/components/GameRoom/GameRoom.js` - 狀態恢復

## 修改內容

### 後端
```javascript
// 在 rejoinRoom 或 reconnect 處理中
const postQuestionState = postQuestionStates.get(gameId);
if (postQuestionState && postQuestionState.playerId === playerId) {
  // 重新發送 postQuestionPhase 事件
  socket.emit('postQuestionPhase', {
    playerId: playerId,
    message: '問牌完成！你可以選擇預測蓋牌顏色，然後按結束回合。'
  });
}
```

### 前端
```javascript
// 在收到 gameState 時檢查
useEffect(() => {
  if (gameState.gamePhase === 'postQuestion' && isMyTurn()) {
    setShowPrediction(true);
  }
}, [gameState.gamePhase]);
```

## 驗證方式

1. 在預測選項顯示時重新整理頁面
2. 重連後應該仍然看到預測選項
3. 能正常完成預測流程

## 驗收標準

- [ ] 斷線重連後正確恢復預測 UI
- [ ] 能正常結束回合
- [ ] 不影響其他玩家的遊戲狀態
- [ ] 所有現有測試通過
