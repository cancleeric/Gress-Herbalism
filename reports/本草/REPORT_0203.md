# 報告書 0203

## 工作單編號
0203

## 完成日期
2026-01-28

## 完成內容摘要

撰寫重連場景 E2E 測試、邊界條件測試、回歸測試和前端 localStorage 重連函數測試。共新增 16 個測試案例（後端 8 個 + 前端 8 個）。

### Part A：後端 E2E 場景測試

| 測試群組 | 測試案例 | 描述 |
|---------|---------|------|
| TC-0203-01 | 01a | 3 人等待階段重整後應恢復完整狀態（含房主、玩家數、gamePhase 驗證） |
| TC-0203-02 | 02a | 輪到自己時重整後應恢復正確狀態（currentPlayerIndex、手牌） |
| TC-0203-03 | 03a | 非自己回合重整後應恢復正確狀態（currentPlayerIndex 不變、手牌完整） |

### Part B：邊界條件測試

| 測試群組 | 測試案例 | 描述 |
|---------|---------|------|
| TC-0203-04 | 04a | 超時被移除後重連應收到 player_not_found |
| TC-0203-05 | 05a | 房間已刪除時 reason = room_not_found 且 message = '房間已不存在' |
| TC-0203-06 | 06a | 3 次快速重整後房間狀態應一致 |

### Part C：回歸測試

| 測試群組 | 測試案例 | 描述 |
|---------|---------|------|
| TC-0203-07 | 07a | 正常加入離開流程不受重連邏輯影響 |
| TC-0203-08 | 08a | 正常遊戲開始流程不受重連邏輯影響 |

### Part D：前端 localStorage 重連函數測試

| 測試群組 | 測試案例 | 描述 |
|---------|---------|------|
| TC-0203-09 | — | saveCurrentRoom 應儲存完整房間資訊並附加 timestamp |
| TC-0203-10 | — | getCurrentRoom 過期機制（2 小時後返回 null） |
| TC-0203-11 | — | getCurrentRoom 未過期資料正常讀取 |
| TC-0203-12 | — | clearCurrentRoom 後 getCurrentRoom 返回 null |
| TC-0203-13 | — | getCurrentRoom 損壞 JSON 容錯 |
| TC-0203-14 | — | getCurrentRoom 無資料時返回 null |
| — | — | saveCurrentRoom localStorage 錯誤容錯 |
| — | — | clearCurrentRoom localStorage 錯誤容錯 |

### 測試基礎建設改進

| 項目 | 新增內容 |
|------|---------|
| activeClients 追蹤 | 全局追蹤所有測試建立的 socket 客戶端，afterEach 統一清理 |
| pendingTimers 追蹤 | 追蹤所有 waitForEvent 計時器，afterEach 統一清除避免跨測試干擾 |
| waitForEvent 改進 | 增加 settled 標記避免重複 resolve/reject；預設超時從 5s 增至 10s |
| afterEach 清理 | 清除計時器 → 斷開客戶端 → 等待 100ms 處理 socket 事件 |

### 覆蓋率

| 項目 | 實際 | 說明 |
|------|------|------|
| localStorage.js Statements | 62.74% | 重連函數（第 123-179 行）已完整覆蓋 |
| localStorage.js Functions | 72.72% | 未覆蓋函數為暱稱相關（saveNickname 等），不在工單範圍 |
| 後端 reconnection.test.js | 30/30 | 含工單 0120 既有 9 個 + 0202 新增 13 個 + 0203 新增 8 個 |

## 遇到的問題與解決方案

### 問題 1：跨測試 socket 連線干擾
**現象**：30 個測試全部執行時，某些測試間歇性超時（reconnected 事件未收到），但單獨執行時通過。
**原因**：測試結束時呼叫 `client.disconnect()` 是非同步的，disconnect 事件在下一個測試執行時才被伺服器處理。前一個測試的 socket 未完全清理會干擾新測試。
**解決**：
1. 新增 `activeClients` 陣列追蹤所有 `createClient()` 建立的連線
2. `afterEach` 中統一斷開所有客戶端並等待 100ms 讓伺服器處理

### 問題 2：waitForEvent 計時器跨測試觸發
**現象**：TC-0203-08a（回歸測試，不使用 reconnected 事件）卻因 `等待事件 reconnected 超時` 而失敗。
**原因**：前一個測試的 `waitForEvent` 計時器在測試結束後仍在運行。當計時器觸發時，其 reject 被 Jest 歸因於當前正在執行的測試。
**解決**：
1. 新增 `pendingTimers` Set 追蹤所有 `waitForEvent` 建立的計時器
2. `afterEach` 中清除所有未完成的計時器
3. `waitForEvent` 加入 `settled` 標記避免重複 resolve/reject

### 問題 3：過期資料自動清除驗證
**原因**：`getCurrentRoom()` 內部在檢測到過期時會呼叫 `clearCurrentRoom()`，需要驗證此副作用。
**解決**：新增「過期資料應被自動清除」測試案例，先存入過期資料，呼叫 `getCurrentRoom()`，再驗證 `localStorage.getItem()` 返回 null。

## 測試結果

```
reconnection.test.js:
  Tests: 30 passed, 0 failed
  新增: 8 個 E2E/邊界/回歸測試（TC-0203-01 至 TC-0203-08）

localStorage.test.js:
  Tests: 26 passed, 0 failed
  新增: 8 個 localStorage 重連函數測試（TC-0203-09 至 TC-0203-14 + 2 個容錯測試）

後端全部測試:
  Test Suites: 10 passed, 10 total
  Tests:       215 passed, 215 total
  （無新增回歸）

前端全部測試:
  Test Suites: 6 failed, 55 passed, 61 total
  Tests:       15 failed, 1386 passed, 1401 total
  （15 個失敗均為既有問題，無新增回歸）
```

## 下一步計劃

- 工單 0204：綜合測試報告
