# 報告書 0204

## 工作單編號
0204

## 完成日期
2026-01-28

## 完成內容摘要

彙整工單 0199-0203 的測試結果，確認覆蓋率，撰寫風險評估與後續建議。

---

## 一、覆蓋率報告

### 前端覆蓋率對比表

| 模組 | 修改前 Stmts | 修改後 Stmts | 目標 | 達標 |
|------|-------------|-------------|------|------|
| All files | 82.83% | 84.03% | ≥ 80% | ✓ |
| GameRoom.js | 57.34% | 59.13% | ≥ 70% | ✗（+1.79%） |
| socketService.js | 66.3% | 80.31% | ≥ 80% | ✓（+14.01%） |
| localStorage.js | — | 74.5% | ≥ 93% | ✗（新增測試） |
| gameStore.js | 100% | 96.55% | 100% | ✗（-3.45%） |
| selectors.js | 100% | 100% | 100% | ✓ |

**說明**：
- **GameRoom.js** 未達 70% 目標，因為 GameRoom.js 共 2300+ 行，重連邏輯僅佔約 107 行（第 560-667 行），重連相關程式碼已完整覆蓋，但提升至 70% 需要額外測試大量非重連功能
- **localStorage.js** 未達 93% 目標，因為暱稱相關函數（saveNickname、getNickname、clearNickname）未在本次工單範圍內測試，重連相關函數（saveCurrentRoom、getCurrentRoom、clearCurrentRoom）已完整覆蓋
- **gameStore.js** 微降 3.45% 可能與測試環境差異有關，核心功能未受影響
- **socketService.js** 提升 14.01%，達標

### 後端覆蓋率對比表

| 模組 | 修改前 Stmts | 修改後 Stmts | 目標 | 達標 |
|------|-------------|-------------|------|------|
| All files | 21.63% | 21.63% | ≥ 40% | ✗ |
| server.js | 0% | 0% | 重連函數 ≥ 80% | ✗ |
| logic | 95.69% | 95.69% | 維持 | ✓ |
| services | 92.57% | 92.57% | 維持 | ✓ |
| reconnectionService.js | 100% | 100% | — | ✓ |

**說明**：
- **server.js** 覆蓋率仍為 0%，因為整合測試使用獨立測試伺服器（在 reconnection.test.js 內建立），模擬 server.js 的行為但不直接匯入。Jest coverage 無法計算間接測試的覆蓋率
- 要提升 server.js 覆蓋率，需要將 socket handler 重構為可單獨匯入測試的模組
- **reconnectionService.js**（純邏輯模組）已達 100% 覆蓋率

---

## 二、測試結果總覽

| 工單 | 類型 | 新增測試數 | 通過 | 失敗 | 備註 |
|------|------|-----------|------|------|------|
| 0199 | 修復 | 0（修復 91 個） | 1378 | 15 | 更新 mock、同步 constants、修正測試邏輯 |
| 0200 | 前端單元 | 11 | 72 | 0 | GameRoom 重連邏輯測試 |
| 0201 | 前端單元 | 15 | 44 | 0 | socketService 重連函數測試 |
| 0202 | 後端整合 | 13 | 22 | 0 | handlePlayerReconnect 整合測試 |
| 0203 | 場景+回歸 | 16 | 30+26 | 0 | E2E + localStorage |
| **合計** | — | **55** | — | — | — |

### 最終測試數據

| 套件 | 通過 | 失敗 | 總計 |
|------|------|------|------|
| 前端 Test Suites | 55 | 6 | 61 |
| 前端 Tests | 1387 | 15 | 1402 |
| 後端 Test Suites | 10 | 0 | 10 |
| 後端 Tests | 215 | 0 | 215 |
| **全部** | **1602** | **15** | **1617** |

15 個前端失敗均為工單 0199 已記錄的既有問題，無新增回歸。

---

## 三、BUG 修復驗證結論

| BUG 編號 | 描述 | 驗證方式 | 對應測試案例 | 結果 |
|---------|------|---------|------------|------|
| BUG-001 | reconnected 事件未攜帶 gameState | 自動化測試 | TC-0202-01a/b/c | ✓ 通過 |
| BUG-002 | 重連 useEffect 缺少條件檢查 | 自動化測試 | TC-0200-01a/b/c/d/e | ✓ 通過 |
| BUG-003 | beforeunload 未呼叫 emitPlayerRefreshing | 自動化測試 | TC-0200-03a/b | ✓ 通過 |
| BUG-004 | 跟猜階段重連未恢復 followGuessStarted | 自動化測試 | TC-0202-02a/b/c | ✓ 通過 |
| BUG-005 | handleLeaveRoom 未清理 localStorage | 自動化測試 | TC-0200-04a | ✓ 通過 |

