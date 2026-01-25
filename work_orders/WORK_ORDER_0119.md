# 工作單 0119

**日期：** 2026-01-25

**工作單標題：** 前端斷線與重連 UI 提示

**工單主旨：** 功能增強 - 顯示連線狀態和重連進度提示

**計畫書：** [斷線重連問題修復計畫書](../docs/RECONNECT_FIX_PLAN.md)

**優先級：** 中

**依賴工單：** 0115, 0116

---

## 一、問題描述

目前斷線和重連過程中，用戶沒有任何視覺反饋：

1. 不知道自己是否已斷線
2. 不知道是否正在重連
3. 不知道重連是否成功/失敗

---

## 二、解決方案

新增 **ConnectionStatus** 組件，顯示連線狀態和重連提示。

### 2.1 新增 ConnectionStatus 組件

**檔案：** `frontend/src/components/ConnectionStatus/ConnectionStatus.js`

```javascript
import React, { useState, useEffect } from 'react';
import { onConnectionChange } from '../../services/socketService';
import './ConnectionStatus.css';

/**
 * 連線狀態提示組件
 */
function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    const unsubscribe = onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setIsReconnecting(false);
        setReconnectAttempt(0);
      }
    });

    // 監聽重連嘗試
    const socket = getSocket();

    const handleReconnectAttempt = (attempt) => {
      setIsReconnecting(true);
      setReconnectAttempt(attempt);
    };

    const handleReconnect = () => {
      setIsReconnecting(false);
      setReconnectAttempt(0);
    };

    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);

    return () => {
      unsubscribe();
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
    };
  }, []);

  // 連線正常時不顯示
  if (isConnected && !isReconnecting) {
    return null;
  }

  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="connection-status-content">
        {isReconnecting ? (
          <>
            <div className="spinner"></div>
            <span>重新連線中... (第 {reconnectAttempt} 次嘗試)</span>
          </>
        ) : (
          <>
            <div className="warning-icon">!</div>
            <span>連線已中斷</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectionStatus;
```

### 2.2 樣式檔案

**檔案：** `frontend/src/components/ConnectionStatus/ConnectionStatus.css`

```css
.connection-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 12px 20px;
  text-align: center;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.connection-status.disconnected {
  background-color: #ef4444;
  color: white;
}

.connection-status.connected {
  background-color: #22c55e;
  color: white;
}

.connection-status-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.warning-icon {
  width: 20px;
  height: 20px;
  background-color: white;
  color: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}
```

### 2.3 新增重連成功提示

**檔案：** `frontend/src/components/ConnectionStatus/ReconnectSuccess.js`

```javascript
import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';

/**
 * 重連成功提示組件
 * @param {boolean} show - 是否顯示
 * @param {function} onHide - 隱藏時的回調
 */
function ReconnectSuccess({ show, onHide }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="connection-status connected">
      <div className="connection-status-content">
        <span>重連成功！</span>
      </div>
    </div>
  );
}

export default ReconnectSuccess;
```

### 2.4 在 App.js 中使用

**檔案：** `frontend/src/App.js`

```javascript
import ConnectionStatus from './components/ConnectionStatus/ConnectionStatus';

function App() {
  return (
    <div className="App">
      <ConnectionStatus />
      {/* ... 其他內容 ... */}
    </div>
  );
}
```

### 2.5 重連失敗處理

**檔案：** `frontend/src/components/Lobby/Lobby.js`（修改）

```javascript
// 監聽重連失敗
useEffect(() => {
  const unsubReconnectFailed = onReconnectFailed(({ reason, message }) => {
    setIsReconnecting(false);
    // 顯示錯誤訊息
    setError(message || '重連失敗，請重新加入房間');
    // 清除 localStorage
    clearCurrentRoom();
  });

  return () => unsubReconnectFailed();
}, []);
```

---

## 三、修改清單

| 檔案 | 修改內容 |
|------|---------|
| `frontend/src/components/ConnectionStatus/ConnectionStatus.js` | 新增檔案 |
| `frontend/src/components/ConnectionStatus/ConnectionStatus.css` | 新增檔案 |
| `frontend/src/components/ConnectionStatus/ReconnectSuccess.js` | 新增檔案 |
| `frontend/src/components/ConnectionStatus/index.js` | 新增檔案（匯出） |
| `frontend/src/App.js` | 引入 ConnectionStatus |
| `frontend/src/components/Lobby/Lobby.js` | 處理重連失敗 |

---

## 四、UI 狀態流程

```
正常連線          斷線中            重連中             重連成功
  (無顯示)   →   紅色橫幅    →    紅色橫幅      →   綠色橫幅
              「連線已中斷」    「重新連線中...」    「重連成功！」
                                 (第 X 次嘗試)      (3秒後消失)


重連失敗
  →  紅色橫幅 + 錯誤訊息
     「重連失敗，請重新加入房間」
```

---

## 五、測試案例

### 案例 1：短暫斷線後自動重連

**步驟：**
1. 玩家在房間中
2. 模擬網路斷線（可用開發者工具的 Network 面板）
3. 恢復網路

**預期結果：**
- 斷線時顯示「連線已中斷」
- 重連時顯示「重新連線中...」
- 重連成功顯示「重連成功！」
- 3 秒後提示消失

### 案例 2：重連失敗

**步驟：**
1. 玩家在房間中
2. 後端關閉房間
3. 前端嘗試重連

**預期結果：**
- 顯示「重連失敗，請重新加入房間」
- 自動跳回大廳

### 案例 3：長時間斷線

**步驟：**
1. 玩家在房間中
2. 斷線超過 60 秒

**預期結果：**
- 持續顯示重連嘗試次數
- 最終顯示「重連失敗」

---

## 六、驗收標準

- [ ] ConnectionStatus 組件正確顯示連線狀態
- [ ] 斷線時顯示紅色警告橫幅
- [ ] 重連中顯示嘗試次數
- [ ] 重連成功顯示綠色提示並自動消失
- [ ] 重連失敗顯示錯誤訊息
- [ ] 所有測試案例通過

---

## 七、注意事項

1. **z-index：**
   - 設為 9999 確保顯示在最上層
   - 不會被其他 modal 遮擋

2. **動畫效果：**
   - 使用 slideDown 動畫提升 UX
   - 使用 spinner 動畫表示載入中

3. **無障礙：**
   - 考慮加入 aria-live 屬性
   - 確保顏色對比度足夠

4. **效能：**
   - 只在需要時渲染
   - 避免不必要的重渲染
