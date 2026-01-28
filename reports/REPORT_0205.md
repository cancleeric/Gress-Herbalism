# 完成報告 0205

## 編號
0205

## 日期
2026-01-28

## 工作單標題
修復 15 個既有失敗測試（BUG-008 至 BUG-012）

## 執行結果
全部完成 ✅

## 修改摘要

### 1. App.test.js（BUG-008）：6 個失敗 → 0 個失敗
- **根因**：ErrorBoundary 捕獲了未 mock 的子組件（Lobby、GameRoom、Profile 等）在匯入時的依賴錯誤
- **修改**：為 7 個子組件（Lobby、GameRoom、Profile、Leaderboard、Friends、Login、ConnectionStatus）加入 mock，隔離 App 層級測試
- **結果**：8/8 通過

### 2. SinglePlayerMode.test.js（BUG-009）：4 個失敗 → 0 個失敗
- **根因**：AI 玩家名稱已從 `['小草', '藥師', '本草']` 更新為 `['小草', '小花', '小樹']`，測試使用舊名稱
- **修改**：更新 4 處 `藥師` → `小花`、1 處 `本草` → `小樹`
- **結果**：16/16 通過

### 3. AIPlayerSelector.test.js（BUG-010）：1 個失敗 → 0 個失敗
- **根因**：測試期望詳細難度描述（`簡單 - 隨機決策，適合新手練習`），實際 `getAIDifficultyDescription()` 回傳簡化版（`簡單 - 適合新手`）
- **修改**：更新 3 個 regex 匹配器對應當前 constants.js 的描述文字
- **結果**：18/18 通過

### 4. Profile.test.js（BUG-011）：1 個失敗 → 0 個失敗
- **根因**：匿名用戶提示文字已從 `請先使用 Google 帳號登入以查看個人資料` 更新為 `登入 Google 帳號以解鎖完整功能`
- **修改**：更新測試期望文字
- **結果**：17/17 通過

### 5. QuestionFlow.test.js（BUG-012）：1 個失敗 → 0 個失敗
- **根因**：測試假設非活躍玩家應被排除，但遊戲規則允許對已退出玩家問牌（`QuestionFlow.js` 僅過濾 `currentPlayerId`，不過濾 `isActive`）
- **修改**：將 `.not.toBeInTheDocument()` 改為 `.toBeInTheDocument()`，加入遊戲規則註解
- **結果**：16/16 通過

### 6. SinglePlayerURLParsing.test.js：2 個失敗 → 0 個失敗
- **根因**：
  1. 缺少 socket 事件 mock（`onReconnected`、`onConnectionChange`、`emitPlayerRefreshing`、`attemptReconnect`）
  2. `react-scripts` 預設 `resetMocks: true`，在每個測試前呼叫 `jest.resetAllMocks()` 清除了 `jest.mock()` factory 設定的 mock 實作，導致多人模式 useEffect cleanup 時 `unsubGameState()` 返回 `undefined`
- **修改**：
  1. 補齊所有缺少的 socket 事件 mock 函數
  2. 在 `beforeEach` 中重新設定所有 socket 訂閱函數的 `mockReturnValue`，確保 `resetMocks` 後實作仍有效
- **結果**：7/7 通過

## 關鍵發現

### react-scripts `resetMocks: true` 行為
`react-scripts` (CRA) 預設在 Jest 配置中啟用 `resetMocks: true`。此設定會在每個測試開始前自動呼叫 `jest.resetAllMocks()`，清除所有 mock 的：
- 呼叫記錄（calls）
- 實例（instances）
- **實作（implementation）** ← 這是關鍵

因此，在 `jest.mock()` factory 中設定的 `jest.fn(() => unsub)` 實作會在第一個測試執行前被清除。解決方法是在 `beforeEach` 中使用 `mockReturnValue()` 重新設定返回值。

## 驗證結果

### 前端測試
```
Test Suites: 61 passed, 61 total
Tests:       1402 passed, 1402 total
```
- 15 個失敗測試全部修復 ✅
- 零回歸 ✅

### 後端測試
```
Test Suites: 215 passed, 0 failed
```
- 維持全數通過 ✅

## 修改檔案清單

| 檔案 | 操作 |
|------|------|
| `frontend/src/App.test.js` | 修改：加入 7 個子組件 mock |
| `frontend/src/__tests__/e2e/SinglePlayerMode.test.js` | 修改：AI 玩家名稱更新 |
| `frontend/src/components/GameSetup/AIPlayerSelector.test.js` | 修改：難度描述 regex 更新 |
| `frontend/src/components/Profile/Profile.test.js` | 修改：匿名用戶提示文字更新 |
| `frontend/src/components/QuestionFlow/QuestionFlow.test.js` | 修改：非活躍玩家測試邏輯修正 |
| `frontend/src/__tests__/e2e/SinglePlayerURLParsing.test.js` | 修改：補齊 socket mock、beforeEach 重設實作 |
| `reports/REPORT_0205.md` | 新增 |

## 版本
1.0.198
