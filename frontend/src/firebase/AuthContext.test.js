/**
 * AuthContext 測試
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import store from '../store/gameStore';
import evolutionReducer, { evolutionActions } from '../store/evolution/evolutionStore';
jest.mock('../store/gameStore', () => ({ __esModule: true, default: { dispatch: jest.fn() } }));

// This suite verifies context transitions, not Firebase/network configuration.
jest.mock('../services/apiService', () => ({ syncPlayer: jest.fn().mockResolvedValue({}) }));
jest.mock('../services/socketService', () => ({ initSocket: jest.fn(), setPresence: jest.fn() }));

// Mock authService
const mockOnAuthChange = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignInAsGuest = jest.fn();
const mockLogOut = jest.fn();
const mockUpgradeAnonymousToGoogle = jest.fn();
const mockHandleRedirectResult = jest.fn();

jest.mock('./authService', () => ({
  onAuthChange: (callback) => mockOnAuthChange(callback),
  signInWithGoogle: () => mockSignInWithGoogle(),
  signInAsGuest: () => mockSignInAsGuest(),
  logOut: () => mockLogOut(),
  upgradeAnonymousToGoogle: () => mockUpgradeAnonymousToGoogle(),
  handleRedirectResult: () => mockHandleRedirectResult(),
}));

// 測試用組件
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{auth.isLoading.toString()}</span>
      <span data-testid="loggedIn">{auth.isLoggedIn.toString()}</span>
      <span data-testid="user">{auth.user?.displayName || 'null'}</span>
      <button onClick={auth.loginWithGoogle}>Google Login</button>
      <button onClick={auth.loginAsGuest}>Guest Login</button>
      <button onClick={auth.logout}>Logout</button>
      <button onClick={auth.upgradeToGoogle}>Upgrade</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 模擬 handleRedirectResult 預設返回 null（無 redirect）
    mockHandleRedirectResult.mockResolvedValue(null);
    // 模擬 onAuthChange 返回一個取消訂閱函數
    mockOnAuthChange.mockImplementation((callback) => {
      // 立即呼叫回調模擬初始狀態
      callback({ isLoggedIn: false, user: null });
      return () => {};
    });
  });

  describe('AuthProvider', () => {
    test('初始狀態應為載入中', () => {
      mockOnAuthChange.mockImplementation(() => () => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    test('登入後應更新狀態', async () => {
      const mockUser = { displayName: '測試用戶', email: 'test@example.com' };

      mockOnAuthChange.mockImplementation((callback) => {
        setTimeout(() => {
          callback({ isLoggedIn: true, user: mockUser });
        }, 0);
        return () => {};
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loggedIn')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('測試用戶');
      });
    });

    test('未登入應顯示未登入狀態', async () => {
      mockOnAuthChange.mockImplementation((callback) => {
        callback({ isLoggedIn: false, user: null });
        return () => {};
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loggedIn')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });

  describe('登入方法', () => {
    test('loginWithGoogle 應呼叫 signInWithGoogle', async () => {
      mockSignInWithGoogle.mockResolvedValue({ success: true });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Google Login').click();
      });

      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });

    test('loginAsGuest 應呼叫 signInAsGuest', async () => {
      mockSignInAsGuest.mockResolvedValue({ success: true });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Guest Login').click();
      });

      expect(mockSignInAsGuest).toHaveBeenCalled();
    });

    test('logout 應呼叫 logOut', async () => {
      mockLogOut.mockResolvedValue({ success: true });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Logout').click();
      });

      expect(mockLogOut).toHaveBeenCalled();
    });

    test('upgradeToGoogle 應呼叫 upgradeAnonymousToGoogle', async () => {
      mockUpgradeAnonymousToGoogle.mockResolvedValue({ success: true });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Upgrade').click();
      });

      expect(mockUpgradeAnonymousToGoogle).toHaveBeenCalled();
    });
  });

  describe('useAuth', () => {
    test('在 AuthProvider 外使用應拋出錯誤', () => {
      // 抑制錯誤輸出
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('清理', () => {
    test('卸載時應取消訂閱', () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthChange.mockImplementation((callback) => {
        callback({ isLoggedIn: false, user: null });
        return mockUnsubscribe;
      });

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

describe('Evolution identity cleanup bridge', () => {
 let notify;
 let evolutionState;
 beforeEach(() => {
  evolutionState = evolutionReducer(undefined, evolutionActions.bindRoomContext({ uid: 'uid-A', roomId: 'room-A', playerId: 'seat-A' }));
  evolutionState = evolutionReducer(evolutionState, evolutionActions.setGameState({ phase: 'evolution', players: { 'seat-A': { hand: ['private-A'], creatures: [] } } }));
  store.dispatch.mockImplementation(action => { evolutionState = evolutionReducer(evolutionState, action); });
  mockOnAuthChange.mockImplementation(callback => { notify = callback; return () => {}; });
  mockHandleRedirectResult.mockResolvedValue(null);
 });
 afterEach(() => store.dispatch.mockReset());
 function Observer() {
  const auth = useAuth();
  return <div data-testid="identity-private">{auth.user?.uid || 'none'}:{evolutionState.myHand.join(',')}</div>;
 }
 test('new UID clears previous private state before publishing next identity', () => {
  render(<AuthProvider><Observer /></AuthProvider>);
  act(() => notify({ isLoggedIn: true, user: { uid: 'uid-B', isAnonymous: true } }));
  expect(screen.getByTestId('identity-private')).toHaveTextContent('uid-B:');
  expect(screen.getByTestId('identity-private')).not.toHaveTextContent('private-A');
  expect(evolutionState.ownerUid).toBe('uid-B');
 });
 test('logout clears private state; same UID auth/profile updates preserve it', () => {
  render(<AuthProvider><Observer /></AuthProvider>);
  act(() => notify({ isLoggedIn: true, user: { uid: 'uid-A', isAnonymous: true } }));
  expect(evolutionState.myHand).toEqual(['private-A']);
  act(() => notify({ isLoggedIn: false, user: null }));
  expect(evolutionState.myHand).toEqual([]); expect(evolutionState.ownerUid).toBeNull();
 });
});
