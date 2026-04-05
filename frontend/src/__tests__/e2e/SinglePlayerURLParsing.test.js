/**
 * 單人模式 URL 參數解析測試
 *
 * 測試從 URL 參數讀取 aiConfig 的功能
 * 這是為了修復直接訪問 URL 時 location.state 丟失的問題
 *
 * REF: 202601260048
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createStore, combineReducers } from 'redux';
import GameRoom from '../../components/games/herbalism/GameRoom/GameRoom';
import useAIPlayers from '../../hooks/herbalism/useAIPlayers';
import LocalGameController from '../../controllers/herbalism/LocalGameController';
import { gameReducer, initialState as defaultInitialState } from '../../store/gameStore';
import {
  AI_DIFFICULTY,
  GAME_PHASE_PLAYING,
  COLORS
} from '../../shared/constants';

// Mock modules
jest.mock('../../services/socketService', () => {
  const unsub = () => {};
  return {
    onGameState: jest.fn(() => unsub),
    onError: jest.fn(() => unsub),
    onHiddenCardsRevealed: jest.fn(() => unsub),
    onColorChoiceRequired: jest.fn(() => unsub),
    onWaitingForColorChoice: jest.fn(() => unsub),
    onColorChoiceResult: jest.fn(() => unsub),
    onFollowGuessStarted: jest.fn(() => unsub),
    onFollowGuessUpdate: jest.fn(() => unsub),
    onGuessResult: jest.fn(() => unsub),
    onRoundStarted: jest.fn(() => unsub),
    onPostQuestionPhase: jest.fn(() => unsub),
    onTurnEnded: jest.fn(() => unsub),
    onCardGiveNotification: jest.fn(() => unsub),
    onPlayerLeft: jest.fn(() => unsub),
    onReconnectFailed: jest.fn(() => unsub),
    onReconnected: jest.fn(() => unsub),
    onConnectionChange: jest.fn(() => unsub),
    onGuessResultDismissed: jest.fn(() => unsub),
    startGame: jest.fn(),
    sendGameAction: jest.fn(),
    requestRevealHiddenCards: jest.fn(),
    leaveRoom: jest.fn(),
    submitColorChoice: jest.fn(),
    submitFollowGuessResponse: jest.fn(),
    startNextRound: jest.fn(),
    endTurn: jest.fn(),
    emitPlayerRefreshing: jest.fn(),
    attemptReconnect: jest.fn(),
    dismissGuessResult: jest.fn()
  };
});

jest.mock('../../controllers/herbalism/LocalGameController');

// 工單 0161：Mock useAuth
jest.mock('../../firebase/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: null, isAnonymous: true, photoURL: null }
  })
}));

// Mock localStorage
jest.mock('../../utils/localStorage', () => ({
  clearCurrentRoom: jest.fn(),
  saveCurrentRoom: jest.fn(),
  getCurrentRoom: jest.fn()
}));

jest.mock('../../hooks/herbalism/useAIPlayers', () => ({
  __esModule: true,
  default: jest.fn()
}));

/**
 * 創建測試用的 Redux store
 */
const createTestStore = (initialState = {}) => {
  const mergedHerbalismState = {
    ...defaultInitialState,
    ...initialState
  };
  const rootReducer = combineReducers({ herbalism: gameReducer, evolution: (s = {}) => s });
  return createStore(rootReducer, { herbalism: mergedHerbalismState });
};

// 引入 socketService mock 以便在 beforeEach 重新設定實作
// （react-scripts 預設 resetMocks: true，每個測試前會 resetAllMocks）
const socketService = require('../../services/socketService');

