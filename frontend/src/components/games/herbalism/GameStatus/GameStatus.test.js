/**
 * GameStatus 組件單元測試
 * 工作單 0022
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import GameStatus, { GameStatusContainer } from './GameStatus';
import { gameReducer } from '../../../../store/gameStore';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS
} from '../../../../shared/constants';

describe('GameStatus - 工作單 0022', () => {
  const mockPlayers = [
    { id: 'p1', name: '玩家1', isActive: true },
    { id: 'p2', name: '玩家2', isActive: true },
    { id: 'p3', name: '玩家3', isActive: false }
  ];

  describe('渲染', () => {
    test('應顯示遊戲狀態標題', () => {
      render(<GameStatus players={mockPlayers} />);
      expect(screen.getByText('遊戲狀態')).toBeInTheDocument();
    });

    test('應顯示玩家狀態標題', () => {
      render(<GameStatus players={mockPlayers} />);
      expect(screen.getByText('玩家狀態')).toBeInTheDocument();
    });

    test('無玩家時應顯示提示', () => {
      render(<GameStatus players={[]} />);
      expect(screen.getByText('尚無玩家')).toBeInTheDocument();
    });
  });

  describe('遊戲階段顯示', () => {
    test('等待中階段應顯示「等待中」', () => {
      render(<GameStatus gamePhase={GAME_PHASE_WAITING} players={mockPlayers} />);
      expect(screen.getByText('等待中')).toBeInTheDocument();
    });

    test('進行中階段應顯示「進行中」', () => {
      render(<GameStatus gamePhase={GAME_PHASE_PLAYING} players={mockPlayers} />);
      expect(screen.getByText('進行中')).toBeInTheDocument();
    });

    test('已結束階段應顯示「已結束」', () => {
      render(<GameStatus gamePhase={GAME_PHASE_FINISHED} players={mockPlayers} />);
      expect(screen.getByText('已結束')).toBeInTheDocument();
    });

    test('有獲勝者時應顯示獲勝者名稱', () => {
      render(
        <GameStatus
          gamePhase={GAME_PHASE_FINISHED}
          winner="p1"
          players={mockPlayers}
        />
      );
      expect(screen.getByText(/獲勝者/)).toBeInTheDocument();
      expect(screen.getAllByText('玩家1').length).toBeGreaterThan(0);
    });

    test('無獲勝者時應顯示對應訊息', () => {
      render(
        <GameStatus
          gamePhase={GAME_PHASE_FINISHED}
          winner={null}
          players={mockPlayers}
        />
      );
      expect(screen.getByText('遊戲結束，沒有獲勝者')).toBeInTheDocument();
    });
  });

  describe('當前玩家顯示', () => {
    test('進行中階段應顯示當前玩家', () => {
      render(
        <GameStatus
          gamePhase={GAME_PHASE_PLAYING}
          players={mockPlayers}
          currentPlayerIndex={0}
        />
      );
      expect(screen.getByText('當前回合')).toBeInTheDocument();
    });

    test('是自己的回合時應顯示「你的回合」', () => {
      render(
        <GameStatus
          gamePhase={GAME_PHASE_PLAYING}
          players={mockPlayers}
          currentPlayerIndex={0}
          myPlayerId="p1"
        />
      );
      expect(screen.getByText('你的回合')).toBeInTheDocument();
    });

    test('不是自己的回合時不應顯示「你的回合」', () => {
      render(
        <GameStatus
          gamePhase={GAME_PHASE_PLAYING}
          players={mockPlayers}
          currentPlayerIndex={1}
          myPlayerId="p1"
        />
      );
      expect(screen.queryByText('你的回合')).not.toBeInTheDocument();
    });
  });

  describe('玩家狀態列表', () => {
    test('應顯示所有玩家', () => {
      render(<GameStatus players={mockPlayers} />);
      expect(screen.getByText('玩家1')).toBeInTheDocument();
      expect(screen.getByText('玩家2')).toBeInTheDocument();
      expect(screen.getByText('玩家3')).toBeInTheDocument();
    });

    test('活躍玩家應顯示「活躍」', () => {
      render(<GameStatus players={mockPlayers} />);
      const activeStatuses = screen.getAllByText('活躍');
      expect(activeStatuses.length).toBe(2);
    });

    test('已退出玩家應顯示「已退出」', () => {
      render(<GameStatus players={mockPlayers} />);
      expect(screen.getByText('已退出')).toBeInTheDocument();
    });

    test('自己的玩家應顯示「(我)」', () => {
      render(<GameStatus players={mockPlayers} myPlayerId="p1" />);
      expect(screen.getByText('(我)')).toBeInTheDocument();
    });

    test('已退出玩家應有 eliminated 樣式', () => {
      const { container } = render(<GameStatus players={mockPlayers} />);
      expect(container.querySelector('.player-item.eliminated')).toBeInTheDocument();
    });
  });

  describe('遊戲歷史記錄', () => {
    const mockHistory = [
      {
        type: ACTION_TYPE_QUESTION,
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'blue'],
        result: { cardsReceived: ['c1', 'c2'] },
        timestamp: 1000
      },
      {
        type: ACTION_TYPE_GUESS,
        playerId: 'p2',
        guessedColors: ['red', 'blue'],
        isCorrect: false,
        timestamp: 2000
      }
    ];

    test('有歷史記錄時應顯示記錄', () => {
      render(
        <GameStatus
          players={mockPlayers}
          gameHistory={mockHistory}
          showHistory={true}
        />
      );
      expect(screen.getByText('遊戲記錄 (2)')).toBeInTheDocument();
    });

    test('無歷史記錄時應顯示提示', () => {
      render(
        <GameStatus
          players={mockPlayers}
          gameHistory={[]}
          showHistory={true}
        />
      );
      expect(screen.getByText('尚無記錄')).toBeInTheDocument();
    });

    test('showHistory 為 false 時不應顯示歷史', () => {
      render(
        <GameStatus
          players={mockPlayers}
          gameHistory={mockHistory}
          showHistory={false}
        />
      );
      expect(screen.queryByText('遊戲記錄')).not.toBeInTheDocument();
    });

    test('問牌記錄應顯示問牌圖示', () => {
      render(
        <GameStatus
          players={mockPlayers}
          gameHistory={mockHistory}
          showHistory={true}
        />
      );
      expect(screen.getByText('❓')).toBeInTheDocument();
    });

    test('猜牌記錄應顯示猜牌圖示', () => {
      render(
        <GameStatus
          players={mockPlayers}
          gameHistory={mockHistory}
          showHistory={true}
        />
      );
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });
  });

  describe('樣式', () => {
    test('應包含 game-status 容器類別', () => {
      const { container } = render(<GameStatus players={mockPlayers} />);
      expect(container.querySelector('.game-status')).toBeInTheDocument();
    });

    test('應包含 game-phase-display 類別', () => {
      const { container } = render(<GameStatus players={mockPlayers} />);
      expect(container.querySelector('.game-phase-display')).toBeInTheDocument();
    });

    test('應包含 player-status-list 類別', () => {
      const { container } = render(<GameStatus players={mockPlayers} />);
      expect(container.querySelector('.player-status-list')).toBeInTheDocument();
    });
  });
});

describe('GameStatusContainer - 工作單 0022', () => {
  // 測試用 wrapper
  const renderWithProviders = (component, initialState = {}) => {
    const defaultState = {
      gameId: 'test_game_123',
      players: [
        { id: 'p1', name: '玩家1', isActive: true },
        { id: 'p2', name: '玩家2', isActive: true }
      ],
      currentPlayerIndex: 0,
      currentPlayerId: 'p1',
      gamePhase: GAME_PHASE_PLAYING,
      winner: null,
      gameHistory: [],
      ...initialState
    };
    const store = createStore(gameReducer, defaultState);
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  describe('Redux 整合', () => {
    test('應從 Redux store 取得遊戲狀態', () => {
      renderWithProviders(<GameStatusContainer />);
      expect(screen.getAllByText('玩家1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('玩家2').length).toBeGreaterThan(0);
    });

    test('應從 Redux store 取得遊戲階段', () => {
      renderWithProviders(<GameStatusContainer />);
      expect(screen.getByText('進行中')).toBeInTheDocument();
    });

    test('應正確顯示自己的玩家', () => {
      renderWithProviders(<GameStatusContainer />);
      expect(screen.getByText('(我)')).toBeInTheDocument();
    });
  });
});
