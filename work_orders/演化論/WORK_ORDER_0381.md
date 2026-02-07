# 工作單 0381

## 基本資訊

| 項目 | 內容 |
|------|------|
| 編號 | 0381 |
| 日期 | 2026-02-07 |
| 標題 | 改進 onConnectionChange 初始化邏輯 |
| 主旨 | Socket 連線狀態顯示問題修復 |
| 優先級 | P1 - 臨界 |
| 所屬計畫 | Socket 連線狀態顯示問題修復計畫書 |

---

## 問題描述

`onConnectionChange` 函數在 socket 正在連線過程中立即調用 callback，傳入 `false`，導致組件誤以為連線失敗。

---

## 工作內容

### 1. 修改 onConnectionChange 函數

在 `frontend/src/services/socketService.js` 中：

```javascript
// 修改前
export function onConnectionChange(callback) {
  connectionCallbacks.push(callback);
  if (socket) {
    callback(socket.connected);  // 問題：連線中時為 false
  }
  return () => { ... };
}

// 修改後
export function onConnectionChange(callback) {
  connectionCallbacks.push(callback);
  // 只在 socket 存在且已連線時才立即通知
  // 否則等待 connect 事件觸發
  if (socket && socket.connected) {
    callback(true);
  }
  // 不主動調用 callback(false)，讓組件自行處理初始狀態
  return () => { ... };
}
```

---

## 驗收標準

- [ ] 初始化時不會誤報斷線
- [ ] 實際連線成功時會通知 `true`
- [ ] 實際斷線時會通知 `false`

---

## 相關檔案

```
frontend/src/services/socketService.js
```
