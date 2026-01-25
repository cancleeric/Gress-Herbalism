/**
 * 登入頁面組件
 * 工單 0059, 0062
 * 重新設計：基於 Google Stitch 生成的中國風設計
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase';
import './Login.css';

/**
 * 判斷是否為配置錯誤
 * @param {string} errorCode - 錯誤碼
 * @returns {boolean}
 */
function isConfigurationError(errorCode) {
  return errorCode === 'auth/configuration-not-found' ||
         errorCode === 'auth/operation-not-allowed';
}

function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginAsGuest, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setError('');
    setErrorCode('');

    const result = await loginWithGoogle();

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '登入失敗，請稍後再試');
      setErrorCode(result.errorCode || '');
    }

    setIsProcessing(false);
  };

  const handleGuestLogin = async () => {
    setIsProcessing(true);
    setError('');
    setErrorCode('');

    const result = await loginAsGuest();

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '登入失敗，請稍後再試');
      setErrorCode(result.errorCode || '');
    }

    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="loading-text">載入中...</div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Background Decorations */}
      <div className="bg-decoration bg-decoration-top"></div>
      <div className="bg-decoration bg-decoration-bottom"></div>

      <div className="login-layout">
        {/* Header */}
        <header className="login-nav">
          <div className="nav-brand">
            <svg className="nav-icon" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
            </svg>
            <span className="nav-title">Herbalism</span>
          </div>
          <nav className="nav-links">
            <a href="#">規則書</a>
            <a href="#">卡牌</a>
            <a href="#">關於</a>
          </nav>
        </header>

        <main className="login-main">
          {/* Branding */}
          <div className="branding">
            <h1 className="brand-title">本草 Herbalism</h1>
            <div className="brand-subtitle-wrapper">
              <h2 className="brand-subtitle">3-4人線上推理桌遊</h2>
            </div>
          </div>

          {/* Login Card */}
          <div className="login-card">
            <div className="login-buttons">
              <button
                className="btn btn-google"
                onClick={handleGoogleLogin}
                disabled={isProcessing}
              >
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span>使用 Google 帳號登入</span>
              </button>

              <button
                className="btn btn-guest"
                onClick={handleGuestLogin}
                disabled={isProcessing}
              >
                <span className="guest-icon">👤</span>
                <span>訪客登入</span>
              </button>
            </div>

            {error && (
              <div className="error-alert" role="alert">
                <p className="error-message">{error}</p>
                {isConfigurationError(errorCode) && (
                  <div className="config-help">
                    <p className="config-help-title">管理員設定步驟：</p>
                    <ol>
                      <li>前往 <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
                      <li>選擇專案 → Authentication → Sign-in method</li>
                      <li>啟用「Google」和「匿名」登入方式</li>
                      <li>確認 Authorized domains 包含 localhost</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="divider">
              <span>新朋友？</span>
            </div>

            <button className="btn-link">
              創建帳號
            </button>
          </div>

          {/* Game Introduction */}
          <div className="game-intro">
            <p className="intro-quote">
              "在古老的本草知識中，找出神秘藥方。融合推理、策略與智慧的桌遊。"
            </p>
            <div className="intro-features">
              <div className="feature">
                <span className="feature-icon">👥</span>
                <span>3-4 位玩家</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⏱️</span>
                <span>20-30 分鐘</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🧠</span>
                <span>邏輯推理</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="login-footer">
          <p>© 2024 本草 Herbalism Online. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default Login;
