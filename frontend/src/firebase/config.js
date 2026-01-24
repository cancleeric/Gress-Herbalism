/**
 * Firebase 設定檔
 * 工單 0059
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyBcC4wmLCbFB_IJZGtJh1-yMh0NfXRkuNo',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'gress-6270d.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'gress-6270d',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'gress-6270d.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '130514813450',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:130514813450:web:491d1089367fadfb5e15f3',
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 取得 Auth 實例
export const auth = getAuth(app);

export default app;
