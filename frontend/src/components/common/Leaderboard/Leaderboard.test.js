import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Leaderboard from './Leaderboard';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockGetLeaderboard = jest.fn();
const mockGetPlayerEloHistory = jest.fn();
jest.mock('../../../services/apiService', () => ({
  getLeaderboard: (...args) => mockGetLeaderboard(...args),
  getPlayerEloHistory: (...args) => mockGetPlayerEloHistory(...args),
}));

jest.mock('../../../firebase/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'firebase-uid-1' },
  }),
}));

describe('Leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLeaderboard.mockResolvedValue({ success: true, data: [] });
    mockGetPlayerEloHistory.mockResolvedValue({ success: true, data: [] });
  });

  test('should load global ELO leaderboard by default', async () => {
    render(<MemoryRouter><Leaderboard /></MemoryRouter>);

    await waitFor(() => {
      expect(mockGetLeaderboard).toHaveBeenCalledWith('elo_rating', 100, 'global');
    });
  });

  test('should switch to season leaderboard', async () => {
    render(<MemoryRouter><Leaderboard /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('賽季排名')).toBeInTheDocument());
    fireEvent.click(screen.getByText('賽季排名'));

    await waitFor(() => {
      expect(mockGetLeaderboard).toHaveBeenCalledWith('season_current_elo', 100, 'season');
    });
  });

  test('should render player ELO values', async () => {
    mockGetLeaderboard.mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          rank: 1,
          firebase_uid: 'firebase-uid-1',
          display_name: '玩家A',
          elo_rating: 1020,
          season_current_elo: 1010,
          games_played: 10,
          games_won: 7,
          season_games_played: 3,
          season_games_won: 2,
          win_rate: 70,
          total_score: 120,
        },
      ],
    });

    mockGetPlayerEloHistory.mockResolvedValue({
      success: true,
      data: [
        { elo_after: 1000 },
        { elo_after: 1012 },
        { elo_after: 1020 },
      ],
    });

    render(<MemoryRouter><Leaderboard /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('玩家A')).toBeInTheDocument();
      expect(screen.getByText('我的排名：#1（ELO: 1020）')).toBeInTheDocument();
    });
  });
});
