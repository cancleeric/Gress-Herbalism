# 斷線重連問題修復計畫書

**建立日期：** 2026-01-25

**問題摘要：**
1. 玩家在遊戲中會意外斷線
2. 重新整理頁面會被踢出房間，無法繼續遊戲

---

## 一、問題根本原因分析

### 1.1 問題一：等待階段沒有重連寬限期

**位置：** `backend/server.js:1062-1066`

```javascript
if (gameState.gamePhase === 'waiting') {
  // ❌ 直接移除玩家，沒有重連機會
  handlePlayerLeave(socket, gameId, playerId);
  return;
}
```

**影響：**
- 玩家在等待大廳時斷線 → 立即從 `gameState.players` 移除
- 如果房間變空 → 整個房間被刪除
- 新 Socket 嘗試重連 → 找不到房間或玩家

### 1.2 問題二：LocalStorage 過期時間太短

**位置：** `frontend/src/utils/localStorage.js:111`

```javascript
const EXPIRY_TIME = 5 * 60 * 1000;  // 只有 5 分鐘
```

**影響：**
- 一場遊戲可能超過 5 分鐘
- 超過 5 分鐘後重整頁面，localStorage 資料被判定過期
- 無法取得房間資訊進行重連

### 1.3 問題三：Redux 狀態沒有持久化

**現狀：**
- 沒有使用 redux-persist
- 頁面重整 → Redux store 重置為 initialState
- 遊戲上下文（gameId, playerId, gamePhase 等）全部遺失

### 1.4 問題四：重連時序競爭

**時序圖：**
```
T0:       玩家按 F5 重整頁面
T0+10ms:  舊 socket disconnect 事件觸發
T0+50ms:  後端處理 disconnect
          ├── 等待階段 → 玩家被立即移除 ❌
          └── 遊戲中 → 標記為斷線，60 秒寬限期 ✓
T0+100ms: 新 socket 建立
T0+150ms: React 應用初始化
T0+200ms: 檢查 localStorage
T0+250ms: 嘗試重連
          ├── 等待階段 → 房間/玩家已不存在 ❌
          └── 遊戲中 → 可能成功重連 ✓
```

---

## 二、解決方案設計

### 2.1 解決方案總覽

| 問題 | 解決方案 | 優先級 |
|------|---------|--------|
| 等待階段無寬限期 | 新增等待階段短暫寬限期（15 秒） | 高 |
| LocalStorage 過期 | 延長過期時間至 2 小時 | 高 |
| Redux 狀態遺失 | 加入 redux-persist 或加強 localStorage 機制 | 中 |
| 時序競爭 | 前端延遲重連 + beforeunload 通知 | 中 |

### 2.2 方案一：等待階段寬限期

**修改位置：** `backend/server.js`

**修改內容：**

```javascript
// 修改 handlePlayerDisconnect 函數
function handlePlayerDisconnect(socket, gameId, playerId) {
  const gameState = gameRooms.get(gameId);
  if (!gameState) return;

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;

  const player = gameState.players[playerIndex];

  // 等待階段：給予短暫寬限期（15 秒）
  if (gameState.gamePhase === 'waiting') {
    player.isDisconnected = true;
    player.disconnectedAt = Date.now();
    console.log(`[等待階段] 玩家 ${player.name} 斷線，保留位置 15 秒等待重連`);

    socket.leave(gameId);
    playerSockets.delete(socket.id);

    const timeoutKey = `${gameId}:${playerId}`;
    if (disconnectTimeouts.has(timeoutKey)) {
      clearTimeout(disconnectTimeouts.get(timeoutKey));
    }

    // 15 秒寬限期（等待階段較短）
    const WAITING_PHASE_TIMEOUT = 15000;
    const timeout = setTimeout(() => {
      const currentState = gameRooms.get(gameId);
      if (currentState) {
        const currentPlayerIndex = currentState.players.findIndex(p => p.id === playerId);
        if (currentPlayerIndex !== -1 && currentState.players[currentPlayerIndex].isDisconnected) {
          console.log(`[等待階段] 玩家 ${playerId} 重連超時，移除玩家`);
          // 現在才真正移除
          handlePlayerLeave(socket, gameId, playerId);
        }
      }
      disconnectTimeouts.delete(timeoutKey);
    }, WAITING_PHASE_TIMEOUT);

    disconnectTimeouts.set(timeoutKey, timeout);

    // 廣播狀態更新（顯示玩家暫時斷線）
    broadcastGameState(gameId);
    return;
  }

  // 遊戲進行中：原本的 60 秒寬限期邏輯...
}
```

**新增常數：**
```javascript
const WAITING_PHASE_DISCONNECT_TIMEOUT = 15000;  // 15 秒
const PLAYING_PHASE_DISCONNECT_TIMEOUT = 60000;  // 60 秒
```

### 2.3 方案二：延長 LocalStorage 過期時間

**修改位置：** `frontend/src/utils/localStorage.js`

**修改內容：**
```javascript
// 修改過期時間
const EXPIRY_TIME = 2 * 60 * 60 * 1000;  // 2 小時
```

**理由：**
- 一場遊戲可能持續 30-60 分鐘
- 2 小時足夠覆蓋絕大多數情況
- 過期後自動清除，不會佔用空間

### 2.4 方案三：加強狀態持久化

