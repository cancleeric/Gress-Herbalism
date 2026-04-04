/**
 * AchievementDetail 測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AchievementDetail, { getRarity, getCategoryLabel } from '../AchievementDetail';

// Mock clipboard API
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  configurable: true,
});

// Mock alert
global.alert = jest.fn();

describe('getRarity', () => {
  it('returns 普通 for points <= 20', () => {
    expect(getRarity(10).label).toBe('普通');
    expect(getRarity(20).label).toBe('普通');
    expect(getRarity(10).className).toBe('rarity--common');
  });

  it('returns 稀有 for points 21-49', () => {
    expect(getRarity(21).label).toBe('稀有');
    expect(getRarity(30).label).toBe('稀有');
    expect(getRarity(49).label).toBe('稀有');
    expect(getRarity(30).className).toBe('rarity--rare');
  });

  it('returns 傳說 for points >= 50', () => {
    expect(getRarity(50).label).toBe('傳說');
    expect(getRarity(100).label).toBe('傳說');
    expect(getRarity(50).className).toBe('rarity--legendary');
  });

  it('returns 普通 for 0 points', () => {
    expect(getRarity(0).label).toBe('普通');
  });
});

describe('getCategoryLabel', () => {
  it('returns correct Chinese labels', () => {
    expect(getCategoryLabel('milestone')).toBe('里程碑');
    expect(getCategoryLabel('gameplay')).toBe('遊戲玩法');
    expect(getCategoryLabel('collection')).toBe('收集類');
    expect(getCategoryLabel('special')).toBe('特殊成就');
  });

  it('returns the raw value for unknown category', () => {
    expect(getCategoryLabel('unknown')).toBe('unknown');
  });
});

describe('AchievementDetail', () => {
  const mockOnClose = jest.fn();

  const baseAchievement = {
    id: 'first_win',
    name: '初嚐勝果',
    nameEn: 'First Victory',
    description: '贏得第一場遊戲',
    icon: '🏆',
    category: 'milestone',
    condition: { type: 'games_won', value: 1 },
    points: 10,
    unlocked: true,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockWriteText.mockClear();
    global.alert.mockClear();
  });

  describe('Rendering', () => {
    it('renders achievement name', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
    });

    it('renders achievement icon', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByText('贏得第一場遊戲')).toBeInTheDocument();
    });

    it('renders English name when provided', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByText(/First Victory/)).toBeInTheDocument();
    });

    it('renders category label', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByText('里程碑')).toBeInTheDocument();
    });

    it('renders rarity label for common achievement', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByText('普通')).toBeInTheDocument();
    });

    it('renders rarity label for rare achievement', () => {
      const rareAchievement = { ...baseAchievement, points: 30 };
      render(<AchievementDetail achievement={rareAchievement} onClose={mockOnClose} />);
      expect(screen.getByText('稀有')).toBeInTheDocument();
    });

    it('renders rarity label for legendary achievement', () => {
      const legendaryAchievement = { ...baseAchievement, points: 100 };
      render(<AchievementDetail achievement={legendaryAchievement} onClose={mockOnClose} />);
      expect(screen.getByText('傳說')).toBeInTheDocument();
    });

    it('renders unlocked points', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByText('+10 點')).toBeInTheDocument();
    });

    it('renders locked points text when not unlocked', () => {
      const locked = { ...baseAchievement, unlocked: false };
      render(<AchievementDetail achievement={locked} onClose={mockOnClose} />);
      expect(screen.getByText('10 點（未解鎖）')).toBeInTheDocument();
    });

    it('renders unlock condition', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByText(/解鎖條件/)).toBeInTheDocument();
    });

    it('renders share button', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByRole('button', { name: '分享成就' })).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByRole('button', { name: '關閉' })).toBeInTheDocument();
    });

    it('renders as dialog', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('renders progress bar for locked achievement with progress', () => {
      const withProgress = {
        ...baseAchievement,
        unlocked: false,
        progress: { current: 7, total: 10 },
      };
      render(<AchievementDetail achievement={withProgress} onClose={mockOnClose} />);
      expect(screen.getByText('進度：7 / 10')).toBeInTheDocument();
    });

    it('renders progress bar with correct aria attributes', () => {
      const withProgress = {
        ...baseAchievement,
        unlocked: false,
        progress: { current: 7, total: 10 },
      };
      render(<AchievementDetail achievement={withProgress} onClose={mockOnClose} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '7');
      expect(progressBar).toHaveAttribute('aria-valuemax', '10');
    });

    it('renders percentage text', () => {
      const withProgress = {
        ...baseAchievement,
        unlocked: false,
        progress: { current: 7, total: 10 },
      };
      render(<AchievementDetail achievement={withProgress} onClose={mockOnClose} />);
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('does not render progress bar for unlocked achievement', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('does not render progress bar when no progress data', () => {
      const locked = { ...baseAchievement, unlocked: false };
      render(<AchievementDetail achievement={locked} onClose={mockOnClose} />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Unlocked At', () => {
    it('renders unlock date when provided', () => {
      const withDate = { ...baseAchievement, unlockedAt: '2024-03-15T10:00:00Z' };
      render(<AchievementDetail achievement={withDate} onClose={mockOnClose} />);
      expect(screen.getByText(/解鎖於/)).toBeInTheDocument();
    });

    it('does not render unlock date when not provided', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      expect(screen.queryByText(/解鎖於/)).not.toBeInTheDocument();
    });
  });

  describe('Close Behaviour', () => {
    it('calls onClose when close button clicked', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: '關閉' }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay background clicked', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('dialog'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key pressed', () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Share Functionality', () => {
    it('copies unlocked achievement text to clipboard', async () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: '分享成就' }));
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          expect.stringContaining('初嚐勝果')
        );
      });
    });

    it('shows copied confirmation after sharing', async () => {
      render(<AchievementDetail achievement={baseAchievement} onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: '分享成就' }));
      await waitFor(() => {
        expect(screen.getByText('✅ 已複製！')).toBeInTheDocument();
      });
    });

    it('copies locked achievement progress text', async () => {
      const locked = {
        ...baseAchievement,
        unlocked: false,
        progress: { current: 0, total: 1 },
      };
      render(<AchievementDetail achievement={locked} onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: '分享成就' }));
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          expect.stringContaining('初嚐勝果')
        );
      });
    });
  });

  describe('Condition Formatting', () => {
    it('formats cumulative condition', () => {
      const ach = {
        ...baseAchievement,
        condition: { type: 'games_played', value: 10 },
      };
      render(<AchievementDetail achievement={ach} onClose={mockOnClose} />);
      expect(screen.getByText(/累計完成場數/)).toBeInTheDocument();
    });

    it('formats win rate condition with minGames', () => {
      const ach = {
        ...baseAchievement,
        condition: { type: 'win_rate', value: 60, minGames: 20 },
      };
      render(<AchievementDetail achievement={ach} onClose={mockOnClose} />);
      expect(screen.getByText(/勝率 ≥ 60%（至少 20 場後）/)).toBeInTheDocument();
    });

    it('formats boolean condition', () => {
      const ach = {
        ...baseAchievement,
        condition: { type: 'all_survived', value: true },
      };
      render(<AchievementDetail achievement={ach} onClose={mockOnClose} />);
      expect(screen.getByText(/所有生物存活/)).toBeInTheDocument();
    });
  });
});
