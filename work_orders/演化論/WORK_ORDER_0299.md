# 工作單 0299

## 編號
0299

## 日期
2026-01-31

## 工作單標題
修復 addTrait

## 工單主旨
修正生物邏輯中的性狀添加功能

## 內容

### 工作說明
修復 `creatureLogic.js` 中的 `addTrait` 函數，解決 BUG-0288-001。

### 問題描述

**BUG-0288-001**：addTrait 無法正確添加性狀到生物

### 修復內容

1. **增加參數驗證**
   - 檢查 creature 物件是否有效
   - 檢查 creature.traits 是否存在
   - 檢查 traitType 是否有效

2. **改善錯誤處理**
   - 提供更清楚的錯誤訊息
   - 確保失敗時返回原始生物

3. **驗證返回值**
   - 確保 updatedCreature 正確包含新性狀
   - 確保 foodNeeded 正確更新

### 驗收標準
- [ ] 可成功添加一般性狀
- [ ] 可成功添加互動性狀
- [ ] 性狀添加後 traits 陣列長度增加
- [ ] 食量正確更新

### 依賴
- 工單 0298

### 相關文件
- `backend/logic/evolution/creatureLogic.js`
