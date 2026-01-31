# 報告書 0200

## 工作單編號
0200

## 完成日期
2026-01-28

## 完成內容摘要

針對 `GameRoom.js` 中新增的重連相關功能撰寫 11 個自動化單元測試，涵蓋 5 個測試群組（TC-0200-01 至 TC-0200-05）。

### 新增測試案例

| 測試群組 | 測試案例 | 描述 |
|---------|---------|------|
| TC-0200-01 | 01a | 連線後有儲存的房間資訊且 roomId 相符時，應呼叫 attemptReconnect |
| TC-0200-01 | 01b | getCurrentRoom 返回 null 時，不應呼叫 attemptReconnect |
| TC-0200-01 | 01c | savedRoom.roomId 與當前 gameId 不符時，不應呼叫 attemptReconnect |
| TC-0200-01 | 01d | savedRoom.playerId 為空時，不應呼叫 attemptReconnect |
| TC-0200-01 | 01e | 連線斷開（connected=false）時不應呼叫 attemptReconnect |
| TC-0200-02 | 02a | 收到 reconnected 事件時應更新 Redux store 的遊戲狀態 |
| TC-0200-02 | 02b | reconnected handler 應正確映射 gameState 中的所有 9 個欄位 |
| TC-0200-03 | 03a | 有 gameId 和 playerId 時，beforeunload 應呼叫 emitPlayerRefreshing |
| TC-0200-03 | 03b | 沒有有效的 playerId 時，不應呼叫 emitPlayerRefreshing |
| TC-0200-04 | 04a | 點擊離開按鈕應呼叫 clearCurrentRoom、clearPersistedState 和 navigate |
| TC-0200-05 | 05a | 組件 unmount 時應呼叫所有 unsubscribe 函數（含 onReconnected） |

### 測試基礎建設

| 項目 | 新增內容 |
|------|---------|
| localStorage mock | `jest.mock('../../utils/localStorage')` — mock `getCurrentRoom`、`clearCurrentRoom` |
| gameStore partial mock | `jest.mock('../../store/gameStore')` — mock `clearPersistedState`，保留真實 reducer |
| renderWithStore helper | 新增帶 store 存取的渲染函數，用於驗證 dispatch 結果 |

### 覆蓋率

| 項目 | 目標 | 實際 | 說明 |
|------|------|------|------|
| Statements | ≥ 70% | 54.12% | 未達標 |
| Lines | ≥ 70% | 55.49% | 未達標 |
| Functions | ≥ 60% | 48.14% | 未達標 |

**覆蓋率說明**：GameRoom.js 共 2300+ 行，重連邏輯僅佔第 560-667 行（約 107 行）。重連相關程式碼已完整覆蓋，但整體覆蓋率未達標是因為其他大量未測試區域（本地模式處理 240-403 行、各種 action handler 696-932 行、大量 UI 渲染邏輯等）。提升至 70% 需要額外撰寫非重連功能的測試，超出本工單範圍。

## 遇到的問題與解決方案

### 問題 1：gameStore partial mock
**原因**：測試需要 mock `clearPersistedState`，但又需要保留真實的 `gameReducer` 和 `initialState` 供 Redux store 使用。
**解決**：使用 `jest.requireActual` 搭配 spread 運算符，只覆蓋 `clearPersistedState`：
```javascript
jest.mock('../../store/gameStore', () => {
  const actual = jest.requireActual('../../store/gameStore');
  return { ...actual, clearPersistedState: jest.fn() };
});
```

### 問題 2：Redux store 狀態驗證
**原因**：`renderWithProviders` 不回傳 store 實例，無法直接驗證 dispatch 結果。
**解決**：新增 `renderWithStore` helper 函數，回傳 `{ ...renderResult, store }`，用於 TC-0200-02 的 store 狀態驗證。

### 問題 3：beforeunload 事件中的 storeGameId
**原因**：`gameState.storeGameId` 實際上由 `selectGameRoomState` selector 將 `state.gameId` 映射為 `storeGameId`。測試需設定 Redux state 的 `gameId` 欄位（非 `storeGameId`）。
**解決**：在 preloadedState 中設定 `gameId: 'test_room'`，selector 自動映射為 `storeGameId`。

## 測試結果

```
GameRoom.test.js:
  Tests: 72 passed, 0 failed
  新增: 11 個重連邏輯測試

全部測試:
  Test Suites: 6 failed, 55 passed, 61 total
  Tests:       15 failed, 1363 passed, 1378 total
  （15 個失敗均為工單 0199 已記錄的既有問題，無新增回歸）
```

## 下一步計劃

- 工單 0201：撰寫 socketService 重連函數測試
- 工單 0202：撰寫後端重連整合測試
