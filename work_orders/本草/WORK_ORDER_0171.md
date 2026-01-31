# 工作單 0171

**編號**：0171

**日期**：2026-01-27

**工作單標題**：後端 — 猜錯時不洩露蓋牌 + 新增結果確認事件

**工單主旨**：修正後端猜牌結果邏輯，猜錯時不發送蓋牌答案，並新增 dismissGuessResult 事件

---

## 內容

### 背景

目前 `validateGuessResult` 不論猜對猜錯都會回傳 `hiddenCards`，導致猜錯時前端也能看到蓋牌答案，違反規則 5.5（猜錯時蓋牌保持隱藏）。另外需要新增一個 socket 事件，讓猜牌者點「繼續觀戰遊戲」時能通知所有人關閉結果面板。

### 工作內容

#### 1. 修改 `backend/server.js` — `validateGuessResult` 函數

在回傳值中，根據猜測結果決定是否回傳 `hiddenCards`：

```javascript
return {
  success: true,
  gameState,
  isCorrect,
  scoreChanges,
  hiddenCards: isCorrect ? gameState.hiddenCards : null,  // 猜錯時不回傳
  predictionResults,
  continueGame
};
```

#### 2. 修改 `guessResult` 事件發送

確認 `guessResult` 事件中 `hiddenCards` 依循上述邏輯：
- 猜對：發送 `hiddenCards`（公布答案）
- 猜錯：發送 `null`（不公布答案）

#### 3. 新增 `dismissGuessResult` socket 事件

```javascript
socket.on('dismissGuessResult', ({ gameId }) => {
  // 廣播給房間所有玩家，關閉結果面板
  io.to(gameId).emit('guessResultDismissed');
});
```

此事件用於猜錯但遊戲繼續時，猜牌者按下「繼續觀戰遊戲」按鈕後通知所有人關閉結果面板。

### 驗收標準

| 標準 | 說明 |
|------|------|
| 猜對時回傳 hiddenCards | `guessResult` 事件包含蓋牌資料 |
| 猜錯時不回傳 hiddenCards | `guessResult` 事件 hiddenCards 為 null |
| dismissGuessResult 事件 | 收到後廣播 guessResultDismissed |
| 既有後端測試通過 | 190/190 |

---

**相關計畫書**：`docs/BUG_FIX_PLAN_GUESS_WRONG.md`
