/**
 * Auth Context - 全局登入狀態管理
 * 工單 0059, 0142
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthChange,
  signInWithGoogle,
  signInAsGuest,
  logOut,
  upgradeAnonymousToGoogle,
  handleRedirectResult,
} from './authService';
import { syncPlayer } from '../services/apiService';
import { initSocket, setPresence } from '../services/socketService';
import store from '../store/gameStore';
import { evolutionActions } from '../store/evolution/evolutionStore';

// 建立 Context
const AuthContext = createContext(null);

/**
 * E2E 測試 mock 版 AuthProvider
 * 僅在 REACT_APP_E2E=1 build 中編譯進來，生產 build 不包含此元件
 * cy.login() 透過 window.__CYPRESS_E2E_AUTH 注入 mock 用戶資料
 */
/* istanbul ignore next */
function E2EAuthProvider({ children }) {
  const mockUser = (typeof window !== 'undefined' && window.__CYPRESS_E2E_AUTH) || {
    uid: 'e2e-test-user',
    displayName: 'E2E Test User',
    isAnonymous: true,
    photoURL: null,
  };
  const mockValue = {
    isLoading: false,
    isLoggedIn: true,
    user: mockUser,
    loginWithGoogle: () => Promise.resolve({ success: true }),
    loginAsGuest: () => Promise.resolve({ success: true }),
    upgradeToGoogle: () => Promise.resolve({ success: true }),
    logout: () => Promise.resolve({ success: true }),
  };
  return (
    <AuthContext.Provider value={mockValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 真實 Firebase Auth Provider（生產用）
 */
function RealAuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isLoggedIn: false,
    user: null,
  });

  // 處理 redirect 登入結果（從 Google 登入頁面返回時）
  useEffect(() => {
    handleRedirectResult().catch((err) => {
      console.error('處理 redirect 登入結果失敗');
    });
  }, []);

  // 監聽登入狀態變化
  useEffect(() => {
    const unsubscribe = onAuthChange((state) => {
      // Clear previous identity's private game data before publishing new auth state.
      // Same-UID refresh/profile updates deliberately retain the current room.
      store.dispatch(evolutionActions.setOwnerUid(state.user?.uid || null));
      // 先更新登入狀態 — auth 狀態以 Firebase 為準，
      // 不可被後端同步呼叫阻塞（backend 不可達時 await 會卡死，
      // isLoggedIn 永遠不翻轉，用戶被困在 /login）
      setAuthState({
        isLoading: false,
        isLoggedIn: state.isLoggedIn,
        user: state.user,
      });

      // 用戶登入成功時，背景同步資料到後端（fire-and-forget）
      if (state.isLoggedIn && state.user) {
        (async () => {
          try {
            await syncPlayer({
              firebaseUid: state.user.uid,
              displayName: state.user.displayName || '玩家',
              email: state.user.email,
              avatarUrl: state.user.photoURL,
            });

            // 工單 0176：登入後發送線上狀態
            if (!state.user.isAnonymous) {
              initSocket();
              setPresence(state.user.uid);
            }
          } catch (err) {
            console.error('同步玩家資料失敗');
          }
        })();
      }
    });

    return () => unsubscribe();
  }, []);

  // 登入方法
  const loginWithGoogle = async () => {
    const result = await signInWithGoogle();
    return result;
  };

  const loginAsGuest = async () => {
    const result = await signInAsGuest();
    return result;
  };

  const upgradeToGoogle = async () => {
    const result = await upgradeAnonymousToGoogle();
    return result;
  };

  const logout = async () => {
    const result = await logOut();
    return result;
  };

  const value = {
    ...authState,
    loginWithGoogle,
    loginAsGuest,
    upgradeToGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Auth Provider 組件
 * REACT_APP_E2E=1 時使用 E2EAuthProvider（mock），否則使用真實 Firebase auth
 * process.env.REACT_APP_E2E 在 webpack build 時被替換為字面量，
 * 生產 build 不含 E2EAuthProvider 邏輯
 */
export function AuthProvider({ children }) {
  if (process.env.REACT_APP_E2E === '1') {
    return <E2EAuthProvider>{children}</E2EAuthProvider>;
  }
  return <RealAuthProvider>{children}</RealAuthProvider>;
}

/**
 * 使用 Auth Context 的 Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
