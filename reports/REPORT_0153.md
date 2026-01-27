# 報告書 0153

**工作單編號**：0153

**完成日期**：2026-01-27

**工作單標題**：單元測試 - 後端遊戲邏輯服務

---

## 一、完成內容摘要

本工單測試後端核心遊戲邏輯服務。

### 測試執行結果

| 功能模組 | 測試狀態 | 測試數量 |
|---------|---------|----------|
| 房間管理 | ✅ 通過 | 包含在 socket.test.js |
| 遊戲狀態管理 | ✅ 通過 | 包含在 socket.test.js |
| 問牌邏輯 | ⚠️ 部分 | 需要更多測試 |
| 猜牌邏輯 | ⚠️ 部分 | 需要更多測試 |
| 跟猜機制 | ⚠️ 部分 | 需要更多測試 |
| 預測機制 | ✅ 通過 | prediction.test.js |
| 計分系統 | ✅ 通過 | prediction.test.js |

---

## 二、測試數據

### 2.1 後端測試結果詳細
```
PASS __tests__/prediction.test.js (16 tests)
PASS __tests__/socket.test.js (12 tests)
PASS __tests__/services/presenceService.test.js (9 tests)
PASS __tests__/services/invitationService.test.js (9 tests)
PASS __tests__/services/friendService.test.js (16 tests)
PASS __tests__/services/reconnectionService.test.js (51 tests)
PASS __tests__/reconnection.test.js (9 tests)

Test Suites: 7 passed
Tests: 122 passed
```

### 2.2 預測機制測試詳情
```
settlePredictions
  ✓ 沒有預測時應返回空陣列
  ✓ 預測正確時應標記 isCorrect 為 true
  ✓ 預測錯誤時應標記 isCorrect 為 false
  ✓ 預測正確應加 1 分
  ✓ 預測錯誤應扣 1 分
  ✓ 0 分時預測錯誤不會變成負分
  ✓ 只結算當局的預測
  ✓ 不應重複結算已結算的預測
  ✓ 多人預測應各自結算
  ✓ scoreChanges 應累計現有分數變化
```

### 2.3 Socket 函數測試詳情
```
findSocketByPlayerId
  ✓ player.socketId 有效時返回 socket
  ✓ player.socketId 無效時嘗試 fallback
  ✓ fallback 成功時自動修復 socketId
  ✓ 找不到時返回 null
  ✓ 玩家不存在時返回 null
  ✓ 房間不存在時返回 null

validateSocketConnections
  ✓ 清理無效的 socketId
  ✓ 保留有效的 socketId
  ✓ 不處理已斷線的玩家
  ✓ 房間不存在時安全返回

handlePlayerReconnect
  ✓ 重連時更新 player.socketId
  ✓ 重連時更新 playerSockets Map
  ✓ 重連時清除斷線計時器
  ✓ 重連時恢復 isDisconnected 狀態
  ✓ 房間不存在時發送 reconnectFailed
  ✓ 玩家不在房間時發送 reconnectFailed
```

---

## 三、遇到的問題與解決方案

### 問題 1：server.js 覆蓋率為 0%
- **描述**：主要的遊戲邏輯都在 `server.js` 中，但沒有被測試覆蓋
- **原因**：`server.js` 檔案有 1837 行程式碼，邏輯過於集中
- **影響**：問牌、猜牌、跟猜等核心邏輯沒有測試保護
- **建議**：
  1. 將 `server.js` 中的邏輯提取到獨立模組
  2. 建立 `gameLogic.js` 處理遊戲規則
  3. 建立 `questionHandler.js` 處理問牌邏輯
  4. 建立 `guessHandler.js` 處理猜牌邏輯

### 問題 2：整合測試依賴實際連線
- **描述**：`reconnection.test.js` 需要較長時間執行 (102秒)
- **原因**：測試實際的超時邏輯（15秒、60秒超時）
- **影響**：CI/CD 執行時間較長
- **建議**：在測試中使用 `jest.useFakeTimers()` 模擬計時器

---

## 四、驗收標準檢查

| 標準 | 狀態 |
|------|------|
| 所有 52 個測試案例通過 | ⚠️ 現有測試通過，但數量不足 |
| 覆蓋率達到 85% | ❌ 整體 15.53%，services 91.19% |
| 無 console 錯誤或警告 | ✅ 無異常錯誤 |
| 所有邊界情況正確處理 | ⚠️ 需要更多邊界測試 |

---

## 五、已測試的後端服務覆蓋率

| 服務檔案 | Statements | Branch | Functions | Lines |
|---------|------------|--------|-----------|-------|
| friendService.js | 83.9% | 70.58% | 100% | 88.88% |
| invitationService.js | 97.29% | 81.81% | 100% | 100% |
| presenceService.js | 89.47% | 72.72% | 100% | 94.11% |
| reconnectionService.js | 100% | 97.29% | 100% | 100% |

---

## 六、下一步計劃

1. **架構重構**：將 `server.js` 的邏輯提取到可測試模組
2. **補充測試**：
   - 問牌類型 1/2/3 的完整測試
   - 猜牌正確/錯誤的測試
   - 跟猜機制的邊界測試
3. **優化測試執行時間**：使用假計時器

---

*報告生成時間: 2026-01-27*
