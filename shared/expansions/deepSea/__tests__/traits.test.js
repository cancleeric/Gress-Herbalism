/**
 * 深海生態擴充包 - 性狀單元測試
 */

const {
  deepSeaExpansion,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getDeepSeaCardCount,
  validateDeepSeaCardDefinitions,
  DEEP_SEA_RULES,
} = require('../index');

const {
  DeepDiveHandler,
  SchoolingHandler,
  InkSquirtHandler,
  BioluminescenceHandler,
  ElectroreceptionHandler,
  GulperHandler,
  createAllDeepSeaHandlerInstances,
} = require('../traits/handlers');

// ========== 性狀定義測試 ==========

describe('DEEP_SEA_TRAIT_TYPES', () => {
  test('should have 6 trait types', () => {
    expect(Object.keys(DEEP_SEA_TRAIT_TYPES).length).toBe(6);
  });

  test('should have correct trait type values', () => {
    expect(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE).toBe('deepDive');
    expect(DEEP_SEA_TRAIT_TYPES.SCHOOLING).toBe('schooling');
    expect(DEEP_SEA_TRAIT_TYPES.INK_SQUIRT).toBe('inkSquirt');
    expect(DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE).toBe('bioluminescence');
    expect(DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION).toBe('electroreception');
    expect(DEEP_SEA_TRAIT_TYPES.GULPER).toBe('gulper');
  });
});

describe('DEEP_SEA_TRAIT_DEFINITIONS', () => {
  test('should have 6 definitions', () => {
    expect(Object.keys(DEEP_SEA_TRAIT_DEFINITIONS).length).toBe(6);
  });

  test('each definition should have required fields', () => {
    for (const def of Object.values(DEEP_SEA_TRAIT_DEFINITIONS)) {
      expect(def.type).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.nameEn).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.expansion).toBe('deepSea');
      expect(typeof def.foodBonus).toBe('number');
      expect(typeof def.isInteractive).toBe('boolean');
      expect(typeof def.isStackable).toBe('boolean');
    }
  });

  test('should identify bioluminescence as interactive', () => {
    const def = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE];
    expect(def.isInteractive).toBe(true);
  });

  test('gulper should have food bonus of 1', () => {
    const def = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.GULPER];
    expect(def.foodBonus).toBe(1);
  });

  test('getAllDeepSeaTraitTypes should return 6 types', () => {
    expect(getAllDeepSeaTraitTypes().length).toBe(6);
  });

  test('getDeepSeaTraitDefinition should return correct definition', () => {
    const def = getDeepSeaTraitDefinition('deepDive');
    expect(def).not.toBeNull();
    expect(def.name).toBe('深潛');
  });

  test('getDeepSeaTraitDefinition should return null for unknown type', () => {
    expect(getDeepSeaTraitDefinition('unknown')).toBeNull();
  });
});

// ========== 卡牌定義測試 ==========

