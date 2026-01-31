# 工作單 0262

## 編號
0262

## 日期
2026-01-31

## 工作單標題
建立演化論 Redux Store

## 工單主旨
建立演化論遊戲專用的 Redux Store `evolutionStore.js`

## 內容

### 任務描述

建立演化論遊戲的狀態管理，使用 Redux Toolkit 實作。

### 檔案結構

```
frontend/src/store/
├── index.js           # 根 store（修改）
├── gameStore.js       # 本草遊戲 store（現有）
└── evolution/
    ├── evolutionStore.js
    └── evolutionSelectors.js
```

### State 結構

```javascript
const initialState = {
  // 連接狀態
  isConnected: false,
  roomId: null,

  // 遊戲基本資訊
  gameId: null,
  gameType: 'evolution',
  phase: 'waiting',
  round: 1,
  isLastRound: false,

  // 玩家資訊
  players: [],
  currentPlayerId: null,
  myPlayerId: null,

  // 牌庫與食物池
  deckCount: 84,
  foodPool: {
    red: 0,
    blue: 0
  },

  // 回合控制
  currentPlayerIndex: 0,
  passedPlayers: [],

  // 攻擊狀態
  pendingAttack: null,

  // 我的手牌
  myHand: [],

  // 我的生物
  myCreatures: [],

  // 互動連結
  interactionLinks: [],

  // 日誌
  actionLog: [],

  // UI 狀態
  selectedCard: null,
  selectedCreature: null,
  showScoreBoard: false
};
```

### Actions

```javascript
import { createSlice } from '@reduxjs/toolkit';

const evolutionSlice = createSlice({
  name: 'evolution',
  initialState,
  reducers: {
    // 連接相關
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    setRoomId: (state, action) => {
      state.roomId = action.payload;
    },

    // 遊戲狀態
    setGameState: (state, action) => {
      const { gameId, phase, round, isLastRound, players, currentPlayerIndex,
              deckCount, foodPool, actionLog, interactionLinks } = action.payload;
      state.gameId = gameId;
      state.phase = phase;
      state.round = round;
      state.isLastRound = isLastRound;
      state.players = players;
      state.currentPlayerIndex = currentPlayerIndex;
      state.deckCount = deckCount;
      state.foodPool = foodPool;
      state.actionLog = actionLog;
      state.interactionLinks = interactionLinks;
    },

    // 階段變更
    setPhase: (state, action) => {
      state.phase = action.payload.phase;
      if (action.payload.round) {
        state.round = action.payload.round;
      }
      if (action.payload.isLastRound !== undefined) {
        state.isLastRound = action.payload.isLastRound;
      }
    },

    // 玩家相關
    setMyPlayerId: (state, action) => {
      state.myPlayerId = action.payload;
    },
    setCurrentPlayer: (state, action) => {
      state.currentPlayerIndex = action.payload;
      state.currentPlayerId = state.players[action.payload]?.id;
    },

    // 手牌
    setMyHand: (state, action) => {
      state.myHand = action.payload;
    },
    removeCardFromHand: (state, action) => {
      state.myHand = state.myHand.filter(card => card.id !== action.payload);
    },

    // 生物
    addCreature: (state, action) => {
      const { playerId, creature } = action.payload;
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        player.creatures.push(creature);
      }
      if (playerId === state.myPlayerId) {
        state.myCreatures.push(creature);
      }
    },

    // 食物池
    updateFoodPool: (state, action) => {
      state.foodPool = action.payload;
    },

    // 攻擊
    setPendingAttack: (state, action) => {
      state.pendingAttack = action.payload;
    },
    clearPendingAttack: (state) => {
      state.pendingAttack = null;
    },

    // 日誌
    addLog: (state, action) => {
      state.actionLog.push({
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...action.payload
      });
    },

    // UI 狀態
    setSelectedCard: (state, action) => {
      state.selectedCard = action.payload;
    },
    setSelectedCreature: (state, action) => {
      state.selectedCreature = action.payload;
    },
    setShowScoreBoard: (state, action) => {
      state.showScoreBoard = action.payload;
    },

    // 重置
    resetGame: () => initialState
  }
});

export const evolutionActions = evolutionSlice.actions;
export default evolutionSlice.reducer;
```

### Selectors

```javascript
// evolutionSelectors.js
export const selectPhase = state => state.evolution.phase;
export const selectIsMyTurn = state =>
  state.evolution.players[state.evolution.currentPlayerIndex]?.id === state.evolution.myPlayerId;
export const selectMyCreatures = state => {
  const player = state.evolution.players.find(p => p.id === state.evolution.myPlayerId);
  return player?.creatures || [];
};
export const selectOpponents = state =>
  state.evolution.players.filter(p => p.id !== state.evolution.myPlayerId);
export const selectCanPlay = state =>
  selectIsMyTurn(state) && ['evolution', 'feeding'].includes(state.evolution.phase);
```

### 根 Store 整合

```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameStore';
import evolutionReducer from './evolution/evolutionStore';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    evolution: evolutionReducer
  }
});
```

### 前置條件
- 無特殊前置條件

### 驗收標準
- [ ] State 結構完整
- [ ] 所有 action 正確實作
- [ ] Selectors 正確計算
- [ ] 與根 store 整合正常
- [ ] 測試覆蓋率 ≥ 80%

### 相關檔案
- `frontend/src/store/evolution/evolutionStore.js` — 新建
- `frontend/src/store/evolution/evolutionSelectors.js` — 新建
- `frontend/src/store/index.js` — 修改

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.1 節
