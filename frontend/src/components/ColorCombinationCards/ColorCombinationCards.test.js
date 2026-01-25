/**
 * ColorCombinationCards 組件測試
 *
 * @module ColorCombinationCards.test
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

  test('renders card with correct colors', () => {
    render(<ColorCard card={mockCard} />);

    expect(screen.getByText('🔴')).toBeInTheDocument();
    expect(screen.getByText('🟢')).toBeInTheDocument();
    expect(screen.getByText('紅綠')).toBeInTheDocument();
  });

  test('renders all color combinations', () => {
    const colors = [
      { id: 'red-green', colors: ['red', 'green'], name: '紅綠', icons: ['🔴', '🟢'] },
      { id: 'green-blue', colors: ['green', 'blue'], name: '綠藍', icons: ['🟢', '🔵'] },
      { id: 'yellow-red', colors: ['yellow', 'red'], name: '黃紅', icons: ['🟡', '🔴'] },
      { id: 'yellow-blue', colors: ['yellow', 'blue'], name: '黃藍', icons: ['🟡', '🔵'] },
    ];

    colors.forEach(({ id, colors, name, icons }) => {
      const { unmount } = render(<ColorCard card={{ id, colors, name }} />);
      expect(screen.getByText(icons[0])).toBeInTheDocument();
      expect(screen.getByText(icons[1])).toBeInTheDocument();
      expect(screen.getByText(name.slice(0, 1) + name.slice(1))).toBeInTheDocument();
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

  test('renders correct color emoji icons', () => {
    render(<ColorCombinationCards />);

    // Check for all color emojis
    const redIcons = screen.getAllByText('🔴');
    const yellowIcons = screen.getAllByText('🟡');
    const greenIcons = screen.getAllByText('🟢');
    const blueIcons = screen.getAllByText('🔵');

    // Each color appears in multiple cards
    expect(redIcons.length).toBeGreaterThan(0);
    expect(yellowIcons.length).toBeGreaterThan(0);
    expect(greenIcons.length).toBeGreaterThan(0);
    expect(blueIcons.length).toBeGreaterThan(0);
  });

  test('cards have color stripes for visual representation', () => {
    const { container } = render(<ColorCombinationCards />);

    const redStripes = container.querySelectorAll('.color-stripe.color-red');
    const yellowStripes = container.querySelectorAll('.color-stripe.color-yellow');
    const greenStripes = container.querySelectorAll('.color-stripe.color-green');
    const blueStripes = container.querySelectorAll('.color-stripe.color-blue');

    expect(redStripes.length).toBeGreaterThan(0);
    expect(yellowStripes.length).toBeGreaterThan(0);
    expect(greenStripes.length).toBeGreaterThan(0);
    expect(blueStripes.length).toBeGreaterThan(0);
  });
});
