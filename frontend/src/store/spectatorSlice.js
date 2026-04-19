/**
 * 觀戰模式 Redux Slice
 *
 * 工單 0062 - 觀戰模式
 * @module store/spectatorSlice
 */

// ==================== Action Types ====================

export const SpectatorActionTypes = {
  SET_SPECTATOR_GAME_STATE: 'spectator/SET_SPECTATOR_GAME_STATE',
  SET_SPECTATOR_COUNT: 'spectator/SET_SPECTATOR_COUNT',
  SET_SPECTATOR_STATUS: 'spectator/SET_SPECTATOR_STATUS',
  SET_SPECTATOR_ERROR: 'spectator/SET_SPECTATOR_ERROR',
  RESET_SPECTATOR: 'spectator/RESET_SPECTATOR',
};

// ==================== Initial State ====================

const initialState = {
  gameId: null,
  gameState: null,
  spectatorCount: 0,
  status: 'idle', // 'idle' | 'watching' | 'ended' | 'error'
  error: null,
};

// ==================== Action Creators ====================

export function setSpectatorGameState(gameId, gameState) {
  return { type: SpectatorActionTypes.SET_SPECTATOR_GAME_STATE, payload: { gameId, gameState } };
}

export function setSpectatorCount(count) {
  return { type: SpectatorActionTypes.SET_SPECTATOR_COUNT, payload: count };
}

export function setSpectatorStatus(status) {
  return { type: SpectatorActionTypes.SET_SPECTATOR_STATUS, payload: status };
}

export function setSpectatorError(error) {
  return { type: SpectatorActionTypes.SET_SPECTATOR_ERROR, payload: error };
}

export function resetSpectator() {
  return { type: SpectatorActionTypes.RESET_SPECTATOR };
}

// ==================== Reducer ====================

export default function spectatorReducer(state = initialState, action) {
  switch (action.type) {
    case SpectatorActionTypes.SET_SPECTATOR_GAME_STATE:
      return {
        ...state,
        gameId: action.payload.gameId,
        gameState: action.payload.gameState,
        status: 'watching',
        error: null,
      };
    case SpectatorActionTypes.SET_SPECTATOR_COUNT:
      return { ...state, spectatorCount: action.payload };
    case SpectatorActionTypes.SET_SPECTATOR_STATUS:
      return { ...state, status: action.payload };
    case SpectatorActionTypes.SET_SPECTATOR_ERROR:
      return { ...state, status: 'error', error: action.payload };
    case SpectatorActionTypes.RESET_SPECTATOR:
      return { ...initialState };
    default:
      return state;
  }
}
