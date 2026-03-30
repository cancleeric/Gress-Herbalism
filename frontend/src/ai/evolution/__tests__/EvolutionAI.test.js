/**
 * EvolutionAIPlayer 單元測試
 */

import EvolutionAIPlayer, { createEvolutionAIPlayer } from '../EvolutionAIPlayer';
import BasicStrategy from '../strategies/BasicStrategy';
import CarnivoreStrategy from '../strategies/CarnivoreStrategy';
import DefenseStrategy from '../strategies/DefenseStrategy';
import StrategicStrategy from '../strategies/StrategicStrategy';

// Mock constants
jest.mock('../../../shared/constants', () => ({
  AI_DIFFICULTY: { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' },
  AI_THINK_DELAY: { easy: 1000, medium: 1500, hard: 2000 },
  PLAYER_TYPE: { HUMAN: 'human', AI: 'ai' },
  isValidAIDifficulty: (d) => ['easy', 'medium', 'hard'].includes(d)
}));

jest.mock('../../../shared/evolutionConstants', () => ({
  TRAIT_TYPES: {
    CARNIVORE: 'carnivore',
    SCAVENGER: 'scavenger',
    SHARP_VISION: 'sharpVision',
    CAMOUFLAGE: 'camouflage',
    BURROWING: 'burrowing',
    POISONOUS: 'poisonous',
    AQUATIC: 'aquatic',
    AGILE: 'agile',
    MASSIVE: 'massive',
    TAIL_LOSS: 'tailLoss',
    MIMICRY: 'mimicry',
    FAT_TISSUE: 'fatTissue',
    HIBERNATION: 'hibernation',
    PARASITE: 'parasite',
    ROBBERY: 'robbery',
    COMMUNICATION: 'communication',
    COOPERATION: 'cooperation',
    SYMBIOSIS: 'symbiosis',
    TRAMPLING: 'trampling'
  },
  INTERACTIVE_TRAITS: ['communication', 'cooperation', 'symbiosis'],
  TRAIT_DEFINITIONS: {
    carnivore: { name: '肉食', foodBonus: 1, cardCount: 4 },
    fatTissue: { name: '脂肪組織', foodBonus: 1, cardCount: 4 },
    burrowing: { name: '穴居', foodBonus: 0, cardCount: 4 },
    camouflage: { name: '偽裝', foodBonus: 0, cardCount: 4 },
    poisonous: { name: '毒液', foodBonus: 0, cardCount: 4 }
  }
}));

describe('EvolutionAIPlayer', () => {
  describe('constructor', () => {
    test('建立簡單難度 AI', () => {
      const ai = new EvolutionAIPlayer('ai-1', '測試 AI', 'easy');
      expect(ai.id).toBe('ai-1');
      expect(ai.name).toBe('測試 AI');
      expect(ai.difficulty).toBe('easy');
      expect(ai.isAI).toBe(true);
      expect(ai.strategy).toBeInstanceOf(BasicStrategy);
    });

    test('建立中等難度 AI（肉食型）', () => {
      const ai = new EvolutionAIPlayer('ai-1', '肉食 AI', 'medium', 'carnivore');
      expect(ai.strategy).toBeInstanceOf(CarnivoreStrategy);
    });

    test('建立中等難度 AI（防禦型）', () => {
      const ai = new EvolutionAIPlayer('ai-1', '防禦 AI', 'medium', 'defense');
      expect(ai.strategy).toBeInstanceOf(DefenseStrategy);
    });

    test('建立困難難度 AI（策略型）', () => {
      const ai = new EvolutionAIPlayer('ai-1', '策略 AI', 'hard', 'strategic');
      expect(ai.strategy).toBeInstanceOf(StrategicStrategy);
    });

    test('無效難度使用 medium', () => {
      const ai = new EvolutionAIPlayer('ai-1', 'AI', 'invalid');
      expect(ai.difficulty).toBe('medium');
    });
  });

  describe('createEvolutionAIPlayer', () => {
    test('工廠函數建立 AI', () => {
      const ai = createEvolutionAIPlayer('evo-ai-1', null, 'easy');
      expect(ai).toBeInstanceOf(EvolutionAIPlayer);
      expect(ai.id).toBe('evo-ai-1');
      expect(ai.difficulty).toBe('easy');
      expect(ai.name).toBeTruthy(); // 使用預設名稱
    });
  });

  describe('reset', () => {
    test('重置 AI 狀態', () => {
      const ai = createEvolutionAIPlayer('ai-1', 'AI', 'easy');
      ai.hand = [{ id: 'c1' }];
      ai.score = 5;
      ai.reset();
      expect(ai.hand).toHaveLength(0);
      expect(ai.score).toBe(0);
    });
  });

  describe('setHand', () => {
    test('設定手牌', () => {
      const ai = createEvolutionAIPlayer('ai-1', 'AI', 'easy');
      const hand = [{ id: 'c1', traitType: 'carnivore' }];
      ai.setHand(hand);
      expect(ai.hand).toHaveLength(1);
    });
  });

  describe('getPlayerInfo', () => {
    test('取得玩家資訊', () => {
      const ai = createEvolutionAIPlayer('ai-1', '測試', 'medium', 'carnivore');
      const info = ai.getPlayerInfo();
      expect(info.id).toBe('ai-1');
      expect(info.isAI).toBe(true);
      expect(info.difficulty).toBe('medium');
      expect(info.strategyName).toBe('肉食 AI');
    });
  });
});

describe('BasicStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new BasicStrategy();
  });

  describe('decideEvolutionAction', () => {
    test('無手牌時跳過', () => {
      const gameState = {
        players: {
          'ai-1': { id: 'ai-1', hand: [], creatures: [] }
        }
      };
      const action = strategy.decideEvolutionAction(gameState, 'ai-1');
      expect(action.type).toBe('pass');
    });

    test('無生物時創造生物', () => {
      const gameState = {
        players: {
          'ai-1': {
            id: 'ai-1',
            hand: [{ id: 'c1', traitType: 'carnivore' }],
            creatures: []
          }
        }
      };
      // 測試多次確保至少有一次創造生物（排除30%跳過機率）
      let created = false;
      for (let i = 0; i < 20; i++) {
        const action = strategy.decideEvolutionAction(gameState, 'ai-1');
        if (action.type === 'createCreature') {
          created = true;
          break;
        }
      }
      expect(created).toBe(true);
    });

    test('返回合法動作類型', () => {
      const gameState = {
        players: {
          'ai-1': {
            id: 'ai-1',
            hand: [
              { id: 'c1', traitType: 'carnivore' },
              { id: 'c2', traitType: 'burrowing' }
            ],
            creatures: [
              { id: 'cr1', ownerId: 'ai-1', traits: [], food: {}, foodNeeded: 1, isFed: false }
            ]
          }
        }
      };
      const action = strategy.decideEvolutionAction(gameState, 'ai-1');
      expect(['createCreature', 'addTrait', 'pass']).toContain(action.type);
    });
  });

  describe('decideFeedingAction', () => {
    test('無生物時跳過', () => {
      const gameState = {
        players: { 'ai-1': { id: 'ai-1', creatures: [] } },
        foodPool: 5
      };
      const action = strategy.decideFeedingAction(gameState, 'ai-1');
      expect(action.type).toBe('pass');
    });

    test('吃飽的生物不再進食', () => {
      const gameState = {
        players: {
          'ai-1': {
            id: 'ai-1',
            creatures: [
              { id: 'cr1', traits: [], isFed: true, food: { red: 1 }, foodNeeded: 1, hibernating: false }
            ]
          }
        },
        foodPool: 5
      };
      const action = strategy.decideFeedingAction(gameState, 'ai-1');
      expect(action.type).toBe('pass');
    });

    test('有食物池和未吃飽草食生物時進食', () => {
      const gameState = {
        players: {
          'ai-1': {
            id: 'ai-1',
            creatures: [
              { id: 'cr1', traits: [], isFed: false, food: { red: 0 }, foodNeeded: 1, hibernating: false }
            ]
          }
        },
        foodPool: 3
      };
      const action = strategy.decideFeedingAction(gameState, 'ai-1');
      expect(action.type).toBe('feed');
      expect(action.creatureId).toBe('cr1');
    });
  });

  describe('canAttack', () => {
    test('肉食可以攻擊普通生物', () => {
      const attacker = {
        traits: [{ traitType: 'carnivore' }],
        food: {}
      };
      const defender = {
        traits: [],
        isFed: false,
        food: {}
      };
      expect(strategy.canAttack(attacker, defender)).toBe(true);
    });

    test('無銳目不能攻擊偽裝生物', () => {
      const attacker = { traits: [{ traitType: 'carnivore' }] };
      const defender = { traits: [{ traitType: 'camouflage' }], isFed: false };
      expect(strategy.canAttack(attacker, defender)).toBe(false);
    });

    test('有銳目可以攻擊偽裝生物', () => {
      const attacker = {
        traits: [
          { traitType: 'carnivore' },
          { traitType: 'sharpVision' }
        ]
      };
      const defender = { traits: [{ traitType: 'camouflage' }], isFed: false };
      expect(strategy.canAttack(attacker, defender)).toBe(true);
    });

    test('非水生不能攻擊水生生物', () => {
      const attacker = { traits: [{ traitType: 'carnivore' }] };
      const defender = { traits: [{ traitType: 'aquatic' }], isFed: false };
      expect(strategy.canAttack(attacker, defender)).toBe(false);
    });

    test('穴居且吃飽的生物免疫攻擊', () => {
      const attacker = { traits: [{ traitType: 'carnivore' }] };
      const defender = { traits: [{ traitType: 'burrowing' }], isFed: true };
      expect(strategy.canAttack(attacker, defender)).toBe(false);
    });
  });
});

