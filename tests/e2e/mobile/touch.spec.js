/**
 * 移動端觸控測試
 *
 * @file tests/e2e/mobile/touch.spec.js
 */

describe.skip('移動端觸控操作', () => {
  beforeEach(() => {
    // 設定移動端視窗大小
    cy.viewport('iphone-12');
    cy.visit('/evolution');
    cy.login('testPlayer1');
  });

  describe('觸控基本操作', () => {
    it('應該能點擊選擇卡牌', () => {
      cy.createAndJoinGame();
      cy.startGame();

      // 點擊手牌
      cy.get('[data-testid="hand-card"]').first()
        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
        .trigger('touchend');

      cy.get('[data-testid="hand-card"]').first()
        .should('have.class', 'selected');
    });

    it('應該能長按顯示卡牌詳情', () => {
      cy.createAndJoinGame();
      cy.startGame();

      // 長按手牌
      cy.get('[data-testid="hand-card"]').first()
        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });

      // 等待長按觸發
      cy.wait(600);

      cy.get('[data-testid="touch-card-detail"]')
        .should('be.visible');

      // 關閉詳情
      cy.get('[data-testid="touch-card-detail"]').click();
    });

    it('應該能拖放卡牌創建生物', () => {
      cy.createAndJoinGame();
      cy.startGame();

      const dataTransfer = new DataTransfer();

      cy.get('[data-testid="hand-card"]').first()
        .trigger('dragstart', { dataTransfer });

      cy.get('[data-testid="new-creature-zone"]')
        .trigger('drop', { dataTransfer });

      cy.get('[data-testid="creature-card"]')
        .should('have.length.at.least', 1);
    });
  });

  describe('滑動手勢', () => {
    it('應該能左滑跳過回合', () => {
      cy.createAndJoinGame();
      cy.startGame();

      // 從右邊緣左滑
      cy.get('[data-testid="gesture-overlay"]')
        .trigger('touchstart', { touches: [{ clientX: 390, clientY: 400 }] })
        .trigger('touchmove', { touches: [{ clientX: 200, clientY: 400 }] })
        .trigger('touchend');

      // 應該執行跳過
      cy.get('[data-testid="phase-indicator"]')
        .should('contain', '等待');
    });

    it('應該能滑動選擇多張卡', () => {
      cy.createAndJoinGame();
      cy.startGame();

      // 滑動選擇
      cy.get('[data-testid="swipe-card-selector"]')
        .trigger('touchstart', { touches: [{ clientX: 50, clientY: 500 }] })
        .wait(200)
        .trigger('touchmove', { touches: [{ clientX: 300, clientY: 500 }] })
        .trigger('touchend');

      // 應該選中多張卡
      cy.get('[data-testid="hand-card"].is-swipe-selected')
        .should('have.length.at.least', 1);
    });
  });

  describe('雙指縮放', () => {
    it('應該能雙指縮放遊戲板', () => {
      cy.createAndJoinGame();
      cy.startGame();

      // 模擬雙指縮放
      cy.get('[data-testid="pinch-zoom-container"]')
        .trigger('touchstart', {
          touches: [
            { clientX: 150, clientY: 300 },
            { clientX: 250, clientY: 300 }
          ]
        })
        .trigger('touchmove', {
          touches: [
            { clientX: 100, clientY: 300 },
            { clientX: 300, clientY: 300 }
          ]
        })
        .trigger('touchend');

      // 應該顯示縮放指示器
      cy.get('.pinch-zoom-container__indicator')
        .should('be.visible');
    });

    it('應該能雙擊重置縮放', () => {
      cy.createAndJoinGame();
      cy.startGame();

      // 先縮放
      cy.get('[data-testid="pinch-zoom-container"]')
        .trigger('touchstart', {
          touches: [
            { clientX: 150, clientY: 300 },
            { clientX: 250, clientY: 300 }
          ]
        })
        .trigger('touchmove', {
          touches: [
            { clientX: 100, clientY: 300 },
            { clientX: 300, clientY: 300 }
          ]
        })
        .trigger('touchend');

      // 雙擊重置
      cy.get('[data-testid="pinch-zoom-container"]')
        .trigger('touchend')
        .wait(100)
        .trigger('touchend');

      // 縮放指示器應該消失
      cy.get('.pinch-zoom-container__indicator')
        .should('not.exist');
    });
  });
});

describe.skip('螢幕旋轉', () => {
  it('應該正確處理直向模式', () => {
    cy.viewport('iphone-12');
    cy.visit('/evolution');
    cy.login('testPlayer1');
    cy.createAndJoinGame();
    cy.startGame();

    // 驗證直向佈局
    cy.get('.game-board').should('have.css', 'flex-direction', 'column');
  });

  it('應該正確處理橫向模式', () => {
    cy.viewport(844, 390); // iPhone 12 橫向
    cy.visit('/evolution');
    cy.login('testPlayer1');
    cy.createAndJoinGame();
    cy.startGame();

    // 驗證橫向佈局
    cy.get('.opponent-area').should('be.visible');
  });

  it('應該在旋轉後保持遊戲狀態', () => {
    cy.viewport('iphone-12');
    cy.visit('/evolution');
    cy.login('testPlayer1');
    cy.createAndJoinGame();
    cy.startGame();

    // 記錄手牌數量
    cy.get('[data-testid="hand-card"]').its('length').as('cardCount');

    // 旋轉螢幕
    cy.viewport(844, 390);

    // 驗證手牌數量不變
    cy.get('@cardCount').then(count => {
      cy.get('[data-testid="hand-card"]').should('have.length', count);
    });
  });
});

describe.skip('鍵盤彈出處理', () => {
  it('應該在輸入時調整佈局', () => {
    cy.viewport('iphone-12');
    cy.visit('/evolution/lobby');
    cy.login('testPlayer1');

    // 點擊輸入框
    cy.get('[data-testid="room-name-input"]').click();

    // 手牌區應該保持可見或調整位置
    cy.get('.lobby-content').should('be.visible');
  });
});

describe.skip('效能測試', () => {
  it('應該在移動端流暢運行', () => {
    cy.viewport('iphone-12');
    cy.visit('/evolution');
    cy.login('testPlayer1');

    const startTime = Date.now();

    cy.createAndJoinGame();
    cy.startGame();

    // 執行多個操作
    for (let i = 0; i < 5; i++) {
      cy.get('[data-testid="hand-card"]').first().click();
      cy.wait(100);
    }

    cy.then(() => {
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(10000); // 10 秒內完成
    });
  });

  it('動畫應該流暢（無明顯卡頓）', () => {
    cy.viewport('iphone-12');
    cy.visit('/evolution');
    cy.login('testPlayer1');
    cy.createAndJoinGame();
    cy.startGame();

    // 觸發動畫
    cy.get('[data-testid="hand-card"]').first().click();

    // 檢查動畫元素
    cy.get('.card-base').should('have.css', 'transition');
  });
});
