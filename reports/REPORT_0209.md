# 完成報告 0209

## 工作單編號：0209
## 完成日期：2026-01-28

## 完成內容摘要
修復後端 `isRefreshing` 導致遊戲階段玩家被錯誤移除的 BUG。

### 修改內容
1. 將 `WAITING_PHASE_DISCONNECT_TIMEOUT` 從 15 秒提高到 30 秒
2. 將 `REFRESH_GRACE_PERIOD` 從 10 秒提高到 30 秒
3. 修改 `handlePlayerDisconnect` timeout 回調：只有等待階段才移除玩家，遊戲階段一律標記 `isActive = false`（不論是否 isRefreshing）

### 修改檔案
- `backend/server.js`

## 遇到的問題與解決方案
- 原 BUG：`isRefreshing || isWaitingPhase` 條件導致遊戲階段重整的玩家也被 splice 移除
- 解決：改為只用 `isWaitingPhase` 判斷是否移除，遊戲階段統一走 inactive 路徑

## 測試結果
- 後端測試：215 passed, 0 failed
