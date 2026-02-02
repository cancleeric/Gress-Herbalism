/**
 * GameOverModal 組件測試
 *
 * @module components/games/evolution/modals/__tests__/GameOverModal.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, variants, initial, animate, exit, onClick, ...props }) => (
      <div onClick={onClick} {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { GameOverModal } from '../GameOverModal';

// 建立測試 store
const createTestStore = (overrides = {}) => {
  return configureStore({
    reducer: {
      evolutionGame: (state = {
        gameId: 'game-123',
        winner: 'player-1',
        scores: {
          'player-1': { total: 25, creatures: 5, traits: 8, foodBonus: 7 },
          'player-2': { total: 18, creatures: 4, traits: 5, foodBonus: 5 },
        },
        ...overrides.evolutionGame,
      }) => state,
      evolutionPlayer: (state = {
        myPlayerId: 'player-1',
        players: {
          'player-1': { id: 'player-1', name: 'Alice' },
          'player-2': { id: 'player-2', name: 'Bob' },
        },
        ...overrides.evolutionPlayer,
      }) => state,
    },
  });
};

const renderModal = (store = createTestStore(), props = {}) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <GameOverModal {...props} />
      </MemoryRouter>
    </Provider>
  );
};

describe('GameOverModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染', () => {
    it('should render modal when isOpen is true', () => {
      renderModal();

      expect(screen.getByTestId('game-over-modal')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      renderModal(createTestStore(), { isOpen: false });

      expect(screen.queryByTestId('game-over-modal')).not.toBeInTheDocument();
    });

    it('should render overlay', () => {
      renderModal();

      expect(screen.getByTestId('game-over-overlay')).toBeInTheDocument();
    });

    it('should render icon', () => {
      renderModal();

      expect(screen.getByTestId('game-over-icon')).toBeInTheDocument();
    });
  });

  describe('勝利者顯示', () => {
    it('should show trophy icon when user is winner', () => {
      const store = createTestStore({
        evolutionGame: { winner: 'player-1' },
        evolutionPlayer: { myPlayerId: 'player-1' },
      });

      renderModal(store);

      expect(screen.getByTestId('game-over-icon')).toHaveTextContent('🏆');
    });

    it('should show game icon when user is not winner', () => {
      const store = createTestStore({
        evolutionGame: { winner: 'player-2' },
        evolutionPlayer: { myPlayerId: 'player-1' },
      });

      renderModal(store);

      expect(screen.getByTestId('game-over-icon')).toHaveTextContent('🎮');
    });

    it('should show congratulations when user is winner', () => {
      const store = createTestStore({
        evolutionGame: { winner: 'player-1' },
        evolutionPlayer: { myPlayerId: 'player-1' },
      });

      renderModal(store);

      expect(screen.getByText('恭喜獲勝！')).toBeInTheDocument();
    });

    it('should show game over when user is not winner', () => {
      const store = createTestStore({
        evolutionGame: { winner: 'player-2' },
        evolutionPlayer: { myPlayerId: 'player-1' },
      });

      renderModal(store);

      expect(screen.getByText('遊戲結束')).toBeInTheDocument();
    });

    it('should show winner name when user is not winner', () => {
      const store = createTestStore({
        evolutionGame: { winner: 'player-2' },
        evolutionPlayer: { myPlayerId: 'player-1' },
      });

      renderModal(store);

      expect(screen.getByTestId('winner-name')).toHaveTextContent('Bob');
    });

    it('should not show winner name when user is winner', () => {
      const store = createTestStore({
        evolutionGame: { winner: 'player-1' },
        evolutionPlayer: { myPlayerId: 'player-1' },
      });

      renderModal(store);

      expect(screen.queryByTestId('winner-name')).not.toBeInTheDocument();
    });
  });

  describe('按鈕', () => {
    it('should render play again button', () => {
      renderModal();

      expect(screen.getByTestId('btn-play-again')).toBeInTheDocument();
      expect(screen.getByText('再來一局')).toBeInTheDocument();
    });

    it('should render view stats button', () => {
      renderModal();

      expect(screen.getByTestId('btn-view-stats')).toBeInTheDocument();
      expect(screen.getByText('查看統計')).toBeInTheDocument();
    });

    it('should navigate to lobby when play again clicked', () => {
      renderModal();

      fireEvent.click(screen.getByTestId('btn-play-again'));

      expect(mockNavigate).toHaveBeenCalledWith('/evolution/lobby');
    });

    it('should call onPlayAgain when provided', () => {
      const onPlayAgain = jest.fn();
      renderModal(createTestStore(), { onPlayAgain });

      fireEvent.click(screen.getByTestId('btn-play-again'));

      expect(onPlayAgain).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should navigate to stats when view stats clicked', () => {
      renderModal();

      fireEvent.click(screen.getByTestId('btn-view-stats'));

      expect(mockNavigate).toHaveBeenCalledWith('/evolution/stats/game-123');
    });

    it('should navigate to lobby when no gameId', () => {
      const store = createTestStore({
        evolutionGame: { gameId: null },
      });

      renderModal(store);

      fireEvent.click(screen.getByTestId('btn-view-stats'));

      expect(mockNavigate).toHaveBeenCalledWith('/evolution/lobby');
    });
  });

  describe('關閉行為', () => {
    it('should call onClose when overlay clicked', () => {
      const onClose = jest.fn();
      renderModal(createTestStore(), { onClose });

      fireEvent.click(screen.getByTestId('game-over-overlay'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close when modal content clicked', () => {
      const onClose = jest.fn();
      renderModal(createTestStore(), { onClose });

      fireEvent.click(screen.getByTestId('game-over-modal'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should navigate to lobby when overlay clicked without onClose', () => {
      renderModal();

      fireEvent.click(screen.getByTestId('game-over-overlay'));

      expect(mockNavigate).toHaveBeenCalledWith('/evolution/lobby');
    });
  });

  describe('計分板', () => {
    it('should render score board', () => {
      renderModal();

      expect(screen.getByTestId('score-board')).toBeInTheDocument();
    });

    it('should pass scores to ScoreBoard', () => {
      renderModal();

      expect(screen.getByText('25 分')).toBeInTheDocument();
      expect(screen.getByText('18 分')).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('should handle undefined winner', () => {
      const store = createTestStore({
        evolutionGame: { winner: undefined },
      });

      renderModal(store);

      expect(screen.getByText('遊戲結束')).toBeInTheDocument();
    });

    it('should handle empty scores', () => {
      const store = createTestStore({
        evolutionGame: { scores: {} },
      });

      renderModal(store);

      expect(screen.getByText('暫無計分資料')).toBeInTheDocument();
    });

    it('should handle unknown winner', () => {
      const store = createTestStore({
        evolutionGame: { winner: 'unknown-player' },
        evolutionPlayer: { myPlayerId: 'player-1' },
      });

      renderModal(store);

      expect(screen.getByTestId('winner-name')).toHaveTextContent('unknown-player');
    });
  });
});
