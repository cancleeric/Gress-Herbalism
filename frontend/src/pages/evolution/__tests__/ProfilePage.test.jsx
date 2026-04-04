/**
 * ProfilePage 測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePage, AchievementBadge, GameHistoryItem } from '../ProfilePage';

describe('ProfilePage', () => {
  const mockUser = {
    id: 'user-1',
    displayName: '測試玩家',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: '2024-01-15T10:00:00Z',
  };

  const mockStats = {
    games_played: 50,
    games_won: 25,
    win_rate: 50.0,
    highest_score: 120,
    total_score: 2500,
    total_kills: 75,
  };

  const mockAchievements = [
    { id: 'ach-1', name: '新手上路', description: '完成第一場遊戲', icon: '🎮', points: 10, unlocked: true },
    { id: 'ach-2', name: '勝利者', description: '贏得第一場遊戲', icon: '🏆', points: 20, unlocked: true },
    { id: 'ach-3', name: '老練玩家', description: '完成50場遊戲', icon: '⭐', points: 50, unlocked: false },
    { id: 'ach-4', name: '肉食達人', description: '肉食生物擊殺100隻', icon: '🦖', points: 30, unlocked: false },
    { id: 'ach-5', name: '生存大師', description: '單場存活10隻生物', icon: '🌿', points: 40, unlocked: true },
    { id: 'ach-6', name: '策略家', description: '使用所有性狀', icon: '🧬', points: 100, unlocked: false },
    { id: 'ach-7', name: '傳奇玩家', description: '贏得100場遊戲', icon: '👑', points: 200, unlocked: false },
  ];

  const mockHistory = [
    { id: 'game-1', isWinner: true, rank: 1, score: 45, creatures: 5, traits: 8, playedAt: '2024-03-01T15:00:00Z' },
    { id: 'game-2', isWinner: false, rank: 2, score: 38, creatures: 4, traits: 7, playedAt: '2024-02-28T20:00:00Z' },
    { id: 'game-3', isWinner: false, rank: 3, score: 25, creatures: 3, traits: 5, playedAt: '2024-02-27T18:00:00Z' },
  ];

  describe('Loading State', () => {
    it('should render loading state', () => {
      render(<ProfilePage loading={true} />);

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('should apply loading class', () => {
      const { container } = render(<ProfilePage loading={true} />);

      expect(container.firstChild).toHaveClass('profile-page--loading');
    });
  });

  describe('Error State', () => {
    it('should render error message', () => {
      render(<ProfilePage error="載入失敗" />);

      expect(screen.getByText('載入失敗')).toBeInTheDocument();
    });

    it('should render retry button when onRefresh provided', () => {
      const onRefresh = jest.fn();
      render(<ProfilePage error="載入失敗" onRefresh={onRefresh} />);

      const retryBtn = screen.getByText('重試');
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(onRefresh).toHaveBeenCalled();
    });

    it('should not render retry button without onRefresh', () => {
      render(<ProfilePage error="載入失敗" />);

      expect(screen.queryByText('重試')).not.toBeInTheDocument();
    });
  });

  describe('User Info', () => {
    it('should render user display name', () => {
      render(<ProfilePage user={mockUser} />);

      expect(screen.getByText('測試玩家')).toBeInTheDocument();
    });

    it('should render user avatar', () => {
      render(<ProfilePage user={mockUser} />);

      const avatar = screen.getByAltText('測試玩家');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render placeholder when no avatar', () => {
      const userWithoutAvatar = { ...mockUser, avatarUrl: null };
      render(<ProfilePage user={userWithoutAvatar} />);

      expect(screen.getByText('測')).toBeInTheDocument();
    });

    it('should render join date', () => {
      render(<ProfilePage user={mockUser} />);

      expect(screen.getByText(/加入時間/)).toBeInTheDocument();
    });

    it('should render default name when no user', () => {
      render(<ProfilePage />);

      expect(screen.getByText('玩家')).toBeInTheDocument();
    });
  });

  describe('Stats Section', () => {
    it('should render stats cards', () => {
      render(<ProfilePage stats={mockStats} />);

      expect(screen.getByText('遊戲場數')).toBeInTheDocument();
      expect(screen.getByText('勝場數')).toBeInTheDocument();
      expect(screen.getByText('勝率')).toBeInTheDocument();
      expect(screen.getByText('最高分')).toBeInTheDocument();
    });

    it('should display correct stat values', () => {
      render(<ProfilePage stats={mockStats} />);

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('should handle missing stats', () => {
      render(<ProfilePage stats={{}} />);

      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });

  describe('Achievements Section', () => {
    it('should render achievements header with count', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      expect(screen.getByText(/成就 \(3\/7\)/)).toBeInTheDocument();
    });

    it('should display total points', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      // 10 + 20 + 40 = 70 點
      expect(screen.getByText('70 點')).toBeInTheDocument();
    });

    it('should render first 6 achievements by default', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      expect(screen.getByText('新手上路')).toBeInTheDocument();
      expect(screen.getByText('勝利者')).toBeInTheDocument();
      expect(screen.getByText('老練玩家')).toBeInTheDocument();
      expect(screen.getByText('肉食達人')).toBeInTheDocument();
      expect(screen.getByText('生存大師')).toBeInTheDocument();
      expect(screen.getByText('策略家')).toBeInTheDocument();
      expect(screen.queryByText('傳奇玩家')).not.toBeInTheDocument();
    });

    it('should toggle show all achievements', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      const showMoreBtn = screen.getByText('顯示全部 (7)');
      fireEvent.click(showMoreBtn);

      expect(screen.getByText('傳奇玩家')).toBeInTheDocument();
      expect(screen.getByText('顯示較少')).toBeInTheDocument();
    });

    it('should not show toggle button when 6 or fewer achievements', () => {
      const fewAchievements = mockAchievements.slice(0, 5);
      render(<ProfilePage achievements={fewAchievements} />);

      expect(screen.queryByText(/顯示全部/)).not.toBeInTheDocument();
    });

    it('should render category filter buttons', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      expect(screen.getByRole('tab', { name: '全部' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '里程碑' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '遊戲玩法' })).toBeInTheDocument();
    });

    it('should filter achievements by category', () => {
      const categorised = [
        { id: 'a1', name: '里程碑成就', icon: '🎮', points: 10, unlocked: true, category: 'milestone' },
        { id: 'a2', name: '玩法成就', icon: '🦖', points: 30, unlocked: false, category: 'gameplay' },
      ];
      render(<ProfilePage achievements={categorised} />);

      fireEvent.click(screen.getByRole('tab', { name: '里程碑' }));

      expect(screen.getByText('里程碑成就')).toBeInTheDocument();
      expect(screen.queryByText('玩法成就')).not.toBeInTheDocument();
    });

    it('should show all achievements when All category selected', () => {
      const categorised = [
        { id: 'a1', name: '里程碑成就', icon: '🎮', points: 10, unlocked: true, category: 'milestone' },
        { id: 'a2', name: '玩法成就', icon: '🦖', points: 30, unlocked: false, category: 'gameplay' },
      ];
      render(<ProfilePage achievements={categorised} />);

      fireEvent.click(screen.getByRole('tab', { name: '里程碑' }));
      fireEvent.click(screen.getByRole('tab', { name: '全部' }));

      expect(screen.getByText('里程碑成就')).toBeInTheDocument();
      expect(screen.getByText('玩法成就')).toBeInTheDocument();
    });

    it('should open achievement detail modal on badge click', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      fireEvent.click(screen.getByText('新手上路').closest('[role="button"]'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should close achievement detail modal', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      fireEvent.click(screen.getByText('新手上路').closest('[role="button"]'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display achievement rarity badges', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      // 10 pt => 普通
      const commonBadges = screen.getAllByText('普通');
      expect(commonBadges.length).toBeGreaterThan(0);
    });

    it('should show toast notifications for newly unlocked achievements', () => {
      const newlyUnlocked = [
        { id: 'ach-new', name: '新解鎖成就', icon: '🌟', points: 50 },
      ];
      render(<ProfilePage achievements={mockAchievements} newlyUnlocked={newlyUnlocked} />);

      expect(screen.getByText('新解鎖成就')).toBeInTheDocument();
      expect(screen.getByText('🏅 成就解鎖！')).toBeInTheDocument();
    });
  });

  describe('Game History Section', () => {
    it('should render game history', () => {
      render(<ProfilePage history={mockHistory} />);

      expect(screen.getByText('📜 近期遊戲')).toBeInTheDocument();
    });

    it('should show winner status', () => {
      render(<ProfilePage history={mockHistory} />);

      expect(screen.getByText('🏆 勝利')).toBeInTheDocument();
    });

    it('should show rank for non-winners', () => {
      render(<ProfilePage history={mockHistory} />);

      expect(screen.getByText('第 2 名')).toBeInTheDocument();
      expect(screen.getByText('第 3 名')).toBeInTheDocument();
    });

    it('should display game scores', () => {
      render(<ProfilePage history={mockHistory} />);

      expect(screen.getByText('45 分')).toBeInTheDocument();
      expect(screen.getByText('38 分')).toBeInTheDocument();
      expect(screen.getByText('25 分')).toBeInTheDocument();
    });

    it('should show empty message when no history', () => {
      render(<ProfilePage history={[]} />);

      expect(screen.getByText('尚無遊戲記錄')).toBeInTheDocument();
    });

    it('should limit history to 10 items', () => {
      const manyGames = Array.from({ length: 15 }, (_, i) => ({
        id: `game-${i}`,
        isWinner: false,
        rank: i + 1,
        score: 30 - i,
        creatures: 3,
        traits: 5,
        playedAt: `2024-03-${String(15 - i).padStart(2, '0')}T10:00:00Z`,
      }));

      render(<ProfilePage history={manyGames} />);

      const historyItems = screen.getAllByText(/分$/);
      expect(historyItems.length).toBe(10);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(<ProfilePage className="custom-profile" />);

      expect(container.firstChild).toHaveClass('profile-page');
      expect(container.firstChild).toHaveClass('custom-profile');
    });
  });
});

describe('AchievementBadge', () => {
  it('should render achievement with icon and name', () => {
    const achievement = {
      id: 'test-1',
      name: '測試成就',
      description: '這是測試成就',
      icon: '🎯',
      points: 50,
      unlocked: true,
    };

    render(<AchievementBadge achievement={achievement} />);

    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('測試成就')).toBeInTheDocument();
  });

  it('should show points for unlocked achievement', () => {
    const achievement = {
      name: '已解鎖',
      icon: '✅',
      points: 25,
      unlocked: true,
    };

    render(<AchievementBadge achievement={achievement} />);

    expect(screen.getByText('+25')).toBeInTheDocument();
  });

  it('should not show points for locked achievement', () => {
    const achievement = {
      name: '未解鎖',
      icon: '🔒',
      points: 100,
      unlocked: false,
    };

    render(<AchievementBadge achievement={achievement} />);

    expect(screen.queryByText('+100')).not.toBeInTheDocument();
  });

  it('should apply locked class when locked', () => {
    const achievement = {
      name: '鎖定',
      icon: '🔒',
      unlocked: false,
    };

    const { container } = render(<AchievementBadge achievement={achievement} />);

    expect(container.firstChild).toHaveClass('achievement-badge--locked');
  });

  it('should display description as title', () => {
    const achievement = {
      name: '有描述',
      description: '這是描述文字',
      icon: '📝',
      unlocked: true,
    };

    const { container } = render(<AchievementBadge achievement={achievement} />);

    expect(container.firstChild).toHaveAttribute('title', '這是描述文字');
  });

  it('should render rarity badge', () => {
    const achievement = {
      name: '稀有成就',
      icon: '💎',
      points: 30,
      unlocked: true,
    };

    render(<AchievementBadge achievement={achievement} />);

    expect(screen.getByText('稀有')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    const achievement = {
      name: '可點擊',
      icon: '👆',
      points: 10,
      unlocked: true,
    };

    render(<AchievementBadge achievement={achievement} onClick={onClick} />);

    fireEvent.click(screen.getByText('可點擊').closest('[role="button"]'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should show progress bar for locked achievement with progress', () => {
    const achievement = {
      name: '進行中',
      icon: '🔄',
      points: 20,
      unlocked: false,
      progress: { current: 5, total: 10 },
    };

    render(<AchievementBadge achievement={achievement} />);

    expect(screen.getByText('5/10')).toBeInTheDocument();
  });
});

describe('GameHistoryItem', () => {
  it('should render winner game', () => {
    const game = {
      id: 'game-1',
      isWinner: true,
      score: 50,
      creatures: 6,
      traits: 10,
      playedAt: '2024-03-01T12:00:00Z',
    };

    render(<GameHistoryItem game={game} />);

    expect(screen.getByText('🏆 勝利')).toBeInTheDocument();
    expect(screen.getByText('50 分')).toBeInTheDocument();
  });

  it('should render non-winner game with rank', () => {
    const game = {
      id: 'game-2',
      isWinner: false,
      rank: 3,
      score: 35,
      creatures: 4,
      traits: 6,
      playedAt: '2024-03-01T14:00:00Z',
    };

    render(<GameHistoryItem game={game} />);

    expect(screen.getByText('第 3 名')).toBeInTheDocument();
  });

  it('should display creatures and traits', () => {
    const game = {
      id: 'game-3',
      isWinner: false,
      rank: 2,
      score: 40,
      creatures: 5,
      traits: 8,
    };

    render(<GameHistoryItem game={game} />);

    expect(screen.getByText('5🦎 8🧬')).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    const game = {
      id: 'game-4',
      isWinner: true,
      score: 45,
      creatures: 5,
      traits: 9,
      playedAt: '2024-03-15T10:30:00Z',
    };

    render(<GameHistoryItem game={game} />);

    // 日期格式化結果依據 locale
    const dateElement = screen.getByText(/3月|Mar/);
    expect(dateElement).toBeInTheDocument();
  });

  it('should handle missing date', () => {
    const game = {
      id: 'game-5',
      isWinner: false,
      rank: 4,
      score: 20,
      creatures: 2,
      traits: 3,
    };

    render(<GameHistoryItem game={game} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should apply win class when winner', () => {
    const game = {
      id: 'game-6',
      isWinner: true,
      score: 55,
      creatures: 7,
      traits: 12,
    };

    const { container } = render(<GameHistoryItem game={game} />);

    expect(container.firstChild).toHaveClass('game-history-item--win');
  });
});
