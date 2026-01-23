/**
 * GameRoom 組件單元測試
 * 工作單 0016
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createStore } from 'redux';
import GameRoom from './GameRoom';
import { gameReducer, initialState } from '../../store/gameStore';
import * as gameService from '../../services/gameService';

// Mock gameService
jest.mock('../../services/gameService');

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

describe('GameRoom - 工作單 0016', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    gameService.getGameState.mockReturnValue(null);
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

    test('應顯示遊戲歷史區域', () => {
      renderWithProviders(<GameRoom />);
      expect(screen.getByText('遊戲歷史')).toBeInTheDocument();
    });

    test('應顯示我的手牌區域', () => {
      renderWithProviders(<GameRoom />);
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
          { id: 'p1', name: '玩家1', isHost: true },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
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
        players: [{ id: 'p1', name: '玩家1' }]
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
      expect(screen.getByText(/玩家1/)).toBeInTheDocument();
      expect(screen.getByText('玩家2')).toBeInTheDocument();
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
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText('輪到此玩家')).toBeInTheDocument();
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
          { id: 'p1', name: '獲勝玩家' },
          { id: 'p2', name: '玩家2' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText(/獲勝者: 獲勝玩家/)).toBeInTheDocument();
    });

    test('無獲勝者時應顯示相應訊息', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: null,
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText('沒有獲勝者')).toBeInTheDocument();
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
    test('遊戲進行中應顯示問牌和猜牌按鈕', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        players: [
          { id: 'p1', name: '玩家1' },
          { id: 'p2', name: '玩家2' },
          { id: 'p3', name: '玩家3' }
        ]
      };
      renderWithProviders(<GameRoom />, { preloadedState: state });
      expect(screen.getByText(/問牌/)).toBeInTheDocument();
      expect(screen.getByText(/猜牌/)).toBeInTheDocument();
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
  });
});
