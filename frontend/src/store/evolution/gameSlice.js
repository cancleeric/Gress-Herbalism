/**
 * 演化論遊戲 Game Slice
 *
 * 管理遊戲全局狀態
 *
 * @module store/evolution/gameSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * 遊戲狀態常數
 */
const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

const initialState = {
  // 遊戲基本資訊
  gameId: null,
  status: GAME_STATUS.WAITING,
  round: 0,
  currentPhase: null,
  currentPlayerIndex: 0,
  turnOrder: [],

  // 食物池
  foodPool: 0,
  lastFoodRoll: null,
  isRolling: false,

  // 牌庫
  deckCount: 0,
  discardCount: 0,

  // 配置
  config: {
    expansions: ['base'],
    variants: {},
  },

  // 時間
  createdAt: null,
  startedAt: null,
  endedAt: null,

  // 勝利者
  winner: null,
  scores: {},

  // 載入狀態
  loading: false,
  error: null,

  // 行動日誌
  actionLog: [],
};

// 異步 Thunks
export const joinGame = createAsyncThunk(
  'evolutionGame/joinGame',
  async (gameId, { rejectWithValue }) => {
    try {
      // 透過 socket 加入遊戲
      // 實際實作需整合 socket
      return { gameId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const gameSlice = createSlice({
  name: 'evolutionGame',
  initialState,
  reducers: {
    // 設定遊戲狀態
    setGameState: (state, action) => {
      const {
        id, status, round, currentPhase, currentPlayerIndex,
        turnOrder, foodPool, lastFoodRoll, deck, discardPile,
        config, createdAt, startedAt, endedAt, winner, scores,
      } = action.payload;

      if (id !== undefined) state.gameId = id;
      if (status !== undefined) state.status = status;
      if (round !== undefined) state.round = round;
      if (currentPhase !== undefined) state.currentPhase = currentPhase;
      if (currentPlayerIndex !== undefined) state.currentPlayerIndex = currentPlayerIndex;
      if (turnOrder !== undefined) state.turnOrder = turnOrder;
      if (foodPool !== undefined) state.foodPool = foodPool;
      if (lastFoodRoll !== undefined) state.lastFoodRoll = lastFoodRoll;
      if (deck !== undefined) state.deckCount = deck?.length ?? deck;
      if (discardPile !== undefined) state.discardCount = discardPile?.length ?? discardPile;
      if (config !== undefined) state.config = config;
      if (createdAt !== undefined) state.createdAt = createdAt;
      if (startedAt !== undefined) state.startedAt = startedAt;
      if (endedAt !== undefined) state.endedAt = endedAt;
      if (winner !== undefined) state.winner = winner;
      if (scores !== undefined) state.scores = scores;
    },

    // 更新階段
    setPhase: (state, action) => {
      state.currentPhase = action.payload;
    },

    // 更新回合
    setRound: (state, action) => {
      state.round = action.payload;
    },

    // 更新當前玩家
    setCurrentPlayer: (state, action) => {
      state.currentPlayerIndex = action.payload;
    },

    // 更新食物池
    setFoodPool: (state, action) => {
      if (typeof action.payload === 'number') {
        state.foodPool = action.payload;
      } else {
        state.foodPool = action.payload.amount ?? state.foodPool;
        if (action.payload.roll !== undefined) {
          state.lastFoodRoll = action.payload.roll;
        }
      }
    },

    // 設定骰子滾動狀態
    setIsRolling: (state, action) => {
      state.isRolling = action.payload;
    },

    // 更新牌庫數量
    setDeckCount: (state, action) => {
      state.deckCount = action.payload;
    },

    // 遊戲結束
    setGameEnd: (state, action) => {
      state.status = GAME_STATUS.FINISHED;
      state.winner = action.payload.winner;
      state.scores = action.payload.scores;
      state.endedAt = Date.now();
    },

    // 新增行動日誌
    addActionLog: (state, action) => {
      state.actionLog.push({
        ...action.payload,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      });

      // 限制日誌數量
      if (state.actionLog.length > 100) {
        state.actionLog = state.actionLog.slice(-100);
      }
    },

    // 清除日誌
    clearActionLog: (state) => {
      state.actionLog = [];
    },

    // 設定載入中
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // 設定錯誤
    setError: (state, action) => {
      state.error = action.payload;
    },

    // 清除錯誤
    clearError: (state) => {
      state.error = null;
    },

    // 重置遊戲
    resetGame: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(joinGame.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinGame.fulfilled, (state, action) => {
        state.loading = false;
        state.gameId = action.payload.gameId;
      })
      .addCase(joinGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setGameState,
  setPhase,
  setRound,
  setCurrentPlayer,
  setFoodPool,
  setIsRolling,
  setDeckCount,
  setGameEnd,
  addActionLog,
  clearActionLog,
  setLoading,
  setError,
  clearError,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
