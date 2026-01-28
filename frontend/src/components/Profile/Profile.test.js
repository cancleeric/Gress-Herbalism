/**
 * Profile 組件單元測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
const mockLogout = jest.fn();
let mockUser = { uid: 'test-uid', displayName: '測試用戶', email: 'test@example.com', photoURL: null };

jest.mock('../../firebase', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

// Mock apiService
const mockGetPlayerStats = jest.fn();
const mockGetPlayerHistory = jest.fn();
jest.mock('../../services/apiService', () => ({
  getPlayerStats: (...args) => mockGetPlayerStats(...args),
  getPlayerHistory: (...args) => mockGetPlayerHistory(...args),
}));

describe('Profile 組件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: 'test-uid', displayName: '測試用戶', email: 'test@example.com', photoURL: null };
    mockGetPlayerStats.mockResolvedValue({ success: true, data: { games_played: 10, games_won: 5, win_rate: 50, total_score: 100, highest_score: 25 } });
    mockGetPlayerHistory.mockResolvedValue({ success: true, data: [] });
  });

  describe('頁面渲染', () => {
    test('應顯示返回按鈕', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText(/返回大廳/)).toBeInTheDocument();
      });
    });

    test('應顯示用戶名稱', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('測試用戶')).toBeInTheDocument();
      });
    });

    test('應顯示用戶郵箱', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    test('應顯示登出按鈕', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('登出')).toBeInTheDocument();
      });
    });

    test('載入中應顯示載入狀態', () => {
      mockGetPlayerStats.mockImplementation(() => new Promise(() => {}));
      mockGetPlayerHistory.mockImplementation(() => new Promise(() => {}));
      render(<MemoryRouter><Profile /></MemoryRouter>);
      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });
  });

  describe('統計數據', () => {
    test('應顯示遊戲統計', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('遊戲統計')).toBeInTheDocument();
      });
    });

    test('應顯示總場數', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('總場數')).toBeInTheDocument();
      });
    });

    test('應顯示勝率', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('勝率')).toBeInTheDocument();
      });
    });
  });

  describe('遊戲歷史', () => {
    test('無歷史記錄應顯示空狀態', async () => {
      mockGetPlayerHistory.mockResolvedValue({ success: true, data: [] });
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('還沒有遊戲記錄')).toBeInTheDocument();
      });
    });

    test('應顯示遊戲歷史', async () => {
      mockGetPlayerHistory.mockResolvedValue({
        success: true,
        data: [
          { is_winner: true, final_score: 7, game_history: { player_count: 3, rounds_played: 2 }, created_at: '2024-01-01' },
          { is_winner: false, final_score: 4, game_history: { player_count: 4, rounds_played: 3 }, created_at: '2024-01-02' },
        ],
      });
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('最近遊戲')).toBeInTheDocument();
      });
    });
  });

  describe('用戶資訊顯示', () => {
    test('工單 0175：匿名玩家應看到登入提示', async () => {
      mockUser = { uid: 'test-uid', displayName: '訪客', email: null, isAnonymous: true, photoURL: null };
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('登入 Google 帳號以解鎖完整功能')).toBeInTheDocument();
      });
      // 不應載入 API
      expect(mockGetPlayerStats).not.toHaveBeenCalled();
      expect(mockGetPlayerHistory).not.toHaveBeenCalled();
    });

    test('應顯示用戶頭像', async () => {
      mockUser = { uid: 'test-uid', displayName: '用戶', email: 'test@example.com', photoURL: 'https://example.com/avatar.jpg' };
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        const img = screen.getByAltText('頭像');
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      });
    });

    test('無頭像應顯示佔位符', async () => {
      mockUser = { uid: 'test-uid', displayName: '小明', email: 'test@example.com', photoURL: null };
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('小')).toBeInTheDocument();
      });
    });
  });

  describe('導航功能', () => {
    test('點擊返回按鈕應導航到首頁', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText(/返回大廳/)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/返回大廳/));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('點擊登出應呼叫 logout 並導航到登入頁', async () => {
      mockLogout.mockResolvedValue();
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('登出')).toBeInTheDocument());
      fireEvent.click(screen.getByText('登出'));
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('錯誤處理', () => {
    test('API 錯誤應顯示錯誤訊息和重新載入按鈕', async () => {
      mockGetPlayerStats.mockRejectedValue(new Error('API 錯誤'));
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('載入資料失敗，請稍後再試')).toBeInTheDocument();
        expect(screen.getByText('重新載入')).toBeInTheDocument();
      });
    });

    test('點擊重新載入應重新呼叫 API', async () => {
      mockGetPlayerStats.mockRejectedValueOnce(new Error('API 錯誤'));
      render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('重新載入')).toBeInTheDocument();
      });

      // 第二次呼叫成功
      mockGetPlayerStats.mockResolvedValue({ success: true, data: { games_played: 5, games_won: 2, win_rate: 40, total_score: 50, highest_score: 15 } });
      mockGetPlayerHistory.mockResolvedValue({ success: true, data: [] });
      fireEvent.click(screen.getByText('重新載入'));

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // games_played
      });
    });
  });
});
