# 工作單 0200

## 編號
0200

## 日期
2026-01-28

## 工作單標題
撰寫前端 GameRoom 重連邏輯單元測試

## 工單主旨
針對 `GameRoom.js` 中新增的重連相關功能撰寫自動化單元測試，提升 GameRoom 模組覆蓋率至 ≥ 70%

## 內容

### 測試目標

| 項目 | 目前 | 目標 |
|------|------|------|
| GameRoom Statements | 57.34% | ≥ 70% |
| GameRoom Lines | 57.8% | ≥ 70% |
| GameRoom Functions | 47.4% | ≥ 60% |

### 測試檔案

`frontend/src/components/GameRoom/GameRoom.test.js`（新增測試案例至現有檔案）

### 測試項目

#### TC-0200-01：重連 useEffect — 連線後觸發重連（工單 0196）

測試 GameRoom 第 603-617 行的重連 useEffect：

- **TC-0200-01a**：連線後有儲存的房間資訊且 roomId 相符時，應呼叫 `attemptReconnect`
  - mock `getCurrentRoom` 返回 `{ roomId: 'test_room', playerId: 'p1', playerName: '玩家A' }`
  - 觸發 `socketCallbacks.connectionChange(true)`
  - 斷言 `socketService.attemptReconnect` 被呼叫，參數為 `('test_room', 'p1', '玩家A')`

- **TC-0200-01b**：連線後 `getCurrentRoom` 返回 `null` 時，不應呼叫 `attemptReconnect`

- **TC-0200-01c**：`savedRoom.roomId` 與當前 URL 的 `gameId` 不符時，不應呼叫 `attemptReconnect`
  - mock `getCurrentRoom` 返回 `{ roomId: 'other_room', ... }`

- **TC-0200-01d**：`savedRoom.playerId` 為空時，不應呼叫 `attemptReconnect`

- **TC-0200-01e**：單人模式（isLocalMode）不應註冊 `onConnectionChange`

#### TC-0200-02：onReconnected handler（工單 0196）

測試 GameRoom 第 568-581 行的 reconnected 事件處理：

- **TC-0200-02a**：收到 `reconnected` 事件時應透過 dispatch 更新 Redux store
  - 觸發 `socketCallbacks.reconnected({ gameId: 'test_room', playerId: 'p1', gameState: mockGameState })`
  - 斷言 store 的 `gamePhase`、`players`、`maxPlayers`、`currentPlayerIndex` 等欄位已更新

- **TC-0200-02b**：reconnected handler 應正確映射所有欄位
  - 驗證 `gameId`、`players`、`maxPlayers`、`gamePhase`、`currentPlayerIndex`、`currentPlayerId`、`hiddenCards`、`gameHistory`、`winner` 共 9 個欄位

#### TC-0200-03：beforeunload handler（工單 0118 移至 GameRoom）

測試 GameRoom 第 634-651 行的 beforeunload 事件處理：

- **TC-0200-03a**：有 gameId 和 playerId 時，`beforeunload` 應呼叫 `emitPlayerRefreshing`
  - 渲染 GameRoom 並設定 gameState（含 storeGameId 和 players）
  - 觸發 `window.dispatchEvent(new Event('beforeunload'))`
  - 斷言 `socketService.emitPlayerRefreshing` 被呼叫

- **TC-0200-03b**：沒有有效的 playerId 時，不應呼叫 `emitPlayerRefreshing`

#### TC-0200-04：handleLeaveRoom 清理流程（工單 0198）

測試離開房間時的清理呼叫：

- **TC-0200-04a**：點擊離開按鈕應依序呼叫清理函數
  - 斷言 `clearCurrentRoom()` 被呼叫
  - 斷言 `clearPersistedState()` 被呼叫
  - 斷言 `navigate('/')` 被呼叫

#### TC-0200-05：cleanup 函數完整性

- **TC-0200-05a**：組件 unmount 時應呼叫所有 unsubscribe 函數
  - 包含 `unsubReconnected` 在內的所有 cleanup

### 前置條件

- 工單 0199 已完成（mock 已修復，既有測試全部通過）

### 驗收標準

- [ ] 所有新增測試案例通過
- [ ] GameRoom 模組 Statements ≥ 70%
- [ ] 既有測試不受影響（零回歸）
- [ ] 測試案例獨立可執行，無相依性

### 相關檔案

- `frontend/src/components/GameRoom/GameRoom.test.js` — 修改
- `frontend/src/components/GameRoom/GameRoom.js` — 參考
- `frontend/src/services/socketService.js` — mock 對象
- `frontend/src/utils/localStorage.js` — mock 對象
- `frontend/src/store/gameStore.js` — mock 對象

### 參考計畫書

`docs/TEST_PLAN_RECONNECTION_V2.md` 第四章 4.1 節
