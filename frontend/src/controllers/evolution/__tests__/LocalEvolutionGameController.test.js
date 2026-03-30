/**
 * LocalEvolutionGameController 單元測試
 */

import LocalEvolutionGameController from '../LocalEvolutionGameController';

// Mock evolutionConstants
jest.mock('../../../shared/evolutionConstants', () => ({
  GAME_PHASES: {
    WAITING: 'waiting',
    EVOLUTION: 'evolution',
    FOOD_SUPPLY: 'foodSupply',
    FEEDING: 'feeding',
    EXTINCTION: 'extinction',
    GAME_END: 'gameEnd'
  },
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
  TRAIT_DEFINITIONS: {
    carnivore: { name: '肉食', foodBonus: 1, cardCount: 4 },
    scavenger: { name: '腐食', foodBonus: 0, cardCount: 4 },
    sharpVision: { name: '銳目', foodBonus: 0, cardCount: 4 },
    camouflage: { name: '偽裝', foodBonus: 0, cardCount: 4 },
    burrowing: { name: '穴居', foodBonus: 0, cardCount: 4 },
    poisonous: { name: '毒液', foodBonus: 0, cardCount: 4 },
    aquatic: { name: '水生', foodBonus: 0, cardCount: 4 },
    agile: { name: '敏捷', foodBonus: 0, cardCount: 4 },
    massive: { name: '巨化', foodBonus: 1, cardCount: 4 },
    tailLoss: { name: '斷尾', foodBonus: 0, cardCount: 4 },
    mimicry: { name: '擬態', foodBonus: 0, cardCount: 4 },
    fatTissue: { name: '脂肪', foodBonus: 1, cardCount: 4 },
    hibernation: { name: '冬眠', foodBonus: 0, cardCount: 4 },
    parasite: { name: '寄生蟲', foodBonus: 2, cardCount: 4 },
    robbery: { name: '掠奪', foodBonus: 0, cardCount: 4 },
    communication: { name: '溝通', foodBonus: 0, cardCount: 4, isInteractive: true },
    cooperation: { name: '合作', foodBonus: 0, cardCount: 4, isInteractive: true },
    symbiosis: { name: '共生', foodBonus: 0, cardCount: 4, isInteractive: true },
    trampling: { name: '踐踏', foodBonus: 0, cardCount: 4 }
  },
  INTERACTIVE_TRAITS: ['communication', 'cooperation', 'symbiosis'],
  STACKABLE_TRAITS: ['fatTissue'],
  FOOD_FORMULA: {
    2: { dice: 1, bonus: 2 },
    3: { dice: 2, bonus: 0 },
    4: { dice: 2, bonus: 2 }
  },
  INITIAL_HAND_SIZE: 6,
  SCORE_PER_CREATURE: 2,
  SCORE_PER_TRAIT: 1
}));

