/**
 * verifyAuth.js 單元測試
 *
 * 雙審補項（P1 安全修復後續）：
 * 真實覆蓋 verifyAuth middleware 的五個核心行為：
 * 1. 無 Authorization header → 401
 * 2. Bearer 格式錯誤 → 401
 * 3. JWT 驗簽失敗（偽造 token）→ 401
 * 4. FIREBASE_PROJECT_ID 未設定 → 503
 * 5. 合法 token → 放行且 req.uid 正確設為 payload.user_id / sub
 *
 * Mock 策略：
 * - jest.mock('jose') 攔截 jwtVerify（不發真實 JWKS 請求）
 * - createRemoteJWKSet mock 成 identity function（回傳固定值供 jwtVerify 識別）
 * - FIREBASE_PROJECT_ID 透過 jest.resetModules() + 動態 require 控制（頂層 const）
 */

// jose mock 必須在任何 require 之前宣告
jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest.fn(),
}));

const { jwtVerify, createRemoteJWKSet } = require('jose');

/**
 * 建立 mock Express req/res/next 物件
 */
function makeReqResNext(authHeader) {
  const req = {
    headers: authHeader !== undefined ? { authorization: authHeader } : {},
  };

  let statusCode = null;
  let responseBody = null;

  const res = {
    status(code) {
      statusCode = code;
      return res; // 鏈式呼叫
    },
    json(body) {
      responseBody = body;
      return res;
    },
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };

  const next = jest.fn();
  return { req, res, next };
}

// ==============================
// FIREBASE_PROJECT_ID 已設定 → 正常路徑
// ==============================
describe('verifyAuth（FIREBASE_PROJECT_ID 已設定）', () => {
  let verifyAuth;

  beforeAll(() => {
    // 設定 env 後重新 require，使頂層 const 取到值
    jest.resetModules();
    process.env.FIREBASE_PROJECT_ID = 'test-project-id';
    // 重新 mock jose（resetModules 後 mock 要重設）
    jest.mock('jose', () => ({
      createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
      jwtVerify: jest.fn(),
    }));
    ({ verifyAuth } = require('./verifyAuth'));
  });

  afterAll(() => {
    delete process.env.FIREBASE_PROJECT_ID;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // 重新取得 jose mock 實例（resetModules 後需重新 require）
    const jose = require('jose');
    jose.jwtVerify.mockReset();
    jose.createRemoteJWKSet.mockReturnValue('mock-jwks');
  });

  test('①無 Authorization header → 401 未提供授權 token', async () => {
    const { req, res, next } = makeReqResNext(undefined);

    await verifyAuth(req, res, next);

    expect(res.getStatus()).toBe(401);
    expect(res.getBody()).toMatchObject({ success: false, message: expect.stringContaining('token') });
    expect(next).not.toHaveBeenCalled();
  });

  test('②Bearer 格式錯誤（無 Bearer 前綴）→ 401', async () => {
    const { req, res, next } = makeReqResNext('Token abc123');

    await verifyAuth(req, res, next);

    expect(res.getStatus()).toBe(401);
    expect(res.getBody()).toMatchObject({ success: false });
    expect(next).not.toHaveBeenCalled();
  });

  test('②Bearer 格式錯誤（空字串 header）→ 401', async () => {
    const { req, res, next } = makeReqResNext('');

    await verifyAuth(req, res, next);

    expect(res.getStatus()).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('③JWT 驗簽失敗（偽造 token）→ 401', async () => {
    const jose = require('jose');
    jose.jwtVerify.mockRejectedValue(new Error('JWSSignatureVerificationFailed'));

    const { req, res, next } = makeReqResNext('Bearer forged.token.here');

    await verifyAuth(req, res, next);

    expect(res.getStatus()).toBe(401);
    expect(res.getBody()).toMatchObject({ success: false, message: expect.any(String) });
    expect(next).not.toHaveBeenCalled();
  });

  test('⑤合法 token（user_id claim）→ 放行且 req.uid = payload.user_id', async () => {
    const jose = require('jose');
    jose.jwtVerify.mockResolvedValue({
      payload: { user_id: 'firebase-uid-abc', sub: 'firebase-uid-abc', exp: Math.floor(Date.now()/1000)+3600, iat: Math.floor(Date.now()/1000) },
    });

    const { req, res, next } = makeReqResNext('Bearer valid.token.here');

    await verifyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.uid).toBe('firebase-uid-abc');
    expect(res.getStatus()).toBeNull();
  });

  test('⑤合法 token（僅 sub，無 user_id）→ 放行且 req.uid = payload.sub', async () => {
    const jose = require('jose');
    jose.jwtVerify.mockResolvedValue({
      payload: { sub: 'sub-only-uid', exp: Math.floor(Date.now()/1000)+3600, iat: Math.floor(Date.now()/1000) },
    });

    const { req, res, next } = makeReqResNext('Bearer valid.token.sub');

    await verifyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.uid).toBe('sub-only-uid');
  });

  test.each([
    { sub: 'uid', exp: Math.floor(Date.now()/1000)-1 },
    { sub: '', exp: Math.floor(Date.now()/1000)+3600 },
    { sub: 'uid-a', user_id: 'uid-b', exp: Math.floor(Date.now()/1000)+3600 },
    { sub: 'uid' },
  ])('拒絕缺失/過期期限或不一致身分 %#', async (payload) => {
    require('jose').jwtVerify.mockResolvedValue({ payload });
    const { req, res, next } = makeReqResNext('Bearer invalid.claims');
    await verifyAuth(req, res, next);
    expect(res.getStatus()).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('⑤jwtVerify 以正確的 issuer 和 audience 呼叫', async () => {
    const jose = require('jose');
    jose.jwtVerify.mockResolvedValue({
      payload: { user_id: 'uid-check', sub: 'uid-check', exp: Math.floor(Date.now()/1000)+3600, iat: Math.floor(Date.now()/1000) },
    });

    const { req, res, next } = makeReqResNext('Bearer some.valid.token');

    await verifyAuth(req, res, next);

    expect(jose.jwtVerify).toHaveBeenCalledWith(
      'some.valid.token',
      expect.anything(), // JWKS instance
      expect.objectContaining({
        issuer: 'https://securetoken.google.com/test-project-id',
        audience: 'test-project-id',
      })
    );
  });
});

// ==============================
// FIREBASE_PROJECT_ID 未設定 → 503
// ==============================
describe('verifyAuth（FIREBASE_PROJECT_ID 未設定）', () => {
  let verifyAuth;

  beforeAll(() => {
    jest.resetModules();
    delete process.env.FIREBASE_PROJECT_ID;
    jest.mock('jose', () => ({
      createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
      jwtVerify: jest.fn(),
    }));
    ({ verifyAuth } = require('./verifyAuth'));
  });

  test('④FIREBASE_PROJECT_ID 未設定 → 503', async () => {
    const { req, res, next } = makeReqResNext('Bearer some.token');

    await verifyAuth(req, res, next);

    expect(res.getStatus()).toBe(503);
    expect(res.getBody()).toMatchObject({ success: false, message: expect.stringContaining('FIREBASE_PROJECT_ID') });
    expect(next).not.toHaveBeenCalled();
  });
});
