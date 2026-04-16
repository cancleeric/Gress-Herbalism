/**
 * 觀戰模式 Redux Slice - Issue #62
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSpectating: false,
  gameId: null,
  gameState: null,
  spectators: [],
  chatMessages: [],
  error: null
};

const spectatorSlice = createSlice({
  name: 'spectator',
  initialState,
  reducers: {
    startSpectating(state, action) {
      state.isSpectating = true;
      state.gameId = action.payload.gameId;
      state.error = null;
      state.chatMessages = [];
    },
    stopSpectating(state) {
      return { ...initialState };
    },
    syncGameState(state, action) {
      state.gameState = action.payload.gameState;
      state.spectators = action.payload.spectators || [];
    },
    spectatorJoined(state, action) {
      const { spectator, spectatorCount } = action.payload;
      // Update spectators list if not already present
      const exists = state.spectators.some(s => s.id === spectator.id);
      if (!exists) {
        state.spectators.push(spectator);
      }
      // Sync count
      if (typeof spectatorCount === 'number') {
        // Trim to count if necessary
        if (state.spectators.length > spectatorCount) {
          state.spectators = state.spectators.slice(0, spectatorCount);
        }
      }
    },
    spectatorLeft(state, action) {
      const { spectatorId } = action.payload;
      state.spectators = state.spectators.filter(s => s.id !== spectatorId);
    },
    addChatMessage(state, action) {
      state.chatMessages.push(action.payload);
      // 保留最近 100 條訊息
      if (state.chatMessages.length > 100) {
        state.chatMessages.shift();
      }
    },
    setSpectatorError(state, action) {
      state.error = action.payload;
    }
  }
});

export const {
  startSpectating,
  stopSpectating,
  syncGameState,
  spectatorJoined,
  spectatorLeft,
  addChatMessage,
  setSpectatorError
} = spectatorSlice.actions;

export default spectatorSlice.reducer;

// Selectors
export const selectIsSpectating = (state) => state.spectator.isSpectating;
export const selectSpectatorGameId = (state) => state.spectator.gameId;
export const selectSpectatorGameState = (state) => state.spectator.gameState;
export const selectSpectators = (state) => state.spectator.spectators;
export const selectSpectatorChatMessages = (state) => state.spectator.chatMessages;
export const selectSpectatorError = (state) => state.spectator.error;
