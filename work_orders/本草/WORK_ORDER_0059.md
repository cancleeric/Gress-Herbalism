# 工作單 0059

**日期：** 2026-01-24

**工作單標題：** Firebase Auth 整合

**工單主旨：** 帳號系統 - 整合 Firebase Authentication 實現多種登入方式

**內容：**

## 目標

整合 Firebase Authentication，支援 Google 登入、Email/密碼登入、匿名登入三種方式。

## 功能需求

### 1. Google 登入
- 一鍵使用 Google 帳號登入
- 自動取得使用者名稱和頭像

### 2. Email/密碼登入
- 傳統註冊方式
- 支援忘記密碼功能

### 3. 匿名登入
- 不想註冊的訪客可以直接進入
- 之後可以升級為正式帳號

### 4. 登入狀態管理
- 記住登入狀態
- 自動登入功能
- 登出功能

## 技術實作

### 階段 1：Firebase 專案設置

#### 1.1 建立 Firebase 專案
1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 點擊「新增專案」
3. 輸入專案名稱：`gress-game`
4. 選擇是否啟用 Google Analytics（選填）
5. 建立專案

#### 1.2 新增 Web 應用程式
1. 在專案首頁點擊「</> Web」圖示
2. 輸入應用程式名稱：`gress-frontend`
3. 複製 Firebase 設定資訊

#### 1.3 啟用 Authentication
1. 左側選單 → Authentication → 開始使用
2. Sign-in method 頁籤
3. 啟用以下提供者：
   - **Google**：啟用並設定專案支援電子郵件
   - **電子郵件/密碼**：啟用
   - **匿名**：啟用

### 階段 2：前端整合

#### 2.1 安裝 Firebase SDK

```bash
cd frontend
npm install firebase
```

#### 2.2 Firebase 設定檔

```javascript
// frontend/src/firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 取得 Auth 實例
export const auth = getAuth(app);

export default app;
```

#### 2.3 環境變數設定

```bash
# frontend/.env.local
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=gress-game.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=gress-game
REACT_APP_FIREBASE_STORAGE_BUCKET=gress-game.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### 2.4 Auth 服務層

```javascript
// frontend/src/services/authService.js

import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase/config';

// ==================== 登入方法 ====================

/**
 * Google 登入
 * @returns {Promise<User>} Firebase User 物件
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  // 強制選擇帳號（即使只有一個帳號）
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Email/密碼登入
 * @param {string} email - 電子郵件
 * @param {string} password - 密碼
 * @returns {Promise<User>} Firebase User 物件
 */
export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Email/密碼註冊
 * @param {string} email - 電子郵件
 * @param {string} password - 密碼
 * @param {string} displayName - 顯示名稱
 * @returns {Promise<User>} Firebase User 物件
 */
export async function registerWithEmail(email, password, displayName) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // 設定顯示名稱
    await updateProfile(result.user, { displayName });

    return result.user;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * 匿名登入
 * @returns {Promise<User>} Firebase User 物件
 */
export async function signInAsGuest() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * 登出
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    throw handleAuthError(error);
  }
}

// ==================== 帳號管理 ====================

/**
 * 發送密碼重設郵件
 * @param {string} email - 電子郵件
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * 更新使用者資料
 * @param {object} profile - { displayName, photoURL }
 */
export async function updateUserProfile(profile) {
  try {
    await updateProfile(auth.currentUser, profile);
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * 匿名帳號升級為 Email 帳號
 * @param {string} email - 電子郵件
 * @param {string} password - 密碼
 */
export async function upgradeAnonymousAccount(email, password) {
  const credential = EmailAuthProvider.credential(email, password);
  try {
    await linkWithCredential(auth.currentUser, credential);
  } catch (error) {
    throw handleAuthError(error);
  }
}

// ==================== 狀態監聽 ====================

/**
 * 監聽登入狀態變化
 * @param {function} callback - 回調函數，接收 user 參數
 * @returns {function} 取消監聽的函數
 */
export function onAuthStateChange(callback) {
  return auth.onAuthStateChanged(callback);
}

/**
 * 取得目前使用者
 * @returns {User|null} Firebase User 物件或 null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * 取得目前使用者的 ID Token
 * @returns {Promise<string>} ID Token
 */
export async function getIdToken() {
  if (!auth.currentUser) {
    throw new Error('使用者未登入');
  }
  return auth.currentUser.getIdToken();
}

// ==================== 錯誤處理 ====================

/**
 * 處理 Firebase Auth 錯誤
 * @param {Error} error - Firebase 錯誤
 * @returns {Error} 帶有中文訊息的錯誤
 */
function handleAuthError(error) {
  const errorMessages = {
    'auth/email-already-in-use': '此電子郵件已被使用',
    'auth/invalid-email': '無效的電子郵件格式',
    'auth/operation-not-allowed': '此登入方式未啟用',
    'auth/weak-password': '密碼強度不足，請使用至少 6 個字元',
    'auth/user-disabled': '此帳號已被停用',
    'auth/user-not-found': '找不到此帳號',
    'auth/wrong-password': '密碼錯誤',
    'auth/too-many-requests': '嘗試次數過多，請稍後再試',
    'auth/popup-closed-by-user': '登入視窗已關閉',
    'auth/network-request-failed': '網路連線失敗',
    'auth/invalid-credential': '登入憑證無效',
  };

  const message = errorMessages[error.code] || `登入失敗：${error.message}`;
  const newError = new Error(message);
  newError.code = error.code;
  return newError;
}
```

#### 2.5 Auth Context（狀態管理）

```jsx
// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, logout as authLogout } from '../services/authService';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 監聽登入狀態變化
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    // 清理監聽
    return unsubscribe;
  }, []);

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

