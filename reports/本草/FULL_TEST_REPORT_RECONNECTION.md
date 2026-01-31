# 完整測試報告：重新整理網頁無法重連遊戲

## 報告資訊

| 項目 | 內容 |
|------|------|
| 報告日期 | 2026-01-28 |
| 測試類型 | 程式碼審查 + 靜態分析 + 流程追蹤 |
| 涵蓋工單 | 0188 ~ 0194（共 7 張） |
| 測試計畫書 | `docs/TEST_PLAN_RECONNECTION.md` |
| 問題描述 | 玩家在雲端環境中遊玩時，重新整理瀏覽器頁面後無法重連回正在進行的遊戲 |

---

## 一、測試結果總覽

### 1.1 測試通過率

| 測試類型 | 工單 | 測試項目數 | PASS | FAIL | PARTIAL |
|---------|------|-----------|------|------|---------|
| 單元測試 | 0188 | 5 | 5 | 0 | 0 |
| 單元測試 | 0189 | 4 | 4 | 0 | 0 |
| 單元測試 | 0190 | 5 | 5 | 0 | 0 |
| 單元測試 | 0191 | 7 | 5 | **1** | 1 |
| 整合測試 | 0192 | 5 | 2 | **1** | **2** |
| 整合測試 | 0193 | 5 | 4 | 0 | **1** |
| E2E 測試 | 0194 | 8 | 0 | **7** | 1 |
| **合計** | | **39** | **25** | **9** | **5** |

### 1.2 通過率
- 單元測試：19/21 (90.5%)
- 整合測試：6/10 (60.0%)
- E2E 測試：0/8 (0%)
- **總通過率：25/39 (64.1%)**

---

## 二、發現的問題清單

### 2.1 Critical（致命）— 1 項

#### BUG-001：`getClientGameState` 函數未定義

| 項目 | 內容 |
|------|------|
| 嚴重度 | Critical |
| 位置 | `backend/server.js` 第 1353 行 |
| 發現工單 | 0191 (TC-0191-03) |
| 影響範圍 | 所有重連場景 |

**問題描述：**

```javascript
// server.js 第 1350-1354 行
socket.emit('reconnected', {
  gameId: roomId,
  playerId: playerId,
  gameState: getClientGameState(gameState, playerId)  // ← 此函數不存在
});
```

`handlePlayerReconnect` 函數在發送重連成功回應時，呼叫了 `getClientGameState(gameState, playerId)`。但此函數在整個後端程式碼中**從未定義**，導致 `ReferenceError`。

**影響：**
- 後端執行到此行時拋出 `ReferenceError: getClientGameState is not defined`
- `reconnected` 事件永遠不會被發送到前端
- 前端 `onReconnected` handler 永遠不會觸發
- 玩家重連流程在最後一步完全中斷
- 後端已完成的正確處理（清計時器、更新 socketId、恢復狀態）全部白費，但資料狀態已被修改

**對比：**
其他類似事件都直接傳遞 `gameState`：
- `roomCreated`（第 531 行）：`gameState: roomState` ✅
- `joinedRoom`（第 591 行）：`gameState` ✅
- `broadcastGameState`（第 457 行）：`gameState` ✅

**修復建議：**
將 `getClientGameState(gameState, playerId)` 替換為 `gameState`。

---

### 2.2 High（高）— 2 項

#### BUG-002：GameRoom 頁面無主動重連邏輯

| 項目 | 內容 |
|------|------|
| 嚴重度 | High |
| 位置 | `frontend/src/components/GameRoom/GameRoom.js` |
| 發現工單 | 0192 (TC-0192-02) |
| 影響範圍 | 所有從 GameRoom 頁面重整的場景 |

**問題描述：**
- 重連觸發邏輯僅存在於 `Lobby.js`（第 210-222 行）
- 頁面重整後，瀏覽器 URL 為 `/game/xxx`，React Router 直接渲染 GameRoom
- **Lobby 組件不會 mount，重連邏輯不會執行**
- GameRoom 組件沒有主動發起重連請求的程式碼
- Socket.io 的 `reconnect` 事件僅在「斷線後自動重連」時觸發，頁面刷新是全新連線，不觸發此事件

