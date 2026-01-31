# 報告書 0189

## 工作單編號
0189

## 完成日期
2026-01-28

## 完成內容摘要
完成 `frontend/src/store/gameStore.js` Redux Store 持久化配置的單元測試（程式碼審查）。

## 測試結果

### TC-0189-01：persistConfig whitelist 完整性 — PASS（附註）

**whitelist 內容（第 32 行）：**
```
['gameId', 'currentPlayerId', 'players', 'gamePhase', 'currentPlayerIndex']
```

**Lobby.js `onReconnected` handler（第 178-188 行）所需欄位：**
- `gameId` — 從事件參數直接取得 ✅
- `gameState.players` — 從事件參數取得 ✅
- `gameState.maxPlayers` — 從事件參數取得 ✅
- `gameState.gamePhase` — 從事件參數取得 ✅
- `reconnectedPlayerId` — 從事件參數取得 ✅

結論：重連成功時，所需資料來自後端 `reconnected` 事件，不依賴 redux-persist。whitelist 的持久化主要作為「離線快取」使用，在重連事件到達前顯示舊狀態。持久化的欄位已涵蓋核心資訊。

**附註**：`maxPlayers` 不在 whitelist 中，但因重連時由後端重新提供，不影響功能。

### TC-0189-02：UPDATE_GAME_STATE reducer 行為 — PASS
- 第 210-215 行：`return { ...state, ...action.payload, error: null }`
- 展開 `action.payload` 會覆蓋 state 中同名的欄位
- 重連時 dispatch 的 payload 包含 `gameId, players, maxPlayers, gamePhase, currentPlayerId`
- 這些欄位會正確覆蓋舊的持久化資料 ✅

### TC-0189-03：clearPersistedState 行為 — PASS
- 第 275-277 行：呼叫 `persistor.purge()` 清除持久化資料
- 但注意：此函數在程式碼中有定義但**未在 leaveRoom 流程中被呼叫**

### TC-0189-04：持久化資料一致性 — PASS（附註）

**兩套儲存系統的關係：**
| 儲存 | Key | 內容 | 用途 |
|------|-----|------|------|
| localStorage | `gress_current_room` | roomId, playerId, playerName | 重連時識別身份 |
| redux-persist | `persist:gress_game` | gameId, currentPlayerId, players, gamePhase, currentPlayerIndex | UI 狀態快取 |

兩者職責不同，`gress_current_room` 用於發起重連請求，`persist:gress_game` 用於重連期間的 UI 顯示。不存在衝突風險。

## 發現的問題

### 問題 1（Medium）：clearPersistedState 未被使用
`clearPersistedState()` 函數已定義但在 leaveRoom 流程中未被呼叫。離開房間時只清除了 `gress_current_room` 和 legacy keys，但 `persist:gress_game` 中的資料未被清除。這可能導致玩家離開房間後，下次開啟頁面時短暫看到舊的遊戲狀態。

## 結論
Redux Store 持久化配置正確，whitelist 涵蓋核心欄位。`clearPersistedState` 未被呼叫是一個中等風險問題。
