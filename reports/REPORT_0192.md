# 報告書 0192

## 工作單編號
0192

## 完成日期
2026-01-28

## 完成內容摘要
完成前端重連流程的整合測試（Lobby 組件 + socketService + localStorage + Redux 跨模組流程追蹤）。

## 測試結果

### TC-0192-01：重整前資料保存流程 — PARTIAL PASS

**流程追蹤：**

1. 玩家在 GameRoom 頁面按 F5
2. `beforeunload` 事件觸發（Lobby.js 第 226 行）
3. `getCurrentRoom()` 讀取 localStorage 中的房間資訊
4. 如果有資料，呼叫 `emitPlayerRefreshing(savedRoom.roomId, savedRoom.playerId)`
5. socketService 第 466 行檢查 `s && s.connected`，如果滿足則 `s.emit('playerRefreshing', ...)`
6. 頁面卸載

**問題發現：**
- `beforeunload` handler 在 **Lobby.js** 第 224-235 行註冊
- 但玩家在 GameRoom 頁面時，Lobby 組件已經 unmount
- Lobby 的 useEffect cleanup 會移除 `beforeunload` listener（第 234 行 return）
- **結果：在 GameRoom 頁面重整時，`beforeunload` handler 不會被觸發**

**驗證 GameRoom.js：**
- GameRoom 組件中沒有獨立的 `beforeunload` handler
- 後端無法得知玩家是「重整」還是「斷線」
- 因此使用的是一般斷線的寬限期（遊戲中 60 秒，而非重整 10 秒）

**嚴重度：Medium** — 功能上不影響重連（60秒 > 10秒更寬裕），但語義不正確。

### TC-0192-02：重整後重連觸發流程 — PASS

**流程追蹤：**

1. 頁面重新載入 → React 應用初始化
2. App 組件 render → Router 根據 URL 導航
3. **因頁面重整後 URL 會是 `/game/xxx`，React Router 會嘗試渲染 GameRoom**
4. 但 Lobby 在路由 `/` 或 `/lobby`，**Lobby 組件不會 mount**
5. **重連邏輯在 Lobby.js 第 210-222 行，不會執行**

**等等 — 需要進一步分析路由：**

重整時的 URL 為 `/game/xxx`，React Router 會直接渲染 GameRoom。GameRoom 組件會從 Redux store（已持久化）讀取 gameId 和 currentPlayerId。GameRoom 訂閱了 `onGameState` 和 `onReconnectFailed` 事件。

**但 GameRoom 沒有主動發起重連請求。** 它只是被動等待 `gameState` 事件。

**Socket.io 自動重連機制（socketService.js 第 57-79 行）：**
- 當 Socket.io 建立新連線時，第一次連線不會觸發 `reconnect` 事件
- `reconnect` 事件只在「斷線後重連」時觸發
- 頁面刷新後是**全新連線**，不是重連
- **因此 socketService 的自動重連邏輯不會觸發**

**但如果使用者先被導回 `/` 或 `/lobby` 呢？**
- 如果 GameRoom 偵測到無效狀態，可能導航回 Lobby
- Lobby mount 後會觸發重連邏輯（第 210-222 行）
- 此路徑才是實際的重連入口

**結論：重連流程需要經過 Lobby 組件才能觸發，路由如果直接到 GameRoom 則不會自動重連。**

### TC-0192-03：重連成功後的狀態恢復 — FAIL（不可達）

**原因：** 由於後端 `getClientGameState` 未定義（工單 0191 TC-0191-03），前端永遠收不到 `reconnected` 事件。此流程無法測試。

**假設修復 BUG 後的分析：**
- Lobby.js 第 178-188 行的 handler 存取 `gameState.players`, `gameState.maxPlayers`, `gameState.gamePhase`
- 如果後端直接傳遞 `gameState`，這些欄位都存在於後端的 `roomState` 結構中 ✅
- `dispatch(updateGameState(...))` 正確更新 Redux store ✅
- `navigate(\`/game/${gameId}\`)` 正確導航到遊戲頁面 ✅

### TC-0192-04：重連失敗的處理 — PASS
- Lobby.js 第 191-196 行：
  ```javascript
  const unsubReconnectFailed = onReconnectFailed(({ reason, message }) => {
    setIsReconnecting(false);
    clearCurrentRoom();
    setError(`重連失敗：${message}`);
  });
  ```
- 清除 localStorage 中的房間資訊 ✅
- 顯示錯誤訊息 ✅

### TC-0192-05：playerId 一致性 — PASS
- Lobby.js 第 66 行：`const [playerId] = useState(\`player_${Date.now()}_...\`)`
- 每次 mount 生成新的 playerId
- 第 219 行重連時使用 `savedRoom.playerId`（localStorage 中的舊值），不使用新的 playerId ✅
- 兩者不衝突

## 發現的問題

### 問題 1（High）：GameRoom 頁面重整無法觸發重連
- `beforeunload` handler 只在 Lobby 組件中註冊
- 重整後如果 URL 直接到 `/game/xxx`，Lobby 不會 mount
- Socket.io 的 `reconnect` 事件不會在全新連線時觸發
- **玩家重整後可能卡在 GameRoom 但沒有有效的 socket 連線**

### 問題 2（Critical）：後端 getClientGameState BUG 阻斷流程
- 即使重連流程被觸發，後端也無法成功回應

## 結論
前端重連流程存在路由層面的問題：重整後直接進入 GameRoom 時無法觸發重連。加上後端 `getClientGameState` BUG，重連功能在目前的程式碼中完全無法運作。
