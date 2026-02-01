# 工單 0327：重構遊戲初始化（支援擴充包選擇）

## 基本資訊
- **工單編號**：0327
- **所屬計畫**：P2-A 可擴充架構
- **前置工單**：0326（擴充包載入機制）
- **預計影響檔案**：
  - `backend/logic/evolution/gameInitializer.js`（新增）
  - `backend/logic/evolution/gameLogic.js`（重構）
  - `backend/services/evolutionRoomHandler.js`（更新）
  - `shared/constants/evolution.js`（更新）

---

## 目標

重構遊戲初始化流程，支援：
1. 房主選擇啟用的擴充包
2. 根據擴充包建立牌庫
3. 驗證擴充包組合有效性
4. 計算玩家數限制

---

## 詳細規格

### 1. 遊戲配置類別

```javascript
// backend/logic/evolution/gameConfig.js

import { ExpansionRegistry } from '@shared/expansions/registry.js';
import { expansionLoader } from '@shared/expansions/loader.js';

/**
 * 遊戲配置選項
 */
export const DEFAULT_GAME_CONFIG = {
  // 擴充包設定
  expansions: ['base'],

  // 規則變體
  variants: {
    hiddenCards: false,        // 隱藏對手手牌數量
    fastMode: false,           // 快速模式（減少發牌）
    friendlyFire: true,        // 允許攻擊自己的生物
    simultaneousFeed: false,   // 同時進食（非輪流）
  },

  // 時間限制（毫秒）
  timeouts: {
    evolutionPhase: 120000,    // 演化階段 2 分鐘
    feedingPhase: 60000,       // 進食階段 1 分鐘
    turnTimeout: 30000,        // 單次行動 30 秒
    inactivityTimeout: 180000, // 掛機 3 分鐘踢出
  },

  // 遊戲設定
  settings: {
    shufflePlayerOrder: true,  // 隨機玩家順序
    autoPass: true,            // 無可用行動時自動跳過
    showFoodPool: true,        // 顯示食物池數值
  },
};

/**
 * 遊戲配置類別
 */
export class GameConfig {
  constructor(options = {}) {
    this.expansions = options.expansions || [...DEFAULT_GAME_CONFIG.expansions];
    this.variants = { ...DEFAULT_GAME_CONFIG.variants, ...options.variants };
    this.timeouts = { ...DEFAULT_GAME_CONFIG.timeouts, ...options.timeouts };
    this.settings = { ...DEFAULT_GAME_CONFIG.settings, ...options.settings };
  }

  /**
   * 驗證配置有效性
   */
  async validate() {
    const errors = [];

    // 檢查擴充包
    for (const expansionId of this.expansions) {
      const status = expansionLoader.getStatus(expansionId);
      if (status === 'not_loaded') {
        try {
          await expansionLoader.load(expansionId);
        } catch (e) {
          errors.push(`Expansion not found: ${expansionId}`);
        }
      }
    }

    // 必須包含基礎版
    if (!this.expansions.includes('base')) {
      errors.push('Base expansion is required');
    }

    // 檢查時間設定
    for (const [key, value] of Object.entries(this.timeouts)) {
      if (value < 0) {
        errors.push(`Invalid timeout: ${key} cannot be negative`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 取得玩家數範圍
   */
  getPlayerRange() {
    let minPlayers = 2;
    let maxPlayers = 4;

    for (const expansionId of this.expansions) {
      const loadResult = expansionLoader.getLoaded(expansionId);
      if (loadResult?.manifest) {
        const { minPlayers: min, maxPlayers: max } = loadResult.manifest;
        if (min !== undefined) minPlayers = Math.max(minPlayers, min);
        if (max !== undefined) maxPlayers = Math.max(maxPlayers, max);
      }
    }

    return { minPlayers, maxPlayers };
  }

  /**
   * 序列化
   */
  toJSON() {
    return {
      expansions: this.expansions,
      variants: this.variants,
      timeouts: this.timeouts,
      settings: this.settings,
    };
  }

  /**
   * 從 JSON 還原
   */
  static fromJSON(json) {
    return new GameConfig(json);
  }
}
```

