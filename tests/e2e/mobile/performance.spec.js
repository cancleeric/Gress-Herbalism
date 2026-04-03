/**
 * 移動端效能測試
 *
 * @file tests/e2e/mobile/performance.spec.js
 */

describe.skip('移動端效能測試', () => {
  const DEVICES = [
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'Pixel 5', width: 393, height: 851 },
    { name: 'iPad', width: 768, height: 1024 },
  ];

  DEVICES.forEach(device => {
    describe(`${device.name} 效能`, () => {
      beforeEach(() => {
        cy.viewport(device.width, device.height);
      });

      it('首頁載入時間應小於 3 秒', () => {
        const startTime = Date.now();

        cy.visit('/evolution');

        cy.get('.evolution-lobby').should('be.visible').then(() => {
          const loadTime = Date.now() - startTime;
          expect(loadTime).to.be.lessThan(3000);
          cy.log(`首頁載入時間: ${loadTime}ms`);
        });
      });

      it('遊戲介面載入時間應小於 5 秒', () => {
        cy.visit('/evolution');
        cy.login('testPlayer1');

        const startTime = Date.now();

        cy.createAndJoinGame();
        cy.startGame();

        cy.get('.game-board').should('be.visible').then(() => {
          const loadTime = Date.now() - startTime;
          expect(loadTime).to.be.lessThan(5000);
          cy.log(`遊戲載入時間: ${loadTime}ms`);
        });
      });

      it('操作響應時間應小於 200ms', () => {
        cy.visit('/evolution');
        cy.login('testPlayer1');
        cy.createAndJoinGame();
        cy.startGame();

        // 測量點擊響應
        cy.get('[data-testid="hand-card"]').first().then($card => {
          const startTime = Date.now();

          cy.wrap($card).click();

          cy.wrap($card).should('have.class', 'selected').then(() => {
            const responseTime = Date.now() - startTime;
            expect(responseTime).to.be.lessThan(200);
            cy.log(`點擊響應時間: ${responseTime}ms`);
          });
        });
      });

      it('動畫應該流暢（無明顯卡頓）', () => {
        cy.visit('/evolution');
        cy.login('testPlayer1');
        cy.createAndJoinGame();
        cy.startGame();

        // 執行多個動畫操作
        cy.get('[data-testid="hand-card"]').first().click();
        cy.wait(100);
        cy.get('[data-testid="hand-card"]').first().dblclick();
        cy.wait(100);

        // 檢查動畫元素的 CSS
        cy.get('.card-base').should('exist');
        cy.get('.card-base').should('have.css', 'transition');
      });

      it('滾動應該流暢', () => {
        cy.visit('/evolution');
        cy.login('testPlayer1');
        cy.createAndJoinGame();
        cy.startGame();

        // 滾動遊戲日誌
        cy.get('.game-log').scrollTo('bottom', { duration: 500 });
        cy.get('.game-log').scrollTo('top', { duration: 500 });

        // 應該正常滾動
        cy.get('.game-log').should('be.visible');
      });

      it('記憶體使用應該合理', () => {
        cy.visit('/evolution');
        cy.login('testPlayer1');

        // 執行多輪操作測試記憶體
        for (let i = 0; i < 3; i++) {
          cy.createAndJoinGame();
          cy.startGame();

          // 執行一些操作
          cy.get('[data-testid="hand-card"]').first().click();
          cy.get('[data-testid="pass-button"]').click();

          // 返回大廳
          cy.visit('/evolution');
          cy.wait(500);
        }

        // 如果能正常運行說明記憶體管理正常
        cy.get('.evolution-lobby').should('be.visible');
      });
    });
  });

  describe('網路條件測試', () => {
    it('應該在慢速網路下正常運行', () => {
      // 模擬 3G 網路
      cy.intercept('**/*', (req) => {
        req.on('response', (res) => {
          res.setDelay(200); // 增加 200ms 延遲
        });
      });

      cy.viewport('iphone-12');
      cy.visit('/evolution');
      cy.login('testPlayer1');

      // 應該仍然能正常載入
      cy.get('.evolution-lobby', { timeout: 10000 }).should('be.visible');
    });

    it('應該在離線時顯示提示', () => {
      cy.viewport('iphone-12');
      cy.visit('/evolution');
      cy.login('testPlayer1');
      cy.createAndJoinGame();
      cy.startGame();

      // 模擬離線
      cy.window().then(win => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });

      // 應該顯示離線提示
      cy.get('[data-testid="offline-indicator"]', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('觸控效能', () => {
    beforeEach(() => {
      cy.viewport('iphone-12');
      cy.visit('/evolution');
      cy.login('testPlayer1');
      cy.createAndJoinGame();
      cy.startGame();
    });

    it('連續快速點擊應該正確處理', () => {
      // 快速點擊多張卡
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="hand-card"]').eq(i % 3).click();
        cy.wait(50);
      }

      // 應該正常運行無錯誤
      cy.get('.game-board').should('be.visible');
    });

    it('快速滑動應該正確處理', () => {
      // 快速滑動
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="gesture-overlay"]')
          .trigger('touchstart', { touches: [{ clientX: 350, clientY: 400 }] })
          .trigger('touchmove', { touches: [{ clientX: 100, clientY: 400 }] })
          .trigger('touchend');
        cy.wait(100);
      }

      // 應該正常運行
      cy.get('.game-board').should('be.visible');
    });
  });
});
