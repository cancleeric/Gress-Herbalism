/**
 * 基礎規則測試
 * @module expansions/base/rules/__tests__/baseRules.test
 */

const RuleEngine = require('../../../../../backend/logic/evolution/rules/RuleEngine');
const { RULE_IDS } = require('../../../../../backend/logic/evolution/rules/ruleIds');
const { registerBaseRules, foodRules, attackRules, feedingRules, extinctionRules, scoreRules, phaseRules } = require('../index');

// 測試輔助函數
function createMockGameState(overrides = {}) {
  return {
    players: [
      {
        id: 'player1',
        name: 'Player 1',
        creatures: [],
        hand: [],
        discardPile: [],
      },
      {
        id: 'player2',
        name: 'Player 2',
        creatures: [],
        hand: [],
        discardPile: [],
      },
    ],
    foodPool: { red: 5, blue: 0 },
    deck: [],
    actionLog: [],
    phase: 'feeding',
    round: 1,
    ...overrides,
  };
}

function createMockCreature(overrides = {}) {
  return {
    id: `creature-${Math.random().toString(36).substr(2, 9)}`,
    ownerId: 'player1',
    traits: [],
    food: { red: 0, blue: 0, yellow: 0 },
    foodNeeded: 1,
    ...overrides,
  };
}

describe('registerBaseRules', () => {
  test('should register all rules to engine', () => {
    const engine = new RuleEngine();
    registerBaseRules(engine);

    expect(engine.hasRule(RULE_IDS.FOOD_FORMULA)).toBe(true);
    expect(engine.hasRule(RULE_IDS.FOOD_ROLL_DICE)).toBe(true);
    expect(engine.hasRule(RULE_IDS.ATTACK_VALIDATE)).toBe(true);
    expect(engine.hasRule(RULE_IDS.FEED_VALIDATE)).toBe(true);
    expect(engine.hasRule(RULE_IDS.EXTINCTION_CHECK)).toBe(true);
    expect(engine.hasRule(RULE_IDS.SCORE_CALCULATE)).toBe(true);
    expect(engine.hasRule(RULE_IDS.PHASE_TRANSITION)).toBe(true);
  });
});

describe('foodRules', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
    foodRules.register(engine);
  });

  test('FOOD_FORMULA should return correct formula for 2 players', async () => {
    const gameState = createMockGameState();
    const result = await engine.executeRule(RULE_IDS.FOOD_FORMULA, { gameState });

    expect(result.formula).toEqual({ dice: 1, bonus: 2 });
  });

  test('FOOD_FORMULA should return correct formula for 3 players', async () => {
    const gameState = createMockGameState({
      players: [
        { id: 'p1', creatures: [] },
        { id: 'p2', creatures: [] },
        { id: 'p3', creatures: [] },
      ],
    });
    const result = await engine.executeRule(RULE_IDS.FOOD_FORMULA, { gameState });

    expect(result.formula).toEqual({ dice: 2, bonus: 0 });
  });

  test('FOOD_FORMULA should throw for unsupported player count', async () => {
    const gameState = createMockGameState({
      players: [{ id: 'p1' }],
    });

    await expect(engine.executeRule(RULE_IDS.FOOD_FORMULA, { gameState }))
      .rejects.toThrow('Unsupported player count');
  });

  test('FOOD_ROLL_DICE should update food pool', async () => {
    const gameState = createMockGameState();
    const result = await engine.executeRule(RULE_IDS.FOOD_ROLL_DICE, {
      gameState,
      formula: { dice: 1, bonus: 2 },
    });

    expect(result.gameState.foodPool.red).toBeGreaterThanOrEqual(3);
    expect(result.gameState.foodPool.red).toBeLessThanOrEqual(8);
    expect(result.diceResults.length).toBe(1);
  });
});

