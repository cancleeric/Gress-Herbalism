/**
 * CardGiveNotification 組件測試
 *
 * @module CardGiveNotification.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CardGiveNotification from './CardGiveNotification';

describe('CardGiveNotification Component', () => {
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnConfirm.mockClear();
  });

  test('renders nothing when notification is null', () => {
    const { container } = render(
      <CardGiveNotification notification={null} onConfirm={mockOnConfirm} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders notification with oneEach ask type', () => {
    const notification = {
      fromPlayer: '小明',
      askType: 'oneEach',
      selectedColors: ['red', 'blue'],
      chosenColor: null,
      cardsGiven: [
        { color: 'red', count: 1 },
        { color: 'blue', count: 1 }
      ],
      totalCount: 2
    };

    render(<CardGiveNotification notification={notification} onConfirm={mockOnConfirm} />);

    expect(screen.getByText('給牌通知')).toBeInTheDocument();
    expect(screen.getByText(/小明/)).toBeInTheDocument();
    expect(screen.getByText('各一張')).toBeInTheDocument();
    expect(screen.getByText('紅色、藍色')).toBeInTheDocument();
    // 多個 x1，使用 getAllByText
    expect(screen.getAllByText('x1').length).toBeGreaterThan(0);
    expect(screen.getByText('共 2 張')).toBeInTheDocument();
    expect(screen.getByText('確認')).toBeInTheDocument();
  });

  test('renders notification with oneColorAll ask type', () => {
    const notification = {
      fromPlayer: '小華',
      askType: 'oneColorAll',
      selectedColors: ['green', 'yellow'],
      chosenColor: 'green',
      cardsGiven: [
        { color: 'green', count: 3 }
      ],
      totalCount: 3
    };

    render(<CardGiveNotification notification={notification} onConfirm={mockOnConfirm} />);

    expect(screen.getByText('其中一種全部')).toBeInTheDocument();
    expect(screen.getByText('綠色、黃色')).toBeInTheDocument();
    // 「綠色」可能出現多次（選擇給的顏色和卡片列表），使用 getAllByText
    expect(screen.getAllByText('綠色').length).toBeGreaterThan(0);
    expect(screen.getByText('共 3 張')).toBeInTheDocument();
  });

  test('renders notification with all ask type', () => {
    const notification = {
      fromPlayer: '小王',
      askType: 'all',
      selectedColors: ['red', 'blue'],
      chosenColor: null,
      cardsGiven: [
        { color: 'red', count: 2 },
        { color: 'blue', count: 3 }
      ],
      totalCount: 5
    };

    render(<CardGiveNotification notification={notification} onConfirm={mockOnConfirm} />);

    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('共 5 張')).toBeInTheDocument();
  });

  test('renders no cards message when cardsGiven is empty', () => {
    const notification = {
      fromPlayer: '小明',
      askType: 'oneEach',
      selectedColors: ['red', 'blue'],
      chosenColor: null,
      cardsGiven: [],
      totalCount: 0
    };

    render(<CardGiveNotification notification={notification} onConfirm={mockOnConfirm} />);

    expect(screen.getByText('無牌可給')).toBeInTheDocument();
  });

  test('confirm button calls onConfirm', () => {
    const notification = {
      fromPlayer: '小明',
      askType: 'oneEach',
      selectedColors: ['red', 'blue'],
      chosenColor: null,
      cardsGiven: [{ color: 'red', count: 1 }],
      totalCount: 1
    };

    render(<CardGiveNotification notification={notification} onConfirm={mockOnConfirm} />);

    const confirmButton = screen.getByText('確認');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  test('shows chosen color only for oneColorAll type', () => {
    const notification = {
      fromPlayer: '小明',
      askType: 'oneEach',
      selectedColors: ['red', 'blue'],
      chosenColor: 'red', // Should not be displayed for oneEach
      cardsGiven: [{ color: 'red', count: 1 }],
      totalCount: 1
    };

    render(<CardGiveNotification notification={notification} onConfirm={mockOnConfirm} />);

    expect(screen.queryByText('你選擇給：')).not.toBeInTheDocument();
  });

  test('displays color icons correctly', () => {
    const notification = {
      fromPlayer: '小明',
      askType: 'oneEach',
      selectedColors: ['red', 'yellow', 'green', 'blue'],
      chosenColor: null,
      cardsGiven: [
        { color: 'red', count: 1 },
        { color: 'yellow', count: 1 },
        { color: 'green', count: 1 },
        { color: 'blue', count: 1 }
      ],
      totalCount: 4
    };

    render(<CardGiveNotification notification={notification} onConfirm={mockOnConfirm} />);

    expect(screen.getByText('🔴')).toBeInTheDocument();
    expect(screen.getByText('🟡')).toBeInTheDocument();
    expect(screen.getByText('🟢')).toBeInTheDocument();
    expect(screen.getByText('🔵')).toBeInTheDocument();
  });
});
