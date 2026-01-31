/**
 * Redux Selectors - 記憶化 selector
 *
 * 使用 createSelector 進行記憶化，避免不必要的重新渲染
 * 工單 0162
 *
 * @module selectors
 */

import { createSelector } from 'reselect';

/**
 * 基礎 selector - 取得各個 state 欄位
 * 工單 0261：更新為新的 state.herbalism 結構
 */
const selectHerbalism = (state) => state.herbalism || {};
const selectGameId = (state) => selectHerbalism(state).gameId;
const selectPlayers = (state) => selectHerbalism(state).players;
const selectCurrentPlayerIndex = (state) => selectHerbalism(state).currentPlayerIndex;
const selectGamePhase = (state) => selectHerbalism(state).gamePhase;
const selectWinnerState = (state) => selectHerbalism(state).winner;
const selectHiddenCards = (state) => selectHerbalism(state).hiddenCards;
const selectGameHistoryState = (state) => selectHerbalism(state).gameHistory;
const selectCurrentPlayerId = (state) => selectHerbalism(state).currentPlayerId;
const selectMaxPlayers = (state) => selectHerbalism(state).maxPlayers;

/**
 * 遊戲房間狀態 selector
 * 使用 createSelector 進行記憶化，只有當任一輸入 selector 返回值改變時才重新計算
 */
export const selectGameRoomState = createSelector(
  [
    selectGameId,
    selectPlayers,
    selectCurrentPlayerIndex,
    selectGamePhase,
    selectWinnerState,
    selectHiddenCards,
    selectGameHistoryState,
    selectCurrentPlayerId,
    selectMaxPlayers
  ],
  (gameId, players, currentPlayerIndex, gamePhase, winner, hiddenCards, gameHistory, currentPlayerId, maxPlayers) => ({
    storeGameId: gameId,
    players,
    currentPlayerIndex,
    gamePhase,
    winner,
    hiddenCards,
    gameHistory,
    currentPlayerId,
    maxPlayers
  })
);

/**
 * 當前玩家 selector
 */
export const selectCurrentPlayer = createSelector(
  [selectPlayers, selectCurrentPlayerIndex],
  (players, currentPlayerIndex) => {
    if (!players || currentPlayerIndex === undefined) {
      return null;
    }
    return players[currentPlayerIndex] || null;
  }
);

/**
 * 遊戲進行中的玩家 selector
 */
export const selectActivePlayers = createSelector(
  [selectPlayers],
  (players) => {
    if (!players) return [];
    return players.filter(p => p.isActive);
  }
);

/**
 * 遊戲歷史記錄 selector（簡單提取，不需 createSelector）
 * 工單 0261：更新為新的 state.herbalism 結構
 */
export const selectGameHistory = (state) => (state.herbalism || {}).gameHistory || [];

/**
 * 勝利者 selector（簡單提取，不需 createSelector）
 * 工單 0261：更新為新的 state.herbalism 結構
 */
export const selectWinner = (state) => (state.herbalism || {}).winner;
