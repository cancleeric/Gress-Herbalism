/**
 * 整合測試：完整遊戲流程
 *
 * 驗證擴充包架構端到端運作
 *
 * @module expansions/__tests__/integration/fullGameFlow.test
 */

const { GameInitializer, GameStateFactory } = require('../../../../backend/logic/evolution/gameInitializer');
const { ExpansionRegistry } = require('../../ExpansionRegistry');
const { baseExpansion } = require('../../base');
const { GAME_PHASES } = require('../../../constants/evolution');

describe('Full Game Flow Integration', () => {
  let registry;
  let gameInitializer;
  let gameState;

  beforeEach(() => {
    // 建立新的註冊表實例
    registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.enable('base');

    // 建立初始化器
    gameInitializer = new GameInitializer(registry);
  });

  afterEach(() => {
    registry.reset();
  });

  describe('Game Initialization', () => {
    it('should initialize game with 2 players', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(gameState.id).toBe('test-game');
      expect(Object.keys(gameState.players)).toHaveLength(2);
      expect(gameState.deck.length).toBeGreaterThan(0);
      expect(gameState.status).toBe('ready');
    });

    it('should initialize game with 4 players', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
        { id: 'p3', name: 'Player 3' },
        { id: 'p4', name: 'Player 4' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(Object.keys(gameState.players)).toHaveLength(4);
    });

    it('should deal initial cards to all players', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(gameState.players.p1.hand.length).toBeGreaterThan(0);
      expect(gameState.players.p2.hand.length).toBeGreaterThan(0);
    });

    it('should reject invalid player count (too few)', async () => {
      const players = [{ id: 'p1', name: 'Player 1' }];

      await expect(
        gameInitializer.initialize('test-game', players)
      ).rejects.toThrow(/Invalid player count/);
    });

    it('should reject invalid player count (too many)', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
        { id: 'p3', name: 'Player 3' },
        { id: 'p4', name: 'Player 4' },
        { id: 'p5', name: 'Player 5' },
      ];

      await expect(
        gameInitializer.initialize('test-game', players)
      ).rejects.toThrow(/Invalid player count/);
    });

    it('should create empty game state with factory', () => {
      const { GameConfig } = require('../../../../backend/logic/evolution/gameConfig');
      const config = new GameConfig();
      const state = GameStateFactory.createEmpty('test-id', config);

      expect(state.id).toBe('test-id');
      expect(state.status).toBe('waiting');
      expect(state.round).toBe(0);
      expect(state.players).toEqual({});
    });
  });

  describe('Game Start', () => {
    beforeEach(async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];
      gameState = await gameInitializer.initialize('test-game', players);
    });

    it('should start game and enter evolution phase', () => {
      gameInitializer.startGame(gameState);

      expect(gameState.status).toBe('playing');
      expect(gameState.round).toBe(1);
      expect(gameState.currentPhase).toBe(GAME_PHASES.EVOLUTION);
    });

    it('should emit game started event', () => {
      const events = [];
      gameState.eventEmitter.on('game:started', (e) => events.push(e));

      gameInitializer.startGame(gameState);

      expect(events).toHaveLength(1);
      // 事件資料包裝在 data 屬性中
      expect(events[0].data).toHaveProperty('gameId', 'test-game');
    });

    it('should emit round start event', () => {
      const events = [];
      gameState.eventEmitter.on('round:start', (e) => events.push(e));

      gameInitializer.startGame(gameState);

      expect(events).toHaveLength(1);
      // 事件資料包裝在 data 屬性中
      expect(events[0].data).toHaveProperty('round', 1);
    });

    it('should emit phase enter event', () => {
      const events = [];
      gameState.eventEmitter.on('phase:enter', (e) => events.push(e));

      gameInitializer.startGame(gameState);

      expect(events).toHaveLength(1);
      // 事件資料包裝在 data 屬性中
      expect(events[0].data).toHaveProperty('phase', GAME_PHASES.EVOLUTION);
    });

    it('should not start game if status is not ready', () => {
      gameState.status = 'playing';

      expect(() => {
        gameInitializer.startGame(gameState);
      }).toThrow(/Cannot start game/);
    });

    it('should set startedAt timestamp', () => {
      const before = Date.now();
      gameInitializer.startGame(gameState);
      const after = Date.now();

      expect(gameState.startedAt).toBeGreaterThanOrEqual(before);
      expect(gameState.startedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('Turn Order', () => {
    it('should set up turn order with all players', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
        { id: 'p3', name: 'Player 3' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(gameState.turnOrder).toHaveLength(3);
      expect(gameState.turnOrder).toContain('p1');
      expect(gameState.turnOrder).toContain('p2');
      expect(gameState.turnOrder).toContain('p3');
    });

    it('should start with player index 0', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(gameState.currentPlayerIndex).toBe(0);
    });
  });

  describe('Deck Creation', () => {
    it('should create deck from registry', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      // 基礎版有 84 張卡牌，發給 2 個玩家後還應該有剩餘
      const totalCards = gameState.deck.length +
        gameState.players.p1.hand.length +
        gameState.players.p2.hand.length;

      expect(totalCards).toBeGreaterThan(0);
    });

    it('should assign unique instanceIds to cards', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      const allCards = [
        ...gameState.deck,
        ...gameState.players.p1.hand,
        ...gameState.players.p2.hand,
      ];

      const instanceIds = allCards.map(c => c.instanceId);
      const uniqueIds = new Set(instanceIds);

      expect(uniqueIds.size).toBe(instanceIds.length);
    });
  });

  describe('Event System', () => {
    it('should set up event emitter', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(gameState.eventEmitter).toBeDefined();
      expect(typeof gameState.eventEmitter.on).toBe('function');
      expect(typeof gameState.eventEmitter.emit).toBe('function');
    });

    it('should set up effect queue', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      gameState = await gameInitializer.initialize('test-game', players);

      expect(gameState.effectQueue).toBeDefined();
      expect(typeof gameState.effectQueue.enqueue).toBe('function');
    });
  });

  describe('Registry Reset', () => {
    it('should reset registry', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      await gameInitializer.initialize('test-game', players);

      expect(registry.isEnabled('base')).toBe(true);

      gameInitializer.resetRegistry();

      expect(registry.isEnabled('base')).toBe(false);
    });
  });
});