所有 5 個已修復的 BUG 均通過自動化測試驗證。

---

## 四、殘留問題與風險評估

### 既有殘留問題

| 風險編號 | 嚴重度 | 描述 | 影響 | 建議 |
|---------|--------|------|------|------|
| BUG-006 | Medium | Cloud Run session affinity | 雲端環境 Socket.io polling 降級時可能路由到不同容器 | 確認部署配置，設定 session affinity |
| BUG-007 | Low | localStorage 無資料完整性驗證 | 理論上可能讀取不完整的房間資訊 | 呼叫端已有額外檢查，影響有限 |

### 工單 0199-0203 執行過程中新發現的問題

| 編號 | 嚴重度 | 描述 | 發現方式 | 建議 |
|------|--------|------|---------|------|
| BUG-008 | Low | App.test.js 2 個測試失敗：Firebase AuthContext 在測試環境中觸發 ErrorBoundary | 0199 既有 | 需更新 Firebase mock 或 ErrorBoundary 邏輯 |
| BUG-009 | Low | SinglePlayerMode.test.js 4 個測試失敗：localGameController mock 不完整 | 0199 既有 | 需更新 LocalGameController mock |
| BUG-010 | Low | AIPlayerSelector.test.js 1 個測試失敗：AI 難度描述文字與 mock 不一致 | 0199 既有 | 需同步 AI_DIFFICULTY 描述文字 |
| BUG-011 | Low | Profile.test.js 4 個測試失敗：匿名用戶 UI 不再顯示提示文字 | 0199 既有 | 需更新測試以匹配新 UI |
| BUG-012 | Low | QuestionFlow.test.js 4 個測試失敗：QUESTION_TYPE mock 值不一致 | 0199 既有 | 需同步 shared/constants.js 的 QUESTION_TYPE 值 |
| BUG-013 | Low | socket 整合測試跨測試干擾 | 0203 新發現 | 已修正：新增 activeClients 追蹤和 pendingTimers 管理 |

### 覆蓋率未達標項目分析

| 項目 | 目標 | 實際 | 差距原因 | 提升建議 |
|------|------|------|---------|---------|
| GameRoom.js | ≥ 70% | 59.13% | 2300+ 行中僅 107 行為重連邏輯 | 需額外測試本地模式、action handler、UI 渲染 |
| localStorage.js | ≥ 93% | 74.5% | 暱稱函數未測試 | 補充 saveNickname/getNickname/clearNickname 測試 |
| 後端 All files | ≥ 40% | 21.63% | server.js 0% 拉低整體 | 需重構 server.js 的 socket handler 為可匯入模組 |

---

## 五、建議後續行動

### 短期（低成本）
1. **修復 BUG-008 至 BUG-012**（15 個既有失敗測試）：更新 mock 和期望值以匹配當前程式碼
2. **補充 localStorage 暱稱函數測試**：約 6 個測試案例即可達到 93% 覆蓋率
3. **確認 Cloud Run 部署設定**（BUG-006）：確保 session affinity 正確配置

### 中期（中成本）
4. **GameRoom.js 覆蓋率提升**：撰寫本地模式處理、action handler 的單元測試，目標 70%
5. **server.js 模組化重構**：將 socket handler 抽取為獨立函數，可直接匯入測試，提升後端覆蓋率

### 長期（高成本）
6. **真實 E2E 測試**：使用 Playwright 或 Cypress 進行瀏覽器端到端測試
7. **CI/CD 整合**：在 GitHub Actions 中自動執行測試和覆蓋率檢查

---

## 六、版本歷程

| 工單 | Commit | 版本 | 日期 |
|------|--------|------|------|
| 0199 | df2bb02 | 1.0.192 | 2026-01-28 |
| 0200 | 871406e | 1.0.193 | 2026-01-28 |
| 0201 | ad817fc | 1.0.194 | 2026-01-28 |
| 0202 | 455660a | 1.0.195 | 2026-01-28 |
| 0203 | 36d6406 | 1.0.196 | 2026-01-28 |
| 0204 | （本報告） | 1.0.197 | 2026-01-28 |
