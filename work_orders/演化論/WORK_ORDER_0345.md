# 工單 0345：Evolution Store 狀態管理

## 基本資訊
- **工單編號**：0345
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0337（GameBoard）
- **預計影響檔案**：
  - `frontend/src/store/evolution/index.js`（重構）
  - `frontend/src/store/evolution/gameSlice.js`（新增）
  - `frontend/src/store/evolution/playerSlice.js`（新增）
  - `frontend/src/store/evolution/selectors.js`（新增）

---

## 目標

重構演化論遊戲狀態管理：
1. 模組化 Store 結構
2. 優化 Selector 效能
3. 支援遊戲狀態快照
4. 與 Socket.io 整合

---

## 詳細規格

### 1. Game Slice

```javascript
// frontend/src/store/evolution/gameSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { GAME_PHASES, GAME_STATUS } from '@shared/constants/evolution';

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
  'evolution/joinGame',
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

      state.gameId = id;
      state.status = status;
      state.round = round;
      state.currentPhase = currentPhase;
      state.currentPlayerIndex = currentPlayerIndex;
      state.turnOrder = turnOrder;
      state.foodPool = foodPool;
      state.lastFoodRoll = lastFoodRoll;
      state.deckCount = deck?.length || 0;
      state.discardCount = discardPile?.length || 0;
      state.config = config;
      state.createdAt = createdAt;
      state.startedAt = startedAt;
      state.endedAt = endedAt;
      state.winner = winner;
      state.scores = scores;
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
      state.foodPool = action.payload.amount;
      if (action.payload.roll) {
        state.lastFoodRoll = action.payload.roll;
      }
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
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
      });

      // 限制日誌數量
      if (state.actionLog.length > 100) {
        state.actionLog = state.actionLog.slice(-100);
      }
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
  setDeckCount,
  setGameEnd,
  addActionLog,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
```

### 2. Player Slice

```javascript
// frontend/src/store/evolution/playerSlice.js

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
        state.players[playerId].creatures.push(creature);
      }
    },

    // 移除生物
    removeCreature: (state, action) => {
      const { playerId, creatureId } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId].creatures =
          state.players[playerId].creatures.filter(c => c.id !== creatureId);
      }
    },

    // 更新生物
    updateCreature: (state, action) => {
      const { playerId, creatureId, updates } = action.payload;
      if (state.players[playerId]) {
        const creature = state.players[playerId].creatures.find(
          c => c.id === creatureId
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
      state.selectedCardId = action.payload.cardId;
      state.selectedCardSide = action.payload.side || 'front';
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

    // 重置玩家狀態
    resetPlayers: () => initialState,
  },
});

export const {
  setMyPlayerId,
  setPlayers,
  updatePlayer,
  setHand,
  setCreatures,
  addCreature,
  removeCreature,
  updateCreature,
  selectCreature,
  setAttackTarget,
  selectCard,
  clearSelection,
  setPlayerPassed,
  resetPlayers,
} = playerSlice.actions;

export default playerSlice.reducer;
```

### 3. Selectors

```javascript
// frontend/src/store/evolution/selectors.js

import { createSelector } from '@reduxjs/toolkit';

// === Game Selectors ===

export const selectGameId = (state) => state.evolutionGame.gameId;
export const selectGameStatus = (state) => state.evolutionGame.status;
export const selectRound = (state) => state.evolutionGame.round;
export const selectCurrentPhase = (state) => state.evolutionGame.currentPhase;
export const selectFoodPool = (state) => state.evolutionGame.foodPool;
export const selectTurnOrder = (state) => state.evolutionGame.turnOrder;
export const selectCurrentPlayerIndex = (state) => state.evolutionGame.currentPlayerIndex;
export const selectActionLog = (state) => state.evolutionGame.actionLog;

// 當前玩家 ID
export const selectCurrentPlayerId = createSelector(
  [selectTurnOrder, selectCurrentPlayerIndex],
  (turnOrder, index) => turnOrder[index] || null
);

// === Player Selectors ===

export const selectMyPlayerId = (state) => state.evolutionPlayer.myPlayerId;
export const selectPlayers = (state) => state.evolutionPlayer.players;
export const selectSelectedCreatureId = (state) => state.evolutionPlayer.selectedCreatureId;
export const selectSelectedCardId = (state) => state.evolutionPlayer.selectedCardId;

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
    Object.values(players).filter(p => p.id !== myPlayerId)
);

// 所有生物（用於攻擊目標選擇）
export const selectAllCreatures = createSelector(
  [selectPlayers],
  (players) => {
    const creatures = [];
    Object.values(players).forEach(player => {
      player.creatures.forEach(creature => {
        creatures.push({ ...creature, ownerId: player.id });
      });
    });
    return creatures;
  }
);
```

### 4. Store 配置

```javascript
// frontend/src/store/evolution/index.js

import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import playerReducer from './playerSlice';
import animationReducer from './animationSlice';

export const createEvolutionStore = () => {
  return configureStore({
    reducer: {
      evolutionGame: gameReducer,
      evolutionPlayer: playerReducer,
      animation: animationReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Socket 物件不可序列化
      }),
  });
};

// 匯出所有 actions 和 selectors
export * from './gameSlice';
export * from './playerSlice';
export * from './animationSlice';
export * from './selectors';
```

---

## 驗收標準

1. [ ] Store 結構清晰模組化
2. [ ] Selector 效能優化
3. [ ] 狀態更新正確
4. [ ] 與 Socket 事件整合
5. [ ] TypeScript 型別支援
6. [ ] DevTools 可用
7. [ ] 測試覆蓋完整

---

## 備註

- 使用 Redux Toolkit 簡化代碼
- createSelector 避免不必要的重新計算
