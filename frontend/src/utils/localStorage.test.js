/**
 * LocalStorage 工具函數測試
 */

import {
  savePlayerName,
  getPlayerName,
  clearPlayerName,
  savePlayerSettings,
  getPlayerSettings,
  STORAGE_KEYS
} from './localStorage';

describe('localStorage 工具函數', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
  });

  describe('savePlayerName', () => {
    test('應該儲存玩家暱稱', () => {
      savePlayerName('測試玩家');
      expect(localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)).toBe('測試玩家');
    });

    test('應該自動去除前後空白', () => {
      savePlayerName('  小明  ');
      expect(localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)).toBe('小明');
    });

    test('空字串不應該被儲存', () => {
      savePlayerName('');
      expect(localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)).toBeNull();
    });

    test('只有空白的字串不應該被儲存', () => {
      savePlayerName('   ');
      expect(localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)).toBeNull();
    });

    test('null 不應該被儲存', () => {
      savePlayerName(null);
      expect(localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)).toBeNull();
    });
  });

  describe('getPlayerName', () => {
    test('應該取得儲存的玩家暱稱', () => {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, '小華');
      expect(getPlayerName()).toBe('小華');
    });

    test('沒有儲存時應該返回空字串', () => {
      expect(getPlayerName()).toBe('');
    });
  });

  describe('clearPlayerName', () => {
    test('應該清除儲存的玩家暱稱', () => {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, '小明');
      clearPlayerName();
      expect(localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)).toBeNull();
    });
  });

  describe('savePlayerSettings', () => {
    test('應該儲存玩家設定物件', () => {
      const settings = { soundEnabled: true, theme: 'dark' };
      savePlayerSettings(settings);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYER_SETTINGS))).toEqual(settings);
    });
  });

  describe('getPlayerSettings', () => {
    test('應該取得儲存的玩家設定', () => {
      const settings = { soundEnabled: false, theme: 'light' };
      localStorage.setItem(STORAGE_KEYS.PLAYER_SETTINGS, JSON.stringify(settings));
      expect(getPlayerSettings()).toEqual(settings);
    });

    test('沒有儲存時應該返回空物件', () => {
      expect(getPlayerSettings()).toEqual({});
    });
  });
});
