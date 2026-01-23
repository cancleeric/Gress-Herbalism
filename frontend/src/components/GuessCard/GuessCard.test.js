/**
 * GuessCard 組件單元測試
 * 工作單 0021
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import GuessCard, { GuessCardContainer } from './GuessCard';
import { gameReducer } from '../../store/gameStore';
import * as gameService from '../../services/gameService';

// Mock gameService
jest.mock('../../services/gameService');

describe('GuessCard - 工作單 0021', () => {
  describe('渲染', () => {
    test('應顯示猜牌標題', () => {
      render(<GuessCard isOpen={true} />);
      expect(screen.getByText('猜牌')).toBeInTheDocument();
    });

    test('應顯示警告訊息', () => {
      render(<GuessCard isOpen={true} />);
      expect(screen.getByText(/猜錯會退出遊戲/)).toBeInTheDocument();
    });

    test('應顯示顏色選擇區域', () => {
      render(<GuessCard isOpen={true} />);
      expect(screen.getByText(/選擇兩個顏色/)).toBeInTheDocument();
    });

    test('應顯示確認和取消按鈕', () => {
      render(<GuessCard isOpen={true} />);
      expect(screen.getByText('確認猜牌')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    test('isOpen 為 false 時不應渲染', () => {
      const { container } = render(<GuessCard isOpen={false} />);
      expect(container.querySelector('.guess-card')).not.toBeInTheDocument();
    });
  });

  describe('顏色選擇器', () => {
    test('應顯示四種顏色選項', () => {
      render(<GuessCard isOpen={true} />);
      expect(screen.getByLabelText('選擇 red')).toBeInTheDocument();
      expect(screen.getByLabelText('選擇 yellow')).toBeInTheDocument();
      expect(screen.getByLabelText('選擇 green')).toBeInTheDocument();
      expect(screen.getByLabelText('選擇 blue')).toBeInTheDocument();
    });

    test('點擊顏色應選擇該顏色', () => {
      render(<GuessCard isOpen={true} />);
      fireEvent.click(screen.getByLabelText('選擇 red'));
      expect(screen.getByLabelText('移除 red')).toBeInTheDocument();
    });

    test('應可以選擇兩個相同顏色', () => {
      render(<GuessCard isOpen={true} />);
      fireEvent.click(screen.getByLabelText('選擇 red'));
      fireEvent.click(screen.getByLabelText('選擇 red'));
      expect(screen.getAllByLabelText('移除 red').length).toBe(2);
    });

    test('選擇兩個後不應再選擇', () => {
      render(<GuessCard isOpen={true} />);
      fireEvent.click(screen.getByLabelText('選擇 red'));
      fireEvent.click(screen.getByLabelText('選擇 blue'));

      // 嘗試選擇第三個
      const greenButton = screen.getByLabelText('選擇 green');
      expect(greenButton).toBeDisabled();
    });

    test('點擊已選顏色標籤應移除該顏色', () => {
      render(<GuessCard isOpen={true} />);
      fireEvent.click(screen.getByLabelText('選擇 red'));
      expect(screen.getByLabelText('移除 red')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('移除 red'));
      expect(screen.queryByLabelText('移除 red')).not.toBeInTheDocument();
    });
  });

  describe('表單驗證', () => {
    test('未選擇兩個顏色時確認按鈕應禁用', () => {
      render(<GuessCard isOpen={true} />);
      expect(screen.getByText('確認猜牌')).toBeDisabled();
    });

    test('只選擇一個顏色時確認按鈕應禁用', () => {
      render(<GuessCard isOpen={true} />);
      fireEvent.click(screen.getByLabelText('選擇 red'));
      expect(screen.getByText('確認猜牌')).toBeDisabled();
    });

    test('選擇兩個顏色後確認按鈕應啟用', () => {
      render(<GuessCard isOpen={true} />);
      fireEvent.click(screen.getByLabelText('選擇 red'));
      fireEvent.click(screen.getByLabelText('選擇 blue'));
      expect(screen.getByText('確認猜牌')).not.toBeDisabled();
    });
  });

  describe('提交和取消', () => {
    test('點擊確認應調用 onSubmit', () => {
      const onSubmit = jest.fn();
      render(<GuessCard isOpen={true} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByLabelText('選擇 red'));
      fireEvent.click(screen.getByLabelText('選擇 blue'));
      fireEvent.click(screen.getByText('確認猜牌'));

      expect(onSubmit).toHaveBeenCalledWith({
        guessedColors: ['red', 'blue']
      });
    });

    test('點擊取消應調用 onCancel', () => {
      const onCancel = jest.fn();
      render(<GuessCard isOpen={true} onCancel={onCancel} />);

      fireEvent.click(screen.getByText('取消'));
      expect(onCancel).toHaveBeenCalled();
    });

    test('提交後應重置表單', () => {
      render(<GuessCard isOpen={true} onSubmit={() => {}} />);

      fireEvent.click(screen.getByLabelText('選擇 red'));
      fireEvent.click(screen.getByLabelText('選擇 blue'));
      fireEvent.click(screen.getByText('確認猜牌'));

      expect(screen.queryByLabelText('移除 red')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('移除 blue')).not.toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    test('載入中時應顯示載入指示器', () => {
      const { container } = render(<GuessCard isOpen={true} isLoading={true} />);
      expect(container.querySelector('.loading-overlay')).toBeInTheDocument();
      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    test('載入中時按鈕應禁用', () => {
      render(<GuessCard isOpen={true} isLoading={true} />);
      expect(screen.getByText('取消')).toBeDisabled();
    });
  });

  describe('猜牌結果顯示', () => {
    test('猜對時應顯示成功訊息', () => {
      const result = {
        success: true,
        isCorrect: true,
        message: '恭喜猜對了！你獲勝了！',
        revealedCards: [
          { id: 'c1', color: 'red' },
          { id: 'c2', color: 'blue' }
        ],
        gameState: { gamePhase: 'finished', winner: 'p1' }
      };

      render(<GuessCard isOpen={true} guessResult={result} onResultClose={() => {}} />);
      expect(screen.getByText('🎉 恭喜猜對了！')).toBeInTheDocument();
    });

    test('猜對時應顯示正確答案', () => {
      const result = {
        success: true,
        isCorrect: true,
        message: '恭喜猜對了！',
        revealedCards: [
          { id: 'c1', color: 'red' },
          { id: 'c2', color: 'blue' }
        ],
        gameState: { gamePhase: 'finished', winner: 'p1' }
      };

      const { container } = render(
        <GuessCard isOpen={true} guessResult={result} onResultClose={() => {}} />
      );
      expect(container.querySelector('.answer-card.color-red')).toBeInTheDocument();
      expect(container.querySelector('.answer-card.color-blue')).toBeInTheDocument();
    });

    test('猜錯時應顯示失敗訊息', () => {
      const result = {
        success: true,
        isCorrect: false,
        message: '猜錯了！你已退出遊戲。',
        gameState: { gamePhase: 'playing', winner: null }
      };

      render(<GuessCard isOpen={true} guessResult={result} onResultClose={() => {}} />);
      expect(screen.getByText('😢 猜錯了')).toBeInTheDocument();
    });

    test('猜錯且遊戲結束無獲勝者時應顯示對應訊息', () => {
      const result = {
        success: true,
        isCorrect: false,
        message: '猜錯了！遊戲結束，沒有獲勝者。',
        gameState: { gamePhase: 'finished', winner: null }
      };

      render(<GuessCard isOpen={true} guessResult={result} onResultClose={() => {}} />);
      expect(screen.getByText('遊戲結束，沒有獲勝者')).toBeInTheDocument();
    });
  });

  describe('查看答案功能', () => {
    test('canViewAnswer 為 true 時應顯示查看答案按鈕', () => {
      const hiddenCards = [
        { id: 'c1', color: 'red' },
        { id: 'c2', color: 'blue' }
      ];

      render(
        <GuessCard
          isOpen={true}
          canViewAnswer={true}
          hiddenCards={hiddenCards}
        />
      );
      expect(screen.getByText('查看答案')).toBeInTheDocument();
    });

    test('點擊查看答案應顯示蓋牌顏色', () => {
      const hiddenCards = [
        { id: 'c1', color: 'red' },
        { id: 'c2', color: 'blue' }
      ];

      const { container } = render(
        <GuessCard
          isOpen={true}
          canViewAnswer={true}
          hiddenCards={hiddenCards}
        />
      );

      fireEvent.click(screen.getByText('查看答案'));
      expect(container.querySelector('.hidden-card-reveal.color-red')).toBeInTheDocument();
      expect(container.querySelector('.hidden-card-reveal.color-blue')).toBeInTheDocument();
    });

    test('再次點擊應隱藏答案', () => {
      const hiddenCards = [
        { id: 'c1', color: 'red' },
        { id: 'c2', color: 'blue' }
      ];

      const { container } = render(
        <GuessCard
          isOpen={true}
          canViewAnswer={true}
          hiddenCards={hiddenCards}
        />
      );

      fireEvent.click(screen.getByText('查看答案'));
      expect(screen.getByText('隱藏答案')).toBeInTheDocument();

      fireEvent.click(screen.getByText('隱藏答案'));
      expect(container.querySelector('.hidden-card-reveal.face-down')).toBeInTheDocument();
    });
  });

  describe('樣式', () => {
    test('應包含 guess-card 容器類別', () => {
      const { container } = render(<GuessCard isOpen={true} />);
      expect(container.querySelector('.guess-card')).toBeInTheDocument();
    });

    test('應包含 guess-card-header 類別', () => {
      const { container } = render(<GuessCard isOpen={true} />);
      expect(container.querySelector('.guess-card-header')).toBeInTheDocument();
    });

    test('應包含 guess-card-body 類別', () => {
      const { container } = render(<GuessCard isOpen={true} />);
      expect(container.querySelector('.guess-card-body')).toBeInTheDocument();
    });

    test('應包含 guess-card-footer 類別', () => {
      const { container } = render(<GuessCard isOpen={true} />);
      expect(container.querySelector('.guess-card-footer')).toBeInTheDocument();
    });

    test('應包含 warning-message 類別', () => {
      const { container } = render(<GuessCard isOpen={true} />);
      expect(container.querySelector('.warning-message')).toBeInTheDocument();
    });
  });
});

describe('GuessCardContainer - 工作單 0021', () => {
  // 測試用 wrapper
  const renderWithProviders = (component, initialState = {}) => {
    const defaultState = {
      gameId: 'test_game_123',
      players: [
        { id: 'p1', name: '玩家1', isActive: true, isCurrentTurn: true },
        { id: 'p2', name: '玩家2', isActive: true, isCurrentTurn: false }
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
    gameService.revealHiddenCards.mockReturnValue({
      success: true,
      cards: [
        { id: 'c1', color: 'red' },
        { id: 'c2', color: 'blue' }
      ]
    });
  });

  describe('Redux 整合', () => {
    test('應調用 revealHiddenCards 取得蓋牌', () => {
      renderWithProviders(<GuessCardContainer isOpen={true} />);
      expect(gameService.revealHiddenCards).toHaveBeenCalledWith('test_game_123', 'p1');
    });
  });

  describe('gameService 整合', () => {
    test('提交時應調用 processGuessAction', () => {
      gameService.processGuessAction.mockReturnValue({
        success: true,
        isCorrect: true,
        message: '恭喜猜對了！',
        revealedCards: [],
        gameState: {
          players: [],
          currentPlayerIndex: 0,
          gamePhase: 'finished',
          winner: 'p1',
          hiddenCards: [],
          gameHistory: []
        }
      });

      renderWithProviders(<GuessCardContainer isOpen={true} />);

      // 選擇顏色並提交
      fireEvent.click(screen.getByLabelText('選擇 red'));
      fireEvent.click(screen.getByLabelText('選擇 blue'));
      fireEvent.click(screen.getByText('確認猜牌'));

      expect(gameService.processGuessAction).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          playerId: 'p1',
          guessedColors: ['red', 'blue']
        })
      );
    });
  });

  describe('取消功能', () => {
    test('點擊取消應調用 onClose', () => {
      const onClose = jest.fn();
      renderWithProviders(<GuessCardContainer isOpen={true} onClose={onClose} />);

      fireEvent.click(screen.getByText('取消'));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
