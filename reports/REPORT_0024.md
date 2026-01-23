# 報告書 0024

**工作單編號：** 0024

**完成日期：** 2026-01-23

## 完成內容摘要

建立問牌動作處理器模組，將問牌邏輯從 gameService 中分離出來。

### 實作內容

1. **`frontend/src/utils/actionHandlers/questionAction.js`**
   - 主要處理函數 `handleQuestionAction()`
   - 接收遊戲狀態和問牌動作作為參數
   - 返回處理後的遊戲狀態和結果

2. **三種問牌類型處理函數（策略模式）**
   - `handleType1()`: 兩個顏色各一張
   - `handleType2()`: 其中一種顏色全部
   - `handleType3()`: 給一張要全部
   - `questionTypeHandlers` 映射表，方便擴展

3. **輔助函數**
   - `updatePlayerHands()`: 更新玩家手牌
   - `updatePlayersState()`: 更新玩家狀態陣列
   - `createHistoryEntry()`: 建立歷史記錄條目
   - `generateResultMessage()`: 產生結果訊息

4. **`frontend/src/utils/actionHandlers/index.js`**
   - 模組統一匯出入口
   - 方便未來擴展其他動作處理器

5. **擴展性設計**
   - 使用策略模式實作問牌類型處理
   - 在可擴展點添加 `// TODO: 可擴展點` 註釋
   - 新增問牌類型時只需實作處理函數並添加到映射表

## 單元測試

**Tests: 396 passed**（新增 20 個測試）

測試涵蓋：
- handleType1 測試（3 個）
  - 兩種顏色各一張
  - 只有一種顏色
  - 沒有指定顏色
- handleType2 測試（4 個）
  - 取得指定顏色全部
  - 未指定時優先 color1
  - color1 沒有時選 color2
  - 兩種都沒有
- handleType3 測試（3 個）
  - 給一張要全部
  - 沒有要給的顏色
  - 目標沒有要拿的顏色
- questionTypeHandlers 測試（1 個）
- handleQuestionAction 測試（8 個）
  - 成功執行
  - 不是自己回合
  - 玩家不存在
  - 未知問牌類型
  - 記錄歷史
  - 更新手牌
  - 類型3處理
- 結果訊息測試（2 個）

## 驗收標準完成狀態

- [x] `questionAction.js` 檔案已建立
- [x] 問牌動作處理器已實作
- [x] 三種問牌類型的處理函數已實作
- [x] 要牌邏輯正確
- [x] 遊戲歷史記錄正確
- [x] 使用策略模式
- [x] 函數有完整的 JSDoc 註解
- [x] 擴展性標記已添加
