# 報告書 0201

## 工作單編號
0201

## 完成日期
2026-01-28

## 完成內容摘要

針對 `socketService.js` 中重連相關函數撰寫 15 個自動化單元測試，涵蓋 6 個測試群組（TC-0201-01 至 TC-0201-06）。

### 新增測試案例

| 測試群組 | 測試案例 | 描述 |
|---------|---------|------|
| TC-0201-01 | 01a | attemptReconnect 應發送 reconnect 事件到 socket |
| TC-0201-01 | 01b | 參數應正確傳遞（roomId, playerId, playerName） |
| TC-0201-02 | 02a | onReconnected 應註冊 reconnected 事件監聽 |
| TC-0201-02 | 02b | 應返回 unsubscribe 函數，呼叫後移除監聽 |
| TC-0201-03 | 03a | onReconnectFailed 應註冊 reconnectFailed 事件監聽 |
| TC-0201-03 | 03b | 應返回 unsubscribe 函數 |
| TC-0201-04 | 04a | socket 已連線時 emitPlayerRefreshing 應發送事件 |
| TC-0201-04 | 04b | socket 未連線時不應發送事件 |
| TC-0201-05 | 05a | onConnectionChange 應立即通知目前連線狀態 |
| TC-0201-05 | 05b | connect 事件觸發時 callback 應收到 true |
| TC-0201-05 | 05c | disconnect 事件觸發時 callback 應收到 false |
| TC-0201-05 | 05d | unsubscribe 後不再收到連線狀態通知 |
| TC-0201-06 | 06a | getCurrentRoom 有資料時應自動發送重連 |
| TC-0201-06 | 06b | localStorage 無資料時不應自動發送重連 |
| TC-0201-06 | 06c | 應支援 legacy key fallback |

### 測試基礎建設

| 項目 | 新增內容 |
|------|---------|
| localStorage mock | `jest.doMock('../utils/localStorage')` — mock getCurrentRoom、clearCurrentRoom |
| localStorage.clear() | beforeEach 清理 legacy keys |
| 觸發 socket 內部 handler | 透過 `mockSocketInstance.on.mock.calls.find()` 取得並手動觸發 initSocket 註冊的 handler |

## 遇到的問題與解決方案

### 問題 1：觸發 initSocket 內部註冊的 reconnect handler
**原因**：`initSocket()` 註冊了 `socket.on('reconnect', handler)`，此 handler 需要被手動觸發以測試自動重連邏輯。
**解決**：透過 `mockSocketInstance.on.mock.calls.find(call => call[0] === 'reconnect')` 取得 handler reference，再手動呼叫。

### 問題 2：模組重載與 localStorage mock 整合
**原因**：既有測試使用 `jest.resetModules()` + `jest.doMock()` 模式，需要在重載模組前設定 localStorage mock。
**解決**：在 `beforeEach` 中加入 `jest.doMock('../utils/localStorage', ...)` 和 `localStorage.clear()`，確保每個測試都有乾淨的 mock 狀態。

### 問題 3：emitPlayerRefreshing 的 connected 狀態控制
**原因**：`emitPlayerRefreshing` 內部檢查 `socket.connected`，需要在 mock socket 上控制此屬性。
**解決**：直接設定 `mockSocketInstance.connected = false`，因為 `getSocket()` → `initSocket()` → `io()` 回傳的就是 `mockSocketInstance`。

## 測試結果

```
socketService.test.js:
  Tests: 44 passed, 0 failed
  新增: 15 個重連函數測試

全部測試:
  Test Suites: 6 failed, 55 passed, 61 total
  Tests:       15 failed, 1378 passed, 1393 total
  （15 個失敗均為既有問題，無新增回歸）
```

## 下一步計劃

- 工單 0202：撰寫後端重連整合測試
- 工單 0203：撰寫 E2E 場景與回歸測試
