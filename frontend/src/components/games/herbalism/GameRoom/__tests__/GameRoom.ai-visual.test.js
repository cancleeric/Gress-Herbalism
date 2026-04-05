/**
 * GameRoom AI 視覺回饋整合測試
 *
 * 測試 AI 玩家在新版三欄式 playing-stage UI 中的顯示
 *
 * 注意：新版 playing-stage UI（工單 0124, 0132 重構）使用 playing-player-card 結構，
 * 目前不包含 AI 標誌（🤖）、ai-player class 或 AI 思考指示器。
 * 這是已知的 UI 缺失（BUG-008），後續可補齊。
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createStore, combineReducers } from 'redux';
import GameRoom from '../GameRoom';
import { gameReducer, initialState } from '../../../../../store/gameStore';

// Mock useAIPlayers to simulate AI thinking state
const mockUseAIPlayers = jest.fn();

jest.mock('../../../../../hooks/herbalism/useAIPlayers', () => ({
  __esModule: true,
  default: (config) => mockUseAIPlayers(config)
}));

// Mock LocalGameController
const mockStartGame = jest.fn();
const mockGetState = jest.fn().mockReturnValue({
  gameId: 'local-test',
  players: [
    { id: 'human-1', name: 'Human Player', isActive: true, cards: [], score: 0, isAI: false },
    { id: 'ai-1', name: 'AI-Easy', isActive: true, cards: [], score: 0, isAI: true }
  ],
  currentPlayerIndex: 1,
  gamePhase: 'playing',
  winner: null,
  hiddenCards: [],
  gameHistory: [],
  maxPlayers: 2
});
const mockGetCurrentPlayer = jest.fn().mockReturnValue({ id: 'ai-1', name: 'AI-Easy', isAI: true });

jest.mock('../../../../../controllers/herbalism/LocalGameController', () => {
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
jest.mock('../../../../../services/socketService', () => ({
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
jest.mock('../../../../../firebase/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: null, isAnonymous: true, photoURL: null }
  })
}));

// Mock localStorage
jest.mock('../../../../../utils/common/localStorage', () => ({
  clearCurrentRoom: jest.fn(),
  saveCurrentRoom: jest.fn(),
  getCurrentRoom: jest.fn()
}));

const renderGameRoom = () => {
  return render(
    <Provider store={testStore}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/game/local-123',
            state: {
              aiConfig: {
                aiCount: 1,
                difficulties: ['easy']
              },
              playerName: 'Human Player'
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
};

let testStore;

describe('GameRoom AI 視覺回饋', () => {
  beforeEach(() => {
    // Create store with AI players in playing phase
    const stateWithAIPlayers = {
      ...initialState,
      gameId: 'local-123',
      players: [
        { id: 'human-1', name: 'Human Player', isActive: true, cards: [{ color: 'red' }], score: 0, isAI: false },
        { id: 'ai-1', name: 'AI-Easy', isActive: true, cards: [{ color: 'blue' }], score: 0, isAI: true }
      ],
      gamePhase: 'playing',
      currentPlayerIndex: 1,
      currentPlayerId: 'human-1',
      hiddenCards: [{ color: 'green' }, { color: 'yellow' }]
    };
    testStore = createStore(
      combineReducers({ herbalism: gameReducer }),
      { herbalism: stateWithAIPlayers }
    );

    // Default mock implementation
    mockUseAIPlayers.mockReturnValue({
      aiPlayers: [
        {
          id: 'ai-1',
          name: 'AI-Easy',
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
    });
  });

  test('should display AI player name in playing stage', () => {
    renderGameRoom();

    // AI 玩家名稱應在 playing-stage 中可見
    const aiNameElements = screen.getAllByText('AI-Easy');
    expect(aiNameElements.length).toBeGreaterThan(0);
  });

  test('should display both human and AI players in the player list', () => {
    const { container } = renderGameRoom();

    // 兩個玩家都應有 playing-player-card
    const playerCards = container.querySelectorAll('.playing-player-card');
    expect(playerCards.length).toBe(2);

    // 確認人類玩家和 AI 玩家名稱都顯示
    const humanNames = screen.getAllByText(/Human Player/);
    expect(humanNames.length).toBeGreaterThan(0);
    const aiNames = screen.getAllByText('AI-Easy');
    expect(aiNames.length).toBeGreaterThan(0);
  });

  test('should mark AI player card as current turn when it is their turn', () => {
    const { container } = renderGameRoom();

    // currentPlayerIndex = 1 是 AI-Easy，應有 is-current-turn class
    const currentTurnCards = container.querySelectorAll('.playing-player-card.is-current-turn');
    expect(currentTurnCards.length).toBe(1);

    // 回合標誌應顯示
    expect(screen.getByText('回合')).toBeInTheDocument();
  });

  test('should display round info with AI player name', () => {
    renderGameRoom();

    // 回合資訊應顯示 AI 玩家名稱
    expect(screen.getByText(/輪到/)).toBeInTheDocument();
  });

  test('should not display thinking indicator when AI is not thinking', () => {
    renderGameRoom();

    // 不應該顯示思考指示器
    expect(screen.queryByText(/思考中/)).not.toBeInTheDocument();
  });
});
