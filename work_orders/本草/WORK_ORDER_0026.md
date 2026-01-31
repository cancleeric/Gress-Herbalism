# 工作單 0026

**日期：** 2026-01-23

**工作單標題：** 建立動作處理器工廠

**工單主旨：** 工具函數 - 建立動作處理器的工廠模式

**內容：**

## 工作內容

1. **建立 `frontend/src/utils/actionHandlers/actionFactory.js` 檔案**

2. **實作動作處理器工廠**
   - 建立 `createActionHandler()` 函數
   - 根據動作類型返回對應的處理器
   - 支援的動作類型：
     - 'question' -> questionAction handler
     - 'guess' -> guessAction handler

3. **實作動作處理統一接口**
   - 所有動作處理器都遵循相同的接口
   - 接收參數：`(gameState, action)`
   - 返回結果：`{ success: boolean, gameState: GameState, message: string }`

4. **實作錯誤處理**
   - 處理未知的動作類型
   - 處理處理器執行錯誤
   - 返回適當的錯誤訊息

5. **使用工廠模式**
   - 方便未來新增新的動作類型
   - 只需在工廠中註冊新的處理器

6. **使用 JSDoc 註解**
   - 為所有函數添加完整的 JSDoc 註解

7. **添加擴展性標記**
   - 在可擴展的地方添加 `// TODO: 可擴展點` 註釋

## 驗收標準

- [ ] `actionFactory.js` 檔案已建立
- [ ] 動作處理器工廠已實作
- [ ] 可以根據動作類型返回對應處理器
- [ ] 動作處理統一接口已實作
- [ ] 錯誤處理已實作
- [ ] 使用工廠模式
- [ ] 函數有完整的 JSDoc 註解
- [ ] 擴展性標記已添加
