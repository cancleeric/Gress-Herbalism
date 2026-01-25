# 工作單 0091

**日期：** 2026-01-25

**工作單標題：** 預測陣列跨局清理

**工單主旨：** BUG 修復 - 確保新局開始時清理預測陣列

**計畫書：** [預測功能修復計畫書](../docs/PREDICTION_FIX_PLAN.md)

**優先級：** 高

---

## 問題描述

目前 `gameState.predictions` 陣列在新局開始時沒有被清理，導致預測資料跨局累積。

## 影響

- 預測陣列會隨遊戲進行持續增長
- 可能造成記憶體問題
- 雖然 `settlePredictions()` 使用 `round` 過濾，但資料冗餘

## 修改位置

`backend/server.js` - 新局初始化區塊

## 修改內容

在新局開始時加入：
```javascript
gameState.predictions = [];
```

## 驗證方式

1. 開始新局後檢查 `gameState.predictions` 是否為空
2. 確認上一局的預測不會出現在新局
3. 執行所有相關測試

## 驗收標準

- [ ] 新局開始時 predictions 陣列被清空
- [ ] 不影響當局預測記錄
- [ ] 所有現有測試通過
