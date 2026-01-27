/**
 * GameRoom AI 視覺回饋整合測試
 *
 * 測試 AI 思考動畫與視覺指示器的整合
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createStore } from 'redux';
import GameRoom from '../GameRoom';
import { gameReducer, initialState } from '../../../store/gameStore';

// Mock useAIPlayers to simulate AI thinking state
const mockUseAIPlayers = jest.fn();

jest.mock('../../../hooks/useAIPlayers', () => ({
  __esModule: true,
  default: (config) => mockUseAIPlayers(config)
}));

// Mock LocalGameController
jest.mock('../../../controllers/LocalGameController', () => {
  return jest.fn().mockImplementation(() => ({
    startGame: jest.fn(),
    handleAction: jest.fn(),
    handleFollowGuessResponse: jest.fn(),
    startNextRound: jest.fn(),
    endTurn: jest.fn(),
    getState: jest.fn().mockReturnValue({
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
    }),
    getCurrentPlayer: jest.fn().mockReturnValue({ id: 'ai-1', name: 'AI-Easy', isAI: true })
  }));
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

describe('GameRoom AI 視覺回饋', () => {
  let testStore;

  beforeEach(() => {
    // Create store with AI players
    const stateWithAIPlayers = {
      ...initialState,
      players: [
        { id: 'human-1', name: 'Human Player', isActive: true, cards: [], score: 0, isAI: false },
        { id: 'ai-1', name: 'AI-Easy', isActive: true, cards: [], score: 0, isAI: true }
      ],
      gamePhase: 'waiting',
      currentPlayerIndex: 0
    };
    testStore = createStore(gameReducer, stateWithAIPlayers);

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

  test('should display AI badge for AI players', () => {
    const { container } = render(
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

    // 檢查 AI badge 是否顯示
    const aiBadge = screen.getByText('🤖 AI');
    expect(aiBadge).toBeInTheDocument();
    expect(aiBadge).toHaveClass('ai-badge');
  });

  test('should display thinking indicator when AI is thinking', () => {
    // Mock AI thinking state
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
      aiThinking: true,
      currentAIId: 'ai-1',
      isAIPlayer: (player) => player?.isAI === true,
      getAIInstance: (id) => null,
      handleAITurn: jest.fn(),
      handleAIFollowGuess: jest.fn().mockResolvedValue(true),
      handleGameEvent: jest.fn(),
      resetAIPlayers: jest.fn()
    });

    render(
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

    // 檢查思考指示器是否顯示
    expect(screen.getByText(/思考中/)).toBeInTheDocument();
  });

  test('should apply ai-player class to AI players', () => {
    const { container } = render(
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

    // 找到所有 player-item
    const playerItems = container.querySelectorAll('.player-item');
    // 至少有一個 player-item 應該有 ai-player class
    const hasAIPlayer = Array.from(playerItems).some(item => item.classList.contains('ai-player'));
    expect(hasAIPlayer).toBe(true);
  });

  test('should apply ai-turn class when AI is thinking', () => {
    // Mock AI thinking state
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
      aiThinking: true,
      currentAIId: 'ai-1',
      isAIPlayer: (player) => player?.isAI === true,
      getAIInstance: (id) => null,
      handleAITurn: jest.fn(),
      handleAIFollowGuess: jest.fn().mockResolvedValue(true),
      handleGameEvent: jest.fn(),
      resetAIPlayers: jest.fn()
    });

    render(
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

    // 檢查 AI 輪到思考時是否有 ai-turn class
    const aiPlayerItem = screen.getByText('🤖 AI').closest('.player-item');
    expect(aiPlayerItem).toHaveClass('ai-turn');
  });

  test('should not display thinking indicator when AI is not thinking', () => {
    render(
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

    // 不應該顯示思考指示器
    expect(screen.queryByText(/思考中/)).not.toBeInTheDocument();
  });
});
