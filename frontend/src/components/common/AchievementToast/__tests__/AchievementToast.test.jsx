/**
 * AchievementToast 測試
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, role, 'aria-live': ariaLive, className }) => (
      <div onClick={onClick} role={role} aria-live={ariaLive} className={className}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import AchievementToast, { AchievementToastItem } from '../AchievementToast';

describe('AchievementToastItem', () => {
  const mockAchievement = {
    id: 'ach-1',
    name: '初試啼聲',
    icon: '🎮',
    points: 10,
    rarity: 'common',
  };

  it('renders achievement name', () => {
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('初試啼聲')).toBeInTheDocument();
  });

  it('renders achievement icon', () => {
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('shows rarity label for common', () => {
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('普通')).toBeInTheDocument();
  });

  it('shows rarity label for rare', () => {
    const rareAchievement = { ...mockAchievement, rarity: 'rare' };
    render(
      <AchievementToastItem achievement={rareAchievement} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('稀有')).toBeInTheDocument();
  });

  it('shows rarity label for legendary', () => {
    const legendaryAchievement = { ...mockAchievement, rarity: 'legendary' };
    render(
      <AchievementToastItem achievement={legendaryAchievement} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('傳說')).toBeInTheDocument();
  });

  it('shows points', () => {
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('+10pt')).toBeInTheDocument();
  });

  it('dismisses on click', () => {
    const onDismiss = jest.fn();
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByRole('alert'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses after timeout', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(onDismiss).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not dismiss before timeout', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />
    );
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('cleans up timer on unmount', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    const { unmount } = render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />
    );
    unmount();
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

describe('AchievementToast', () => {
  const mockAchievements = [
    { id: 'ach-1', name: '初試啼聲', icon: '🎮', points: 10, rarity: 'common' },
    { id: 'ach-2', name: '初嚐勝果', icon: '🏆', points: 10, rarity: 'common' },
  ];

  it('renders nothing when achievements is empty', () => {
    const { container } = render(<AchievementToast achievements={[]} />);
    const toastContainer = container.querySelector('.achievement-toast-container');
    expect(toastContainer).toBeInTheDocument();
    // No toast items
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders all achievement toasts', () => {
    render(<AchievementToast achievements={mockAchievements} />);
    expect(screen.getByText('初試啼聲')).toBeInTheDocument();
    expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
  });

  it('calls onDismiss with id when a toast is dismissed', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<AchievementToast achievements={mockAchievements} onDismiss={onDismiss} />);
    fireEvent.click(screen.getAllByRole('alert')[0]);
    expect(onDismiss).toHaveBeenCalledWith('ach-1');
    jest.useRealTimers();
  });

  it('removes dismissed toast from display', () => {
    const onDismiss = jest.fn();
    render(<AchievementToast achievements={mockAchievements} onDismiss={onDismiss} />);
    fireEvent.click(screen.getAllByRole('alert')[0]);
    expect(screen.queryByText('初試啼聲')).not.toBeInTheDocument();
    expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
  });

  it('renders container with aria-label', () => {
    render(<AchievementToast achievements={[]} />);
    expect(screen.getByLabelText('成就通知')).toBeInTheDocument();
  });

  it('renders with no achievements prop (default empty array)', () => {
    expect(() => render(<AchievementToast />)).not.toThrow();
  });
});
