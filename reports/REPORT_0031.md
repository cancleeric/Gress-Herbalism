# 報告書 0031

**工作單編號：** 0031

**完成日期：** 2026-01-23

## 完成內容摘要

驗證遊戲規則驗證功能測試。測試檔案已在工作單 0007-0008 中建立並完成。

### 測試檔案

**`frontend/src/utils/gameRules.test.js`**

### 測試涵蓋範圍

1. **validatePlayerCount() 測試（6 個）**
   - 3 人應返回 true
   - 4 人應返回 true
   - 2 人應返回 false
   - 5 人應返回 false
   - 0 人應返回 false
   - 負數應返回 false

2. **validateColorSelection() 測試（7 個）**
   - 兩個不同有效顏色應返回 true
   - 相同顏色應返回 false
   - 只有一個顏色應返回 false
   - 超過兩個顏色應返回 false
   - 空陣列應返回 false
   - 無效顏色應返回 false
   - 非陣列應返回 false

3. **validateQuestionType() 測試（11 個）**
   - 無效問牌類型測試（2 個）
   - 無效顏色選擇測試（2 個）
   - 類型1 - 兩個顏色各一張（2 個）
   - 類型2 - 其中一種顏色全部（2 個）
   - 類型3 - 給一張要全部（4 個）

4. **validateGuess() 測試（7 個）**
   - 猜對應返回 isCorrect: true
   - 猜對（順序不同）應返回 isCorrect: true
   - 猜錯應返回 isCorrect: false
   - 重複顏色猜測應正確處理
   - 猜測數量不對應返回錯誤
   - 無效顏色應返回錯誤
   - 非陣列應返回錯誤

5. **checkGameEnd() 測試（3 個）**
   - 有獲勝者應返回 true
   - 遊戲階段為結束（無獲勝者）應返回 true
   - 遊戲進行中應返回 false

6. **mustGuess() 測試（4 個）**
   - 只剩一個玩家應返回 true
   - 還有多個玩家應返回 false
   - 所有玩家都在應返回 false
   - 無效的 players 應返回 false

7. **getNextPlayerIndex() 測試（6 個）**
   - 應返回下一個活躍玩家的索引
   - 應跳過已退出的玩家
   - 只有一個活躍玩家應返回該玩家索引
   - 沒有活躍玩家應返回 -1
   - 空陣列應返回 -1
   - 無效參數應返回 -1

## 單元測試

**Tests: 45 passed**（gameRules 測試）

**總計: 439 passed**（全部測試）

## 驗收標準完成狀態

- [x] 測試檔案已建立（gameRules.test.js）
- [x] 所有遊戲規則驗證功能都有測試
- [x] 所有測試都通過
- [x] 測試覆蓋率達到要求（100% 功能覆蓋）

## 備註

此工作單的內容已在工作單 0007-0008 中完成。本報告確認所有測試仍然有效且通過。