describe('LocalEvolutionGameController', () => {
  let controller;
  let stateChanges;
  let events;

  const createPlayers = (count = 2) => {
    const players = [{ id: 'human-1', name: '玩家', isAI: false }];
    for (let i = 1; i < count; i++) {
      players.push({
        id: `ai-${i}`,
        name: `AI ${i}`,
        isAI: true,
        setHand: jest.fn()
      });
    }
    return players;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    stateChanges = [];
    events = [];

    const players = createPlayers(2);
    controller = new LocalEvolutionGameController({
      players,
      onStateChange: (state) => stateChanges.push({ ...state }),
      onEvent: (event) => events.push({ ...event })
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startGame', () => {
    test('初始化遊戲狀態', () => {
      controller.startGame();

      expect(stateChanges.length).toBeGreaterThan(0);
      const lastState = stateChanges[stateChanges.length - 1];
      expect(lastState.phase).toBe('evolution');
      expect(lastState.round).toBe(1);
      expect(Object.keys(lastState.players)).toHaveLength(2);
    });

    test('每位玩家有手牌', () => {
      controller.startGame();
      const lastState = stateChanges[stateChanges.length - 1];

      for (const player of Object.values(lastState.players)) {
        expect(player.hand.length).toBeGreaterThan(0);
      }
    });

    test('設定當前玩家', () => {
      controller.startGame();
      const lastState = stateChanges[stateChanges.length - 1];
      expect(lastState.currentPlayerId).toBeTruthy();
      expect(lastState.playerOrder).toContain(lastState.currentPlayerId);
    });
  });

  describe('handleEvolutionAction - 創造生物', () => {
    beforeEach(() => {
      controller.startGame();
    });

    test('創造生物後玩家有生物', async () => {
      const gameState = controller.getState();
      const currentPlayerId = gameState.currentPlayerId;
      const currentPlayer = gameState.players[currentPlayerId];
      const firstCard = currentPlayer.hand[0];

      await controller.handleAction({
        type: 'createCreature',
        playerId: currentPlayerId,
        cardId: firstCard.id
      });

      const newState = controller.getState();
      const updatedPlayer = newState.players[currentPlayerId];
      const hadCreaturesBefore = (gameState.players[currentPlayerId].creatures?.length || 0);

      // 玩家應該有更多生物（或換到下一位玩家）
      expect(
        newState.players[currentPlayerId].creatures.length > hadCreaturesBefore ||
        newState.currentPlayerId !== currentPlayerId
      ).toBe(true);
    });

    test('消耗一張手牌', async () => {
      const gameState = controller.getState();
      const currentPlayerId = gameState.currentPlayerId;
      const handBefore = gameState.players[currentPlayerId].hand.length;
      const firstCard = gameState.players[currentPlayerId].hand[0];

      await controller.handleAction({
        type: 'createCreature',
        playerId: currentPlayerId,
        cardId: firstCard.id
      });

      const newState = controller.getState();
      // 手牌減少了一張（可能已換玩家）
      const originalPlayerState = newState.players[currentPlayerId];
      expect(originalPlayerState.hand.length).toBe(handBefore - 1);
    });
  });

  describe('handleEvolutionAction - 跳過', () => {
    beforeEach(() => {
      controller.startGame();
    });

    test('跳過後切換到下一位玩家', async () => {
      const gameStateBefore = controller.getState();
      const currentPlayerIdBefore = gameStateBefore.currentPlayerId;

      await controller.handleAction({ type: 'pass', playerId: currentPlayerIdBefore });

      const gameStateAfter = controller.getState();
      // 要麼切換到下一位玩家，要麼進入食物供給階段
      expect(
        gameStateAfter.currentPlayerId !== currentPlayerIdBefore ||
        gameStateAfter.phase !== 'evolution'
      ).toBe(true);
    });
  });

  describe('遊戲控制器狀態', () => {
    test('getState 返回當前狀態', () => {
      controller.startGame();
      const state = controller.getState();
      expect(state).toBeDefined();
      expect(state.phase).toBeDefined();
    });

    test('getCurrentPlayer 返回當前玩家', () => {
      controller.startGame();
      const player = controller.getCurrentPlayer();
      expect(player).not.toBeNull();
      expect(player.id).toBeTruthy();
    });

    test('isAITurn 正確判斷 AI 回合', () => {
      controller.startGame();
      const state = controller.getState();
      const currentId = state.currentPlayerId;
      const isAI = controller.players.some(p => p.id === currentId && p.isAI);
      expect(controller.isAITurn()).toBe(isAI);
    });
  });

  describe('checkCanAttack', () => {
    test('肉食可以攻擊普通生物', () => {
      controller.startGame();
      const attacker = { traits: [{ traitType: 'carnivore' }] };
      const defender = { traits: [], isFed: false };
      expect(controller.checkCanAttack(attacker, defender)).toBe(true);
    });

    test('無肉食性狀不能攻擊', () => {
      controller.startGame();
      const attacker = { traits: [] };
      const defender = { traits: [], isFed: false };
      expect(controller.checkCanAttack(attacker, defender)).toBe(false);
    });

    test('穴居且吃飽的生物免疫攻擊', () => {
      controller.startGame();
      const attacker = { traits: [{ traitType: 'carnivore' }] };
      const defender = { traits: [{ traitType: 'burrowing' }], isFed: true };
      expect(controller.checkCanAttack(attacker, defender)).toBe(false);
    });
  });
});
