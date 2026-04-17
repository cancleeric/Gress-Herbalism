/**
 * 觀戰模式狀態管理
 *
 * 工單 0062：觀戰模式
 *
 * @module store/spectatorSlice
 */

// ==================== Action Types ====================

export const SpectatorActionTypes = {
  SET_SPECTATING: 'spectator/SET_SPECTATING',
  SET_SPECTATOR_GAME_STATE: 'spectator/SET_SPECTATOR_GAME_STATE',
  SET_SPECTATOR_COUNT: 'spectator/SET_SPECTATOR_COUNT',
  GAME_ENDED: 'spectator/GAME_ENDED',
  RESET: 'spectator/RESET'
};

// ==================== Initial State ====================

const initialState = {
  isSpectating: false,
  spectatedGameId: null,
  gameState: null,
  spectatorCount: 0,
  winner: null
};

// ==================== Action Creators ====================

/**
 * 開始觀戰
 * @param {string} gameId
 * @param {Object} gameState
 * @param {number} spectatorCount
 */
export function startSpectating(gameId, gameState, spectatorCount) {
  return {
    type: SpectatorActionTypes.SET_SPECTATING,
    payload: { gameId, gameState, spectatorCount }
  };
}

/**
 * 更新觀戰遊戲狀態
 * @param {Object} gameState
 * @param {number} spectatorCount
 */
export function updateSpectatorGameState(gameState, spectatorCount) {
  return {
    type: SpectatorActionTypes.SET_SPECTATOR_GAME_STATE,
    payload: { gameState, spectatorCount }
  };
}

/**
 * 更新觀戰人數
 * @param {number} spectatorCount
 */
export function updateSpectatorCount(spectatorCount) {
  return {
    type: SpectatorActionTypes.SET_SPECTATOR_COUNT,
    payload: { spectatorCount }
  };
}

/**
 * 遊戲結束（觀戰視角）
 * @param {string} winner
 */
export function spectatorGameEnded(winner) {
  return {
    type: SpectatorActionTypes.GAME_ENDED,
    payload: { winner }
  };
}

/**
 * 重置觀戰狀態
 */
export function resetSpectator() {
  return { type: SpectatorActionTypes.RESET };
}

// ==================== Reducer ====================

/**
 * 觀戰模式 Reducer
 */
export function spectatorReducer(state = initialState, action) {
  switch (action.type) {
    case SpectatorActionTypes.SET_SPECTATING:
      return {
        ...state,
        isSpectating: true,
        spectatedGameId: action.payload.gameId,
        gameState: action.payload.gameState,
        spectatorCount: action.payload.spectatorCount,
        winner: null
      };

    case SpectatorActionTypes.SET_SPECTATOR_GAME_STATE:
      return {
        ...state,
        gameState: action.payload.gameState,
        spectatorCount: action.payload.spectatorCount !== undefined
          ? action.payload.spectatorCount
          : state.spectatorCount
      };

    case SpectatorActionTypes.SET_SPECTATOR_COUNT:
      return {
        ...state,
        spectatorCount: action.payload.spectatorCount
      };

    case SpectatorActionTypes.GAME_ENDED:
      return {
        ...state,
        winner: action.payload.winner
      };

    case SpectatorActionTypes.RESET:
      return initialState;

    default:
      return state;
  }
}

export default spectatorReducer;
