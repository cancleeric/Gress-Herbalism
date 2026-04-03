/**
 * 框架驗證測試
 *
 * @file tests/e2e/smoke/framework.spec.js
 * 工單 0367
 */

describe('E2E 測試框架驗證', () => {
  describe('基本功能', () => {
    it('應該能訪問登入頁', () => {
      cy.visit('/login');
      cy.get('body').should('be.visible');
    });

    it('應該能載入演化論頁面（需要登入）', () => {
      // 未登入狀態下應重導向到 /login
      cy.visit('/lobby/evolution');
      cy.url().should('include', '/login');
    });
  });

  describe('自訂命令', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('login 命令應該可用', () => {
      // 測試 login 命令存在
      expect(Cypress.Commands._commands.login).to.exist;
    });

    it('createRoom 命令應該可用', () => {
      expect(Cypress.Commands._commands.createRoom).to.exist;
    });

    it('pass 命令應該可用', () => {
      expect(Cypress.Commands._commands.pass).to.exist;
    });

    it('longPress 命令應該可用', () => {
      expect(Cypress.Commands._commands.longPress).to.exist;
    });

    it('swipe 命令應該可用', () => {
      expect(Cypress.Commands._commands.swipe).to.exist;
    });

    it('pinch 命令應該可用', () => {
      expect(Cypress.Commands._commands.pinch).to.exist;
    });
  });

  describe('Fixtures', () => {
    it('應該能載入測試玩家資料', () => {
      cy.fixture('testPlayers').then((data) => {
        expect(data.players).to.have.length(4);
        expect(data.players[0].name).to.equal('測試玩家1');
      });
    });

    it('應該能載入遊戲狀態資料', () => {
      cy.fixture('gameState').then((data) => {
        expect(data.initialState.phase).to.equal('evolution');
        expect(data.feedingState.phase).to.equal('feeding');
      });
    });
  });

  describe('視窗設定', () => {
    it('桌面視窗應該正確', () => {
      cy.viewport(1280, 720);
      cy.visit('/login');
      cy.window().then((win) => {
        expect(win.innerWidth).to.be.at.least(1200);
      });
    });

    it('手機視窗應該正確', () => {
      cy.viewport('iphone-12');
      cy.visit('/login');
      cy.window().then((win) => {
        expect(win.innerWidth).to.be.lessThan(500);
      });
    });

    it('平板視窗應該正確', () => {
      cy.viewport('ipad-2');
      cy.visit('/login');
      cy.window().then((win) => {
        expect(win.innerWidth).to.be.at.least(700);
      });
    });
  });

  describe('錯誤處理', () => {
    it('應該忽略 ResizeObserver 錯誤', () => {
      cy.visit('/login');

      // 觸發 ResizeObserver 錯誤
      cy.window().then((win) => {
        win.dispatchEvent(new ErrorEvent('error', {
          message: 'ResizeObserver loop completed with undelivered notifications',
        }));
      });

      // 頁面應該仍然正常
      cy.get('body').should('be.visible');
    });
  });

  describe('網路模擬', () => {
    it('goOffline 命令應該可用', () => {
      expect(Cypress.Commands._commands.goOffline).to.exist;
    });

    it('goOnline 命令應該可用', () => {
      expect(Cypress.Commands._commands.goOnline).to.exist;
    });
  });
});
