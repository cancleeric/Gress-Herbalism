# 完成報告 0117

**工作單編號：** 0117

**工作單標題：** Redux 狀態持久化

**完成日期：** 2026-01-25

---

## 一、工作摘要

使用 redux-persist 套件實現 Redux 狀態持久化，讓頁面重整後能保留遊戲狀態資訊。

---

## 二、問題描述

**原本行為：**
- Redux 狀態沒有持久化
- 頁面重整後，Redux store 重置為 initialState
- 遊戲上下文（gameId, playerId 等）全部遺失

**修復後行為：**
- Redux 狀態自動儲存到 localStorage
- 頁面重整後自動恢復狀態
- 配合重連機制可無縫繼續遊戲

---

## 三、修改內容

### 3.1 安裝依賴

```bash
npm install redux-persist
```

### 3.2 修改 gameStore.js

**檔案：** `frontend/src/store/gameStore.js`

**新增內容：**
1. 引入 redux-persist 相關模組
2. 新增 persistConfig 設定
3. 建立 persistedReducer
4. 匯出 persistor 和 clearPersistedState 函數

```javascript
// 持久化設定
const persistConfig = {
  key: 'gress_game',
  storage,
  version: 1,
  whitelist: ['gameId', 'currentPlayerId', 'players', 'gamePhase', 'currentPlayerIndex']
};

// 建立持久化 reducer
const persistedReducer = persistReducer(persistConfig, gameReducer);

// Persistor
export const persistor = persistStore(store);

// 清除持久化狀態
export function clearPersistedState() {
  persistor.purge();
}
```

### 3.3 修改 App.js

**檔案：** `frontend/src/App.js`

**新增內容：**
1. 引入 PersistGate
2. 新增 LoadingView 組件
3. 在 Provider 內包裝 PersistGate

```javascript
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './store/gameStore';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingView />} persistor={persistor}>
        {/* ... */}
      </PersistGate>
    </Provider>
  );
}
```

---

## 四、測試結果

### 前端測試
```
Test Suites: 32 passed, 32 total
Tests:       780 passed, 780 total
```

---

## 五、驗收確認

- [x] 安裝 redux-persist 成功
- [x] persistConfig 設定正確
- [x] PersistGate 正確包裝應用
- [x] 頁面重整後狀態恢復
- [x] clearPersistedState 函數可用
- [x] 所有測試通過

---

## 六、影響範圍

| 檔案 | 修改類型 |
|------|---------|
| `frontend/package.json` | 新增依賴 |
| `frontend/src/store/gameStore.js` | 新增持久化設定 |
| `frontend/src/App.js` | 新增 PersistGate |

---

## 七、持久化策略說明

### 只持久化關鍵資訊

```javascript
whitelist: ['gameId', 'currentPlayerId', 'players', 'gamePhase', 'currentPlayerIndex']
```

**理由：**
- 這些是重連所需的最小資訊
- 其他詳細狀態（如手牌）由後端重連時提供
- 避免 localStorage 佔用過多空間

### 狀態恢復流程

1. 頁面載入 → PersistGate 從 localStorage 讀取
2. Redux store 恢復到之前的狀態
3. 發送 reconnect 請求到後端
4. 後端返回最新狀態覆蓋本地

---

## 八、備註

此工單配合工單 0115、0116 完成斷線重連功能的狀態保存部分。後續可透過 `clearPersistedState()` 在玩家主動離開房間時清除持久化狀態。
