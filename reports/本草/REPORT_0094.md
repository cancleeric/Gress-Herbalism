# 工單完成報告 0094

**日期：** 2026-01-25

**工作單標題：** 移除未使用的 Socket 事件

**工單主旨：** 程式碼清理 - 移除未使用的 onPredictionsSettled 事件

**分類：** 程式碼清理

---

## 完成項目

### 驗證未使用

1. 搜尋 `onPredictionsSettled` - 僅在 socketService.js 定義
2. 搜尋 `predictionsSettled` - 後端未發送此事件
3. 確認預測結算使用 `guessResult` 事件的 `predictionResults` 欄位

### 移除內容

`frontend/src/services/socketService.js` - 刪除未使用函數

```javascript
// 已刪除
export function onPredictionsSettled(callback) {
  const s = getSocket();
  s.on('predictionsSettled', callback);
  return () => s.off('predictionsSettled', callback);
}
```

## 驗證結果

- [x] 未使用程式碼已移除
- [x] 所有現有測試通過
- [x] 預測功能正常

---

**狀態：** ✅ 已完成