**修復建議：**
在 GameRoom 組件中加入重連邏輯，或在 App 層級統一處理重連。

#### BUG-003：`beforeunload` handler 僅在 Lobby 註冊

| 項目 | 內容 |
|------|------|
| 嚴重度 | High |
| 位置 | `frontend/src/components/Lobby/Lobby.js` 第 224-235 行 |
| 發現工單 | 0192 (TC-0192-01) |
| 影響範圍 | 影響後端對「重整」vs「斷線」的判斷 |

**問題描述：**
- `beforeunload` 事件 handler 在 Lobby 的 `useEffect` 中註冊
- 當玩家進入 GameRoom 後，Lobby unmount，handler 被移除
- 玩家在 GameRoom 按 F5 時，`playerRefreshing` 事件不會發送
- 後端無法區分「重整」和「斷線」，使用一般斷線的寬限期（60 秒而非 10 秒）
- 功能上 60 秒 > 10 秒更寬裕，但語義不正確

**修復建議：**
將 `beforeunload` handler 移到 App 層級或 GameRoom 組件中。

---

### 2.3 Medium（中）— 3 項

#### BUG-004：跟猜階段無重連恢復邏輯

| 項目 | 內容 |
|------|------|
| 嚴重度 | Medium |
| 位置 | `backend/server.js` `handlePlayerReconnect` 函數 |
| 發現工單 | 0194 (TC-0194-05) |

**問題描述：**
`handlePlayerReconnect` 只恢復預測階段（`postQuestionPhase`，第 1357-1364 行），沒有恢復跟猜階段（`followGuessStarted`）。玩家在跟猜階段重連後，不會收到跟猜提示。

#### BUG-005：`clearPersistedState` 未被呼叫

| 項目 | 內容 |
|------|------|
| 嚴重度 | Medium |
| 位置 | `frontend/src/store/gameStore.js` 第 275-277 行 |
| 發現工單 | 0189 (TC-0189-03) |

**問題描述：**
`clearPersistedState()` 函數已定義但在離開房間流程中未被呼叫。`redux-persist` 的持久化資料在玩家離開後不會被清除，可能導致下次開啟時短暫顯示舊的遊戲狀態。

#### BUG-006：Cloud Run session affinity 需求

| 項目 | 內容 |
|------|------|
| 嚴重度 | Medium |
| 位置 | 部署配置 |
| 發現工單 | 0194 (TC-0194-08) |

**問題描述：**
Socket.io 使用 polling 降級時，多個 HTTP 請求可能被 Cloud Run 負載均衡路由到不同容器，導致連線失敗。需確認 session affinity 配置。

---

### 2.4 Low（低）— 1 項

#### BUG-007：localStorage 無資料完整性驗證

| 項目 | 內容 |
|------|------|
| 嚴重度 | Low |
| 位置 | `frontend/src/utils/localStorage.js` `getCurrentRoom()` |
| 發現工單 | 0188 (TC-0188-04) |

**問題描述：**
`getCurrentRoom()` 不驗證返回物件是否包含 `roomId`, `playerId`, `playerName` 三個必要欄位。但呼叫端有額外檢查，實際影響有限。

---

## 三、問題因果關係圖

```
使用者操作：在 GameRoom 頁面按 F5
    │
    ├─→ BUG-003：beforeunload handler 不在 GameRoom
    │       → playerRefreshing 未發送
    │       → 後端使用 60 秒計時器（非致命）
    │
    ├─→ 瀏覽器重新載入
    │       │
    │       ├─→ URL: /game/xxx → GameRoom mount
    │       │       │
    │       │       └─→ BUG-002：GameRoom 無重連邏輯
    │       │               → 不會主動發送 reconnect 事件
    │       │               → 玩家卡在顯示舊資料的畫面
    │       │
    │       └─→ Socket.io 全新連線（非 reconnect）
    │               → socketService 的自動重連邏輯不觸發
    │
    └─→ 即使觸發重連（例如手動導回 Lobby）
            │
            └─→ 後端 handlePlayerReconnect 執行
                    │
                    └─→ BUG-001：getClientGameState 未定義
                            → ReferenceError
                            → reconnected 事件未發送
                            → 前端收不到回應
                            → 重連失敗
```

