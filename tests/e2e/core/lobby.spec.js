/**
 * E2E 大廳流程測試
 *
 * @file tests/e2e/core/lobby.spec.js
 * 工單 0368
 */

describe('演化論遊戲大廳', () => {
  beforeEach(() => {
    cy.visit('/evolution');
  });

  describe('頁面載入', () => {
    it('應該載入大廳頁面', () => {
      cy.get('.evolution-lobby, .evolution-page, [data-testid="evolution-container"]')
        .should('exist');
    });

    it('應該顯示遊戲標題', () => {
      cy.contains('演化論').should('be.visible');
    });

    it('應該顯示創建房間按鈕', () => {
      cy.login('測試玩家', { skipUI: true });
      cy.get('[data-testid="create-room-btn"]').should('be.visible');
    });
  });

  describe('房間列表', () => {
    beforeEach(() => {
      cy.login('測試玩家', { skipUI: true });
    });

    it('應該顯示房間列表區域', () => {
      cy.get('[data-testid="room-list"]').should('exist');
    });

    it('無房間時應該顯示提示', () => {
      cy.get('[data-testid="no-rooms-message"], [data-testid="empty-room-list"]')
        .should('exist');
    });

    it('應該能刷新房間列表', () => {
      cy.get('[data-testid="refresh-rooms-btn"]').click();
      // 驗證刷新後列表仍存在
      cy.get('[data-testid="room-list"]').should('exist');
    });
  });

  describe('房間創建流程', () => {
    beforeEach(() => {
      cy.login('測試玩家', { skipUI: true });
    });

    it('點擊創建按鈕應該打開表單', () => {
      cy.get('[data-testid="create-room-btn"]').click();
      cy.get('[data-testid="create-room-form"], [data-testid="create-room-modal"]')
        .should('be.visible');
    });

    it('房間名稱應該有字數限制', () => {
      cy.get('[data-testid="create-room-btn"]').click();
      cy.get('[data-testid="room-name-input"]')
        .should('have.attr', 'maxlength');
    });

    it('應該能取消創建', () => {
      cy.get('[data-testid="create-room-btn"]').click();
      cy.get('[data-testid="cancel-create-btn"]').click();
      cy.get('[data-testid="create-room-form"]').should('not.exist');
    });

    it('空房間名稱應該使用預設值', () => {
      cy.get('[data-testid="create-room-btn"]').click();
      cy.get('[data-testid="confirm-create-btn"]').click();

      // 應該使用玩家名稱作為房間名
      cy.get('[data-testid="room-lobby"]').should('be.visible');
    });
  });

  describe('房間大廳', () => {
    beforeEach(() => {
      cy.login('測試玩家', { skipUI: true });
      cy.createRoom('大廳測試');
    });

    it('應該顯示玩家列表', () => {
      cy.get('[data-testid="player-list"]').should('be.visible');
    });

    it('應該顯示當前玩家', () => {
      cy.get('[data-testid="player-list"]')
        .should('contain', '測試玩家');
    });

    it('應該顯示房間設定', () => {
      cy.get('[data-testid="room-settings"]').should('exist');
    });

    it('房主應該能離開房間', () => {
      cy.get('[data-testid="leave-room-btn"]').click();
      cy.get('[data-testid="room-list"]').should('be.visible');
    });
  });

  describe('聊天功能', () => {
    beforeEach(() => {
      cy.login('測試玩家', { skipUI: true });
      cy.createRoom('聊天測試');
    });

    it('應該顯示聊天區域', () => {
      cy.get('[data-testid="chat-area"]').should('exist');
    });

    it('應該能發送訊息', () => {
      cy.get('[data-testid="chat-input"]').type('Hello!');
      cy.get('[data-testid="send-message-btn"]').click();

      cy.get('[data-testid="chat-messages"]')
        .should('contain', 'Hello!');
    });
  });
});

describe('使用者驗證', () => {
  it('未登入應該重導向', () => {
    cy.visit('/evolution');
    cy.get('[data-testid="login-form"], [data-testid="login-prompt"]')
      .should('exist');
  });

  it('登入後應該顯示使用者名稱', () => {
    cy.visit('/evolution');
    cy.login('測試玩家', { skipUI: true });
    cy.reload();

    cy.get('[data-testid="user-display"]')
      .should('contain', '測試玩家');
  });
});
