/**
 * GameBoard 組件單元測試
 * 工作單 0017
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import GameBoard from './GameBoard';
import { gameReducer, initialState } from '../../../../store/gameStore';

// 測試用 wrapper
const renderWithProviders = (component, { preloadedState = initialState } = {}) => {
  const store = createStore(gameReducer, preloadedState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('GameBoard - 工作單 0017', () => {
  describe('渲染', () => {
    test('應顯示蓋牌區域標題', () => {
      renderWithProviders(<GameBoard />);
      expect(screen.getByText('蓋牌')).toBeInTheDocument();
    });

    test('應顯示兩張蓋牌佔位符', () => {
      const { container } = renderWithProviders(<GameBoard />);
      const hiddenCards = container.querySelectorAll('.hidden-card');
      expect(hiddenCards.length).toBe(2);
    });

    test('蓋牌應顯示背面圖案', () => {
      const { container } = renderWithProviders(<GameBoard />);
      const patterns = container.querySelectorAll('.card-pattern');
      expect(patterns.length).toBe(2);
    });

    test('蓋牌應顯示問號圖示', () => {
      renderWithProviders(<GameBoard />);
      expect(screen.getAllByText('?').length).toBe(2);
    });
  });

  describe('等待階段', () => {
    test('應顯示等待訊息', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: []
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('等待玩家加入')).toBeInTheDocument();
    });

    test('應顯示玩家數量', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('目前有 1 位玩家')).toBeInTheDocument();
    });
  });

  describe('進行中階段', () => {
    test('應顯示遊戲進行中', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('遊戲進行中')).toBeInTheDocument();
    });

    test('應顯示當前回合玩家', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        players: [{ id: 'p1', name: '測試玩家' }]
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('測試玩家')).toBeInTheDocument();
    });

    test('猜牌時應顯示提示', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameBoard isGuessing={true} currentPlayerId="p1" />, { preloadedState: state });
      expect(screen.getByText('正在猜牌中...')).toBeInTheDocument();
    });
  });

  describe('結束階段', () => {
    test('應顯示遊戲結束', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        players: [{ id: 'p1', name: '獲勝者' }]
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('遊戲結束!')).toBeInTheDocument();
    });

    test('有獲勝者時應顯示獲勝者名稱', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        players: [{ id: 'p1', name: '勝利玩家' }]
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('勝利玩家')).toBeInTheDocument();
    });

    test('無獲勝者時應顯示相應訊息', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: null,
        players: []
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('沒有獲勝者')).toBeInTheDocument();
    });
  });

  describe('蓋牌揭曉', () => {
    test('遊戲結束且有獲勝者時應揭曉蓋牌', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        hiddenCards: [
          { id: 'h1', color: 'red' },
          { id: 'h2', color: 'blue' }
        ],
        players: [{ id: 'p1', name: '玩家1' }]
      };
      const { container } = renderWithProviders(<GameBoard />, { preloadedState: state });

      // 檢查蓋牌是否有 revealed 類別
      const revealedCards = container.querySelectorAll('.hidden-card.revealed');
      expect(revealedCards.length).toBe(2);
    });

    test('遊戲結束且有獲勝者時應顯示揭曉訊息', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        hiddenCards: [
          { id: 'h1', color: 'red' },
          { id: 'h2', color: 'blue' }
        ],
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('蓋牌已揭曉!')).toBeInTheDocument();
    });

    test('遊戲結束但無獲勝者時不應揭曉蓋牌', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: null,
        hiddenCards: [
          { id: 'h1', color: 'red' },
          { id: 'h2', color: 'blue' }
        ],
        players: []
      };
      const { container } = renderWithProviders(<GameBoard />, { preloadedState: state });

      // 檢查蓋牌不應有 revealed 類別
      const revealedCards = container.querySelectorAll('.hidden-card.revealed');
      expect(revealedCards.length).toBe(0);
    });

    test('猜牌者應可以看到蓋牌', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        hiddenCards: [
          { id: 'h1', color: 'red' },
          { id: 'h2', color: 'blue' }
        ],
        players: [{ id: 'p1', name: '玩家1' }]
      };
      const { container } = renderWithProviders(
        <GameBoard isGuessing={true} currentPlayerId="p1" />,
        { preloadedState: state }
      );

      // 猜牌者應看到揭曉的牌
      const revealedCards = container.querySelectorAll('.hidden-card.revealed');
      expect(revealedCards.length).toBe(2);
    });

    test('非猜牌者不應看到蓋牌', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        hiddenCards: [
          { id: 'h1', color: 'red' },
          { id: 'h2', color: 'blue' }
        ],
        players: [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }]
      };
      const { container } = renderWithProviders(
        <GameBoard isGuessing={true} currentPlayerId="p2" />,
        { preloadedState: state }
      );

      // 非猜牌者不應看到揭曉的牌
      const revealedCards = container.querySelectorAll('.hidden-card.revealed');
      expect(revealedCards.length).toBe(0);
    });
  });

  describe('蓋牌顏色', () => {
    test('揭曉時應顯示正確的顏色類別', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        hiddenCards: [
          { id: 'h1', color: 'red' },
          { id: 'h2', color: 'green' }
        ],
        players: [{ id: 'p1', name: '玩家1' }]
      };
      const { container } = renderWithProviders(<GameBoard />, { preloadedState: state });

      expect(container.querySelector('.card-red')).toBeInTheDocument();
      expect(container.querySelector('.card-green')).toBeInTheDocument();
    });

    test('揭曉時應顯示顏色文字', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        hiddenCards: [
          { id: 'h1', color: 'red' },
          { id: 'h2', color: 'blue' }
        ],
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });

      expect(screen.getByText('red')).toBeInTheDocument();
      expect(screen.getByText('blue')).toBeInTheDocument();
    });
  });

  describe('樣式', () => {
    test('應包含 game-board 容器類別', () => {
      const { container } = renderWithProviders(<GameBoard />);
      expect(container.querySelector('.game-board')).toBeInTheDocument();
    });

    test('應包含 hidden-cards-section 類別', () => {
      const { container } = renderWithProviders(<GameBoard />);
      expect(container.querySelector('.hidden-cards-section')).toBeInTheDocument();
    });

    test('應包含 game-status-section 類別', () => {
      const { container } = renderWithProviders(<GameBoard />);
      expect(container.querySelector('.game-status-section')).toBeInTheDocument();
    });
  });

  describe('顏色組合牌 - 工作單 0073', () => {
    test('等待階段不應顯示顏色組合牌', () => {
      const state = {
        ...initialState,
        gamePhase: 'waiting',
        players: []
      };
      const { container } = renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(container.querySelector('.color-cards-section')).not.toBeInTheDocument();
    });

    test('遊戲進行中應顯示顏色組合牌區塊', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        players: [{ id: 'p1', name: '玩家1' }]
      };
      const { container } = renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(container.querySelector('.color-cards-section')).toBeInTheDocument();
    });

    test('應顯示六張顏色組合牌', () => {
      const state = {
        ...initialState,
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        players: [{ id: 'p1', name: '玩家1' }]
      };
      renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(screen.getByText('顏色組合牌')).toBeInTheDocument();
      expect(screen.getByText('紅綠')).toBeInTheDocument();
      expect(screen.getByText('綠藍')).toBeInTheDocument();
      expect(screen.getByText('綠黃')).toBeInTheDocument();
      expect(screen.getByText('紅藍')).toBeInTheDocument();
      expect(screen.getByText('黃紅')).toBeInTheDocument();
      expect(screen.getByText('黃藍')).toBeInTheDocument();
    });

    test('遊戲結束時仍應顯示顏色組合牌', () => {
      const state = {
        ...initialState,
        gamePhase: 'finished',
        winner: 'p1',
        players: [{ id: 'p1', name: '玩家1' }]
      };
      const { container } = renderWithProviders(<GameBoard />, { preloadedState: state });
      expect(container.querySelector('.color-cards-section')).toBeInTheDocument();
    });
  });
});
