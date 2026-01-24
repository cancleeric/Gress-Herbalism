/**
 * Auth Context - 全局登入狀態管理
 * 工單 0059
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthChange,
  signInWithGoogle,
  signInAsGuest,
  logOut,
  upgradeAnonymousToGoogle,
} from './authService';

// 建立 Context
const AuthContext = createContext(null);

/**
 * Auth Provider 組件
 */
export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isLoggedIn: false,
    user: null,
  });

  // 監聽登入狀態變化
  useEffect(() => {
    const unsubscribe = onAuthChange((state) => {
      setAuthState({
        isLoading: false,
        isLoggedIn: state.isLoggedIn,
        user: state.user,
      });
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
