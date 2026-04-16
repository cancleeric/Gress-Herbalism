/**
 * Leaderboard 組件單元測試
 * 工單 0060 - ELO 積分制
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Leaderboard from './Leaderboard';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock apiService
const mockGetLeaderboard = jest.fn();
jest.mock('../../../services/apiService', () => ({
  getLeaderboard: (...args) => mockGetLeaderboard(...args),
}));

describe('Leaderboard 組件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLeaderboard.mockResolvedValue({ success: true, data: [] });
  });

  describe('頁面渲染', () => {
    test('應顯示排行榜標題', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText(/排行榜/)).toBeInTheDocument();
      });
    });

    test('應顯示返回按鈕', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText(/返回大廳/)).toBeInTheDocument();
      });
    });

    test('應顯示排序選項', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('ELO 積分')).toBeInTheDocument();
        expect(screen.getByText('勝場數')).toBeInTheDocument();
        expect(screen.getByText('勝率')).toBeInTheDocument();
        expect(screen.getByText('總得分')).toBeInTheDocument();
      });
    });

    test('載入中應顯示載入狀態', () => {
      mockGetLeaderboard.mockImplementation(() => new Promise(() => {}));
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    test('預設應使用 ELO 積分排序', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(mockGetLeaderboard).toHaveBeenCalledWith('elo_rating', 100);
      });
    });
  });

  describe('排行榜數據', () => {
    test('應顯示排行榜數據', async () => {
      const mockData = [
        { id: '1', rank: 1, display_name: '玩家A', games_played: 10, games_won: 8, win_rate: 80, total_score: 100, elo_rating: 1200, season_peak_elo: 1250 },
        { id: '2', rank: 2, display_name: '玩家B', games_played: 10, games_won: 6, win_rate: 60, total_score: 80, elo_rating: 1100, season_peak_elo: 1150 },
      ];
      mockGetLeaderboard.mockResolvedValue({ success: true, data: mockData });

      render(<MemoryRouter><Leaderboard /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('玩家A')).toBeInTheDocument();
        expect(screen.getByText('玩家B')).toBeInTheDocument();
      });
    });

    test('無數據時應顯示空狀態', async () => {
      mockGetLeaderboard.mockResolvedValue({ success: true, data: [] });
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('暫無排行資料')).toBeInTheDocument();
      });
    });

    test('前三名應顯示獎牌', async () => {
      const mockData = [
        { id: '1', rank: 1, display_name: '第一名', games_played: 10, games_won: 10, win_rate: 100, total_score: 120, elo_rating: 1400, season_peak_elo: 1400 },
        { id: '2', rank: 2, display_name: '第二名', games_played: 10, games_won: 8, win_rate: 80, total_score: 100, elo_rating: 1300, season_peak_elo: 1300 },
        { id: '3', rank: 3, display_name: '第三名', games_played: 10, games_won: 6, win_rate: 60, total_score: 80, elo_rating: 1200, season_peak_elo: 1200 },
        { id: '4', rank: 4, display_name: '第四名', games_played: 10, games_won: 4, win_rate: 40, total_score: 60, elo_rating: 1100, season_peak_elo: 1100 },
      ];
      mockGetLeaderboard.mockResolvedValue({ success: true, data: mockData });
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('第一名')).toBeInTheDocument();
        expect(screen.getByText('第四名')).toBeInTheDocument();
      });
    });

    test('應顯示玩家頭像佔位符', async () => {
      const mockData = [
        { id: '1', rank: 1, display_name: '小明', games_played: 10, games_won: 8, win_rate: 80, total_score: 100, elo_rating: 1200, season_peak_elo: 1200 },
      ];
      mockGetLeaderboard.mockResolvedValue({ success: true, data: mockData });
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('小')).toBeInTheDocument();
      });
    });

    test('應顯示玩家頭像圖片', async () => {
      const mockData = [
        { id: '1', rank: 1, display_name: '玩家', avatar_url: 'https://example.com/avatar.jpg', games_played: 10, games_won: 8, win_rate: 80, total_score: 100, elo_rating: 1200, season_peak_elo: 1200 },
      ];
      mockGetLeaderboard.mockResolvedValue({ success: true, data: mockData });
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      });
    });

    test('ELO 積分模式應顯示 ELO 和賽季峰值欄', async () => {
      const mockData = [
        { id: '1', rank: 1, display_name: '玩家A', games_played: 10, games_won: 8, win_rate: 80, total_score: 100, elo_rating: 1200, season_peak_elo: 1250 },
      ];
      mockGetLeaderboard.mockResolvedValue({ success: true, data: mockData });
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('ELO')).toBeInTheDocument();
        expect(screen.getByText('賽季峰值')).toBeInTheDocument();
        expect(screen.getByText('1200')).toBeInTheDocument();
      });
    });
  });

  describe('排序功能', () => {
    test('點擊勝場數應切換排序', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('勝場數')).toBeInTheDocument());
      fireEvent.click(screen.getByText('勝場數'));
      await waitFor(() => {
        expect(mockGetLeaderboard).toHaveBeenCalledWith('games_won', 100);
      });
    });

    test('點擊勝率應切換排序', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('勝率')).toBeInTheDocument());
      fireEvent.click(screen.getByText('勝率'));
      await waitFor(() => {
        expect(mockGetLeaderboard).toHaveBeenCalledWith('win_rate', 100);
      });
    });

    test('點擊總得分應切換排序', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('總得分')).toBeInTheDocument());
      fireEvent.click(screen.getByText('總得分'));
      await waitFor(() => {
        expect(mockGetLeaderboard).toHaveBeenCalledWith('total_score', 100);
      });
    });

    test('點擊 ELO 積分應切換排序', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('ELO 積分')).toBeInTheDocument());
      fireEvent.click(screen.getByText('ELO 積分'));
      await waitFor(() => {
        expect(mockGetLeaderboard).toHaveBeenCalledWith('elo_rating', 100);
      });
    });
  });

  describe('導航功能', () => {
    test('點擊返回按鈕應導航到首頁', async () => {
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText(/返回大廳/)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/返回大廳/));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('錯誤處理', () => {
    test('API 錯誤應顯示錯誤訊息', async () => {
      mockGetLeaderboard.mockRejectedValue(new Error('API 錯誤'));
      render(<MemoryRouter><Leaderboard /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('載入排行榜失敗')).toBeInTheDocument();
      });
    });
  });
});
