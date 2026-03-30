/**
 * AchievementDetailModal 測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementDetailModal from '../AchievementDetailModal';

const mockUnlocked = {
  id: 'first_win',
  icon: '🏆',
  name: '初嚐勝果',
  description: '贏得第一場遊戲',
  points: 10,
  unlocked: true,
  rarity: 'common',
  category: 'milestone',
};

const mockLocked = {
  id: 'champion',
  icon: '👑',
  name: '冠軍',
  description: '贏得 10 場遊戲',
  points: 50,
  unlocked: false,
  rarity: 'rare',
  category: 'milestone',
  progress: 70,
  currentValue: 7,
  targetValue: 10,
};

const mockLegendary = {
  id: 'perfect_game',
  icon: '✨',
  name: '完美遊戲',
  description: '贏得遊戲且所有生物都吃飽',
  points: 100,
  unlocked: true,
  rarity: 'legendary',
  category: 'special',
};

describe('AchievementDetailModal', () => {
  it('should render achievement icon and name', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
  });

  it('should render description', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    expect(screen.getByText('贏得第一場遊戲')).toBeInTheDocument();
  });

  it('should display points', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    expect(screen.getByText('10 點')).toBeInTheDocument();
  });

  it('should display rarity label for common', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    expect(screen.getByText('普通')).toBeInTheDocument();
  });

  it('should display rarity label for rare', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockLocked} onClose={onClose} />);

    expect(screen.getByText('稀有')).toBeInTheDocument();
  });

  it('should display rarity label for legendary', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockLegendary} onClose={onClose} />);

    expect(screen.getByText('傳說')).toBeInTheDocument();
  });

  it('should show unlocked status for unlocked achievement', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    expect(screen.getByText('✅ 已解鎖')).toBeInTheDocument();
  });

  it('should show locked status for locked achievement', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockLocked} onClose={onClose} />);

    expect(screen.getByText('🔒 未解鎖')).toBeInTheDocument();
  });

  it('should show progress bar for locked achievement with progress', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockLocked} onClose={onClose} />);

    expect(screen.getByText('7 / 10')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should not show progress bar for unlocked achievement', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should display category label', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    expect(screen.getByText('里程碑')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('關閉'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />
    );

    fireEvent.click(container.querySelector('.achievement-detail-modal__backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show share button for unlocked achievement when onShare provided', () => {
    const onClose = jest.fn();
    const onShare = jest.fn();
    render(
      <AchievementDetailModal achievement={mockUnlocked} onClose={onClose} onShare={onShare} />
    );

    expect(screen.getByText('📤 分享成就')).toBeInTheDocument();
  });

  it('should not show share button for locked achievement', () => {
    const onClose = jest.fn();
    const onShare = jest.fn();
    render(
      <AchievementDetailModal achievement={mockLocked} onClose={onClose} onShare={onShare} />
    );

    expect(screen.queryByText('📤 分享成就')).not.toBeInTheDocument();
  });

  it('should call onShare with achievement when share clicked', () => {
    const onClose = jest.fn();
    const onShare = jest.fn();
    render(
      <AchievementDetailModal achievement={mockUnlocked} onClose={onClose} onShare={onShare} />
    );

    fireEvent.click(screen.getByText('📤 分享成就'));
    expect(onShare).toHaveBeenCalledWith(mockUnlocked);
  });

  it('should not render when achievement is null', () => {
    const onClose = jest.fn();
    const { container } = render(
      <AchievementDetailModal achievement={null} onClose={onClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should have correct aria attributes', () => {
    const onClose = jest.fn();
    render(<AchievementDetailModal achievement={mockUnlocked} onClose={onClose} />);

    const backdrop = screen.getByRole('dialog');
    expect(backdrop).toHaveAttribute('aria-modal', 'true');
    expect(backdrop).toHaveAttribute('aria-label', '成就詳情：初嚐勝果');
  });
});
