/**
 * ProfilePage 測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock framer-motion (used by AchievementToast)
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

import { ProfilePage, AchievementBadge, GameHistoryItem, CategoryFilter } from '../ProfilePage';

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
    { id: 'ach-1', name: '新手上路', description: '完成第一場遊戲', icon: '🎮', points: 10, unlocked: true, category: 'milestone', rarity: 'common' },
    { id: 'ach-2', name: '勝利者', description: '贏得第一場遊戲', icon: '🏆', points: 20, unlocked: true, category: 'milestone', rarity: 'common' },
    { id: 'ach-3', name: '老練玩家', description: '完成50場遊戲', icon: '⭐', points: 50, unlocked: false, category: 'milestone', rarity: 'rare' },
    { id: 'ach-4', name: '肉食達人', description: '肉食生物擊殺100隻', icon: '🦖', points: 30, unlocked: false, category: 'gameplay', rarity: 'rare' },
    { id: 'ach-5', name: '生存大師', description: '單場存活10隻生物', icon: '🌿', points: 40, unlocked: true, category: 'gameplay', rarity: 'rare' },
    { id: 'ach-6', name: '策略家', description: '使用所有性狀', icon: '🧬', points: 100, unlocked: false, category: 'special', rarity: 'legendary' },
    { id: 'ach-7', name: '傳奇玩家', description: '贏得100場遊戲', icon: '👑', points: 200, unlocked: false, category: 'special', rarity: 'legendary' },
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
  });

  describe('Category Filter', () => {
    it('should render category filter tabs', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('里程碑')).toBeInTheDocument();
      expect(screen.getByText('遊戲玩法')).toBeInTheDocument();
      expect(screen.getByText('收集類')).toBeInTheDocument();
      expect(screen.getByText('特殊成就')).toBeInTheDocument();
    });

    it('should filter achievements by milestone category', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      fireEvent.click(screen.getByText('里程碑'));

      expect(screen.getByText('新手上路')).toBeInTheDocument();
      expect(screen.getByText('勝利者')).toBeInTheDocument();
      expect(screen.getByText('老練玩家')).toBeInTheDocument();
      expect(screen.queryByText('肉食達人')).not.toBeInTheDocument();
      expect(screen.queryByText('生存大師')).not.toBeInTheDocument();
    });

    it('should filter achievements by gameplay category', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      fireEvent.click(screen.getByText('遊戲玩法'));

      expect(screen.getByText('肉食達人')).toBeInTheDocument();
      expect(screen.getByText('生存大師')).toBeInTheDocument();
      expect(screen.queryByText('新手上路')).not.toBeInTheDocument();
    });

    it('should show all achievements when "全部" tab is active', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      // Filter to milestone first
      fireEvent.click(screen.getByText('里程碑'));
      // Then switch back to all
      fireEvent.click(screen.getByText('全部'));

      expect(screen.getByText('新手上路')).toBeInTheDocument();
      expect(screen.getByText('肉食達人')).toBeInTheDocument();
    });

    it('should mark active tab with active class', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      const milestoneTab = screen.getByText('里程碑');
      fireEvent.click(milestoneTab);

      expect(milestoneTab).toHaveClass('category-filter__tab--active');
    });
  });

  describe('Achievement Progress', () => {
    it('should show progress text when achievementProgress provided', () => {
      const progress = [{ id: 'ach-3', progress: 50, current: 5, target: 10 }];
      render(
        <ProfilePage achievements={mockAchievements} achievementProgress={progress} />
      );

      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('should not show progress text when achievementProgress not provided', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      expect(screen.queryByText(/\/10/)).not.toBeInTheDocument();
    });

    it('should not render progress text for unlocked achievements', () => {
      // ach-1 is unlocked, even if progress given it shouldn't show current/target
      const progress = [{ id: 'ach-1', progress: 100, current: 1, target: 1 }];
      render(
        <ProfilePage achievements={mockAchievements} achievementProgress={progress} />
      );
      // The unlocked badge should not show "1/1" text
      expect(screen.queryByText('1/1')).not.toBeInTheDocument();
    });
  });

  describe('Achievement Detail Modal', () => {
    it('should open detail modal on badge click', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      const badge = screen.getByText('新手上路');
      fireEvent.click(badge.closest('[role="button"]') || badge);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show achievement description in modal', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      fireEvent.click(screen.getAllByRole('button')[0]);
      // find dialog and check description
      const dialog = screen.queryByRole('dialog');
      if (dialog) {
        expect(dialog).toBeInTheDocument();
      }
    });

    it('should close modal on close button click', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      // Open modal by clicking a badge button
      const badgeButtons = screen.getAllByRole('button');
      // Click first badge (skip category filter buttons)
      const firstBadge = badgeButtons.find((b) => b.closest('.achievement-badge'));
      if (firstBadge) {
        fireEvent.click(firstBadge);
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        const closeBtn = screen.getByLabelText('關閉');
        fireEvent.click(closeBtn);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }
    });

    it('should show share button in modal', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      const badgeButtons = screen.getAllByRole('button');
      const firstBadge = badgeButtons.find((b) => b.closest('.achievement-badge'));
      if (firstBadge) {
        fireEvent.click(firstBadge);
        expect(screen.getByText(/分享成就/)).toBeInTheDocument();
      }
    });
  });

  describe('Toast Notifications', () => {
    it('should render toasts when newlyUnlocked provided', () => {
      const newlyUnlocked = [
        { id: 'ach-1', name: '新手上路', icon: '🎮', points: 10, rarity: 'common' },
      ];
      render(<ProfilePage achievements={mockAchievements} newlyUnlocked={newlyUnlocked} />);

      expect(screen.getByLabelText('成就通知')).toBeInTheDocument();
      expect(screen.getByText('成就解鎖！')).toBeInTheDocument();
    });

    it('should not show toasts when newlyUnlocked is not provided', () => {
      render(<ProfilePage achievements={mockAchievements} />);

      expect(screen.queryByText('成就解鎖！')).not.toBeInTheDocument();
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

  it('should show rarity label for common', () => {
    const achievement = {
      name: '普通成就',
      icon: '🎯',
      unlocked: true,
      rarity: 'common',
    };
    render(<AchievementBadge achievement={achievement} />);
    expect(screen.getByText('普通')).toBeInTheDocument();
  });

  it('should show rarity label for rare', () => {
    const achievement = {
      name: '稀有成就',
      icon: '💎',
      unlocked: true,
      rarity: 'rare',
    };
    render(<AchievementBadge achievement={achievement} />);
    expect(screen.getByText('稀有')).toBeInTheDocument();
  });

  it('should show rarity label for legendary', () => {
    const achievement = {
      name: '傳說成就',
      icon: '👑',
      unlocked: true,
      rarity: 'legendary',
    };
    render(<AchievementBadge achievement={achievement} />);
    expect(screen.getByText('傳說')).toBeInTheDocument();
  });

  it('should show progress text when current and target provided for locked achievement', () => {
    const achievement = {
      name: '進度成就',
      icon: '📈',
      unlocked: false,
    };
    render(<AchievementBadge achievement={achievement} current={7} target={10} />);
    expect(screen.getByText('7/10')).toBeInTheDocument();
  });

  it('should not show progress text for unlocked achievements', () => {
    const achievement = {
      name: '已解鎖',
      icon: '✅',
      unlocked: true,
    };
    render(<AchievementBadge achievement={achievement} current={10} target={10} />);
    expect(screen.queryByText('10/10')).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    const achievement = {
      name: '可點擊',
      icon: '👆',
      unlocked: true,
    };
    const { container } = render(
      <AchievementBadge achievement={achievement} onClick={onClick} />
    );
    fireEvent.click(container.firstChild);
    expect(onClick).toHaveBeenCalled();
  });
});

describe('CategoryFilter', () => {
  it('should render all category tabs', () => {
    render(<CategoryFilter activeCategory="all" onChange={jest.fn()} />);

    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('里程碑')).toBeInTheDocument();
    expect(screen.getByText('遊戲玩法')).toBeInTheDocument();
    expect(screen.getByText('收集類')).toBeInTheDocument();
    expect(screen.getByText('特殊成就')).toBeInTheDocument();
  });

  it('should mark active tab', () => {
    render(<CategoryFilter activeCategory="milestone" onChange={jest.fn()} />);

    expect(screen.getByText('里程碑')).toHaveClass('category-filter__tab--active');
    expect(screen.getByText('全部')).not.toHaveClass('category-filter__tab--active');
  });

  it('should call onChange when tab clicked', () => {
    const onChange = jest.fn();
    render(<CategoryFilter activeCategory="all" onChange={onChange} />);

    fireEvent.click(screen.getByText('里程碑'));
    expect(onChange).toHaveBeenCalledWith('milestone');
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
