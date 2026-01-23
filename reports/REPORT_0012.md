# 報告書 0012

**工作單編號：** 0012

**完成日期：** 2026-01-23

## 完成內容摘要

建立 `frontend/src/store/gameStore.js`，實作 Redux 狀態管理。

### 實作內容

1. **Action Types** - CREATE_GAME, JOIN_GAME, LEAVE_GAME, UPDATE_GAME_STATE, QUESTION_ACTION, GUESS_ACTION, SET_CURRENT_PLAYER, GAME_ENDED, RESET_GAME

2. **Action Creators** - 所有對應的 action creator 函數

3. **Reducer** - gameReducer 處理所有 actions，遵循不可變原則

4. **Store** - 使用 createStore 建立並匯出

## 單元測試

**Tests: 149 passed** (新增 21 個測試)

## 驗收標準完成狀態

- [x] Redux store 已建立
- [x] 所有 action types 已定義
- [x] 所有 action creators 已實作
- [x] Reducer 可以正確處理所有 actions
- [x] 狀態更新遵循不可變原則
- [x] Store 可以正確匯出和使用