### 2. 遊戲初始化器

```javascript
// backend/logic/evolution/gameInitializer.js

import { GameConfig } from './gameConfig.js';
import { ExpansionRegistry } from '@shared/expansions/registry.js';
import { expansionLoader } from '@shared/expansions/loader.js';
import { GameEventEmitter } from '@shared/expansions/core/eventEmitter.js';
import { GAME_EVENTS } from '@shared/expansions/core/gameEvents.js';
import { EffectQueue } from '@shared/expansions/core/effectQueue.js';
import { registerBuiltinHandlers } from '@shared/expansions/core/handlers/builtinEffectHandlers.js';
import { GAME_PHASES } from '@shared/constants/evolution.js';

/**
 * 遊戲狀態工廠
 */
export class GameStateFactory {
  /**
   * 建立空白遊戲狀態
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
    };
  }
}

/**
 * 遊戲初始化器
 */
export class GameInitializer {
  constructor() {
    this.registry = ExpansionRegistry;
  }

  /**
   * 初始化遊戲
   * @param {string} gameId - 遊戲ID
   * @param {Object[]} players - 玩家列表 [{ id, name, ... }]
   * @param {Object} configOptions - 配置選項
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
    this._initializePlayers(gameState, players, config);

    // 建立牌庫
    this._createDeck(gameState);

    // 初始化事件系統
    this._setupEventSystem(gameState);

    // 初始化效果系統
    this._setupEffectSystem(gameState);

    // 發牌
    this._dealInitialCards(gameState, players.length);

    // 設定回合順序
    this._setupTurnOrder(gameState, config);

    // 更新狀態
    gameState.status = 'ready';

    return gameState;
  }

  /**
   * 設定擴充包
   */
  async _setupExpansions(expansionIds) {
    // 確保基礎版首先載入
    if (!expansionIds.includes('base')) {
      expansionIds = ['base', ...expansionIds];
    }

    for (const expansionId of expansionIds) {
      await this.registry.enableExpansion(expansionId);
    }
  }

  /**
   * 初始化玩家
   */
  _initializePlayers(gameState, players, config) {
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
   */
  _createDeck(gameState) {
    const deck = this.registry.createCombinedDeck();

    // 洗牌
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    gameState.deck = deck;
  }

  /**
   * 設定事件系統
   */
  _setupEventSystem(gameState) {
    gameState.eventEmitter = new GameEventEmitter();

    // 記錄遊戲創建事件
    gameState.eventEmitter.emit(GAME_EVENTS.GAME_CREATED, {
      gameId: gameState.id,
      playerCount: Object.keys(gameState.players).length,
      expansions: gameState.config.expansions,
    });
  }

  /**
   * 設定效果系統
   */
  _setupEffectSystem(gameState) {
    gameState.effectQueue = new EffectQueue();
    registerBuiltinHandlers(gameState.effectQueue);
  }

  /**
   * 發初始手牌
   */
  _dealInitialCards(gameState, playerCount) {
    // 根據玩家數決定發牌數
    const cardsPerPlayer = this._getInitialCardCount(playerCount);

    for (const player of Object.values(gameState.players)) {
      const cards = gameState.deck.splice(0, cardsPerPlayer);
      player.hand = cards;
    }
  }

  /**
   * 計算初始發牌數
   */
  _getInitialCardCount(playerCount) {
    // 基礎規則：每位玩家發 6 張
    // 可根據擴充包調整
    return 6;
  }

  /**
   * 設定回合順序
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
   */
  startGame(gameState) {
    if (gameState.status !== 'ready') {
      throw new Error(`Cannot start game in status: ${gameState.status}`);
    }

    gameState.status = 'playing';
    gameState.startedAt = Date.now();
    gameState.round = 1;
    gameState.currentPhase = GAME_PHASES.EVOLUTION;

    // 發送遊戲開始事件
    gameState.eventEmitter.emit(GAME_EVENTS.GAME_STARTED, {
      gameId: gameState.id,
      round: gameState.round,
      firstPlayer: gameState.turnOrder[0],
    });

    // 發送第一回合開始事件
    gameState.eventEmitter.emit(GAME_EVENTS.ROUND_START, {
      gameId: gameState.id,
      round: gameState.round,
    });

    // 發送演化階段進入事件
    gameState.eventEmitter.emit(GAME_EVENTS.PHASE_ENTER, {
      gameId: gameState.id,
      phase: GAME_PHASES.EVOLUTION,
      round: gameState.round,
    });

    return gameState;
  }
}

// 預設實例
export const gameInitializer = new GameInitializer();
```