#### 2.6 登入頁面組件

```jsx
// frontend/src/components/Auth/LoginPage.jsx

import React, { useState } from 'react';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signInAsGuest,
  resetPassword,
} from '../../services/authService';
import './LoginPage.css';

function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAsGuest();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          throw new Error('請輸入暱稱');
        }
        await registerWithEmail(email, password, displayName);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('密碼重設郵件已發送，請檢查您的信箱');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>🎴 Gress 推理桌遊</h1>

        {/* Google 登入 */}
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <img src="/images/google-icon.svg" alt="Google" />
          使用 Google 登入
        </button>

        <div className="divider">
          <span>或</span>
        </div>

        {/* Email 表單 */}
        <form onSubmit={handleEmailSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>暱稱</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="輸入您的暱稱"
                maxLength={12}
              />
            </div>
          )}

          <div className="form-group">
            <label>電子郵件</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="輸入電子郵件"
              required
            />
          </div>

          {mode !== 'reset' && (
            <div className="form-group">
              <label>密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入密碼"
                minLength={6}
                required
              />
            </div>
          )}

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '處理中...' : (
              mode === 'login' ? '登入' :
              mode === 'register' ? '註冊' : '發送重設郵件'
            )}
          </button>
        </form>

        {/* 切換模式 */}
        <div className="mode-switch">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('register')}>
                還沒有帳號？註冊
              </button>
              <button onClick={() => setMode('reset')}>
                忘記密碼？
              </button>
            </>
          )}
          {mode === 'register' && (
            <button onClick={() => setMode('login')}>
              已有帳號？登入
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => setMode('login')}>
              返回登入
            </button>
          )}
        </div>

        <div className="divider">
          <span>或</span>
        </div>

        {/* 訪客登入 */}
        <button
          className="guest-btn"
          onClick={handleGuestLogin}
          disabled={loading}
        >
          以訪客身份進入
        </button>
        <p className="guest-hint">訪客可以直接遊玩，但無法保存分數記錄</p>
      </div>
    </div>
  );
}

export default LoginPage;
```

#### 2.7 登入頁面樣式

```css
/* frontend/src/components/Auth/LoginPage.css */

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}

.login-container h1 {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

.google-btn {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.google-btn:hover {
  background: #f5f5f5;
}

.google-btn img {
  width: 20px;
  height: 20px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.divider span {
  padding: 0 16px;
  color: #999;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #5a6fd6;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 16px;
}

.success-message {
  color: #27ae60;
  font-size: 14px;
  margin-bottom: 16px;
}

.mode-switch {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.mode-switch button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
}

.mode-switch button:hover {
  text-decoration: underline;
}

.guest-btn {
  width: 100%;
  padding: 14px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.guest-btn:hover {
  background: #eee;
}

.guest-hint {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
```

#### 2.8 App 整合

```jsx
// frontend/src/App.jsx

import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import GameLobby from './components/Lobby/GameLobby';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">載入中...</div>;
  }

  return isAuthenticated ? <GameLobby /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

### 階段 3：後端整合（選填，用於驗證）

#### 3.1 安裝 Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

#### 3.2 初始化 Firebase Admin

```javascript
// backend/firebase/admin.js

const admin = require('firebase-admin');

// 使用服務帳戶金鑰初始化
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

module.exports = admin;
```

#### 3.3 驗證 Middleware

```javascript
// backend/middleware/authMiddleware.js

const admin = require('../firebase/admin');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授權' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token 無效' });
  }
}

module.exports = { verifyToken };
```

## 受影響檔案

### 新增檔案
- `frontend/src/firebase/config.js`
- `frontend/src/services/authService.js`
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/components/Auth/LoginPage.jsx`
- `frontend/src/components/Auth/LoginPage.css`
- `backend/firebase/admin.js`（選填）
- `backend/middleware/authMiddleware.js`（選填）

### 修改檔案
- `frontend/src/App.jsx`
- `frontend/.env.local`
- `frontend/package.json`

## 測試案例

### Google 登入
1. 點擊「使用 Google 登入」
2. 選擇 Google 帳號
3. 成功登入並顯示使用者名稱

### Email 註冊
1. 切換到註冊模式
2. 輸入暱稱、Email、密碼
3. 點擊註冊
4. 成功註冊並自動登入

### Email 登入
1. 輸入已註冊的 Email 和密碼
2. 點擊登入
3. 成功登入

### 忘記密碼
1. 點擊「忘記密碼」
2. 輸入 Email
3. 點擊發送
4. 收到重設郵件

### 匿名登入
1. 點擊「以訪客身份進入」
2. 成功以匿名身份進入遊戲

### 登出
1. 點擊登出按鈕
2. 返回登入頁面

## 驗收標準

- [ ] Firebase 專案設置完成
- [ ] Google 登入功能正常
- [ ] Email 註冊功能正常
- [ ] Email 登入功能正常
- [ ] 匿名登入功能正常
- [ ] 忘記密碼功能正常
- [ ] 登出功能正常
- [ ] 登入狀態持久化（重新整理後仍保持登入）
- [ ] 錯誤訊息顯示正確
- [ ] UI 樣式美觀
