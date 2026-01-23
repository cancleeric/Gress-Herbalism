/**
 * 動作處理器工廠單元測試
 * 工作單 0026
 */

import {
  getActionHandler,
  createActionHandler,
  processAction,
  registerActionHandler,
  unregisterActionHandler,
  getRegisteredActionTypes,
  isActionTypeRegistered,
  actionHandlers
} from './actionFactory';
import { handleQuestionAction } from './questionAction';
import { handleGuessAction } from './guessAction';
import {
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS,
  GAME_PHASE_PLAYING
} from '../../shared/constants';

describe('actionFactory - 工作單 0026', () => {
  // 建立測試用遊戲狀態
  const createGameState = () => ({
    gameId: 'test_game',
    players: [
      { id: 'p1', name: '玩家1', hand: [], isActive: true, isCurrentTurn: true },
      { id: 'p2', name: '玩家2', hand: [], isActive: true, isCurrentTurn: false },
      { id: 'p3', name: '玩家3', hand: [], isActive: true, isCurrentTurn: false }
    ],
    hiddenCards: [
      { id: 'h1', color: 'red' },
      { id: 'h2', color: 'blue' }
    ],
    currentPlayerIndex: 0,
    gamePhase: GAME_PHASE_PLAYING,
    winner: null,
    gameHistory: []
  });

  describe('getActionHandler', () => {
    test('應該返回問牌處理器', () => {
      const handler = getActionHandler(ACTION_TYPE_QUESTION);
      expect(handler).toBe(handleQuestionAction);
    });

    test('應該返回猜牌處理器', () => {
      const handler = getActionHandler(ACTION_TYPE_GUESS);
      expect(handler).toBe(handleGuessAction);
    });

    test('未知動作類型應返回 null', () => {
      const handler = getActionHandler('unknown');
      expect(handler).toBeNull();
    });
  });

  describe('createActionHandler', () => {
    test('應該返回問牌處理器', () => {
      const handler = createActionHandler(ACTION_TYPE_QUESTION);
      expect(handler).toBe(handleQuestionAction);
    });

    test('應該返回猜牌處理器', () => {
      const handler = createActionHandler(ACTION_TYPE_GUESS);
      expect(handler).toBe(handleGuessAction);
    });

    test('未知動作類型應拋出錯誤', () => {
      expect(() => {
        createActionHandler('unknown');
      }).toThrow('未知的動作類型: unknown');
    });
  });

  describe('processAction', () => {
    test('應該正確處理問牌動作', () => {
      const gameState = createGameState();
      gameState.players[0].hand = [{ id: 'c1', color: 'red' }];
      gameState.players[1].hand = [{ id: 'c2', color: 'yellow' }, { id: 'c3', color: 'red' }];

      const action = {
        type: ACTION_TYPE_QUESTION,
        playerId: 'p1',
        targetPlayerId: 'p2',
        colors: ['red', 'yellow'],
        questionType: 1
      };

      const result = processAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
    });

    test('應該正確處理猜牌動作', () => {
      const gameState = createGameState();
      const action = {
        type: ACTION_TYPE_GUESS,
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      };

      const result = processAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(true);
    });

    test('動作物件為 null 時應返回錯誤', () => {
      const gameState = createGameState();

      const result = processAction(gameState, null);

      expect(result.success).toBe(false);
      expect(result.message).toContain('無效的動作物件');
    });

    test('動作物件缺少 type 時應返回錯誤', () => {
      const gameState = createGameState();
      const action = { playerId: 'p1' };

      const result = processAction(gameState, action);

      expect(result.success).toBe(false);
      expect(result.message).toContain('無效的動作物件');
    });

    test('未知動作類型應返回錯誤', () => {
      const gameState = createGameState();
      const action = { type: 'unknown', playerId: 'p1' };

      const result = processAction(gameState, action);

      expect(result.success).toBe(false);
      expect(result.message).toContain('未知的動作類型');
    });
  });

  describe('registerActionHandler', () => {
    const testActionType = 'testAction';
    const testHandler = (gameState, action) => ({
      success: true,
      gameState,
      message: '測試處理器'
    });

    afterEach(() => {
      // 清理測試用的處理器
      unregisterActionHandler(testActionType);
    });

    test('應該成功註冊新的處理器', () => {
      registerActionHandler(testActionType, testHandler);

      expect(getActionHandler(testActionType)).toBe(testHandler);
    });

    test('註冊的處理器應該可以被 processAction 使用', () => {
      registerActionHandler(testActionType, testHandler);

      const gameState = createGameState();
      const result = processAction(gameState, { type: testActionType });

      expect(result.success).toBe(true);
      expect(result.message).toBe('測試處理器');
    });

    test('處理器不是函數時應拋出錯誤', () => {
      expect(() => {
        registerActionHandler(testActionType, 'not a function');
      }).toThrow('處理器必須是函數');
    });
  });

  describe('unregisterActionHandler', () => {
    const testActionType = 'testUnregister';
    const testHandler = () => ({ success: true });

    test('應該成功取消註冊處理器', () => {
      registerActionHandler(testActionType, testHandler);
      expect(getActionHandler(testActionType)).toBe(testHandler);

      const result = unregisterActionHandler(testActionType);

      expect(result).toBe(true);
      expect(getActionHandler(testActionType)).toBeNull();
    });

    test('取消註冊不存在的處理器應返回 false', () => {
      const result = unregisterActionHandler('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getRegisteredActionTypes', () => {
    test('應該包含問牌和猜牌動作類型', () => {
      const types = getRegisteredActionTypes();

      expect(types).toContain(ACTION_TYPE_QUESTION);
      expect(types).toContain(ACTION_TYPE_GUESS);
    });
  });

  describe('isActionTypeRegistered', () => {
    test('問牌動作類型應該已註冊', () => {
      expect(isActionTypeRegistered(ACTION_TYPE_QUESTION)).toBe(true);
    });

    test('猜牌動作類型應該已註冊', () => {
      expect(isActionTypeRegistered(ACTION_TYPE_GUESS)).toBe(true);
    });

    test('未知動作類型應該未註冊', () => {
      expect(isActionTypeRegistered('unknown')).toBe(false);
    });
  });

  describe('工廠模式', () => {
    test('actionHandlers 應該包含預設的處理器', () => {
      expect(actionHandlers[ACTION_TYPE_QUESTION]).toBe(handleQuestionAction);
      expect(actionHandlers[ACTION_TYPE_GUESS]).toBe(handleGuessAction);
    });

    test('可以動態擴展處理器', () => {
      const customType = 'customAction';
      const customHandler = () => ({ success: true, message: 'custom' });

      // 註冊
      registerActionHandler(customType, customHandler);
      expect(isActionTypeRegistered(customType)).toBe(true);

      // 使用
      const gameState = createGameState();
      const result = processAction(gameState, { type: customType });
      expect(result.success).toBe(true);

      // 清理
      unregisterActionHandler(customType);
      expect(isActionTypeRegistered(customType)).toBe(false);
    });
  });
});
