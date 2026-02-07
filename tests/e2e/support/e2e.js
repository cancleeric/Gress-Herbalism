/**
 * Cypress E2E 支援檔案
 *
 * @file tests/e2e/support/e2e.js
 * 工單 0367
 */

// 匯入自訂命令
import './commands';

// 全域設定
Cypress.on('uncaught:exception', (err, runnable) => {
  // 忽略 ResizeObserver 錯誤
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }

  // 忽略 Socket.io 連線錯誤（在測試環境中）
  if (err.message.includes('socket') || err.message.includes('ECONNREFUSED')) {
    return false;
  }

  return true;
});

// 測試前清理
beforeEach(() => {
  // 清除 localStorage
  cy.window().then((win) => {
    win.localStorage.clear();
  });
});

// 全域 Hook
before(() => {
  cy.log('開始 E2E 測試');
});

after(() => {
  cy.log('E2E 測試結束');
});