describe('attackRules', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
    attackRules.register(engine);
  });

  test('ATTACK_VALIDATE should reject non-carnivore attacker', async () => {
    const attacker = createMockCreature({ traits: [] });
    const target = createMockCreature({ ownerId: 'player2' });
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.ATTACK_VALIDATE, {
      attacker,
      target,
      gameState,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('肉食');
  });

  test('ATTACK_VALIDATE should reject attacking own creature', async () => {
    const attacker = createMockCreature({
      traits: [{ type: 'carnivore' }],
      ownerId: 'player1',
    });
    const target = createMockCreature({ ownerId: 'player1' });
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.ATTACK_VALIDATE, {
      attacker,
      target,
      gameState,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('自己的生物');
  });

  test('ATTACK_VALIDATE should reject already attacked this turn', async () => {
    const attacker = createMockCreature({
      traits: [{ type: 'carnivore' }],
      hasAttackedThisTurn: true,
    });
    const target = createMockCreature({ ownerId: 'player2' });
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.ATTACK_VALIDATE, {
      attacker,
      target,
      gameState,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('已經攻擊過');
  });

  test('ATTACK_VALIDATE should reject aquatic attacking non-aquatic', async () => {
    const attacker = createMockCreature({
      traits: [{ type: 'carnivore' }, { type: 'aquatic' }],
    });
    const target = createMockCreature({ ownerId: 'player2', traits: [] });
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.ATTACK_VALIDATE, {
      attacker,
      target,
      gameState,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('水生');
  });

  test('ATTACK_CHECK_DEFENSE should pass when no defense', async () => {
    const attacker = createMockCreature({
      traits: [{ type: 'carnivore' }],
    });
    const target = createMockCreature({ ownerId: 'player2', traits: [] });
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.ATTACK_CHECK_DEFENSE, {
      attacker,
      target,
      gameState,
    });

    expect(result.valid).toBe(true);
  });
});

describe('feedingRules', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
    feedingRules.register(engine);
  });

  test('FEED_VALIDATE should reject carnivore', async () => {
    const creature = createMockCreature({
      traits: [{ type: 'carnivore' }],
    });
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.FEED_VALIDATE, {
      creature,
      gameState,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('肉食');
  });

  test('FEED_VALIDATE should reject when food pool empty', async () => {
    const creature = createMockCreature();
    const gameState = createMockGameState({ foodPool: { red: 0, blue: 0 } });

    const result = await engine.executeRule(RULE_IDS.FEED_VALIDATE, {
      creature,
      gameState,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('沒有食物');
  });

  test('FEED_VALIDATE should reject when already fed without fat', async () => {
    const creature = createMockCreature({
      food: { red: 1, blue: 0, yellow: 0 },
      foodNeeded: 1,
      traits: [],
    });
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.FEED_VALIDATE, {
      creature,
      gameState,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('吃飽');
  });

  test('FEED_VALIDATE should allow feeding when not fed', async () => {
    const creature = createMockCreature({
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 1,
    });
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.FEED_VALIDATE, {
      creature,
      gameState,
    });

    expect(result.valid).toBe(true);
  });

  test('FEED_CHECK_SYMBIOSIS should block when representative not fed', async () => {
    const representative = createMockCreature({
      id: 'rep-1',
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 2,
    });
    const creature = createMockCreature({
      symbiosisRepresentativeId: 'rep-1',
    });
    const gameState = createMockGameState();
    gameState.players[0].creatures = [representative, creature];

    const result = await engine.executeRule(RULE_IDS.FEED_CHECK_SYMBIOSIS, {
      creature,
      gameState,
    });

    expect(result.canFeed).toBe(false);
  });

  test('FEED_EXECUTE should reduce food pool and give food', async () => {
    const creature = createMockCreature();
    const gameState = createMockGameState({ foodPool: { red: 5, blue: 0 } });
    gameState.players[0].creatures = [creature];

    const result = await engine.executeRule(RULE_IDS.FEED_EXECUTE, {
      creature,
      gameState,
    });

    expect(result.gameState.foodPool.red).toBe(4);
    expect(creature.food.red).toBe(1);
  });
});

describe('extinctionRules', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
    extinctionRules.register(engine);
  });

  test('EXTINCTION_CHECK should not extinct when fed', async () => {
    const creature = createMockCreature({
      food: { red: 1, blue: 0, yellow: 0 },
      foodNeeded: 1,
    });

    const result = await engine.executeRule(RULE_IDS.EXTINCTION_CHECK, {
      creature,
    });

    expect(result.shouldExtinct).toBe(false);
  });

  test('EXTINCTION_CHECK should not extinct when hibernating', async () => {
    const creature = createMockCreature({
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 1,
      isHibernating: true,
    });

    const result = await engine.executeRule(RULE_IDS.EXTINCTION_CHECK, {
      creature,
    });

    expect(result.shouldExtinct).toBe(false);
    expect(result.reason).toBe('冬眠中');
  });

  test('EXTINCTION_CHECK should extinct when not fed', async () => {
    const creature = createMockCreature({
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 2,
    });

    const result = await engine.executeRule(RULE_IDS.EXTINCTION_CHECK, {
      creature,
    });

    expect(result.shouldExtinct).toBe(true);
  });

  test('EXTINCTION_CHECK should use fat to survive', async () => {
    const creature = createMockCreature({
      food: { red: 0, blue: 0, yellow: 2 },
      foodNeeded: 2,
    });

    const result = await engine.executeRule(RULE_IDS.EXTINCTION_CHECK, {
      creature,
    });

    expect(result.shouldExtinct).toBe(false);
    expect(result.fatToConsume).toBe(2);
  });
});

