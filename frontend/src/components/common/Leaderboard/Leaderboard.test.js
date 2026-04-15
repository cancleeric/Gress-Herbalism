import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Leaderboard from './Leaderboard';

const mockNavigate = jest.fn();
const mockGetEloLeaderboard = jest.fn();
const mockGetPlayerEloHistory = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../services/apiService', () => ({
  getEloLeaderboard: (...args) => mockGetEloLeaderboard(...args),
  getPlayerEloHistory: (...args) => mockGetPlayerEloHistory(...args),
}));

jest.mock('../../../firebase', () => ({
  useAuth: () => ({ user: { uid: 'uid-1' } }),
}));

describe('Leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEloLeaderboard.mockResolvedValue({ success: true, data: [] });
    mockGetPlayerEloHistory.mockResolvedValue({ success: true, data: [] });
  });

  test('應顯示 ELO 排行榜標題', async () => {
    render(<MemoryRouter><Leaderboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('全球排行榜（ELO）')).toBeInTheDocument());
  });

  test('應載入全球排行榜', async () => {
    mockGetEloLeaderboard.mockResolvedValue({
      success: true,
      data: [{ id: 'p1', rank: 1, display_name: '玩家A', games_played: 10, games_won: 7, elo_rating: 1234 }],
    });

    render(<MemoryRouter><Leaderboard /></MemoryRouter>);

    await waitFor(() => {
      expect(mockGetEloLeaderboard).toHaveBeenCalledWith({ scope: 'global', limit: 100 });
      expect(screen.getByText('玩家A')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
    });
  });

  test('切換賽季排行應重新查詢', async () => {
    render(<MemoryRouter><Leaderboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('賽季排行')).toBeInTheDocument());
    fireEvent.click(screen.getByText('賽季排行'));
    await waitFor(() => {
      expect(mockGetEloLeaderboard).toHaveBeenCalledWith({ scope: 'season', limit: 100 });
    });
  });

  test('應顯示 Top 10 徽章（賽季）', async () => {
    mockGetEloLeaderboard.mockResolvedValue({
      success: true,
      data: [{ id: 'p1', rank: 3, display_name: '玩家A', games_played: 10, games_won: 7, elo_rating: 1234 }],
    });

    render(<MemoryRouter><Leaderboard /></MemoryRouter>);
    fireEvent.click(screen.getByText('賽季排行'));

    await waitFor(() => {
      expect(screen.getByText('Top 10')).toBeInTheDocument();
    });
  });

  test('API 錯誤應顯示提示', async () => {
    mockGetEloLeaderboard.mockRejectedValue(new Error('fail'));
    render(<MemoryRouter><Leaderboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('載入排行榜失敗')).toBeInTheDocument();
    });
  });

  test('ELO 歷史查詢失敗仍應穩定渲染', async () => {
    mockGetPlayerEloHistory.mockRejectedValue(new Error('history fail'));
    render(<MemoryRouter><Leaderboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('暫無足夠資料繪製曲線')).toBeInTheDocument();
    });
  });
});
