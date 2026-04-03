/**
 * GameRoom 本地模式測試
 *
 * 測試 GameRoom 與 LocalGameController 的整合
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createStore, combineReducers } from 'redux';
import GameRoom from '../GameRoom';
import { gameReducer, initialState } from '../../../../../store/gameStore';

// Mock useAIPlayers
jest.mock('../../../../../hooks/herbalism/useAIPlayers', () => ({
  __esModule: true,
  default: () => ({
    aiPlayers: [
      {
        id: 'ai-1',
        name: 'AI-1',
        isAI: true,
        difficulty: 'easy',
        setHand: jest.fn(),
        takeTurn: jest.fn().mockResolvedValue({ type: 'guess', guessedColors: ['red', 'blue'] }),
        decideFollowGuess: jest.fn().mockResolvedValue(true),
        onGameEvent: jest.fn(),
        reset: jest.fn()
      }
    ],
    aiThinking: false,
    currentAIId: null,
    isAIPlayer: (player) => player?.isAI === true,
    getAIInstance: (id) => null,
    handleAITurn: jest.fn(),
    handleAIFollowGuess: jest.fn().mockResolvedValue(true),
    handleGameEvent: jest.fn(),
    resetAIPlayers: jest.fn()
  })
}));

// Mock LocalGameController
const mockStartGame = jest.fn();
const mockGetState = jest.fn().mockReturnValue({
  gameId: 'local-test',
  players: [],
  currentPlayerIndex: 0,
  gamePhase: 'waiting',
  winner: null,
  hiddenCards: [],
  gameHistory: [],
  maxPlayers: 2
});
const mockGetCurrentPlayer = jest.fn().mockReturnValue(null);

jest.mock('../../../controllers/LocalGameController', () => {
  return class MockLocalGameController {
    constructor() {
      this.startGame = mockStartGame;
      this.handleAction = jest.fn();
      this.handleFollowGuessResponse = jest.fn();
      this.startNextRound = jest.fn();
      this.endTurn = jest.fn();
      this.getState = mockGetState;
      this.getCurrentPlayer = mockGetCurrentPlayer;
    }
  };
});

// Mock socketService
jest.mock('../../../services/socketService', () => ({
  onGameState: jest.fn(() => jest.fn()),
  onError: jest.fn(() => jest.fn()),
  onHiddenCardsRevealed: jest.fn(() => jest.fn()),
  onColorChoiceRequired: jest.fn(() => jest.fn()),
  onWaitingForColorChoice: jest.fn(() => jest.fn()),
  onColorChoiceResult: jest.fn(() => jest.fn()),
  onFollowGuessStarted: jest.fn(() => jest.fn()),
  onFollowGuessUpdate: jest.fn(() => jest.fn()),
  onGuessResult: jest.fn(() => jest.fn()),
  onRoundStarted: jest.fn(() => jest.fn()),
  onPostQuestionPhase: jest.fn(() => jest.fn()),
  onTurnEnded: jest.fn(() => jest.fn()),
  onCardGiveNotification: jest.fn(() => jest.fn()),
  onPlayerLeft: jest.fn(() => jest.fn()),
  onReconnectFailed: jest.fn(() => jest.fn()),
  onGuessResultDismissed: jest.fn(() => jest.fn()),
  onReconnected: jest.fn(() => jest.fn()),
  onConnectionChange: jest.fn(() => jest.fn()),
  attemptReconnect: jest.fn(),
  emitPlayerRefreshing: jest.fn(),
  startGame: jest.fn(),
  sendGameAction: jest.fn(),
  requestRevealHiddenCards: jest.fn(),
  leaveRoom: jest.fn(),
  submitColorChoice: jest.fn(),
  submitFollowGuessResponse: jest.fn(),
  startNextRound: jest.fn(),
  endTurn: jest.fn(),
  dismissGuessResult: jest.fn()
}));

// 工單 0161：Mock useAuth
jest.mock('../../../firebase/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: null, isAnonymous: true, photoURL: null }
  })
}));

// Mock localStorage
jest.mock('../../../utils/localStorage', () => ({
  clearCurrentRoom: jest.fn(),
  saveCurrentRoom: jest.fn(),
  getCurrentRoom: jest.fn()
}));

describe('GameRoom 本地模式', () => {
  test('應該在本地模式下初始化', () => {
    const rootReducer = combineReducers({ herbalism: gameReducer, evolution: (s = {}) => s });
    const store = createStore(rootReducer, { herbalism: initialState });

    const { container } = render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/game/local-123',
              state: {
                aiConfig: {
                  aiCount: 1,
                  difficulties: ['easy']
                },
                playerName: '測試玩家'
              }
            }
          ]}
        >
          <Routes>
            <Route path="/game/:gameId" element={<GameRoom />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // 基本檢查：組件是否渲染
    expect(container.querySelector('.game-room')).toBeInTheDocument();
  });
});
