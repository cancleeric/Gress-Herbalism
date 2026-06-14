/**
 * lidsService.js — LIDS OIDC Auth Code + PKCE 骨架（Phase 1）
 *
 * Phase 1 狀態：骨架，預設不啟用。
 *   - env flag REACT_APP_LIDS_ENABLED=true 才會顯示 LIDS 登入按鈕
 *   - LIDS client（herbalism-dev/prod）尚未建立（待 Kay 完成後進入 Phase 2）
 *   - 目前 Firebase Google 登入並存，不移除
 *
 * 安全原則：
 *   ⛔ 無 client_secret（public client）
 *   - PKCE S256 由 oidc-client-ts 自動啟用
 *   - token 存 sessionStorage（不存 localStorage）
 *   - OIDC state 由 oidc-client-ts 自動管理（防 CSRF）
 *
 * env 前綴：REACT_APP_LIDS_*（CRA 要求 REACT_APP_ 才會 build-time 注入）
 * 對照：hd-portal 的 lids-adapter.ts 使用 VITE_LIDS_*（Vite 專案）
 */

import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

// ── env 讀取（佔位值，Phase 2 填入真值） ────────────────────────────────────

const LIDS_ISSUER = process.env.REACT_APP_LIDS_ISSUER;
const LIDS_CLIENT_ID = process.env.REACT_APP_LIDS_CLIENT_ID;
const LIDS_REDIRECT_URI = process.env.REACT_APP_LIDS_REDIRECT_URI;

// ── UserManager singleton ─────────────────────────────────────────────────────

let _userManager = null;

/**
 * 取得（或建立）UserManager singleton。
 * Phase 1：env 未設定時使用 placeholder，compile 通過但 OIDC 呼叫不會成功。
 * Phase 2：填入 Kay 提供的真實 client_id 後即可接通。
 */
export function getLidsUserManager() {
  if (_userManager) return _userManager;

  _userManager = new UserManager({
    authority: LIDS_ISSUER ?? 'http://localhost:8073',           // Phase 2 填入 Headscale tailnet URL
    client_id: LIDS_CLIENT_ID ?? 'herbalism-dev',               // Phase 2 填入 Kay 提供的 client_id
    redirect_uri: LIDS_REDIRECT_URI ?? 'http://localhost:3000/herbalism/callback',
    scope: 'openid profile email',
    // Auth Code + PKCE（oidc-client-ts 預設啟用 PKCE S256）
    response_type: 'code',
    // token / state 一律存 sessionStorage，不存 localStorage
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    // silent renew：token 即將過期時自動刷新
    automaticSilentRenew: true,
    // 從 OIDC discovery 自動取 userinfo_endpoint
    loadUserInfo: true,
  });

  return _userManager;
}

/**
 * 發起 LIDS 登入（Auth Code + PKCE redirect）
 * Phase 1：呼叫會跳轉到 LIDS，但因 client 尚未建立，LIDS 會拒絕
 * Phase 2：client 建立後正常運作
 */
export async function loginWithLids() {
  const userManager = getLidsUserManager();
  await userManager.signinRedirect();
}

/**
 * 登出（LIDS redirect）
 */
export async function logoutFromLids() {
  const userManager = getLidsUserManager();
  await userManager.signoutRedirect();
}

/**
 * 取得目前 LIDS User（從 sessionStorage）
 * @returns {Promise<import('oidc-client-ts').User|null>}
 */
export async function getLidsUser() {
  const userManager = getLidsUserManager();
  return userManager.getUser();
}

/**
 * Phase 1 guard：LIDS 是否啟用（env flag）
 * 登入按鈕只在此 flag 為 true 時顯示
 */
export function isLidsEnabled() {
  return process.env.REACT_APP_LIDS_ENABLED === 'true';
}