**選項 A：使用 redux-persist（推薦）**

安裝依賴：
```bash
npm install redux-persist
```

修改 `frontend/src/store/index.js`：
```javascript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import gameReducer from './gameSlice';

const persistConfig = {
  key: 'gress',
  storage,
  whitelist: ['game'], // 只持久化 game slice
};

const persistedReducer = persistReducer(persistConfig, gameReducer);

export const store = configureStore({
  reducer: {
    game: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
```

修改 `frontend/src/index.js`：
```javascript
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
```

**選項 B：加強 localStorage 機制（較簡單）**

新增遊戲狀態儲存函數：
```javascript
// localStorage.js
export function saveGameState(gameState) {
  try {
    const data = {
      ...gameState,
      timestamp: Date.now()
    };
    localStorage.setItem('gress_game_state', JSON.stringify(data));
  } catch (e) {
    console.warn('無法儲存遊戲狀態:', e);
  }
}

export function getGameState() {
  try {
    const data = localStorage.getItem('gress_game_state');
    if (!data) return null;
    const gameState = JSON.parse(data);
    const EXPIRY_TIME = 2 * 60 * 60 * 1000;
    if (Date.now() - gameState.timestamp > EXPIRY_TIME) {
      clearGameState();
      return null;
    }
    return gameState;
  } catch (e) {
    return null;
  }
}
```

### 2.5 方案四：改善重連時序

**前端修改：** 新增 beforeunload 處理

```javascript
// 在 GameRoom.js 或 Lobby.js
useEffect(() => {
  const handleBeforeUnload = () => {
    // 通知後端這是預期的離開（重整）
    if (socket && gameId && playerId) {
      socket.emit('playerRefreshing', { gameId, playerId });
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [gameId, playerId]);
```

**後端修改：** 處理預期離開

```javascript
socket.on('playerRefreshing', ({ gameId, playerId }) => {
  const playerInfo = playerSockets.get(socket.id);
  if (playerInfo) {
    // 標記為「正在重整」，給予更長的寬限期
    refreshingPlayers.set(`${gameId}:${playerId}`, Date.now());
  }
});
```

---

## 三、實作階段

### 階段 1：後端等待階段寬限期（優先）

**工單：** 0115
**預估修改：**
- `backend/server.js` - handlePlayerDisconnect 函數

### 階段 2：延長 LocalStorage 過期時間

**工單：** 0116
**預估修改：**
- `frontend/src/utils/localStorage.js` - EXPIRY_TIME 常數

### 階段 3：Redux 狀態持久化

**工單：** 0117
**預估修改：**
- 安裝 redux-persist
- `frontend/src/store/index.js`
- `frontend/src/index.js`

### 階段 4：重連時序優化

**工單：** 0118
**預估修改：**
- `frontend/src/components/GameRoom/GameRoom.js` - beforeunload
- `frontend/src/components/Lobby/Lobby.js` - beforeunload
- `backend/server.js` - playerRefreshing 事件

### 階段 5：前端斷線 UI 提示

**工單：** 0119
**預估修改：**
- 新增 ConnectionStatus 組件
- 顯示「重新連線中...」提示

### 階段 6：整合測試

**工單：** 0120
**測試案例：**
1. 等待階段按 F5 → 應能重連回房間
2. 遊戲中按 F5 → 應能重連繼續遊戲
3. 網路暫時中斷 → 應自動重連
4. 長時間遊戲（超過 5 分鐘）→ 重整後仍能重連

---

## 四、風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| redux-persist 相容性 | 可能與現有 Redux 結構衝突 | 先在開發環境測試 |
| 寬限期過長佔用資源 | 等待階段可能有空位但無法加入 | 15 秒足夠短 |
| LocalStorage 空間 | 可能超出配額 | 只儲存必要資訊 |

---

## 五、驗收標準

- [ ] 等待階段斷線後 15 秒內重連成功
- [ ] 遊戲中斷線後 60 秒內重連成功
- [ ] 頁面重整後能自動重連回房間
- [ ] 重連期間顯示適當的 UI 提示
- [ ] 超過寬限期後正確移除玩家
- [ ] 所有測試案例通過

---

## 六、相關文件

- 原計畫書：`docs/SOCKET_SYNC_FIX_PLAN.md`（工單 0104-0111）
- 工單 0079：斷線重連基礎功能

---

## 附錄：完整資料流圖

### 修復後的重整流程

```
┌──────────────────────────────────────────────────────────────┐
│ 玩家按 F5 重整頁面                                            │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 1. beforeunload 觸發       │
          │    發送 playerRefreshing   │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 2. 舊 Socket 關閉          │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ 3. Backend: disconnect     │
          │    檢查 refreshingPlayers  │
          └───────────┬───────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    (等待階段)                (遊戲中)
         │                         │
    標記為斷線              標記為斷線
    15秒寬限期              60秒寬限期
         │                         │
         └────────────┬────────────┘
                      │
          ┌───────────▼───────────┐
          │ 4. 新頁面載入          │
          │    Redux 從 persist    │
          │    讀取 localStorage   │
          └───────────┬───────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │ 5. 新 Socket 建立      │
          │    發送 reconnect      │
          └───────────┬───────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │ 6. 重連成功 ✓         │
          │    恢復遊戲狀態        │
          └───────────────────────┘
```
