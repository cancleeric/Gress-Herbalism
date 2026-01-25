/**
 * GameRoom 組件單元測試
 * 工作單 0023
 */

import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createStore } from 'redux';
import GameRoom from './GameRoom';
import { gameReducer, initialState } from '../../store/gameStore';
import * as gameService from '../../services/gameService';
import * as socketService from '../../services/socketService';

// Mock gameService
jest.mock('../../services/gameService');

// Mock socketService
jest.mock('../../services/socketService');

// Socket event callbacks storage
let socketCallbacks = {};

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// 測試用 wrapper
const renderWithProviders = (component, { preloadedState = initialState, gameId = 'test_room' } = {}) => {
  const store = createStore(gameReducer, preloadedState);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/game/${gameId}`]}>
        <Routes>
          <Route path="/game/:gameId" element={component} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('GameRoom - 工作單 0023', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    socketCallbacks = {};
    gameService.getGameState.mockReturnValue(null);
    gameService.startGame.mockReturnValue({ success: true, gameState: null });

    // Mock all socketService functions
    socketService.onGameState.mockImplementation((callback) => {
      socketCallbacks.gameState = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      socketCallbacks.error = callback;
      return () => {};
    });
    socketService.onHiddenCardsRevealed.mockImplementation((callback) => {
      socketCallbacks.hiddenCardsRevealed = callback;
      return () => {};
    });
    socketService.onColorChoiceRequired.mockImplementation((callback) => {
      socketCallbacks.colorChoiceRequired = callback;
      return () => {};
    });
    socketService.onWaitingForColorChoice.mockImplementation((callback) => {
      socketCallbacks.waitingForColorChoice = callback;
      return () => {};
    });
    socketService.onColorChoiceResult.mockImplementation((callback) => {
      socketCallbacks.colorChoiceResult = callback;
      return () => {};
    });
    socketService.onFollowGuessStarted.mockImplementation((callback) => {
      socketCallbacks.followGuessStarted = callback;
      return () => {};
    });
    socketService.onFollowGuessUpdate.mockImplementation((callback) => {
      socketCallbacks.followGuessUpdate = callback;
      return () => {};
    });
    socketService.onGuessResult.mockImplementation((callback) => {
      socketCallbacks.guessResult = callback;
      return () => {};
    });
    socketService.onRoundStarted.mockImplementation((callback) => {
      socketCallbacks.roundStarted = callback;
      return () => {};
    });
    // 工單 0071：預測功能相關 mock
    socketService.onPostQuestionPhase.mockImplementation((callback) => {
      socketCallbacks.postQuestionPhase = callback;
      return () => {};
    });
    socketService.onTurnEnded.mockImplementation((callback) => {
      socketCallbacks.turnEnded = callback;
      return () => {};
    });
    // 工單 0072：給牌通知 mock
    socketService.onCardGiveNotification.mockImplementation((callback) => {
      socketCallbacks.cardGiveNotification = callback;
      return () => {};
    });
    socketService.startGame.mockImplementation(() => {});
    socketService.sendGameAction.mockImplementation(() => {});
    socketService.requestRevealHiddenCards.mockImplementation(() => {});
    socketService.leaveRoom.mockImplementation(() => {});
    socketService.submitColorChoice.mockImplementation(() => {});
    socketService.submitFollowGuessResponse.mockImplementation(() => {});
    socketService.startNextRound.mockImplementation(() => {});
    socketService.endTurn.mockImplementation(() => {});
  });

  describe('渲染', () => {
    test('應顯示遊戲房間標題', () => {
      renderWithProviders(<GameRoom />);
      expect(screen.getByText('遊戲房間')).toBeInTheDocument();
    });

    test('應顯示房間ID', () => {
      renderWithProviders(<GameRoom />, { gameId: 'room_123' });
      expect(screen.getByText(/房間ID: room_123/)).toBeInTheDocument();
    });

    test('應顯示離開房間按鈕', () => {
      renderWithProviders(<GameRoom />);
      expect(screen.getByText('離開房間')).toBeInTheDocument();
    });

    test('應顯示玩家列表區域', () => {
      renderWithProviders(<GameRoom />);
      expect(screen.getByText('玩家列表')).toBeInTheDocument();
    });

    test('應整合 GameStatusContainer 組件', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        players: [
          { id: 'p1', name: '玩家1', isHost: true, isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // GameStatusContainer 應該顯示遊戲狀態
      expect(screen.getByText('遊戲狀態')).toBeInTheDocument();
    });

    test('應整合 PlayerHand 組件顯示手牌', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        players: [
          { id: 'p1', name: '玩家1', isHost: true, hand: [{ id: 'c1', color: 'red' }], isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // PlayerHand 應該顯示「我的手牌」
      expect(screen.getByText('我的手牌')).toBeInTheDocument();
    });
  });

  describe('遊戲階段顯示', () => {
    test('等待階段應顯示等待訊息', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: [{ id: 'p1', name: '玩家1', isHost: true }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText('等待玩家加入...')).toBeInTheDocument();
    });

    test('進行中階段應顯示遊戲進行中', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        players: [
          { id: 'p1', name: '玩家1', isHost: true, isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 檢查 header 中的遊戲階段
      expect(screen.getAllByText('遊戲進行中').length).toBeGreaterThan(0);
    });

    test('結束階段應顯示遊戲結束', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        players: [{ id: 'p1', name: '玩家1', isActive: true }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText('遊戲結束')).toBeInTheDocument();
    });
  });

  describe('玩家列表', () => {
    test('應顯示所有玩家名稱', () => {
      const state = {
        ...initialState,
        players: [
          { id: 'p1', name: '玩家1', isHost: true },
          { id: 'p2', name: '玩家2' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 玩家名稱會出現在多個地方（GameStatus 和 players-sidebar）
      expect(screen.getAllByText(/玩家1/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/玩家2/).length).toBeGreaterThan(0);
    });

    test('房主應顯示標記', () => {
      const state = {
        ...initialState,
        players: [{ id: 'p1', name: '玩家1', isHost: true }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText(/\(房主\)/)).toBeInTheDocument();
    });

    test('當前回合玩家應顯示標記', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText('輪到此玩家')).toBeInTheDocument();
    });

    test('已退出玩家應顯示退出標記', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 1,
        players: [
          { id: 'p1', name: '玩家1', isActive: false },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 退出標記會出現在多個地方（GameStatus 和 players-sidebar）
      expect(screen.getAllByText('已退出').length).toBeGreaterThan(0);
    });
  });

  describe('開始遊戲按鈕', () => {
    test('房主在等待階段應看到開始遊戲按鈕', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: [{ id: 'p1', name: '玩家1', isHost: true }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText(/開始遊戲/)).toBeInTheDocument();
    });

    test('玩家少於3人時開始按鈕應禁用', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: [
          { id: 'p1', name: '玩家1', isHost: true },
          { id: 'p2', name: '玩家2' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      const startButton = screen.getByText(/開始遊戲/);
      expect(startButton).toBeDisabled();
    });

    test('玩家達到3人時開始按鈕應啟用', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: [
          { id: 'p1', name: '玩家1', isHost: true },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      const startButton = screen.getByText(/開始遊戲/);
      expect(startButton).not.toBeDisabled();
    });
  });

  describe('遊戲結束', () => {
    test('應顯示獲勝者名稱', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        players: [
          { id: 'p1', name: '獲勝玩家', isActive: true },
          { id: 'p2', name: '玩家2', isActive: false }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getAllByText(/獲勝者/).length).toBeGreaterThan(0);
    });

    test('無獲勝者時應顯示相應訊息', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: null,
        players: [{ id: 'p1', name: '玩家1', isActive: false }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getAllByText(/沒有獲勝者/).length).toBeGreaterThan(0);
    });
  });

  describe('離開房間', () => {
    test('點擊離開房間應導航到首頁', () => {
      const state = {
        ...initialState,
        gameId: 'test_room',
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      fireEvent.click(screen.getByText('離開房間'));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('操作按鈕', () => {
    test('遊戲進行中且輪到自己時應顯示操作提示和猜牌按鈕（工單 0074 新流程）', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 新流程：顯示點擊顏色牌的提示（兩處：GameBoard 和 action-buttons）
      const hints = screen.getAllByText(/點擊.*顏色牌/);
      expect(hints.length).toBeGreaterThan(0);
      expect(screen.getByText('猜牌')).toBeInTheDocument();
    });

    test('不是自己回合時應顯示等待訊息', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 1,
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText(/等待.*的回合/)).toBeInTheDocument();
    });

    test('只剩一個活躍玩家時只顯示猜牌按鈕', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: false },
          { id: 'p3', name: '玩家3', isActive: false }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 不應該有問牌提示
      expect(screen.queryByText(/點擊.*顏色牌開始問牌/)).not.toBeInTheDocument();
      // 應該有猜牌按鈕
      expect(screen.getByText('猜牌')).toBeInTheDocument();
      // 應該有必須猜牌提示
      expect(screen.getByText(/必須猜牌/)).toBeInTheDocument();
    });
  });

  describe('Modal 介面', () => {
    test('點擊顏色組合牌應打開問牌流程（工單 0074 新流程）', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, hand: [] },
          { id: 'p2', name: '玩家2', isActive: true, hand: [] },
          { id: 'p3', name: '玩家3', isActive: true, hand: [] }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 點擊一張顏色組合牌（例如紅綠）
      fireEvent.click(screen.getByText('紅綠'));

      // 應該顯示問牌流程 overlay
      expect(document.querySelector('.question-flow-overlay')).toBeInTheDocument();
    });

    test('點擊猜牌按鈕應打開猜牌 Modal', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, hand: [] },
          { id: 'p2', name: '玩家2', isActive: true, hand: [] },
          { id: 'p3', name: '玩家3', isActive: true, hand: [] }
        ]
      };
      gameService.revealHiddenCards.mockReturnValue({ success: true, cards: [] });
      renderWithProviders(<GameRoom />, { preloadedState: state });

      fireEvent.click(screen.getByText('猜牌'));

      // 應該顯示 Modal overlay
      expect(document.querySelector('.modal-overlay')).toBeInTheDocument();
    });

    test('點擊取消應關閉問牌流程 Modal（工單 0074 新流程）', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, hand: [] },
          { id: 'p2', name: '玩家2', isActive: true, hand: [] },
          { id: 'p3', name: '玩家3', isActive: true, hand: [] }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 打開問牌流程
      fireEvent.click(screen.getByText('紅綠'));
      expect(document.querySelector('.question-flow-overlay')).toBeInTheDocument();

      // 點擊取消按鈕關閉
      fireEvent.click(screen.getByText('取消'));
      expect(document.querySelector('.question-flow-overlay')).not.toBeInTheDocument();
    });
  });

  describe('GameBoard 整合', () => {
    test('應整合 GameBoard 組件', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // GameBoard 應該顯示蓋牌區
      expect(screen.getByText('蓋牌')).toBeInTheDocument();
    });
  });

  describe('樣式', () => {
    test('應包含 game-room 容器類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.game-room')).toBeInTheDocument();
    });

    test('應包含 game-room-header 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.game-room-header')).toBeInTheDocument();
    });

    test('應包含 game-room-main 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.game-room-main')).toBeInTheDocument();
    });

    test('應包含 game-room-footer 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.game-room-footer')).toBeInTheDocument();
    });

    test('應包含 status-sidebar 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.status-sidebar')).toBeInTheDocument();
    });

    test('應包含 players-sidebar 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.players-sidebar')).toBeInTheDocument();
    });

    test('應包含 game-board-area 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.game-board-area')).toBeInTheDocument();
    });

    test('應包含 my-hand-section 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.my-hand-section')).toBeInTheDocument();
    });
  });

  describe('跟猜階段', () => {
    test('跟猜階段應顯示跟猜階段文字', () => {
      const state = {
        ...initialState,
        gamePhase: 'followGuessing',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText('跟猜階段')).toBeInTheDocument();
    });
  });

  describe('局結束階段', () => {
    test('局結束階段應顯示局結束文字', () => {
      const state = {
        ...initialState,
        gamePhase: 'roundEnd',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, score: 3 },
          { id: 'p2', name: '玩家2', isActive: true, score: 0 },
          { id: 'p3', name: '玩家3', isActive: true, score: 0 }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText('局結束')).toBeInTheDocument();
    });
  });

  describe('未知狀態', () => {
    test('未知遊戲階段應顯示未知狀態', () => {
      const state = {
        ...initialState,
        gamePhase: 'unknownPhase',
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText('未知狀態')).toBeInTheDocument();
    });
  });

  describe('開始遊戲錯誤處理', () => {
    test('玩家少於3人時開始按鈕應禁用', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        gameId: 'test_room',
        players: [
          { id: 'p1', name: '玩家1', isHost: true },
          { id: 'p2', name: '玩家2' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      const startButton = screen.getByText(/開始遊戲/);
      expect(startButton).toBeDisabled();
    });
  });

  describe('玩家分數顯示', () => {
    test('玩家列表應顯示分數', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        players: [
          { id: 'p1', name: '玩家1', score: 5, isActive: true },
          { id: 'p2', name: '玩家2', score: 3, isActive: true },
          { id: 'p3', name: '玩家3', score: 0, isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 分數應該顯示在玩家列表中
      expect(screen.getAllByText(/5 分/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/3 分/).length).toBeGreaterThan(0);
    });
  });

  describe('Socket 事件處理', () => {
    test('應處理遊戲狀態更新事件', async () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: [{ id: 'p1', name: '玩家1', isHost: true }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 模擬遊戲狀態更新
      if (socketCallbacks.gameState) {
        socketCallbacks.gameState({
          gameId: 'test_room',
          players: [
            { id: 'p1', name: '玩家1', isHost: true },
            { id: 'p2', name: '新玩家' }
          ],
          currentPlayerIndex: 0,
          gamePhase: 'waiting',
          winner: null,
          hiddenCards: [],
          gameHistory: [],
          maxPlayers: 4
        });
      }

      await waitFor(() => {
        expect(screen.getAllByText(/新玩家/).length).toBeGreaterThan(0);
      });
    });

    test('應處理錯誤事件', async () => {
      renderWithProviders(<GameRoom />);

      // 模擬錯誤
      if (socketCallbacks.error) {
        socketCallbacks.error({ message: '測試錯誤訊息' });
      }

      await waitFor(() => {
        expect(screen.getByText('測試錯誤訊息')).toBeInTheDocument();
      });
    });

    test('應處理蓋牌揭示事件', async () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, hand: [] },
          { id: 'p2', name: '玩家2', isActive: true, hand: [] },
          { id: 'p3', name: '玩家3', isActive: true, hand: [] }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 點擊猜牌打開猜牌介面
      fireEvent.click(screen.getByText('猜牌'));

      // 模擬蓋牌揭示
      if (socketCallbacks.hiddenCardsRevealed) {
        socketCallbacks.hiddenCardsRevealed({
          cards: [{ id: 'h1', color: 'red' }, { id: 'h2', color: 'blue' }]
        });
      }

      // 應該顯示 GuessCard modal
      expect(document.querySelector('.modal-overlay')).toBeInTheDocument();
    });

    test('應處理顏色選擇請求事件', async () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 模擬顏色選擇請求
      if (socketCallbacks.colorChoiceRequired) {
        socketCallbacks.colorChoiceRequired({
          askingPlayerId: 'p2',
          colors: ['red', 'blue'],
          message: '請選擇要給的顏色'
        });
      }

      await waitFor(() => {
        expect(screen.getByText('選擇要給的顏色')).toBeInTheDocument();
      });
    });

    test('應處理等待顏色選擇事件', async () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerId: 'p2',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 模擬等待顏色選擇
      if (socketCallbacks.waitingForColorChoice) {
        socketCallbacks.waitingForColorChoice({
          targetPlayerId: 'p1',
          askingPlayerId: 'p2',
          colors: ['red', 'blue']
        });
      }

      await waitFor(() => {
        expect(screen.getByText(/等待.*選擇要給哪種顏色/)).toBeInTheDocument();
      });
    });

    test('應處理跟猜開始事件', async () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerId: 'p2',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 模擬跟猜開始
      if (socketCallbacks.followGuessStarted) {
        socketCallbacks.followGuessStarted({
          guessingPlayerId: 'p1',
          guessedColors: ['red', 'blue'],
          decisionOrder: ['p2', 'p3'],
          currentDeciderId: 'p2',
          decisions: {}
        });
      }

      await waitFor(() => {
        expect(screen.getByText(/輪到你決定/)).toBeInTheDocument();
      });
    });

    test('應處理猜牌結果事件', async () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, score: 0 },
          { id: 'p2', name: '玩家2', isActive: true, score: 0 },
          { id: 'p3', name: '玩家3', isActive: true, score: 0 }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 模擬猜牌結果
      if (socketCallbacks.guessResult) {
        socketCallbacks.guessResult({
          isCorrect: true,
          scoreChanges: { p1: 3 },
          hiddenCards: [{ id: 'h1', color: 'red' }, { id: 'h2', color: 'blue' }],
          guessingPlayerId: 'p1',
          followingPlayers: []
        });
      }

      await waitFor(() => {
        expect(screen.getByText(/猜對了/)).toBeInTheDocument();
      });
    });

    test('應處理局開始事件', async () => {
      const state = {
        ...initialState,
        gamePhase: 'roundEnd',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, score: 3 },
          { id: 'p2', name: '玩家2', isActive: true, score: 0 },
          { id: 'p3', name: '玩家3', isActive: true, score: 0 }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 模擬局開始
      if (socketCallbacks.roundStarted) {
        socketCallbacks.roundStarted({
          round: 2,
          startPlayerIndex: 1
        });
      }

      // 局開始後 roundEnd 面板應該消失
      await waitFor(() => {
        expect(screen.queryByText(/下一局/)).not.toBeInTheDocument();
      });
    });

    test('postQuestionPhase 事件應顯示預測選項（工單 0076）', async () => {
      const state = {
        ...initialState,
        gamePhase: 'postQuestion',
        gameId: 'test_room',
        currentPlayerId: 'p1',
        currentPlayerIndex: 0,
        players: [
          { id: 'p1', name: '玩家1', isActive: true, hand: [{ id: 'c1', color: 'red' }] },
          { id: 'p2', name: '玩家2', isActive: true, hand: [{ id: 'c2', color: 'blue' }] },
          { id: 'p3', name: '玩家3', isActive: true, hand: [{ id: 'c3', color: 'green' }] }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 模擬 postQuestionPhase 事件
      if (socketCallbacks.postQuestionPhase) {
        socketCallbacks.postQuestionPhase({
          playerId: 'p1',
          message: '問牌完成！你可以選擇預測蓋牌顏色，然後按結束回合。'
        });
      }

      // 預測選項應該顯示（檢查 Prediction 組件的標題）
      await waitFor(() => {
        expect(screen.getByText('問牌完成！')).toBeInTheDocument();
        expect(screen.getByText('結束回合')).toBeInTheDocument();
      });
    });

    test('點擊開始遊戲按鈕應呼叫 socketService.startGame', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        gameId: 'test_room',
        players: [
          { id: 'p1', name: '玩家1', isHost: true },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      fireEvent.click(screen.getByText(/開始遊戲/));

      expect(socketService.startGame).toHaveBeenCalledWith('test_room');
    });

    test('點擊離開房間應呼叫 socketService.leaveRoom', () => {
      const state = {
        ...initialState,
        gameId: 'test_room',
        currentPlayerId: 'p1',
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      fireEvent.click(screen.getByText('離開房間'));

      expect(socketService.leaveRoom).toHaveBeenCalledWith('test_room', 'p1');
    });
  });
});
