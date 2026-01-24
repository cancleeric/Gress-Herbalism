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
 * Firebase 錯誤碼對應的中文訊息
 */
const ERROR_MESSAGES = {
  'auth/configuration-not-found': '登入服務尚未設定完成，請聯繫管理員啟用 Firebase Authentication',
  'auth/popup-closed-by-user': '登入視窗已關閉',
  'auth/popup-blocked': '登入視窗被瀏覽器阻擋，請允許彈出視窗',
  'auth/cancelled-popup-request': '登入已取消',
  'auth/network-request-failed': '網路連線失敗，請檢查網路連線',
  'auth/too-many-requests': '登入嘗試次數過多，請稍後再試',
  'auth/user-disabled': '此帳號已被停用',
  'auth/operation-not-allowed': '此登入方式尚未啟用，請聯繫管理員',
  'auth/invalid-credential': '登入憑證無效',
  'auth/account-exists-with-different-credential': '此信箱已使用其他方式註冊',
  'auth/credential-already-in-use': '此憑證已被其他帳號使用',
  'auth/internal-error': '內部錯誤，請稍後再試',
};

/**
 * 將 Firebase 錯誤轉換為用戶友好的中文訊息
 * @param {Error} error - Firebase 錯誤
 * @returns {string} 中文錯誤訊息
 */
function getErrorMessage(error) {
  // 從錯誤訊息中提取錯誤碼
  const errorCode = error.code || '';

  // 查找對應的中文訊息
  if (ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // 如果錯誤訊息包含 configuration-not-found，返回對應訊息
  if (error.message && error.message.includes('configuration-not-found')) {
    return ERROR_MESSAGES['auth/configuration-not-found'];
  }

  // 預設訊息
  return '登入失敗，請稍後再試';
}

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
    console.error('Google 登入失敗:', error.code, error.message);
    return {
      success: false,
      error: getErrorMessage(error),
      errorCode: error.code,
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
    console.error('匿名登入失敗:', error.code, error.message);
    return {
      success: false,
      error: getErrorMessage(error),
      errorCode: error.code,
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
    console.error('帳號升級失敗:', error.code, error.message);
    return {
      success: false,
      error: getErrorMessage(error),
      errorCode: error.code,
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
    console.error('登出失敗:', error.code, error.message);
    return {
      success: false,
      error: getErrorMessage(error),
      errorCode: error.code,
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
