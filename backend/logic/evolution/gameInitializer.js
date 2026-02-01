/**
 * 遊戲初始化器
 *
 * 負責初始化遊戲狀態、載入擴充包、建立牌庫、發牌等
 *
 * @module logic/evolution/gameInitializer
 */

const { GameConfig } = require('./gameConfig');
const { ExpansionRegistry, globalRegistry } = require('../../../shared/expansions');
const { GameEventEmitter, GAME_EVENTS, EffectQueue, registerBuiltinHandlers } = require('../../../shared/expansions/core');
const { GAME_PHASES } = require('../../../shared/constants/evolution');

/**
 * 遊戲狀態工廠
 */
class GameStateFactory {
  /**
   * 建立空白遊戲狀態
   * @param {string} gameId - 遊戲 ID
   * @param {GameConfig} config - 遊戲配置
   * @returns {Object} 遊戲狀態
   */
  static createEmpty(gameId, config) {
    return {
      id: gameId,
      config: config.toJSON(),
      status: 'waiting',
      round: 0,
      currentPhase: null,
      currentPlayerIndex: 0,
      turnOrder: [],
      players: {},
      deck: [],
      discardPile: [],
      foodPool: 0,
      lastFoodRoll: null,
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
      winner: null,
      scores: {},
      // 事件系統（不序列化）
      eventEmitter: null,
      effectQueue: null,
    };
  }
}

/**
 * 遊戲初始化器
 */
class GameInitializer {
  /**
   * @param {ExpansionRegistry} [registry] - 擴充包註冊表（可選）
   */
  constructor(registry = null) {
    this.registry = registry || new ExpansionRegistry();
  }

  /**
   * 初始化遊戲
   * @param {string} gameId - 遊戲 ID
   * @param {Object[]} players - 玩家列表 [{ id, name, ... }]
   * @param {Object} configOptions - 配置選項
   * @returns {Promise<Object>} 遊戲狀態
   */
  async initialize(gameId, players, configOptions = {}) {
    // 建立配置
    const config = new GameConfig(configOptions);

    // 驗證配置
    const validation = await config.validate();
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
    }

    // 驗證玩家數
    const { minPlayers, maxPlayers } = config.getPlayerRange();
    if (players.length < minPlayers || players.length > maxPlayers) {
      throw new Error(
        `Invalid player count: ${players.length}. Expected ${minPlayers}-${maxPlayers}`
      );
    }

    // 載入並啟用擴充包
    await this._setupExpansions(config.expansions);

    // 建立遊戲狀態
    const gameState = GameStateFactory.createEmpty(gameId, config);

    // 初始化玩家
    this._initializePlayers(gameState, players);

    // 建立牌庫
    this._createDeck(gameState);

    // 初始化事件系統
    this._setupEventSystem(gameState);

    // 初始化效果系統
    this._setupEffectSystem(gameState);

    // 發牌
    this._dealInitialCards(gameState, players.length, config);

    // 設定回合順序
    this._setupTurnOrder(gameState, config);

    // 更新狀態
    gameState.status = 'ready';

