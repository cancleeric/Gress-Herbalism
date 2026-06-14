/**
 * lidsAuth.js — LIDS OIDC JWT 驗簽 middleware（Phase 1 骨架）
 *
 * Phase 1 狀態：骨架，尚未在任何路由掛載。
 * Phase 2（Kay 建立 LIDS client 後）：
 *   1. 填入 LIDS_ISSUER env（.199 部署填 Headscale tailnet URL）
 *   2. 在需要的路由掛上此 middleware 取代 verifyAuth
 *   3. 或採雙 middleware 策略：Firebase token → LIDS token 漸進遷移
 *
 * 驗簽方式：LIDS JWKS endpoint（oidc-provider 標準端點 /.well-known/jwks.json）
 * ⛔ 無 client_secret（不需要）
 *
 * 對照：verifyAuth.js（Firebase JWKS）、antique-master-web 的 lidsAuth.ts
 */

const { createRemoteJWKSet, jwtVerify } = require('jose');

const LIDS_ISSUER = process.env.LIDS_ISSUER;

let _jwks = null;

/**
 * 取得 LIDS JWKS（延遲初始化，避免啟動時就需要 LIDS_ISSUER）
 */
function getLidsJWKS() {
  if (!_jwks) {
    if (!LIDS_ISSUER) {
      throw new Error('LIDS_ISSUER env 未設定');
    }
    const jwksUrl = new URL(`${LIDS_ISSUER}/.well-known/jwks.json`);
    _jwks = createRemoteJWKSet(jwksUrl);
  }
  return _jwks;
}

/**
 * lidsAuthMiddleware（Phase 1 骨架，尚未掛載於任何路由）
 *
 * 從 Authorization: Bearer <accessToken> 取 LIDS access token，
 * 以 JWKS 驗簽後將 LIDS sub 存入 req.lidsUser.sub。
 *
 * Phase 2 掛載後，路由改用 req.lidsUser.sub 取代 req.uid。
 */
async function lidsAuthMiddleware(req, res, next) {
  if (!LIDS_ISSUER) {
    return res.status(503).json({
      success: false,
      message: '伺服器尚未設定 LIDS_ISSUER',
    });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供授權 token' });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, getLidsJWKS(), {
      issuer: LIDS_ISSUER,
    });

    req.lidsUser = {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'LIDS token 無效或已過期' });
  }
}

module.exports = { lidsAuthMiddleware };
