# 工作單 0379

## 基本資訊

| 項目 | 內容 |
|------|------|
| 編號 | 0379 |
| 日期 | 2026-02-07 |
| 標題 | 添加連線診斷功能 |
| 主旨 | Socket 連線問題修復 |
| 優先級 | P3 - 中 |
| 所屬計畫 | Socket 連線問題修復計畫書 |

---

## 問題描述

目前無法快速診斷連線問題原因，排查困難。需要添加診斷工具方便開發與除錯。

---

## 工作內容

### 1. 添加連線診斷函數

在 `frontend/src/services/socketService.js` 添加：

```javascript
/**
 * 診斷連線狀態
 * @returns {Object} 連線診斷資訊
 */
export function diagnoseConnection() {
  const socket = getSocket();

  return {
    socketUrl: SOCKET_URL,
    isConnected: socket?.connected ?? false,
    transport: socket?.io?.engine?.transport?.name ?? 'unknown',
    reconnectAttempts: socket?.io?.reconnectionAttempts ?? 0,
    hasLocalStorage: isLocalStorageAvailable(),
    savedRoom: getCurrentRoom(),
    timestamp: new Date().toISOString()
  };
}

/**
 * 檢查 localStorage 是否可用
 */
function isLocalStorageAvailable() {
  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
    return true;
  } catch (e) {
    return false;
  }
}
```

### 2. 開發模式下顯示連線狀態（可選）

可在開發模式顯示連線狀態指示器。

### 3. 控制台指令

添加全域診斷函數供控制台使用：
```javascript
if (process.env.NODE_ENV === 'development') {
  window.diagnoseSocket = diagnoseConnection;
}
```

---

## 驗收標準

- [ ] `diagnoseConnection` 函數已實作
- [ ] 可透過控制台執行 `diagnoseSocket()`
- [ ] 診斷資訊包含 Socket URL、連線狀態、傳輸方式
- [ ] 開發模式正常運作

---

## 相關檔案

```
frontend/src/services/socketService.js
```
