/**
 * 演化論 AI 策略測試
 *
 * 測試 BasicStrategy, StrategicStrategy, CarnivoreStrategy, DefenseStrategy
 * 和 EvolutionAIPlayer 的核心功能。
 */

import BasicStrategy, { EVOLUTION_ACTION, FEEDING_ACTION } from '../BasicStrategy';
import StrategicStrategy from '../StrategicStrategy';
import CarnivoreStrategy from '../CarnivoreStrategy';
import DefenseStrategy from '../DefenseStrategy';
import EvolutionAIPlayer, { createEvolutionAIPlayer, EVOLUTION_AI_STRATEGY } from '../EvolutionAIPlayer';

// ==================== 測試輔助資料 ====================

const mockCard = (id, traitType = 'camouflage') => ({ id, traitType });
const mockCreature = (id, traits = []) => ({
  id,
  traits,
  hasFed: false,
  population: 1,
  food: 0
});

const buildGameState = (playerId, hand = [], creatures = [], otherPlayers = {}, foodPool = 3) => ({
  phase: 'evolution',
  players: {
    [playerId]: {
      hand,
      creatures,
      hasPassedEvolution: false,
      hasPassedFeeding: false
    },
    ...otherPlayers
  },
  playerOrder: [playerId, ...Object.keys(otherPlayers)],
  currentPlayerId: playerId,
  foodPool
});

// ==================== BasicStrategy ====================

describe('BasicStrategy', () => {
  const strategy = new BasicStrategy();
  const SELF = 'player-1';

  test('應回傳 pass 當手牌為空', () => {
    const state = buildGameState(SELF, [], []);
    const action = strategy.decideEvolutionAction(state, SELF);
    expect(action.type).toBe(EVOLUTION_ACTION.PASS);
  });

  test('沒有生物時應建立生物', () => {
    const state = buildGameState(SELF, [mockCard('c1')], []);
    // 多次呼叫確保至少偶爾回傳 createCreature
    const types = new Set();
    for (let i = 0; i < 20; i++) {
      const a = strategy.decideEvolutionAction(state, SELF);
      types.add(a.type);
    }
    expect(types.has(EVOLUTION_ACTION.CREATE_CREATURE)).toBe(true);
  });

  test('有生物時可以建立新生物或新增性狀', () => {
    const creature = mockCreature('cr1');
    const state = buildGameState(SELF, [mockCard('c1'), mockCard('c2')], [creature]);
    const types = new Set();
    for (let i = 0; i < 50; i++) {
      const a = strategy.decideEvolutionAction(state, SELF);
      types.add(a.type);
    }
    // 應該出現至少兩種動作類型
    expect(types.size).toBeGreaterThan(1);
  });

  test('進食階段 - 食物池為空時應回傳 pass', () => {
    const creature = mockCreature('cr1');
    const state = { ...buildGameState(SELF, [], [creature]), phase: 'feeding', foodPool: 0 };
    const action = strategy.decideFeedingAction(state, SELF);
    expect(action.type).toBe(FEEDING_ACTION.PASS);
  });

  test('進食階段 - 有食物時應進食', () => {
    const creature = mockCreature('cr1');
    const state = { ...buildGameState(SELF, [], [creature], {}, 3), phase: 'feeding' };
    const types = new Set();
    for (let i = 0; i < 10; i++) {
      const a = strategy.decideFeedingAction(state, SELF);
      types.add(a.type);
    }
    expect(types.has(FEEDING_ACTION.FEED)).toBe(true);
  });

  test('進食階段 - 肉食生物嘗試攻擊', () => {
    const attacker = mockCreature('cr1', [{ traitType: 'carnivore' }]);
    const target = mockCreature('cr2');
    const opponent = { hand: [], creatures: [target] };
    const state = {
      ...buildGameState(SELF, [], [attacker], { 'opponent-1': opponent }, 3),
      phase: 'feeding'
    };

    let hasAttack = false;
    for (let i = 0; i < 20; i++) {
      const a = strategy.decideFeedingAction(state, SELF);
      if (a.type === FEEDING_ACTION.ATTACK) hasAttack = true;
    }
    expect(hasAttack).toBe(true);
  });
});

// ==================== StrategicStrategy ====================

describe('StrategicStrategy', () => {
  const strategy = new StrategicStrategy();
  const SELF = 'player-1';

  test('沒有生物時應建立生物', () => {
    const state = buildGameState(SELF, [mockCard('c1')], []);
    const action = strategy.decideEvolutionAction(state, SELF);
    expect(action.type).toBe(EVOLUTION_ACTION.CREATE_CREATURE);
  });

  test('有足夠生物時應傾向新增性狀', () => {
    const creatures = [mockCreature('cr1'), mockCreature('cr2')];
    const hand = [mockCard('c1'), mockCard('c2'), mockCard('c3')];
    const state = buildGameState(SELF, hand, creatures);
    const types = new Set();
    for (let i = 0; i < 50; i++) {
      const a = strategy.decideEvolutionAction(state, SELF);
      types.add(a.type);
    }
    expect(types.has(EVOLUTION_ACTION.ADD_TRAIT)).toBe(true);
  });
});

