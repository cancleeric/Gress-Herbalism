# 報告書 0005

**工作單編號：** 0005

**完成日期：** 2026-01-23

## 完成內容摘要

在 `frontend/src/utils/cardUtils.js` 中實作發牌功能。

### 實作內容

1. **實作 `dealCards(deck, playerCount)` 函數**
   - 從牌組抽出 2 張蓋牌（設定 `isHidden: true`）
   - 將剩餘 12 張牌平均分配給所有玩家
   - 處理無法完全平均分配的情況（多餘的牌分給前面的玩家）
   - 不修改原陣列

2. **邊界情況處理**
   - 驗證玩家數量（3-4人）
   - 驗證牌組數量是否足夠
   - 無效參數時拋出錯誤

3. **返回結果**
   ```javascript
   {
     hiddenCards: Card[],      // 2張蓋牌（isHidden: true）
     playerHands: Card[][]     // 每個玩家的手牌陣列
   }
   ```

## 單元測試

### 測試結果
```
PASS src/utils/cardUtils.test.js
  createDeck - 工作單 0003 (11 tests)
  shuffleDeck - 工作單 0004 (6 tests)
  dealCards - 工作單 0005
    √ 應正確抽出 2 張蓋牌
    √ 蓋牌的 isHidden 應為 true
    √ 3 人遊戲時每人應有 4 張牌
    √ 4 人遊戲時每人應有 3 張牌
    √ 所有牌應被分配完畢
    √ 不應修改原牌組
    √ 玩家手牌不應包含蓋牌
    √ 玩家手牌的 isHidden 應為 false
    √ 玩家數量少於 3 人應拋出錯誤
    √ 玩家數量多於 4 人應拋出錯誤
    √ 牌組數量不足應拋出錯誤
    √ 所有牌的 id 應該是唯一的

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
```

## 遇到的問題與解決方案

無特殊問題。

## 驗收標準完成狀態

- [x] `dealCards()` 函數已實作
- [x] 可以正確抽出 2 張蓋牌
- [x] 剩餘牌可以平均分配給所有玩家
- [x] 處理無法完全平均分配的情況
- [x] 蓋牌的 `isHidden` 屬性為 `true`
- [x] 函數有完整的 JSDoc 註解

## 下一步計劃

繼續實作遊戲規則相關功能（工作單 0006）。
