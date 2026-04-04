/**
 * 深海生態擴充包單元測試
 * @module expansions/deep-sea/__tests__/deepSea.test.js
 */

const { deepSeaExpansion, DEEP_SEA_TRAIT_TYPES } = require('../index');
const {
  DeepDiveHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GiantMawHandler,
  ElectroreceptionHandler,
  InkCloudHandler,
} = require('../traits/handlers');
const { validateCardDefinitions, getTotalCardCount } = require('../cards');

// ===== 輔助函數 =====

const makeCreature = (overrides = {}) => ({
  id: 'c1',
  ownerId: 'p1',
  traits: [],
  food: { red: 0, blue: 0 },
  foodNeeded: 2,
  ...overrides,
});

const makeGameState = (overrides = {}) => ({
  foodPool: 5,
  players: [],
  ...overrides,
});

// ===== 擴充包基本驗證 =====

describe('deepSeaExpansion', () => {
  test('should have correct id and name', () => {
    expect(deepSeaExpansion.id).toBe('deep-sea');
    expect(deepSeaExpansion.name).toBe('深海生態');
  });

  test('should require base expansion', () => {
    expect(deepSeaExpansion.requires).toContain('base');
  });

  test('should have 6 trait handlers', () => {
    expect(Object.keys(deepSeaExpansion.traits)).toHaveLength(6);
  });

  test('should pass validation', () => {
    const result = deepSeaExpansion.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('createDeck should return 24 cards', () => {
    const deck = deepSeaExpansion.createDeck();
    expect(deck).toHaveLength(24);
  });

  test('createShuffledDeck should return 24 cards', () => {
    const deck = deepSeaExpansion.createShuffledDeck();
    expect(deck).toHaveLength(24);
  });
});

// ===== 卡牌定義測試 =====

describe('DEEP_SEA_CARDS', () => {
  test('total card count should be 24', () => {
    expect(getTotalCardCount()).toBe(24);
  });

  test('card validation should pass', () => {
    const result = validateCardDefinitions();
    expect(result.valid).toBe(true);
  });
});

// ===== DeepDiveHandler =====

describe('DeepDiveHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new DeepDiveHandler();
  });

  test('should have correct type', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
  });

  test('should block attack without electroreception', () => {
    const context = {
      attacker: makeCreature({ traits: [] }),
    };
    const result = handler.checkDefense(context);
    expect(result.canAttack).toBe(false);
  });

  test('should allow attack with electroreception', () => {
    const context = {
      attacker: makeCreature({
        traits: [{ type: DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION }],
      }),
    };
    const result = handler.checkDefense(context);
    expect(result.canAttack).toBe(true);
  });
});

// ===== BioluminescenceHandler =====

describe('BioluminescenceHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new BioluminescenceHandler();
  });

  test('should have correct type', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE);
  });

  test('should allow ability when food pool has food', () => {
    const context = {
      creature: makeCreature(),
      gameState: makeGameState({ foodPool: 3 }),
    };
    const result = handler.canUseAbility(context);
    expect(result.canUse).toBe(true);
  });

  test('should deny ability when food pool is empty', () => {
    const context = {
      creature: makeCreature(),
      gameState: makeGameState({ foodPool: 0 }),
    };
    const result = handler.canUseAbility(context);
    expect(result.canUse).toBe(false);
  });

  test('should deny ability when already used this turn', () => {
    const context = {
      creature: makeCreature({ bioluminescenceUsed: true }),
      gameState: makeGameState({ foodPool: 3 }),
    };
    const result = handler.canUseAbility(context);
    expect(result.canUse).toBe(false);
  });

  test('useAbility should add food and reduce pool', () => {
    const creature = makeCreature();
    const context = {
      creature,
      gameState: makeGameState({ foodPool: 3 }),
    };
    const result = handler.useAbility(context);
    expect(result.success).toBe(true);
    expect(creature.food.red).toBe(1);
    expect(result.gameState.foodPool).toBe(2);
    expect(creature.bioluminescenceUsed).toBe(true);
  });

  test('onTurnStart should reset bioluminescenceUsed', () => {
    const creature = makeCreature({ bioluminescenceUsed: true });
    const gameState = makeGameState();
    handler.onTurnStart({ creature, gameState });
    expect(creature.bioluminescenceUsed).toBe(false);
  });
});

// ===== SchoolingHandler =====

