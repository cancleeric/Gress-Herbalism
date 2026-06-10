/**
 * QuestionCard 組件單元測試
 * 工作單 0019, 0020
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import QuestionCard, { QuestionCardContainer } from './QuestionCard';
import { gameReducer } from '../../../../store/gameStore';
import * as gameService from '../../../../services/gameService';

// Mock gameService
jest.mock('../../../../services/gameService');

describe('QuestionCard - 工作單 0019', () => {
  const mockPlayers = [
    { id: 'p1', name: '玩家1', hand: [] },
    { id: 'p2', name: '玩家2', hand: [] },
    { id: 'p3', name: '玩家3', hand: [] }
  ];

  describe('渲染', () => {
    test('應顯示問牌標題', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('問牌')).toBeInTheDocument();
    });

    test('應顯示顏色選擇區域', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText(/選擇顏色/)).toBeInTheDocument();
    });

    test('應顯示目標玩家選擇區域', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('選擇目標玩家')).toBeInTheDocument();
    });

    test('應顯示要牌方式選擇區域', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('選擇要牌方式')).toBeInTheDocument();
    });

    test('應顯示確認和取消按鈕', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('確認問牌')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    test('isOpen 為 false 時不應渲染', () => {
      const { container } = render(
        <QuestionCard players={mockPlayers} currentPlayerId="p1" isOpen={false} />
      );
      expect(container.querySelector('.question-card')).not.toBeInTheDocument();
    });
  });

  describe('顏色選擇器', () => {
    test('應顯示四種顏色選項', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('red')).toBeInTheDocument();
      expect(screen.getByText('yellow')).toBeInTheDocument();
      expect(screen.getByText('green')).toBeInTheDocument();
      expect(screen.getByText('blue')).toBeInTheDocument();
    });

    test('點擊顏色應選擇該顏色', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);

      fireEvent.click(screen.getByText('red'));
      expect(container.querySelector('.color-option.color-red.selected')).toBeInTheDocument();
    });

    test('應可以選擇兩個顏色', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);

      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));

      expect(container.querySelectorAll('.color-option.selected').length).toBe(2);
    });

    test('超過兩個顏色時不應再選擇', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);

      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));
      fireEvent.click(screen.getByText('green'));

      expect(container.querySelectorAll('.color-option.selected').length).toBe(2);
    });

    test('再次點擊已選顏色應取消選擇', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);

      fireEvent.click(screen.getByText('red'));
      expect(container.querySelector('.color-option.color-red.selected')).toBeInTheDocument();

      fireEvent.click(screen.getByText('red'));
      expect(container.querySelector('.color-option.color-red.selected')).not.toBeInTheDocument();
    });
  });

  describe('目標玩家選擇器', () => {
    test('應顯示其他玩家（排除自己）', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('玩家2')).toBeInTheDocument();
      expect(screen.getByText('玩家3')).toBeInTheDocument();
    });

    test('不應顯示當前玩家', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      // 玩家1 作為當前玩家不應在選擇列表中
      const playerButtons = screen.getAllByRole('button').filter(btn =>
        btn.classList.contains('player-option')
      );
      expect(playerButtons.length).toBe(2);
    });

    test('點擊玩家應選擇該玩家', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);

      fireEvent.click(screen.getByText('玩家2'));
      expect(container.querySelector('.player-option.selected')).toBeInTheDocument();
    });
  });

  describe('要牌方式選擇器', () => {
    test('應顯示三種要牌方式', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('方式 1')).toBeInTheDocument();
      expect(screen.getByText('方式 2')).toBeInTheDocument();
      expect(screen.getByText('方式 3')).toBeInTheDocument();
    });

    test('應顯示要牌方式描述', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('兩個顏色各一張')).toBeInTheDocument();
      expect(screen.getByText('其中一種顏色全部')).toBeInTheDocument();
      expect(screen.getByText('給其中一種顏色一張，要另一種顏色全部')).toBeInTheDocument();
    });

    test('點擊要牌方式應選擇該方式', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);

      fireEvent.click(screen.getByText('兩個顏色各一張'));
      expect(container.querySelector('.type-option.selected')).toBeInTheDocument();
    });
  });

  describe('表單驗證', () => {
    test('未完成選擇時確認按鈕應禁用', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(screen.getByText('確認問牌')).toBeDisabled();
    });

    test('完成所有選擇後確認按鈕應啟用', () => {
      render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);

      // 選擇兩個顏色
      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));

      // 選擇目標玩家
      fireEvent.click(screen.getByText('玩家2'));

      // 選擇要牌方式
      fireEvent.click(screen.getByText('兩個顏色各一張'));

      expect(screen.getByText('確認問牌')).not.toBeDisabled();
    });
  });

  describe('提交和取消', () => {
    test('點擊確認應調用 onSubmit', () => {
      const onSubmit = jest.fn();
      render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          onSubmit={onSubmit}
        />
      );

      // 完成所有選擇
      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));
      fireEvent.click(screen.getByText('玩家2'));
      fireEvent.click(screen.getByText('兩個顏色各一張'));

      // 點擊確認
      fireEvent.click(screen.getByText('確認問牌'));

      expect(onSubmit).toHaveBeenCalledWith({
        colors: ['red', 'blue'],
        targetPlayerId: 'p2',
        questionType: 1
      });
    });

    test('點擊取消應調用 onCancel', () => {
      const onCancel = jest.fn();
      render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByText('取消'));
      expect(onCancel).toHaveBeenCalled();
    });

    test('提交後應重置表單', () => {
      const { container } = render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          onSubmit={() => {}}
        />
      );

      // 完成所有選擇
      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));
      fireEvent.click(screen.getByText('玩家2'));
      fireEvent.click(screen.getByText('兩個顏色各一張'));

      // 點擊確認
      fireEvent.click(screen.getByText('確認問牌'));

      // 確認表單已重置
      expect(container.querySelectorAll('.color-option.selected').length).toBe(0);
      expect(container.querySelector('.player-option.selected')).not.toBeInTheDocument();
      expect(container.querySelector('.type-option.selected')).not.toBeInTheDocument();
    });
  });

  describe('樣式', () => {
    test('應包含 question-card 容器類別', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(container.querySelector('.question-card')).toBeInTheDocument();
    });

    test('應包含 question-card-header 類別', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(container.querySelector('.question-card-header')).toBeInTheDocument();
    });

    test('應包含 question-card-body 類別', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(container.querySelector('.question-card-body')).toBeInTheDocument();
    });

    test('應包含 question-card-footer 類別', () => {
      const { container } = render(<QuestionCard players={mockPlayers} currentPlayerId="p1" />);
      expect(container.querySelector('.question-card-footer')).toBeInTheDocument();
    });
  });
});

describe('QuestionCard - 工作單 0020', () => {
  const mockPlayers = [
    { id: 'p1', name: '玩家1', hand: [{ id: 'red-1', color: 'red' }] },
    { id: 'p2', name: '玩家2', hand: [{ id: 'blue-1', color: 'blue' }] },
    { id: 'p3', name: '玩家3', hand: [] }
  ];

  describe('載入狀態', () => {
    test('載入中時應顯示載入指示器', () => {
      const { container } = render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          isLoading={true}
        />
      );
      expect(container.querySelector('.loading-overlay')).toBeInTheDocument();
      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    test('載入中時確認按鈕應禁用', () => {
      render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          isLoading={true}
        />
      );
      const submitButton = screen.getByRole('button', { name: /處理中/i });
      expect(submitButton).toBeDisabled();
    });

    test('載入中時取消按鈕應禁用', () => {
      render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          isLoading={true}
        />
      );
      expect(screen.getByText('取消')).toBeDisabled();
    });
  });

  describe('問牌結果顯示', () => {
    test('成功時應顯示成功訊息', () => {
      const result = {
        success: true,
        message: '收到 2 張牌',
        result: {
          cardsReceived: [
            { id: 'red-1', color: 'red' },
            { id: 'blue-1', color: 'blue' }
          ]
        }
      };

      render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          questionResult={result}
          onResultClose={() => {}}
        />
      );

      expect(screen.getByText('問牌成功')).toBeInTheDocument();
      expect(screen.getByText('收到 2 張牌')).toBeInTheDocument();
    });

    test('成功時應顯示收到的牌', () => {
      const result = {
        success: true,
        message: '收到 2 張牌',
        result: {
          cardsReceived: [
            { id: 'red-1', color: 'red' },
            { id: 'blue-1', color: 'blue' }
          ]
        }
      };

      const { container } = render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          questionResult={result}
          onResultClose={() => {}}
        />
      );

      expect(container.querySelector('.result-card.card-red')).toBeInTheDocument();
      expect(container.querySelector('.result-card.card-blue')).toBeInTheDocument();
    });

    test('失敗時應顯示失敗訊息', () => {
      const result = {
        success: false,
        message: '不是你的回合'
      };

      render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          questionResult={result}
          onResultClose={() => {}}
        />
      );

      expect(screen.getByText('問牌失敗')).toBeInTheDocument();
      expect(screen.getByText('不是你的回合')).toBeInTheDocument();
    });

    test('沒有收到牌時應顯示提示', () => {
      const result = {
        success: true,
        message: '目標玩家沒有該顏色的牌',
        result: {
          cardsReceived: []
        }
      };

      const { container } = render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          questionResult={result}
          onResultClose={() => {}}
        />
      );

      expect(container.querySelector('.result-no-cards')).toBeInTheDocument();
    });

    test('點擊確定應關閉結果', () => {
      const onResultClose = jest.fn();
      const result = {
        success: true,
        message: '收到牌',
        result: { cardsReceived: [] }
      };

      render(
        <QuestionCard
          players={mockPlayers}
          currentPlayerId="p1"
          questionResult={result}
          onResultClose={onResultClose}
        />
      );

      fireEvent.click(screen.getByText('確定'));
      expect(onResultClose).toHaveBeenCalled();
    });
  });

  describe('表單驗證（使用 gameRules）', () => {
    test('類型3 時玩家沒有牌應顯示錯誤', () => {
      const playersNoHand = [
        { id: 'p1', name: '玩家1', hand: [] },
        { id: 'p2', name: '玩家2', hand: [{ id: 'blue-1', color: 'blue' }] }
      ];

      render(
        <QuestionCard
          players={playersNoHand}
          currentPlayerId="p1"
          currentPlayerHand={[]}
        />
      );

      // 選擇所有選項
      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));
      fireEvent.click(screen.getByText('玩家2'));
      fireEvent.click(screen.getByText('給其中一種顏色一張，要另一種顏色全部'));

      // 點擊確認
      fireEvent.click(screen.getByText('確認問牌'));

      // 應顯示錯誤
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

describe('QuestionCardContainer - 工作單 0020', () => {
  // 測試用 wrapper
  const renderWithProviders = (component, initialState = {}) => {
    const defaultState = {
      gameId: 'test_game_123',
      players: [
        { id: 'p1', name: '玩家1', hand: [{ id: 'red-1', color: 'red' }], isActive: true, isCurrentTurn: true },
        { id: 'p2', name: '玩家2', hand: [{ id: 'blue-1', color: 'blue' }], isActive: true, isCurrentTurn: false }
      ],
      currentPlayerIndex: 0,
      currentPlayerId: 'p1',
      ...initialState
    };
    const store = createStore(gameReducer, defaultState);
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Redux 整合', () => {
    test('應從 Redux store 取得玩家資料', () => {
      renderWithProviders(<QuestionCardContainer isOpen={true} />);
      expect(screen.getByText('玩家2')).toBeInTheDocument();
    });

    test('應正確排除當前玩家', () => {
      renderWithProviders(<QuestionCardContainer isOpen={true} />);
      const playerButtons = screen.getAllByRole('button').filter(btn =>
        btn.classList.contains('player-option')
      );
      expect(playerButtons.length).toBe(1); // 只顯示 p2
    });
  });

  describe('gameService 整合', () => {
    test('提交時應調用 processQuestionAction', () => {
      gameService.processQuestionAction.mockReturnValue({
        success: true,
        message: '收到牌',
        result: { cardsReceived: [] },
        gameState: {
          players: [],
          currentPlayerIndex: 1,
          gameHistory: []
        }
      });

      renderWithProviders(<QuestionCardContainer isOpen={true} />);

      // 完成所有選擇
      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));
      fireEvent.click(screen.getByText('玩家2'));
      fireEvent.click(screen.getByText('兩個顏色各一張'));

      // 提交
      fireEvent.click(screen.getByText('確認問牌'));

      expect(gameService.processQuestionAction).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          playerId: 'p1',
          targetPlayerId: 'p2',
          colors: ['red', 'blue'],
          questionType: 1
        })
      );
    });

    test('成功後應顯示結果', async () => {
      gameService.processQuestionAction.mockReturnValue({
        success: true,
        message: '收到 1 張牌',
        result: {
          cardsReceived: [{ id: 'blue-1', color: 'blue' }]
        },
        gameState: {
          players: [],
          currentPlayerIndex: 1,
          gameHistory: []
        }
      });

      renderWithProviders(<QuestionCardContainer isOpen={true} />);

      // 完成所有選擇並提交
      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));
      fireEvent.click(screen.getByText('玩家2'));
      fireEvent.click(screen.getByText('兩個顏色各一張'));
      fireEvent.click(screen.getByText('確認問牌'));

      expect(screen.getByText('問牌成功')).toBeInTheDocument();
    });
  });

  describe('取消功能', () => {
    test('點擊取消應調用 onClose', () => {
      const onClose = jest.fn();
      renderWithProviders(<QuestionCardContainer isOpen={true} onClose={onClose} />);

      fireEvent.click(screen.getByText('取消'));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
