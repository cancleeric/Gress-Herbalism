# 工作單 0301

## 編號
0301

## 日期
2026-01-31

## 工作單標題
修復 getTraitInfo

## 工單主旨
修正常數檔案中的性狀資訊查詢功能

## 內容

### 工作說明
修復 `shared/constants/evolution.js` 中的 `getTraitInfo` 函數，解決 BUG-0287-001。

### 問題描述

**BUG-0287-001**：getTraitInfo 返回的物件缺少 foodBonus 屬性

### 修復內容

1. **確保 foodBonus 永遠存在**
   - 使用 nullish coalescing (??) 提供預設值
   - 返回時確保包含 foodBonus

2. **增加參數驗證**
   - 處理無效的 traitType
   - 返回 null 或預設物件

3. **統一返回格式**
   - 確保返回物件結構一致
   - 包含所有必要屬性

### 驗收標準
- [ ] getTraitInfo 返回的物件永遠包含 foodBonus
- [ ] 無效的 traitType 返回 null
- [ ] 所有 19 種性狀都能正確查詢

### 依賴
- 工單 0297

### 相關文件
- `shared/constants/evolution.js`
