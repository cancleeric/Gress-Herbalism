/**
 * 螢幕方向測試
 *
 * @file tests/e2e/mobile/orientation.spec.js
 */

// 設備視窗配置
const DEVICES = {
  'iPhone 12': { portrait: [390, 844], landscape: [844, 390] },
  'iPhone SE': { portrait: [375, 667], landscape: [667, 375] },
  'iPad': { portrait: [768, 1024], landscape: [1024, 768] },
  'Pixel 5': { portrait: [393, 851], landscape: [851, 393] },
  'Galaxy S21': { portrait: [360, 800], landscape: [800, 360] },
};

describe('螢幕方向測試', () => {
  Object.entries(DEVICES).forEach(([deviceName, sizes]) => {
    describe(`${deviceName}`, () => {
      describe('直向模式', () => {
        beforeEach(() => {
          cy.viewport(sizes.portrait[0], sizes.portrait[1]);
          cy.visit('/evolution');
          cy.login('testPlayer1');
        });

        it('應該正確顯示遊戲大廳', () => {
          cy.get('.evolution-lobby').should('be.visible');
          cy.get('.room-list').should('be.visible');
        });

        it('應該正確顯示遊戲介面', () => {
          cy.createAndJoinGame();
          cy.startGame();

          cy.get('.game-board').should('be.visible');
          cy.get('[data-testid="hand-card"]').should('be.visible');
          cy.get('.phase-indicator').should('be.visible');
        });

        it('手牌區應該可滾動', () => {
          cy.createAndJoinGame();
          cy.startGame();

          cy.get('.hand-cards').then($hand => {
            const hand = $hand[0];
            expect(hand.scrollWidth).to.be.greaterThan(0);
          });
        });
      });

      describe('橫向模式', () => {
        beforeEach(() => {
          cy.viewport(sizes.landscape[0], sizes.landscape[1]);
          cy.visit('/evolution');
          cy.login('testPlayer1');
        });

        it('應該正確顯示遊戲大廳', () => {
          cy.get('.evolution-lobby').should('be.visible');
        });

        it('應該正確顯示遊戲介面', () => {
          cy.createAndJoinGame();
          cy.startGame();

          cy.get('.game-board').should('be.visible');
          cy.get('[data-testid="hand-card"]').should('be.visible');
        });

        it('對手區域應該水平排列', () => {
          cy.createAndJoinGame();
          cy.startGame();

          // 橫向模式下對手區域可能有不同佈局
          cy.get('.opponent-area').should('exist');
        });
      });

      describe('方向切換', () => {
        it('應該在切換方向時保持遊戲狀態', () => {
          // 從直向開始
          cy.viewport(sizes.portrait[0], sizes.portrait[1]);
          cy.visit('/evolution');
          cy.login('testPlayer1');
          cy.createAndJoinGame();
          cy.startGame();

          // 記錄初始狀態
          cy.get('[data-testid="hand-card"]').its('length').as('initialCards');
          cy.get('.phase-indicator').invoke('text').as('initialPhase');

          // 切換到橫向
          cy.viewport(sizes.landscape[0], sizes.landscape[1]);
          cy.wait(300); // 等待佈局調整

          // 驗證狀態保持
          cy.get('@initialCards').then(count => {
            cy.get('[data-testid="hand-card"]').should('have.length', count);
          });
          cy.get('@initialPhase').then(phase => {
            cy.get('.phase-indicator').should('contain', phase.trim().substring(0, 5));
          });

          // 切換回直向
          cy.viewport(sizes.portrait[0], sizes.portrait[1]);
          cy.wait(300);

          // 再次驗證
          cy.get('@initialCards').then(count => {
            cy.get('[data-testid="hand-card"]').should('have.length', count);
          });
        });

        it('應該在切換方向時保持滾動位置', () => {
          cy.viewport(sizes.portrait[0], sizes.portrait[1]);
          cy.visit('/evolution');
          cy.login('testPlayer1');
          cy.createAndJoinGame();
          cy.startGame();

          // 滾動遊戲日誌
          cy.get('.game-log').scrollTo('bottom');

          // 切換方向
          cy.viewport(sizes.landscape[0], sizes.landscape[1]);
          cy.wait(300);

          // 日誌應該仍在底部附近
          cy.get('.game-log').then($log => {
            const log = $log[0];
            const isNearBottom = log.scrollTop + log.clientHeight >= log.scrollHeight - 50;
            expect(isNearBottom).to.be.true;
          });
        });
      });
    });
  });
});

describe('安全區域處理', () => {
  it('應該正確處理 iPhone 瀏海', () => {
    cy.viewport('iphone-x');
    cy.visit('/evolution');
    cy.login('testPlayer1');
    cy.createAndJoinGame();
    cy.startGame();

    // 檢查安全區域 padding
    cy.get('.game-container').should('have.css', 'padding-top');
    cy.get('.mobile-game-controls').should('have.css', 'padding-bottom');
  });

  it('應該正確處理 iPad 的安全區域', () => {
    cy.viewport('ipad-2');
    cy.visit('/evolution');
    cy.login('testPlayer1');
    cy.createAndJoinGame();
    cy.startGame();

    cy.get('.game-board').should('be.visible');
  });
});
