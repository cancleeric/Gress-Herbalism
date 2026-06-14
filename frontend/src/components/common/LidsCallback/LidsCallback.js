/**
 * LidsCallback.js — LIDS OIDC callback 路由元件（Phase 2a）
 *
 * Phase 2a：完整實作 signinRedirectCallback，取得 OIDC user profile，
 *   顯示登入成功訊息，並導向大廳。
 *   syncPlayer 後端橋接為 best-effort（Phase 2b 完成前後端還不認 LIDS token）。
 *
 * 路由：/callback（basename="/herbalism" 下 → 實際 URL = /herbalism/callback）
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLidsUserManager } from '../../../lids/lidsService';

/**
 * LIDS OIDC 回呼處理元件（Phase 2a）
 */
function LidsCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('處理 LIDS 登入中...');
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const userManager = getLidsUserManager();
        const user = await userManager.signinRedirectCallback();

        if (!user) {
          throw new Error('LIDS 登入失敗：未取得 user');
        }

        const profile = user.profile;
        setUserInfo({
          sub: profile.sub,
          email: profile.email,
          name: profile.name || profile.preferred_username || profile.sub,
        });

        setStatus('LIDS 登入成功，正在進入大廳...');

        // TODO Phase 2b: 後端接受 LIDS token（lidsAuth）後才能 syncPlayer，目前 best-effort
        // 後端目前驗 Firebase token，不認 LIDS access_token，呼叫必然失敗，只 console.warn 不阻斷登入流程
        try {
          const { syncPlayer } = await import('../../../services/apiService');
          await syncPlayer({
            displayName: profile.name || profile.preferred_username || '玩家',
            email: profile.email,
          });
        } catch (syncErr) {
          console.warn('[LidsCallback] syncPlayer best-effort 失敗（Phase 2b 完成前預期）:', syncErr.message);
        }

        // 延遲 1.5 秒讓用戶看到成功訊息，再導向大廳
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      } catch (err) {
        console.error('[LidsCallback] signinRedirectCallback 失敗:', err);
        setError(err.message || 'LIDS 登入回呼失敗');
      }
    }

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>LIDS 登入失敗</h2>
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
        <a href="/herbalism/login" style={{ color: '#1a73e8' }}>
          返回登入頁
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>LIDS 登入</h2>
      <p style={{ marginBottom: '0.5rem' }}>{status}</p>
      {userInfo && (
        <p style={{ color: '#2e7d32', marginTop: '0.5rem' }}>
          LIDS 登入成功：{userInfo.email || userInfo.sub}
        </p>
      )}
    </div>
  );
}

export default LidsCallback;
