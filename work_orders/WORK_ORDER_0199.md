# 工作單 0199

## 編號
0199

## 日期
2026-01-28

## 工作單標題
修復前端既有失敗測試 — socketService mock 同步更新

## 工單主旨
修復 commit `787a021` 新增重連功能後導致的 91 個前端測試失敗

## 內容

### 問題分析

commit `787a021`（版本 1.0.191）在 `GameRoom.js` 中新增了以下 import 和使用：
- `onReconnected`（socketService）
- `onConnectionChange`（socketService）
- `attemptReconnect`（socketService）
- `clearPersistedState`（gameStore）
- `getCurrentRoom`（localStorage）

但 `GameRoom.test.js` 的 socketService mock 未同步更新，導致：
- **錯誤訊息**：`TypeError: unsubReconnected is not a function` at `GameRoom.js:595`
- **影響範圍**：15 個測試套件失敗，91 個測試案例失敗
- **根本原因**：`socketService.onReconnected` 未被 mock，返回 `undefined`，cleanup 函數呼叫 `unsubReconnected()` 時報錯

### 修復項目

#### FIX-0199-01：更新 `GameRoom.test.js` 的 socketService mock

在 `beforeEach` 中補充以下 mock 定義：

```javascript
// 工單 0196 新增的重連相關 mock
socketService.onReconnected.mockImplementation((callback) => {
  socketCallbacks.reconnected = callback;
  return () => {};  // 返回 unsubscribe 函數
});
socketService.onConnectionChange.mockImplementation((callback) => {
  socketCallbacks.connectionChange = callback;
  return () => {};
});
socketService.attemptReconnect.mockImplementation(() => {});
```

#### FIX-0199-02：確認 `clearPersistedState` mock

- 確認 `gameStore.js` 的 `clearPersistedState` 在測試中被正確處理
- 若 `gameStore` 被 mock，需確保 `clearPersistedState` 存在且可呼叫

#### FIX-0199-03：確認 `getCurrentRoom` mock

- 確認 `localStorage.js` 的 `getCurrentRoom` 在 GameRoom 測試中被正確 mock
- 預設返回 `null`（不觸發重連邏輯）

### 驗收標準

- [ ] 所有 64 個前端測試套件通過（0 失敗）
- [ ] 所有 1366 個前端測試案例通過（0 失敗）
- [ ] 前端覆蓋率維持 ≥ 82% Statements
- [ ] 執行指令：`cd frontend && npx react-scripts test --watchAll=false --silent`
- [ ] 執行覆蓋率：`cd frontend && npx react-scripts test --coverage --watchAll=false --silent`
- [ ] 記錄修復後的基線覆蓋率數據

### 相關檔案

- `frontend/src/components/GameRoom/GameRoom.test.js` — 主要修改
- `frontend/src/components/GameRoom/GameRoom.js` — 參考（不修改）
- `frontend/src/services/socketService.js` — 參考（不修改）

### 參考計畫書

`docs/TEST_PLAN_RECONNECTION_V2.md` 第三章
