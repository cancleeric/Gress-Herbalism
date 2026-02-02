/**
 * 演化論遊戲 Selectors
 *
 * 使用 createSelector 優化效能
 *
 * @module store/evolution/selectors
 */

import { createSelector } from '@reduxjs/toolkit';

// === Game Selectors ===

export const selectGameId = (state) => state.evolutionGame?.gameId;
export const selectGameStatus = (state) => state.evolutionGame?.status;
export const selectRound = (state) => state.evolutionGame?.round ?? 0;
export const selectCurrentPhase = (state) => state.evolutionGame?.currentPhase;
export const selectFoodPool = (state) => state.evolutionGame?.foodPool ?? 0;
export const selectTurnOrder = (state) => state.evolutionGame?.turnOrder ?? [];
export const selectCurrentPlayerIndex = (state) => state.evolutionGame?.currentPlayerIndex ?? 0;
export const selectActionLog = (state) => state.evolutionGame?.actionLog ?? [];
export const selectDeckCount = (state) => state.evolutionGame?.deckCount ?? 0;
export const selectIsRolling = (state) => state.evolutionGame?.isRolling ?? false;
export const selectLastFoodRoll = (state) => state.evolutionGame?.lastFoodRoll;
export const selectGameLoading = (state) => state.evolutionGame?.loading ?? false;
export const selectGameError = (state) => state.evolutionGame?.error;
export const selectWinner = (state) => state.evolutionGame?.winner;
export const selectScores = (state) => state.evolutionGame?.scores ?? {};

// 當前玩家 ID
export const selectCurrentPlayerId = createSelector(
  [selectTurnOrder, selectCurrentPlayerIndex],
  (turnOrder, index) => turnOrder[index] || null
);

// === Player Selectors ===

export const selectMyPlayerId = (state) => state.evolutionPlayer?.myPlayerId;
export const selectPlayers = (state) => state.evolutionPlayer?.players ?? {};
export const selectSelectedCreatureId = (state) => state.evolutionPlayer?.selectedCreatureId;
export const selectSelectedCardId = (state) => state.evolutionPlayer?.selectedCardId;
export const selectSelectedCardSide = (state) => state.evolutionPlayer?.selectedCardSide;
export const selectAttackTarget = (state) => state.evolutionPlayer?.attackTarget;
export const selectPendingResponse = (state) => state.evolutionPlayer?.pendingResponse;

// 是否是我的回合
export const selectIsMyTurn = createSelector(
  [selectCurrentPlayerId, selectMyPlayerId],
  (currentPlayerId, myPlayerId) => currentPlayerId === myPlayerId
);

// 我的玩家資料
export const selectMyPlayer = createSelector(
  [selectPlayers, selectMyPlayerId],
  (players, myPlayerId) => players[myPlayerId] || null
);

// 我的手牌
export const selectMyHand = createSelector(
  [selectMyPlayer],
  (myPlayer) => myPlayer?.hand || []
);

// 我的生物
export const selectMyCreatures = createSelector(
  [selectMyPlayer],
  (myPlayer) => myPlayer?.creatures || []
);

// 對手列表
export const selectOpponents = createSelector(
  [selectPlayers, selectMyPlayerId],
  (players, myPlayerId) =>
    Object.values(players).filter((p) => p.id !== myPlayerId)
);

// 所有生物（用於攻擊目標選擇）
export const selectAllCreatures = createSelector(
  [selectPlayers],
  (players) => {
    const creatures = [];
    Object.values(players).forEach((player) => {
      if (player.creatures) {
        player.creatures.forEach((creature) => {
          creatures.push({ ...creature, ownerId: player.id });
        });
      }
    });
    return creatures;
  }
);

// 玩家數量
export const selectPlayerCount = createSelector(
  [selectPlayers],
  (players) => Object.keys(players).length
);

// 選中的卡牌（完整資訊）
export const selectSelectedCard = createSelector(
  [selectMyHand, selectSelectedCardId],
  (hand, cardId) => {
    if (!cardId) return null;
    return hand.find((c) => c.id === cardId || c.instanceId === cardId) || null;
  }
);

// 選中的生物（完整資訊）
export const selectSelectedCreature = createSelector(
  [selectMyCreatures, selectSelectedCreatureId],
  (creatures, creatureId) => {
    if (!creatureId) return null;
    return creatures.find((c) => c.id === creatureId) || null;
  }
);

// 遊戲是否進行中
export const selectIsGameActive = createSelector(
  [selectGameStatus],
  (status) => status === 'playing'
);

// 遊戲是否已結束
export const selectIsGameFinished = createSelector(
  [selectGameStatus],
  (status) => status === 'finished'
);