    return gameState;
  }

  /**
   * 設定擴充包
   * @private
   * @param {string[]} expansionIds - 擴充包 ID 列表
   */
  async _setupExpansions(expansionIds) {
    // 確保基礎版首先載入
    const orderedIds = expansionIds.includes('base')
      ? expansionIds
      : ['base', ...expansionIds];

    for (const expansionId of orderedIds) {
      if (!this.registry.isEnabled(expansionId)) {
        // 如果尚未啟用，嘗試註冊和啟用
        const expansion = this._getExpansionModule(expansionId);
        if (expansion && !this.registry.getExpansion(expansionId)) {
          this.registry.register(expansion);
        }
        this.registry.enable(expansionId);
      }
    }
  }

  /**
   * 取得擴充包模組
   * @private
   * @param {string} expansionId
   * @returns {Object|null}
   */
  _getExpansionModule(expansionId) {
    // 目前只有基礎版
    if (expansionId === 'base') {
      return require('../../../shared/expansions/base').baseExpansion;
    }
    return null;
  }

  /**
   * 初始化玩家
   * @private
   * @param {Object} gameState
   * @param {Object[]} players
   */
  _initializePlayers(gameState, players) {
    for (const player of players) {
      gameState.players[player.id] = {
        id: player.id,
        name: player.name,
        hand: [],
        creatures: [],
        graveyard: [],
        passed: false,
        connected: true,
        lastAction: Date.now(),
      };
    }
  }

  /**
   * 建立牌庫
   * @private
   * @param {Object} gameState
   */
  _createDeck(gameState) {
    // 從註冊表取得牌組
    const deck = this.registry.createDeck();

    // 洗牌 (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // 為每張卡加上 instanceId
    deck.forEach((card, index) => {
      card.instanceId = `${gameState.id}_card_${index}`;
    });

    gameState.deck = deck;
  }

  /**
   * 設定事件系統
   * @private
   * @param {Object} gameState
   */
  _setupEventSystem(gameState) {
    gameState.eventEmitter = new GameEventEmitter();

    // 發送遊戲創建事件
    gameState.eventEmitter.emit(GAME_EVENTS.GAME_CREATED, {
      gameId: gameState.id,
      playerCount: Object.keys(gameState.players).length,
      expansions: gameState.config.expansions,
    });
  }

  /**
   * 設定效果系統
   * @private
   * @param {Object} gameState
   */
  _setupEffectSystem(gameState) {
    gameState.effectQueue = new EffectQueue();
    registerBuiltinHandlers(gameState.effectQueue);
  }

  /**
   * 發初始手牌
   * @private
   * @param {Object} gameState
   * @param {number} playerCount
   * @param {GameConfig} config
   */
  _dealInitialCards(gameState, playerCount, config) {
    const cardsPerPlayer = config.getInitialHandSize(playerCount);

    for (const player of Object.values(gameState.players)) {
      const cards = gameState.deck.splice(0, cardsPerPlayer);
      player.hand = cards;
    }
  }

  /**
   * 設定回合順序
   * @private
   * @param {Object} gameState
   * @param {GameConfig} config
   */
  _setupTurnOrder(gameState, config) {
    const playerIds = Object.keys(gameState.players);

    if (config.settings.shufflePlayerOrder) {
      // 隨機順序
      for (let i = playerIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
      }
    }

    gameState.turnOrder = playerIds;
    gameState.currentPlayerIndex = 0;
  }

  /**
   * 開始遊戲
   * @param {Object} gameState
   * @returns {Object} gameState
   */
  startGame(gameState) {
    if (gameState.status !== 'ready') {
      throw new Error(`Cannot start game in status: ${gameState.status}`);
    }

    gameState.status = 'playing';
    gameState.startedAt = Date.now();
    gameState.round = 1;
    gameState.currentPhase = GAME_PHASES.EVOLUTION;

    // 發送事件
    if (gameState.eventEmitter) {
      // 遊戲開始事件
      gameState.eventEmitter.emit(GAME_EVENTS.GAME_STARTED, {
        gameId: gameState.id,
        round: gameState.round,
        firstPlayer: gameState.turnOrder[0],
      });

      // 第一回合開始事件
      gameState.eventEmitter.emit(GAME_EVENTS.ROUND_START, {
        gameId: gameState.id,
        round: gameState.round,
        gameState,
      });

      // 演化階段進入事件
      gameState.eventEmitter.emit(GAME_EVENTS.PHASE_ENTER, {
        gameId: gameState.id,
        phase: GAME_PHASES.EVOLUTION,
        round: gameState.round,
        gameState,
      });
    }

    return gameState;
  }

  /**
   * 重置註冊表
   */
  resetRegistry() {
    this.registry.reset();
  }
}

// 預設實例（使用全域註冊表）
const gameInitializer = new GameInitializer(globalRegistry);

module.exports = {
  GameStateFactory,
  GameInitializer,
  gameInitializer,
};