describe('單人模式 URL 參數解析測試', () => {
  let store;
  let mockLocalController;

  beforeEach(() => {
    // react-scripts 的 resetMocks: true 會在每個測試前清除 mock 實作
    // 必須在此重新設定所有 socket 事件訂閱函數的返回值
    const unsub = () => {};
    socketService.onGameState.mockReturnValue(unsub);
    socketService.onError.mockReturnValue(unsub);
    socketService.onHiddenCardsRevealed.mockReturnValue(unsub);
    socketService.onColorChoiceRequired.mockReturnValue(unsub);
    socketService.onWaitingForColorChoice.mockReturnValue(unsub);
    socketService.onColorChoiceResult.mockReturnValue(unsub);
    socketService.onFollowGuessStarted.mockReturnValue(unsub);
    socketService.onFollowGuessUpdate.mockReturnValue(unsub);
    socketService.onGuessResult.mockReturnValue(unsub);
    socketService.onRoundStarted.mockReturnValue(unsub);
    socketService.onPostQuestionPhase.mockReturnValue(unsub);
    socketService.onTurnEnded.mockReturnValue(unsub);
    socketService.onCardGiveNotification.mockReturnValue(unsub);
    socketService.onPlayerLeft.mockReturnValue(unsub);
    socketService.onReconnectFailed.mockReturnValue(unsub);
    socketService.onReconnected.mockReturnValue(unsub);
    socketService.onConnectionChange.mockReturnValue(unsub);
    socketService.onGuessResultDismissed.mockReturnValue(unsub);

    store = createTestStore();

    mockLocalController = {
      handleAction: jest.fn(),
      getState: jest.fn(() => store.getState()),
      destroy: jest.fn(),
      startGame: jest.fn(), // 添加 startGame 方法
      processPlayerAction: jest.fn().mockResolvedValue({ success: true }),
      getCurrentGameState: jest.fn(() => store.getState())
    };

    LocalGameController.mockImplementation((options) => {
      if (options.onStateChange) {
        const initialState = {
          gameId: 'test-game-url',
          players: options.players || [],
          currentPlayerIndex: 0,
          gamePhase: GAME_PHASE_PLAYING,
          hiddenCards: [
            { id: 'hidden-1', color: COLORS.RED },
            { id: 'hidden-2', color: COLORS.BLUE }
          ],
          gameHistory: [],
          currentPlayerId: options.players?.[0]?.id || 'human-1',
          winner: null
        };
        options.onStateChange(initialState);
      }
      return mockLocalController;
    });

    const mockAIPlayers = [
      { id: 'ai-1', name: '小草', isAI: true },
      { id: 'ai-2', name: '藥師', isAI: true }
    ];

    useAIPlayers.mockReturnValue({
      aiPlayers: mockAIPlayers,
      aiThinking: false,
      currentAIId: null,
      isAIPlayer: jest.fn((player) => player?.isAI === true),
      getAIInstance: jest.fn(),
      handleAITurn: jest.fn(),
      handleAIFollowGuess: jest.fn(),
      handleGameEvent: jest.fn(),
      resetAIPlayers: jest.fn()
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== URL 參數解析測試 ====================

  describe('URL 參數解析', () => {
    test('應能從 URL 參數讀取 aiConfig（mode=single）', async () => {
      const urlParams = 'mode=single&aiCount=2&difficulties=medium,medium&playerName=測試玩家&playerId=test-123';

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[
            { pathname: '/game/local-game', search: `?${urlParams}` }
          ]}>
            <Routes>
              <Route path="/game/:gameId" element={<GameRoom />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // 驗證 GameRoom 正確渲染
      await waitFor(() => {
        const elements = screen.getAllByText(/小草/i);
        expect(elements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      // 驗證遊戲狀態被初始化為單人模式
      const state = store.getState().herbalism;
      expect(state.gamePhase).toBe(GAME_PHASE_PLAYING);
      expect(state.hiddenCards).toHaveLength(2);
    });

    test('應能解析不同的 AI 數量（aiCount=3）', async () => {
      const mockAIPlayers = [
        { id: 'ai-1', name: '小草', isAI: true },
        { id: 'ai-2', name: '藥師', isAI: true },
        { id: 'ai-3', name: '本草', isAI: true }
      ];

      useAIPlayers.mockReturnValue({
        aiPlayers: mockAIPlayers,
        aiThinking: false,
        currentAIId: null,
        isAIPlayer: jest.fn((player) => player?.isAI === true),
        getAIInstance: jest.fn(),
        handleAITurn: jest.fn(),
        handleAIFollowGuess: jest.fn(),
        handleGameEvent: jest.fn(),
        resetAIPlayers: jest.fn()
      });

      const urlParams = 'mode=single&aiCount=3&difficulties=easy,medium,hard&playerName=玩家&playerId=p1';

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[
            { pathname: '/game/local-game', search: `?${urlParams}` }
          ]}>
            <Routes>
              <Route path="/game/:gameId" element={<GameRoom />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        const elements = screen.getAllByText(/小草/i);
        expect(elements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      // 驗證 useAIPlayers 被調用時傳遞了正確的 aiConfig
      expect(useAIPlayers).toHaveBeenCalledWith(
        expect.objectContaining({
          aiConfig: expect.objectContaining({
            aiCount: 3,
            difficulties: ['easy', 'medium', 'hard']
          })
        })
      );
    });

    test('應能解析不同的難度組合', async () => {
      const urlParams = 'mode=single&aiCount=2&difficulties=easy,hard&playerName=玩家&playerId=p1';

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[
            { pathname: '/game/local-game', search: `?${urlParams}` }
          ]}>
            <Routes>
              <Route path="/game/:gameId" element={<GameRoom />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        const elements = screen.getAllByText(/玩家/i);
        expect(elements.length).toBeGreaterThan(0);
      }, { timeout: 100 });

      // 驗證 aiConfig 被正確解析
      expect(useAIPlayers).toHaveBeenCalledWith(
        expect.objectContaining({
          aiConfig: expect.objectContaining({
            aiCount: 2,
            difficulties: ['easy', 'hard']
          })
        })
      );
    });

    test('URL 參數不完整時應回退為多人模式', async () => {
      // 缺少 difficulties 參數
      const urlParams = 'mode=single&aiCount=2&playerName=玩家&playerId=p1';

      // Mock useAIPlayers 返回空陣列（表示無 AI）
      useAIPlayers.mockReturnValue({
        aiPlayers: [],
        aiThinking: false,
        currentAIId: null,
        isAIPlayer: jest.fn((player) => player?.isAI === true),
        getAIInstance: jest.fn(),
        handleAITurn: jest.fn(),
        handleAIFollowGuess: jest.fn(),
        handleGameEvent: jest.fn(),
        resetAIPlayers: jest.fn()
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[
            { pathname: '/game/local-game', search: `?${urlParams}` }
          ]}>
            <Routes>
              <Route path="/game/:gameId" element={<GameRoom />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // 驗證 useAIPlayers 被調用時 aiConfig 為 null
      await waitFor(() => {
        expect(useAIPlayers).toHaveBeenCalledWith(
          expect.objectContaining({
            aiConfig: null
          })
        );
      }, { timeout: 100 });
    });

    test('無 URL 參數且無 state 時應為多人模式', async () => {
      useAIPlayers.mockReturnValue({
        aiPlayers: [],
        aiThinking: false,
        currentAIId: null,
        isAIPlayer: jest.fn((player) => player?.isAI === true),
        getAIInstance: jest.fn(),
        handleAITurn: jest.fn(),
        handleAIFollowGuess: jest.fn(),
        handleGameEvent: jest.fn(),
        resetAIPlayers: jest.fn()
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[
            { pathname: '/game/local-game' }  // 無 search 參數
          ]}>
            <Routes>
              <Route path="/game/:gameId" element={<GameRoom />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(useAIPlayers).toHaveBeenCalledWith(
          expect.objectContaining({
            aiConfig: null
          })
        );
      }, { timeout: 100 });
    });
  });

  // ==================== location.state 優先級測試 ====================

  describe('location.state 優先級', () => {
    test('當同時有 state 和 URL 參數時，應優先使用 state', async () => {
      const stateAiConfig = {
        aiCount: 3,
        difficulties: [AI_DIFFICULTY.HARD, AI_DIFFICULTY.HARD, AI_DIFFICULTY.HARD]
      };

      const urlParams = 'mode=single&aiCount=2&difficulties=easy,easy';

      const mockAIPlayers = [
        { id: 'ai-1', name: '小草', isAI: true },
        { id: 'ai-2', name: '藥師', isAI: true },
        { id: 'ai-3', name: '本草', isAI: true }
      ];

      useAIPlayers.mockReturnValue({
        aiPlayers: mockAIPlayers,
        aiThinking: false,
        currentAIId: null,
        isAIPlayer: jest.fn((player) => player?.isAI === true),
        getAIInstance: jest.fn(),
        handleAITurn: jest.fn(),
        handleAIFollowGuess: jest.fn(),
        handleGameEvent: jest.fn(),
        resetAIPlayers: jest.fn()
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[
            {
              pathname: '/game/local-game',
              search: `?${urlParams}`,
              state: { aiConfig: stateAiConfig }
            }
          ]}>
            <Routes>
              <Route path="/game/:gameId" element={<GameRoom />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        const elements = screen.getAllByText(/小草/i);
        expect(elements.length).toBeGreaterThan(0);
      }, { timeout: 100 });

      // 驗證使用了 state 的配置（3 個 AI），而不是 URL 的配置（2 個 AI）
      expect(useAIPlayers).toHaveBeenCalledWith(
        expect.objectContaining({
          aiConfig: expect.objectContaining({
            aiCount: 3,
            difficulties: [AI_DIFFICULTY.HARD, AI_DIFFICULTY.HARD, AI_DIFFICULTY.HARD]
          })
        })
      );
    });
  });

  // ==================== 整合測試 ====================

  describe('完整 URL 流程整合測試', () => {
    test('應能通過 URL 完成單人模式遊戲初始化', async () => {
      const urlParams = 'mode=single&aiCount=2&difficulties=medium,hard&playerName=測試玩家&playerId=test-url-123';

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[
            { pathname: '/game/local-game', search: `?${urlParams}` }
          ]}>
            <Routes>
              <Route path="/game/:gameId" element={<GameRoom />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // 驗證遊戲正確初始化
      await waitFor(() => {
        const elements = screen.getAllByText(/小草|藥師/i);
        expect(elements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      // 驗證 LocalGameController 被創建
      expect(LocalGameController).toHaveBeenCalled();

      // 驗證遊戲狀態正確
      const state = store.getState().herbalism;
      expect(state.gamePhase).toBe(GAME_PHASE_PLAYING);
      expect(state.hiddenCards).toHaveLength(2);
      expect(state.players.length).toBeGreaterThanOrEqual(1);
    });
  });
});
