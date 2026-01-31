# 報告書 0194

## 工作單編號
0194

## 完成日期
2026-01-28

## 完成內容摘要
完成雲端環境重新整理重連場景的 E2E 測試（完整路徑追蹤 + 雲端因素分析）。

## 測試結果

### TC-0194-01：等待階段重整 — FAIL

**路徑追蹤：**
1. 玩家在 `/game/xxx`（gamePhase: waiting）→ 按 F5
2. `beforeunload`：Lobby 已 unmount，handler 不存在 → `playerRefreshing` 未發送
3. Socket 斷線 → 後端 `handlePlayerDisconnect` → `isRefreshing = false`, `isWaitingPhase = true` → 15 秒計時器
4. 頁面重新載入 → URL 為 `/game/xxx` → GameRoom 組件 mount
5. Redux persist 提供舊的 gameState → 頁面顯示舊資料
6. Socket 新連線建立 → 但 GameRoom 沒有主動重連邏輯
7. Socket.io 的 `reconnect` 事件不觸發（全新連線）
8. 15 秒後，後端移除玩家

**結果：FAIL** — 玩家看到舊的遊戲畫面但無法操作，15 秒後被移除。

### TC-0194-02：遊戲進行中重整（輪到自己）— FAIL

**路徑追蹤：**
1. 玩家在 `/game/xxx`（自己的回合）→ 按 F5
2. `playerRefreshing` 未發送（同 TC-0194-01 原因）
3. Socket 斷線 → 60 秒計時器
4. 頁面重新載入 → GameRoom mount → 但無主動重連
5. 即使有人觸發重連（如 socketService 自動重連），後端 `getClientGameState` BUG 會阻斷
6. 60 秒後，玩家被標記為 `isActive = false`

**結果：FAIL** — 無法重連。

### TC-0194-03：遊戲進行中重整（非自己回合）— FAIL

**路徑追蹤：** 與 TC-0194-02 相同，結果相同。

**結果：FAIL**

### TC-0194-04：問牌後預測階段重整 — FAIL

**路徑追蹤：**
- 同上，額外注意：即使修復重連 BUG，`postQuestionPhase` 恢復邏輯（server.js 第 1357-1364 行）需要重連成功後才執行
- 目前因 `getClientGameState` BUG 無法到達

**結果：FAIL**

### TC-0194-05：跟猜階段重整 — FAIL

**路徑追蹤：**
- 跟猜階段 (`gamePhase: followGuessing`)
- 重連後需要恢復跟猜介面
- 後端 `handlePlayerReconnect` 沒有針對跟猜階段的恢復邏輯
- 只有預測階段有恢復邏輯（第 1357-1364 行）
- **即使修復 getClientGameState BUG，跟猜階段的重連也不完整**

**結果：FAIL**

### TC-0194-06：多人同時重整 — FAIL

**分析：**
- 每個玩家獨立觸發斷線和重連流程
- 後端使用各自的 `timeoutKey`（`${gameId}:${playerId}`）管理計時器
- 計時器互不干擾 ✅
- 但每個人的重連都會因 `getClientGameState` BUG 失敗

**結果：FAIL** — 所有人都無法重連

### TC-0194-07：重整後再重整 — FAIL

**分析：**
- 第一次重整後未成功重連
- 第二次重整時，第一次的斷線計時器仍在倒數
- `getCurrentRoom()` 仍有儲存的房間資訊（2 小時內有效）
- 但因 `getClientGameState` BUG 和路由問題，結果相同

**結果：FAIL**

### TC-0194-08：Cloud Run 特性分析

**WebSocket 支援：**
- Cloud Run 支援 WebSocket（需啟用 HTTP/2 或設定 session affinity）
- Socket.io 配置使用 `transports: ['websocket', 'polling']`（第 322 行），支援降級到 polling ✅
- 但 Cloud Run 的負載均衡可能導致 polling 請求被路由到不同的容器
- 建議使用 `session_affinity: true` 確保同一客戶端的請求到同一容器

**連線超時：**
- Cloud Run 的請求超時預設 300 秒
- WebSocket 在超過此時間後會被強制斷開
- 心跳機制（每 15 秒 ping）有助於保持連線活躍 ✅
- 但 `pingTimeout: 20000` 和 `pingInterval: 25000` 意味著最長 45 秒才偵測到斷線

**容器自動擴縮：**
- 新容器啟動時沒有舊的 `gameRooms` Map 資料
- 如果原容器被關閉（縮容），所有遊戲狀態會遺失
- 這是一個架構層面的風險，但與本次重連 BUG 無直接關聯

## 發現的問題彙總

| 編號 | 嚴重度 | 問題 | 影響範圍 |
|------|--------|------|---------|
| E2E-01 | Critical | `getClientGameState` 未定義 | 所有重連場景 |
| E2E-02 | High | GameRoom 頁面無主動重連邏輯 | 頁面重整後的重連觸發 |
| E2E-03 | High | `beforeunload` handler 僅在 Lobby 註冊 | 影響重整偵測準確性 |
| E2E-04 | Medium | 跟猜階段無重連恢復邏輯 | 跟猜中重整 |
| E2E-05 | Medium | Cloud Run session affinity 配置 | 雲端環境穩定性 |
| E2E-06 | Low | 容器縮容導致狀態遺失 | 長時間運行的遊戲 |

## 結論

**所有 E2E 測試場景均為 FAIL。**

根本原因有兩個：
1. **Critical**：`getClientGameState` 函數未定義，導致後端無法發送重連回應
2. **High**：前端重連邏輯僅在 Lobby 組件中，但頁面重整後 URL 指向 GameRoom，Lobby 不會 mount

這兩個問題共同導致「重新整理網頁後無法重連遊戲」的現象。
