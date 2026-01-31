# 報告書 0004

**工作單編號：** 0004

**完成日期：** 2026-01-23

## 完成內容摘要

在 `frontend/src/utils/cardUtils.js` 中實作洗牌功能。

### 實作內容

1. **實作 `shuffleDeck(deck)` 函數**
   - 使用 Fisher-Yates (Knuth) shuffle 演算法
   - 時間複雜度：O(n)，空間複雜度：O(n)
   - 不修改原陣列，返回新陣列
   - 添加 `// TODO: 可擴展點` 註釋

2. **JSDoc 註解**
   - 完整的函數說明
   - 參數和返回值類型
   - 使用範例

## 單元測試

### 測試檔案
- `frontend/src/utils/cardUtils.test.js`

### 測試結果
```
PASS src/utils/cardUtils.test.js
  createDeck - 工作單 0003
    √ 應建立 14 張牌
    √ 每張牌應有正確的屬性
    √ 所有牌的 isHidden 應為 false
    √ 應有正確數量的各顏色牌
    √ 紅色應有 2 張牌
    √ 黃色應有 3 張牌
    √ 綠色應有 4 張牌
    √ 藍色應有 5 張牌
    √ 每張牌的 id 應符合格式 "顏色-編號"
    √ 所有牌的 id 應該是唯一的
    √ 牌的 id 應與 color 一致
  shuffleDeck - 工作單 0004
    √ 洗牌後應返回相同數量的牌
    √ 洗牌不應修改原陣列
    √ 洗牌後應包含所有原有的牌
    √ 洗牌應產生不同順序（多次測試確保隨機性）
    √ 空陣列洗牌應返回空陣列
    √ 單張牌洗牌應返回相同的牌

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

## 遇到的問題與解決方案

無特殊問題。

## 驗收標準完成狀態

- [x] `shuffleDeck()` 函數已實作
- [x] 函數可以正確打亂牌組順序
- [x] 洗牌結果具有隨機性
- [x] 函數不修改原陣列
- [x] 函數有完整的 JSDoc 註解

## 下一步計劃

繼續實作發牌功能（工作單 0005）。
