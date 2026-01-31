# 工作單 0298

## 編號
0298

## 日期
2026-01-31

## 工作單標題
修復 validateTraitPlacement

## 工單主旨
修正卡牌邏輯中的性狀放置驗證

## 內容

### 工作說明
修復 `cardLogic.js` 中的 `validateTraitPlacement` 函數，解決 BUG-0287-002 和 BUG-0287-003。

### 問題描述

1. **BUG-0287-002**：寄生蟲放置對手生物時返回 false
2. **BUG-0287-003**：互動性狀有目標時返回 false

### 修復內容

1. **增加參數驗證**
   - 檢查 creature 是否有效
   - 檢查 traitType 是否有效

2. **修正寄生蟲邏輯**
   - 確認寄生蟲只能放在對手生物上
   - 確認邏輯判斷正確

3. **修正互動性狀邏輯**
   - 確認 targetCreature 參數正確處理
   - 增加互動連結重複檢查

4. **增加防禦性編程**
   - 使用 optional chaining (?.) 防止 undefined 錯誤

### 驗收標準
- [ ] 寄生蟲可放置在對手生物上
- [ ] 互動性狀可正確放置在兩隻自己的生物之間
- [ ] 所有邊界情況正確處理

### 依賴
- 工單 0296
- 工單 0297

### 相關文件
- `backend/logic/evolution/cardLogic.js`
