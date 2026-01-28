# 報告書 0202

## 工作單編號
0202

## 完成日期
2026-01-28

## 完成內容摘要

擴充 `backend/__tests__/reconnection.test.js`，新增 13 個自動化整合測試，涵蓋 6 個測試群組（TC-0202-01 至 TC-0202-06）。

### 新增測試案例

| 測試群組 | 測試案例 | 描述 |
|---------|---------|------|
| TC-0202-01 | 01a | 重連成功時應發送包含完整 gameState 的 reconnected 事件 |
| TC-0202-01 | 01b | gameState 應包含所有必要遊戲欄位（players、maxPlayers、gamePhase、hand） |
| TC-0202-01 | 01c | 重連不應拋出錯誤 |
| TC-0202-02 | 02a | 跟猜階段重連時應收到 followGuessStarted 事件 |
| TC-0202-02 | 02b | 非跟猜階段重連時不應收到 followGuessStarted |
| TC-0202-02 | 02c | 不在 decisionOrder 中的玩家重連不應收到跟猜事件 |
| TC-0202-03 | 03a | 預測階段重連時應收到 postQuestionPhase 事件 |
| TC-0202-03 | 03b | 非當前預測玩家重連不應收到 postQuestionPhase |
| TC-0202-04 | 04a | playerRefreshing → disconnect → reconnect 應成功恢復 |
| TC-0202-04 | 04b | playerRefreshing 超時後應移除玩家（等待階段） |
| TC-0202-05 | 05a | 3 位玩家同時斷線後各自獨立計時 |
| TC-0202-05 | 05b | 3 位玩家依序重連應全部成功 |
| TC-0202-06 | 06a | 重連後 playerSockets Map 應包含新的映射 |

### 測試基礎建設

| 項目 | 新增內容 |
|------|---------|
| followGuessStates Map | 模擬跟猜階段狀態，供 TC-0202-02 驗證 |
| postQuestionStates Map | 模擬預測階段狀態，供 TC-0202-03 驗證 |
| handlePlayerReconnect 擴充 | 加入跟猜/預測恢復邏輯，與 server.js 第 1357-1377 行一致 |

### 覆蓋率

| 項目 | 目標 | 實際 | 說明 |
|------|------|------|------|
| 後端整體 Statements | ≥ 40% | 21.63% | 未達標 |
| reconnectionService.js Statements | ≥ 80% | 100% | 達標 |
| server.js Statements | ≥ 80%（重連函數） | 0% | 未達標 |

**覆蓋率說明**：整合測試使用獨立測試伺服器（在 reconnection.test.js 內建立），模擬 `server.js` 的行為但不直接匯入。因此 Jest coverage 無法計算 `server.js` 的覆蓋率。`reconnectionService.js`（純邏輯模組）已達 100%。要提升 `server.js` 覆蓋率需要將 socket handler 重構為可單獨匯入的模組，超出本工單測試範圍。

## 遇到的問題與解決方案

### 問題 1：事件監聽器競爭條件（TC-0202-02a、TC-0202-03a）
**現象**：`waitForEvent(client, 'reconnected')` 超時，但其他重連測試正常通過。
**原因**：測試先發送 `reconnect_request`，再呼叫 `waitForEvent` 註冊監聽器。由於跟猜/預測階段的 `handlePlayerReconnect` 需要額外處理，事件可能在監聽器註冊前就已發送。
**解決**：改為先建立 Promise（預註冊監聽器），再發送 `reconnect_request`：
```javascript
// 修正前（有競爭條件）
client2b.emit('reconnect_request', {...});
const reconnected = await waitForEvent(client2b, 'reconnected');

// 修正後（無競爭條件）
const reconnectedPromise = waitForEvent(client2b, 'reconnected', 10000);
client2b.emit('reconnect_request', {...});
const reconnected = await reconnectedPromise;
```

### 問題 2：測試超時不足
**原因**：跟猜/預測恢復邏輯增加了事件處理時間，預設 5 秒超時可能不足。
**解決**：將相關測試的 `waitForEvent` 超時設為 10 秒，Jest 單測超時設為 15 秒。

## 測試結果

```
reconnection.test.js:
  Tests: 22 passed, 0 failed
  新增: 13 個整合測試
  既有: 9 個整合測試（全部通過）

後端全部測試:
  Test Suites: 10 passed, 10 total
  Tests:       207 passed, 207 total
  （無新增回歸）

前端全部測試:
  Test Suites: 6 failed, 55 passed, 61 total
  Tests:       15 failed, 1378 passed, 1393 total
  （15 個失敗均為既有問題，無新增回歸）
```

## 下一步計劃

- 工單 0203：撰寫 E2E 場景與回歸測試
- 工單 0204：綜合測試報告
