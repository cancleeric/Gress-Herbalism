/**
 * 觀戰模式 Redux Reducer
 * 工單 0062 - 觀戰模式：旁觀進行中對局 + 即時同步
 *
 * @module store/spectatorSlice
 */

// ==================== Action Types ====================

export const SpectatorActionTypes = {
  SPECTATOR_JOINED: 'SPECTATOR_JOINED',
  SPECTATOR_SYNC: 'SPECTATOR_SYNC',
  SPECTATOR_LEFT: 'SPECTATOR_LEFT',
  SPECTATOR_GAME_ENDED: 'SPECTATOR_GAME_ENDED',
  SPECTATOR_COUNT_UPDATED: 'SPECTATOR_COUNT_UPDATED',
  SPECTATOR_ERROR: 'SPECTATOR_ERROR',
  SPECTATOR_RESET: 'SPECTATOR_RESET'
};

// ==================== Initial State ====================

const initialState = {
  isSpectating: false,
  gameId: null,
  spectatorId: null,
  spectatorCount: 0,
  gameState: null,
  error: null,
  gameEnded: false,
  winner: null,
  finalScores: null
};

// ==================== Action Creators ====================

export const spectatorJoined = ({ gameId, spectatorId, gameState, spectatorCount }) => ({
  type: SpectatorActionTypes.SPECTATOR_JOINED,
  payload: { gameId, spectatorId, gameState, spectatorCount }
});

export const spectatorSync = ({ gameState, spectatorCount }) => ({
  type: SpectatorActionTypes.SPECTATOR_SYNC,
  payload: { gameState, spectatorCount }
});

export const spectatorLeft = () => ({
  type: SpectatorActionTypes.SPECTATOR_LEFT
});

export const spectatorGameEnded = ({ winner, scores }) => ({
  type: SpectatorActionTypes.SPECTATOR_GAME_ENDED,
  payload: { winner, scores }
});

export const spectatorCountUpdated = ({ spectatorCount }) => ({
  type: SpectatorActionTypes.SPECTATOR_COUNT_UPDATED,
  payload: { spectatorCount }
});

export const spectatorError = (message) => ({
  type: SpectatorActionTypes.SPECTATOR_ERROR,
  payload: { message }
});

export const spectatorReset = () => ({
  type: SpectatorActionTypes.SPECTATOR_RESET
});

// ==================== Reducer ====================

function spectatorReducer(state = initialState, action) {
  switch (action.type) {
    case SpectatorActionTypes.SPECTATOR_JOINED:
      return {
        ...state,
        isSpectating: true,
        gameId: action.payload.gameId,
        spectatorId: action.payload.spectatorId,
        gameState: action.payload.gameState,
        spectatorCount: action.payload.spectatorCount,
        error: null,
        gameEnded: false,
        winner: null,
        finalScores: null
      };

    case SpectatorActionTypes.SPECTATOR_SYNC:
      return {
        ...state,
        gameState: action.payload.gameState,
        spectatorCount: action.payload.spectatorCount
      };

    case SpectatorActionTypes.SPECTATOR_COUNT_UPDATED:
      return {
        ...state,
        spectatorCount: action.payload.spectatorCount
      };

    case SpectatorActionTypes.SPECTATOR_GAME_ENDED:
      return {
        ...state,
        gameEnded: true,
        winner: action.payload.winner,
        finalScores: action.payload.scores
      };

    case SpectatorActionTypes.SPECTATOR_ERROR:
      return {
        ...state,
        error: action.payload.message
      };

    case SpectatorActionTypes.SPECTATOR_LEFT:
    case SpectatorActionTypes.SPECTATOR_RESET:
      return initialState;

    default:
      return state;
  }
}

export default spectatorReducer;
