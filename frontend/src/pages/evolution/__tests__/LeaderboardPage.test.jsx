/**
 * LeaderboardPage 測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeaderboardPage, LeaderboardItem, LEADERBOARD_TYPES, RANK_ICONS } from '../LeaderboardPage';

describe('LeaderboardPage', () => {
  const mockPlayers = [
    { user_id: 'user-1', display_name: '玩家一', games_played: 100, games_won: 60, win_rate: 60.0, total_score: 5000 },
    { user_id: 'user-2', display_name: '玩家二', games_played: 80, games_won: 40, win_rate: 50.0, total_score: 4000 },
    { user_id: 'user-3', display_name: '玩家三', games_played: 50, games_won: 20, win_rate: 40.0, total_score: 2500 },
    { user_id: 'user-4', display_name: '玩家四', games_played: 30, games_won: 10, win_rate: 33.3, total_score: 1500 },
  ];

  let mockFetchLeaderboard;
  let mockFetchDailyLeaderboard;
  let mockFetchWeeklyLeaderboard;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchLeaderboard = jest.fn().mockResolvedValue(mockPlayers);
    mockFetchDailyLeaderboard = jest.fn().mockResolvedValue([mockPlayers[0], mockPlayers[1]]);
    mockFetchWeeklyLeaderboard = jest.fn().mockResolvedValue([mockPlayers[0], mockPlayers[1], mockPlayers[2]]);
  });

  describe('Initial Load', () => {
    it('should show loading state initially', () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('should fetch all leaderboard on mount', async () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      await waitFor(() => {
        expect(mockFetchLeaderboard).toHaveBeenCalled();
      });
    });

    it('should render title', async () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      expect(screen.getByText('🏆 排行榜')).toBeInTheDocument();
    });

    it('should render players after load', async () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      await waitFor(() => {
        expect(screen.getByText('玩家一')).toBeInTheDocument();
        expect(screen.getByText('玩家二')).toBeInTheDocument();
        expect(screen.getByText('玩家三')).toBeInTheDocument();
        expect(screen.getByText('玩家四')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Switching', () => {
    it('should render all tabs', () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      expect(screen.getByText('總排行')).toBeInTheDocument();
      expect(screen.getByText('今日')).toBeInTheDocument();
      expect(screen.getByText('本週')).toBeInTheDocument();
    });

    it('should switch to daily leaderboard', async () => {
      render(
        <LeaderboardPage
          onFetchLeaderboard={mockFetchLeaderboard}
          onFetchDailyLeaderboard={mockFetchDailyLeaderboard}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('玩家一')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('今日'));

      await waitFor(() => {
        expect(mockFetchDailyLeaderboard).toHaveBeenCalled();
      });
    });

    it('should switch to weekly leaderboard', async () => {
      render(
        <LeaderboardPage
          onFetchLeaderboard={mockFetchLeaderboard}
          onFetchWeeklyLeaderboard={mockFetchWeeklyLeaderboard}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('玩家一')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('本週'));

      await waitFor(() => {
        expect(mockFetchWeeklyLeaderboard).toHaveBeenCalled();
      });
    });

    it('should highlight active tab', async () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      const allTab = screen.getByText('總排行');
      expect(allTab).toHaveClass('active');

      fireEvent.click(screen.getByText('今日'));

      await waitFor(() => {
        expect(screen.getByText('今日')).toHaveClass('active');
        expect(allTab).not.toHaveClass('active');
      });
    });
  });

  describe('Search', () => {
    it('should render search input', () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      expect(screen.getByPlaceholderText('搜尋玩家...')).toBeInTheDocument();
    });

    it('should filter players by name', async () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      await waitFor(() => {
        expect(screen.getByText('玩家一')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜尋玩家...');
      fireEvent.change(searchInput, { target: { value: '玩家一' } });

      expect(screen.getByText('玩家一')).toBeInTheDocument();
      expect(screen.queryByText('玩家二')).not.toBeInTheDocument();
    });

    it('should show empty message when no matches', async () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      await waitFor(() => {
        expect(screen.getByText('玩家一')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜尋玩家...');
      fireEvent.change(searchInput, { target: { value: '不存在的玩家' } });

      expect(screen.getByText('找不到符合的玩家')).toBeInTheDocument();
    });

    it('should search by user_id', async () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      await waitFor(() => {
        expect(screen.getByText('玩家一')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜尋玩家...');
      fireEvent.change(searchInput, { target: { value: 'user-2' } });

      expect(screen.getByText('玩家二')).toBeInTheDocument();
      expect(screen.queryByText('玩家一')).not.toBeInTheDocument();
    });
  });

  describe('Current User', () => {
    it('should show current user rank', async () => {
      render(
        <LeaderboardPage
          currentUserId="user-3"
          onFetchLeaderboard={mockFetchLeaderboard}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/你的排名/)).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
      });
    });

    it('should highlight current user row', async () => {
      render(
        <LeaderboardPage
          currentUserId="user-2"
          onFetchLeaderboard={mockFetchLeaderboard}
        />
      );

      await waitFor(() => {
        const items = document.querySelectorAll('.leaderboard-item--current');
        expect(items.length).toBe(1);
      });
    });

    it('should not show rank when user not in list', async () => {
      render(
        <LeaderboardPage
          currentUserId="user-999"
          onFetchLeaderboard={mockFetchLeaderboard}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('玩家一')).toBeInTheDocument();
      });

      expect(screen.queryByText(/你的排名/)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error message on fetch failure', async () => {
      const failingFetch = jest.fn().mockRejectedValue(new Error('Network error'));

      render(<LeaderboardPage onFetchLeaderboard={failingFetch} />);

      await waitFor(() => {
        expect(screen.getByText('載入排行榜失敗')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      const emptyFetch = jest.fn().mockResolvedValue([]);

      render(<LeaderboardPage onFetchLeaderboard={emptyFetch} />);

      await waitFor(() => {
        expect(screen.getByText('暫無排行資料')).toBeInTheDocument();
      });
    });

    it('should handle null response', async () => {
      const nullFetch = jest.fn().mockResolvedValue(null);

      render(<LeaderboardPage onFetchLeaderboard={nullFetch} />);

      await waitFor(() => {
        expect(screen.getByText('暫無排行資料')).toBeInTheDocument();
      });
    });
  });

  describe('Player Click', () => {
    it('should call onPlayerClick when player is clicked', async () => {
      const onPlayerClick = jest.fn();

      render(
        <LeaderboardPage
          onFetchLeaderboard={mockFetchLeaderboard}
          onPlayerClick={onPlayerClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('玩家一')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('玩家一'));

      expect(onPlayerClick).toHaveBeenCalledWith(mockPlayers[0]);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <LeaderboardPage
          className="custom-leaderboard"
          onFetchLeaderboard={mockFetchLeaderboard}
        />
      );

      expect(container.firstChild).toHaveClass('leaderboard-page');
      expect(container.firstChild).toHaveClass('custom-leaderboard');
    });
  });

  describe('Table Header', () => {
    it('should render all column headers', () => {
      render(<LeaderboardPage onFetchLeaderboard={mockFetchLeaderboard} />);

      expect(screen.getByText('排名')).toBeInTheDocument();
      expect(screen.getByText('玩家')).toBeInTheDocument();
      expect(screen.getByText('場次')).toBeInTheDocument();
      expect(screen.getByText('勝場')).toBeInTheDocument();
      expect(screen.getByText('勝率')).toBeInTheDocument();
      expect(screen.getByText('總分')).toBeInTheDocument();
    });
  });
});

describe('LeaderboardItem', () => {
  const mockPlayer = {
    user_id: 'test-user',
    display_name: '測試玩家',
    games_played: 50,
    games_won: 25,
    win_rate: 50.0,
    total_score: 2500,
  };

  it('should render player info', () => {
    render(<LeaderboardItem rank={1} player={mockPlayer} />);

    expect(screen.getByText('測試玩家')).toBeInTheDocument();
    expect(screen.getByText('50 場')).toBeInTheDocument();
    expect(screen.getByText('25 勝')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText('2500 分')).toBeInTheDocument();
  });

  it('should show gold medal for rank 1', () => {
    render(<LeaderboardItem rank={1} player={mockPlayer} />);

    expect(screen.getByText('🥇')).toBeInTheDocument();
  });

  it('should show silver medal for rank 2', () => {
    render(<LeaderboardItem rank={2} player={mockPlayer} />);

    expect(screen.getByText('🥈')).toBeInTheDocument();
  });

  it('should show bronze medal for rank 3', () => {
    render(<LeaderboardItem rank={3} player={mockPlayer} />);

    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('should show number for rank > 3', () => {
    render(<LeaderboardItem rank={4} player={mockPlayer} />);

    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  it('should apply current user class', () => {
    const { container } = render(
      <LeaderboardItem rank={1} player={mockPlayer} isCurrentUser={true} />
    );

    expect(container.firstChild).toHaveClass('leaderboard-item--current');
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<LeaderboardItem rank={1} player={mockPlayer} onClick={onClick} />);

    fireEvent.click(screen.getByText('測試玩家'));

    expect(onClick).toHaveBeenCalledWith(mockPlayer);
  });

  it('should use user_id slice when no display_name', () => {
    const playerWithoutName = { ...mockPlayer, display_name: null, user_id: 'abcdefghijklmnop' };
    render(<LeaderboardItem rank={1} player={playerWithoutName} />);

    expect(screen.getByText('abcdefgh')).toBeInTheDocument();
  });

  it('should handle missing values', () => {
    const incompletePlayer = { user_id: 'incomplete' };
    render(<LeaderboardItem rank={5} player={incompletePlayer} />);

    expect(screen.getByText('0 場')).toBeInTheDocument();
    expect(screen.getByText('0 勝')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('0 分')).toBeInTheDocument();
  });
});

describe('Constants', () => {
  describe('LEADERBOARD_TYPES', () => {
    it('should have all types', () => {
      expect(LEADERBOARD_TYPES.ALL).toBe('all');
      expect(LEADERBOARD_TYPES.DAILY).toBe('daily');
      expect(LEADERBOARD_TYPES.WEEKLY).toBe('weekly');
    });
  });

  describe('RANK_ICONS', () => {
    it('should have medals for top 3', () => {
      expect(RANK_ICONS[1]).toBe('🥇');
      expect(RANK_ICONS[2]).toBe('🥈');
      expect(RANK_ICONS[3]).toBe('🥉');
    });
  });
});