describe('CarnivoreStrategy', () => {
  test('策略名稱正確', () => {
    const strategy = new CarnivoreStrategy();
    expect(strategy.name).toBe('肉食 AI');
    expect(strategy.difficulty).toBe('medium');
  });

  test('優先賦予肉食性狀', () => {
    const strategy = new CarnivoreStrategy();
    const gameState = {
      players: {
        'ai-1': {
          id: 'ai-1',
          hand: [
            { id: 'c1', traitType: 'carnivore' },
            { id: 'c2', traitType: 'burrowing' }
          ],
          creatures: [
            { id: 'cr1', ownerId: 'ai-1', traits: [], food: {}, foodNeeded: 1 }
          ]
        }
      }
    };

    let hasCarnivoreAction = false;
    for (let i = 0; i < 10; i++) {
      const action = strategy.decideEvolutionAction(gameState, 'ai-1');
      if (action.type === 'addTrait' && action.traitType === 'carnivore') {
        hasCarnivoreAction = true;
        break;
      }
    }
    expect(hasCarnivoreAction).toBe(true);
  });
});

describe('DefenseStrategy', () => {
  test('策略名稱正確', () => {
    const strategy = new DefenseStrategy();
    expect(strategy.name).toBe('防禦 AI');
    expect(strategy.difficulty).toBe('medium');
  });

  test('積極使用斷尾防禦', () => {
    const strategy = new DefenseStrategy();
    const tailLossTrait = { id: 'tr1', traitType: 'tailLoss' };
    const gameState = {
      players: {
        'ai-1': {
          creatures: [
            { id: 'cr1', traits: [tailLossTrait], usedMimicryThisTurn: false }
          ]
        }
      }
    };
    const pendingAttack = { defenderCreatureId: 'cr1' };
    const response = strategy.decideDefenseResponse(gameState, pendingAttack, 'ai-1');
    expect(response.response).toBe('tailLoss');
  });
});

describe('StrategicStrategy', () => {
  test('策略名稱正確', () => {
    const strategy = new StrategicStrategy();
    expect(strategy.name).toBe('策略 AI');
    expect(strategy.difficulty).toBe('hard');
  });
});
