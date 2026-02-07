/**
 * E2E 遊戲操作測試
 *
 * @file tests/e2e/core/gameplay.spec.js
 * 工單 0368
 */

describe('遊戲操作', () => {
  // 這些測試假設遊戲已經開始
  // 需要 mock 或真實的多玩家環境

  describe('手牌操作', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('應該顯示手牌區域', () => {
      cy.get('[data-testid="hand-area"]').should('exist');
    });

    it('點擊卡牌應該選中', () => {
      cy.get('[data-testid="hand-card"]').first().click();
      cy.get('[data-testid="hand-card"]').first()
        .should('have.class', 'selected');
    });

    it('再次點擊應該取消選中', () => {
      cy.get('[data-testid="hand-card"]').first().click();
      cy.get('[data-testid="hand-card"]').first().click();
      cy.get('[data-testid="hand-card"]').first()
        .should('not.have.class', 'selected');
    });

    it('雙擊應該翻轉卡牌', () => {
      cy.get('[data-testid="hand-card"]').first().dblclick();
      cy.get('[data-testid="hand-card"]').first()
        .should('have.class', 'flipped');
    });

    it('選中後應該顯示操作按鈕', () => {
      cy.get('[data-testid="hand-card"]').first().click();

      cy.get('[data-testid="action-creature"]').should('be.visible');
      cy.get('[data-testid="action-trait"]').should('be.visible');
    });
  });

  describe('生物操作', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('應該顯示玩家生物區', () => {
      cy.get('[data-testid="player-board"]').should('exist');
    });

    it('生物卡應該顯示性狀', () => {
      cy.get('[data-testid="creature-card"]').first()
        .find('[data-testid="creature-traits"]')
        .should('exist');
    });

    it('生物卡應該顯示食物狀態', () => {
      cy.get('[data-testid="creature-card"]').first()
        .find('[data-testid="food-indicator"]')
        .should('exist');
    });

    it('進食階段應該顯示進食按鈕', () => {
      // 假設當前是進食階段
      cy.get('[data-testid="creature-card"]').first()
        .find('[data-testid="feed-button"]')
        .should('exist');
    });
  });

  describe('食物池', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('應該顯示食物池', () => {
      cy.get('[data-testid="food-pool"]').should('exist');
    });

    it('應該顯示食物數量', () => {
      cy.get('[data-testid="food-pool-count"]').should('exist');
    });
  });

  describe('階段指示器', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('應該顯示當前階段', () => {
      cy.get('[data-testid="phase-indicator"]').should('exist');
    });

    it('應該顯示回合數', () => {
      cy.get('[data-testid="round-indicator"]').should('exist');
    });

    it('應該顯示當前玩家', () => {
      cy.get('[data-testid="current-player-indicator"]').should('exist');
    });
  });

  describe('跳過功能', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('應該顯示跳過按鈕', () => {
      cy.get('[data-testid="pass-button"]').should('exist');
    });

    it('點擊跳過應該確認', () => {
      cy.get('[data-testid="pass-button"]').click();
      // 可能有確認對話框
      cy.get('[data-testid="confirm-pass-btn"], [data-testid="pass-button"]')
        .first().click();
    });
  });

  describe('遊戲日誌', () => {
    beforeEach(() => {
      cy.visit('/evolution/game/test-game-id');
    });

    it('應該顯示遊戲日誌', () => {
      cy.get('[data-testid="game-log"]').should('exist');
    });

    it('日誌應該可滾動', () => {
      cy.get('[data-testid="game-log"]')
        .should('have.css', 'overflow-y', 'auto');
    });
  });
});

describe('攻擊系統', () => {
  beforeEach(() => {
    cy.visit('/evolution/game/test-game-id');
  });

  it('肉食動物應該能攻擊', () => {
    // 假設有肉食動物
    cy.get('[data-testid="creature-card"][data-has-carnivore="true"]')
      .first()
      .find('[data-testid="attack-button"]')
      .should('exist');
  });

  it('攻擊時應該顯示可攻擊目標', () => {
    cy.get('[data-testid="creature-card"][data-has-carnivore="true"]')
      .first()
      .find('[data-testid="attack-button"]')
      .click();

    cy.get('[data-testid="creature-card"].attackable')
      .should('exist');
  });

  it('防禦者應該能選擇防禦', () => {
    // 假設當前需要防禦
    cy.get('[data-testid="defense-options"]').should('exist');
  });
});

describe('特殊能力', () => {
  beforeEach(() => {
    cy.visit('/evolution/game/test-game-id');
  });

  it('冬眠生物應該顯示冬眠選項', () => {
    cy.get('[data-testid="creature-card"][data-has-hibernation="true"]')
      .first()
      .find('[data-testid="hibernate-button"]')
      .should('exist');
  });

  it('掠奪者應該顯示掠奪選項', () => {
    cy.get('[data-testid="creature-card"][data-has-robbery="true"]')
      .first()
      .find('[data-testid="robbery-button"]')
      .should('exist');
  });
});
