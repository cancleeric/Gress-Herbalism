/**
 * 演化論遊戲 Redux Store
 *
 * @module store/evolution/evolutionStore
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * 初始狀態
 */
const initialState = {
  // 遊戲基本資訊
  gameId: null,
  phase: 'waiting',
  round: 0,

  // 玩家資訊
  players: {},
  playerOrder: [],
  currentPlayerId: null,
  myPlayerId: null,

  // 牌庫和食物
  deckCount: 84,
  foodPool: 0,
  diceResult: [],

  // 手牌和生物
  myHand: [],
  myCreatures: [],

  // 選中的卡牌和目標
  selectedCard: null,
  selectedCreature: null,
  selectedTarget: null,

  // 待處理的互動
  pendingResponse: null,

  // UI 狀態
  isMyTurn: false,
  isLoading: false,
  error: null,

  // 遊戲日誌
  actionLog: [],

  // 遊戲結果
  gameResult: null,
  scores: null
};

/**
 * 演化論遊戲 Slice
 */
const evolutionSlice = createSlice({
  name: 'evolution',
  initialState,
  reducers: {
    // ========== 遊戲狀態更新 ==========

    /**
     * 設定完整遊戲狀態
     */
    setGameState: (state, action) => {
      const gs = action.payload;
      state.gameId = gs.gameId || state.gameId;
      state.phase = gs.phase;
      state.round = gs.round;
      state.players = gs.players;
      state.playerOrder = gs.playerOrder;
      state.currentPlayerId = gs.currentPlayerId;
      state.deckCount = typeof gs.deck === 'number' ? gs.deck : gs.deckCount;
      state.foodPool = gs.foodPool;
      state.diceResult = gs.diceResult || [];
      state.pendingResponse = gs.pendingResponse;

      // 更新自己的資訊
      if (state.myPlayerId && gs.players[state.myPlayerId]) {
        const myData = gs.players[state.myPlayerId];
        state.myHand = Array.isArray(myData.hand) ? myData.hand : [];
        state.myCreatures = myData.creatures || [];
      }

      // 更新是否輪到自己
      state.isMyTurn = gs.currentPlayerId === state.myPlayerId;
    },

    /**
     * 設定我的玩家 ID
     */
    setMyPlayerId: (state, action) => {
      state.myPlayerId = action.payload;
    },

    /**
     * 更新階段
     */
    setPhase: (state, action) => {
      state.phase = action.payload;
    },

    /**
     * 更新回合
     */
    setRound: (state, action) => {
      state.round = action.payload;
    },

    /**
     * 更新當前玩家
     */
    setCurrentPlayer: (state, action) => {
      state.currentPlayerId = action.payload;
      state.isMyTurn = action.payload === state.myPlayerId;
    },

    // ========== 手牌操作 ==========

    /**
     * 設定手牌
     */
    setMyHand: (state, action) => {
      state.myHand = action.payload;
    },

    /**
     * 移除手牌
     */
    removeCardFromHand: (state, action) => {
      const cardId = action.payload;
      state.myHand = state.myHand.filter(c => c.id !== cardId);
    },

    /**
     * 添加手牌
     */
    addCardsToHand: (state, action) => {
      state.myHand = [...state.myHand, ...action.payload];
    },

    // ========== 生物操作 ==========

    /**
     * 添加生物
     */
    addCreature: (state, action) => {
      const { playerId, creature } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId].creatures = [
          ...(state.players[playerId].creatures || []),
          creature
        ];
      }
      if (playerId === state.myPlayerId) {
        state.myCreatures = [...state.myCreatures, creature];
      }
    },

    /**
     * 更新生物
     */
    updateCreature: (state, action) => {
      const { playerId, creature } = action.payload;
      if (state.players[playerId]) {
        const creatures = state.players[playerId].creatures || [];
        const index = creatures.findIndex(c => c.id === creature.id);
        if (index !== -1) {
          state.players[playerId].creatures[index] = creature;
        }
      }
      if (playerId === state.myPlayerId) {
        const index = state.myCreatures.findIndex(c => c.id === creature.id);
        if (index !== -1) {
          state.myCreatures[index] = creature;
        }
      }
    },

    /**
     * 移除生物
     */
    removeCreature: (state, action) => {
      const { playerId, creatureId } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId].creatures = (state.players[playerId].creatures || [])
          .filter(c => c.id !== creatureId);
      }
      if (playerId === state.myPlayerId) {
        state.myCreatures = state.myCreatures.filter(c => c.id !== creatureId);
      }
    },

    // ========== 選擇操作 ==========

    /**
     * 選擇卡牌
     */
    setSelectedCard: (state, action) => {
      state.selectedCard = action.payload;
    },

    /**
     * 選擇生物
     */
    setSelectedCreature: (state, action) => {
      state.selectedCreature = action.payload;
    },

    /**
     * 選擇目標
     */
    setSelectedTarget: (state, action) => {
      state.selectedTarget = action.payload;
    },

    /**
     * 清除所有選擇
     */
    clearSelections: (state) => {
      state.selectedCard = null;
      state.selectedCreature = null;
      state.selectedTarget = null;
    },

    // ========== 食物池 ==========

    /**
     * 更新食物池
     */
    setFoodPool: (state, action) => {
      state.foodPool = action.payload;
    },

    /**
     * 設定骰子結果
     */
    setDiceResult: (state, action) => {
      state.diceResult = action.payload;
    },

    // ========== 待處理互動 ==========

    /**
     * 設定待處理回應
     */
    setPendingResponse: (state, action) => {
      state.pendingResponse = action.payload;
    },

    /**
     * 清除待處理回應
     */
    clearPendingResponse: (state) => {
      state.pendingResponse = null;
    },

    // ========== UI 狀態 ==========

    /**
     * 設定載入中
     */
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    /**
     * 設定錯誤
     */
    setError: (state, action) => {
      state.error = action.payload;
    },

    /**
     * 清除錯誤
     */
    clearError: (state) => {
      state.error = null;
    },

    // ========== 遊戲日誌 ==========

    /**
     * 添加日誌
     */
    addLog: (state, action) => {
      state.actionLog = [...state.actionLog, {
        ...action.payload,
        timestamp: Date.now()
      }];
      // 保留最近 100 條日誌
      if (state.actionLog.length > 100) {
        state.actionLog = state.actionLog.slice(-100);
      }
    },

    /**
     * 清除日誌
     */
    clearLogs: (state) => {
      state.actionLog = [];
    },

    // ========== 遊戲結果 ==========

    /**
     * 設定遊戲結果
     */
    setGameResult: (state, action) => {
      state.gameResult = action.payload.winner;
      state.scores = action.payload.scores;
    },

    // ========== 重置 ==========

    /**
     * 重置遊戲狀態
     */
    resetGame: () => initialState
  }
});

// 導出 actions
export const evolutionActions = evolutionSlice.actions;

// 導出 reducer
export default evolutionSlice.reducer;

// ========== Selectors ==========

export const selectEvolutionState = (state) => state.evolution;
export const selectPhase = (state) => state.evolution.phase;
export const selectRound = (state) => state.evolution.round;
export const selectMyHand = (state) => state.evolution.myHand;
export const selectMyCreatures = (state) => state.evolution.myCreatures;
export const selectFoodPool = (state) => state.evolution.foodPool;
export const selectIsMyTurn = (state) => state.evolution.isMyTurn;
export const selectCurrentPlayerId = (state) => state.evolution.currentPlayerId;
export const selectPlayers = (state) => state.evolution.players;
export const selectSelectedCard = (state) => state.evolution.selectedCard;
export const selectSelectedCreature = (state) => state.evolution.selectedCreature;
export const selectPendingResponse = (state) => state.evolution.pendingResponse;
export const selectActionLog = (state) => state.evolution.actionLog;
export const selectGameResult = (state) => state.evolution.gameResult;
export const selectScores = (state) => state.evolution.scores;