### 3. 房間處理器更新

```javascript
// backend/services/evolutionRoomHandler.js（更新片段）

import { gameInitializer, GameInitializer } from '../logic/evolution/gameInitializer.js';
import { GameConfig } from '../logic/evolution/gameConfig.js';

/**
 * 處理房間設定更新
 */
async function handleUpdateRoomConfig(socket, roomId, configUpdate) {
  const room = rooms.get(roomId);

  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  // 只有房主可以更新設定
  if (room.hostId !== socket.userId) {
    socket.emit('error', { message: 'Only host can update room config' });
    return;
  }

  // 驗證新配置
  const newConfig = new GameConfig({
    ...room.config,
    ...configUpdate,
  });

  const validation = await newConfig.validate();
  if (!validation.valid) {
    socket.emit('error', {
      message: 'Invalid configuration',
      errors: validation.errors,
    });
    return;
  }

  // 檢查玩家數是否符合新配置
  const { minPlayers, maxPlayers } = newConfig.getPlayerRange();
  if (room.players.length > maxPlayers) {
    socket.emit('error', {
      message: `Too many players for this expansion combination (max: ${maxPlayers})`,
    });
    return;
  }

  // 更新房間配置
  room.config = newConfig.toJSON();

  // 通知所有玩家配置更新
  io.to(roomId).emit('roomConfigUpdated', {
    config: room.config,
    playerRange: { minPlayers, maxPlayers },
  });
}

/**
 * 處理開始遊戲
 */
async function handleStartGame(socket, roomId) {
  const room = rooms.get(roomId);

  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  if (room.hostId !== socket.userId) {
    socket.emit('error', { message: 'Only host can start game' });
    return;
  }

  // 檢查玩家數
  const config = new GameConfig(room.config);
  const { minPlayers } = config.getPlayerRange();

  if (room.players.length < minPlayers) {
    socket.emit('error', {
      message: `Need at least ${minPlayers} players to start`,
    });
    return;
  }

  try {
    // 初始化遊戲
    const gameState = await gameInitializer.initialize(
      roomId,
      room.players,
      room.config
    );

    // 開始遊戲
    gameInitializer.startGame(gameState);

    // 儲存遊戲狀態
    games.set(roomId, gameState);

    // 通知所有玩家遊戲開始
    io.to(roomId).emit('gameStarted', {
      gameId: roomId,
      round: gameState.round,
      phase: gameState.currentPhase,
      turnOrder: gameState.turnOrder,
      currentPlayer: gameState.turnOrder[0],
    });

    // 發送各自的手牌
    for (const player of Object.values(gameState.players)) {
      io.to(player.id).emit('handUpdated', {
        hand: player.hand,
      });
    }

  } catch (error) {
    socket.emit('error', {
      message: 'Failed to start game',
      details: error.message,
    });
  }
}
```

### 4. 常數更新

