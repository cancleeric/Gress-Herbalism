/**
 * Firebase Authentication 服務
 * 工單 0059
 */

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  'auth/unauthorized-domain': '此網域未被授權使用 Google 登入，請聯繫管理員在 Firebase Console 中新增授權網域',
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
 * 判斷是否為 popup 相關錯誤，可降級為 redirect
 * @param {string} errorCode - Firebase 錯誤碼
 * @returns {boolean}
 */
function isPopupError(errorCode) {
  return errorCode === 'auth/popup-blocked' ||
         errorCode === 'auth/popup-closed-by-user' ||
         errorCode === 'auth/cancelled-popup-request';
}

/**
 * 使用 Google 帳號登入
 * 先嘗試 popup，若 popup 失敗則自動降級為 redirect
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

    // popup 相關錯誤：自動降級為 redirect
    if (isPopupError(error.code)) {
      try {
        await signInWithRedirect(auth, googleProvider);
        // redirect 會離開頁面，不會返回結果
        return { success: false, redirecting: true, error: '正在跳轉到 Google 登入頁面...' };
      } catch (redirectError) {
        console.error('Redirect 登入也失敗:', redirectError.code, redirectError.message);
        return {
          success: false,
          error: getErrorMessage(redirectError),
          errorCode: redirectError.code,
        };
      }
    }

    return {
      success: false,
      error: getErrorMessage(error),
      errorCode: error.code,
    };
  }
}

/**
 * 處理 redirect 登入結果
 * 應在應用初始化時呼叫，處理從 Google 登入頁面返回的結果
 * @returns {Promise<object|null>} 使用者資料，若無 redirect 結果則返回 null
 */
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
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
    }
    return null;
  } catch (error) {
    console.error('Redirect 結果處理失敗:', error.code, error.message);
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
