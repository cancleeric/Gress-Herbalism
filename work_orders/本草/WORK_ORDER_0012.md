# 工作單 0012

**日期：** 2026-01-23

**工作單標題：** 建立狀態管理 - Redux Store 設定

**工單主旨：** 狀態管理 - 建立 Redux store 和基礎設定

**內容：**

## 工作內容

1. **建立 `frontend/src/store/gameStore.js` 檔案**

2. **安裝 Redux 相關套件**（如果尚未安裝）
   - redux
   - react-redux（如果使用 React）

3. **定義 Action Types**
   - `CREATE_GAME`
   - `JOIN_GAME`
   - `LEAVE_GAME`
   - `UPDATE_GAME_STATE`
   - `QUESTION_ACTION`
   - `GUESS_ACTION`
   - `SET_CURRENT_PLAYER`
   - `GAME_ENDED`

4. **建立 Action Creators**
   - `createGame(players)`
   - `joinGame(gameId, player)`
   - `leaveGame(gameId, playerId)`
   - `updateGameState(gameState)`
   - `questionAction(action)`
   - `guessAction(action)`
   - `setCurrentPlayer(playerIndex)`
   - `gameEnded(winner)`

5. **建立 Reducer**
   - 定義初始狀態（initialState）
   - 實作 gameReducer，處理所有 action types
   - 確保狀態更新不可變（immutable）

6. **建立 Store**
   - 使用 `createStore()` 建立 Redux store
   - 匯出 store 供組件使用

7. **使用 JSDoc 註解**
   - 為所有函數添加完整的 JSDoc 註解

## 驗收標準

- [ ] Redux store 已建立
- [ ] 所有 action types 已定義
- [ ] 所有 action creators 已實作
- [ ] Reducer 可以正確處理所有 actions
- [ ] 狀態更新遵循不可變原則
- [ ] Store 可以正確匯出和使用
- [ ] 函數有完整的 JSDoc 註解
