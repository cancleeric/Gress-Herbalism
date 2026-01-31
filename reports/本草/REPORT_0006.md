# 報告書 0006

**工作單編號：** 0006

**完成日期：** 2026-01-23

## 完成內容摘要

在 `frontend/src/utils/cardUtils.js` 中實作手牌管理輔助函數。

### 實作內容

1. **`getCardsByColor(hand, color)`** - 從手牌中篩選指定顏色的牌
2. **`hasCard(hand, cardId)`** - 檢查手牌中是否包含指定的牌
3. **`removeCard(hand, cardId)`** - 從手牌中移除指定的牌（不修改原陣列）
4. **`addCard(hand, card)`** - 將牌加入手牌（不修改原陣列）
5. **`countCardsByColor(hand, color)`** - 計算手牌中指定顏色的牌數

所有函數都有完整的 JSDoc 註解。

## 單元測試

### 測試結果
```
PASS src/utils/cardUtils.test.js
  手牌管理輔助函數 - 工作單 0006
    getCardsByColor
      √ 應返回指定顏色的所有牌
      √ 沒有該顏色時應返回空陣列
      √ 空手牌應返回空陣列
    hasCard
      √ 手牌中有該牌時應返回 true
      √ 手牌中沒有該牌時應返回 false
      √ 空手牌應返回 false
    removeCard
      √ 應正確移除指定的牌
      √ 不應修改原陣列
      √ 移除不存在的牌應返回相同的陣列
      √ 空手牌應返回空陣列
    addCard
      √ 應正確加入牌
      √ 不應修改原陣列
      √ 新牌應加在陣列最後
      √ 空手牌加入牌後應有一張牌
    countCardsByColor
      √ 應正確計算指定顏色的牌數
      √ 沒有該顏色時應返回 0
      √ 空手牌應返回 0

Test Suites: 1 passed, 1 total
Tests:       46 passed, 46 total
```

## 遇到的問題與解決方案

無特殊問題。

## 驗收標準完成狀態

- [x] 所有手牌管理輔助函數已實作
- [x] 函數可以正確操作手牌
- [x] 函數不修改原陣列（除了檢查類函數）
- [x] 所有函數有完整的 JSDoc 註解

## 下一步計劃

繼續實作遊戲規則相關功能（工作單 0007）。
