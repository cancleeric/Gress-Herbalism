/**
 * 登入頁面組件
 * 工單 0059, 0062
 * 重新設計：基於 Google Stitch 生成的中國風設計
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../firebase';
import { loginWithLids, isLidsEnabled } from '../../../lids/lidsService';
import LoginGuide from './LoginGuide';
import './Login.css';
import BotanicalFan from '../BotanicalFan/BotanicalFan';

/**
 * 判斷是否為配置錯誤
 * @param {string} errorCode - 錯誤碼
 * @returns {boolean}
 */
function isConfigurationError(errorCode) {
  return errorCode === 'auth/configuration-not-found' ||
         errorCode === 'auth/operation-not-allowed' ||
         errorCode === 'auth/unauthorized-domain';
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginAsGuest, isLoading, isLoggedIn } = useAuth();
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [guideTarget, setGuideTarget] = useState(null);
  const guideRef = useRef(null);
  const guideOpenerRef = useRef(null);

  useEffect(() => {
    if (!guideTarget) return undefined;
    const target = document.getElementById(guideTarget);
    target?.focus();
    target?.scrollIntoView?.({ block: 'start' });
    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setGuideTarget(null); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(guideRef.current?.querySelectorAll('button, a[href], [tabindex="0"]') || []);
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      guideOpenerRef.current?.focus();
    };
  }, [guideTarget]);

  // 登入後導向目標頁，from 由 ProtectedRoute 注入
  const from = location.state?.from?.pathname ?? '/';

  // 統一大廳下：依進入的遊戲切換招牌（本草 vs 演化論），兩款共用同一 app/登入但品牌分流
  const isEvolution = from.includes('evolution');
  const brand = isEvolution
    ? { navTitle: 'Evolution', title: '演化論 Evolution', subtitle: '2-4 人物種演化策略卡牌', players: '2-4 位玩家', duration: '30-60 分鐘', strategy: '生存策略', tagline: '"運用特徵卡牌讓你的物種存活並壯大，模擬物種演化的桌遊。"' }
    : { navTitle: 'Herbalism', title: '本草 Herbalism', subtitle: '3-4人線上推理桌遊', players: '3-4 位玩家', duration: '20-30 分鐘', strategy: '邏輯推理', tagline: '"在古老的本草知識中，找出神秘藥方。融合推理、策略與智慧的桌遊。"' };

  // 已登入用戶直接訪問 /login 時跳走（演化論 deep link 修正）
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [isLoading, isLoggedIn, navigate, from]);

  // Keep ProtectedRoute's from state intact while moving within this page.
  const handleGuideNavigation = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(event.currentTarget.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    guideOpenerRef.current = event.currentTarget;
    setGuideTarget(target.id);
    if (guideTarget === target.id) target.focus();
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setError('');
    setErrorCode('');

    const result = await loginWithGoogle();

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || '登入失敗，請稍後再試');
      setErrorCode(result.errorCode || '');
    }

    setIsProcessing(false);
  };

  // Phase 1 LIDS 登入（env flag REACT_APP_LIDS_ENABLED=true 才顯示）
  const handleLidsLogin = async () => {
    setIsProcessing(true);
    setError('');
    setErrorCode('');
    try {
      await loginWithLids();
      // loginWithLids 會跳轉離開頁面，不會 return
    } catch (err) {
      setError('LIDS 登入跳轉失敗，請稍後再試');
      setIsProcessing(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsProcessing(true);
    setError('');
    setErrorCode('');

    const result = await loginAsGuest();

    if (result.success) {
      navigate(from, { replace: true });
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
            <span className="nav-title">{brand.navTitle}</span>
          </div>
          <nav className="nav-links" aria-label="遊戲介紹導覽">
            <a href="#login-rules" onClick={handleGuideNavigation}>規則書</a>
            <a href="#login-cards" onClick={handleGuideNavigation}>卡牌</a>
            <a href="#login-about" onClick={handleGuideNavigation}>關於</a>
          </nav>
        </header>

        <main className="login-main">
          {/* Branding */}
          <div className="branding">
            {!isEvolution && <BotanicalFan />}
            <h1 className="brand-title">{brand.title}</h1>
            <div className="brand-subtitle-wrapper">
              <h2 className="brand-subtitle">{brand.subtitle}</h2>
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

              {/* Phase 1 LIDS 登入按鈕：env flag REACT_APP_LIDS_ENABLED=true 才顯示 */}
              {/* Phase 2（Kay 提供 client 後）：移除此條件渲染，改為預設顯示 */}
              {isLidsEnabled() && (
                <button
                  className="btn btn-lids"
                  onClick={handleLidsLogin}
                  disabled={isProcessing}
                  title="使用颶風集團帳號登入（LIDS SSO）"
                >
                  <span className="lids-icon">🌀</span>
                  <span>使用颶風帳號登入（LIDS）</span>
                </button>
              )}

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
                      <li>確認 Authorized domains 包含 localhost 和生產環境網域</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="divider">
              <span>新朋友？</span>
            </div>

            <p className="login-signup-help">選擇 Google 帳號登入，或以訪客身份開始遊戲。</p>
          </div>

          <div ref={guideRef} className="login-reference-panel" hidden={!guideTarget}
            role="dialog" aria-modal="true" aria-label="遊戲說明">
          <header className="login-reference-header"><strong>遊戲說明</strong><button type="button" onClick={() => setGuideTarget(null)}>關閉說明</button></header>
          <div className="login-reference-body">
          {/* Game Introduction */}
          <section id="login-about" className="game-intro" tabIndex={-1} aria-labelledby="login-about-title">
            <h2 id="login-about-title" className="login-section-title">關於{brand.title}</h2>
            <p className="intro-quote">
              {brand.tagline}
            </p>
            <div className="intro-features">
              <div className="feature">
                <span className="feature-icon">👥</span>
                <span>{brand.players}</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⏱️</span>
                <span>{brand.duration}</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🧠</span>
                <span>{brand.strategy}</span>
              </div>
            </div>
          </section>
          <LoginGuide isEvolution={isEvolution} />
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
