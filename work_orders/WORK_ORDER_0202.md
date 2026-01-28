# 工作單 0202

## 編號
0202

## 日期
2026-01-28

## 工作單標題
撰寫後端重連函數整合測試 — handlePlayerReconnect 與 handlePlayerDisconnect

## 工單主旨
擴充 `backend/__tests__/reconnection.test.js`，新增重連相關整合測試，驗證 BUG-001 和 BUG-004 的修復，並提升後端重連函數覆蓋率至 ≥ 80%

## 內容

### 測試目標

| 項目 | 目前 | 目標 |
|------|------|------|
| 後端整體 Statements | 21.63% | ≥ 40% |
| server.js Statements | 0% | 重連相關函數 ≥ 80% |

### 測試檔案

`backend/__tests__/reconnection.test.js`（擴充現有測試）

### 現有測試伺服器擴充

現有的測試伺服器架構（第 49-285 行）已包含基本的房間管理和重連邏輯。需擴充以下功能：

1. **新增 `followGuessStates` Map** — 模擬跟猜階段狀態
2. **新增 `postQuestionStates` Map** — 模擬預測階段狀態
3. **在 `handlePlayerReconnect` 中加入跟猜/預測恢復邏輯** — 與 `server.js` 第 1357-1377 行一致

### 測試項目

#### TC-0202-01：BUG-001 修復驗證 — reconnected 事件 payload

```
describe('BUG-001 修復驗證：reconnected 事件')
```

- **TC-0202-01a**：重連成功時應發送包含完整 gameState 的 reconnected 事件
  - 建立房間 → 開始遊戲 → 玩家斷線 → 新 Socket 重連
  - 斷言收到 `reconnected` 事件
  - 斷言 `reconnected.gameId` 正確
  - 斷言 `reconnected.playerId` 正確
  - 斷言 `reconnected.gameState` 存在且為物件

- **TC-0202-01b**：gameState 應包含所有必要遊戲欄位
  - 斷言 `gameState.players` 為陣列
  - 斷言 `gameState.maxPlayers` 為數字
  - 斷言 `gameState.gamePhase` 為字串
  - 斷言每個 player 有 `hand` 陣列（遊戲中）

- **TC-0202-01c**：重連不應拋出 ReferenceError
  - 確認整個重連流程無錯誤

#### TC-0202-02：BUG-004 修復驗證 — 跟猜階段重連恢復

```
describe('BUG-004 修復驗證：跟猜階段重連')
```

需先在測試伺服器的 `handlePlayerReconnect` 中加入跟猜恢復邏輯：
```javascript
const followState = followGuessStates.get(roomId);
if (followState && followState.decisionOrder.includes(playerId)) {
  socket.emit('followGuessStarted', { ... });
}
```

- **TC-0202-02a**：跟猜階段重連時應收到 `followGuessStarted` 事件
  - 建立 3 人房間 → 開始遊戲
  - 手動設定 `followGuessStates`（模擬猜牌觸發跟猜）
  - 玩家斷線 → 重連
  - 斷言收到 `followGuessStarted` 事件
  - 斷言 payload 包含：`guessingPlayerId`、`guessedColors`、`decisionOrder`、`currentDeciderId`、`decisions`

- **TC-0202-02b**：非跟猜階段重連時不應收到 `followGuessStarted`
  - `followGuessStates` 為空
  - 重連後等待短暫時間
  - 斷言未收到 `followGuessStarted`

- **TC-0202-02c**：不在 `decisionOrder` 中的玩家重連不應收到跟猜事件
  - `followGuessStates` 有資料但 `decisionOrder` 不含該玩家
  - 斷言未收到 `followGuessStarted`

#### TC-0202-03：預測階段重連恢復

```
describe('預測階段重連')
```

需在測試伺服器中加入 `postQuestionStates` 和對應恢復邏輯。

- **TC-0202-03a**：預測階段重連時應收到 `postQuestionPhase` 事件
  - 設定 `postQuestionStates.set(gameId, { playerId: 'player1' })`
  - 玩家 1 斷線 → 重連
  - 斷言收到 `postQuestionPhase` 事件，含 `playerId` 和 `message`

- **TC-0202-03b**：非當前預測玩家重連不應收到 `postQuestionPhase`
  - `postQuestionStates` 中的 `playerId` 為其他玩家
  - 斷言未收到 `postQuestionPhase`

#### TC-0202-04：完整重整事件鏈

```
describe('完整重整事件鏈')
```

- **TC-0202-04a**：`playerRefreshing → disconnect → reconnect` 應成功恢復
  - 建立 3 人房間 → 開始遊戲
  - 玩家發送 `playerRefreshing` → 斷線 → 在寬限期內重連
  - 斷言 `reconnected` 事件收到
  - 斷言 `player.isDisconnected === false`
  - 斷言 `refreshingPlayers` 不含該玩家

- **TC-0202-04b**：`playerRefreshing` 超時後應移除玩家（等待階段）
  - 等待階段 → 發送 `playerRefreshing` → 斷線 → 等待超過寬限期
  - 斷言玩家被從房間移除

#### TC-0202-05：多人同時重整

```
describe('多人同時重整')
```

- **TC-0202-05a**：3 位玩家同時斷線後各自獨立計時
  - 3 人各自發送 `playerRefreshing` → 斷線
  - 斷言 `disconnectTimeouts` 有 3 個 key

- **TC-0202-05b**：3 位玩家依序重連應全部成功
  - 3 人斷線後各自建立新連線並重連
  - 斷言全部收到 `reconnected`
  - 斷言房間玩家數仍為 3

#### TC-0202-06：socketId 更新驗證

```
describe('socketId 更新')
```

- **TC-0202-06a**：重連後 `playerSockets` Map 應包含新的映射
  - 記錄舊 socket.id → 斷線 → 重連
  - 透過 `gameRooms` 驗證 player 的資料已更新

### 前置條件

- 工單 0199 已完成（後端測試本來全部通過，但確認環境正常）

### 驗收標準

- [ ] 所有新增測試案例通過
- [ ] 既有 10 個後端測試套件不受影響
- [ ] 後端整體 Statements ≥ 40%
- [ ] 無 worker process 洩漏警告（或已處理）
- [ ] 執行指令：`cd backend && npx jest --coverage`

### 相關檔案

- `backend/__tests__/reconnection.test.js` — 修改
- `backend/server.js` — 參考（不修改）
- `backend/__tests__/helpers/socketClient.js` — 參考

### 參考計畫書

`docs/TEST_PLAN_RECONNECTION_V2.md` 第五章
