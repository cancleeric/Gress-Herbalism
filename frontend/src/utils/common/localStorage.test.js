/**
 * LocalStorage 工具函數測試
 */

import {
  savePlayerName,
  getPlayerName,
  clearPlayerName,
  savePlayerSettings,
  getPlayerSettings,
  saveCurrentRoom,
  getCurrentRoom,
  clearCurrentRoom,
  hasCompletedHerbalismTutorial,
  setHerbalismTutorialCompleted,
  resetHerbalismTutorial,
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

  describe('錯誤處理', () => {
    test('savePlayerName - localStorage 錯誤時不應拋出異常', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });

      expect(() => savePlayerName('測試')).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    test('getPlayerName - localStorage 錯誤時應返回空字串', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('Access denied');
      });

      expect(getPlayerName()).toBe('');

      localStorage.getItem = originalGetItem;
    });

    test('clearPlayerName - localStorage 錯誤時不應拋出異常', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => clearPlayerName()).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });

    test('savePlayerSettings - localStorage 錯誤時不應拋出異常', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });

      expect(() => savePlayerSettings({ theme: 'dark' })).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    test('getPlayerSettings - localStorage 錯誤時應返回空物件', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('Access denied');
      });

      expect(getPlayerSettings()).toEqual({});

      localStorage.getItem = originalGetItem;
    });

    test('getPlayerSettings - JSON 解析錯誤時應返回空物件', () => {
      localStorage.setItem(STORAGE_KEYS.PLAYER_SETTINGS, 'invalid json');
      expect(getPlayerSettings()).toEqual({});
    });
  });

  // ====================================================================
  // 工單 0203：房間重連 localStorage 函數測試
  // ====================================================================

  describe('saveCurrentRoom', () => {
    test('TC-0203-09：應儲存完整房間資訊並附加 timestamp', () => {
      saveCurrentRoom({ roomId: 'room1', playerId: 'p1', playerName: '玩家A' });
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM));
      expect(saved.roomId).toBe('room1');
      expect(saved.playerId).toBe('p1');
      expect(saved.playerName).toBe('玩家A');
      expect(saved.timestamp).toBeDefined();
      expect(typeof saved.timestamp).toBe('number');
    });

    test('saveCurrentRoom - localStorage 錯誤時不應拋出異常', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });

      expect(() => saveCurrentRoom({ roomId: 'room1', playerId: 'p1', playerName: '玩家A' })).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('getCurrentRoom', () => {
    test('TC-0203-10：過期機制應在 2 小時後返回 null', () => {
      const expired = {
        roomId: 'room1', playerId: 'p1', playerName: '玩家A',
        timestamp: Date.now() - 3 * 60 * 60 * 1000  // 3 小時前
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(expired));
      expect(getCurrentRoom()).toBeNull();
    });

    test('TC-0203-11：應正常讀取未過期的資料', () => {
      const recent = {
        roomId: 'room1', playerId: 'p1', playerName: '玩家A',
        timestamp: Date.now() - 30 * 60 * 1000  // 30 分鐘前
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(recent));
      const result = getCurrentRoom();
      expect(result).not.toBeNull();
      expect(result.roomId).toBe('room1');
    });

    test('TC-0203-13：應容忍損壞的 JSON', () => {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, 'not valid json {{{');
      expect(getCurrentRoom()).toBeNull();
    });

    test('TC-0203-14：無資料時應返回 null', () => {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM);
      expect(getCurrentRoom()).toBeNull();
    });

    test('過期資料應被自動清除', () => {
      const expired = {
        roomId: 'room1', playerId: 'p1', playerName: '玩家A',
        timestamp: Date.now() - 3 * 60 * 60 * 1000
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(expired));
      getCurrentRoom(); // 觸發過期清除
      expect(localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM)).toBeNull();
    });
  });

  describe('clearCurrentRoom', () => {
    test('TC-0203-12：clearCurrentRoom 後 getCurrentRoom 應返回 null', () => {
      saveCurrentRoom({ roomId: 'room1', playerId: 'p1', playerName: '玩家A' });
      expect(getCurrentRoom()).not.toBeNull();
      clearCurrentRoom();
      expect(getCurrentRoom()).toBeNull();
    });

    test('clearCurrentRoom - localStorage 錯誤時不應拋出異常', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => clearCurrentRoom()).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('本草教學狀態', () => {
    test('預設應為未完成', () => {
      expect(hasCompletedHerbalismTutorial()).toBe(false);
    });

    test('應可設定為完成', () => {
      setHerbalismTutorialCompleted(true);
      expect(hasCompletedHerbalismTutorial()).toBe(true);
    });

    test('應可設定為未完成', () => {
      setHerbalismTutorialCompleted(false);
      expect(hasCompletedHerbalismTutorial()).toBe(false);
    });

    test('重設後應回到未完成', () => {
      setHerbalismTutorialCompleted(true);
      resetHerbalismTutorial();
      expect(hasCompletedHerbalismTutorial()).toBe(false);
    });
  });
});
