/**
 * API 服務層測試
 *
 * P1 安全修復（2026-06-14）：
 * - syncPlayer 不再傳 firebaseUid（後端從 Bearer token 取，不信任前端傳入的 uid）
 * - apiRequest 自動帶 Authorization: Bearer <id_token>（若已登入）
 */

import {
  syncPlayer,
  getPlayerStats,
  getPlayerHistory,
  getLeaderboard,
  healthCheck,
} from './apiService';

// Mock Firebase config（避免 import 觸發 Firebase 初始化）
jest.mock('../firebase/config', () => ({
  auth: {
    currentUser: null,  // 預設未登入，可在各測試中 override
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('apiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncPlayer', () => {
    test('成功同步玩家資料（P1：不傳 firebaseUid）', async () => {
      const mockResponse = { success: true, data: { id: '123' } };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // P1：傳入時含 firebaseUid，但 syncPlayer 應自動剔除它
      const userData = { firebaseUid: 'uid123', displayName: '測試玩家', email: 'test@example.com' };
      const result = await syncPlayer(userData);

      // 確認：URL 正確
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/players/sync'),
        expect.objectContaining({
          method: 'POST',
          // P1：body 不包含 firebaseUid（已由後端從 token 取）
          body: JSON.stringify({ displayName: '測試玩家', email: 'test@example.com' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('同步失敗應拋出錯誤', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: '同步失敗' }),
      });

      const userData = { firebaseUid: 'uid123' };
      await expect(syncPlayer(userData)).rejects.toThrow('同步失敗');
    });
  });

  describe('getPlayerStats', () => {
    test('成功取得玩家統計', async () => {
      const mockResponse = { success: true, data: { games_played: 10, games_won: 5 } };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getPlayerStats('uid123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/players/uid123/stats'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    test('取得統計失敗應拋出錯誤', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: '玩家不存在' }),
      });

      await expect(getPlayerStats('invalid-uid')).rejects.toThrow('玩家不存在');
    });
  });

  describe('getPlayerHistory', () => {
    test('成功取得玩家歷史', async () => {
      const mockResponse = { success: true, data: [{ id: '1', is_winner: true }] };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getPlayerHistory('uid123', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/players/uid123/history?limit=10'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    test('使用預設 limit', async () => {
      const mockResponse = { success: true, data: [] };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getPlayerHistory('uid123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      );
    });
  });

  describe('getLeaderboard', () => {
    test('成功取得排行榜', async () => {
      const mockResponse = { success: true, data: [{ rank: 1, display_name: '玩家A' }] };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getLeaderboard('games_won', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/leaderboard?orderBy=games_won&limit=10'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    test('使用預設參數', async () => {
      const mockResponse = { success: true, data: [] };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getLeaderboard();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('orderBy=total_score&limit=10'),
        expect.any(Object)
      );
    });
  });

  describe('healthCheck', () => {
    test('成功執行健康檢查', async () => {
      const mockResponse = { status: 'ok' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await healthCheck();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    test('健康檢查失敗應拋出錯誤', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: '伺服器錯誤' }),
      });

      await expect(healthCheck()).rejects.toThrow('伺服器錯誤');
    });

    test('無錯誤訊息時使用預設訊息', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(healthCheck()).rejects.toThrow('請求失敗');
    });
  });

  describe('請求標頭', () => {
    test('應包含正確的 Content-Type', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await healthCheck();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('P1：未登入時不帶 Authorization header', async () => {
      // auth.currentUser = null（預設 mock）
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      });

      await healthCheck();

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('Authorization');
    });

    test('P1：已登入時帶 Authorization: Bearer <idToken>', async () => {
      // 模擬已登入的使用者
      const { auth } = require('../firebase/config');
      auth.currentUser = {
        getIdToken: jest.fn().mockResolvedValue('fake-token'),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      });

      await healthCheck();

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty('Authorization', 'Bearer fake-token');

      // 還原為未登入狀態，避免影響其他測試
      auth.currentUser = null;
    });
  });
});
