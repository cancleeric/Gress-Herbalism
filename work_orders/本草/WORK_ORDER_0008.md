# 工作單 0008

**日期：** 2026-01-23

**工作單標題：** 建立遊戲規則驗證函數 - 猜牌驗證

**工單主旨：** 工具函數 - 建立猜牌驗證功能

**內容：**

## 工作內容

1. **在 `frontend/src/utils/gameRules.js` 中新增函數**

2. **實作 `validateGuess(guessedColors, hiddenCards)` 函數**
   - 驗證猜牌是否正確
   - 接收猜測的顏色陣列和蓋牌陣列作為參數
   - 驗證邏輯：
     - 必須猜測2個顏色
     - 顏色可以是重複的（例如：兩個紅色）
     - 比對猜測的顏色與蓋牌的顏色
     - 不考慮順序（例如：猜 [red, blue] 和 [blue, red] 視為相同）
   - 返回驗證結果物件：
     ```javascript
     {
       isCorrect: boolean,
       message: string  // 結果訊息
     }
     ```

3. **實作 `checkGameEnd(gameState)` 函數**
   - 檢查遊戲是否結束
   - 接收遊戲狀態作為參數
   - 檢查條件：
     - 是否有玩家猜對（winner 不為 null）
     - **是否只剩一個玩家且該玩家猜錯（winner 為 null，gamePhase 為 'finished'）**
     - 是否只剩一個玩家仍在遊戲中（這種情況下該玩家必須猜牌）
   - 返回布林值

4. **實作 `mustGuess(gameState)` 函數**（新增）
   - 檢查當前玩家是否必須執行猜牌動作
   - 接收遊戲狀態作為參數
   - 檢查條件：是否只剩一個玩家仍在遊戲中
   - 返回布林值（true 表示必須猜牌，不能選擇問牌）

5. **實作 `getNextPlayerIndex(currentIndex, players, gameState)` 函數**
   - 取得下一個輪到的玩家索引
   - 接收當前玩家索引、玩家陣列、遊戲狀態作為參數
   - 跳過已退出遊戲的玩家
   - 返回下一個玩家的索引

6. **使用 JSDoc 註解**
   - 為所有函數添加完整的 JSDoc 註解

## 驗收標準

- [ ] 所有猜牌驗證函數已實作
- [ ] `validateGuess()` 可以正確驗證猜牌結果
- [ ] `checkGameEnd()` 可以正確判斷遊戲結束條件（包括沒有獲勝者的情況）
- [ ] `mustGuess()` 函數已實作，可以正確判斷是否只剩一個玩家
- [ ] `getNextPlayerIndex()` 可以正確取得下一個玩家
- [ ] 函數有完整的 JSDoc 註解
