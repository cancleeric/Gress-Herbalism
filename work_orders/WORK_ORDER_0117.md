# 工作單 0117

**日期：** 2026-01-25

**工作單標題：** Redux 狀態持久化

**工單主旨：** 功能增強 - 使用 redux-persist 持久化遊戲狀態

**計畫書：** [斷線重連問題修復計畫書](../docs/RECONNECT_FIX_PLAN.md)

**優先級：** 中

**依賴工單：** 0115, 0116

---

## 一、問題描述

目前 Redux 狀態**沒有持久化**，導致：

1. 頁面重整後，Redux store 重置為 `initialState`
2. 遊戲上下文（gameId, playerId, gamePhase 等）全部遺失
3. 雖然 localStorage 有儲存房間資訊，但其他狀態（如手牌、分數）會遺失

---

## 二、解決方案

使用 **redux-persist** 套件持久化 Redux 狀態。

### 2.1 安裝依賴

```bash
cd frontend
npm install redux-persist
```

### 2.2 修改 Store 設定

**檔案：** `frontend/src/store/index.js`

```javascript
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import gameReducer from './gameSlice';

// 持久化設定
const persistConfig = {
  key: 'gress',
  storage,
  version: 1,
  whitelist: ['game'], // 只持久化 game slice
};

// 合併 reducers
const rootReducer = combineReducers({
  game: gameReducer,
});

// 建立持久化 reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 建立 store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略 redux-persist 的 actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// 建立 persistor
export const persistor = persistStore(store);
```

### 2.3 修改應用入口

**檔案：** `frontend/src/index.js`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<div>載入中...</div>} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
```

### 2.4 新增清除持久化狀態函數

**檔案：** `frontend/src/store/index.js`（新增）

```javascript
/**
 * 清除持久化狀態
 * 用於玩家主動離開房間或登出時
 */
export function clearPersistedState() {
  persistor.purge();
}
```

### 2.5 在離開房間時清除狀態

**檔案：** `frontend/src/components/Lobby/Lobby.js`（修改）

```javascript
import { clearPersistedState } from '../../store';

// 在主動離開房間時
const handleLeaveRoom = () => {
  leaveRoom(gameId, playerId);
  clearCurrentRoom();  // 清除 localStorage
  clearPersistedState();  // 清除持久化狀態
  dispatch(resetGame());
};
```

---

## 三、修改清單

| 檔案 | 修改內容 |
|------|---------|
| `frontend/package.json` | 新增 redux-persist 依賴 |
| `frontend/src/store/index.js` | 加入 redux-persist 設定 |
| `frontend/src/index.js` | 加入 PersistGate |
| `frontend/src/components/Lobby/Lobby.js` | 離開房間時清除狀態 |
| `frontend/src/components/GameRoom/GameRoom.js` | 離開房間時清除狀態 |

---

## 四、持久化策略

### 4.1 要持久化的狀態

```javascript
// gameSlice 中的狀態
{
  gameId: string,
  playerId: string,
  playerName: string,
  players: array,
  gamePhase: string,
  currentTurn: number,
  // ... 其他遊戲狀態
}
```

### 4.2 不持久化的狀態

- 連線狀態（isConnected）- 由 socket 即時判斷
- 暫時性 UI 狀態（模態框開關等）

### 4.3 狀態恢復流程

```
1. 頁面載入
2. PersistGate 從 localStorage 讀取狀態
3. Redux store 恢復到之前的狀態
4. 同時發送 reconnect 請求到後端
5. 後端返回最新遊戲狀態
6. 用後端狀態覆蓋本地狀態（確保同步）
```

---

## 五、測試案例

### 案例 1：頁面重整後狀態恢復

**步驟：**
1. 玩家加入房間
2. 遊戲開始，玩家有 3 張手牌
3. 按 F5 重整頁面

**預期結果：**
- Redux 狀態從 localStorage 恢復
- 顯示「載入中...」提示
- 自動嘗試重連
- 重連成功後用後端狀態更新

### 案例 2：主動離開房間

**步驟：**
1. 玩家在房間中
2. 點擊「離開房間」

**預期結果：**
- localStorage 被清除
- 持久化狀態被清除
- Redux 重置為 initialState

### 案例 3：跨 Tab 狀態同步

**步驟：**
1. 在 Tab A 加入房間
2. 開啟 Tab B 進入遊戲

**預期結果：**
- Tab B 讀取到 Tab A 的狀態
- 可能需要處理「已在其他地方登入」的情況

---

## 六、驗收標準

- [ ] 安裝 redux-persist 成功
- [ ] 頁面重整後 Redux 狀態恢復
- [ ] PersistGate 顯示載入提示
- [ ] 離開房間時清除持久化狀態
- [ ] 與後端重連機制正確配合
- [ ] 所有測試案例通過

---

## 七、注意事項

1. **版本遷移：**
   - persistConfig 中設定 version
   - 未來若 state 結構改變，需要處理 migration

2. **狀態衝突：**
   - 本地狀態和後端狀態可能不同步
   - 重連成功後，應以後端狀態為準

3. **安全性：**
   - localStorage 可被用戶查看/修改
   - 不要儲存敏感資訊
   - 後端應驗證所有操作

4. **錯誤處理：**
   - localStorage 可能被禁用或已滿
   - 需要 graceful fallback
