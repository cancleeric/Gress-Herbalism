/**
 * AchievementToast 組件測試
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import { AchievementToastContainer, getRarity } from '../AchievementToast';

describe('getRarity', () => {
  it('should return 普通 for low points', () => {
    expect(getRarity(10).label).toBe('普通');
    expect(getRarity(20).label).toBe('普通');
  });

  it('should return 稀有 for mid points', () => {
    expect(getRarity(35).label).toBe('稀有');
    expect(getRarity(50).label).toBe('稀有');
  });

  it('should return 傳說 for high points', () => {
    expect(getRarity(100).label).toBe('傳說');
    expect(getRarity(200).label).toBe('傳說');
  });

  it('should return correct classNames', () => {
    expect(getRarity(10).className).toBe('rarity--common');
    expect(getRarity(40).className).toBe('rarity--rare');
    expect(getRarity(100).className).toBe('rarity--legendary');
  });
});

describe('AchievementToastContainer', () => {
  const mockAchievements = [
    { id: 'ach-1', name: '初試啼聲', description: '完成第一場遊戲', icon: '🎮', points: 10 },
    { id: 'ach-2', name: '冠軍', description: '贏得 10 場遊戲', icon: '👑', points: 50 },
  ];

  it('should render nothing when achievements is empty', () => {
    const { container } = render(
      <AchievementToastContainer achievements={[]} onDismiss={jest.fn()} />
    );
    expect(screen.queryByTestId('achievement-toast')).not.toBeInTheDocument();
  });

  it('should render toasts for each achievement', () => {
    render(
      <AchievementToastContainer achievements={mockAchievements} onDismiss={jest.fn()} />
    );
    const toasts = screen.getAllByTestId('achievement-toast');
    expect(toasts).toHaveLength(2);
  });

  it('should display achievement name and description', () => {
    render(
      <AchievementToastContainer achievements={[mockAchievements[0]]} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('初試啼聲')).toBeInTheDocument();
    expect(screen.getByText('完成第一場遊戲')).toBeInTheDocument();
  });

  it('should display points', () => {
    render(
      <AchievementToastContainer achievements={[mockAchievements[0]]} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('should call onDismiss when close button clicked', () => {
    const onDismiss = jest.fn();
    render(
      <AchievementToastContainer achievements={[mockAchievements[0]]} onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByTestId('achievement-toast-close'));
    expect(onDismiss).toHaveBeenCalledWith('ach-1');
  });

  it('should auto-dismiss after 4 seconds', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(
      <AchievementToastContainer achievements={[mockAchievements[0]]} onDismiss={onDismiss} />
    );
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(onDismiss).toHaveBeenCalledWith('ach-1');
    jest.useRealTimers();
  });

  it('should render container with testid', () => {
    render(<AchievementToastContainer achievements={[]} onDismiss={jest.fn()} />);
    expect(screen.getByTestId('achievement-toast-container')).toBeInTheDocument();
  });
});
