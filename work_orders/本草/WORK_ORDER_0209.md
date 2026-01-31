# 工作單 0209

## 編號：0209
## 日期：2026-01-28
## 標題：修復後端 isRefreshing 移除邏輯

## 工單主旨
修復 F5 重整後玩家被錯誤移除的 BUG

## 內容

### 問題
在 `handlePlayerDisconnect` 的 timeout 回調中，`isRefreshing = true` 時無條件移除玩家（splice），即使是在遊戲階段。遊戲階段應只標記 `isActive = false`，不移除。

此外，重整寬限期（10 秒）和等待階段寬限期（15 秒）過短，頁面重載可能來不及完成重連。

### 具體修改

**修改檔案**：`backend/server.js`

#### 1. 提高寬限期常數
```
REFRESH_GRACE_PERIOD: 10秒 → 30秒
WAITING_PHASE_DISCONNECT_TIMEOUT: 15秒 → 30秒
```

#### 2. 修改 handlePlayerDisconnect 中的 timeout_duration 邏輯
重整寬限期統一使用 30 秒，不再區分 isRefreshing 和 isWaitingPhase 的 timeout 長度差異。

#### 3. 修改 timeout 回調的移除邏輯
```
原邏輯：if (isWaitingPhase || isRefreshing) → 移除玩家
新邏輯：if (isWaitingPhase) → 移除玩家
         else → 標記 isActive = false（包含 isRefreshing 在遊戲階段的情況）
```

#### 4. 清理 refreshingPlayers 的 setTimeout
將 `playerRefreshing` 事件中自動清理的 timeout 也從 10 秒改為 30 秒。

### 驗收標準
- 遊戲中按 F5，後端不會將玩家移除（splice），而是在超時後標記為不活躍
- 等待階段按 F5，30 秒內重連成功則玩家保留
- 後端測試全部通過（215 passed, 0 failed）
