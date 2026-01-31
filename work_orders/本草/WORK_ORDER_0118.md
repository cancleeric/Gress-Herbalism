# 工作單 0118

**日期：** 2026-01-25

**工作單標題：** 重連時序優化 - beforeunload 處理

**工單主旨：** 功能增強 - 透過 beforeunload 事件改善重連時序

**計畫書：** [斷線重連問題修復計畫書](../docs/RECONNECT_FIX_PLAN.md)

**優先級：** 中

**依賴工單：** 0115

---

## 一、問題描述

目前的重連機制存在**時序競爭**問題：

```
T0:       玩家按 F5 重整頁面
T0+10ms:  舊 socket disconnect 事件觸發
T0+50ms:  後端處理 disconnect → 玩家被移除/標記斷線
T0+100ms: 新 socket 建立
T0+200ms: 嘗試重連 → 可能已經被移除了
```

問題：後端不知道這是「預期的重整」還是「意外斷線」，無法做出最佳處理。

---

## 二、解決方案

使用 **beforeunload** 事件通知後端「玩家正在重整頁面」，給予更長的寬限期。

### 2.1 前端：發送 playerRefreshing 事件

**檔案：** `frontend/src/components/GameRoom/GameRoom.js`

```javascript
import { useEffect } from 'react';
import { getSocket } from '../../services/socketService';

// 在 GameRoom 組件內
useEffect(() => {
  const socket = getSocket();

  const handleBeforeUnload = () => {
    if (socket && gameId && playerId) {
      // 使用 sendBeacon 確保訊息送出
      // 注意：socket.emit 可能來不及發送，使用 sendBeacon 更可靠
      const data = JSON.stringify({ gameId, playerId, type: 'refreshing' });
      navigator.sendBeacon('/api/player-refreshing', data);

      // 同時嘗試 socket emit（作為備援）
      socket.emit('playerRefreshing', { gameId, playerId });
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [gameId, playerId]);
```

**檔案：** `frontend/src/components/Lobby/Lobby.js`

（同樣的邏輯）

### 2.2 後端：處理 playerRefreshing 事件

**檔案：** `backend/server.js`

```javascript
// 新增：儲存正在重整的玩家
const refreshingPlayers = new Map(); // Map<`${gameId}:${playerId}`, timestamp>
const REFRESHING_GRACE_PERIOD = 30000; // 30 秒額外寬限期

// Socket 事件
socket.on('playerRefreshing', ({ gameId, playerId }) => {
  console.log(`玩家 ${playerId} 正在重整頁面`);
  refreshingPlayers.set(`${gameId}:${playerId}`, Date.now());

  // 30 秒後自動清除標記
  setTimeout(() => {
    refreshingPlayers.delete(`${gameId}:${playerId}`);
  }, REFRESHING_GRACE_PERIOD);
});

// 修改 handlePlayerDisconnect
function handlePlayerDisconnect(socket, gameId, playerId) {
  const refreshingKey = `${gameId}:${playerId}`;
  const isRefreshing = refreshingPlayers.has(refreshingKey);

  if (isRefreshing) {
    console.log(`[重整] 玩家 ${playerId} 是預期的重整，給予額外寬限期`);
    // 清除標記，避免重複使用
    refreshingPlayers.delete(refreshingKey);
  }

  // ... 原有的斷線處理邏輯 ...
  // 如果 isRefreshing 為 true，可以給予更長的寬限期
}
```

### 2.3 後端：API 端點（備援）

**檔案：** `backend/server.js`（或新建 route）

```javascript
// 使用 express 處理 sendBeacon 請求
app.post('/api/player-refreshing', express.json(), (req, res) => {
  const { gameId, playerId, type } = req.body;

  if (type === 'refreshing' && gameId && playerId) {
    console.log(`[API] 玩家 ${playerId} 正在重整頁面`);
    refreshingPlayers.set(`${gameId}:${playerId}`, Date.now());

    setTimeout(() => {
      refreshingPlayers.delete(`${gameId}:${playerId}`);
    }, 30000);
  }

  res.status(200).end();
});
```

---

## 三、修改清單

| 檔案 | 修改內容 |
|------|---------|
| `frontend/src/components/GameRoom/GameRoom.js` | 新增 beforeunload 處理 |
| `frontend/src/components/Lobby/Lobby.js` | 新增 beforeunload 處理 |
| `backend/server.js` | 新增 `refreshingPlayers` Map |
| `backend/server.js` | 新增 `playerRefreshing` Socket 事件處理 |
| `backend/server.js` | 新增 `/api/player-refreshing` API 端點 |
| `backend/server.js` | 修改 `handlePlayerDisconnect` 函數 |

---

## 四、時序圖（修復後）

```
┌─────────────────────────────────────────────────────────────┐
│ 玩家按 F5 重整頁面                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 1. beforeunload 觸發       │
          │    sendBeacon + emit       │
          │    playerRefreshing        │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 2. 後端收到通知            │
          │    標記為「正在重整」       │
          │    refreshingPlayers.set() │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 3. 舊 Socket 斷開          │
          │    觸發 disconnect         │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 4. handlePlayerDisconnect  │
          │    檢測到 isRefreshing     │
          │    給予額外寬限期          │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 5. 新頁面載入              │
          │    新 Socket 建立          │
          │    發送 reconnect          │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 6. 重連成功 ✓              │
          └───────────────────────────┘
```

---

## 五、測試案例

### 案例 1：正常重整

**步驟：**
1. 玩家在房間中
2. 按 F5 重整頁面

**預期結果：**
- beforeunload 觸發
- 後端收到 playerRefreshing
- 玩家被標記為「正在重整」
- 重連成功

### 案例 2：快速重連

**步驟：**
1. 玩家在房間中
2. 快速按 F5 多次

**預期結果：**
- 每次都能正確重連
- 不會產生多個玩家副本

### 案例 3：關閉分頁（非重整）

**步驟：**
1. 玩家在房間中
2. 直接關閉瀏覽器分頁

**預期結果：**
- beforeunload 觸發（但玩家不會回來）
- 30 秒後標記過期
- 依原有邏輯處理斷線

---

## 六、驗收標準

- [ ] beforeunload 正確觸發並發送通知
- [ ] sendBeacon 請求成功送達後端
- [ ] socket.emit 作為備援正常運作
- [ ] 後端正確標記「正在重整」的玩家
- [ ] 重整後能更快重連成功
- [ ] 所有測試案例通過

---

## 七、注意事項

1. **sendBeacon 的限制：**
   - 只能發送 POST 請求
   - 無法接收回應
   - 但保證在頁面卸載前送出

2. **beforeunload 的可靠性：**
   - 大部分瀏覽器支援
   - 但不保證 100% 觸發（如強制結束進程）
   - 所以這只是「優化」，不是「依賴」

3. **與現有機制的配合：**
   - 這是在現有寬限期機制上的增強
   - 即使 beforeunload 失敗，原有機制仍然運作

4. **安全考量：**
   - API 端點需要驗證 gameId 和 playerId
   - 防止惡意請求
