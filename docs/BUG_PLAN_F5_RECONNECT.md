# BUG 修復計畫書：F5 重新整理後無法正常接收房間訊息

## 建立日期：2026-01-28

---

## 問題描述

**現象**：玩家在遊戲中或等待階段按 F5 重新整理後：
1. 自己不會看到任何斷線或錯誤訊息
2. 其他玩家看到該玩家「已退出」
3. 重整後的玩家無法接收該房間的任何訊息

**嚴重程度**：高（遊戲核心功能損壞）

---

## 根因分析

### 流程追蹤

按下 F5 後的完整時序：

```
[前端] beforeunload → emitPlayerRefreshing(gameId, playerId)
[前端] 頁面卸載 → Socket 連線斷開
[後端] disconnect 事件 → handlePlayerDisconnect()
  → 檢查 refreshingPlayers → 設定 timeout
  → socket.leave(gameId)
  → broadcastGameState（其他玩家看到斷線）
[後端] timeout 到期 → 玩家被移除或標記為不活躍
[前端] 頁面重新載入 → React 初始化 → 新 Socket 連線
[前端] onConnectionChange(true) → attemptReconnect()
[後端] reconnect 事件 → handlePlayerReconnect()
```

### 發現的 BUG

#### BUG-1：`isRefreshing` 在遊戲階段導致玩家被「移除」而非「停用」

**檔案**：`backend/server.js` 第 1290 行

```javascript
if (isWaitingPhase || isRefreshing) {
  // 移除玩家（splice）—— 即使在遊戲階段也會移除！
  currentState.players.splice(currentPlayerIndex, 1);
}
```

**問題**：
- 當 `isRefreshing = true` 時，不論遊戲階段為何，玩家都會被**直接移除**（splice）
- 遊戲中的正常斷線是標記為 `isActive = false`（停用），而非移除
- `isRefreshing` 的寬限期只有 **10 秒**，一旦超時玩家就被移除
- 移除後 `handlePlayerReconnect` 找不到該玩家 → 回傳 `player_not_found`

**這是核心 BUG**：重整機制反而比正常斷線更嚴格，導致玩家被移除。

#### BUG-2：`beforeunload` 中 `emitPlayerRefreshing` 不可靠

**檔案**：`frontend/src/components/GameRoom/GameRoom.js` 第 635-652 行

```javascript
const handleBeforeUnload = () => {
  if (currentGameId && currentPlayerId) {
    emitPlayerRefreshing(currentGameId, currentPlayerId);
  }
};
```

**問題**：
- `beforeunload` 事件中 socket emit 是 fire-and-forget，不保證後端收到
- 瀏覽器在 `beforeunload` 後可能立即關閉 WebSocket，訊息可能來不及送出
- 如果 `emitPlayerRefreshing` 沒送達：
  - 等待階段：15 秒後移除（`WAITING_PHASE_DISCONNECT_TIMEOUT`）
  - 遊戲階段：60 秒後標記不活躍（`DISCONNECT_TIMEOUT`）
- 如果 `emitPlayerRefreshing` 送達：
  - **任何階段：10 秒後移除**（BUG-1）

**結論**：送達反而更糟。不送達在遊戲階段有 60 秒寬限（足夠重連）。

#### BUG-3：前端重連後沒有正確恢復 UI 狀態

**檔案**：`frontend/src/components/GameRoom/GameRoom.js` 第 563-577 行

```javascript
const unsubReconnected = onReconnected(({ gameId, playerId, gameState: reconnState }) => {
  dispatch(updateGameState({
    gameId: reconnGameId,
    players: reconnState.players,
    // ...
    currentPlayerId: reconnPlayerId,
  }));
  setIsLoading(false);
});
```

**問題**：
- `scores`、`currentRound`、`predictions` 等欄位未在重連時恢復
- 如果重連失敗（玩家已被移除），前端只設定 `gameNotExist = true`，但沒有明顯的 UI 提示讓玩家知道發生了什麼
- 整個重連過程沒有 loading 狀態指示

#### BUG-4：等待階段重整的寬限期太短

**後端**：
- 等待階段正常斷線：15 秒
- 重整中：10 秒
- 遊戲中正常斷線：60 秒

**問題**：
- 10-15 秒在較慢的網路或設備上可能不夠頁面重載 + 新 socket 連線 + 發送重連請求
- 等待階段的玩家（尚未開始遊戲）被移除後就回不來了

---

## 修復方案

### 工單 0209：修復後端 `isRefreshing` 移除邏輯

**修改檔案**：`backend/server.js`

**修改內容**：
1. **遊戲階段重整不移除玩家**：修改 `handlePlayerDisconnect` 中的 timeout 回調
   - 當 `isRefreshing = true` 且 `isWaitingPhase = false` 時，行為應與遊戲中正常斷線相同（標記 `isActive = false`，不移除）
   - 只有等待階段 + 重整才移除玩家
2. **增加重整寬限期**：將 `REFRESH_GRACE_PERIOD` 從 10 秒提高到 30 秒
3. **增加等待階段寬限期**：將 `WAITING_PHASE_DISCONNECT_TIMEOUT` 從 15 秒提高到 30 秒

