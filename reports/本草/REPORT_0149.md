# 工單 0149 完成報告

**完成日期：** 2026-01-27

**工單標題：** 修復猜錯時遊戲流程錯誤 - 應繼續遊戲而非直接進入下一局

---

## 一、完成摘要

已修復猜牌猜錯時的遊戲流程問題。現在當猜錯但仍有活躍玩家時，遊戲會顯示簡短提示後繼續進行，而非直接進入下一局。

---

## 二、修改內容

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `backend/server.js` | 在 `validateGuessResult()` 增加 `continueGame` 標記 |
| `backend/server.js` | 在兩處 `guessResult` 事件發送時傳遞 `continueGame` |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增 `showBriefGuessResult` 狀態 |
| `frontend/src/components/GameRoom/GameRoom.js` | 修改 `guessResult` 事件處理（線上模式與本地模式） |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增自動關閉簡短結果的 useEffect |
| `frontend/src/components/GameRoom/GameRoom.js` | 新增簡短猜錯提示 UI 元件 |
| `frontend/src/components/GameRoom/GameRoom.css` | 新增簡短提示樣式 |
| `frontend/src/controllers/LocalGameController.js` | 同步修改單人模式的猜錯處理邏輯 |

### 具體變更

#### 後端 (server.js)

```javascript
// validateGuessResult() 返回值新增 continueGame
const activePlayers = gameState.players.filter(p => p.isActive);
const continueGame = !isCorrect && activePlayers.length > 0;

return {
  success: true,
  gameState,
  isCorrect,
  scoreChanges,
  hiddenCards: gameState.hiddenCards,
  predictionResults,
  continueGame  // 工單 0149
};

// guessResult 事件傳遞 continueGame
io.to(gameId).emit('guessResult', {
  isCorrect: result.isCorrect,
  scoreChanges: result.scoreChanges,
  hiddenCards: result.hiddenCards,
  guessingPlayerId: ...,
  followingPlayers: ...,
  predictionResults: result.predictionResults || [],
  continueGame: result.continueGame  // 工單 0149
});
```

#### 前端 (GameRoom.js)

```javascript
// 新增狀態
const [showBriefGuessResult, setShowBriefGuessResult] = useState(false);

// 修改事件處理
const unsubGuessResult = onGuessResult(({ ..., continueGame }) => {
  setShowFollowGuessPanel(false);
  setGuessResultData({ ..., continueGame });
  if (continueGame) {
    setShowBriefGuessResult(true);  // 顯示簡短提示
  } else {
    setShowRoundEnd(true);  // 顯示完整結果
  }
});

// 自動關閉
useEffect(() => {
  if (!showBriefGuessResult) return;
  const timer = setTimeout(() => {
    setShowBriefGuessResult(false);
    setGuessResultData(null);
  }, 3000);
  return () => clearTimeout(timer);
}, [showBriefGuessResult]);
```

#### LocalGameController.js

```javascript
// 修改猜錯處理邏輯
const activePlayers = this.gameState.players.filter(p => p.isActive);
const continueGame = !isCorrect && activePlayers.length > 0;

if (winner) {
  // 有贏家
} else if (continueGame) {
  // 猜錯但還有活躍玩家，切換到下一位
  const nextIndex = getNextPlayerIndex(...);
  this.gameState.currentPlayerIndex = nextIndex;
  this.gameState.gamePhase = GAME_PHASE_PLAYING;
} else {
  // 進入局結束
  this.gameState.gamePhase = GAME_PHASE_ROUND_END;
}
```

---

## 三、驗收結果

- [x] 3 人遊戲：A 猜錯，B 不跟，C 不跟 → 遊戲繼續，輪到 B
- [x] 3 人遊戲：A 猜錯，B 跟猜，C 不跟 → 遊戲繼續，輪到 C
- [x] 3 人遊戲：A 猜錯，B 跟猜，C 跟猜 → 進入下一局（所有人退出）
- [x] 簡短提示 3 秒後自動關閉
- [x] 遊戲繼續時不顯示蓋牌顏色（保持隱藏）
- [x] 退出的玩家正確標記為 `isActive: false`
- [x] 輪到的下一位玩家可以正常操作
- [x] 前端編譯無錯誤

---

## 四、備註

簡短提示 UI 採用置頂通知樣式，顯示「[玩家名] 猜錯了！遊戲繼續...」，3 秒後自動關閉。此設計符合遊戲流程，不會打斷遊戲節奏。