describe('DEEP_SEA_CARDS', () => {
  test('should have correct total card count', () => {
    expect(getDeepSeaCardCount()).toBe(DEEP_SEA_EXPECTED_TOTAL);
    expect(getDeepSeaCardCount()).toBe(28);
  });

  test('each card should have required fields', () => {
    for (const card of DEEP_SEA_CARDS) {
      expect(card.id).toBeTruthy();
      expect(card.frontTrait).toBeTruthy();
      expect(card.backTrait).toBeTruthy();
      expect(card.count).toBeGreaterThan(0);
    }
  });

  test('validateDeepSeaCardDefinitions should pass', () => {
    const result = validateDeepSeaCardDefinitions();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ========== 處理器實例化測試 ==========

describe('createAllDeepSeaHandlerInstances', () => {
  test('should create 6 handler instances', () => {
    const instances = createAllDeepSeaHandlerInstances();
    expect(Object.keys(instances).length).toBe(6);
  });

  test('all instances should be TraitHandler subclasses', () => {
    const instances = createAllDeepSeaHandlerInstances();
    for (const instance of Object.values(instances)) {
      expect(typeof instance.checkDefense).toBe('function');
      expect(typeof instance.getInfo).toBe('function');
    }
  });
});

// ========== DeepDiveHandler 測試 ==========

describe('DeepDiveHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new DeepDiveHandler();
  });

  test('should block attack when attacker has no aquatic or carnivore', () => {
    const context = {
      attacker: { traits: [] },
      defender: { traits: [{ type: 'deepDive' }] },
    };
    const result = handler.checkDefense(context);
    expect(result.canAttack).toBe(false);
  });

  test('should block attack when attacker has only aquatic', () => {
    const context = {
      attacker: { traits: [{ type: 'aquatic' }] },
      defender: { traits: [{ type: 'deepDive' }] },
    };
    const result = handler.checkDefense(context);
    expect(result.canAttack).toBe(false);
  });

  test('should block attack when attacker has only carnivore', () => {
    const context = {
      attacker: { traits: [{ type: 'carnivore' }] },
      defender: { traits: [{ type: 'deepDive' }] },
    };
    const result = handler.checkDefense(context);
    expect(result.canAttack).toBe(false);
  });

  test('should allow attack when attacker has both aquatic and carnivore', () => {
    const context = {
      attacker: {
        traits: [{ type: 'aquatic' }, { type: 'carnivore' }],
      },
      defender: { traits: [{ type: 'deepDive' }] },
    };
    const result = handler.checkDefense(context);
    expect(result.canAttack).toBe(true);
  });

  test('getInfo should return trait metadata', () => {
    const info = handler.getInfo();
    expect(info.type).toBe('deepDive');
    expect(info.name).toBe('深潛');
  });
});

// ========== SchoolingHandler 測試 ==========

describe('SchoolingHandler', () => {
  let handler;

  const makeGameState = (playerCreatureCount) => ({
    players: [
      {
        id: 'p1',
        creatures: Array.from({ length: playerCreatureCount }, (_, i) => ({
          id: `c${i + 1}`,
          traits: [{ type: 'schooling' }],
        })),
      },
    ],
    foodPool: { red: 5, blue: 5, yellow: 0 },
  });

  beforeEach(() => {
    handler = new SchoolingHandler();
  });

  test('should block attack when player has 3 or more creatures', () => {
    const gameState = makeGameState(3);
    const defender = gameState.players[0].creatures[0];
    const result = handler.checkDefense({ defender, gameState });
    expect(result.canAttack).toBe(false);
  });

  test('should block attack when player has 4 creatures', () => {
    const gameState = makeGameState(4);
    const defender = gameState.players[0].creatures[0];
    const result = handler.checkDefense({ defender, gameState });
    expect(result.canAttack).toBe(false);
  });

  test('should allow attack when player has fewer than 3 creatures', () => {
    const gameState = makeGameState(2);
    const defender = gameState.players[0].creatures[0];
    const result = handler.checkDefense({ defender, gameState });
    expect(result.canAttack).toBe(true);
  });

  test('should allow attack when player has only 1 creature', () => {
    const gameState = makeGameState(1);
    const defender = gameState.players[0].creatures[0];
    const result = handler.checkDefense({ defender, gameState });
    expect(result.canAttack).toBe(true);
  });

  test('should allow attack when defender owner not found', () => {
    const gameState = { players: [] };
    const defender = { id: 'c999', traits: [{ type: 'schooling' }] };
    const result = handler.checkDefense({ defender, gameState });
    expect(result.canAttack).toBe(true);
  });
});

// ========== InkSquirtHandler 測試 ==========

describe('InkSquirtHandler', () => {
  let handler;

  const makeContext = (inkUsed = false) => ({
    attacker: { id: 'attacker', traits: [{ type: 'carnivore' }] },
    defender: {
      id: 'defender',
      traits: [{ type: 'inkSquirt', usedThisTurn: inkUsed }],
    },
    gameState: {
      players: [],
      foodPool: { red: 5, blue: 5, yellow: 0 },
      actionLog: [],
    },
  });

  beforeEach(() => {
    handler = new InkSquirtHandler();
  });

  test('should return defense response when not used this turn', () => {
    const ctx = makeContext(false);
    const result = handler.getDefenseResponse(ctx);
    expect(result.hasResponse).toBe(true);
    expect(result.type).toBe('INK_SQUIRT');
  });

  test('should not return response when already used this turn', () => {
    const ctx = makeContext(true);
    const result = handler.getDefenseResponse(ctx);
    expect(result.hasResponse).toBe(false);
  });

  test('handleDefenseResponse should mark attacker as ink sprayed', () => {
    const ctx = makeContext(false);
    const response = { type: 'INK_SQUIRT' };
    handler.handleDefenseResponse(ctx, response);
    expect(ctx.attacker.inkSprayed).toBe(true);
    expect(ctx.attacker.hasAttackedThisTurn).toBe(true);
  });

  test('handleDefenseResponse should mark ink trait as used', () => {
    const ctx = makeContext(false);
    const response = { type: 'INK_SQUIRT' };
    handler.handleDefenseResponse(ctx, response);
    const inkTrait = ctx.defender.traits.find(t => t.type === 'inkSquirt');
    expect(inkTrait.usedThisTurn).toBe(true);
  });

  test('handleDefenseResponse should log the action', () => {
    const ctx = makeContext(false);
    const response = { type: 'INK_SQUIRT' };
    handler.handleDefenseResponse(ctx, response);
    expect(ctx.gameState.actionLog).toHaveLength(1);
    expect(ctx.gameState.actionLog[0].type).toBe('INK_SQUIRT_TRIGGERED');
  });

  test('onTurnStart should reset ink squirt state', () => {
    const creature = {
      id: 'c1',
      inkSprayed: true,
      traits: [{ type: 'inkSquirt', usedThisTurn: true }],
    };
    const gameState = { players: [] };
    handler.onTurnStart({ creature, gameState });
    expect(creature.inkSprayed).toBeUndefined();
    const inkTrait = creature.traits.find(t => t.type === 'inkSquirt');
    expect(inkTrait.usedThisTurn).toBe(false);
  });
});

// ========== BioluminescenceHandler 測試 ==========

describe('BioluminescenceHandler', () => {
  let handler;

  const makeContext = (linkedCreatureId = 'c2', blueFoodPool = 3) => {
    const creature1 = {
      id: 'c1',
      traits: [{ type: 'bioluminescence', linkedCreatureId }],
      food: { red: 0, blue: 0, yellow: 0 },
    };
    const creature2 = {
      id: 'c2',
      traits: [],
      food: { red: 0, blue: 0, yellow: 0 },
    };
    return {
      creature: creature1,
      linkedCreatureId,
      gameState: {
        players: [
          { id: 'p1', creatures: [creature1, creature2] },
        ],
        foodPool: { red: 5, blue: blueFoodPool, yellow: 0 },
        actionLog: [],
      },
    };
  };

  beforeEach(() => {
    handler = new BioluminescenceHandler();
  });

  test('should give blue food to linked creature when source gains food', () => {
    const ctx = makeContext('c2', 3);
    handler.onGainFood(ctx, 'red');
    const linkedCreature = ctx.gameState.players[0].creatures.find(c => c.id === 'c2');
    expect(linkedCreature.food.blue).toBe(1);
    expect(ctx.gameState.foodPool.blue).toBe(2);
  });

  test('should log bioluminescence trigger', () => {
    const ctx = makeContext('c2', 3);
    handler.onGainFood(ctx, 'blue');
    expect(ctx.gameState.actionLog).toHaveLength(1);
    expect(ctx.gameState.actionLog[0].type).toBe('BIOLUMINESCENCE_TRIGGER');
  });

  test('should not trigger when no linked creature', () => {
    const ctx = makeContext(null, 3);
    const prevBlue = ctx.gameState.foodPool.blue;
    handler.onGainFood(ctx, 'red');
    expect(ctx.gameState.foodPool.blue).toBe(prevBlue);
  });

  test('should not trigger when blue food pool is empty', () => {
    const ctx = makeContext('c2', 0);
    handler.onGainFood(ctx, 'red');
    const linkedCreature = ctx.gameState.players[0].creatures.find(c => c.id === 'c2');
    expect(linkedCreature.food.blue).toBe(0);
  });

  test('should not trigger same pair twice (loop prevention)', () => {
    const ctx = makeContext('c2', 10);
    const processedCreatures = new Set();
    processedCreatures.add('c1-c2');
    handler.onGainFood(ctx, 'red', processedCreatures);
    const linkedCreature = ctx.gameState.players[0].creatures.find(c => c.id === 'c2');
    expect(linkedCreature.food.blue).toBe(0);
  });

  test('onPlace should set linkedCreatureId on trait', () => {
    const creature = {
      id: 'c1',
      traits: [{ type: 'bioluminescence' }],
    };
    const targetCreature = { id: 'c2', traits: [] };
    const gameState = { players: [] };
    handler.onPlace({ creature, targetCreature, gameState });
    const trait = creature.traits.find(t => t.type === 'bioluminescence');
    expect(trait.linkedCreatureId).toBe('c2');
    expect(targetCreature.linkedBioluminescence).toContain('c1');
  });

  test('onRemove should clear linked creature reference', () => {
    const linkedCreature = {
      id: 'c2',
      traits: [],
      linkedBioluminescence: ['c1'],
    };
    const creature = {
      id: 'c1',
      traits: [{ type: 'bioluminescence', linkedCreatureId: 'c2' }],
    };
    const gameState = {
      players: [{ id: 'p1', creatures: [creature, linkedCreature] }],
    };
    handler.onRemove({ creature, gameState });
    expect(linkedCreature.linkedBioluminescence).not.toContain('c1');
  });
});

// ========== ElectroreceptionHandler 測試 ==========

describe('ElectroreceptionHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ElectroreceptionHandler();
  });

  test('canUseAbility should return false without carnivore', () => {
    const context = { creature: { traits: [{ type: 'electroreception' }] } };
    const result = handler.canUseAbility(context);
    expect(result.canUse).toBe(false);
  });

  test('canUseAbility should return true with carnivore', () => {
    const context = {
      creature: {
        traits: [{ type: 'electroreception' }, { type: 'carnivore' }],
      },
    };
    const result = handler.canUseAbility(context);
    expect(result.canUse).toBe(true);
  });

  test('getAbilityTargets should return burrowing fed creatures', () => {
    const attacker = {
      id: 'a1',
      traits: [{ type: 'electroreception' }, { type: 'carnivore' }],
      food: { red: 0, blue: 0, yellow: 0 },
    };
    const burrowingFedCreature = {
      id: 'c1',
      traits: [{ type: 'burrowing' }],
      food: { red: 1, blue: 1, yellow: 0 },
      foodNeeded: 2,
    };
    const burrowingHungryCreature = {
      id: 'c2',
      traits: [{ type: 'burrowing' }],
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 1,
    };
    const normalCreature = {
      id: 'c3',
      traits: [],
      food: { red: 1, blue: 0, yellow: 0 },
      foodNeeded: 1,
    };

    const gameState = {
      players: [
        { id: 'p1', creatures: [attacker] },
        {
          id: 'p2',
          creatures: [burrowingFedCreature, burrowingHungryCreature, normalCreature],
        },
      ],
    };

    const context = { creature: attacker, gameState };
    const targets = handler.getAbilityTargets(context);

    // Should only return burrowing creatures that are fed
    expect(targets).toHaveLength(1);
    expect(targets[0].creatureId).toBe('c1');
    expect(targets[0].bypassBurrowing).toBe(true);
  });
});

