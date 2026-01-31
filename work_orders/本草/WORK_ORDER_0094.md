# 工作單 0094

**日期：** 2026-01-25

**工作單標題：** 移除未使用的 Socket 事件

**工單主旨：** 程式碼清理 - 移除未使用的 onPredictionsSettled 事件

**計畫書：** [預測功能修復計畫書](../docs/PREDICTION_FIX_PLAN.md)

**優先級：** 低

---

## 問題描述

```javascript
// frontend/src/services/socketService.js
export function onPredictionsSettled(callback) { ... }
```

此函數已定義但從未被使用，造成程式碼冗餘。

## 修改位置

`frontend/src/services/socketService.js`

## 修改前確認

1. 全域搜尋 `onPredictionsSettled` 確認未使用
2. 確認 `predictionsSettled` 事件在後端也未使用

## 修改內容

刪除未使用的函數：
```javascript
// 刪除以下程式碼
export function onPredictionsSettled(callback) {
  socket.on('predictionsSettled', callback);
  return () => socket.off('predictionsSettled', callback);
}
```

## 驗證方式

1. 確認全域無使用
2. 移除後所有測試通過
3. 預測功能正常運作

## 驗收標準

- [ ] 未使用程式碼已移除
- [ ] 所有現有測試通過
- [ ] 預測功能正常
