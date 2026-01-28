# 工作單 0201

## 編號
0201

## 日期
2026-01-28

## 工作單標題
撰寫前端 socketService 重連函數單元測試

## 工單主旨
針對 `socketService.js` 中重連相關函數撰寫自動化單元測試，提升 services 模組覆蓋率至 ≥ 80%

## 內容

### 測試目標

| 項目 | 目前 | 目標 |
|------|------|------|
| services Statements | 66.3% | ≥ 80% |
| services Lines | 66.79% | ≥ 80% |
| services Functions | 66.01% | ≥ 80% |

### 測試檔案

`frontend/src/services/socketService.test.js`（新增測試案例至現有檔案）

### 測試項目

#### TC-0201-01：attemptReconnect 函數

- **TC-0201-01a**：應發送 `reconnect` 事件到 socket
  - 呼叫 `attemptReconnect('room1', 'player1', '玩家A')`
  - 斷言 `socket.emit` 被呼叫，事件名為 `'reconnect'`

- **TC-0201-01b**：參數應正確傳遞
  - 斷言 emit 的 payload 為 `{ roomId: 'room1', playerId: 'player1', playerName: '玩家A' }`

#### TC-0201-02：onReconnected 函數

- **TC-0201-02a**：應註冊 `reconnected` 事件監聽
  - 呼叫 `onReconnected(callback)`
  - 斷言 `socket.on` 被呼叫，事件名為 `'reconnected'`

- **TC-0201-02b**：應返回 unsubscribe 函數
  - `const unsub = onReconnected(callback)`
  - 斷言 `typeof unsub === 'function'`
  - 呼叫 `unsub()`
  - 斷言 `socket.off('reconnected', ...)` 被呼叫

#### TC-0201-03：onReconnectFailed 函數

- **TC-0201-03a**：應註冊 `reconnectFailed` 事件監聽
- **TC-0201-03b**：應返回 unsubscribe 函數

#### TC-0201-04：emitPlayerRefreshing 函數

- **TC-0201-04a**：socket 已連線時應發送 `playerRefreshing` 事件
  - 設定 `socket.connected = true`
  - 呼叫 `emitPlayerRefreshing('game1', 'player1')`
  - 斷言 `socket.emit('playerRefreshing', { gameId: 'game1', playerId: 'player1' })`

- **TC-0201-04b**：socket 未連線時不應發送事件
  - 設定 `socket.connected = false`
  - 呼叫 `emitPlayerRefreshing('game1', 'player1')`
  - 斷言 `socket.emit` 未被呼叫（或未以 `'playerRefreshing'` 呼叫）

- **TC-0201-04c**：socket 不存在時不應報錯
  - 確認容錯處理正常

#### TC-0201-05：onConnectionChange 函數

- **TC-0201-05a**：應註冊 `connect` 和 `disconnect` 兩個事件監聽
  - 呼叫 `onConnectionChange(callback)`
  - 斷言 `socket.on('connect', ...)` 和 `socket.on('disconnect', ...)` 被呼叫

- **TC-0201-05b**：connect 事件觸發時 callback 應收到 `true`

- **TC-0201-05c**：disconnect 事件觸發時 callback 應收到 `false`

- **TC-0201-05d**：應返回 unsubscribe 函數，呼叫後移除兩個事件監聽

#### TC-0201-06：Socket.io 自動重連事件處理（第 57-79 行）

- **TC-0201-06a**：`reconnect` 事件觸發時，localStorage 有資料應自動發送重連
  - 設定 `getCurrentRoom()` 返回有效資料
  - 觸發 socket 的 `reconnect` 事件
  - 斷言 `socket.emit('reconnect', { roomId, playerId, playerName })`

- **TC-0201-06b**：localStorage 無資料時不應自動發送重連
  - `getCurrentRoom()` 返回 `null`，legacy keys 也為空
  - 觸發 `reconnect` 事件
  - 斷言 `socket.emit` 未以 `'reconnect'` 呼叫

- **TC-0201-06c**：應支援 legacy key fallback
  - `getCurrentRoom()` 返回 `null`
  - 設定 `localStorage.getItem('lastRoomId')` 等 legacy keys
  - 觸發 `reconnect` 事件
  - 斷言使用 legacy key 的值發送重連

### 前置條件

- 工單 0199 已完成（mock 已修復）

### 驗收標準

- [ ] 所有新增測試案例通過
- [ ] services 模組 Statements ≥ 80%
- [ ] 既有 socketService 測試不受影響
- [ ] 測試案例獨立可執行

### 相關檔案

- `frontend/src/services/socketService.test.js` — 修改
- `frontend/src/services/socketService.js` — 參考
- `frontend/src/utils/localStorage.js` — mock 對象

### 參考計畫書

`docs/TEST_PLAN_RECONNECTION_V2.md` 第四章 4.2 節
