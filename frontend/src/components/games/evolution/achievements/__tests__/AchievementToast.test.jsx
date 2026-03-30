/**
 * AchievementToast 測試
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AchievementToast, { AchievementToastItem } from '../AchievementToast';

const mockAchievement = {
  id: 'first_win',
  icon: '🏆',
  name: '初嚐勝果',
  points: 10,
  rarity: 'common',
};

const mockRareAchievement = {
  id: 'champion',
  icon: '👑',
  name: '冠軍',
  points: 50,
  rarity: 'rare',
};

const mockLegendaryAchievement = {
  id: 'perfect_game',
  icon: '✨',
  name: '完美遊戲',
  points: 100,
  rarity: 'legendary',
};

describe('AchievementToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('AchievementToast container', () => {
    it('should render nothing when achievements array is empty', () => {
      const onDismiss = jest.fn();
      const { container } = render(
        <AchievementToast achievements={[]} onDismiss={onDismiss} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render achievement toasts', () => {
      const onDismiss = jest.fn();
      render(
        <AchievementToast achievements={[mockAchievement]} onDismiss={onDismiss} />
      );

      expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
    });

    it('should render multiple achievements', () => {
      const onDismiss = jest.fn();
      render(
        <AchievementToast
          achievements={[mockAchievement, mockRareAchievement]}
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
      expect(screen.getByText('冠軍')).toBeInTheDocument();
    });
  });

  describe('AchievementToastItem', () => {
    it('should render achievement icon', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />);

      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('should render achievement name', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />);

      expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
    });

    it('should render points', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />);

      expect(screen.getByText('+10')).toBeInTheDocument();
    });

    it('should render rarity label for common', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />);

      expect(screen.getByText('普通')).toBeInTheDocument();
    });

    it('should render rarity label for rare', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockRareAchievement} onDismiss={onDismiss} />);

      expect(screen.getByText('稀有')).toBeInTheDocument();
    });

    it('should render rarity label for legendary', () => {
      const onDismiss = jest.fn();
      render(
        <AchievementToastItem achievement={mockLegendaryAchievement} onDismiss={onDismiss} />
      );

      expect(screen.getByText('傳說')).toBeInTheDocument();
    });

    it('should show title text', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />);

      expect(screen.getByText('🏅 成就解鎖！')).toBeInTheDocument();
    });

    it('should call onDismiss when close button clicked', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByLabelText('關閉通知'));
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(onDismiss).toHaveBeenCalledWith('first_win');
    });

    it('should auto-dismiss after 4 seconds', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(4400);
      });
      expect(onDismiss).toHaveBeenCalledWith('first_win');
    });

    it('should have correct role and aria-live', () => {
      const onDismiss = jest.fn();
      render(<AchievementToastItem achievement={mockAchievement} onDismiss={onDismiss} />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });
  });
});
