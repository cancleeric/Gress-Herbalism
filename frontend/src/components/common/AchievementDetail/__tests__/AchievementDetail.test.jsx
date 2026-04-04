/**
 * AchievementDetail 測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementDetail from '../AchievementDetail';

const mockAchievement = {
  id: 'champion',
  name: '冠軍',
  description: '贏得 10 場遊戲',
  icon: '👑',
  points: 50,
  rarity: 'rare',
  category: 'milestone',
  condition: { type: 'games_won', value: 10 },
  progress: 70,
  currentValue: 7,
  unlocked: false,
};

describe('AchievementDetail', () => {
  it('should render nothing when no achievement provided', () => {
    const { container } = render(
      <AchievementDetail achievement={null} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render achievement name', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    expect(screen.getByText('冠軍')).toBeInTheDocument();
  });

  it('should render achievement description', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    const desc = document.querySelector('.achievement-detail__description');
    expect(desc).toBeInTheDocument();
    expect(desc.textContent).toBe('贏得 10 場遊戲');
  });

  it('should render unlock condition text', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    const condition = document.querySelector('.achievement-detail__condition');
    expect(condition).toBeInTheDocument();
    expect(condition.textContent).toContain('解鎖條件');
  });

  it('should render rarity badge', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    expect(screen.getByText('稀有')).toBeInTheDocument();
  });

  it('should render category badge', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    expect(screen.getByText('里程碑')).toBeInTheDocument();
  });

  it('should render points', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    expect(screen.getByText('+50 點')).toBeInTheDocument();
  });

  it('should show progress bar for unlocked=false with numeric target', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
  });

  it('should not show progress bar for unlocked achievement', () => {
    const unlocked = { ...mockAchievement, unlocked: true };
    render(<AchievementDetail achievement={unlocked} onClose={jest.fn()} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should show locked icon when not unlocked', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    const iconEl = document.querySelector('.achievement-detail__icon--locked');
    expect(iconEl).toBeInTheDocument();
  });

  it('should show real icon when unlocked', () => {
    const unlocked = { ...mockAchievement, unlocked: true };
    render(<AchievementDetail achievement={unlocked} onClose={jest.fn()} />);
    expect(screen.getByText('👑')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<AchievementDetail achievement={mockAchievement} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('關閉'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <AchievementDetail achievement={mockAchievement} onClose={onClose} />
    );
    const overlay = container.querySelector('.achievement-detail-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose on Escape key', () => {
    const onClose = jest.fn();
    render(<AchievementDetail achievement={mockAchievement} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show unlocked date when provided', () => {
    const unlockedAch = {
      ...mockAchievement,
      unlocked: true,
      unlockedAt: '2024-03-15T10:00:00Z',
    };
    render(<AchievementDetail achievement={unlockedAch} onClose={jest.fn()} />);
    expect(screen.getByText(/解鎖於/)).toBeInTheDocument();
  });

  it('should show unlocked badge when no date', () => {
    const unlockedAch = { ...mockAchievement, unlocked: true };
    render(<AchievementDetail achievement={unlockedAch} onClose={jest.fn()} />);
    expect(screen.getByText('✅ 已解鎖')).toBeInTheDocument();
  });

  it('should apply legendary rarity class', () => {
    const legendary = { ...mockAchievement, rarity: 'legendary' };
    const { container } = render(
      <AchievementDetail achievement={legendary} onClose={jest.fn()} />
    );
    expect(container.querySelector('.achievement-detail--legendary')).toBeInTheDocument();
  });

  it('should apply dialog role', () => {
    render(<AchievementDetail achievement={mockAchievement} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