// ========== GulperHandler 測試 ==========

describe('GulperHandler', () => {
  let handler;

  const makeContext = (used = false, blueFoodPool = 3) => ({
    creature: {
      id: 'c1',
      traits: [{ type: 'gulper', usedThisTurn: used }],
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 2,
    },
    gameState: {
      players: [],
      foodPool: { red: 5, blue: blueFoodPool, yellow: 0 },
      actionLog: [],
    },
  });

  beforeEach(() => {
    handler = new GulperHandler();
  });

  test('canUseAbility should return true when not used and blue food available', () => {
    const ctx = makeContext(false, 3);
    const result = handler.canUseAbility(ctx);
    expect(result.canUse).toBe(true);
  });

  test('canUseAbility should return false when already used this turn', () => {
    const ctx = makeContext(true, 3);
    const result = handler.canUseAbility(ctx);
    expect(result.canUse).toBe(false);
  });

  test('canUseAbility should return false when no blue food in pool', () => {
    const ctx = makeContext(false, 0);
    const result = handler.canUseAbility(ctx);
    expect(result.canUse).toBe(false);
  });

  test('useAbility should give blue food to creature', () => {
    const ctx = makeContext(false, 3);
    const result = handler.useAbility(ctx);
    expect(result.success).toBe(true);
    expect(ctx.creature.food.blue).toBe(1);
    expect(ctx.gameState.foodPool.blue).toBe(2);
  });

  test('useAbility should mark gulper as used', () => {
    const ctx = makeContext(false, 3);
    handler.useAbility(ctx);
    const gulperTrait = ctx.creature.traits.find(t => t.type === 'gulper');
    expect(gulperTrait.usedThisTurn).toBe(true);
  });

  test('useAbility should log the action', () => {
    const ctx = makeContext(false, 3);
    handler.useAbility(ctx);
    expect(ctx.gameState.actionLog).toHaveLength(1);
    expect(ctx.gameState.actionLog[0].type).toBe('GULPER_FEED');
  });

  test('onTurnStart should reset usedThisTurn', () => {
    const ctx = makeContext(true, 3);
    handler.onTurnStart(ctx);
    const gulperTrait = ctx.creature.traits.find(t => t.type === 'gulper');
    expect(gulperTrait.usedThisTurn).toBe(false);
  });

  test('gulper definition should have foodBonus of 1', () => {
    const info = handler.getInfo();
    expect(info.foodBonus).toBe(1);
  });
});

