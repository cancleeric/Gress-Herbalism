/**
 * Cypress 自訂命令
 *
 * @file tests/e2e/support/commands.js
 * 工單 0367
 */

// ==================== 登入相關 ====================

/**
 * 登入測試用戶
 */
Cypress.Commands.add('login', (username, options = {}) => {
  const { skipUI = false } = options;

  if (skipUI) {
    // 直接設置 localStorage 跳過 UI
    cy.window().then((win) => {
      win.localStorage.setItem('testUser', JSON.stringify({
        id: `test-${username}`,
        name: username,
        isTestUser: true,
      }));
    });
  } else {
    // 使用 UI 登入
    cy.get('[data-testid="username-input"]').type(username);
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="user-display"]').should('contain', username);
  }
});

/**
 * 登出
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.get('[data-testid="login-form"]').should('be.visible');
});

// ==================== 遊戲相關 ====================

/**
 * 創建新遊戲房間
 */
Cypress.Commands.add('createRoom', (roomName, maxPlayers = 4) => {
  cy.get('[data-testid="create-room-btn"]').click();

  if (roomName) {
    cy.get('[data-testid="room-name-input"]').type(roomName);
  }

  cy.get('[data-testid="max-players-select"]').select(maxPlayers.toString());
  cy.get('[data-testid="confirm-create-btn"]').click();

  cy.get('[data-testid="room-lobby"]').should('be.visible');
});

/**
 * 加入遊戲房間
 */
Cypress.Commands.add('joinRoom', (roomId) => {
  cy.get(`[data-testid="room-${roomId}"]`).click();
  cy.get('[data-testid="join-room-btn"]').click();

  cy.get('[data-testid="room-lobby"]').should('be.visible');
});

/**
 * 創建並加入遊戲（簡化流程）
 */
Cypress.Commands.add('createAndJoinGame', (options = {}) => {
  const { roomName = '測試房間', maxPlayers = 4 } = options;

  cy.createRoom(roomName, maxPlayers);
});

/**
 * 開始遊戲
 */
Cypress.Commands.add('startGame', () => {
  cy.get('[data-testid="start-game-btn"]').click();
  cy.get('.game-board', { timeout: 10000 }).should('be.visible');
});

/**
 * 設定玩家準備
 */
Cypress.Commands.add('setReady', (isReady = true) => {
  if (isReady) {
    cy.get('[data-testid="ready-btn"]').click();
  } else {
    cy.get('[data-testid="cancel-ready-btn"]').click();
  }
});

// ==================== 遊戲動作 ====================

/**
 * 選擇手牌
 */
Cypress.Commands.add('selectCard', (index = 0) => {
  cy.get('[data-testid="hand-card"]').eq(index).click();
  cy.get('[data-testid="hand-card"]').eq(index).should('have.class', 'selected');
});

/**
 * 作為生物打出卡牌
 */
Cypress.Commands.add('playAsCreature', (cardIndex = 0) => {
  cy.selectCard(cardIndex);
  cy.get('[data-testid="action-creature"]').click();
});

/**
 * 作為性狀打出卡牌
 */
Cypress.Commands.add('playAsTrait', (cardIndex, creatureIndex = 0) => {
  cy.selectCard(cardIndex);
  cy.get('[data-testid="action-trait"]').click();
  cy.get('[data-testid="creature-card"]').eq(creatureIndex).click();
});

/**
 * 進食
 */
Cypress.Commands.add('feedCreature', (creatureIndex = 0) => {
  cy.get('[data-testid="creature-card"]').eq(creatureIndex)
    .find('[data-testid="feed-button"]').click();
});

/**
 * 跳過回合
 */
Cypress.Commands.add('pass', () => {
  cy.get('[data-testid="pass-button"]').click();
});

// ==================== 觸控相關 ====================

/**
 * 模擬長按
 */
Cypress.Commands.add('longPress', { prevSubject: true }, (subject, duration = 500) => {
  cy.wrap(subject)
    .trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    .wait(duration)
    .trigger('touchend');
});

/**
 * 模擬滑動
 */
Cypress.Commands.add('swipe', { prevSubject: true }, (subject, direction, distance = 100) => {
  const start = { clientX: 200, clientY: 400 };
  const end = { ...start };

  switch (direction) {
    case 'left': end.clientX -= distance; break;
    case 'right': end.clientX += distance; break;
    case 'up': end.clientY -= distance; break;
    case 'down': end.clientY += distance; break;
  }

  cy.wrap(subject)
    .trigger('touchstart', { touches: [start] })
    .trigger('touchmove', { touches: [end] })
    .trigger('touchend');
});

/**
 * 模擬雙指縮放
 */
Cypress.Commands.add('pinch', { prevSubject: true }, (subject, scale) => {
  const center = { x: 200, y: 300 };
  const initialDistance = 50;
  const finalDistance = initialDistance * scale;

  cy.wrap(subject)
    .trigger('touchstart', {
      touches: [
        { clientX: center.x - initialDistance, clientY: center.y },
        { clientX: center.x + initialDistance, clientY: center.y }
      ]
    })
    .trigger('touchmove', {
      touches: [
        { clientX: center.x - finalDistance, clientY: center.y },
        { clientX: center.x + finalDistance, clientY: center.y }
      ]
    })
    .trigger('touchend');
});

// ==================== 斷言相關 ====================

/**
 * 驗證遊戲階段
 */
Cypress.Commands.add('assertPhase', (expectedPhase) => {
  cy.get('[data-testid="phase-indicator"]').should('contain', expectedPhase);
});

/**
 * 驗證回合數
 */
Cypress.Commands.add('assertRound', (expectedRound) => {
  cy.get('[data-testid="round-indicator"]').should('contain', expectedRound);
});

/**
 * 驗證食物池數量
 */
Cypress.Commands.add('assertFoodPool', (expectedCount) => {
  cy.get('[data-testid="food-pool-count"]').should('contain', expectedCount);
});

/**
 * 驗證手牌數量
 */
Cypress.Commands.add('assertHandCount', (expectedCount) => {
  cy.get('[data-testid="hand-card"]').should('have.length', expectedCount);
});

/**
 * 驗證生物數量
 */
Cypress.Commands.add('assertCreatureCount', (expectedCount) => {
  cy.get('[data-testid="creature-card"]').should('have.length', expectedCount);
});

// ==================== 網路相關 ====================

/**
 * 模擬離線
 */
Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(false);
    win.dispatchEvent(new Event('offline'));
  });
});

/**
 * 模擬上線
 */
Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(true);
    win.dispatchEvent(new Event('online'));
  });
});

// ==================== 輔助命令 ====================

/**
 * 等待 Socket 連線
 */
Cypress.Commands.add('waitForSocket', (timeout = 5000) => {
  cy.get('[data-testid="connection-status"]', { timeout })
    .should('have.class', 'connected');
});

/**
 * 拍攝螢幕截圖（帶標籤）
 */
Cypress.Commands.add('screenshotWithLabel', (label) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${label}_${timestamp}`);
});