describe('SchoolingHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new SchoolingHandler();
  });

  test('should have correct type', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.SCHOOLING);
  });

  test('should not respond when player has fewer than 2 schooling creatures', () => {
    const defender = makeCreature({ id: 'c1', ownerId: 'p1' });
    const gameState = makeGameState({
      players: [{
        id: 'p1',
        creatures: [
          makeCreature({ id: 'c1', traits: [{ type: DEEP_SEA_TRAIT_TYPES.SCHOOLING }] }),
        ],
      }],
    });
    const result = handler.getDefenseResponse({ defender, gameState });
    expect(result.canRespond).toBe(false);
  });

  test('should respond when player has 2+ schooling creatures', () => {
    const defender = makeCreature({ id: 'c1', ownerId: 'p1' });
    const gameState = makeGameState({
      players: [{
        id: 'p1',
        creatures: [
          makeCreature({ id: 'c1', traits: [{ type: DEEP_SEA_TRAIT_TYPES.SCHOOLING }] }),
          makeCreature({ id: 'c2', traits: [{ type: DEEP_SEA_TRAIT_TYPES.SCHOOLING }] }),
        ],
      }],
    });
    const result = handler.getDefenseResponse({ defender, gameState });
    expect(result.canRespond).toBe(true);
    expect(result.responseType).toBe('dice_escape');
  });

  test('handleDefenseResponse should cancel attack on roll >= 4', () => {
    const context = { gameState: makeGameState() };
    const result = handler.handleDefenseResponse(context, { roll: 5 });
    expect(result.attackCancelled).toBe(true);
    expect(result.roll).toBe(5);
  });

  test('handleDefenseResponse should not cancel attack on roll < 4', () => {
    const context = { gameState: makeGameState() };
    const result = handler.handleDefenseResponse(context, { roll: 2 });
    expect(result.attackCancelled).toBe(false);
    expect(result.roll).toBe(2);
  });
});

// ===== GiantMawHandler =====

describe('GiantMawHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new GiantMawHandler();
  });

  test('should have correct type', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.GIANT_MAW);
  });

  test('canPlace should fail if creature has no carnivore', () => {
    const context = {
      creature: makeCreature({ traits: [] }),
      player: { id: 'p1' },
    };
    const result = handler.canPlace(context);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('肉食');
  });

  test('canPlace should succeed if creature has carnivore', () => {
    const context = {
      creature: makeCreature({ traits: [{ type: 'carnivore' }] }),
      player: { id: 'p1' },
    };
    const result = handler.canPlace(context);
    expect(result.valid).toBe(true);
  });
});

// ===== ElectroreceptionHandler =====

describe('ElectroreceptionHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ElectroreceptionHandler();
  });

  test('should have correct type', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION);
  });

  test('should be instantiated correctly', () => {
    expect(handler.name).toBe('電感');
    expect(handler.expansion).toBe('deep-sea');
  });
});

// ===== InkCloudHandler =====

describe('InkCloudHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new InkCloudHandler();
  });

  test('should have correct type', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.INK_CLOUD);
  });

  test('should provide defense response when not yet used', () => {
    const defender = makeCreature({ inkCloudUsed: false });
    const result = handler.getDefenseResponse({ defender });
    expect(result.canRespond).toBe(true);
    expect(result.responseType).toBe('cancel_attack');
  });

  test('should not provide defense response when already used', () => {
    const defender = makeCreature({ inkCloudUsed: true });
    const result = handler.getDefenseResponse({ defender });
    expect(result.canRespond).toBe(false);
  });

  test('handleDefenseResponse should cancel attack when useInkCloud is true', () => {
    const defender = makeCreature({ inkCloudUsed: false });
    const context = { defender, gameState: makeGameState() };
    const result = handler.handleDefenseResponse(context, { useInkCloud: true });
    expect(result.attackCancelled).toBe(true);
    expect(defender.inkCloudUsed).toBe(true);
  });

  test('handleDefenseResponse should not cancel attack when useInkCloud is false', () => {
    const defender = makeCreature({ inkCloudUsed: false });
    const context = { defender, gameState: makeGameState() };
    const result = handler.handleDefenseResponse(context, { useInkCloud: false });
    expect(result.attackCancelled).toBe(false);
  });

  test('handleDefenseResponse should fail if already used', () => {
    const defender = makeCreature({ inkCloudUsed: true });
    const context = { defender, gameState: makeGameState() };
    const result = handler.handleDefenseResponse(context, { useInkCloud: true });
    expect(result.success).toBe(false);
    expect(result.attackCancelled).toBe(false);
  });

  test('onTurnStart should reset inkCloudUsed', () => {
    const creature = makeCreature({ inkCloudUsed: true });
    const gameState = makeGameState();
    handler.onTurnStart({ creature, gameState });
    expect(creature.inkCloudUsed).toBe(false);
  });
});
