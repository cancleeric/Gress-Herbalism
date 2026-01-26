/**
 * useAIPlayers Hook 測試
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useAIPlayers from '../useAIPlayers';
import { AI_DIFFICULTY } from '../../shared/constants';

// Mock 需要在測試之前設置
const mockCreateAIPlayer = jest.fn();

jest.mock('../../ai', () => {
  const actualModule = jest.requireActual('../../ai');
  return {
    ...actualModule,
    createAIPlayer: (...args) => mockCreateAIPlayer(...args)
  };
});

// Mock 實現函數
const createMockAIPlayer = (id, name, difficulty) => ({
  id,
  name: name || `AI-${id}`,
  difficulty: difficulty || 'medium',
  isAI: true,
  takeTurn: jest.fn().mockResolvedValue({ type: 'guess', guessedColors: ['red', 'blue'] }),
  decideFollowGuess: jest.fn().mockResolvedValue(true),
  onGameEvent: jest.fn(),
  reset: jest.fn()
});

describe('useAIPlayers', () => {
  const mockGameState = {
    players: [
      { id: 'human-1', name: '玩家1', isAI: false },
      { id: 'ai-1', name: 'AI-1', isAI: true },
      { id: 'ai-2', name: 'AI-2', isAI: true }
    ],
    currentPlayerIndex: 1,
    gamePhase: 'playing'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 設置 mock 實現
    mockCreateAIPlayer.mockImplementation(createMockAIPlayer);
  });

  describe('初始化', () => {
    test('應該初始化空的 AI 玩家陣列（無配置）', () => {
      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig: null,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      expect(result.current.aiPlayers).toEqual([]);
      expect(result.current.aiThinking).toBe(false);
      expect(result.current.currentAIId).toBeNull();
    });

    test('應該根據 aiConfig 初始化 AI 玩家', () => {
      const aiConfig = {
        aiCount: 2,
        difficulties: [AI_DIFFICULTY.EASY, AI_DIFFICULTY.HARD]
      };

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      expect(result.current.aiPlayers).toHaveLength(2);
      expect(result.current.aiPlayers[0].id).toBe('ai-1');
      expect(result.current.aiPlayers[0].difficulty).toBe(AI_DIFFICULTY.EASY);
      expect(result.current.aiPlayers[1].id).toBe('ai-2');
      expect(result.current.aiPlayers[1].difficulty).toBe(AI_DIFFICULTY.HARD);
    });

    test('應該使用預設難度（medium）', () => {
      const aiConfig = {
        aiCount: 1,
        difficulties: [] // 空陣列
      };

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      expect(result.current.aiPlayers).toHaveLength(1);
      expect(result.current.aiPlayers[0].difficulty).toBe('medium');
    });
  });

  describe('isAIPlayer', () => {
    test('應該正確識別 AI 玩家（isAI 標記）', () => {
      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig: { aiCount: 1, difficulties: ['easy'] },
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      expect(result.current.isAIPlayer({ id: 'ai-1', isAI: true })).toBe(true);
      expect(result.current.isAIPlayer({ id: 'human-1', isAI: false })).toBe(false);
    });

    test('應該正確識別 AI 玩家（playerType 標記）', () => {
      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig: { aiCount: 1, difficulties: ['easy'] },
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      expect(result.current.isAIPlayer({ id: 'ai-1', playerType: 'ai' })).toBe(true);
      expect(result.current.isAIPlayer({ id: 'human-1', playerType: 'human' })).toBe(false);
    });

    test('應該正確識別 AI 玩家（id 前綴）', () => {
      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig: { aiCount: 1, difficulties: ['easy'] },
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      expect(result.current.isAIPlayer({ id: 'ai-123' })).toBe(true);
      expect(result.current.isAIPlayer({ id: 'player-123' })).toBe(false);
    });

    test('應該處理 null/undefined', () => {
      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig: { aiCount: 1, difficulties: ['easy'] },
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      expect(result.current.isAIPlayer(null)).toBe(false);
      expect(result.current.isAIPlayer(undefined)).toBe(false);
    });
  });

  describe('getAIInstance', () => {
    test('應該找到對應的 AI 實例', () => {
      const aiConfig = { aiCount: 2, difficulties: ['easy', 'hard'] };

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      const ai1 = result.current.getAIInstance('ai-1');
      const ai2 = result.current.getAIInstance('ai-2');

      expect(ai1).toBeDefined();
      expect(ai1.id).toBe('ai-1');
      expect(ai2).toBeDefined();
      expect(ai2.id).toBe('ai-2');
    });

    test('找不到時應該返回 undefined', () => {
      const aiConfig = { aiCount: 1, difficulties: ['easy'] };

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      const notFound = result.current.getAIInstance('ai-999');
      expect(notFound).toBeUndefined();
    });
  });

  describe('handleAITurn', () => {
    test('應該執行 AI 決策並調用回調', async () => {
      const aiConfig = { aiCount: 1, difficulties: ['medium'] };
      const onAIAction = jest.fn();

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction
        })
      );

      const aiPlayer = { id: 'ai-1', isAI: true };

      await act(async () => {
        await result.current.handleAITurn(aiPlayer);
      });

      // 應該設定 thinking 狀態
      await waitFor(() => {
        expect(onAIAction).toHaveBeenCalled();
      });

      // thinking 狀態應該恢復
      expect(result.current.aiThinking).toBe(false);
      expect(result.current.currentAIId).toBeNull();
    });

    test('非 AI 玩家不應該執行', async () => {
      const aiConfig = { aiCount: 1, difficulties: ['medium'] };
      const onAIAction = jest.fn();

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction
        })
      );

      const humanPlayer = { id: 'human-1', isAI: false };

      await act(async () => {
        await result.current.handleAITurn(humanPlayer);
      });

      expect(onAIAction).not.toHaveBeenCalled();
    });

    test('找不到 AI 實例時應該警告', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const aiConfig = { aiCount: 1, difficulties: ['medium'] };
      const onAIAction = jest.fn();

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction
        })
      );

      const unknownAI = { id: 'ai-999', isAI: true };

      await act(async () => {
        await result.current.handleAITurn(unknownAI);
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('找不到 AI 實例'));
      expect(onAIAction).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('handleAIFollowGuess', () => {
    test('應該執行 AI 跟猜決策', async () => {
      const aiConfig = { aiCount: 1, difficulties: ['hard'] };

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      const aiPlayer = { id: 'ai-1', isAI: true };
      const guessedColors = ['red', 'blue'];

      let decision;
      await act(async () => {
        decision = await result.current.handleAIFollowGuess(aiPlayer, guessedColors);
      });

      expect(decision).toBe(true);
      expect(result.current.aiThinking).toBe(false);
    });

    test('非 AI 玩家應該返回 null', async () => {
      const aiConfig = { aiCount: 1, difficulties: ['hard'] };

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      const humanPlayer = { id: 'human-1', isAI: false };

      let decision;
      await act(async () => {
        decision = await result.current.handleAIFollowGuess(humanPlayer, ['red', 'blue']);
      });

      expect(decision).toBeNull();
    });
  });

  describe('handleGameEvent', () => {
    test('應該將事件傳遞給所有 AI 實例', () => {
      const aiConfig = { aiCount: 2, difficulties: ['easy', 'medium'] };

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      const event = {
        type: 'CARD_TRANSFER',
        receiver: 'ai-1',
        cards: [{ color: 'red' }]
      };

      act(() => {
        result.current.handleGameEvent(event);
      });

      // 所有 AI 實例都應該收到事件
      result.current.aiPlayers.forEach(ai => {
        expect(ai.onGameEvent).toHaveBeenCalledWith(event);
      });
    });
  });

  describe('resetAIPlayers', () => {
    test('應該重置所有 AI 玩家狀態', () => {
      const aiConfig = { aiCount: 2, difficulties: ['easy', 'hard'] };

      const { result } = renderHook(() =>
        useAIPlayers({
          aiConfig,
          gameState: mockGameState,
          onAIAction: jest.fn()
        })
      );

      act(() => {
        result.current.resetAIPlayers();
      });

      // 所有 AI 實例都應該被重置
      result.current.aiPlayers.forEach(ai => {
        expect(ai.reset).toHaveBeenCalled();
      });

      expect(result.current.aiThinking).toBe(false);
      expect(result.current.currentAIId).toBeNull();
    });
  });
});
