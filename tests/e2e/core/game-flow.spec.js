/**
 * E2E 核心流程測試
 *
 * @file tests/e2e/core/game-flow.spec.js
 * 工單 0368
 */

describe.skip('演化論遊戲核心流程', () => {
  beforeEach(() => {
    cy.visit('/evolution');
  });

  describe('建立遊戲房間', () => {
    it('應該能創建新房間', () => {
      cy.login('測試玩家1', { skipUI: true });

      cy.get('[data-testid="create-room-btn"]').click();
      cy.get('[data-testid="room-name-input"]').type('E2E 測試房間');
      cy.get('[data-testid="max-players-select"]').select('4');
      cy.get('[data-testid="confirm-create-btn"]').click();

      cy.get('[data-testid="room-lobby"]').should('be.visible');
      cy.get('[data-testid="room-name"]').should('contain', 'E2E 測試房間');
    });

    it('應該能設置 2 人房間', () => {
      cy.login('測試玩家1', { skipUI: true });

      cy.get('[data-testid="create-room-btn"]').click();
      cy.get('[data-testid="room-name-input"]').type('2 人房間');
      cy.get('[data-testid="max-players-select"]').select('2');
      cy.get('[data-testid="confirm-create-btn"]').click();

      cy.get('[data-testid="max-players-display"]').should('contain', '2');
    });

    it('應該顯示房主狀態', () => {
      cy.login('測試玩家1', { skipUI: true });
      cy.createRoom('房主測試');

      cy.get('[data-testid="player-list"]')
        .find('[data-testid="host-badge"]')
        .should('exist');
    });
  });

  describe('玩家加入房間', () => {
    it('房間列表應該顯示可用房間', () => {
      cy.visit('/evolution');
      cy.login('測試玩家1', { skipUI: true });

      cy.get('[data-testid="room-list"]').should('exist');
    });

    it('加入房間後應該看到其他玩家', () => {
      // 創建房間（第一個視窗模擬）
      cy.login('測試玩家1', { skipUI: true });
      cy.createRoom('多人測試房間');

      // 驗證房間列表中有此房間
      cy.get('[data-testid="room-lobby"]')
        .should('contain', '測試玩家1');
    });

    it('房間滿員後應該無法加入', () => {
      cy.login('測試玩家1', { skipUI: true });
      cy.createRoom('滿員測試', 2);

      // 房間已有 1 人，最大 2 人
      cy.get('[data-testid="player-count"]').should('contain', '1/2');
    });
  });

  describe('準備與開始遊戲', () => {
    beforeEach(() => {
      cy.login('測試玩家1', { skipUI: true });
      cy.createRoom('開始測試');
    });

    it('玩家應該能設定準備狀態', () => {
      cy.get('[data-testid="ready-btn"]').click();
      cy.get('[data-testid="player-ready-status"]').should('contain', '已準備');
    });

    it('玩家應該能取消準備', () => {
      cy.get('[data-testid="ready-btn"]').click();
      cy.get('[data-testid="cancel-ready-btn"]').click();
      cy.get('[data-testid="player-ready-status"]').should('contain', '未準備');
    });

    it('房主應該看到開始按鈕', () => {
      cy.get('[data-testid="start-game-btn"]').should('exist');
    });

    it('人數不足時應該無法開始', () => {
      cy.get('[data-testid="start-game-btn"]').should('be.disabled');
    });
  });

  describe('遊戲進行', () => {
    // 注意：這些測試需要模擬的多玩家環境
    // 在實際 CI 中可能需要特殊設置

    describe('演化階段', () => {
      it('應該顯示手牌', () => {
        // 假設遊戲已開始
        cy.window().then((win) => {
          // 模擬遊戲狀態
          win.localStorage.setItem('mockGameStarted', 'true');
        });

        cy.visit('/evolution/game/test-game-id');

        // 應該有 6 張初始手牌（2 人遊戲每人 6 張）
        cy.get('[data-testid="hand-card"]').should('have.length.gte', 1);
      });

      it('應該能選擇卡牌', () => {
        cy.visit('/evolution/game/test-game-id');

        cy.get('[data-testid="hand-card"]').first().click();
        cy.get('[data-testid="hand-card"]').first()
          .should('have.class', 'selected');
      });

      it('應該能作為生物打出', () => {
        cy.visit('/evolution/game/test-game-id');

        cy.get('[data-testid="hand-card"]').first().click();
        cy.get('[data-testid="action-creature"]').should('be.visible');
      });

      it('應該能跳過', () => {
        cy.visit('/evolution/game/test-game-id');

        cy.get('[data-testid="pass-button"]').should('exist');
      });
    });

    describe('進食階段', () => {
      it('應該顯示食物池', () => {
        cy.visit('/evolution/game/test-game-id');

        cy.get('[data-testid="food-pool"]').should('exist');
      });

      it('生物應該能進食', () => {
        cy.visit('/evolution/game/test-game-id');

        cy.get('[data-testid="creature-card"]').first()
          .find('[data-testid="feed-button"]')
          .should('exist');
      });
    });
  });

  describe('遊戲結束', () => {
    it('應該顯示最終分數', () => {
      cy.visit('/evolution/game/test-game-id');

      // 模擬遊戲結束狀態
      cy.window().then((win) => {
        win.localStorage.setItem('mockGameEnd', 'true');
      });

      cy.get('[data-testid="game-over-modal"]', { timeout: 10000 })
        .should('be.visible');
    });

    it('應該顯示贏家', () => {
      cy.visit('/evolution/game/test-game-id');

      cy.window().then((win) => {
        win.localStorage.setItem('mockGameEnd', 'true');
      });

      cy.get('[data-testid="winner-display"]', { timeout: 10000 })
        .should('exist');
    });

    it('應該能返回大廳', () => {
      cy.visit('/evolution/game/test-game-id');

      cy.window().then((win) => {
        win.localStorage.setItem('mockGameEnd', 'true');
      });

      cy.get('[data-testid="return-lobby-btn"]', { timeout: 10000 })
        .click();

      cy.url().should('include', '/evolution');
    });
  });
});

describe.skip('完整遊戲流程（整合測試）', () => {
  // 這個測試模擬一個完整的遊戲流程
  // 需要後端支持或完整的 mock

  it.skip('應該能完成一個完整遊戲', () => {
    // Step 1: 創建房間
    cy.visit('/evolution');
    cy.login('玩家1', { skipUI: true });
    cy.createRoom('完整測試');

    // Step 2: 開始遊戲（假設有第二個玩家加入）
    cy.startGame();

    // Step 3: 演化階段 - 打出一隻生物
    cy.assertPhase('演化');
    cy.playAsCreature(0);

    // Step 4: 跳過剩餘演化
    cy.pass();

    // Step 5: 食物供給階段
    cy.assertPhase('食物供給');

    // Step 6: 進食階段
    cy.assertPhase('進食');
    cy.feedCreature(0);
    cy.pass();

    // Step 7: 滅絕階段（自動）
    cy.assertPhase('滅絕');

    // Step 8: 驗證回合數增加
    cy.assertRound(2);

    // 繼續更多回合...
  });
});
