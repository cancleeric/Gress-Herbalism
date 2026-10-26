/**
 * Profile 組件單元測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

jest.mock('../../../firebase', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

// Mock apiService
const mockGetPlayerStats = jest.fn();
const mockGetPlayerHistory = jest.fn();
jest.mock('../../../services/apiService', () => ({
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

  describe('畸形回應防護', () => {
    test.each([
      ['統計物件欄位', { success: true, data: { games_played: { count: 2 } } }, { success: true, data: [] }, '載入統計資料失敗'],
      ['空歷史列', { success: true, data: {} }, { success: true, data: [null] }, '載入歷史資料失敗'],
      ['歷史分數物件', { success: true, data: {} }, { success: true, data: [{ final_score: {}, created_at: '2024-01-01' }] }, '載入歷史資料失敗'],
      ['歷史人數物件', { success: true, data: {} }, { success: true, data: [{ final_score: 3, created_at: '2024-01-01', game_history: { player_count: {} } }] }, '載入歷史資料失敗'],
      ['無效日期', { success: true, data: {} }, { success: true, data: [{ final_score: 3, created_at: 'invalid' }] }, '載入歷史資料失敗'],
      ['非文字錯誤', { success: false, message: { detail: 'bad' } }, { success: true, data: [] }, '載入統計資料失敗'],
    ])('%s 不崩潰且允許重試', async (_, stats, history, message) => {
      mockGetPlayerStats.mockResolvedValueOnce(stats);
      mockGetPlayerHistory.mockResolvedValueOnce(history);
      render(<MemoryRouter><Profile /></MemoryRouter>);
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      fireEvent.click(screen.getByText('重新載入'));
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      expect(await screen.findByText('50%')).toBeInTheDocument();
    });

    test('保留 API 數字字串與空關聯的相容性', async () => {
      mockGetPlayerStats.mockResolvedValue({ success: true, data: { win_rate: '42.5', games_played: '8' } });
      mockGetPlayerHistory.mockResolvedValue({ success: true, data: [{ final_score: '12', created_at: '2024-01-01', game_history: null }] });
      render(<MemoryRouter><Profile /></MemoryRouter>);
      expect(await screen.findByText('42.5%')).toBeInTheDocument();
      expect(screen.getByText('得分：12')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('無效歷史不抹除有效統計', async () => {
      mockGetPlayerHistory.mockResolvedValue({ success: true, data: [null] });
      render(<MemoryRouter><Profile /></MemoryRouter>);
      expect(await screen.findByRole('alert')).toHaveTextContent('載入歷史資料失敗');
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
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
      expect(mockNavigate).toHaveBeenCalledWith(-1);
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

  describe('帳號與請求生命週期隔離', () => {
    function deferred() {
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      return { promise, resolve, reject };
    }
    function stats(score) {
      return { success: true, data: { games_played: 3, games_won: 1, win_rate: 33, total_score: score, highest_score: 2 } };
    }
    function history(score) {
      return { success: true, data: [{ final_score: score, created_at: '2024-01-01', is_winner: true }] };
    }

    test('舊帳號較慢回應不可覆蓋新帳號統計或歷史', async () => {
      const oldStats = deferred(), oldHistory = deferred();
      mockGetPlayerStats.mockImplementation(uid => uid === 'test-uid' ? oldStats.promise : Promise.resolve(stats(2222)));
      mockGetPlayerHistory.mockImplementation(uid => uid === 'test-uid' ? oldHistory.promise : Promise.resolve(history(2233)));
      const { rerender } = render(<MemoryRouter><Profile /></MemoryRouter>);
      mockUser = { uid: 'other-uid', displayName: '新帳號' };
      rerender(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('2222')).toBeInTheDocument());
      await act(async () => { oldStats.resolve(stats(1111)); oldHistory.resolve(history(1122)); });
      expect(screen.getByText('2222')).toBeInTheDocument();
      expect(screen.getByText('得分：2233')).toBeInTheDocument();
      expect(screen.queryByText('1111')).not.toBeInTheDocument();
      expect(screen.queryByText('得分：1122')).not.toBeInTheDocument();
    });

    test('新帳號第一個commit即隱藏舊資料，API失敗後也不恢復舊資料', async () => {
      const commits = [], pending = deferred();
      function Probe() {
        React.useLayoutEffect(() => { commits.push(document.body.textContent); });
        return <Profile />;
      }
      mockGetPlayerStats.mockResolvedValue(stats(8887));
      mockGetPlayerHistory.mockResolvedValue(history(8877));
      const { rerender } = render(<MemoryRouter><Probe /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('8887')).toBeInTheDocument());
      commits.length = 0;
      mockGetPlayerStats.mockReturnValue(pending.promise);
      mockGetPlayerHistory.mockResolvedValue({ success: false });
      mockUser = { uid: 'other-uid', displayName: '新帳號' };
      rerender(<MemoryRouter><Probe /></MemoryRouter>);
      expect(commits.length).toBeGreaterThan(0);
      expect(commits.every(text => !text.includes('8887') && !text.includes('8877'))).toBe(true);
      await act(async () => pending.resolve({ success: false }));
      expect(screen.getByText('載入統計資料失敗')).toBeInTheDocument();
      expect(screen.queryByText('8887')).not.toBeInTheDocument();
      expect(screen.queryByText('得分：8877')).not.toBeInTheDocument();
    });

    test('未登入不取資料也不永久載入，登入後可正常取資料', async () => {
      mockUser = null;
      const { rerender } = render(<MemoryRouter><Profile /></MemoryRouter>);
      expect(screen.getByText('請先登入以查看個人資料')).toBeInTheDocument();
      expect(mockGetPlayerStats).not.toHaveBeenCalled();
      expect(mockGetPlayerHistory).not.toHaveBeenCalled();
      mockUser = { uid: 'new-uid', displayName: '登入後' };
      rerender(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('登入後')).toBeInTheDocument());
      expect(mockGetPlayerStats).toHaveBeenCalledWith('new-uid');
    });

    test('相同uid的新user物件只更新基本資料，不重新抓取統計', async () => {
      const { rerender } = render(<MemoryRouter><Profile /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText('測試用戶')).toBeInTheDocument());
      mockUser = { ...mockUser, displayName: '更新名稱' };
      rerender(<MemoryRouter><Profile /></MemoryRouter>);
      expect(screen.getByText('更新名稱')).toBeInTheDocument();
      expect(mockGetPlayerStats).toHaveBeenCalledTimes(1);
      expect(mockGetPlayerHistory).toHaveBeenCalledTimes(1);
    });

    test('變為訪客後忽略舊錯誤，且不把舊資料帶到下一次登入', async () => {
      const old = deferred();
      const log = jest.spyOn(console, 'error').mockImplementation(() => {});
      try {
        mockGetPlayerStats.mockReturnValueOnce(old.promise);
        const { rerender } = render(<MemoryRouter><Profile /></MemoryRouter>);
        mockUser = { uid: 'guest-uid', isAnonymous: true };
        rerender(<MemoryRouter><Profile /></MemoryRouter>);
        await act(async () => old.reject(new Error('obsolete private error')));
        expect(screen.getByText('登入 Google 帳號以解鎖完整功能')).toBeInTheDocument();
        expect(mockGetPlayerStats).toHaveBeenCalledTimes(1);
        mockUser = { uid: 'other-uid', displayName: '新帳號' };
        rerender(<MemoryRouter><Profile /></MemoryRouter>);
        await waitFor(() => expect(screen.getByText('新帳號')).toBeInTheDocument());
        expect(screen.queryByText('載入資料失敗，請稍後再試')).not.toBeInTheDocument();
        expect(log).not.toHaveBeenCalled();
      } finally { log.mockRestore(); }
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
