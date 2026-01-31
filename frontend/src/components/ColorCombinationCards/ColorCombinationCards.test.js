/**
 * ColorCombinationCards 組件測試
 *
 * @module ColorCombinationCards.test
 * @updated 2026-01-31 工單 0215：更新測試以匹配圖片設計
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorCombinationCards from './ColorCombinationCards';
import ColorCard from './ColorCard';

describe('ColorCard Component', () => {
  const mockCard = {
    id: 'red-green',
    colors: ['red', 'green'],
    name: '紅綠'
  };

  test('renders card with correct image and name', () => {
    render(<ColorCard card={mockCard} />);

    // 檢查圖片元素存在
    const img = screen.getByRole('img', { name: '紅綠' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/cards/red-green.jpg');

    // 檢查卡牌名稱
    expect(screen.getByText('紅綠')).toBeInTheDocument();
  });

  test('renders all color combinations with images', () => {
    const cards = [
      { id: 'red-green', colors: ['red', 'green'], name: '紅綠' },
      { id: 'green-blue', colors: ['green', 'blue'], name: '綠藍' },
      { id: 'yellow-red', colors: ['yellow', 'red'], name: '黃紅' },
      { id: 'yellow-blue', colors: ['yellow', 'blue'], name: '黃藍' },
    ];

    cards.forEach(({ id, colors, name }) => {
      const { unmount } = render(<ColorCard card={{ id, colors, name }} />);

      // 檢查圖片
      const img = screen.getByRole('img', { name });
      expect(img).toHaveAttribute('src', `/images/cards/${id}.jpg`);

      // 檢查名稱
      expect(screen.getByText(name)).toBeInTheDocument();
      unmount();
    });
  });

  test('applies selected class when selected', () => {
    const { container } = render(<ColorCard card={mockCard} selected={true} />);
    expect(container.querySelector('.color-card.selected')).toBeInTheDocument();
  });

  test('applies disabled class when disabled', () => {
    const { container } = render(<ColorCard card={mockCard} disabled={true} />);
    expect(container.querySelector('.color-card.disabled')).toBeInTheDocument();
  });

  test('calls onClick when clicked and not disabled', () => {
    const handleClick = jest.fn();
    render(<ColorCard card={mockCard} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockCard);
  });

  test('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<ColorCard card={mockCard} disabled={true} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('handles keyboard navigation', () => {
    const handleClick = jest.fn();
    render(<ColorCard card={mockCard} onClick={handleClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('has correct aria attributes', () => {
    render(<ColorCard card={mockCard} selected={true} disabled={false} />);
    const card = screen.getByRole('button');

    expect(card).toHaveAttribute('aria-selected', 'true');
    expect(card).toHaveAttribute('aria-disabled', 'false');
  });
});

describe('ColorCombinationCards Component', () => {
  test('renders all six color combination cards', () => {
    render(<ColorCombinationCards />);

    expect(screen.getByText('顏色組合牌')).toBeInTheDocument();
    expect(screen.getByText('紅綠')).toBeInTheDocument();
    expect(screen.getByText('綠藍')).toBeInTheDocument();
    expect(screen.getByText('綠黃')).toBeInTheDocument();
    expect(screen.getByText('紅藍')).toBeInTheDocument();
    expect(screen.getByText('黃紅')).toBeInTheDocument();
    expect(screen.getByText('黃藍')).toBeInTheDocument();
  });

  test('renders in non-interactive mode by default', () => {
    const handleSelect = jest.fn();
    render(<ColorCombinationCards onCardSelect={handleSelect} />);

    fireEvent.click(screen.getByText('紅綠'));
    expect(handleSelect).not.toHaveBeenCalled();
  });

  test('allows card selection in interactive mode', () => {
    const handleSelect = jest.fn();
    render(<ColorCombinationCards interactive={true} onCardSelect={handleSelect} />);

    fireEvent.click(screen.getByText('紅綠'));
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'red-green',
        colors: ['red', 'green']
      })
    );
  });

  test('highlights selected card', () => {
    const { container } = render(
      <ColorCombinationCards selectedCardId="red-blue" />
    );

    const selectedCard = container.querySelector('.color-card.selected');
    expect(selectedCard).toBeInTheDocument();
  });

  test('disables specified cards', () => {
    const { container } = render(
      <ColorCombinationCards
        interactive={true}
        disabledCardIds={['red-green', 'green-blue']}
      />
    );

    const disabledCards = container.querySelectorAll('.color-card.disabled');
    expect(disabledCards.length).toBe(2);
  });

  test('disabled cards are not clickable in interactive mode', () => {
    const handleSelect = jest.fn();
    render(
      <ColorCombinationCards
        interactive={true}
        disabledCardIds={['red-green']}
        onCardSelect={handleSelect}
      />
    );

    fireEvent.click(screen.getByText('紅綠'));
    expect(handleSelect).not.toHaveBeenCalled();

    // But other cards are still clickable
    fireEvent.click(screen.getByText('綠藍'));
    expect(handleSelect).toHaveBeenCalled();
  });

  test('renders card images for all combinations', () => {
    render(<ColorCombinationCards />);

    // 檢查六張卡片都有圖片
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(6);

    // 檢查所有圖片路徑
    const expectedIds = ['red-green', 'green-blue', 'green-yellow', 'red-blue', 'yellow-red', 'yellow-blue'];
    expectedIds.forEach(id => {
      const img = images.find(img => img.getAttribute('src') === `/images/cards/${id}.jpg`);
      expect(img).toBeTruthy();
    });
  });

  test('cards have card-image class for visual representation', () => {
    const { container } = render(<ColorCombinationCards />);

    // 檢查所有卡片都有圖片元素
    const cardImages = container.querySelectorAll('.card-image');
    expect(cardImages.length).toBe(6);

    // 檢查圖片容器存在
    const cardIllustrations = container.querySelectorAll('.card-illustration');
    expect(cardIllustrations.length).toBe(6);
  });
});
