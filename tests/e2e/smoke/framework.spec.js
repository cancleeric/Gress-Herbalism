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
    it('login 命令應該可用', () => {
      expect(cy.login).to.be.a('function');
    });

    it('createRoom 命令應該可用', () => {
      expect(cy.createRoom).to.be.a('function');
    });

    it('pass 命令應該可用', () => {
      expect(cy.pass).to.be.a('function');
    });

    it('longPress 命令應該可用', () => {
      expect(cy.longPress).to.be.a('function');
    });

    it('swipe 命令應該可用', () => {
      expect(cy.swipe).to.be.a('function');
    });

    it('pinch 命令應該可用', () => {
      expect(cy.pinch).to.be.a('function');
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
      // 使用數字尺寸（390x844 為 iPhone 12 尺寸）
      cy.viewport(390, 844);
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
      expect(cy.goOffline).to.be.a('function');
    });

    it('goOnline 命令應該可用', () => {
      expect(cy.goOnline).to.be.a('function');
    });
  });
});
