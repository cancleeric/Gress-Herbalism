# 工作單 0383

## 基本資訊

| 項目 | 內容 |
|------|------|
| 編號 | 0383 |
| 日期 | 2026-02-07 |
| 標題 | 添加連線狀態枚舉 |
| 主旨 | Socket 連線狀態顯示問題修復 |
| 優先級 | P2 - 高 |
| 所屬計畫 | Socket 連線狀態顯示問題修復計畫書 |

---

## 問題描述

目前只有 `connected: true/false` 兩種狀態，無法區分「尚未連線」、「正在連線」、「已連線」、「已斷線」。

---

## 工作內容

### 1. 添加連線狀態枚舉

在 `frontend/src/services/socketService.js` 中：

```javascript
/**
 * 連線狀態枚舉
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
};

let connectionState = ConnectionState.DISCONNECTED;
```

### 2. 更新狀態追蹤

```javascript
// 在 initSocket 中
socket = io(SOCKET_URL, { ... });
connectionState = ConnectionState.CONNECTING;

socket.on('connect', () => {
  connectionState = ConnectionState.CONNECTED;
  // ...
});

socket.on('disconnect', () => {
  connectionState = ConnectionState.DISCONNECTED;
  // ...
});
```

### 3. 添加狀態獲取函數

```javascript
/**
 * 取得當前連線狀態
 * @returns {string} ConnectionState
 */
export function getConnectionState() {
  return connectionState;
}
```

---

## 驗收標準

- [ ] 能區分三種連線狀態
- [ ] `getConnectionState()` 正確返回狀態
- [ ] 診斷函數包含狀態資訊

---

## 相關檔案

```
frontend/src/services/socketService.js
```
