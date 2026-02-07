/**
 * E2E 邊界條件測試
 *
 * @file tests/e2e/edge/edge-cases.spec.js
 * 工單 0369
 */

describe('邊界條件測試', () => {
  describe('牌庫耗盡', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('牌庫空時應該顯示提示', () => {
      // 模擬牌庫為空
      cy.window().then((win) => {
        win.localStorage.setItem('mockDeckEmpty', 'true');
      });

      cy.reload();
      cy.get('[data-testid="deck-count"]').should('contain', '0');
    });

    it('牌庫空時應該觸發最後一回合', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockDeckEmpty', 'true');
        win.localStorage.setItem('mockLastRound', 'true');
      });

      cy.reload();
      cy.get('[data-testid="last-round-indicator"]').should('be.visible');
    });

    it('最後一回合結束後應該顯示遊戲結束', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockGameEnd', 'true');
      });

      cy.reload();
      cy.get('[data-testid="game-over-modal"]', { timeout: 10000 })
        .should('be.visible');
    });
  });

  describe('所有生物死亡', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('玩家所有生物死亡時應該顯示提示', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockAllCreaturesDead', 'true');
      });

      cy.reload();
      cy.get('[data-testid="no-creatures-message"]').should('exist');
    });

    it('沒有生物仍應該能打出新生物', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockAllCreaturesDead', 'true');
      });

      cy.reload();
      cy.get('[data-testid="hand-card"]').first().click();
      cy.get('[data-testid="action-creature"]').should('be.visible');
    });

    it('進食階段沒有生物應該自動跳過', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockAllCreaturesDead', 'true');
        win.localStorage.setItem('mockPhase', 'feeding');
      });

      cy.reload();
      // 應該自動跳過或顯示跳過按鈕
      cy.get('[data-testid="pass-button"]').should('exist');
    });
  });

  describe('網路斷線重連', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('斷線時應該顯示離線指示器', () => {
      cy.goOffline();
      cy.get('[data-testid="offline-indicator"]', { timeout: 5000 })
        .should('be.visible');
    });

    it('重連後應該恢復連線狀態', () => {
      cy.goOffline();
      cy.get('[data-testid="offline-indicator"]', { timeout: 5000 })
        .should('be.visible');

      cy.goOnline();
      cy.get('[data-testid="offline-indicator"]')
        .should('not.exist');
    });

    it('斷線時遊戲操作應該被禁用', () => {
      cy.goOffline();

      cy.get('[data-testid="hand-card"]').first().click();
      cy.get('[data-testid="action-creature"]').should('be.disabled');
    });

    it('重連後應該同步遊戲狀態', () => {
      cy.goOffline();
      cy.wait(1000);
      cy.goOnline();

      // 應該請求最新狀態
      cy.get('[data-testid="syncing-indicator"]', { timeout: 5000 })
        .should('exist');
    });
  });

  describe('玩家離開遊戲', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('玩家離開應該顯示通知', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockPlayerLeft', 'true');
      });

      cy.reload();
      cy.get('[data-testid="player-left-notification"]', { timeout: 5000 })
        .should('be.visible');
    });

    it('離開的玩家應該顯示斷線狀態', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockPlayerDisconnected', 'player-2');
      });

      cy.reload();
      cy.get('[data-testid="player-2"]')
        .find('[data-testid="disconnected-badge"]')
        .should('exist');
    });

    it('房主離開應該轉移房主', () => {
      // 在大廳測試
      cy.visit('/evolution');
      cy.login('玩家1', { skipUI: true });
      cy.createRoom('房主離開測試');

      cy.window().then((win) => {
        win.localStorage.setItem('mockHostLeft', 'true');
      });

      cy.reload();
      cy.get('[data-testid="new-host-notification"]')
        .should('exist');
    });
  });

  describe('超時處理', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('玩家超時應該顯示警告', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockTurnTimeout', 'warning');
      });

      cy.reload();
      cy.get('[data-testid="timeout-warning"]', { timeout: 5000 })
        .should('be.visible');
    });

    it('超時後應該自動跳過', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockTurnTimeout', 'skip');
      });

      cy.reload();
      cy.get('[data-testid="auto-pass-notification"]', { timeout: 5000 })
        .should('exist');
    });

    it('應該顯示回合計時器', () => {
      cy.get('[data-testid="turn-timer"]').should('exist');
    });
  });

  describe('無效操作', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('非自己回合點擊應該無效', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockNotMyTurn', 'true');
      });

      cy.reload();
      cy.get('[data-testid="hand-card"]').first().click();
      cy.get('[data-testid="not-your-turn-message"]')
        .should('be.visible');
    });

    it('錯誤階段操作應該顯示提示', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mockPhase', 'feeding');
      });

      cy.reload();
      // 嘗試在進食階段打出卡牌
      cy.get('[data-testid="hand-card"]').first().click();
      cy.get('[data-testid="action-creature"]').click();

      cy.get('[data-testid="invalid-action-message"]')
        .should('be.visible');
    });

    it('目標無效時應該顯示錯誤', () => {
      // 嘗試攻擊無法攻擊的目標
      cy.get('[data-testid="creature-card"]').first()
        .find('[data-testid="attack-button"]')
        .click();

      cy.get('[data-testid="creature-card"]').eq(1).click();

      cy.get('[data-testid="invalid-target-message"]')
        .should('be.visible');
    });
  });

  describe('極端情況', () => {
    it('大量生物時應該正常渲染', () => {
      cy.visit('/evolution/game/test-game-id');

      cy.window().then((win) => {
        win.localStorage.setItem('mockManyCreatures', '20');
      });

      cy.reload();
      cy.get('[data-testid="player-board"]').should('exist');
      cy.get('[data-testid="creature-card"]').should('have.length', 20);
    });

    it('長遊戲（多回合）應該正常', () => {
      cy.visit('/evolution/game/test-game-id');

      cy.window().then((win) => {
        win.localStorage.setItem('mockRound', '50');
      });

      cy.reload();
      cy.get('[data-testid="round-indicator"]').should('contain', '50');
    });

    it('快速連續操作應該正確處理', () => {
      cy.visit('/evolution/game/test-game-id');

      // 快速連續點擊
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="hand-card"]').eq(i % 3).click();
        cy.wait(50);
      }

      // 遊戲應該仍然正常
      cy.get('.game-board').should('be.visible');
    });
  });
});

describe('錯誤恢復', () => {
  it('頁面刷新後應該恢復遊戲狀態', () => {
    cy.visit('/evolution/game/test-game-id');

    // 執行一些操作
    cy.get('[data-testid="hand-card"]').first().click();

    // 刷新頁面
    cy.reload();

    // 應該恢復遊戲狀態
    cy.get('.game-board').should('be.visible');
  });

  it('瀏覽器返回應該正確處理', () => {
    cy.visit('/evolution');
    cy.login('測試玩家', { skipUI: true });
    cy.createRoom('返回測試');

    // 返回
    cy.go('back');

    // 應該返回大廳
    cy.url().should('include', '/evolution');
  });

  it('意外錯誤應該顯示錯誤頁面', () => {
    cy.visit('/evolution/game/test-game-id');

    cy.window().then((win) => {
      win.localStorage.setItem('mockError', 'true');
    });

    cy.reload();
    cy.get('[data-testid="error-boundary"], [data-testid="error-message"]')
      .should('exist');
  });
});
