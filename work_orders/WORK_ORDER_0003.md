# 工作單 0003

**日期：** 2026-01-23

**工作單標題：** 建立牌組工具函數 - 牌組初始化

**工單主旨：** 工具函數 - 建立牌組初始化功能

**內容：**

## 工作內容

1. **建立 `frontend/src/utils/cardUtils.js` 檔案**

2. **實作 `createDeck()` 函數**
   - 根據 `shared/constants.js` 中的配置建立牌組
   - 建立14張牌：
     - 紅色2張（id: 'red-1', 'red-2'）
     - 黃色3張（id: 'yellow-1', 'yellow-2', 'yellow-3'）
     - 綠色4張（id: 'green-1', 'green-2', 'green-3', 'green-4'）
     - 藍色5張（id: 'blue-1', 'blue-2', 'blue-3', 'blue-4', 'blue-5'）
   - 每張牌的資料結構：
     ```javascript
     {
       id: string,
       color: 'red' | 'yellow' | 'green' | 'blue',
       isHidden: boolean  // 預設為 false
     }
     ```
   - 返回完整的牌組陣列

3. **使用 JSDoc 註解**
   - 為函數添加完整的 JSDoc 註解
   - 說明參數和返回值

4. **匯入常數**
   - 從 `shared/constants.js` 匯入必要的常數
   - 確保牌組配置可透過常數檔案修改

## 驗收標準

- [ ] `cardUtils.js` 檔案已建立
- [ ] `createDeck()` 函數可以正確建立14張牌
- [ ] 每張牌都有正確的 id、color 和 isHidden 屬性
- [ ] 函數有完整的 JSDoc 註解
- [ ] 可以從常數檔案匯入配置
