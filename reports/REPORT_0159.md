# 報告書 0159

**工作單編號**：0159

**完成日期**：2026-01-27

**工作單標題**：修復 socketService 返回值問題

---

## 一、完成內容摘要

1. 在 `socketService.js` 中建立通用的 `safeOn()` 函數，確保所有事件監聽函數在任何情況下都返回有效的取消訂閱函數
2. 將所有 18 個 `on*` 函數改為使用 `safeOn()` 包裝
3. 在 `GameRoom.test.js` 中補充遺漏的 `onPlayerLeft` 和 `onReconnectFailed` mock
4. 在 `GameRoom.ai-visual.test.js` 和 `GameRoom.local.test.js` 中補充遺漏的 mock
5. 在 `SinglePlayerMode.test.js` 和 `SinglePlayerURLParsing.test.js` 中修復 mock（所有 `jest.fn()` 改為 `jest.fn(() => jest.fn())` 確保返回函數）

---

## 二、測試結果

### 修改前
```
GameRoom.test.js: 46 passed, 15 failed, 61 total
原因: TypeError: unsubPlayerLeft is not a function
```

### 修改後
```
GameRoom.test.js: 61 passed, 0 failed, 61 total
```

---

## 三、遇到的問題與解決方案

### 問題 1：根本原因不在 socketService 本身
- **描述**：原先以為 `socketService.on*` 函數在某些情況返回 undefined，實際上根本原因是測試檔案中遺漏了 `onPlayerLeft` 和 `onReconnectFailed` 的 mock
- **解決**：同時修復了兩個層面：
  1. socketService 加入防禦性 `safeOn()` 函數（防止未來類似問題）
  2. 補充所有測試檔案中遺漏的 mock

### 問題 2：ai-visual 和 local 測試仍然失敗
- **描述**：這兩個測試檔案缺少 `useAuth` mock（AuthProvider 問題）
- **影響**：非本工單範圍，屬於工單 0161 的問題
- **結論**：socketService 修復已生效，AuthProvider 問題將在工單 0161 處理

---

## 四、修改的檔案

| 檔案 | 修改內容 |
|------|---------|
| `frontend/src/services/socketService.js` | 新增 `safeOn()` 函數，所有 `on*` 函數使用 `safeOn()` |
| `frontend/src/components/GameRoom/GameRoom.test.js` | 補充 `onPlayerLeft` 和 `onReconnectFailed` mock |
| `frontend/src/components/GameRoom/__tests__/GameRoom.ai-visual.test.js` | 補充遺漏的 mock |
| `frontend/src/components/GameRoom/__tests__/GameRoom.local.test.js` | 補充遺漏的 mock |
| `frontend/src/__tests__/e2e/SinglePlayerMode.test.js` | 修復 mock 返回函數 |
| `frontend/src/__tests__/e2e/SinglePlayerURLParsing.test.js` | 補充遺漏的 mock |

---

## 五、下一步計劃

1. 工單 0160：修復 useAIPlayers 無限循環
2. 工單 0161：建立 E2E 測試基礎設施（修復 AuthProvider 問題）

---

*報告生成時間: 2026-01-27*
