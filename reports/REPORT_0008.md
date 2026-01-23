# 報告書 0008

**工作單編號：** 0008

**完成日期：** 2026-01-23

## 完成內容摘要

在 `frontend/src/utils/gameRules.js` 中新增猜牌驗證相關函數。

### 實作內容

1. **`validateGuess(guessedColors, hiddenCards)`**
   - 驗證猜牌是否正確
   - 支援重複顏色猜測
   - 不考慮順序比對
   - 返回 `{ isCorrect, message }`

2. **`checkGameEnd(gameState)`**
   - 檢查遊戲是否結束
   - 有獲勝者：返回 true
   - 遊戲階段為結束（無獲勝者）：返回 true

3. **`mustGuess(gameState)`**
   - 檢查當前玩家是否必須猜牌
   - 只剩一個玩家時返回 true

4. **`getNextPlayerIndex(currentIndex, players)`**
   - 取得下一個輪到的玩家索引
   - 自動跳過已退出的玩家

## 單元測試

### 測試結果
```
PASS src/utils/gameRules.test.js
  validateGuess - 工作單 0008 (7 tests)
  checkGameEnd - 工作單 0008 (3 tests)
  mustGuess - 工作單 0008 (4 tests)
  getNextPlayerIndex - 工作單 0008 (6 tests)

Test Suites: 2 passed, 2 total
Tests:       91 passed, 91 total
```

## 遇到的問題與解決方案

無特殊問題。

## 驗收標準完成狀態

- [x] 所有猜牌驗證函數已實作
- [x] `validateGuess()` 可以正確驗證猜牌結果
- [x] `checkGameEnd()` 可以正確判斷遊戲結束條件（包括沒有獲勝者的情況）
- [x] `mustGuess()` 函數已實作，可以正確判斷是否只剩一個玩家
- [x] `getNextPlayerIndex()` 可以正確取得下一個玩家
- [x] 函數有完整的 JSDoc 註解

## 下一步計劃

建立遊戲服務 - 遊戲狀態管理（工作單 0009）。
