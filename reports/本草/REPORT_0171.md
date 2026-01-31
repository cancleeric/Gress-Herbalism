# 完成報告 0171

**工作單編號**：0171

**完成日期**：2026-01-27

**完成內容摘要**：

修正後端猜牌結果邏輯，猜錯時不發送蓋牌答案，並新增 dismissGuessResult 事件。

### 修改內容

#### 1. 修改 `validateGuessResult` 回傳值（server.js:1710）

將 `hiddenCards` 改為條件回傳：

```javascript
hiddenCards: isCorrect ? gameState.hiddenCards : null,  // 猜錯時不洩露蓋牌
```

- 猜對：回傳 `gameState.hiddenCards`（公布蓋牌答案）
- 猜錯：回傳 `null`（不洩露答案）

#### 2. 新增 `dismissGuessResult` socket 事件（server.js:1068-1071）

```javascript
socket.on('dismissGuessResult', ({ gameId }) => {
  io.to(gameId).emit('guessResultDismissed');
});
```

當猜牌者按下「繼續觀戰遊戲」按鈕時，發送此事件通知所有玩家關閉結果面板。

### 遇到的問題與解決方案

無特殊問題。

### 測試結果

- 後端測試：**190/190 通過**
- 所有既有測試未受影響

### 下一步計劃

- 執行工單 0172：前端猜牌結果面板重構
