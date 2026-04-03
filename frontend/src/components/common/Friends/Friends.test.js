/**
 * Friends 組件測試
 * 工單 0065
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Friends from './Friends';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
let mockUser = { uid: 'test-uid', displayName: '測試用戶' };
jest.mock('../../../firebase', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock friendService
const mockGetFriends = jest.fn();
const mockGetFriendRequests = jest.fn();
const mockSearchPlayers = jest.fn();
const mockSendFriendRequest = jest.fn();
const mockRespondToFriendRequest = jest.fn();
const mockRemoveFriend = jest.fn();

jest.mock('../../../services/friendService', () => ({
  getFriends: (...args) => mockGetFriends(...args),
  getFriendRequests: (...args) => mockGetFriendRequests(...args),
  searchPlayers: (...args) => mockSearchPlayers(...args),
  sendFriendRequest: (...args) => mockSendFriendRequest(...args),
  respondToFriendRequest: (...args) => mockRespondToFriendRequest(...args),
  removeFriend: (...args) => mockRemoveFriend(...args),
}));

// Mock window.confirm
global.confirm = jest.fn();
global.alert = jest.fn();

describe('Friends 組件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: 'test-uid', displayName: '測試用戶' };
    mockGetFriends.mockResolvedValue([]);
    mockGetFriendRequests.mockResolvedValue([]);
    global.confirm.mockReturnValue(true);
  });

  describe('頁面渲染', () => {
    test('應顯示標題', async () => {
      render(<MemoryRouter><Friends /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('好友管理')).toBeInTheDocument();
      });
    });

    test('應顯示返回按鈕', async () => {
      render(<MemoryRouter><Friends /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText(/返回大廳/)).toBeInTheDocument();
      });
    });

    test('應顯示三個標籤頁', async () => {
      render(<MemoryRouter><Friends /></MemoryRouter>);
      await waitFor(() => {
        const tabs = document.querySelectorAll('.tab-btn');
        expect(tabs.length).toBe(3);
      });
    });
  });

  describe('好友清單', () => {
    test('無好友時顯示空狀態', async () => {
      mockGetFriends.mockResolvedValue([]);
      render(<MemoryRouter><Friends /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('還沒有好友')).toBeInTheDocument();
      });
    });

    test('顯示好友列表', async () => {
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '好友A',
            games_won: 5,
            games_played: 10,
            presence: { status: 'online' },
          },
        },
        {
          friend: {
            id: '2',
            display_name: '好友B',
            games_won: 3,
            games_played: 8,
            presence: { status: 'offline' },
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('好友A')).toBeInTheDocument();
        expect(screen.getByText('好友B')).toBeInTheDocument();
      });
    });

    test('顯示好友頭像佔位符', async () => {
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '小明',
            games_won: 0,
            games_played: 0,
            presence: { status: 'online' },
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('小')).toBeInTheDocument();
      });
    });

    test('顯示好友頭像圖片', async () => {
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '玩家',
            avatar_url: 'https://example.com/avatar.jpg',
            games_won: 0,
            games_played: 0,
            presence: { status: 'online' },
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        const img = screen.getAllByRole('img')[0];
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      });
    });

    test('刪除好友', async () => {
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '好友A',
            games_won: 0,
            games_played: 0,
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);
      mockRemoveFriend.mockResolvedValue({});

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('好友A')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('刪除'));

      await waitFor(() => {
        expect(mockRemoveFriend).toHaveBeenCalledWith('1', 'test-uid');
      });
    });

    test('取消刪除好友', async () => {
      global.confirm.mockReturnValue(false);
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '好友A',
            games_won: 0,
            games_played: 0,
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('好友A')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('刪除'));

      expect(mockRemoveFriend).not.toHaveBeenCalled();
    });
  });

  describe('好友請求', () => {
    test('無請求時顯示空狀態', async () => {
      mockGetFriendRequests.mockResolvedValue([]);
      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('請求'));

      await waitFor(() => {
        expect(screen.getByText('沒有待處理的好友請求')).toBeInTheDocument();
      });
    });

    test('顯示好友請求列表', async () => {
      const mockRequests = [
        {
          id: 1,
          from_user: { display_name: '玩家X' },
          message: 'Hello!',
        },
      ];
      mockGetFriendRequests.mockResolvedValue(mockRequests);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('請求'));

      await waitFor(() => {
        expect(screen.getByText('玩家X')).toBeInTheDocument();
        expect(screen.getByText('Hello!')).toBeInTheDocument();
      });
    });

    test('接受好友請求', async () => {
      const mockRequests = [{ id: 1, from_user: { display_name: '玩家X' } }];
      mockGetFriendRequests.mockResolvedValue(mockRequests);
      mockRespondToFriendRequest.mockResolvedValue({});

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('請求'));

      await waitFor(() => {
        expect(screen.getByText('玩家X')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('接受'));

      await waitFor(() => {
        expect(mockRespondToFriendRequest).toHaveBeenCalledWith(1, 'test-uid', 'accept');
      });
    });

    test('拒絕好友請求', async () => {
      const mockRequests = [{ id: 1, from_user: { display_name: '玩家X' } }];
      mockGetFriendRequests.mockResolvedValue(mockRequests);
      mockRespondToFriendRequest.mockResolvedValue({});

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('請求'));

      await waitFor(() => {
        expect(screen.getByText('玩家X')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('拒絕'));

      await waitFor(() => {
        expect(mockRespondToFriendRequest).toHaveBeenCalledWith(1, 'test-uid', 'reject');
      });
    });

    test('顯示請求數量徽章', async () => {
      const mockRequests = [
        { id: 1, from_user: { display_name: '玩家X' } },
        { id: 2, from_user: { display_name: '玩家Y' } },
      ];
      mockGetFriendRequests.mockResolvedValue(mockRequests);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('搜尋功能', () => {
    test('搜尋玩家', async () => {
      const mockResults = [
        { id: '1', display_name: '找到的玩家', games_won: 10, win_rate: 50 },
      ];
      mockSearchPlayers.mockResolvedValue(mockResults);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('搜尋'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/輸入玩家暱稱/)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText(/輸入玩家暱稱/), {
        target: { value: '測試' },
      });

      fireEvent.click(screen.getByText('搜尋', { selector: 'button.search-btn' }));

      await waitFor(() => {
        expect(mockSearchPlayers).toHaveBeenCalledWith('測試', 'test-uid');
        expect(screen.getByText('找到的玩家')).toBeInTheDocument();
      });
    });

    test('搜尋無結果', async () => {
      mockSearchPlayers.mockResolvedValue([]);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('搜尋'));

      fireEvent.change(screen.getByPlaceholderText(/輸入玩家暱稱/), {
        target: { value: '不存在的玩家' },
      });

      fireEvent.click(screen.getByText('搜尋', { selector: 'button.search-btn' }));

      await waitFor(() => {
        expect(screen.getByText('找不到符合的玩家')).toBeInTheDocument();
      });
    });

    test('搜尋字太短不搜尋', async () => {
      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('搜尋'));

      fireEvent.change(screen.getByPlaceholderText(/輸入玩家暱稱/), {
        target: { value: 'a' },
      });

      fireEvent.click(screen.getByText('搜尋', { selector: 'button.search-btn' }));

      expect(mockSearchPlayers).not.toHaveBeenCalled();
    });

    test('Enter 鍵搜尋', async () => {
      mockSearchPlayers.mockResolvedValue([]);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('搜尋'));

      const input = screen.getByPlaceholderText(/輸入玩家暱稱/);
      fireEvent.change(input, { target: { value: '測試' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSearchPlayers).toHaveBeenCalled();
      });
    });

    test('發送好友請求', async () => {
      const mockResults = [
        { id: 'player1', display_name: '玩家1', games_won: 10, win_rate: 50 },
      ];
      mockSearchPlayers.mockResolvedValue(mockResults);
      mockSendFriendRequest.mockResolvedValue({});

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('搜尋'));

      fireEvent.change(screen.getByPlaceholderText(/輸入玩家暱稱/), {
        target: { value: '測試' },
      });
      fireEvent.click(screen.getByText('搜尋', { selector: 'button.search-btn' }));

      await waitFor(() => {
        expect(screen.getByText('玩家1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('加好友'));

      await waitFor(() => {
        expect(mockSendFriendRequest).toHaveBeenCalledWith('test-uid', 'player1');
      });
    });

    test('自動接受好友請求', async () => {
      const mockResults = [
        { id: 'player1', display_name: '玩家1', games_won: 10, win_rate: 50 },
      ];
      mockSearchPlayers.mockResolvedValue(mockResults);
      mockSendFriendRequest.mockResolvedValue({ autoAccepted: true });

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('搜尋'));

      fireEvent.change(screen.getByPlaceholderText(/輸入玩家暱稱/), {
        target: { value: '測試' },
      });
      fireEvent.click(screen.getByText('搜尋', { selector: 'button.search-btn' }));

      await waitFor(() => {
        expect(screen.getByText('玩家1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('加好友'));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('已自動成為好友'));
      });
    });
  });

  describe('導航功能', () => {
    test('點擊返回按鈕應導航到首頁', async () => {
      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText(/返回大廳/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/返回大廳/));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('錯誤處理', () => {
    test('搜尋錯誤應顯示錯誤訊息', async () => {
      mockSearchPlayers.mockRejectedValue(new Error('搜尋失敗'));

      render(<MemoryRouter><Friends /></MemoryRouter>);

      fireEvent.click(screen.getByText('搜尋'));

      fireEvent.change(screen.getByPlaceholderText(/輸入玩家暱稱/), {
        target: { value: '測試' },
      });
      fireEvent.click(screen.getByText('搜尋', { selector: 'button.search-btn' }));

      await waitFor(() => {
        expect(screen.getByText('搜尋失敗')).toBeInTheDocument();
      });
    });

    test('刪除好友錯誤應顯示 alert', async () => {
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '好友A',
            games_won: 0,
            games_played: 0,
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);
      mockRemoveFriend.mockRejectedValue(new Error('刪除失敗'));

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText('好友A')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('刪除'));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('刪除失敗');
      });
    });
  });

  describe('狀態圖示', () => {
    test('顯示線上狀態', async () => {
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '好友A',
            games_won: 0,
            games_played: 0,
            presence: { status: 'online' },
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        const statusDot = document.querySelector('.status-dot.online');
        expect(statusDot).toBeInTheDocument();
      });
    });

    test('顯示遊戲中狀態', async () => {
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '好友A',
            games_won: 0,
            games_played: 0,
            presence: { status: 'in_game' },
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        const statusDot = document.querySelector('.status-dot.in-game');
        expect(statusDot).toBeInTheDocument();
      });
    });

    test('顯示離線狀態', async () => {
      const mockFriends = [
        {
          friend: {
            id: '1',
            display_name: '好友A',
            games_won: 0,
            games_played: 0,
            presence: { status: 'offline' },
          },
        },
      ];
      mockGetFriends.mockResolvedValue(mockFriends);

      render(<MemoryRouter><Friends /></MemoryRouter>);

      await waitFor(() => {
        const statusDot = document.querySelector('.status-dot.offline');
        expect(statusDot).toBeInTheDocument();
      });
    });
  });

  describe('無用戶狀態', () => {
    test('無用戶時不載入資料', async () => {
      mockUser = null;

      render(<MemoryRouter><Friends /></MemoryRouter>);

      expect(mockGetFriends).not.toHaveBeenCalled();
    });
  });
});
