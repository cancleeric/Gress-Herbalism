/**
 * verifyAuth.js — Firebase ID token 驗簽 middleware
 *
 * 驗簽方式：JWKS 遠端公鑰（無需 service-account secret）
 *   JWKS URL: https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com
 *   issuer:   https://securetoken.google.com/<FIREBASE_PROJECT_ID>
 *   audience: <FIREBASE_PROJECT_ID>
 *
 * 驗通過 → req.uid = payload.user_id（Firebase UID）
 * 驗失敗 → 401，不拋 500
 *
 * 安全注意：
 *   - 不依賴任何 secret（public JWKS only）
 *   - FIREBASE_PROJECT_ID 必須從 env 讀取，不可 hardcode
 *   - 訪客（匿名 Firebase）也有合法 ID token，同樣可通過此 middleware
 */

let joseModule;
async function getJose() {
  if (!joseModule) {
    try { joseModule = require('jose'); }
    catch (error) {
      if (error.code !== 'ERR_REQUIRE_ESM') throw error;
      joseModule = await import('jose');
    }
  }
  return joseModule;
}

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

// Google Firebase JWKS endpoint（公開，無需 secret）
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let _jwks = null;

/**
 * 取得（或快取）JWKS 實例
 * 延遲初始化：FIREBASE_PROJECT_ID 必須已設定才能建立 issuer/audience
 */
async function getJWKS() {
  if (!_jwks) {
    const { createRemoteJWKSet } = await getJose();
    _jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  }
  return _jwks;
}

/**
 * verifyAuth middleware
 *
 * 從 Authorization: Bearer <idToken> 取 Firebase ID token，
 * 以 JWKS 驗簽後將 UID 存入 req.uid。
 *
 * 若 FIREBASE_PROJECT_ID 未設定（例如舊部署環境未注入 env），
 * 此 middleware 會回傳 503 而非靜默跳過，避免偽裝成任何人通過。
 */
async function verifyAuth(req, res, next) {
  if (!FIREBASE_PROJECT_ID) {
    return res.status(503).json({
      success: false,
      message: '伺服器尚未設定 FIREBASE_PROJECT_ID',
    });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供授權 token' });
  }

  const idToken = authHeader.slice(7);

  try {
    const identity = await verifyFirebaseIdToken(idToken);
    req.uid = identity.uid;
    next();
  } catch (err) {
    // 統一回 401，不暴露驗簽細節
    return res.status(401).json({ success: false, message: 'token 無效或已過期' });
  }
}

async function verifyFirebaseIdToken(idToken) {
  if (!FIREBASE_PROJECT_ID || typeof idToken !== 'string' || !idToken) throw new Error('Authentication unavailable');
  const { jwtVerify } = await getJose();
  const { payload } = await jwtVerify(idToken, await getJWKS(), {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
    algorithms: ['RS256'],
    requiredClaims: ['sub', 'exp', 'iat'],
  });
  const uid = payload.user_id || payload.sub;
  if (typeof uid !== 'string' || !uid || uid.length > 128 || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) {
    throw new Error('Invalid identity');
  }
  if (payload.user_id && payload.sub && payload.user_id !== payload.sub) throw new Error('Invalid identity');
  return { uid, expiresAt: payload.exp * 1000 };
}

module.exports = { verifyAuth, verifyFirebaseIdToken };
