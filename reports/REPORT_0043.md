# 完成報告 0043

**日期：** 2026-01-24

**工作單標題：** Bug 修復 - 最後一個玩家強制猜牌邏輯

**工單主旨：** Bug 修復 - 修正最後一個玩家的遊戲結束處理邏輯

## 檢查結果

經過代碼審查，確認此功能已正確實現。

### 後端邏輯（backend/server.js）

#### 猜牌處理函數 processGuessAction
```javascript
// 猜錯，玩家出局
gameState.players[playerIndex].isActive = false;

// 檢查是否還有活躍玩家
const activePlayers = gameState.players.filter(p => p.isActive);
if (activePlayers.length === 0) {
  // 沒有人獲勝
  gameState.winner = null;
  gameState.gamePhase = 'finished';
} else {
  // 還有活躍玩家
  moveToNextPlayer(gameState);
}
```

#### moveToNextPlayer 函數
- 正確尋找下一個活躍玩家
- 若只剩一人，該玩家會成為當前回合玩家

### 前端邏輯（frontend/src/components/GameRoom/GameRoom.js）

#### mustGuess 函數
```javascript
const mustGuess = useCallback(() => {
  return getActivePlayerCount() <= 1;
}, [getActivePlayerCount]);
```

#### 按鈕顯示邏輯
```javascript
{canAct && !onlyGuess && (
  <button onClick={handleOpenQuestion}>問牌</button>
)}
{canAct && (
  <button onClick={handleOpenGuess}>
    猜牌
    {onlyGuess && <span>（必須猜牌）</span>}
  </button>
)}
```

#### 遊戲結束顯示
```javascript
{gameState.winner ? (
  <p>獲勝者: {winner.name}</p>
) : (
  <p>遊戲結束，沒有獲勝者</p>
)}
```

## 驗收結果

- [x] 只剩一個玩家時，該玩家只能選擇猜牌（問牌選項不可用）
- [x] 最後一個玩家猜對 → 該玩家獲勝
- [x] 最後一個玩家猜錯 → 遊戲結束，沒有獲勝者
- [x] 前端正確顯示「遊戲結束，沒有獲勝者」的訊息
- [x] 遊戲歷史正確記錄此情況

## 結論

此工單的功能已在先前的開發中正確實現，無需額外修改。