```javascript
// shared/constants/evolution.js（更新片段）

/**
 * 遊戲階段（不變）
 */
export const GAME_PHASES = {
  EVOLUTION: 'evolution',
  FOOD_SUPPLY: 'food_supply',
  FEEDING: 'feeding',
  EXTINCTION: 'extinction',
};

/**
 * 遊戲狀態
 */
export const GAME_STATUS = {
  WAITING: 'waiting',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished',
  ABANDONED: 'abandoned',
};

/**
 * 預設玩家範圍（可被擴充包覆寫）
 */
export const DEFAULT_PLAYER_RANGE = {
  MIN: 2,
  MAX: 4,
};

/**
 * 可用擴充包列表
 */
export const AVAILABLE_EXPANSIONS = [
  {
    id: 'base',
    name: '基礎版',
    required: true,
    description: '84張卡牌、19種性狀',
  },
  // 未來擴充包會加在這裡
];
```

---

## 測試需求

```javascript
// tests/unit/evolution/gameInitializer.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameInitializer } from '@backend/logic/evolution/gameInitializer.js';
import { GameConfig } from '@backend/logic/evolution/gameConfig.js';

describe('GameConfig', () => {
  it('should create with defaults', () => {
    const config = new GameConfig();
    expect(config.expansions).toContain('base');
  });

  it('should validate successfully with base expansion', async () => {
    const config = new GameConfig({ expansions: ['base'] });
    // Mock loader
    vi.mock('@shared/expansions/loader.js', () => ({
      expansionLoader: {
        getStatus: vi.fn().mockReturnValue('loaded'),
        load: vi.fn(),
        getLoaded: vi.fn().mockReturnValue({
          manifest: { minPlayers: 2, maxPlayers: 4 },
        }),
      },
    }));

    const result = await config.validate();
    expect(result.valid).toBe(true);
  });

  it('should require base expansion', async () => {
    const config = new GameConfig({ expansions: [] });
    const result = await config.validate();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Base expansion is required');
  });
});

describe('GameInitializer', () => {
  let initializer;

  beforeEach(() => {
    initializer = new GameInitializer();
  });

  it('should initialize game with correct player count', async () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ];

    const gameState = await initializer.initialize('game-1', players);

    expect(gameState.id).toBe('game-1');
    expect(Object.keys(gameState.players)).toHaveLength(2);
    expect(gameState.status).toBe('ready');
  });

  it('should deal initial cards to all players', async () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ];

    const gameState = await initializer.initialize('game-1', players);

    for (const player of Object.values(gameState.players)) {
      expect(player.hand.length).toBeGreaterThan(0);
    }
  });

  it('should create shuffled deck', async () => {
    const players = [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }];

    const game1 = await initializer.initialize('game-1', players);
    const game2 = await initializer.initialize('game-2', players);

    // 兩次初始化的牌序應不同（機率上）
    const firstCards1 = game1.deck.slice(0, 5).map(c => c.instanceId);
    const firstCards2 = game2.deck.slice(0, 5).map(c => c.instanceId);
    expect(firstCards1).not.toEqual(firstCards2);
  });

  it('should start game and set correct phase', () => {
    const gameState = {
      status: 'ready',
      round: 0,
      currentPhase: null,
      turnOrder: ['p1', 'p2'],
      eventEmitter: { emit: vi.fn() },
    };

    initializer.startGame(gameState);

    expect(gameState.status).toBe('playing');
    expect(gameState.round).toBe(1);
    expect(gameState.currentPhase).toBe('evolution');
  });
});
```

---

## 驗收標準

1. [ ] `GameConfig` 正確處理配置選項
2. [ ] 配置驗證正常運作
3. [ ] `GameInitializer` 正確初始化遊戲狀態
4. [ ] 玩家數驗證正常
5. [ ] 牌庫正確建立並洗牌
6. [ ] 初始手牌正確發放
7. [ ] 回合順序正確設定
8. [ ] 事件系統正確初始化
9. [ ] 房間處理器整合正常
10. [ ] 所有單元測試通過

---

## 備註

- 遊戲初始化是核心流程，必須穩定可靠
- 配置系統為未來規則變體預留空間
- 擴充包組合的玩家數限制會自動計算
