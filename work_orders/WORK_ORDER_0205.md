# 工作單 0205

## 編號
0205

## 日期
2026-01-28

## 工作單標題
修復 15 個既有失敗測試（BUG-008 至 BUG-012）

## 工單主旨
更新過時的測試檔案，使測試期望值匹配當前程式行為，消除全部 15 個前端測試失敗

## 內容

### 背景
工單 0199-0204 測試報告顯示前端有 15 個既有測試失敗，原因均為測試未跟上程式變更，非程式碼 BUG。

### 修改範圍（僅修改測試檔案）

#### BUG-008：App.test.js（2 個失敗）
- **檔案**：`frontend/src/App.test.js`
- **問題**：Firebase AuthContext 在測試環境中觸發 ErrorBoundary
- **修改**：完善 Firebase AuthProvider mock，使 ErrorBoundary 測試不依賴 Firebase 初始化

#### BUG-009：SinglePlayerMode.test.js（4 個失敗）
- **檔案**：`frontend/src/__tests__/e2e/SinglePlayerMode.test.js`
- **問題**：LocalGameController mock 缺少方法
- **修改**：補充 mock 缺少的 `startNextRound`、`handleFollowGuessResponse`、`endTurn` 等方法

#### BUG-010：AIPlayerSelector.test.js（1 個失敗）
- **檔案**：`frontend/src/components/GameSetup/AIPlayerSelector.test.js`
- **問題**：AI 難度描述文字與 constants.js 不一致
- **修改**：更新測試期望值匹配 `shared/constants.js` 的 `getAIDifficultyDescription()` 回傳值

#### BUG-011：Profile.test.js（4 個失敗）
- **檔案**：`frontend/src/components/Profile/Profile.test.js`
- **問題**：匿名用戶 UI 文字已改版，測試期望舊文字
- **修改**：更新測試期望值匹配 Profile.js 當前 UI 文字

#### BUG-012：QuestionFlow.test.js（4 個失敗）
- **檔案**：`frontend/src/components/QuestionFlow/QuestionFlow.test.js`
- **問題**：測試使用中英雙語 regex，程式只有中文描述
- **修改**：更新 regex 為純中文匹配

### 驗收標準

- [ ] 前端測試 0 failed（原 15 個全部修復）
- [ ] 後端測試維持 215 passed, 0 failed
- [ ] 前端覆蓋率 ≥ 84%（不低於修改前）

### 執行步驟

1. 逐一閱讀各失敗測試檔案與對應程式碼
2. 修改測試期望值
3. 執行前端測試驗證
4. 執行後端測試確認無回歸
5. 撰寫報告書 `reports/REPORT_0205.md`

### 產出檔案

- 修改：`frontend/src/App.test.js`
- 修改：`frontend/src/__tests__/e2e/SinglePlayerMode.test.js`
- 修改：`frontend/src/components/GameSetup/AIPlayerSelector.test.js`
- 修改：`frontend/src/components/Profile/Profile.test.js`
- 修改：`frontend/src/components/QuestionFlow/QuestionFlow.test.js`
- 新增：`reports/REPORT_0205.md`
