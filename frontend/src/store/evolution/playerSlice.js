/**
 * 演化論遊戲 Player Slice
 *
 * 管理玩家狀態
 *
 * @module store/evolution/playerSlice
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // 自己的玩家資訊
  myPlayerId: null,

  // 所有玩家
  players: {},

  // 選中的生物
  selectedCreatureId: null,

  // 攻擊目標
  attackTarget: null,

  // 選中的手牌
  selectedCardId: null,
  selectedCardSide: null,

  // 待處理的互動
  pendingResponse: null,
};

export const playerSlice = createSlice({
  name: 'evolutionPlayer',
  initialState,
  reducers: {
    // 設定自己的玩家 ID
    setMyPlayerId: (state, action) => {
      state.myPlayerId = action.payload;
    },

    // 設定所有玩家
    setPlayers: (state, action) => {
      state.players = action.payload;
    },

    // 更新單一玩家
    updatePlayer: (state, action) => {
      const { playerId, updates } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId] = {
          ...state.players[playerId],
          ...updates,
        };
      }
    },

    // 更新手牌
    setHand: (state, action) => {
      const { playerId, hand } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId].hand = hand;
      }
    },

    // 添加手牌
    addCardsToHand: (state, action) => {
      const { playerId, cards } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId].hand = [
          ...(state.players[playerId].hand || []),
          ...cards,
        ];
      }
    },

    // 移除手牌
    removeCardFromHand: (state, action) => {
      const { playerId, cardId } = action.payload;
      if (state.players[playerId] && state.players[playerId].hand) {
        state.players[playerId].hand = state.players[playerId].hand.filter(
          (c) => c.id !== cardId
        );
      }
    },

    // 更新生物
    setCreatures: (state, action) => {
      const { playerId, creatures } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId].creatures = creatures;
      }
    },

    // 新增生物
    addCreature: (state, action) => {
      const { playerId, creature } = action.payload;
      if (state.players[playerId]) {
        if (!state.players[playerId].creatures) {
          state.players[playerId].creatures = [];
        }
        state.players[playerId].creatures.push(creature);
      }
    },

    // 移除生物
    removeCreature: (state, action) => {
      const { playerId, creatureId } = action.payload;
      if (state.players[playerId] && state.players[playerId].creatures) {
        state.players[playerId].creatures = state.players[playerId].creatures.filter(
          (c) => c.id !== creatureId
        );
      }
    },

    // 更新生物
    updateCreature: (state, action) => {
      const { playerId, creatureId, updates } = action.payload;
      if (state.players[playerId] && state.players[playerId].creatures) {
        const creature = state.players[playerId].creatures.find(
          (c) => c.id === creatureId
        );
        if (creature) {
          Object.assign(creature, updates);
        }
      }
    },

    // 選擇生物
    selectCreature: (state, action) => {
      state.selectedCreatureId = action.payload;
    },

    // 設定攻擊目標
    setAttackTarget: (state, action) => {
      state.attackTarget = action.payload;
    },

    // 選擇手牌
    selectCard: (state, action) => {
      if (action.payload === null) {
        state.selectedCardId = null;
        state.selectedCardSide = null;
      } else {
        state.selectedCardId = action.payload.cardId ?? action.payload;
        state.selectedCardSide = action.payload.side || 'front';
      }
    },

    // 清除選擇
    clearSelection: (state) => {
      state.selectedCreatureId = null;
      state.attackTarget = null;
      state.selectedCardId = null;
      state.selectedCardSide = null;
    },

    // 玩家跳過
    setPlayerPassed: (state, action) => {
      const { playerId, passed } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId].passed = passed;
      }
    },

    // 設定待處理回應
    setPendingResponse: (state, action) => {
      state.pendingResponse = action.payload;
    },

    // 清除待處理回應
    clearPendingResponse: (state) => {
      state.pendingResponse = null;
    },

    // 重置玩家狀態
    resetPlayers: () => initialState,
  },
});

export const {
  setMyPlayerId,
  setPlayers,
  updatePlayer,
  setHand,
  addCardsToHand,
  removeCardFromHand,
  setCreatures,
  addCreature,
  removeCreature,
  updateCreature,
  selectCreature,
  setAttackTarget,
  selectCard,
  clearSelection,
  setPlayerPassed,
  setPendingResponse,
  clearPendingResponse,
  resetPlayers,
} = playerSlice.actions;

export default playerSlice.reducer;
