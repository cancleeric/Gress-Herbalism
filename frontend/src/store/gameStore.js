/**
 * Redux Store - 遊戲狀態管理
 *
 * 此檔案包含 Redux store 的設定、action types、action creators 和 reducer
 * 工單 0117：新增 redux-persist 狀態持久化
 *
 * @module gameStore
 */

import { createStore, combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED
} from '../shared/constants';

// 工單 0261：引入演化論 reducer
import evolutionReducer from './evolution/evolutionStore';

// 工單 0062：引入觀戰模式 reducer
import spectatorReducer from './spectatorSlice';

// ==================== Redux Persist 設定 ====================

/**
 * 持久化設定
 * - key: localStorage 中的 key 名稱
 * - storage: 使用 localStorage
 * - whitelist: 只持久化這些欄位（避免儲存暫時性狀態）
 */
const persistConfig = {
  key: 'gress_game',
  storage,
  version: 2,
  // 工單 0261：更新 whitelist 為新的 reducer 結構
  whitelist: ['herbalism'],
  // 遷移舊狀態結構
  migrate: (state) => {
    // 如果沒有 herbalism 欄位，代表是舊版本狀態，需要清除
    if (state && !state.herbalism && !state._persist) {
      console.log('[Store] 偵測到舊版狀態結構，清除並重新初始化');
      return Promise.resolve(undefined);
    }
    return Promise.resolve(state);
  }
};

// ==================== Action Types ====================

export const ActionTypes = {
  CREATE_GAME: 'CREATE_GAME',
  JOIN_GAME: 'JOIN_GAME',
  LEAVE_GAME: 'LEAVE_GAME',
  UPDATE_GAME_STATE: 'UPDATE_GAME_STATE',
  QUESTION_ACTION: 'QUESTION_ACTION',
  GUESS_ACTION: 'GUESS_ACTION',
  SET_CURRENT_PLAYER: 'SET_CURRENT_PLAYER',
  GAME_ENDED: 'GAME_ENDED',
  RESET_GAME: 'RESET_GAME'
};

// ==================== Initial State ====================

/**
 * 初始狀態
 * @type {Object}
 */
export const initialState = {
  gameId: null,
  players: [],
  hiddenCards: [],
  currentPlayerIndex: 0,
  gamePhase: GAME_PHASE_WAITING,
  winner: null,
  gameHistory: [],
  currentPlayerId: null,
  error: null
};

// ==================== Action Creators ====================

/**
 * 建立新遊戲
 * @param {Array} players - 玩家陣列
 * @returns {Object} Action 物件
 */
export function createGameAction(players) {
  return {
    type: ActionTypes.CREATE_GAME,
    payload: { players }
  };
}

/**
 * 加入遊戲
 * @param {string} gameId - 遊戲 ID
 * @param {Object} player - 玩家物件
 * @returns {Object} Action 物件
 */
export function joinGame(gameId, player) {
  return {
    type: ActionTypes.JOIN_GAME,
    payload: { gameId, player }
  };
}

/**
 * 離開遊戲
 * @param {string} gameId - 遊戲 ID
 * @param {string} playerId - 玩家 ID
 * @returns {Object} Action 物件
 */
export function leaveGame(gameId, playerId) {
  return {
    type: ActionTypes.LEAVE_GAME,
    payload: { gameId, playerId }
  };
}

/**
 * 更新遊戲狀態
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} Action 物件
 */
export function updateGameState(gameState) {
  return {
    type: ActionTypes.UPDATE_GAME_STATE,
    payload: gameState
  };
}

/**
 * 問牌動作
 * @param {Object} action - 問牌動作物件
 * @returns {Object} Action 物件
 */
export function questionAction(action) {
  return {
    type: ActionTypes.QUESTION_ACTION,
    payload: action
  };
}

/**
 * 猜牌動作
 * @param {Object} action - 猜牌動作物件
 * @returns {Object} Action 物件
 */
export function guessAction(action) {
  return {
    type: ActionTypes.GUESS_ACTION,
    payload: action
  };
}

/**
 * 設定當前玩家
 * @param {number} playerIndex - 玩家索引
 * @returns {Object} Action 物件
 */
export function setCurrentPlayer(playerIndex) {
  return {
    type: ActionTypes.SET_CURRENT_PLAYER,
    payload: { playerIndex }
  };
}

/**
 * 遊戲結束
 * @param {string|null} winner - 獲勝者 ID，如果沒有獲勝者則為 null
 * @returns {Object} Action 物件
 */
export function gameEnded(winner) {
  return {
    type: ActionTypes.GAME_ENDED,
    payload: { winner }
  };
}

/**
 * 重置遊戲
 * @returns {Object} Action 物件
 */
export function resetGame() {
  return {
    type: ActionTypes.RESET_GAME
  };
}

// ==================== Reducer ====================

/**
 * 遊戲 Reducer
 * @param {Object} state - 當前狀態
 * @param {Object} action - Action 物件
 * @returns {Object} 新狀態
 */
export function gameReducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.CREATE_GAME:
      return {
        ...state,
        players: action.payload.players,
        gamePhase: GAME_PHASE_WAITING,
        winner: null,
        gameHistory: [],
        error: null
      };

    case ActionTypes.JOIN_GAME:
      return {
        ...state,
        gameId: action.payload.gameId,
        players: [...state.players, action.payload.player]
      };

    case ActionTypes.LEAVE_GAME:
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.playerId)
      };

    case ActionTypes.UPDATE_GAME_STATE:
      return {
        ...state,
        ...action.payload,
        error: null
      };

    case ActionTypes.QUESTION_ACTION:
      return {
        ...state,
        gameHistory: [...state.gameHistory, action.payload]
      };

    case ActionTypes.GUESS_ACTION:
      return {
        ...state,
        gameHistory: [...state.gameHistory, action.payload]
      };

    case ActionTypes.SET_CURRENT_PLAYER:
      return {
        ...state,
        currentPlayerIndex: action.payload.playerIndex,
        players: state.players.map((player, index) => ({
          ...player,
          isCurrentTurn: index === action.payload.playerIndex
        }))
      };

    case ActionTypes.GAME_ENDED:
      return {
        ...state,
        gamePhase: GAME_PHASE_FINISHED,
        winner: action.payload.winner
      };

    case ActionTypes.RESET_GAME:
      return initialState;

    default:
      return state;
  }
}

// ==================== Store ====================

/**
 * 合併所有 reducers
 * 工單 0261：添加 evolution reducer
 */
const rootReducer = combineReducers({
  herbalism: gameReducer,
  evolution: evolutionReducer,
  spectator: spectatorReducer,
});

/**
 * 建立持久化 reducer
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Redux Store（使用持久化 reducer）
 */
const store = createStore(persistedReducer);

/**
 * Persistor（用於 PersistGate）
 */
export const persistor = persistStore(store);

/**
 * 清除持久化狀態
 * 用於玩家主動離開房間時
 */
export function clearPersistedState() {
  persistor.purge();
}

export default store;
