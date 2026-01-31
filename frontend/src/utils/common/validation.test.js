/**
 * 驗證工具函數測試
 */

import {
  validatePlayerName,
  getPlayerNameError,
  validateRoomPassword,
  getRoomPasswordError
} from './validation';

describe('驗證工具函數', () => {
  describe('validatePlayerName', () => {
    test('有效的暱稱應返回 true', () => {
      expect(validatePlayerName('小明')).toBe(true);
      expect(validatePlayerName('Player1')).toBe(true);
      expect(validatePlayerName('測試玩家名稱')).toBe(true);
    });

    test('太短的暱稱應返回 false', () => {
      expect(validatePlayerName('A')).toBe(false);
      expect(validatePlayerName('我')).toBe(false);
    });

    test('太長的暱稱應返回 false', () => {
      expect(validatePlayerName('這是一個超級長的暱稱名字超過十二')).toBe(false);
    });

    test('包含危險字元的暱稱應返回 false', () => {
      expect(validatePlayerName('<script>')).toBe(false);
      expect(validatePlayerName('test"name')).toBe(false);
      expect(validatePlayerName("test'name")).toBe(false);
      expect(validatePlayerName('test&name')).toBe(false);
    });

    test('空字串應返回 false', () => {
      expect(validatePlayerName('')).toBe(false);
      expect(validatePlayerName('   ')).toBe(false);
    });

    test('null 和 undefined 應返回 false', () => {
      expect(validatePlayerName(null)).toBe(false);
      expect(validatePlayerName(undefined)).toBe(false);
    });
  });

  describe('getPlayerNameError', () => {
    test('有效的暱稱應返回 null', () => {
      expect(getPlayerNameError('小明')).toBeNull();
      expect(getPlayerNameError('Player123')).toBeNull();
    });

    test('空暱稱應返回適當的錯誤訊息', () => {
      expect(getPlayerNameError('')).toBe('請輸入暱稱');
      expect(getPlayerNameError('   ')).toBe('請輸入暱稱');
    });

    test('太短的暱稱應返回適當的錯誤訊息', () => {
      expect(getPlayerNameError('A')).toBe('暱稱至少需要 2 個字元');
    });

    test('太長的暱稱應返回適當的錯誤訊息', () => {
      expect(getPlayerNameError('這是超過十二個字的暱稱名字')).toBe('暱稱不能超過 12 個字元');
    });

    test('包含特殊字元應返回適當的錯誤訊息', () => {
      expect(getPlayerNameError('<test>')).toBe('暱稱不能包含特殊字元（<, >, ", \', &）');
    });
  });

  describe('validateRoomPassword', () => {
    test('有效的密碼應返回 true', () => {
      expect(validateRoomPassword('1234')).toBe(true);
      expect(validateRoomPassword('password123')).toBe(true);
      expect(validateRoomPassword('1234567890123456')).toBe(true);
    });

    test('太短的密碼應返回 false', () => {
      expect(validateRoomPassword('123')).toBe(false);
    });

    test('太長的密碼應返回 false', () => {
      expect(validateRoomPassword('12345678901234567')).toBe(false);
    });

    test('空密碼應返回 false', () => {
      expect(validateRoomPassword('')).toBe(false);
      expect(validateRoomPassword(null)).toBe(false);
    });
  });

  describe('getRoomPasswordError', () => {
    test('有效的密碼應返回 null', () => {
      expect(getRoomPasswordError('1234')).toBeNull();
      expect(getRoomPasswordError('abcd1234')).toBeNull();
    });

    test('空密碼應返回適當的錯誤訊息', () => {
      expect(getRoomPasswordError('')).toBe('請輸入密碼');
      expect(getRoomPasswordError(null)).toBe('請輸入密碼');
    });

    test('太短的密碼應返回適當的錯誤訊息', () => {
      expect(getRoomPasswordError('123')).toBe('密碼至少需要 4 個字元');
    });

    test('太長的密碼應返回適當的錯誤訊息', () => {
      expect(getRoomPasswordError('12345678901234567')).toBe('密碼不能超過 16 個字元');
    });
  });
});
