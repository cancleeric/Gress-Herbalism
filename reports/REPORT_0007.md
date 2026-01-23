# 報告書 0007

**工作單編號：** 0007

**完成日期：** 2026-01-23

## 完成內容摘要

建立 `frontend/src/utils/gameRules.js` 檔案，實作遊戲規則驗證功能。

### 實作內容

1. **`validatePlayerCount(count)`**
   - 驗證玩家數量是否在 3-4 人之間
   - 返回布林值

2. **`validateColorSelection(colors)`**
   - 驗證必須選擇 2 個顏色
   - 驗證兩個顏色必須不同
   - 驗證顏色必須是有效值（red, yellow, green, blue）
   - 返回布林值

3. **`validateQuestionType(questionType, colors, playerHand, targetPlayerHand)`**
   - 類型1（兩個顏色各一張）：任何玩家都可執行
   - 類型2（其中一種顏色全部）：任何玩家都可執行
   - 類型3（給一張要全部）：驗證發起玩家有要給的顏色的牌
   - 返回 `{ isValid, message }` 驗證結果物件

## 單元測試

### 測試結果
```
PASS src/utils/gameRules.test.js
  validatePlayerCount - 工作單 0007 (6 tests)
  validateColorSelection - 工作單 0007 (7 tests)
  validateQuestionType - 工作單 0007
    無效問牌類型 (2 tests)
    無效顏色選擇 (2 tests)
    類型1 - 兩個顏色各一張 (2 tests)
    類型2 - 其中一種顏色全部 (2 tests)
    類型3 - 給一張要全部 (4 tests)

Test Suites: 2 passed, 2 total
Tests:       71 passed, 71 total
```

## 遇到的問題與解決方案

無特殊問題。

## 驗收標準完成狀態

- [x] `gameRules.js` 檔案已建立
- [x] 所有驗證函數已實作
- [x] 驗證邏輯正確
- [x] 函數有完整的 JSDoc 註解
- [x] 錯誤訊息清晰明確

## 下一步計劃

繼續實作問牌邏輯處理（工作單 0008）。
