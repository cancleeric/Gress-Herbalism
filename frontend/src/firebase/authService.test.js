/**
 * authService 測試
 * 工單 0065
 */

// Mock firebase/auth before importing
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  getRedirectResult: jest.fn(),
  signInAnonymously: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  linkWithPopup: jest.fn(),
}));

jest.mock('./config', () => ({
  auth: {
    currentUser: null,
  },
}));

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  linkWithPopup,
} from 'firebase/auth';

import {
  signInWithGoogle,
  signInAsGuest,
  upgradeAnonymousToGoogle,
  logOut,
  getCurrentUser,
  onAuthChange,
  handleRedirectResult,
} from './authService';

import { auth } from './config';

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.currentUser = null;
  });

  describe('signInWithGoogle', () => {
    test('成功登入返回用戶資料', async () => {
      const mockUser = {
        uid: 'test-uid',
        displayName: '測試用戶',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      };
      signInWithPopup.mockResolvedValue({ user: mockUser });

      const result = await signInWithGoogle();

      expect(result.success).toBe(true);
      expect(result.user.uid).toBe('test-uid');
      expect(result.user.displayName).toBe('測試用戶');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.isAnonymous).toBe(false);
    });

    test('popup 被阻擋應降級為 redirect', async () => {
      signInWithPopup.mockRejectedValue({ code: 'auth/popup-blocked' });
      signInWithRedirect.mockResolvedValue();

      const result = await signInWithGoogle();

      expect(signInWithRedirect).toHaveBeenCalled();
      expect(result.redirecting).toBe(true);
    });

    test('popup 被關閉應降級為 redirect', async () => {
      signInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
      signInWithRedirect.mockResolvedValue();

      const result = await signInWithGoogle();

      expect(signInWithRedirect).toHaveBeenCalled();
      expect(result.redirecting).toBe(true);
    });

    test('popup 取消應降級為 redirect', async () => {
      signInWithPopup.mockRejectedValue({ code: 'auth/cancelled-popup-request' });
      signInWithRedirect.mockResolvedValue();

      const result = await signInWithGoogle();

      expect(signInWithRedirect).toHaveBeenCalled();
      expect(result.redirecting).toBe(true);
    });

    test('redirect 降級也失敗應返回錯誤', async () => {
      signInWithPopup.mockRejectedValue({ code: 'auth/popup-blocked' });
      signInWithRedirect.mockRejectedValue({ code: 'auth/network-request-failed' });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('網路連線失敗，請檢查網路連線');
    });

    test('網路錯誤返回錯誤', async () => {
      signInWithPopup.mockRejectedValue({ code: 'auth/network-request-failed' });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('網路連線失敗，請檢查網路連線');
    });

    test('configuration-not-found 錯誤', async () => {
      signInWithPopup.mockRejectedValue({
        code: 'auth/configuration-not-found',
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toContain('登入服務尚未設定完成');
    });

    test('未知錯誤返回預設訊息', async () => {
      signInWithPopup.mockRejectedValue({ code: 'unknown-error' });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('登入失敗，請稍後再試');
    });
  });

  describe('signInAsGuest', () => {
    test('匿名登入成功', async () => {
      const mockUser = {
        uid: 'anonymous-uid',
        displayName: null,
        email: null,
        photoURL: null,
      };
      signInAnonymously.mockResolvedValue({ user: mockUser });

      const result = await signInAsGuest();

      expect(result.success).toBe(true);
      expect(result.user.uid).toBe('anonymous-uid');
      expect(result.user.isAnonymous).toBe(true);
    });

    test('匿名登入失敗', async () => {
      signInAnonymously.mockRejectedValue({ code: 'auth/operation-not-allowed' });

      const result = await signInAsGuest();

      expect(result.success).toBe(false);
      expect(result.error).toBe('此登入方式尚未啟用，請聯繫管理員');
    });
  });

  describe('upgradeAnonymousToGoogle', () => {
    test('非匿名用戶返回錯誤', async () => {
      auth.currentUser = { isAnonymous: false };

      const result = await upgradeAnonymousToGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('目前不是匿名使用者');
    });

    test('無用戶返回錯誤', async () => {
      auth.currentUser = null;

      const result = await upgradeAnonymousToGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('目前不是匿名使用者');
    });

    test('升級成功', async () => {
      const mockUser = {
        uid: 'upgraded-uid',
        displayName: '升級用戶',
        email: 'upgraded@example.com',
        photoURL: 'https://example.com/photo.jpg',
      };
      auth.currentUser = { isAnonymous: true };
      linkWithPopup.mockResolvedValue({ user: mockUser });

      const result = await upgradeAnonymousToGoogle();

      expect(result.success).toBe(true);
      expect(result.user.uid).toBe('upgraded-uid');
      expect(result.user.isAnonymous).toBe(false);
    });

    test('升級失敗', async () => {
      auth.currentUser = { isAnonymous: true };
      linkWithPopup.mockRejectedValue({ code: 'auth/credential-already-in-use' });

      const result = await upgradeAnonymousToGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('此憑證已被其他帳號使用');
    });
  });

  describe('logOut', () => {
    test('登出成功', async () => {
      signOut.mockResolvedValue();

      const result = await logOut();

      expect(result.success).toBe(true);
      expect(signOut).toHaveBeenCalled();
    });

    test('登出失敗', async () => {
      signOut.mockRejectedValue({ code: 'auth/internal-error' });

      const result = await logOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('內部錯誤，請稍後再試');
    });
  });

  describe('getCurrentUser', () => {
    test('有用戶時返回用戶資料', () => {
      auth.currentUser = {
        uid: 'test-uid',
        displayName: '測試用戶',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
        isAnonymous: false,
      };

      const result = getCurrentUser();

      expect(result.uid).toBe('test-uid');
      expect(result.displayName).toBe('測試用戶');
      expect(result.email).toBe('test@example.com');
    });

    test('無用戶時返回 null', () => {
      auth.currentUser = null;

      const result = getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('onAuthChange', () => {
    test('用戶登入時呼叫 callback', () => {
      const callback = jest.fn();
      const mockUser = {
        uid: 'test-uid',
        displayName: '測試用戶',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
        isAnonymous: false,
      };

      onAuthStateChanged.mockImplementation((auth, cb) => {
        cb(mockUser);
        return jest.fn();
      });

      onAuthChange(callback);

      expect(callback).toHaveBeenCalledWith({
        isLoggedIn: true,
        user: expect.objectContaining({
          uid: 'test-uid',
          displayName: '測試用戶',
        }),
      });
    });

    test('用戶登出時呼叫 callback', () => {
      const callback = jest.fn();

      onAuthStateChanged.mockImplementation((auth, cb) => {
        cb(null);
        return jest.fn();
      });

      onAuthChange(callback);

      expect(callback).toHaveBeenCalledWith({
        isLoggedIn: false,
        user: null,
      });
    });

    test('返回取消監聽函數', () => {
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthChange(jest.fn());

      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('錯誤處理', () => {
    test('錯誤訊息包含 configuration-not-found 時返回對應訊息', async () => {
      signInWithPopup.mockRejectedValue({
        code: '',
        message: 'Firebase: Error (auth/configuration-not-found).',
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toContain('登入服務尚未設定完成');
    });

    test('帳號已存在錯誤', async () => {
      signInWithPopup.mockRejectedValue({
        code: 'auth/account-exists-with-different-credential',
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('此信箱已使用其他方式註冊');
    });

    test('帳號被停用錯誤', async () => {
      signInWithPopup.mockRejectedValue({
        code: 'auth/user-disabled',
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('此帳號已被停用');
    });

    test('請求次數過多錯誤', async () => {
      signInWithPopup.mockRejectedValue({
        code: 'auth/too-many-requests',
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('登入嘗試次數過多，請稍後再試');
    });

    test('無效憑證錯誤', async () => {
      signInWithPopup.mockRejectedValue({
        code: 'auth/invalid-credential',
      });

      const result = await signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('登入憑證無效');
    });
  });

  describe('handleRedirectResult', () => {
    test('有 redirect 結果時返回用戶資料', async () => {
      const mockUser = {
        uid: 'redirect-uid',
        displayName: 'Redirect 用戶',
        email: 'redirect@example.com',
        photoURL: 'https://example.com/photo.jpg',
      };
      getRedirectResult.mockResolvedValue({ user: mockUser });

      const result = await handleRedirectResult();

      expect(result.success).toBe(true);
      expect(result.user.uid).toBe('redirect-uid');
      expect(result.user.displayName).toBe('Redirect 用戶');
      expect(result.user.isAnonymous).toBe(false);
    });

    test('無 redirect 結果時返回 null', async () => {
      getRedirectResult.mockResolvedValue(null);

      const result = await handleRedirectResult();

      expect(result).toBeNull();
    });

    test('redirect 結果處理失敗返回錯誤', async () => {
      getRedirectResult.mockRejectedValue({ code: 'auth/internal-error' });

      const result = await handleRedirectResult();

      expect(result.success).toBe(false);
      expect(result.error).toBe('內部錯誤，請稍後再試');
    });
  });
});
