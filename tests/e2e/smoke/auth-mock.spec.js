/**
 * auth mock smoke spec
 *
 * 驗證 cy.login() mock auth 在 REACT_APP_E2E=1 build 下：
 * 1. 本草大廳（/lobby/herbalism）可進入
 * 2. 演化論大廳（/lobby/evolution）可進入
 *
 * 安全說明：
 * - window.__CYPRESS_E2E_AUTH 只在 REACT_APP_E2E=1 build 的 E2EAuthProvider 生效
 * - 生產 build 不含 E2EAuthProvider，此 mock 完全無效
 * - 不連接真實 Firebase、不連接真實 DB
 *
 * @file tests/e2e/smoke/auth-mock.spec.js
 */

describe('auth mock smoke — 本草 + 演化論 lobby', () => {
  beforeEach(() => {
    // 注入 mock auth（需 REACT_APP_E2E=1 build）
    cy.login('E2E 測試玩家');
  });

  it('已 mock auth 後可進入本草大廳', () => {
    cy.visit('/lobby/herbalism');
    cy.get('body').should('be.visible');
    // 不應導向 /login（ProtectedRoute 已 bypass）
    cy.url().should('include', '/lobby/herbalism');
  });

  it('已 mock auth 後可進入演化論大廳', () => {
    cy.visit('/lobby/evolution');
    cy.get('body').should('be.visible');
    cy.url().should('include', '/lobby/evolution');
  });
});
