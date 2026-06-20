/**
 * Firebase 設定檔
 * 工單 0059
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * 從環境變數讀取必填設定，缺少即 fail-fast。
 * 真值來源：Hurricane Vault hurricanedigital/dev/firebase-*
 * 或 CI 環境變數（build time 注入）。
 */
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requireEnv('REACT_APP_FIREBASE_API_KEY'),
  authDomain: requireEnv('REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('REACT_APP_FIREBASE_APP_ID'),
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 取得 Auth 實例
export const auth = getAuth(app);

export default app;
