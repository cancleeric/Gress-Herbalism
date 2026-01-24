/**
 * 登入頁面組件
 * 工單 0059, 0062
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
        <div className="login-loading">載入中...</div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <header className="login-header">
          <h1>本草 Herbalism</h1>
          <p className="login-subtitle">3-4 人推理卡牌遊戲</p>
        </header>

        <div className="login-options">
          <button
            className="login-btn google-btn"
            onClick={handleGoogleLogin}
            disabled={isProcessing}
          >
            <span className="btn-icon">G</span>
            <span>使用 Google 帳號登入</span>
          </button>

          <div className="login-divider">
            <span>或</span>
          </div>

          <button
            className="login-btn guest-btn"
            onClick={handleGuestLogin}
            disabled={isProcessing}
          >
            <span className="btn-icon">👤</span>
            <span>訪客模式</span>
          </button>

          <p className="guest-note">
            訪客模式可以直接遊玩，之後可升級為正式帳號
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
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

        <footer className="login-footer">
          <p>登入即表示您同意我們的服務條款</p>
        </footer>
      </div>
    </div>
  );
}

export default Login;
