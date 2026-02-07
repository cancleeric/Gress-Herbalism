# 工作單 0382

## 基本資訊

| 項目 | 內容 |
|------|------|
| 編號 | 0382 |
| 日期 | 2026-02-07 |
| 標題 | 優化 Lobby 連線狀態處理 |
| 主旨 | Socket 連線狀態顯示問題修復 |
| 優先級 | P1 - 臨界 |
| 所屬計畫 | Socket 連線狀態顯示問題修復計畫書 |

---

## 問題描述

Lobby 組件在收到斷線通知時立即顯示錯誤訊息，沒有給予連線重試的寬限期，導致用戶在正常載入時也會短暫看到錯誤訊息。

---

## 工作內容

### 1. 修改 Lobby.js 連線狀態處理

在 `frontend/src/components/common/Lobby/Lobby.js` 中：

添加延遲顯示錯誤的邏輯：

```javascript
// 添加 ref 來追蹤延遲 timer
const disconnectTimerRef = useRef(null);

// 修改 useEffect 中的連線狀態處理
const unsubConnect = onConnectionChange((connected) => {
  setIsConnected(connected);

  // 清除之前的延遲 timer
  if (disconnectTimerRef.current) {
    clearTimeout(disconnectTimerRef.current);
    disconnectTimerRef.current = null;
  }

  if (!connected) {
    // 延遲 3 秒後才顯示錯誤，給予重連時間
    disconnectTimerRef.current = setTimeout(() => {
      setError('與伺服器斷線，請確認後端是否啟動');
    }, 3000);
  } else {
    setError('');
  }
});
```

### 2. 清理 timer

在組件卸載時清理 timer：

```javascript
return () => {
  // 清理延遲 timer
  if (disconnectTimerRef.current) {
    clearTimeout(disconnectTimerRef.current);
  }
  // 其他清理...
};
```

---

## 驗收標準

- [ ] 初始載入時不會閃現錯誤訊息
- [ ] 實際斷線 3 秒後才顯示錯誤
- [ ] 連線成功時自動清除錯誤
- [ ] 組件卸載時正確清理 timer

---

## 相關檔案

```
frontend/src/components/common/Lobby/Lobby.js
```
