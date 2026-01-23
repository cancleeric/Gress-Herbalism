# 工作單 0027

**日期：** 2026-01-23

**工作單標題：** 優化遊戲服務 - 使用動作處理器

**工單主旨：** 服務層 - 重構遊戲服務使用動作處理器

**內容：**

## 工作內容

1. **更新 `frontend/src/services/gameService.js`**

2. **重構 `processQuestionAction()` 函數**
   - 使用 `actionFactory` 取得問牌動作處理器
   - 調用處理器處理問牌動作
   - 簡化函數邏輯

3. **重構 `processGuessAction()` 函數**
   - 使用 `actionFactory` 取得猜牌動作處理器
   - 調用處理器處理猜牌動作
   - 簡化函數邏輯

4. **建立統一的動作處理函數**
   - `processAction(gameId, action)` 函數
   - 根據動作類型自動選擇對應的處理器
   - 統一處理所有類型的動作

5. **更新錯誤處理**
   - 使用動作處理器返回的錯誤訊息
   - 統一錯誤處理邏輯

6. **保持向後兼容**
   - 保留原有的 `processQuestionAction()` 和 `processGuessAction()` 函數
   - 內部調用新的統一處理函數

7. **使用 JSDoc 註解**
   - 更新函數的 JSDoc 註解

## 驗收標準

- [ ] 遊戲服務已重構使用動作處理器
- [ ] `processQuestionAction()` 已更新
- [ ] `processGuessAction()` 已更新
- [ ] 統一的動作處理函數已實作
- [ ] 錯誤處理已更新
- [ ] 向後兼容性保持
- [ ] 函數有完整的 JSDoc 註解
