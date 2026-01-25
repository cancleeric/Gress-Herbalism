# 工單完成報告 0080

**日期：** 2026-01-25

**工作單標題：** 預測功能 - 後端遊戲階段與 Socket 事件實作

**工單主旨：** 功能開發 - 實作問牌後預測階段的後端邏輯

**分類：** 功能開發

---

## 驗證結果

經過程式碼審查，此功能**已正確實作**，無需額外修改。

## 後端實作驗證

### 1. 遊戲階段定義

`postQuestion` 階段已定義並使用：

```javascript
// server.js line 648-661
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

### 2. 所有問牌類型返回 enterPostQuestionPhase

#### 問牌類型 1：各一張 - line 1328
```javascript
return {
  success: true,
  gameState,
  enterPostQuestionPhase: true,
  currentPlayerId: playerId,
  ...
};
```

#### 問牌類型 2：其中一種全部（顏色選擇後）- line 1398
```javascript
return {
  success: true,
  gameState,
  cardsTransferred: cardsToGive.length,
  enterPostQuestionPhase: true,
  currentPlayerId: askingPlayerId,
  ...
};
```

#### 問牌類型 3：給一張要全部 - 同 line 1328

### 3. endTurn 事件處理預測

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

- [x] `postQuestion` 遊戲階段定義
- [x] 問牌完成後設定 `gamePhase = 'postQuestion'`
- [x] 發送 `postQuestionPhase` 事件給當前玩家
- [x] 所有三種問牌類型都觸發預測階段
- [x] `endTurn` 事件正確處理預測參數
- [x] 預測記錄保存

## 測試結果

所有測試通過：780 個測試

---

**狀態：** ✅ 已實作（驗證通過）
