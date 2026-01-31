/**
 * PlayerHand 組件單元測試
 * 工作單 0018
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerHand from './PlayerHand';

describe('PlayerHand - 工作單 0018', () => {
  const mockCards = [
    { id: 'card-1', color: 'red' },
    { id: 'card-2', color: 'blue' },
    { id: 'card-3', color: 'yellow' },
    { id: 'card-4', color: 'green' }
  ];

  describe('渲染', () => {
    test('應顯示標題', () => {
      render(<PlayerHand cards={mockCards} />);
      expect(screen.getByText('我的手牌')).toBeInTheDocument();
    });

    test('應可自訂標題', () => {
      render(<PlayerHand cards={mockCards} title="對手手牌" />);
      expect(screen.getByText('對手手牌')).toBeInTheDocument();
    });

    test('應顯示手牌數量', () => {
      render(<PlayerHand cards={mockCards} />);
      expect(screen.getByText('4 張牌')).toBeInTheDocument();
    });

    test('應顯示所有手牌', () => {
      const { container } = render(<PlayerHand cards={mockCards} />);
      const cards = container.querySelectorAll('.hand-card');
      expect(cards.length).toBe(4);
    });

    test('無手牌時應顯示提示訊息', () => {
      render(<PlayerHand cards={[]} />);
      expect(screen.getByText('目前沒有手牌')).toBeInTheDocument();
    });
  });

  describe('卡牌顏色', () => {
    test('應顯示紅色卡牌', () => {
      const { container } = render(<PlayerHand cards={[{ id: '1', color: 'red' }]} />);
      expect(container.querySelector('.card-red')).toBeInTheDocument();
    });

    test('應顯示藍色卡牌', () => {
      const { container } = render(<PlayerHand cards={[{ id: '1', color: 'blue' }]} />);
      expect(container.querySelector('.card-blue')).toBeInTheDocument();
    });

    test('應顯示黃色卡牌', () => {
      const { container } = render(<PlayerHand cards={[{ id: '1', color: 'yellow' }]} />);
      expect(container.querySelector('.card-yellow')).toBeInTheDocument();
    });

    test('應顯示綠色卡牌', () => {
      const { container } = render(<PlayerHand cards={[{ id: '1', color: 'green' }]} />);
      expect(container.querySelector('.card-green')).toBeInTheDocument();
    });

    test('應顯示顏色文字', () => {
      render(<PlayerHand cards={[{ id: '1', color: 'red' }]} />);
      expect(screen.getByText('red')).toBeInTheDocument();
    });
  });

  describe('顏色統計', () => {
    test('應顯示各顏色數量', () => {
      const cards = [
        { id: '1', color: 'red' },
        { id: '2', color: 'red' },
        { id: '3', color: 'blue' }
      ];
      render(<PlayerHand cards={cards} />);
      expect(screen.getByText('red: 2')).toBeInTheDocument();
      expect(screen.getByText('blue: 1')).toBeInTheDocument();
    });
  });

  describe('卡牌選擇', () => {
    test('預設不可選擇', () => {
      const { container } = render(<PlayerHand cards={mockCards} />);
      const cards = container.querySelectorAll('.hand-card.selectable');
      expect(cards.length).toBe(0);
    });

    test('啟用選擇時卡牌可點擊', () => {
      const { container } = render(<PlayerHand cards={mockCards} selectable />);
      const cards = container.querySelectorAll('.hand-card.selectable');
      expect(cards.length).toBe(4);
    });

    test('點擊卡牌應觸發選擇', () => {
      const onCardSelect = jest.fn();
      render(<PlayerHand cards={mockCards} selectable onCardSelect={onCardSelect} />);

      fireEvent.click(screen.getByText('red'));
      expect(onCardSelect).toHaveBeenCalledWith(['card-1']);
    });

    test('再次點擊已選卡牌應取消選擇', () => {
      const onCardSelect = jest.fn();
      render(<PlayerHand cards={mockCards} selectable onCardSelect={onCardSelect} />);

      const redCard = screen.getByText('red');
      fireEvent.click(redCard);
      fireEvent.click(redCard);

      // 第二次點擊應該取消選擇
      expect(onCardSelect).toHaveBeenLastCalledWith([]);
    });

    test('單選模式只能選擇一張', () => {
      const onCardSelect = jest.fn();
      render(<PlayerHand cards={mockCards} selectable onCardSelect={onCardSelect} />);

      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));

      expect(onCardSelect).toHaveBeenLastCalledWith(['card-2']);
    });

    test('多選模式可選擇多張', () => {
      const onCardSelect = jest.fn();
      render(<PlayerHand cards={mockCards} selectable multiSelect onCardSelect={onCardSelect} />);

      fireEvent.click(screen.getByText('red'));
      fireEvent.click(screen.getByText('blue'));

      expect(onCardSelect).toHaveBeenLastCalledWith(['card-1', 'card-2']);
    });

    test('選擇時應顯示已選擇卡牌數量', () => {
      render(<PlayerHand cards={mockCards} selectable />);

      fireEvent.click(screen.getByText('red'));
      expect(screen.getByText('已選擇 1 張牌')).toBeInTheDocument();
    });
  });

  describe('外部控制選擇', () => {
    test('應支援外部控制已選擇卡牌', () => {
      const { container } = render(
        <PlayerHand
          cards={mockCards}
          selectable
          selectedCardIds={['card-1', 'card-2']}
        />
      );

      const selectedCards = container.querySelectorAll('.hand-card.selected');
      expect(selectedCards.length).toBe(2);
    });
  });

  describe('鍵盤操作', () => {
    test('可選擇時應可用鍵盤操作', () => {
      const onCardSelect = jest.fn();
      render(<PlayerHand cards={mockCards} selectable onCardSelect={onCardSelect} />);

      const redCard = screen.getByText('red').closest('.hand-card');
      redCard.focus();
      fireEvent.keyDown(redCard, { key: 'Enter' });

      expect(onCardSelect).toHaveBeenCalled();
    });

    test('空白鍵也應觸發選擇', () => {
      const onCardSelect = jest.fn();
      render(<PlayerHand cards={mockCards} selectable onCardSelect={onCardSelect} />);

      const redCard = screen.getByText('red').closest('.hand-card');
      redCard.focus();
      fireEvent.keyDown(redCard, { key: ' ' });

      expect(onCardSelect).toHaveBeenCalled();
    });
  });

  describe('無障礙', () => {
    test('可選擇的卡牌應有 role="button"', () => {
      render(<PlayerHand cards={mockCards} selectable />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });

    test('卡牌應有 aria-label', () => {
      render(<PlayerHand cards={[{ id: '1', color: 'red' }]} selectable />);
      expect(screen.getByLabelText('red 牌')).toBeInTheDocument();
    });

    test('已選擇卡牌應有 aria-pressed', () => {
      render(
        <PlayerHand
          cards={[{ id: '1', color: 'red' }]}
          selectable
          selectedCardIds={['1']}
        />
      );
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('樣式', () => {
    test('應包含 player-hand 容器類別', () => {
      const { container } = render(<PlayerHand cards={mockCards} />);
      expect(container.querySelector('.player-hand')).toBeInTheDocument();
    });

    test('應包含 hand-cards 類別', () => {
      const { container } = render(<PlayerHand cards={mockCards} />);
      expect(container.querySelector('.hand-cards')).toBeInTheDocument();
    });

    test('已選擇卡牌應有 selected 類別', () => {
      const { container } = render(
        <PlayerHand
          cards={mockCards}
          selectable
          selectedCardIds={['card-1']}
        />
      );
      expect(container.querySelector('.hand-card.selected')).toBeInTheDocument();
    });
  });
});
