/**
 * GameRoom 組件單元測試
 * 工作單 0023
 */

import React from 'react';
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createStore, combineReducers } from 'redux';
import GameRoom from './GameRoom';
import { gameReducer, initialState, clearPersistedState } from '../../../../store/gameStore';
import { getCurrentRoom, clearCurrentRoom } from '../../../../utils/common/localStorage';
import * as gameService from '../../../../services/gameService';
import * as socketService from '../../../../services/socketService';

// Mock gameService
jest.mock('../../../../services/gameService');

// Mock socketService
jest.mock('../../../../services/socketService');

// Mock useAuth（工單 0123）
const mockUser = { displayName: null, isAnonymous: true, photoURL: null };
jest.mock('../../../../firebase/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

// Mock localStorage utils（工單 0200）
jest.mock('../../../../utils/common/localStorage', () => ({
  getCurrentRoom: jest.fn(),
  clearCurrentRoom: jest.fn()
}));

// Partial mock gameStore — 保留 reducer，mock clearPersistedState（工單 0200）
jest.mock('../../../../store/gameStore', () => {
  const actual = jest.requireActual('../../../../store/gameStore');
  return {
    ...actual,
    clearPersistedState: jest.fn()
  };
});

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
  const rootReducer = combineReducers({ herbalism: gameReducer, evolution: (s = {}) => s });
  const store = createStore(rootReducer, { herbalism: preloadedState });
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
    // 工單 0159：補充遺漏的 socket 事件 mock
    socketService.onPlayerLeft.mockImplementation((callback) => {
      socketCallbacks.playerLeft = callback;
      return () => {};
    });
    socketService.onReconnectFailed.mockImplementation((callback) => {
      socketCallbacks.reconnectFailed = callback;
      return () => {};
    });
    // 工單 0172：猜牌結果面板關閉事件
    socketService.onGuessResultDismissed.mockImplementation((callback) => {
      socketCallbacks.guessResultDismissed = callback;
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
    socketService.dismissGuessResult.mockImplementation(() => {});
    // 工單 0196：重連相關 mock
    socketService.onReconnected.mockImplementation((callback) => {
      socketCallbacks.reconnected = callback;
      return () => {};
    });
    socketService.onConnectionChange.mockImplementation((callback) => {
      socketCallbacks.connectionChange = callback;
      return () => {};
    });
    socketService.attemptReconnect.mockImplementation(() => {});
    socketService.emitPlayerRefreshing.mockImplementation(() => {});
    // 工單 0200：localStorage mock 預設值
    getCurrentRoom.mockReturnValue(null);
  });

  describe('渲染', () => {
    test('等待階段應顯示品牌名稱（工單 0123）', () => {
      renderWithProviders(<GameRoom />);
      expect(screen.getByText('本草 Herbalism')).toBeInTheDocument();
    });

    test('遊戲進行中應顯示品牌名稱（工單 0124）', () => {
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
      expect(screen.getByText('Herbalism 本草')).toBeInTheDocument();
    });

    test('應顯示房間ID', () => {
      renderWithProviders(<GameRoom />, { gameId: 'room_123' });
      // 工單 0123：等待階段顯示 "房間 ID:" 格式
      expect(screen.getByText(/房間 ID: room_123/)).toBeInTheDocument();
    });

    test('應顯示離開房間按鈕', () => {
      renderWithProviders(<GameRoom />);
      expect(screen.getByText('離開房間')).toBeInTheDocument();
    });

    test('等待階段應顯示玩家區域（工單 0123）', () => {
      renderWithProviders(<GameRoom />);
      // 等待階段顯示「玩家」
      expect(screen.getByText('玩家')).toBeInTheDocument();
    });

    test('遊戲進行中應顯示玩家區域（工單 0124）', () => {
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
      // 工單 0124：新 UI 顯示「玩家」作為標題
      expect(screen.getByText('玩家')).toBeInTheDocument();
    });

    test('應顯示遊戲紀錄區域（工單 0124）', () => {
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
      // 工單 0124：新 UI 顯示「遊戲紀錄」在左欄
      expect(screen.getByText('遊戲紀錄')).toBeInTheDocument();
    });

    test('應顯示我的手牌區域（工單 0124）', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        players: [
          { id: 'p1', name: '玩家1', isHost: true, hand: [{ id: 'c1', color: 'red' }], isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 工單 0124：底部 footer 顯示「我的手牌」
      expect(screen.getByText('我的手牌')).toBeInTheDocument();
    });
  });

  describe('遊戲階段顯示', () => {
    test('等待階段應顯示等待訊息（工單 0123 更新）', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: [{ id: 'p1', name: '玩家1', isHost: true }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 新的等待階段 UI 顯示「等待房主開始」
      expect(screen.getByText('等待房主開始')).toBeInTheDocument();
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

    test('房主應顯示標記（工單 0123 更新）', () => {
      const state = {
        ...initialState,
        players: [{ id: 'p1', name: '玩家1', isHost: true }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 新的等待階段 UI 使用 host-tag 顯示「房主」（無括號）
      expect(screen.getAllByText('房主').length).toBeGreaterThan(0);
    });

    test('當前回合玩家應顯示標記（工單 0124）', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      // 工單 0124：新 UI 使用「回合」標籤
      expect(screen.getByText('回合')).toBeInTheDocument();
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
    test('遊戲進行中且輪到自己時應顯示問牌選擇和猜牌按鈕（工單 0124）', () => {
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
      // 工單 0124：顯示「問牌選擇」區域標題
      expect(screen.getByText('問牌選擇')).toBeInTheDocument();
      expect(screen.getByText('猜牌')).toBeInTheDocument();
    });

    test('不是自己回合時應顯示輪到提示（工單 0124）', () => {
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
      // 工單 0124：顯示「輪到 XX 行動」
      expect(screen.getByText(/輪到.*行動/)).toBeInTheDocument();
    });

    test('只剩一個活躍玩家時顏色牌應禁用（工單 0124）', () => {
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
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: state });
      // 應該有猜牌按鈕
      expect(screen.getByText('猜牌')).toBeInTheDocument();
      // 工單 0124：顏色組合牌應該有 disabled class
      const inquiryCards = container.querySelectorAll('.playing-inquiry-card.disabled');
      expect(inquiryCards.length).toBeGreaterThan(0);
    });
  });

  describe('Modal 介面', () => {
    test('點擊顏色組合牌應打開問牌流程（工單 0124）', () => {
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
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: state });

      // 工單 0124：點擊第一張顏色組合牌
      const inquiryCards = container.querySelectorAll('.playing-inquiry-card');
      expect(inquiryCards.length).toBeGreaterThan(0);
      fireEvent.click(inquiryCards[0]);

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

    test('點擊取消應關閉問牌流程 Modal（工單 0124）', () => {
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
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: state });

      // 工單 0124：打開問牌流程
      const inquiryCards = container.querySelectorAll('.playing-inquiry-card');
      fireEvent.click(inquiryCards[0]);
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
    // 工單 0123：等待階段樣式測試
    test('等待階段應包含 waiting-stage 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.waiting-stage')).toBeInTheDocument();
    });

    test('等待階段應包含 waiting-header 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.waiting-header')).toBeInTheDocument();
    });

    test('等待階段應包含 waiting-main 類別', () => {
      const { container } = renderWithProviders(<GameRoom />);
      expect(container.querySelector('.waiting-main')).toBeInTheDocument();
    });

    // 遊戲進行中樣式測試（需要 playing 階段）- 工單 0124 更新
    const playingState = {
      ...initialState,
      gamePhase: 'playing',
      players: [
        { id: 'p1', name: '玩家1', isHost: true, isActive: true },
        { id: 'p2', name: '玩家2', isActive: true },
        { id: 'p3', name: '玩家3', isActive: true }
      ]
    };

    test('遊戲進行中應包含 playing-stage 容器類別（工單 0124）', () => {
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: playingState });
      expect(container.querySelector('.playing-stage')).toBeInTheDocument();
    });

    test('遊戲進行中應包含 playing-header 類別（工單 0124）', () => {
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: playingState });
      expect(container.querySelector('.playing-header')).toBeInTheDocument();
    });

    test('遊戲進行中應包含 playing-main 類別（工單 0124）', () => {
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: playingState });
      expect(container.querySelector('.playing-main')).toBeInTheDocument();
    });

    test('遊戲進行中應包含 playing-footer 類別（工單 0124）', () => {
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: playingState });
      expect(container.querySelector('.playing-footer')).toBeInTheDocument();
    });

    test('遊戲進行中應包含 playing-left-column 類別（工單 0124）', () => {
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: playingState });
      expect(container.querySelector('.playing-left-column')).toBeInTheDocument();
    });

    test('遊戲進行中應包含 playing-right-column 類別（工單 0124）', () => {
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: playingState });
      expect(container.querySelector('.playing-right-column')).toBeInTheDocument();
    });

    test('遊戲進行中應包含 playing-center-column 類別（工單 0124）', () => {
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: playingState });
      expect(container.querySelector('.playing-center-column')).toBeInTheDocument();
    });

    test('遊戲進行中應包含 playing-hand-cards 類別（工單 0124）', () => {
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: playingState });
      expect(container.querySelector('.playing-hand-cards')).toBeInTheDocument();
    });
  });

  describe('跟猜階段', () => {
    test('跟猜階段應渲染遊戲進行中 UI（工單 0124）', () => {
      const state = {
        ...initialState,
        gamePhase: 'followGuessing',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ]
      };
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: state });
      // 工單 0124：跟猜階段使用相同的 playing-stage UI
      expect(container.querySelector('.playing-stage')).toBeInTheDocument();
      expect(screen.getByText('遊戲進行中')).toBeInTheDocument();
    });
  });

  describe('局結束階段', () => {
    test('局結束階段應渲染遊戲進行中 UI（工單 0124）', () => {
      const state = {
        ...initialState,
        gamePhase: 'roundEnd',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, score: 3 },
          { id: 'p2', name: '玩家2', isActive: true, score: 0 },
          { id: 'p3', name: '玩家3', isActive: true, score: 0 }
        ]
      };
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: state });
      // 工單 0124：局結束階段使用相同的 playing-stage UI
      expect(container.querySelector('.playing-stage')).toBeInTheDocument();
      expect(screen.getByText('遊戲進行中')).toBeInTheDocument();
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
    test('玩家列表應顯示分數（工單 0124）', () => {
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
      // 工單 0124：新 UI 使用「分數: X | 手牌: Y」格式
      expect(screen.getAllByText(/分數: 5/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/分數: 3/).length).toBeGreaterThan(0);
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

  // BUG 測試 - 工單 0126：遊戲紀錄顯示
  describe('BUG 修復: 遊戲紀錄顯示（工單 0126）', () => {
    test('應正確顯示帶有 action 欄位的紀錄', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ],
        gameHistory: [
          { playerId: 'p1', playerName: '玩家1', action: '問了紅黃牌' },
          { playerId: 'p2', playerName: '玩家2', action: '猜牌成功' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      expect(screen.getByText('遊戲紀錄')).toBeInTheDocument();
      expect(screen.getByText('問了紅黃牌')).toBeInTheDocument();
      expect(screen.getByText('猜牌成功')).toBeInTheDocument();
    });

    test('應正確格式化後端的 question 類型紀錄', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ],
        gameHistory: [
          { type: 'question', playerId: 'p1', targetPlayerId: 'p2', colors: ['red', 'yellow'], questionType: 1 }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 應該顯示格式化後的問牌紀錄
      expect(screen.getByText(/向.*玩家2.*問了.*紅黃.*牌/)).toBeInTheDocument();
    });

    test('應正確格式化後端的 prediction 類型紀錄', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true },
          { id: 'p2', name: '玩家2', isActive: true },
          { id: 'p3', name: '玩家3', isActive: true }
        ],
        gameHistory: [
          { type: 'prediction', playerId: 'p1', color: 'red' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });

      // 應該顯示格式化後的預測紀錄
      expect(screen.getByText(/預測蓋牌有.*紅.*色/)).toBeInTheDocument();
    });
  });

  // BUG 測試 - 工單 0125：顏色牌禁用邏輯
  describe('BUG 修復: 顏色牌禁用邏輯（工單 0125）', () => {
    test('初始狀態應有 6 張可選的顏色組合牌', () => {
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
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: state });

      const inquiryCards = container.querySelectorAll('.playing-inquiry-card');
      expect(inquiryCards.length).toBe(6);

      // 初始狀態沒有被自己禁用的牌
      const disabledBySelfCards = container.querySelectorAll('.playing-inquiry-card.disabled-by-self');
      expect(disabledBySelfCards.length).toBe(0);
    });

    test('非自己回合時所有顏色牌應該被禁用', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 1, // 不是自己的回合
        currentPlayerId: 'p1',
        players: [
          { id: 'p1', name: '玩家1', isActive: true, hand: [] },
          { id: 'p2', name: '玩家2', isActive: true, hand: [] },
          { id: 'p3', name: '玩家3', isActive: true, hand: [] }
        ]
      };
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: state });

      // 所有牌都應該有 disabled class
      const disabledCards = container.querySelectorAll('.playing-inquiry-card.disabled');
      expect(disabledCards.length).toBe(6);
    });

    test('顏色牌應該可以點擊打開問牌流程', () => {
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
      const { container } = renderWithProviders(<GameRoom />, { preloadedState: state });

      const inquiryCards = container.querySelectorAll('.playing-inquiry-card');
      fireEvent.click(inquiryCards[0]);

      // 應該顯示問牌流程
      expect(document.querySelector('.question-flow-overlay')).toBeInTheDocument();
    });
  });

  // ====================================================================
  // 工單 0200：重連邏輯單元測試
  // ====================================================================
  describe('重連邏輯（工單 0200）', () => {
    // Helper: render with store access for verifying dispatch results
    const renderWithStore = (component, { preloadedState = initialState, gameId = 'test_room' } = {}) => {
      const store = createStore(gameReducer, preloadedState);
      const result = render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[`/game/${gameId}`]}>
            <Routes>
              <Route path="/game/:gameId" element={component} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
      return { ...result, store };
    };

    describe('TC-0200-01：重連 useEffect — 連線後觸發重連', () => {
      test('TC-0200-01a：連線後有儲存的房間資訊且 roomId 相符時，應呼叫 attemptReconnect', () => {
        getCurrentRoom.mockReturnValue({
          roomId: 'test_room',
          playerId: 'p1',
          playerName: '玩家A'
        });

        renderWithProviders(<GameRoom />);

        act(() => {
          socketCallbacks.connectionChange(true);
        });

        expect(socketService.attemptReconnect).toHaveBeenCalledWith('test_room', 'p1', '玩家A');
      });

      test('TC-0200-01b：getCurrentRoom 返回 null 時，不應呼叫 attemptReconnect', () => {
        getCurrentRoom.mockReturnValue(null);

        renderWithProviders(<GameRoom />);

        act(() => {
          socketCallbacks.connectionChange(true);
        });

        expect(socketService.attemptReconnect).not.toHaveBeenCalled();
      });

      test('TC-0200-01c：savedRoom.roomId 與當前 gameId 不符時，不應呼叫 attemptReconnect', () => {
        getCurrentRoom.mockReturnValue({
          roomId: 'other_room',
          playerId: 'p1',
          playerName: '玩家A'
        });

        renderWithProviders(<GameRoom />);

        act(() => {
          socketCallbacks.connectionChange(true);
        });

        expect(socketService.attemptReconnect).not.toHaveBeenCalled();
      });

      test('TC-0200-01d：savedRoom.playerId 為空時，不應呼叫 attemptReconnect', () => {
        getCurrentRoom.mockReturnValue({
          roomId: 'test_room',
          playerId: '',
          playerName: '玩家A'
        });

        renderWithProviders(<GameRoom />);

        act(() => {
          socketCallbacks.connectionChange(true);
        });

        expect(socketService.attemptReconnect).not.toHaveBeenCalled();
      });

      test('TC-0200-01e：連線斷開（connected=false）時不應呼叫 attemptReconnect', () => {
        getCurrentRoom.mockReturnValue({
          roomId: 'test_room',
          playerId: 'p1',
          playerName: '玩家A'
        });

        renderWithProviders(<GameRoom />);

        act(() => {
          socketCallbacks.connectionChange(false);
        });

        expect(socketService.attemptReconnect).not.toHaveBeenCalled();
      });
    });

    describe('TC-0200-02：onReconnected handler', () => {
      test('TC-0200-02a：收到 reconnected 事件時應更新 Redux store 的遊戲狀態', () => {
        const { store } = renderWithStore(<GameRoom />);

        const mockReconnState = {
          players: [
            { id: 'p1', name: '玩家1', isActive: true },
            { id: 'p2', name: '玩家2', isActive: true },
            { id: 'p3', name: '玩家3', isActive: true }
          ],
          maxPlayers: 4,
          gamePhase: 'playing',
          currentPlayerIndex: 1,
          hiddenCards: [{ color: 'red' }, { color: 'blue' }],
          gameHistory: [{ action: 'question' }],
          winner: null
        };

        act(() => {
          socketCallbacks.reconnected({
            gameId: 'test_room',
            playerId: 'p1',
            gameState: mockReconnState
          });
        });

        const state = store.getState();
        expect(state.gameId).toBe('test_room');
        expect(state.players).toEqual(mockReconnState.players);
        expect(state.maxPlayers).toBe(4);
        expect(state.gamePhase).toBe('playing');
        expect(state.currentPlayerIndex).toBe(1);
        expect(state.currentPlayerId).toBe('p1');
        expect(state.hiddenCards).toEqual(mockReconnState.hiddenCards);
        expect(state.gameHistory).toEqual(mockReconnState.gameHistory);
        expect(state.winner).toBeNull();
      });

      test('TC-0200-02b：reconnected handler 應正確映射 gameState 中的所有 9 個欄位', () => {
        const { store } = renderWithStore(<GameRoom />);

        const mockReconnState = {
          players: [{ id: 'p1', name: '測試', isActive: true }],
          maxPlayers: 3,
          gamePhase: 'finished',
          currentPlayerIndex: 0,
          hiddenCards: [],
          gameHistory: [],
          winner: 'p1'
        };

        act(() => {
          socketCallbacks.reconnected({
            gameId: 'room_123',
            playerId: 'p1',
            gameState: mockReconnState
          });
        });

        const state = store.getState();
        expect(state).toMatchObject({
          gameId: 'room_123',
          players: mockReconnState.players,
          maxPlayers: 3,
          gamePhase: 'finished',
          currentPlayerIndex: 0,
          currentPlayerId: 'p1',
          hiddenCards: [],
          gameHistory: [],
          winner: 'p1'
        });
      });
    });

    describe('TC-0200-03：beforeunload handler', () => {
      test('TC-0200-03a：有 gameId 和 playerId 時，beforeunload 應呼叫 emitPlayerRefreshing', () => {
        const state = {
          ...initialState,
          gameId: 'test_room',
          currentPlayerId: 'p1',
          players: [
            { id: 'p1', name: '玩家1', isActive: true }
          ]
        };
        renderWithProviders(<GameRoom />, { preloadedState: state });

        act(() => {
          window.dispatchEvent(new Event('beforeunload'));
        });

        expect(socketService.emitPlayerRefreshing).toHaveBeenCalledWith('test_room', 'p1');
      });

      test('TC-0200-03b：沒有有效的 playerId 時，不應呼叫 emitPlayerRefreshing', () => {
        const state = {
          ...initialState,
          gameId: 'test_room',
          currentPlayerId: null,
          players: []
        };
        renderWithProviders(<GameRoom />, { preloadedState: state });

        act(() => {
          window.dispatchEvent(new Event('beforeunload'));
        });

        expect(socketService.emitPlayerRefreshing).not.toHaveBeenCalled();
      });
    });

    describe('TC-0200-04：handleLeaveRoom 清理流程', () => {
      test('TC-0200-04a：點擊離開按鈕應呼叫 clearCurrentRoom、clearPersistedState 和 navigate', () => {
        const state = {
          ...initialState,
          gameId: 'test_room',
          currentPlayerId: 'p1',
          players: [{ id: 'p1', name: '玩家1' }]
        };
        renderWithProviders(<GameRoom />, { preloadedState: state });

        fireEvent.click(screen.getByText('離開房間'));

        expect(clearCurrentRoom).toHaveBeenCalled();
        expect(clearPersistedState).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    describe('TC-0200-05：cleanup 函數完整性', () => {
      test('TC-0200-05a：組件 unmount 時應呼叫所有 unsubscribe 函數（含 onReconnected）', () => {
        // 追蹤每個 socket 事件的 unsubscribe 函數
        const unsubFunctions = {};
        const mainEffectEvents = [
          'onGameState', 'onError', 'onHiddenCardsRevealed',
          'onColorChoiceRequired', 'onWaitingForColorChoice', 'onColorChoiceResult',
          'onFollowGuessStarted', 'onFollowGuessUpdate', 'onGuessResult',
          'onRoundStarted', 'onPostQuestionPhase', 'onTurnEnded',
          'onCardGiveNotification', 'onPlayerLeft', 'onReconnectFailed',
          'onGuessResultDismissed', 'onReconnected'
        ];
        const separateEffectEvents = ['onConnectionChange'];
        const allEvents = [...mainEffectEvents, ...separateEffectEvents];

        allEvents.forEach(event => {
          const unsub = jest.fn();
          unsubFunctions[event] = unsub;
          socketService[event].mockImplementation((callback) => {
            return unsub;
          });
        });

        const { unmount } = renderWithProviders(<GameRoom />);

        unmount();

        // 驗證所有 unsubscribe 都被呼叫
        allEvents.forEach(event => {
          expect(unsubFunctions[event]).toHaveBeenCalled();
        });
      });
    });
  });
});
