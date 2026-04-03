/**
 * AchievementDetailModal 組件測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock getRarity via AchievementToast
jest.mock('../../AchievementToast/AchievementToast', () => ({
  getRarity: (points) => {
    if (points >= 100) return { label: '傳說', className: 'rarity--legendary' };
    if (points >= 35) return { label: '稀有', className: 'rarity--rare' };
    return { label: '普通', className: 'rarity--common' };
  },
}));

import { AchievementDetailModal } from '../AchievementDetail';

const mockAchievement = {
  id: 'champion',
  name: '冠軍',
  description: '贏得 10 場遊戲',
  icon: '👑',
  points: 50,
  unlocked: false,
  progress: 60,
  currentValue: 6,
  targetValue: 10,
  category: 'milestone',
};

describe('AchievementDetailModal', () => {
  it('should render nothing when achievement is null', () => {
    const { container } = render(
      <AchievementDetailModal achievement={null} isOpen={true} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when isOpen is false', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={false} onClose={jest.fn()} />
    );
    expect(screen.queryByTestId('achievement-detail-modal')).not.toBeInTheDocument();
  });

  it('should render the modal when isOpen is true', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByTestId('achievement-detail-modal')).toBeInTheDocument();
  });

  it('should display achievement name and description', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText('冠軍')).toBeInTheDocument();
    expect(screen.getByText('贏得 10 場遊戲')).toBeInTheDocument();
  });

  it('should display points', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText('+50 點')).toBeInTheDocument();
  });

  it('should display rarity label', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText('稀有')).toBeInTheDocument();
  });

  it('should display category label', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText('里程碑')).toBeInTheDocument();
  });

  it('should display progress bar for locked achievement', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByTestId('achievement-progress-bar')).toBeInTheDocument();
  });

  it('should show currentValue/targetValue', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText('6 / 10')).toBeInTheDocument();
  });

  it('should NOT show progress bar for unlocked achievement', () => {
    const unlocked = { ...mockAchievement, unlocked: true };
    render(
      <AchievementDetailModal achievement={unlocked} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.queryByTestId('achievement-progress-bar')).not.toBeInTheDocument();
    expect(screen.getByText('✓ 已解鎖')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={onClose} />
    );
    fireEvent.click(screen.getByTestId('achievement-detail-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={onClose} />
    );
    fireEvent.click(screen.getByTestId('achievement-detail-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show share button when onShare is provided', () => {
    render(
      <AchievementDetailModal
        achievement={mockAchievement}
        isOpen={true}
        onClose={jest.fn()}
        onShare={jest.fn()}
      />
    );
    expect(screen.getByTestId('achievement-share-btn')).toBeInTheDocument();
  });

  it('should not show share button without onShare', () => {
    render(
      <AchievementDetailModal achievement={mockAchievement} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.queryByTestId('achievement-share-btn')).not.toBeInTheDocument();
  });

  it('should call onShare when share button clicked', () => {
    const onShare = jest.fn();
    render(
      <AchievementDetailModal
        achievement={mockAchievement}
        isOpen={true}
        onClose={jest.fn()}
        onShare={onShare}
      />
    );
    fireEvent.click(screen.getByTestId('achievement-share-btn'));
    expect(onShare).toHaveBeenCalledWith(mockAchievement);
  });
});
