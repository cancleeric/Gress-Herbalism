# 完成報告 0178

**工作單編號**：0178

**完成日期**：2026-01-27

## 完成內容摘要

修復好友搜尋結果包含不應出現的玩家。

### 修改檔案

#### 1. `backend/services/friendService.js`
- 重寫 `searchPlayers` 函數：
  - 先查詢 `friendships` 表取得已加好友的 ID
  - 再查詢 `friend_requests` 表取得已發送 pending 請求的對象 ID
  - 搜尋時加入 `.not('firebase_uid', 'is', null)` 排除匿名玩家
  - 搜尋時加入 `.not('id', 'in', ...)` 排除已有關係的所有 ID

#### 2. `backend/__tests__/services/friendService.test.js`
- 在 mock chain 中新增 `not` 方法
- 建立 `createSearchMocks` 輔助函數簡化測試
- 更新既有搜尋測試（適配新的 3 次 from 呼叫模式）
- 新增 3 個測試：
  - 排除匿名玩家
  - 排除已加好友的玩家
  - 排除已發送 pending 請求的玩家

## 遇到的問題與解決方案

- **Mock 鏈式呼叫問題**：`eq` 連續呼叫兩次時，第二次 `eq` 需要同時支援鏈式呼叫和 thenable。使用 `{ ...chain, then: resolve => resolve(data) }` 模式解決。

## 測試結果

| 測試項目 | 結果 |
|---------|------|
| 後端測試 | 193/193 通過（+3 新增） |

## 下一步計劃

- 工單 0179：新增雙向互加自動接受測試
