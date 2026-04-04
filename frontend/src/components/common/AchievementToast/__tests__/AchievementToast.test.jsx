/**
 * AchievementToast 測試
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AchievementToast, { AchievementToastItem } from '../AchievementToast';

const mockAchievement = {
  id: 'first_win',
  name: '初嚐勝果',
  icon: '🏆',
  points: 10,
  rarity: 'common',
};

describe('AchievementToast', () => {
  it('should render nothing when notifications are empty', () => {
    const { container } = render(
      <AchievementToast notifications={[]} onDismiss={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when notifications is null', () => {
    const { container } = render(
      <AchievementToast notifications={null} onDismiss={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render a notification', () => {
    render(
      <AchievementToast
        notifications={[mockAchievement]}
        onDismiss={jest.fn()}
      />
    );
    expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
  });

  it('should render multiple notifications', () => {
    const notifications = [
      mockAchievement,
      { id: 'champion', name: '冠軍', icon: '👑', points: 50, rarity: 'rare' },
    ];
    render(<AchievementToast notifications={notifications} onDismiss={jest.fn()} />);
    expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
    expect(screen.getByText('冠軍')).toBeInTheDocument();
  });

  it('should call onDismiss with achievement id when close clicked', () => {
    const onDismiss = jest.fn();
    render(
      <AchievementToast
        notifications={[mockAchievement]}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByLabelText('關閉通知'));
    expect(onDismiss).toHaveBeenCalledWith('first_win');
  });

  it('should dismiss on toast click', () => {
    const onDismiss = jest.fn();
    render(
      <AchievementToast
        notifications={[mockAchievement]}
        onDismiss={onDismiss}
      />
    );
    const toast = screen.getByRole('alert');
    fireEvent.click(toast);
    expect(onDismiss).toHaveBeenCalledWith('first_win');
  });

  it('should render aria-label on container', () => {
    render(
      <AchievementToast
        notifications={[mockAchievement]}
        onDismiss={jest.fn()}
      />
    );
    expect(screen.getByLabelText('成就通知')).toBeInTheDocument();
  });
});

describe('AchievementToastItem', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('should render icon, label and name', () => {
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('🎉 成就解鎖！')).toBeInTheDocument();
    expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
  });

  it('should render points', () => {
    render(
      <AchievementToastItem achievement={mockAchievement} onDismiss={jest.fn()} />
    );
    expect(screen.getByText('+10 點')).toBeInTheDocument();
  });

  it('should auto dismiss after duration', () => {
    const onDismiss = jest.fn();
    render(
      <AchievementToastItem
        achievement={mockAchievement}
        onDismiss={onDismiss}
        duration={1000}
      />
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1000));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not dismiss before duration', () => {
    const onDismiss = jest.fn();
    render(
      <AchievementToastItem
        achievement={mockAchievement}
        onDismiss={onDismiss}
        duration={2000}
      />
    );
    act(() => jest.advanceTimersByTime(500));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('should apply rare rarity class', () => {
    const rareAch = { ...mockAchievement, rarity: 'rare' };
    const { container } = render(
      <AchievementToastItem achievement={rareAch} onDismiss={jest.fn()} />
    );
    expect(container.firstChild).toHaveClass('achievement-toast--rare');
  });

  it('should apply legendary rarity class', () => {
    const legendaryAch = { ...mockAchievement, rarity: 'legendary' };
    const { container } = render(
      <AchievementToastItem achievement={legendaryAch} onDismiss={jest.fn()} />
    );
    expect(container.firstChild).toHaveClass('achievement-toast--legendary');
  });
});
