# 測試計畫書：重新整理網頁無法重連遊戲

## 一、測試背景

### 1.1 問題描述
玩家在雲端環境（Cloud Run）中遊玩時，若重新整理瀏覽器頁面，將無法重新連回正在進行的遊戲。

### 1.2 問題根因分析

經過完整的程式碼審查，發現以下問題：

#### 致命 BUG（Critical）
**`backend/server.js:1353`** — `getClientGameState` 函數未定義

```javascript
// server.js 第 1353 行
socket.emit('reconnected', {
  gameId: roomId,
  playerId: playerId,
  gameState: getClientGameState(gameState, playerId) // ← 此函數不存在！
});
```

當玩家重新整理頁面並觸發重連時，後端 `handlePlayerReconnect` 函數會呼叫 `getClientGameState()`，但此函數在整個後端程式碼中**從未被定義**。這會導致 `ReferenceError`，使重連回應無法發出，前端永遠收不到 `reconnected` 事件。

**對比其他正常運作的事件：**
- `roomCreated`（第 531 行）：直接傳送 `gameState: roomState` ✅
- `joinedRoom`（第 591 行）：直接傳送 `gameState` ✅
- `broadcastGameState`（第 457 行）：直接傳送 `gameState` ✅
- `reconnected`（第 1353 行）：呼叫不存在的函數 ❌

#### 相關風險點

1. **Lobby.js 第 66 行**：`playerId` 每次渲染都重新生成（`useState` 初始值），但重連時使用的是 localStorage 中儲存的舊 `playerId`（正確行為）。需確認無衝突。

2. **beforeunload 事件的可靠性**：`emitPlayerRefreshing` 在 `beforeunload` 事件中發送，但瀏覽器不保證此事件中的 WebSocket 訊息能成功送出。

3. **重整寬限期僅 10 秒**：`REFRESH_GRACE_PERIOD = 10000`，若網路較慢或頁面載入時間較長，可能超時。

4. **Redux Persist 與 localStorage 雙重儲存**：重連資訊同時存在於 `redux-persist`（`gress_game`）和 `localStorage`（`gress_current_room` + legacy keys），需確認一致性。

## 二、測試範圍

### 2.1 單元測試
| 工單編號 | 測試目標 | 測試對象 |
|---------|---------|---------|
| 0188 | localStorage 重連工具函數 | `frontend/src/utils/localStorage.js` |
| 0189 | Redux Store 持久化配置 | `frontend/src/store/gameStore.js` |
| 0190 | socketService 重連相關函數 | `frontend/src/services/socketService.js` |
| 0191 | 後端 handlePlayerReconnect 函數 | `backend/server.js` (第 1304-1368 行) |

### 2.2 整合測試
| 工單編號 | 測試目標 | 測試對象 |
|---------|---------|---------|
| 0192 | 前端重連流程整合 | Lobby 組件 + socketService + localStorage |
| 0193 | 後端斷線與重連事件鏈 | disconnect → timeout → reconnect 流程 |

### 2.3 E2E 測試
| 工單編號 | 測試目標 | 測試對象 |
|---------|---------|---------|
| 0194 | 雲端環境重新整理重連場景 | 完整前後端系統 |

## 三、實施計畫

### 3.1 階段一：單元測試（工單 0188-0191）

**測試方式：程式碼審查 + 靜態分析**

每個單元測試工單將：
1. 閱讀目標原始碼
2. 列出所有函數/模組的預期行為
3. 逐一驗證實際程式碼是否符合預期
4. 記錄發現的問題（BUG / 風險 / 改善建議）

### 3.2 階段二：整合測試（工單 0192-0193）

**測試方式：跨模組流程追蹤**

每個整合測試工單將：
1. 定義完整的事件流程
2. 追蹤每一步資料如何在模組間傳遞
3. 驗證邊界條件與錯誤處理
4. 記錄流程斷點或資料不一致的問題

### 3.3 階段三：E2E 測試（工單 0194）

**測試方式：場景模擬分析**

1. 定義使用者操作場景
2. 追蹤從使用者操作到系統回應的完整路徑
3. 分析雲端環境特殊因素（Cloud Run 冷啟動、負載均衡等）
4. 綜合所有發現，提出修復建議

### 3.4 階段四：綜合測試報告

彙整所有測試工單結果，撰寫完整測試報告。

## 四、測試判定標準

| 嚴重度 | 定義 | 處理方式 |
|--------|------|---------|
| Critical | 功能完全無法運作 | 必須修復 |
| High | 功能部分失效或不穩定 | 優先修復 |
| Medium | 有潛在風險但目前可運作 | 排入修復計畫 |
| Low | 程式碼品質改善建議 | 可選修復 |

## 五、文件產出

- 工單：`work_orders/WORK_ORDER_0188.md` ~ `WORK_ORDER_0194.md`
- 個別報告：`reports/REPORT_0188.md` ~ `REPORT_0194.md`
- 完整測試報告：`reports/FULL_TEST_REPORT_RECONNECTION.md`

---

**建立日期**：2026-01-28
**版本**：1.0
