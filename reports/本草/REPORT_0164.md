# 報告書 0164

**工作單編號**：0164

**完成日期**：2026-01-27

**工作單標題**：server.js 架構重構 (階段一)

---

## 一、完成內容摘要

將 `backend/server.js` 中的遊戲邏輯提取為獨立的純函數模組，並建立完整的單元測試。

### 建立的模組

1. **`backend/logic/cardLogic.js`** - 牌組處理邏輯
   - 常數：`CARD_COLORS`, `CARD_COUNTS`, `TOTAL_CARDS`, `HIDDEN_CARDS_COUNT`
   - 函數：`createDeck()`, `shuffleDeck()`, `dealCards()`

2. **`backend/logic/gameLogic.js`** - 遊戲規則邏輯
   - 常數：`MIN_PLAYERS`, `MAX_PLAYERS`, `WINNING_SCORE`
   - 函數：`canStartGame()`, `isGuessCorrect()`, `getNextPlayerIndex()`, `isOnlyOnePlayerLeft()`, `checkWinCondition()`, `validateQuestionAction()`

3. **`backend/logic/scoreLogic.js`** - 計分邏輯
   - 常數：`GUESS_CORRECT_POINTS`, `FOLLOW_CORRECT_POINTS`, `FOLLOW_WRONG_POINTS`
   - 函數：`calculateGuessScore()`, `calculateFollowGuessScore()`, `applyScoreChange()`, `calculateRoundScores()`

4. **`backend/logic/index.js`** - 統一入口，匯出所有模組

### 實作差異

工單原規劃從 `shared/constants.js` 導入常數，但實際 `server.js` 的後端邏輯使用 CommonJS（`require`），而 `shared/constants.js` 使用 ES Modules（`export`），兩者不相容。因此各 logic 模組自行定義常數，與 `server.js` 中的現有定義保持一致。

---

## 二、遇到的問題與解決方案

| 問題 | 解決方案 |
|------|----------|
| `shared/constants.js` 使用 ES Modules，後端使用 CommonJS | logic 模組自行定義常數，與 server.js 保持一致 |
| `isGuessCorrect` 的 hiddenCards 參數為物件陣列（含 `{ color }` 屬性），非純字串 | 函數內部先 `.map(c => c.color)` 取出顏色再排序比較 |
| 工單規劃的 API 簽名與 server.js 實際實作不完全一致 | 以 server.js 實際邏輯為準進行提取 |

---

## 三、測試結果

### 測試檔案

1. `backend/__tests__/logic/cardLogic.test.js` - 13 個測試
2. `backend/__tests__/logic/gameLogic.test.js` - 25 個測試
3. `backend/__tests__/logic/scoreLogic.test.js` - 17 個測試

### 測試結果

```
Test Suites: 3 passed, 3 total
Tests:       68 passed, 68 total (全部通過 ✓)
Time:        1.031s
```

### 測試覆蓋範圍

- **cardLogic.js**：常數驗證、createDeck 牌組產生、shuffleDeck 洗牌不可變性、dealCards 3/4 人發牌
- **gameLogic.js**：canStartGame 邊界條件、isGuessCorrect 正確/錯誤/null/長度不符、getNextPlayerIndex 循環與跳過不活躍、isOnlyOnePlayerLeft、checkWinCondition 達標/未達/自訂分數、validateQuestionAction 完整驗證
- **scoreLogic.js**：常數驗證、calculateGuessScore、calculateFollowGuessScore、applyScoreChange 最低 0 分保護、calculateRoundScores 含/不含跟猜者

---

## 四、建立的檔案

| 檔案 | 類型 | 說明 |
|------|------|------|
| `backend/logic/cardLogic.js` | 新增 | 牌組處理純函數 |
| `backend/logic/gameLogic.js` | 新增 | 遊戲規則純函數 |
| `backend/logic/scoreLogic.js` | 新增 | 計分邏輯純函數 |
| `backend/logic/index.js` | 新增 | 模組統一入口 |
| `backend/__tests__/logic/cardLogic.test.js` | 新增 | cardLogic 單元測試 |
| `backend/__tests__/logic/gameLogic.test.js` | 新增 | gameLogic 單元測試 |
| `backend/__tests__/logic/scoreLogic.test.js` | 新增 | scoreLogic 單元測試 |

---

## 五、下一步計劃

1. **階段二（工單 0168）**：提取 `handlers/` 層（roomHandler, gameHandler, questionHandler, guessHandler）
2. **階段三（工單 0169）**：重構 `server.js` 使用新模組，簡化檔案結構
3. 後續可讓 `server.js` 直接 `require('./logic')` 引用提取出的純函數

---

*報告完成時間: 2026-01-27*
