/**
 * 問牌動作處理器單元測試
 * 工作單 0024
 */

import {
  handleQuestionAction,
  handleType1,
  handleType2,
  handleType3,
  questionTypeHandlers
} from './questionAction';
import {
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  ACTION_TYPE_QUESTION
} from '../../../shared/constants';

describe('questionAction - 工作單 0024', () => {
  // 測試用的手牌資料
  const createCards = (colors) => colors.map((color, index) => ({
    id: `card_${color}_${index}`,
    color
  }));

  // 建立測試用遊戲狀態
  const createGameState = (options = {}) => ({
    gameId: 'test_game',
    players: [
      {
        id: 'p1',
        name: '玩家1',
        hand: options.p1Hand || createCards(['red', 'blue', 'green']),
        isActive: true,
        isCurrentTurn: true
      },
      {
        id: 'p2',
        name: '玩家2',
        hand: options.p2Hand || createCards(['yellow', 'red', 'blue']),
        isActive: true,
        isCurrentTurn: false
      },
      {
        id: 'p3',
        name: '玩家3',
        hand: options.p3Hand || createCards(['green', 'yellow', 'red']),
        isActive: true,
        isCurrentTurn: false
      }
    ],
    currentPlayerIndex: 0,
    gamePhase: 'playing',
    winner: null,
    gameHistory: [],
    ...options
  });

  describe('handleType1 - 兩個顏色各一張', () => {
    test('應該從目標玩家取得兩種顏色各一張牌', () => {
      const playerHand = createCards(['red', 'blue']);
      const targetHand = createCards(['red', 'yellow', 'blue', 'green']);

      const result = handleType1(playerHand, targetHand, 'red', 'yellow');

      expect(result.cardsReceived.length).toBe(2);
      expect(result.cardsReceived.some(c => c.color === 'red')).toBe(true);
      expect(result.cardsReceived.some(c => c.color === 'yellow')).toBe(true);
      expect(result.cardsGiven.length).toBe(0);
      expect(result.hasCards).toBe(true);
    });

    test('目標玩家只有一種顏色時，只取得一張牌', () => {
      const playerHand = createCards(['red']);
      const targetHand = createCards(['red', 'red']);

      const result = handleType1(playerHand, targetHand, 'red', 'blue');

      expect(result.cardsReceived.length).toBe(1);
      expect(result.cardsReceived[0].color).toBe('red');
      expect(result.hasCards).toBe(true);
    });

    test('目標玩家沒有指定顏色時，hasCards 為 false', () => {
      const playerHand = createCards(['red']);
      const targetHand = createCards(['green', 'green']);

      const result = handleType1(playerHand, targetHand, 'red', 'blue');

      expect(result.cardsReceived.length).toBe(0);
      expect(result.hasCards).toBe(false);
    });
  });

  describe('handleType2 - 其中一種顏色全部', () => {
    test('應該取得指定顏色的全部牌', () => {
      const playerHand = createCards(['red']);
      const targetHand = createCards(['red', 'red', 'blue']);

      const result = handleType2(playerHand, targetHand, 'red', 'blue', { selectedColor: 'red' });

      expect(result.cardsReceived.length).toBe(2);
      expect(result.cardsReceived.every(c => c.color === 'red')).toBe(true);
      expect(result.hasCards).toBe(true);
    });

    test('未指定顏色時，優先選擇 color1', () => {
      const playerHand = createCards(['red']);
      const targetHand = createCards(['red', 'blue', 'blue']);

      const result = handleType2(playerHand, targetHand, 'red', 'blue');

      expect(result.cardsReceived.length).toBe(1);
      expect(result.cardsReceived[0].color).toBe('red');
    });

    test('color1 沒有時，選擇 color2', () => {
      const playerHand = createCards(['red']);
      const targetHand = createCards(['blue', 'blue']);

      const result = handleType2(playerHand, targetHand, 'red', 'blue');

      expect(result.cardsReceived.length).toBe(2);
      expect(result.cardsReceived.every(c => c.color === 'blue')).toBe(true);
    });

    test('兩種顏色都沒有時，hasCards 為 false', () => {
      const playerHand = createCards(['red']);
      const targetHand = createCards(['green', 'yellow']);

      const result = handleType2(playerHand, targetHand, 'red', 'blue');

      expect(result.cardsReceived.length).toBe(0);
      expect(result.hasCards).toBe(false);
    });
  });

  describe('handleType3 - 給一張要全部', () => {
    test('應該給一張牌並取得目標顏色的全部牌', () => {
      const playerHand = createCards(['red', 'red', 'blue']);
      const targetHand = createCards(['green', 'green', 'yellow']);

      const result = handleType3(playerHand, targetHand, 'red', 'green', { giveColor: 'red', getColor: 'green' });

      expect(result.cardsGiven.length).toBe(1);
      expect(result.cardsGiven[0].color).toBe('red');
      expect(result.cardsReceived.length).toBe(2);
      expect(result.cardsReceived.every(c => c.color === 'green')).toBe(true);
      expect(result.hasCards).toBe(true);
    });

    test('發起玩家沒有要給的顏色時，無法執行', () => {
      const playerHand = createCards(['blue', 'blue']);
      const targetHand = createCards(['red', 'red']);

      const result = handleType3(playerHand, targetHand, 'red', 'blue', { giveColor: 'red', getColor: 'blue' });

      expect(result.cardsGiven.length).toBe(0);
      expect(result.cardsReceived.length).toBe(0);
      expect(result.hasCards).toBe(false);
    });

    test('目標玩家沒有要拿的顏色時，hasCards 為 false 但仍給出牌', () => {
      const playerHand = createCards(['red', 'blue']);
      const targetHand = createCards(['yellow', 'yellow']);

      const result = handleType3(playerHand, targetHand, 'red', 'green', { giveColor: 'red', getColor: 'green' });

      expect(result.cardsGiven.length).toBe(1);
      expect(result.cardsReceived.length).toBe(0);
      expect(result.hasCards).toBe(false);
    });
  });

  describe('questionTypeHandlers - 策略模式', () => {
    test('應該包含三種問牌類型的處理器', () => {
      expect(questionTypeHandlers[QUESTION_TYPE_ONE_EACH]).toBe(handleType1);
      expect(questionTypeHandlers[QUESTION_TYPE_ALL_ONE_COLOR]).toBe(handleType2);
      expect(questionTypeHandlers[QUESTION_TYPE_GIVE_ONE_GET_ALL]).toBe(handleType3);
    });
  });

  describe('handleQuestionAction - 主要處理函數', () => {
    test('成功執行問牌動作', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: QUESTION_TYPE_ONE_EACH
      };

      const result = handleQuestionAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.result.cardsReceived.length).toBeGreaterThan(0);
      expect(result.gameState.currentPlayerIndex).toBe(1); // 切換到下一個玩家
      expect(result.gameState.gameHistory.length).toBe(1);
    });

    test('不是自己的回合時應該失敗', () => {
      const gameState = createGameState({ currentPlayerIndex: 1 });
      const action = {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'blue'],
        questionType: QUESTION_TYPE_ONE_EACH
      };

      const result = handleQuestionAction(gameState, action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('不是你的回合');
    });

    test('玩家不存在時應該失敗', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'unknown',
        targetPlayerId: 'p2',
        colors: ['red', 'blue'],
        questionType: QUESTION_TYPE_ONE_EACH
      };

      const result = handleQuestionAction(gameState, action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('玩家不存在');
    });

    test('未知的問牌類型應該失敗', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'blue'],
        questionType: 999
      };

      const result = handleQuestionAction(gameState, action);

      expect(result.success).toBe(false);
      // 驗證失敗會來自 validateQuestionType，訊息是「無效的問牌類型」
      expect(result.message).toBe('無效的問牌類型');
    });

    test('應該正確記錄遊戲歷史', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: QUESTION_TYPE_ONE_EACH
      };

      const result = handleQuestionAction(gameState, action);

      expect(result.gameState.gameHistory.length).toBe(1);
      const historyEntry = result.gameState.gameHistory[0];
      expect(historyEntry.type).toBe(ACTION_TYPE_QUESTION);
      expect(historyEntry.playerId).toBe('p1');
      expect(historyEntry.targetPlayerId).toBe('p2');
      expect(historyEntry.colors).toEqual(['red', 'yellow']);
      expect(historyEntry.questionType).toBe(QUESTION_TYPE_ONE_EACH);
      expect(historyEntry.timestamp).toBeDefined();
    });

    test('應該正確更新玩家手牌', () => {
      const p1Hand = createCards(['red', 'blue', 'green']);
      const p2Hand = createCards(['yellow', 'red', 'blue']);
      const gameState = createGameState({ p1Hand, p2Hand });

      const action = {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['yellow', 'red'],
        questionType: QUESTION_TYPE_ONE_EACH
      };

      const result = handleQuestionAction(gameState, action);

      // p1 應該收到牌
      const updatedP1 = result.gameState.players.find(p => p.id === 'p1');
      expect(updatedP1.hand.length).toBe(p1Hand.length + result.result.cardsReceived.length);

      // p2 應該減少牌
      const updatedP2 = result.gameState.players.find(p => p.id === 'p2');
      expect(updatedP2.hand.length).toBe(p2Hand.length - result.result.cardsReceived.length);
    });

    test('類型3問牌應該正確處理給牌和收牌', () => {
      const p1Hand = createCards(['red', 'blue', 'green']);
      const p2Hand = createCards(['yellow', 'yellow', 'blue']);
      const gameState = createGameState({ p1Hand, p2Hand });

      const action = {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: QUESTION_TYPE_GIVE_ONE_GET_ALL,
        giveColor: 'red',
        getColor: 'yellow'
      };

      const result = handleQuestionAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.result.cardsGiven.length).toBe(1);
      expect(result.result.cardsReceived.length).toBe(2);

      // p1 應該少一張紅色，多兩張黃色
      const updatedP1 = result.gameState.players.find(p => p.id === 'p1');
      expect(updatedP1.hand.filter(c => c.color === 'red').length).toBe(0);
      expect(updatedP1.hand.filter(c => c.color === 'yellow').length).toBe(2);

      // p2 應該多一張紅色，沒有黃色
      const updatedP2 = result.gameState.players.find(p => p.id === 'p2');
      expect(updatedP2.hand.filter(c => c.color === 'red').length).toBe(1);
      expect(updatedP2.hand.filter(c => c.color === 'yellow').length).toBe(0);
    });
  });

  describe('結果訊息', () => {
    test('有收到牌時應顯示數量', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: QUESTION_TYPE_ONE_EACH
      };

      const result = handleQuestionAction(gameState, action);

      expect(result.message).toContain('收到');
      expect(result.message).toContain('張牌');
    });

    test('沒有收到牌時應顯示提示訊息', () => {
      const p2Hand = createCards(['green', 'green', 'green']);
      const gameState = createGameState({ p2Hand });
      const action = {
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'blue'],
        questionType: QUESTION_TYPE_ONE_EACH
      };

      const result = handleQuestionAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.message).toBe('目標玩家沒有該顏色的牌');
    });
  });
});
