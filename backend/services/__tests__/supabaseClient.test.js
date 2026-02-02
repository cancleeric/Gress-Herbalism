/**
 * SupabaseClient 測試
 */

describe('SupabaseClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('when environment variables are not set', () => {
    beforeEach(() => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_KEY;
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return false for isSupabaseEnabled', () => {
      const { isSupabaseEnabled } = require('../supabaseClient');
      expect(isSupabaseEnabled()).toBe(false);
    });

    it('should return null for getSupabase', () => {
      const { getSupabase } = require('../supabaseClient');
      expect(getSupabase()).toBeNull();
    });

    it('should log a warning', () => {
      require('../supabaseClient');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('環境變數未設定')
      );
    });
  });

  describe('when environment variables are set', () => {
    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
    });

    it('should return true for isSupabaseEnabled', () => {
      // Mock createClient
      jest.mock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({ from: jest.fn() })),
      }));

      const { isSupabaseEnabled } = require('../supabaseClient');
      expect(isSupabaseEnabled()).toBe(true);
    });
  });

  describe('module exports', () => {
    it('should export supabase, getSupabase, and isSupabaseEnabled', () => {
      const exports = require('../supabaseClient');

      expect(exports).toHaveProperty('supabase');
      expect(exports).toHaveProperty('getSupabase');
      expect(exports).toHaveProperty('isSupabaseEnabled');
      expect(typeof exports.getSupabase).toBe('function');
      expect(typeof exports.isSupabaseEnabled).toBe('function');
    });
  });
});
