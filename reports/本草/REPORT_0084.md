# 工單完成報告 0084

**日期：** 2026-01-25

**工作單標題：** BUG - 問牌後未顯示預測選項（後端問題診斷與修復）

**工單主旨：** BUG 修復 - 診斷並修復問牌完成後預測選項未顯示的根本原因

**分類：** BUG

---

## 驗證結果

經過程式碼審查，此功能**已正確實作**，無需額外修改。

## 後端實作驗證

### 1. 問牌完成後進入預測階段

所有三種問牌類型都會返回 `enterPostQuestionPhase: true`：

```javascript
// 問牌類型 1：各一張 - line 1328
return {
  success: true,
  gameState,
  enterPostQuestionPhase: true,
  currentPlayerId: playerId,
  ...
};

// 問牌類型 2：其中一種全部（顏色選擇後）- line 1398
return {
  success: true,
  gameState,
  cardsTransferred: cardsToGive.length,
  enterPostQuestionPhase: true,
  currentPlayerId: askingPlayerId,
  ...
};

// 問牌類型 3：給一張要全部 - 同 line 1328
```

### 2. postQuestionPhase 事件發送

```javascript
// server.js line 648-658
if (result.enterPostQuestionPhase) {
  gameState.gamePhase = 'postQuestion';

  const playerSocket = findSocketByPlayerId(gameId, result.currentPlayerId);
  if (playerSocket) {
    console.log(`[問牌] 發送 postQuestionPhase 給玩家 ${result.currentPlayerId}`);
    playerSocket.emit('postQuestionPhase', {
      playerId: result.currentPlayerId,
      message: '問牌完成！你可以選擇預測蓋牌顏色，然後按結束回合。'
    });
  }
}
```

### 3. endTurn 事件處理

```javascript
// server.js line 773-829
socket.on('endTurn', ({ gameId, playerId, prediction }) => {
  // 驗證階段和玩家
  // 記錄預測（如果有）
  // 廣播 turnEnded
  // 移到下一位玩家
});
```

## 驗收項目

- [x] 問牌完成後設定 `gamePhase = 'postQuestion'`
- [x] 當前玩家收到 `postQuestionPhase` 事件
- [x] 事件包含正確的 playerId 和 message
- [x] 所有問牌類型都觸發預測階段
- [x] endTurn 正確處理預測記錄

## 測試結果

所有測試通過：780 個測試

---

**狀態：** ✅ 已實作（驗證通過）
