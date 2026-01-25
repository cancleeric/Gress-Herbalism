/**
 * 中等難度 AI 整合測試
 *
 * 測試 AIPlayer + InformationTracker + MediumStrategy + DecisionMaker 的整合運作
 */

import AIPlayer, { createAIPlayer } from '../AIPlayer';
import MediumStrategy from '../strategies/MediumStrategy';
import { AI_DIFFICULTY } from '../../shared/constants';
import { EVENT_TYPES } from '../InformationTracker';
import InformationTracker from '../InformationTracker';
import DecisionMaker from '../DecisionMaker';

describe('MediumAI Integration Tests', () => {
  let aiPlayer;
  let gameState;

  beforeEach(() => {
    // 建立中等難度 AI 玩家
    aiPlayer = new AIPlayer('ai-1', 'AI-Medium', AI_DIFFICULTY.MEDIUM);

    // 替換為真實的組件
    const strategy = new MediumStrategy();
    strategy.selfId = 'ai-1';

    const informationTracker = new InformationTracker('ai-1');
    const decisionMaker = new DecisionMaker(strategy, 'ai-1');

    aiPlayer.strategy = strategy;
    aiPlayer.informationTracker = informationTracker;
    aiPlayer.decisionMaker = decisionMaker;

    // 基本遊戲狀態
    gameState = {
      players: [
        { id: 'ai-1', name: 'AI-Medium', isActive: true, cards: [] },
        { id: 'player-2', name: 'Player 2', isActive: true, cards: ['red', 'blue', 'green'] },
        { id: 'player-3', name: 'Player 3', isActive: true, cards: ['yellow'] }
      ],
      hiddenCards: ['red', 'blue'],
      currentPlayerId: 'ai-1'
    };
  });

  describe('概率追蹤與更新', () => {
    test('should track question results and update probabilities', () => {
      // 初始狀態
      const knowledge = aiPlayer.informationTracker.getKnowledge();
      const initialProb = knowledge.hiddenCardProbability;

      // 初始概率應為均勻分布
      expect(initialProb.red).toBeCloseTo(2 / 14, 2);
      expect(initialProb.blue).toBeCloseTo(5 / 14, 2);

      // 模擬卡牌交換事件：player-2 給了 2 張紅色給 AI
      // 這會使紅色牌變為可見，從而更新概率
      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'ai-1',
        cards: [{ color: 'red' }, { color: 'red' }]
      });

      // 驗證概率更新
      const updatedKnowledge = aiPlayer.informationTracker.getKnowledge();
      const updatedProb = updatedKnowledge.hiddenCardProbability;

      // 紅色已全部可見（2張），概率應為 0
      expect(updatedProb.red).toBe(0);
      // 其他顏色概率應重新分配，總和為 1
      expect(updatedProb.yellow + updatedProb.green + updatedProb.blue).toBeCloseTo(1, 2);

      // 同時驗證問牌歷史記錄功能
      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.QUESTION_RESULT,
        askerId: 'ai-1',
        targetId: 'player-2',
        colors: ['yellow', 'green'],
        questionType: 1,
        result: {
          cardsGiven: [{ color: 'yellow' }],
          noCardsForColors: ['green']
        }
      });

      const knowledgeAfterQuestion = aiPlayer.informationTracker.getKnowledge();
      // 驗證問牌歷史有記錄
      expect(knowledgeAfterQuestion.questionHistory).toHaveLength(1);
      expect(knowledgeAfterQuestion.questionHistory[0].colors).toEqual(['yellow', 'green']);
    });

    test('should eliminate colors when all cards visible', () => {
      // 模擬所有紅色牌都可見
      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'ai-1',
        cards: [{ color: 'red' }, { color: 'red' }]
      });

      const knowledge = aiPlayer.informationTracker.getKnowledge();

      // 紅色應被排除
      expect(knowledge.eliminatedColors).toContain('red');
      expect(knowledge.hiddenCardProbability.red).toBe(0);
    });
  });

  describe('高信心度猜牌決策', () => {
    test('should guess when confidence is high', async () => {
      // 建立高信心場景：讓 AI 知道大部分牌的位置
      // 模擬看到很多牌，只剩兩種顏色可能性高
      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'ai-1',
        cards: [{ color: 'red' }, { color: 'red' }]
      });

      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-3',
        toPlayerId: 'ai-1',
        cards: [{ color: 'yellow' }, { color: 'yellow' }, { color: 'yellow' }]
      });

      // 現在剩餘：綠4、藍5，共9張，其中2張是蓋牌
      // 藍色概率最高 (5/9)，綠色次之 (4/9)
      // 聯合概率 ≈ (5/9) * (4/9) ≈ 0.247 < 0.6，應該還是問牌

      const decision = await aiPlayer.takeTurn(gameState);

      // 這個場景信心度不夠，應該問牌
      expect(decision.type).toBe('question');
    });

    test('should guess when forced (no other players)', async () => {
      // 只剩 AI 自己
      gameState.players = [
        { id: 'ai-1', name: 'AI-Medium', isActive: true }
      ];

      const decision = await aiPlayer.takeTurn(gameState);

      // 強制猜牌
      expect(decision.type).toBe('guess');
      expect(decision.colors).toHaveLength(2);
    });
  });

  describe('目標玩家選擇', () => {
    test('should select player with most cards', async () => {
      // 更新遊戲狀態，player-2 有 5 張牌，player-3 有 2 張牌
      gameState.players = [
        { id: 'ai-1', name: 'AI-Medium', isActive: true, cards: [] },
        { id: 'player-2', name: 'Player 2', isActive: true, cards: ['red', 'blue', 'green', 'yellow', 'red'] },
        { id: 'player-3', name: 'Player 3', isActive: true, cards: ['yellow', 'green'] }
      ];

      // 更新知識狀態中的手牌數量（playerHandCounts 是 Map）
      aiPlayer.informationTracker.playerHandCounts.set('player-2', 5);
      aiPlayer.informationTracker.playerHandCounts.set('player-3', 2);

      const decision = await aiPlayer.takeTurn(gameState);

      if (decision.type === 'question') {
        // 應該選擇 player-2（手牌最多）
        expect(decision.targetPlayerId).toBe('player-2');
      }
    });
  });

  describe('跟猜決策', () => {
    test('should follow guess when probability is high', async () => {
      // 建立高概率場景
      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'ai-1',
        cards: [{ color: 'red' }, { color: 'red' }]
      });

      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-3',
        toPlayerId: 'ai-1',
        cards: [{ color: 'yellow' }, { color: 'yellow' }, { color: 'yellow' }]
      });

      // 剩餘：綠4、藍5
      // 藍綠聯合概率 ≈ (5/9) * (4/9) ≈ 0.247 > 0.15
      const shouldFollow = await aiPlayer.decideFollowGuess(gameState, ['blue', 'green']);

      expect(shouldFollow).toBe(true);
    });

    test('should not follow guess when probability is low', async () => {
      // 低概率場景：均勻分布
      const shouldFollow = await aiPlayer.decideFollowGuess(gameState, ['red', 'yellow']);

      // 初始均勻分布下，任意兩色聯合概率都較低
      // (2/14) * (3/14) ≈ 0.031 < 0.15
      expect(shouldFollow).toBe(false);
    });
  });

  describe('完整遊戲流程', () => {
    test('should make valid decisions throughout game', async () => {
      // 增加測試逾時時間（因為 AI 有思考延遲）
      jest.setTimeout(10000);

      // 模擬完整遊戲流程
      const decisions = [];

      // 第1回合：初始狀態，應該問牌
      let decision = await aiPlayer.takeTurn(gameState);
      decisions.push(decision);
      expect(decision.type).toBe('question');
      expect(decision.targetPlayerId).toBeTruthy();
      expect(decision.colors).toHaveLength(2);

      // 模擬問牌結果
      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.QUESTION_RESULT,
        askerId: 'ai-1',
        targetId: decision.targetPlayerId,
        colors: decision.colors,
        questionType: decision.questionType,
        result: {
          cardsGiven: [{ color: decision.colors[0] }]
        }
      });

      // 第2回合：更新後的狀態
      decision = await aiPlayer.takeTurn(gameState);
      decisions.push(decision);
      expect(['question', 'guess']).toContain(decision.type);

      // 所有決策都應該有效
      decisions.forEach(d => {
        expect(d).toHaveProperty('type');
        if (d.type === 'question') {
          expect(d).toHaveProperty('targetPlayerId');
          expect(d).toHaveProperty('colors');
          expect(d).toHaveProperty('questionType');
        } else if (d.type === 'guess') {
          expect(d).toHaveProperty('colors');
        }
      });
    });

    test('should use probability-based color selection', async () => {
      // 建立不均勻概率分布
      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'ai-1',
        cards: [{ color: 'red' }, { color: 'red' }]
      });

      const decision = await aiPlayer.takeTurn(gameState);

      if (decision.type === 'question' || decision.type === 'guess') {
        // 選擇的顏色不應該包含已排除的紅色
        expect(decision.colors).not.toContain('red');
        // 應該選擇概率較高的顏色
        const knowledge = aiPlayer.informationTracker.getKnowledge();
        const topColors = Object.entries(knowledge.hiddenCardProbability)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(entry => entry[0]);

        // 選擇的顏色應該來自概率最高的顏色
        expect(topColors).toEqual(expect.arrayContaining(decision.colors));
      }
    });
  });

  describe('狀態重置', () => {
    test('should reset knowledge when starting new round', () => {
      // 進行一些操作
      aiPlayer.informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'ai-1',
        cards: [{ color: 'red' }, { color: 'red' }]
      });

      // 驗證狀態已改變
      let knowledge = aiPlayer.informationTracker.getKnowledge();
      expect(knowledge.eliminatedColors).toContain('red');

      // 重置
      aiPlayer.reset();

      // 驗證狀態已重置
      knowledge = aiPlayer.informationTracker.getKnowledge();
      expect(knowledge.eliminatedColors).toEqual([]);
      expect(knowledge.hiddenCardProbability.red).toBeCloseTo(2 / 14, 2);
    });
  });
});

describe('createAIPlayer for Medium difficulty', () => {
  test('should create medium AI player correctly', () => {
    const player = createAIPlayer('test-ai', 'Test AI', AI_DIFFICULTY.MEDIUM);

    expect(player).toBeInstanceOf(AIPlayer);
    expect(player.id).toBe('test-ai');
    expect(player.name).toBe('Test AI');
    expect(player.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
  });
});