// ==================== CarnivoreStrategy ====================

describe('CarnivoreStrategy', () => {
  const strategy = new CarnivoreStrategy();
  const SELF = 'player-1';

  test('前幾張牌應建立生物', () => {
    const hand = [mockCard('c1'), mockCard('c2'), mockCard('c3')];
    const state = buildGameState(SELF, hand, []);
    const action = strategy.decideEvolutionAction(state, SELF);
    expect(action.type).toBe(EVOLUTION_ACTION.CREATE_CREATURE);
  });

  test('已有足夠生物時應傾向新增肉食性狀', () => {
    const creatures = [mockCreature('cr1'), mockCreature('cr2')];
    const hand = [mockCard('c1'), mockCard('c2'), mockCard('c3'), mockCard('c4')];
    const state = buildGameState(SELF, hand, creatures);
    const types = new Set();
    for (let i = 0; i < 50; i++) {
      const a = strategy.decideEvolutionAction(state, SELF);
      types.add(a.type);
    }
    expect(types.has(EVOLUTION_ACTION.ADD_TRAIT)).toBe(true);
  });
});

// ==================== DefenseStrategy ====================

describe('DefenseStrategy', () => {
  const strategy = new DefenseStrategy();
  const SELF = 'player-1';

  test('沒有生物時應建立生物', () => {
    const state = buildGameState(SELF, [mockCard('c1')], []);
    const action = strategy.decideEvolutionAction(state, SELF);
    expect(action.type).toBe(EVOLUTION_ACTION.CREATE_CREATURE);
  });

  test('有生物時應傾向新增防禦性狀', () => {
    const creature = mockCreature('cr1');
    const hand = [mockCard('c1'), mockCard('c2')];
    const state = buildGameState(SELF, hand, [creature]);
    const types = new Set();
    for (let i = 0; i < 50; i++) {
      const a = strategy.decideEvolutionAction(state, SELF);
      types.add(a.type);
    }
    expect(types.has(EVOLUTION_ACTION.ADD_TRAIT)).toBe(true);
  });
});

// ==================== EvolutionAIPlayer ====================

describe('EvolutionAIPlayer', () => {
  test('應使用預設中等難度建立 AI 玩家', () => {
    const ai = new EvolutionAIPlayer('ai-1', 'Test AI');
    expect(ai.id).toBe('ai-1');
    expect(ai.isAI).toBe(true);
    expect(ai.difficulty).toBe('medium');
    expect(ai.strategyType).toBe(EVOLUTION_AI_STRATEGY.STRATEGIC);
  });

  test('簡單難度應使用基礎策略', () => {
    const ai = new EvolutionAIPlayer('ai-1', 'Test', 'easy');
    expect(ai.strategyType).toBe(EVOLUTION_AI_STRATEGY.BASIC);
  });

  test('困難難度應使用肉食策略', () => {
    const ai = new EvolutionAIPlayer('ai-1', 'Test', 'hard');
    expect(ai.strategyType).toBe(EVOLUTION_AI_STRATEGY.CARNIVORE);
  });

  test('無效難度應回退至中等', () => {
    const ai = new EvolutionAIPlayer('ai-1', 'Test', 'invalid');
    expect(ai.difficulty).toBe('medium');
  });

  test('可以明確指定策略類型', () => {
    const ai = new EvolutionAIPlayer('ai-1', 'Test', 'easy', EVOLUTION_AI_STRATEGY.DEFENSE);
    expect(ai.strategyType).toBe(EVOLUTION_AI_STRATEGY.DEFENSE);
  });

  test('takeTurn 應回傳動作物件', async () => {
    const ai = new EvolutionAIPlayer('ai-1', 'Test', 'easy');
    const gameState = buildGameState('ai-1', [mockCard('c1')], []);

    // 跳過實際延遲
    jest.spyOn(ai, 'thinkDelay').mockResolvedValue(undefined);

    const action = await ai.takeTurn(gameState);
    expect(action).toHaveProperty('type');
    expect(['createCreature', 'addTrait', 'pass', 'feed', 'attack']).toContain(action.type);
  });

  test('reset 應清除狀態', () => {
    const ai = new EvolutionAIPlayer('ai-1', 'Test');
    ai.score = 10;
    ai.hand = [mockCard('c1')];
    ai.reset();
    expect(ai.score).toBe(0);
    expect(ai.hand).toEqual([]);
  });

  test('createEvolutionAIPlayer 工廠函數應建立 AI 玩家', () => {
    const ai = createEvolutionAIPlayer('ai-2', 'Bot', 'hard');
    expect(ai.id).toBe('ai-2');
    expect(ai.difficulty).toBe('hard');
  });
});