**具體修改**：
```javascript
// 修改 timeout_duration 邏輯
if (isRefreshing) {
  timeout_duration = 30000; // 重整寬限 30 秒（原 10 秒）
} else if (isWaitingPhase) {
  timeout_duration = 30000; // 等待階段 30 秒（原 15 秒）
} else {
  timeout_duration = DISCONNECT_TIMEOUT; // 遊戲中 60 秒
}

// 修改 timeout 回調中的移除邏輯
if (isWaitingPhase) {
  // 等待階段：移除玩家（不論是否 isRefreshing）
  currentState.players.splice(currentPlayerIndex, 1);
} else {
  // 遊戲階段：標記不活躍（不論是否 isRefreshing）
  currentState.players[currentPlayerIndex].isActive = false;
  currentState.players[currentPlayerIndex].isDisconnected = false;
}
```

### 工單 0210：加強前端重連可靠性

**修改檔案**：
- `frontend/src/components/GameRoom/GameRoom.js`
- `frontend/src/services/socketService.js`

**修改內容**：
1. **增加重連中狀態**：新增 `isReconnecting` state，在 `attemptReconnect` 時設為 true
2. **增加重連重試**：如果第一次重連沒有在 5 秒內收到回應，自動重試（最多 3 次）
3. **增加重連 UI 提示**：顯示「重新連線中...」覆蓋層
4. **修復 `onReconnected` 狀態恢復**：補齊 `scores`、`currentRound` 等缺失欄位
5. **修復 `beforeunload` 可靠性**：使用 `navigator.sendBeacon` 作為 fallback（若可用）

**具體修改**：

#### 新增重連狀態和 UI
```javascript
const [isReconnecting, setIsReconnecting] = useState(false);
const reconnectTimerRef = useRef(null);
const reconnectAttemptsRef = useRef(0);
```

#### 修改 `onConnectionChange` useEffect
```javascript
useEffect(() => {
  if (isLocalMode) return;

  const unsubConnect = onConnectionChange((connected) => {
    if (connected) {
      const savedRoom = getCurrentRoom();
      if (savedRoom && savedRoom.roomId === gameId && savedRoom.playerId) {
        setIsReconnecting(true);
        reconnectAttemptsRef.current = 0;
        attemptReconnectWithRetry(savedRoom);
      }
    }
  });

  return () => {
    unsubConnect();
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
  };
}, [gameId, isLocalMode]);

const attemptReconnectWithRetry = (savedRoom) => {
  const MAX_RETRIES = 3;
  const RETRY_INTERVAL = 5000;

  attemptReconnect(savedRoom.roomId, savedRoom.playerId, savedRoom.playerName);

  reconnectTimerRef.current = setTimeout(() => {
    reconnectAttemptsRef.current++;
    if (reconnectAttemptsRef.current < MAX_RETRIES && isReconnecting) {
      console.log(`[重連] 第 ${reconnectAttemptsRef.current + 1} 次重試`);
      attemptReconnectWithRetry(savedRoom);
    } else {
      setIsReconnecting(false);
    }
  }, RETRY_INTERVAL);
};
```

#### 修復 `onReconnected` 補齊缺失欄位
```javascript
dispatch(updateGameState({
  gameId: reconnGameId,
  players: reconnState.players,
  maxPlayers: reconnState.maxPlayers,
  gamePhase: reconnState.gamePhase,
  currentPlayerIndex: reconnState.currentPlayerIndex,
  currentPlayerId: reconnPlayerId,
  hiddenCards: reconnState.hiddenCards,
  gameHistory: reconnState.gameHistory,
  winner: reconnState.winner,
  // 補齊缺失欄位
  scores: reconnState.scores,
  currentRound: reconnState.currentRound,
  predictions: reconnState.predictions,
}));
setIsReconnecting(false);
if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
```

#### 新增重連 UI 覆蓋層
```jsx
{isReconnecting && (
  <div className="gr-reconnecting-overlay">
    <div className="gr-reconnecting-content">
      <div className="gr-reconnecting-spinner"></div>
      <p>重新連線中...</p>
    </div>
  </div>
)}
```

### 工單 0211：新增重連 UI 樣式

**修改檔案**：`frontend/src/components/GameRoom/GameRoom.css`

**修改內容**：新增 `.gr-reconnecting-overlay` 相關 CSS 樣式
- 全屏半透明覆蓋層
- 居中 spinner + 文字
- 與現有設計風格一致

---

## 工單依賴關係

```
工單 0209（後端修復）─── 無依賴，可獨立實作
工單 0210（前端加強）─── 依賴工單 0209（需要後端先修好）
工單 0211（UI 樣式）──── 依賴工單 0210（需要先新增 HTML 結構）
```

## 驗證方式

### 自動測試
- 前端測試：`cd frontend && npm test`（1402 passed, 0 failed）
- 後端測試：`cd backend && npm test`（215 passed, 0 failed）

### 手動測試場景
1. **等待階段 F5**：
   - 建立房間 → 其他玩家加入 → 按 F5 → 應在 30 秒內自動重連 → 其他玩家看到該玩家恢復
2. **遊戲中 F5**：
   - 遊戲進行中 → 按 F5 → 應在 30 秒內自動重連 → 遊戲繼續正常進行
3. **快速 F5**：
   - 連續快速按 F5 多次 → 應最終成功重連 → 不會顯示錯誤
4. **慢速網路 F5**：
   - 模擬慢速網路 → F5 → 應看到「重新連線中...」提示 → 重試直到成功
5. **重連失敗**：
   - 重連超時（房間已刪除）→ 應看到清楚的錯誤提示 → 自動導回大廳
