# 工作單 0149

**日期：** 2026-01-27

**工作單標題：** 修復猜錯時遊戲流程錯誤 - 應繼續遊戲而非直接進入下一局

**工單主旨：** BUG 修復 - 猜牌猜錯時的遊戲流程不符合規則

**優先級：** 高

**依賴工單：** 無

**計畫書：** `docs/BUG_FIX_PLAN_GUESS_WRONG.md`

---

## 一、問題描述

### 現象
當玩家猜牌猜錯時，遊戲直接顯示結果面板和「下一局」按鈕，而不是讓未猜牌/未跟猜的玩家繼續遊戲。

### 重現步驟
1. 3 人遊戲（A、B、C）
2. 玩家 A 猜牌
3. 玩家 B 選擇「不跟」
4. 玩家 C 選擇「不跟」
5. 結果：猜錯
6. **BUG**: 顯示結果面板和「下一局」按鈕

### 期望行為（根據 GAME_RULES.md 第 5.5 節）
- 玩家 A 猜錯，退出當局（`isActive: false`）
- 玩家 B、C 沒有跟猜，仍在遊戲中（`isActive: true`）
- 遊戲應繼續，輪到玩家 B 行動
- **不應顯示「下一局」按鈕**

---

## 二、規則參考

根據 `docs/GAME_RULES.md` 第 5.5 節「猜錯處理」：

> - **結果**：猜牌玩家和所有跟猜的玩家都退出當局遊戲（`isActive: false`）
> - **遊戲狀態**：
>   - 如果還有其他玩家：**繼續當局遊戲**，輪到下一個玩家
>   - 如果沒有玩家留在遊戲中：當局結束，進入下一局

---

## 三、問題分析

### 3.1 後端邏輯（正確）

`backend/server.js` 的 `validateGuessResult()` 函數邏輯：

```javascript
if (isCorrect) {
    // 猜對處理
} else {
    // 猜錯處理
    gameState.players[playerIndex].isActive = false;  // 猜牌者退出
    followingPlayers.forEach(fpId => {
        gameState.players[fpIndex].isActive = false;  // 跟猜者退出
    });

    const activePlayers = gameState.players.filter(p => p.isActive);
    if (activePlayers.length === 0) {
        gameState.gamePhase = 'roundEnd';  // 所有人退出，局結束
    } else {
        moveToNextPlayer(gameState);  // 還有人，繼續遊戲 ✓
    }
}
```

後端邏輯是正確的。

### 3.2 前端邏輯（問題所在）

**問題 1**: `GameRoom.js` 收到 `guessResult` 事件時的處理：

```javascript
const unsubGuessResult = onGuessResult(({ isCorrect, ... }) => {
    setShowFollowGuessPanel(false);
    setGuessResultData({ ... });
    setShowRoundEnd(true);  // ← 問題：無條件設為 true
});
```

**問題 2**: 結果面板按鈕邏輯：

```javascript
{gameState.gamePhase !== GAME_PHASE_FINISHED ? (
    <button onClick={handleStartNextRound}>下一局</button>
) : (
    <button onClick={handleLeaveRoom}>離開房間</button>
)}
```

只判斷是否 `finished`，沒有考慮「猜錯但遊戲繼續」的情況。

---

## 四、修復方案

### 4.1 後端修改

**檔案**: `backend/server.js`

在 `validateGuessResult()` 返回值增加 `continueGame` 標記：

```javascript
return {
    success: true,
    gameState,
    isCorrect,
    scoreChanges,
    hiddenCards: gameState.hiddenCards,
    predictionResults,
    continueGame: !isCorrect && activePlayers.length > 0  // 新增
};
```

在發送 `guessResult` 事件時傳遞此標記。

### 4.2 前端修改

**檔案**: `frontend/src/components/GameRoom/GameRoom.js`

1. 新增狀態 `showBriefGuessResult`
2. 修改 `guessResult` 事件處理：

```javascript
const unsubGuessResult = onGuessResult(({ ..., continueGame }) => {
    setShowFollowGuessPanel(false);
    setGuessResultData({ ..., continueGame });

    if (continueGame) {
        // 猜錯但遊戲繼續：顯示簡短提示，3秒後自動關閉
        setShowBriefGuessResult(true);
        setTimeout(() => setShowBriefGuessResult(false), 3000);
    } else {
        // 猜錯且無人/猜對：顯示完整結果面板
        setShowRoundEnd(true);
    }
});
```

3. 新增「簡短猜錯提示」UI 元件

### 4.3 新增 UI 元件

簡短猜錯提示顯示內容：
- 「猜錯了！」標題
- 退出的玩家名單（猜牌者 + 跟猜者）
- 「遊戲繼續」提示
- 3 秒後自動關閉

---

## 五、修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `backend/server.js` | 在 `validateGuessResult()` 增加 `continueGame` 標記 |
| `backend/server.js` | 在 `guessResult` 事件傳遞 `continueGame` |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增 `showBriefGuessResult` 狀態 |
| `frontend/src/components/GameRoom/GameRoom.js` | 修改 `guessResult` 事件處理 |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增簡短猜錯提示 UI |
| `frontend/src/components/GameRoom/GameRoom.css` | 新增簡短提示樣式 |
| `frontend/src/controllers/LocalGameController.js` | 同步修改（單人模式）|

---

## 六、驗收標準

- [ ] 3 人遊戲：A 猜錯，B 不跟，C 不跟 → 遊戲繼續，輪到 B
- [ ] 3 人遊戲：A 猜錯，B 跟猜，C 不跟 → 遊戲繼續，輪到 C
- [ ] 3 人遊戲：A 猜錯，B 跟猜，C 跟猜 → 進入下一局（所有人退出）
- [ ] 4 人遊戲：同上各場景測試
- [ ] 簡短提示 3 秒後自動關閉
- [ ] 遊戲繼續時不顯示蓋牌顏色（保持隱藏）
- [ ] 退出的玩家正確標記為 `isActive: false`
- [ ] 輪到的下一位玩家可以正常操作

---

## 七、測試步驟

### 場景 1：猜錯但遊戲繼續
1. 創建 3 人遊戲（A、B、C）
2. 玩家 A 猜牌
3. 玩家 B 選擇「不跟」
4. 玩家 C 選擇「不跟」
5. A 猜錯
6. **預期**: 顯示簡短提示「猜錯了」，3 秒後關閉，輪到 B

### 場景 2：部分跟猜但仍有玩家
1. 創建 4 人遊戲（A、B、C、D）
2. 玩家 A 猜牌
3. 玩家 B 選擇「跟猜」
4. 玩家 C 選擇「不跟」
5. 玩家 D 選擇「跟猜」
6. A 猜錯
7. **預期**: A、B、D 退出，顯示簡短提示，輪到 C

### 場景 3：所有人跟猜
1. 創建 3 人遊戲（A、B、C）
2. 玩家 A 猜牌
3. 玩家 B 選擇「跟猜」
4. 玩家 C 選擇「跟猜」
5. A 猜錯
6. **預期**: 所有人退出，顯示完整結果面板，可點「下一局」

---

## 八、風險評估

- **低風險**：修改邏輯清晰，不影響猜對流程
- **向後兼容**：新增 `continueGame` 欄位，舊版前端會忽略

---

## 九、相關文件

- `docs/GAME_RULES.md` - 遊戲規則第 5.5 節
- `docs/BUG_FIX_PLAN_GUESS_WRONG.md` - 詳細修復計畫書
