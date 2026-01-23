/**
 * QuestionCard 組件單元測試
 * 工作單 0019
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionCard from './QuestionCard';

describe('QuestionCard - 工作單 0019', () => {
  const mockPlayers = [
    { id: 'p1', name: '玩家1' },
    { id: 'p2', name: '玩家2' },
    { id: 'p3', name: '玩家3' }
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