describe('scoreRules', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
    scoreRules.register(engine);
  });

  test('SCORE_CALCULATE should give 2 points per creature', async () => {
    const gameState = createMockGameState();
    gameState.players[0].creatures = [
      createMockCreature({ traits: [] }),
      createMockCreature({ traits: [] }),
    ];
    gameState.players[1].creatures = [
      createMockCreature({ traits: [] }),
    ];

    const result = await engine.executeRule(RULE_IDS.SCORE_CALCULATE, {
      gameState,
    });

    expect(result.scores['player1']).toBe(4); // 2 creatures * 2 points
    expect(result.scores['player2']).toBe(2); // 1 creature * 2 points
  });

  test('SCORE_CALCULATE should add trait points', async () => {
    const gameState = createMockGameState();
    gameState.players[0].creatures = [
      createMockCreature({
        traits: [
          { type: 'camouflage' },
          { type: 'burrowing' },
        ],
      }),
    ];

    const result = await engine.executeRule(RULE_IDS.SCORE_CALCULATE, {
      gameState,
    });

    expect(result.scores['player1']).toBe(4); // 2 (creature) + 1 + 1 (traits)
  });

  test('GAME_END_DETERMINE_WINNER should find winner', async () => {
    const gameState = createMockGameState();
    const scores = { player1: 10, player2: 8 };

    const result = await engine.executeRule(RULE_IDS.GAME_END_DETERMINE_WINNER, {
      gameState,
      scores,
    });

    expect(result.winnerId).toBe('player1');
    expect(result.isTie).toBe(false);
  });

  test('GAME_END_DETERMINE_WINNER should handle tie', async () => {
    const gameState = createMockGameState();
    const scores = { player1: 10, player2: 10 };

    const result = await engine.executeRule(RULE_IDS.GAME_END_DETERMINE_WINNER, {
      gameState,
      scores,
    });

    expect(result.isTie).toBe(true);
    expect(result.winners.length).toBe(2);
  });
});

describe('phaseRules', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
    phaseRules.register(engine);
    foodRules.register(engine);
    extinctionRules.register(engine);
    attackRules.register(engine);
  });

  test('GAME_INIT should initialize game state', async () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ];

    const result = await engine.executeRule(RULE_IDS.GAME_INIT, {
      gameState: {},
      players,
    });

    expect(result.gameState.phase).toBe('evolution');
    expect(result.gameState.round).toBe(1);
    expect(result.gameState.players.length).toBe(2);
    expect(result.gameState.players[0].creatures).toEqual([]);
  });

  test('PHASE_TRANSITION should move to next phase', async () => {
    const gameState = createMockGameState({ phase: 'evolution' });

    const result = await engine.executeRule(RULE_IDS.PHASE_TRANSITION, {
      gameState,
    });

    expect(result.gameState.phase).toBe('foodSupply');
  });

  test('PHASE_EVOLUTION_START should reset player state', async () => {
    const gameState = createMockGameState({
      phase: 'evolution',
      round: 1,
    });
    gameState.players[0].passedEvolution = true;

    const result = await engine.executeRule(RULE_IDS.PHASE_EVOLUTION_START, {
      gameState,
    });

    expect(result.gameState.players[0].passedEvolution).toBe(false);
  });

  test('PHASE_FOOD_START should roll dice and set food', async () => {
    const gameState = createMockGameState();

    const result = await engine.executeRule(RULE_IDS.PHASE_FOOD_START, {
      gameState,
    });

    expect(result.gameState.foodPool.red).toBeGreaterThanOrEqual(3);
  });
});
