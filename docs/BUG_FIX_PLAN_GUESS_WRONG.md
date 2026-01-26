# BUG 修復計畫書：猜錯時遊戲流程錯誤

## 問題描述

**BUG 現象**：當玩家猜牌猜錯時，遊戲直接顯示「下一局」按鈕，而不是讓未猜牌/未跟猜的玩家繼續遊戲。

**正確行為**（根據 GAME_RULES.md 第 5.5 節）：
- 猜牌者和所有跟猜的玩家退出當局遊戲（`isActive: false`）
- 如果還有其他玩家（未跟猜的玩家）：**繼續當局遊戲**，輪到下一個活躍玩家
- 只有當所有玩家都退出時，才進入下一局

---

## 問題分析

### 後端程式碼分析 (backend/server.js)

`validateGuessResult` 函數 (line 1614-1702) 的邏輯：

```javascript
if (isCorrect) {
    // 猜對處理...
} else {
    // 猜錯處理
    scoreChanges[guessingPlayerId] = 0;
    gameState.players[playerIndex].isActive = false;  // 猜牌者退出

    followingPlayers.forEach(fpId => {
        // 跟猜者扣分並退出
        gameState.players[fpIndex].isActive = false;
    });

    // 檢查是否還有活躍玩家
    const activePlayers = gameState.players.filter(p => p.isActive);
    if (activePlayers.length === 0) {
        gameState.gamePhase = 'roundEnd';  // 所有人退出，局結束
    } else {
        moveToNextPlayer(gameState);  // 還有人，繼續遊戲
    }
}
```

**後端邏輯看起來正確**，問題可能在：
1. 後端無論如何都會發送 `guessResult` 事件
2. 前端收到事件後無條件顯示結果面板

### 前端程式碼分析 (frontend/src/components/GameRoom/GameRoom.js)

**問題點 1**：收到 `guessResult` 事件時的處理 (line 459-463)

```javascript
const unsubGuessResult = onGuessResult(({ isCorrect, ... }) => {
    setShowFollowGuessPanel(false);
    setGuessResultData({ ... });
    setShowRoundEnd(true);  // ← 問題：無條件設為 true
});
```

**問題點 2**：結果面板顯示邏輯 (line 1790-1800)

```javascript
{gameState.gamePhase !== GAME_PHASE_FINISHED ? (
    <button onClick={handleStartNextRound}>下一局</button>  // ← 只要不是 finished 就顯示「下一局」
) : (
    <button onClick={handleLeaveRoom}>離開房間</button>
)}
```

### 根本原因

1. **前端無條件顯示結果面板**：收到 `guessResult` 事件後，不管 `gamePhase` 是什麼，都顯示結果面板
2. **結果面板按鈕邏輯錯誤**：只判斷是否 `finished`，沒有考慮猜錯但遊戲繼續的情況
3. **缺少「猜錯但遊戲繼續」的 UI 流程**

---

## 修復方案

### 方案概述

當猜錯時，根據是否還有活躍玩家，顯示不同的 UI：

| 情況 | gamePhase | 前端顯示 |
|------|-----------|---------|
| 猜錯 + 還有活躍玩家 | `playing` | 簡短提示「猜錯了」→ 自動關閉 → 繼續遊戲 |
| 猜錯 + 無活躍玩家 | `roundEnd` | 完整結果面板 + 「下一局」按鈕 |
| 猜對 | `roundEnd` 或 `finished` | 完整結果面板 |

### 修改內容

#### 1. 後端：增加 `continueGame` 標記

**檔案**: `backend/server.js`

在 `validateGuessResult` 返回值中增加 `continueGame` 標記：

```javascript
return {
    success: true,
    gameState,
    isCorrect,
    scoreChanges,
    hiddenCards: gameState.hiddenCards,
    predictionResults,
    continueGame: !isCorrect && activePlayers.length > 0  // 新增：是否繼續遊戲
};
```

在發送 `guessResult` 事件時傳遞此標記：

```javascript
io.to(gameId).emit('guessResult', {
    isCorrect: result.isCorrect,
    scoreChanges: result.scoreChanges,
    hiddenCards: result.hiddenCards,
    guessingPlayerId: followState.guessingPlayerId,
    followingPlayers: followState.followingPlayers,
    predictionResults: result.predictionResults || [],
    continueGame: result.continueGame  // 新增
});
```

#### 2. 前端：根據 `continueGame` 決定顯示方式

**檔案**: `frontend/src/components/GameRoom/GameRoom.js`

修改 `guessResult` 事件處理：

```javascript
const unsubGuessResult = onGuessResult(({ isCorrect, scoreChanges, hiddenCards, guessingPlayerId, followingPlayers, predictionResults, continueGame }) => {
    setShowFollowGuessPanel(false);
    setGuessResultData({ isCorrect, scoreChanges, hiddenCards, guessingPlayerId, followingPlayers, predictionResults, continueGame });

    if (continueGame) {
        // 猜錯但遊戲繼續：顯示簡短提示
        setShowBriefGuessResult(true);  // 新狀態
        // 3秒後自動關閉
        setTimeout(() => setShowBriefGuessResult(false), 3000);
    } else {
        // 猜錯且無人/猜對：顯示完整結果面板
        setShowRoundEnd(true);
    }
});
```

#### 3. 前端：新增「簡短猜錯提示」元件

顯示內容：
- 「猜錯了！」標題
- 蓋牌顏色（保持隱藏，不揭露）
- 退出的玩家名單
- 「遊戲繼續」提示
- 3 秒後自動關閉

---

## 實施步驟

1. **修改後端** `server.js`
   - 在 `validateGuessResult` 計算 `continueGame` 標記
   - 在 `guessResult` 事件中傳遞 `continueGame`

2. **修改前端** `GameRoom.js`
   - 新增 `showBriefGuessResult` 狀態
   - 修改 `guessResult` 事件處理邏輯
   - 新增「簡短猜錯提示」UI 元件

3. **修改前端** `GameRoom.css`
   - 新增簡短提示的樣式

4. **測試場景**
   - 3 人遊戲：A 猜錯，B 不跟，C 不跟 → 遊戲應繼續（輪到 B）
   - 3 人遊戲：A 猜錯，B 跟猜，C 不跟 → 遊戲應繼續（輪到 C）
   - 3 人遊戲：A 猜錯，B 跟猜，C 跟猜 → 進入下一局（所有人退出）

---

## 相關檔案

- `backend/server.js` - 後端猜牌結果處理
- `frontend/src/components/GameRoom/GameRoom.js` - 前端遊戲房間
- `frontend/src/components/GameRoom/GameRoom.css` - 樣式
- `docs/GAME_RULES.md` - 遊戲規則參考

---

## 風險評估

- **低風險**：修改邏輯清晰，不影響其他功能
- **向後兼容**：新增 `continueGame` 欄位，舊版前端會忽略

---

## 預計影響

- 修復猜錯時的遊戲流程
- 提升遊戲體驗（符合規則預期）
- 不影響現有的猜對流程

---

**建立日期**：2026-01-27
**建立者**：Claude
**狀態**：待實施
