# 報告書 0025

**工作單編號：** 0025

**完成日期：** 2026-01-23

## 完成內容摘要

建立猜牌動作處理器模組，處理猜牌動作的核心邏輯。

### 實作內容

1. **`frontend/src/utils/actionHandlers/guessAction.js`**
   - 主要處理函數 `handleGuessAction()`
   - 接收遊戲狀態和猜牌動作作為參數
   - 返回處理後的遊戲狀態和結果

2. **輔助函數**
   - `hasOnlyOneActivePlayer()`: 檢查是否只剩一個活躍玩家
   - `getActivePlayerCount()`: 取得活躍玩家數量
   - `mustGuess()`: 檢查玩家是否必須猜牌
   - `getHiddenCardsForPlayer()`: 取得蓋牌答案（供猜牌者查看）
   - `createHistoryEntry()`: 建立歷史記錄條目
   - `revealCards()`: 揭示蓋牌

3. **猜對處理 `handleCorrectGuess()`**
   - 設定獲勝者為猜牌玩家
   - 設定遊戲階段為 'finished'
   - 公布正確答案（揭示蓋牌）
   - 記錄歷史

4. **猜錯處理 `handleIncorrectGuess()`**
   - 標記玩家為非活躍狀態
   - 蓋牌保持隱藏狀態
   - 檢查剩餘玩家數量
   - 只剩一個玩家且猜錯 → 遊戲結束，沒有獲勝者
   - 還有其他玩家 → 繼續遊戲，切換到下一個玩家

5. **index.js 更新**
   - 匯出 guessAction 模組

## 單元測試

**Tests: 417 passed**（新增 21 個測試）

測試涵蓋：
- hasOnlyOneActivePlayer 測試（3 個）
- getActivePlayerCount 測試（1 個）
- mustGuess 測試（2 個）
- 猜對處理測試（3 個）
  - 應該獲勝
  - 應該公布正確答案
  - 顏色順序可不同
- 猜錯處理測試（4 個）
  - 玩家應退出遊戲
  - 蓋牌保持隱藏
  - 切換到下一個玩家
  - 只剩一人猜錯時無獲勝者
- 驗證測試（3 個）
  - 不是自己回合
  - 玩家不存在
  - 玩家已退出
- 歷史記錄測試（2 個）
- getHiddenCardsForPlayer 測試（3 個）

## 驗收標準完成狀態

- [x] `guessAction.js` 檔案已建立
- [x] 猜牌動作處理器已實作
- [x] 猜牌時，猜牌者可以查看正確答案（蓋牌的實際顏色）
- [x] 猜牌驗證邏輯正確
- [x] 檢查是否只剩一個玩家：如果只剩一個玩家，該玩家必須執行猜牌動作
- [x] 猜對處理：公布正確答案給所有玩家
- [x] 猜錯處理：將兩張蓋牌蓋回桌面（保持隱藏狀態）
- [x] 猜錯處理：如果只剩一個玩家且猜錯，遊戲結束但沒有獲勝者（winner: null）
- [x] 遊戲結束邏輯正確（包括沒有獲勝者的情況）
- [x] 遊戲歷史記錄正確
- [x] 函數有完整的 JSDoc 註解
- [x] 擴展性標記已添加
