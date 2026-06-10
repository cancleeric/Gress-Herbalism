/**
 * LocalGameController 測試
 */

import LocalGameController from '../LocalGameController';
import { createAIPlayer } from '../../../ai';
import { GAME_PHASE_PLAYING, GAME_PHASE_FOLLOW_GUESSING, GAME_PHASE_ROUND_END } from '../../../shared/constants';

describe('LocalGameController', () => {
  let controller;
  let players;
  let onStateChangeMock;
  let onEventMock;

  beforeEach(() => {
    // 創建模擬玩家（1 個人類 + 2 個 AI）
    players = [
      {
        id: 'human-1',
        name: '玩家1',
        isAI: false
      },
      createAIPlayer('ai-1', 'AI-1', 'easy'),
      createAIPlayer('ai-2', 'AI-2', 'medium')
    ];

    onStateChangeMock = jest.fn();
    onEventMock = jest.fn();

    controller = new LocalGameController({
      players,
      onStateChange: onStateChangeMock,
      onEvent: onEventMock
    });
  });

  describe('初始化', () => {
    test('應該正確初始化遊戲狀態', () => {
      const state = controller.getState();

      expect(state.gameId).toMatch(/^local-/);
      expect(state.players).toEqual([]);
      expect(state.gamePhase).toBe('waiting');
      expect(state.round).toBe(0);
    });
  });

  describe('牌組管理', () => {
    test('應該創建正確數量的牌', () => {
      const deck = controller.createDeck();

      expect(deck).toHaveLength(14); // 2+3+4+5
      expect(deck.filter(c => c.color === 'red')).toHaveLength(2);
      expect(deck.filter(c => c.color === 'yellow')).toHaveLength(3);
      expect(deck.filter(c => c.color === 'green')).toHaveLength(4);
      expect(deck.filter(c => c.color === 'blue')).toHaveLength(5);
    });

    test('洗牌應該改變順序', () => {
      const deck = controller.createDeck();
      const shuffled = controller.shuffleDeck(deck);

      expect(shuffled).toHaveLength(deck.length);
      // 概率上不太可能完全相同
      const isDifferent = shuffled.some((card, index) => card.id !== deck[index].id);
      expect(isDifferent).toBe(true);
    });
  });

  describe('開始遊戲', () => {
    test('應該初始化玩家和發牌', () => {
      controller.startGame();

      const state = controller.getState();

      expect(state.players).toHaveLength(3);
      expect(state.hiddenCards).toHaveLength(2);
      expect(state.gamePhase).toBe(GAME_PHASE_PLAYING);
      expect(state.round).toBe(1);

      // 檢查每個玩家都有手牌
      state.players.forEach(player => {
        expect(player.hand.length).toBeGreaterThan(0);
        expect(player.isActive).toBe(true);
        expect(player.score).toBe(0);
      });

      // 檢查事件廣播
      expect(onEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'roundStarted',
          round: 1
        })
      );

      // 檢查狀態變更通知
      expect(onStateChangeMock).toHaveBeenCalled();
    });
  });

  describe('問牌處理', () => {
    beforeEach(() => {
      controller.startGame();
      jest.clearAllMocks();
    });

    test('應該處理類型1問牌（兩個顏色各一張）', async () => {
      const state = controller.getState();
      const askingPlayer = state.players[0];
      const targetPlayer = state.players[1];

      // 設定目標玩家手牌（確保有特定顏色）
      targetPlayer.hand = [
        { id: 1, color: 'red' },
        { id: 2, color: 'blue' },
        { id: 3, color: 'green' }
      ];

      const initialHandCount = askingPlayer.hand.length;

      await controller.handleAction({
        type: 'question',
        playerId: askingPlayer.id,
        targetPlayerId: targetPlayer.id,
        colors: ['red', 'blue'],
        questionType: 1
      });

      // 檢查卡牌轉移
      const updatedState = controller.getState();
      const updatedAsking = updatedState.players[0];
      const updatedTarget = updatedState.players[1];

      expect(updatedAsking.hand.length).toBe(initialHandCount + 2);
      expect(updatedTarget.hand).toHaveLength(1);
      expect(updatedTarget.hand[0].color).toBe('green');

      // 檢查事件廣播
      expect(onEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CARD_TRANSFER',
          from: targetPlayer.id,
          to: askingPlayer.id
        })
      );
    });

    test('應該處理類型2問牌（其中一種顏色全部）', async () => {
      const state = controller.getState();
      const askingPlayer = state.players[0];
      const targetPlayer = state.players[1];

      // 設定目標玩家手牌
      targetPlayer.hand = [
        { id: 1, color: 'red' },
        { id: 2, color: 'red' },
        { id: 3, color: 'blue' }
      ];

      await controller.handleAction({
        type: 'question',
        playerId: askingPlayer.id,
        targetPlayerId: targetPlayer.id,
        colors: ['red', 'blue'],
        questionType: 2
      });

      // 檢查至少有卡牌轉移
      expect(onEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CARD_TRANSFER'
        })
      );
    });
  });

  describe('猜牌處理', () => {
    beforeEach(() => {
      controller.startGame();
      jest.clearAllMocks();
    });

    test('應該處理猜牌正確的情況', async () => {
      const state = controller.getState();
      const guessingPlayer = state.players[0];

      // 取得實際蓋牌顏色
      const hiddenColors = state.hiddenCards.map(c => c.color).sort();

      await controller.handleAction({
        type: 'guess',
        playerId: guessingPlayer.id,
        guessedColors: hiddenColors
      });

      // 應該進入跟猜階段
      expect(controller.gameState.gamePhase).toBe(GAME_PHASE_FOLLOW_GUESSING);

      // 模擬其他玩家決定
      await controller.handleFollowGuessResponse({
        playerId: 'ai-1',
        isFollowing: true
      });

      await controller.handleFollowGuessResponse({
        playerId: 'ai-2',
        isFollowing: false
      });

      // 檢查分數變化
      const finalState = controller.getState();
      const finalGuesser = finalState.players.find(p => p.id === guessingPlayer.id);
      const finalFollower = finalState.players.find(p => p.id === 'ai-1');

      expect(finalGuesser.score).toBe(3); // 猜對 +3
      expect(finalFollower.score).toBe(1); // 跟對 +1

      // 應該進入局結束階段
      expect(controller.gameState.gamePhase).toBe(GAME_PHASE_ROUND_END);
    });

    test('應該處理猜牌錯誤的情況', async () => {
      const state = controller.getState();
      const guessingPlayer = state.players[0];

      // 故意猜錯
      const wrongColors = ['red', 'red'];

      await controller.handleAction({
        type: 'guess',
        playerId: guessingPlayer.id,
        guessedColors: wrongColors
      });

      // 模擬其他玩家決定
      await controller.handleFollowGuessResponse({
        playerId: 'ai-1',
        isFollowing: true
      });

      await controller.handleFollowGuessResponse({
        playerId: 'ai-2',
        isFollowing: false
      });

      // 檢查猜牌者和跟猜者都退出
      const finalState = controller.getState();
      const finalGuesser = finalState.players.find(p => p.id === guessingPlayer.id);
      const finalFollower = finalState.players.find(p => p.id === 'ai-1');

      expect(finalGuesser.isActive).toBe(false);
      expect(finalFollower.isActive).toBe(false);
      expect(finalGuesser.score).toBe(0); // -1 但最低 0
      expect(finalFollower.score).toBe(0);
    });
  });

  describe('回合管理', () => {
    beforeEach(() => {
      controller.startGame();
      jest.clearAllMocks();
    });

    test('應該正確切換到下一個玩家', () => {
      const initialIndex = controller.gameState.currentPlayerIndex;

      controller.nextTurn();

      const newIndex = controller.gameState.currentPlayerIndex;
      expect(newIndex).toBe((initialIndex + 1) % 3);
      expect(controller.gameState.gamePhase).toBe(GAME_PHASE_PLAYING);
    });

    test('應該跳過已退出的玩家', () => {
      // 將下一個玩家設為退出
      const nextIndex = (controller.gameState.currentPlayerIndex + 1) % 3;
      controller.gameState.players[nextIndex].isActive = false;

      controller.nextTurn();

      // 應該跳過已退出的玩家
      expect(controller.gameState.currentPlayerIndex).not.toBe(nextIndex);
    });
  });

  describe('開始下一局', () => {
    test('應該重置玩家狀態並重新發牌', () => {
      controller.startGame();

      // 修改一些狀態
      controller.gameState.players[0].isActive = false;
      controller.gameState.players[0].score = 5;

      controller.startNextRound();

      const state = controller.getState();

      expect(state.round).toBe(2);
      expect(state.gamePhase).toBe(GAME_PHASE_PLAYING);

      // 檢查玩家狀態重置
      state.players.forEach(player => {
        expect(player.isActive).toBe(true);
        expect(player.hand.length).toBeGreaterThan(0);
      });

      // 分數應該保留
      expect(state.players[0].score).toBe(5);
    });
  });

  describe('遊戲結束', () => {
    test('當有玩家達到 7 分時應該結束遊戲', async () => {
      controller.startGame();

      const state = controller.getState();
      const guessingPlayer = state.players[0];

      // 設定分數接近獲勝
      guessingPlayer.score = 5;

      // 取得實際蓋牌顏色並猜對
      const hiddenColors = state.hiddenCards.map(c => c.color).sort();

      await controller.handleAction({
        type: 'guess',
        playerId: guessingPlayer.id,
        guessedColors: hiddenColors
      });

      // 模擬跟猜決定
      await controller.handleFollowGuessResponse({
        playerId: 'ai-1',
        isFollowing: false
      });

      await controller.handleFollowGuessResponse({
        playerId: 'ai-2',
        isFollowing: false
      });

      // 檢查遊戲結束
      const finalState = controller.getState();
      expect(finalState.gamePhase).toBe('finished');
      expect(finalState.winner).toBe(guessingPlayer.id);
    });
  });
});
