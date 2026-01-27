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
 */
const selectGameId = (state) => state.gameId;
const selectPlayers = (state) => state.players;
const selectCurrentPlayerIndex = (state) => state.currentPlayerIndex;
const selectGamePhase = (state) => state.gamePhase;
const selectWinnerState = (state) => state.winner;
const selectHiddenCards = (state) => state.hiddenCards;
const selectGameHistoryState = (state) => state.gameHistory;
const selectCurrentPlayerId = (state) => state.currentPlayerId;
const selectMaxPlayers = (state) => state.maxPlayers;

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
 */
export const selectGameHistory = (state) => state.gameHistory || [];

/**
 * 勝利者 selector（簡單提取，不需 createSelector）
 */
export const selectWinner = (state) => state.winner;
