/**
 * 好友服務測試
 */

import {
  searchPlayers,
  getFriends,
  getFriendRequests,
  getFriendRequestCount,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  sendGameInvitation,
  getGameInvitations,
  respondToGameInvitation,
} from './friendService';

// Mock fetch
global.fetch = jest.fn();

describe('friendService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchPlayers', () => {
    test('成功搜尋玩家', async () => {
      const mockData = [{ id: '1', display_name: '玩家A' }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await searchPlayers('玩家', 'uid123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/search?q=%E7%8E%A9%E5%AE%B6&firebaseUid=uid123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    test('搜尋失敗應拋出錯誤', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, message: '搜尋失敗' }),
      });

      await expect(searchPlayers('test', 'uid123')).rejects.toThrow('搜尋失敗');
    });
  });

  describe('getFriends', () => {
    test('成功取得好友列表', async () => {
      const mockData = [{ id: '1', display_name: '好友A' }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await getFriends('uid123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends?firebaseUid=uid123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getFriendRequests', () => {
    test('成功取得好友請求', async () => {
      const mockData = [{ id: 1, from_user: { display_name: '玩家A' } }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await getFriendRequests('uid123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/requests?firebaseUid=uid123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getFriendRequestCount', () => {
    test('成功取得好友請求數量', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { count: 5 } }),
      });

      const result = await getFriendRequestCount('uid123');

      expect(result).toBe(5);
    });
  });

  describe('sendFriendRequest', () => {
    test('成功發送好友請求', async () => {
      const mockData = { id: 1 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await sendFriendRequest('uid123', 'user456', 'Hello!');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/requests'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ firebaseUid: 'uid123', toUserId: 'user456', message: 'Hello!' }),
        })
      );
      expect(result).toEqual(mockData);
    });

    test('不帶訊息發送好友請求', async () => {
      const mockData = { id: 1 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      await sendFriendRequest('uid123', 'user456');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ firebaseUid: 'uid123', toUserId: 'user456', message: '' }),
        })
      );
    });
  });

  describe('respondToFriendRequest', () => {
    test('成功接受好友請求', async () => {
      const mockData = { success: true };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await respondToFriendRequest(1, 'uid123', 'accept');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/requests/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ firebaseUid: 'uid123', action: 'accept' }),
        })
      );
      expect(result).toEqual(mockData);
    });

    test('成功拒絕好友請求', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await respondToFriendRequest(1, 'uid123', 'reject');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ firebaseUid: 'uid123', action: 'reject' }),
        })
      );
    });
  });

  describe('removeFriend', () => {
    test('成功刪除好友', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await removeFriend('friend123', 'uid123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/friend123?firebaseUid=uid123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('sendGameInvitation', () => {
    test('成功發送遊戲邀請', async () => {
      const mockData = { id: 1 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await sendGameInvitation('uid123', 'user456', 'room789');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/invitations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ firebaseUid: 'uid123', toUserId: 'user456', roomId: 'room789' }),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getGameInvitations', () => {
    test('成功取得遊戲邀請', async () => {
      const mockData = [{ id: 1, room_id: 'room123' }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await getGameInvitations('uid123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/invitations?firebaseUid=uid123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('respondToGameInvitation', () => {
    test('成功接受遊戲邀請', async () => {
      const mockData = { room_id: 'room123' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await respondToGameInvitation(1, 'uid123', 'accept');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/invitations/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ firebaseUid: 'uid123', action: 'accept' }),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('錯誤處理', () => {
    test('無錯誤訊息時使用預設訊息', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      });

      await expect(getFriends('uid123')).rejects.toThrow('請求失敗');
    });

    test('success 為 false 時應拋出錯誤', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, message: '操作失敗' }),
      });

      await expect(getFriends('uid123')).rejects.toThrow('操作失敗');
    });
  });
});