**結論：BUG-001 + BUG-002 共同作用，使得重連功能完全無法運作。**

---

## 四、修復優先級建議

| 優先級 | BUG 編號 | 修復內容 | 預期效果 |
|--------|---------|---------|---------|
| P0 | BUG-001 | 將 `getClientGameState(gameState, playerId)` 改為 `gameState` | 後端能正常回應重連請求 |
| P0 | BUG-002 | 在 GameRoom 或 App 層級加入重連邏輯 | 頁面重整後能觸發重連 |
| P1 | BUG-003 | 將 `beforeunload` handler 移到 App 層級 | 後端能正確識別重整行為 |
| P2 | BUG-004 | 在 `handlePlayerReconnect` 加入跟猜階段恢復 | 跟猜中重連可恢復 |
| P2 | BUG-005 | 離開房間時呼叫 `clearPersistedState()` | 避免殘留舊狀態 |
| P3 | BUG-006 | 確認 Cloud Run session affinity 配置 | 提升雲端穩定性 |
| P4 | BUG-007 | 加入資料完整性驗證 | 防禦性程式設計 |

---

## 五、各工單測試詳情

### 工單 0188：localStorage 重連工具函數（單元測試）
- 5/5 PASS
- localStorage 的讀寫、過期、容錯機制實作正確
- 詳見 `reports/REPORT_0188.md`

### 工單 0189：Redux Store 持久化配置（單元測試）
- 4/4 PASS（附中等問題）
- whitelist 涵蓋核心欄位，reducer 行為正確
- `clearPersistedState` 未被使用
- 詳見 `reports/REPORT_0189.md`

### 工單 0190：socketService 重連函數（單元測試）
- 5/5 PASS
- 事件收發、容錯機制、legacy key 相容性均正確
- 詳見 `reports/REPORT_0190.md`

### 工單 0191：後端 handlePlayerReconnect（單元測試）
- 5 PASS / 1 CRITICAL FAIL / 1 CONDITIONAL PASS
- **發現致命 BUG：getClientGameState 未定義**
- 詳見 `reports/REPORT_0191.md`

### 工單 0192：前端重連流程整合測試
- 2 PASS / 1 FAIL / 2 PARTIAL PASS
- **發現路由問題：GameRoom 頁面無重連邏輯**
- **發現 beforeunload handler 作用域問題**
- 詳見 `reports/REPORT_0192.md`

### 工單 0193：後端斷線與重連事件鏈整合測試
- 4 PASS / 1 PARTIAL PASS
- 事件鏈邏輯正確，僅在 getClientGameState 處中斷
- 詳見 `reports/REPORT_0193.md`

### 工單 0194：E2E 重連場景測試
- 0 PASS / 7 FAIL / 1 分析報告
- **所有 E2E 場景均失敗**
- 雲端環境特性分析已完成
- 詳見 `reports/REPORT_0194.md`

---

## 六、結論

### 6.1 問題根因

玩家重新整理網頁後無法重連遊戲，是由**兩個獨立 BUG 共同造成**的：

1. **前端（BUG-002）**：重連邏輯僅在 Lobby 組件中實作，頁面重整後 URL 直接指向 GameRoom，Lobby 不會 mount，重連不會被觸發。

2. **後端（BUG-001）**：即使重連被觸發，`handlePlayerReconnect` 函數呼叫了不存在的 `getClientGameState` 函數，導致 `ReferenceError`，重連回應無法發出。

### 6.2 為什麼過去沒有發現

- `getClientGameState` BUG 自工單 0079 開發重連功能時就存在
- 本地開發時可能未充分測試頁面重整場景
- 後端的 socket event handler 內的錯誤不會導致程序崩潰，只是靜默失敗
- Cloud Run 環境的特殊性（容器擴縮、負載均衡）可能加劇了問題的表現

### 6.3 修復建議

修復 BUG-001 和 BUG-002 即可解決核心問題。BUG-003 至 BUG-007 為附帶發現，建議依優先級排入後續修復計畫。

---

**報告完成日期**：2026-01-28
**測試執行者**：Claude Code
