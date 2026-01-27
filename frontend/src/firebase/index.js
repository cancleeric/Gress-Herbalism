/**
 * Firebase 模組導出
 * 工單 0059
 */

export { auth } from './config';
export {
  signInWithGoogle,
  signInAsGuest,
  logOut,
  getCurrentUser,
  onAuthChange,
  upgradeAnonymousToGoogle,
  handleRedirectResult,
} from './authService';
export { AuthProvider, useAuth } from './AuthContext';
