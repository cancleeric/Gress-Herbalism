# 工作單 0189

## 編號
0189

## 日期
2026-01-28

## 工作單標題
單元測試：Redux Store 持久化配置

## 工單主旨
測試 `frontend/src/store/gameStore.js` 中 redux-persist 配置的正確性

## 內容

### 測試範圍
- `persistConfig` 設定（key, storage, whitelist）
- `persistedReducer` 功能
- `clearPersistedState()` 函數
- `UPDATE_GAME_STATE` action 對重連資料的處理

### 測試項目

#### TC-0189-01：persistConfig whitelist 完整性
- 驗證 whitelist 是否包含重連所需的所有欄位
- 對比 Lobby.js `onReconnected` handler 所需的欄位

#### TC-0189-02：UPDATE_GAME_STATE reducer 行為
- 驗證 reducer 是否正確合併重連傳回的 gameState
- 驗證 `...action.payload` 展開是否可能覆蓋重要欄位

#### TC-0189-03：clearPersistedState 行為
- 驗證離開房間時是否正確清除持久化狀態
- 驗證與 localStorage clearCurrentRoom 的配合

#### TC-0189-04：持久化資料一致性
- 驗證 redux-persist 持久化的資料與 localStorage `gress_current_room` 的關係
- 檢查是否存在資料不一致的風險

### 測試方式
程式碼審查 + 靜態分析（不修改程式碼）

### 驗收標準
- 完成所有測試項目的驗證
- 記錄所有發現的問題