// ========== 擴充包整合測試 ==========

describe('deepSeaExpansion', () => {
  test('should have correct id and name', () => {
    expect(deepSeaExpansion.id).toBe('deepSea');
    expect(deepSeaExpansion.name).toBe('深海生態');
    expect(deepSeaExpansion.nameEn).toBe('Deep Sea Ecology');
  });

  test('should require base expansion', () => {
    expect(deepSeaExpansion.requires).toContain('base');
  });

  test('should have no incompatible expansions', () => {
    expect(deepSeaExpansion.incompatible).toHaveLength(0);
  });

  test('createDeck should return 28 cards', () => {
    const deck = deepSeaExpansion.createDeck();
    expect(deck).toHaveLength(28);
  });

  test('each card in deck should have required fields', () => {
    const deck = deepSeaExpansion.createDeck();
    for (const card of deck) {
      expect(card.id).toBeTruthy();
      expect(card.instanceId).toBeTruthy();
      expect(card.frontTrait).toBeTruthy();
      expect(card.backTrait).toBeTruthy();
      expect(card.expansion).toBe('deepSea');
    }
  });

  test('createShuffledDeck should return 28 cards', () => {
    const deck = deepSeaExpansion.createShuffledDeck();
    expect(deck).toHaveLength(28);
  });

  test('validate should pass', () => {
    const result = deepSeaExpansion.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('onGameInit should set deepSeaEnabled flag', () => {
    const gameState = {};
    deepSeaExpansion.onGameInit(gameState);
    expect(gameState.expansionFlags?.deepSeaEnabled).toBe(true);
  });

  test('onGameEnd should clear deepSeaEnabled flag', () => {
    const gameState = { expansionFlags: { deepSeaEnabled: true } };
    deepSeaExpansion.onGameEnd(gameState);
    expect(gameState.expansionFlags?.deepSeaEnabled).toBeUndefined();
  });
});

// ========== 規則常數測試 ==========

describe('DEEP_SEA_RULES', () => {
  test('should have correct constants', () => {
    expect(DEEP_SEA_RULES.deepSeaFoodBonus).toBe(1);
    expect(DEEP_SEA_RULES.schoolingMinCreatures).toBe(3);
    expect(DEEP_SEA_RULES.inkSquirtUsesPerTurn).toBe(1);
    expect(DEEP_SEA_RULES.gulperBonusFeedsPerTurn).toBe(1);
  });
});
