/**
 * LidsCallback.js — LIDS OIDC callback 路由元件骨架（Phase 1）
 *
 * Phase 1 狀態：骨架元件，只顯示 callback 收到的提示。
 * Phase 2（Kay 提供 client 後）：完整實作：
 *   1. userManager.signinRedirectCallback()
 *   2. 取得 OIDC user.profile.sub
 *   3. 呼叫後端 syncPlayer（帶 Authorization: Bearer access_token）
 *   4. 自動跳轉至大廳
 *
 * 路由：/herbalism/callback（App.js 中已加入）
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLidsUserManager } from '../../../lids/lidsService';

/**
 * LIDS OIDC 回呼處理元件（Phase 1 骨架）
 */
function LidsCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('處理中...');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Phase 1：顯示 callback 已收到，但不完整處理（缺 LIDS client）
    // Phase 2：取消下面的 return，改為完整的 signinRedirectCallback 流程
    setStatus('LIDS callback 已收到（Phase 1 骨架，等待 LIDS client 建立）');

    /*
     * === Phase 2 實作（待 Kay 提供 client_id 後啟用） ===
     *
     * async function handleCallback() {
     *   try {
     *     const userManager = getLidsUserManager();
     *     const user = await userManager.signinRedirectCallback();
     *
     *     if (!user) {
     *       throw new Error('LIDS 登入失敗：未取得 user');
     *     }
     *
     *     // 以 access_token 呼叫後端 syncPlayer
     *     const { syncPlayer } = await import('../../../services/apiService');
     *     await syncPlayer({
     *       displayName: user.profile.name || user.profile.preferred_username || '玩家',
     *       email: user.profile.email,
     *     }, user.access_token);
     *
     *     navigate('/', { replace: true });
     *   } catch (err) {
     *     console.error('[LidsCallback] 錯誤:', err);
     *     setError(err.message || 'LIDS 登入回呼失敗');
     *   }
     * }
     *
     * handleCallback();
     */
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>LIDS 登入失敗</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/login', { replace: true })}>
          返回登入頁
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>LIDS 登入</h2>
      <p>{status}</p>
    </div>
  );
}

export default LidsCallback;
