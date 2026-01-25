# 工作單 0107

**日期：** 2026-01-25

**工作單標題：** 新增連線狀態 UI 提示

**工單主旨：** 功能增強 - 在遊戲畫面顯示連線狀態

**計畫書：** [Socket 連線同步修復計畫書](../docs/SOCKET_SYNC_FIX_PLAN.md)

**優先級：** 中

---

## 功能描述

在遊戲畫面右上角或適當位置顯示連線狀態指示器：

```
🟢 已連線
🟡 重連中...
🔴 已斷線
```

## 修改內容

### 1. 新增連線狀態 Hook

**檔案：** `frontend/src/hooks/useConnectionStatus.js`（新增）

```javascript
import { useState, useEffect } from 'react';
import { getSocket } from '../services/socketService';

export function useConnectionStatus() {
  const [status, setStatus] = useState('connected'); // connected | reconnecting | disconnected

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => setStatus('connected');
    const handleDisconnect = () => setStatus('disconnected');
    const handleReconnecting = () => setStatus('reconnecting');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnecting);
    socket.on('reconnect', handleConnect);

    // 初始狀態
    setStatus(socket.connected ? 'connected' : 'disconnected');

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnecting);
      socket.off('reconnect', handleConnect);
    };
  }, []);

  return status;
}
```

### 2. 新增連線狀態組件

**檔案：** `frontend/src/components/ConnectionStatus/ConnectionStatus.js`（新增）

```javascript
import React from 'react';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import './ConnectionStatus.css';

function ConnectionStatus() {
  const status = useConnectionStatus();

  const statusConfig = {
    connected: { icon: '🟢', text: '已連線', className: 'connected' },
    reconnecting: { icon: '🟡', text: '重連中...', className: 'reconnecting' },
    disconnected: { icon: '🔴', text: '已斷線', className: 'disconnected' }
  };

  const config = statusConfig[status];

  return (
    <div className={`connection-status ${config.className}`}>
      <span className="status-icon">{config.icon}</span>
      <span className="status-text">{config.text}</span>
    </div>
  );
}

export default ConnectionStatus;
```

### 3. 整合到 GameRoom

**檔案：** `frontend/src/components/GameRoom/GameRoom.js`

在適當位置加入 `<ConnectionStatus />` 組件。

## 測試項目

- [ ] 連線狀態正確顯示
- [ ] 斷線時狀態變更
- [ ] 重連中狀態顯示
- [ ] 重連成功後恢復連線狀態

## 驗收標準

- [ ] 連線狀態 UI 正確顯示
- [ ] 狀態變化即時反映
- [ ] 樣式美觀不干擾遊戲
