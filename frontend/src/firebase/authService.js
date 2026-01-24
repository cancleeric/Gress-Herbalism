/**
 * Firebase Authentication 服務
 * 工單 0059
 */

import {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  linkWithPopup,
} from 'firebase/auth';
import { auth } from './config';

// Google 登入提供者
const googleProvider = new GoogleAuthProvider();

/**
 * 使用 Google 帳號登入
 * @returns {Promise<object>} 使用者資料
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      success: true,
      user: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        isAnonymous: false,
      },
    };
  } catch (error) {
    console.error('Google 登入失敗:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 匿名登入
 * @returns {Promise<object>} 使用者資料
 */
export async function signInAsGuest() {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;
    return {
      success: true,
      user: {
        uid: user.uid,
        displayName: null,
        email: null,
        photoURL: null,
        isAnonymous: true,
      },
    };
  } catch (error) {
    console.error('匿名登入失敗:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 將匿名帳號升級為 Google 帳號
 * @returns {Promise<object>} 使用者資料
 */
export async function upgradeAnonymousToGoogle() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.isAnonymous) {
      return {
        success: false,
        error: '目前不是匿名使用者',
      };
    }

    const result = await linkWithPopup(currentUser, googleProvider);
    const user = result.user;
    return {
      success: true,
      user: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        isAnonymous: false,
      },
    };
  } catch (error) {
    console.error('帳號升級失敗:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 登出
 * @returns {Promise<object>} 結果
 */
export async function logOut() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('登出失敗:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 取得目前使用者
 * @returns {object|null} 使用者資料
 */
export function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

/**
 * 監聽登入狀態變化
 * @param {function} callback - 狀態變化時的回調函數
 * @returns {function} 取消監聽的函數
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        isLoggedIn: true,
        user: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous,
        },
      });
    } else {
      callback({
        isLoggedIn: false,
        user: null,
      });
    }
  });
}

export { auth };
