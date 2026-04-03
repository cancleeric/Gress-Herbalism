/**
 * 演化論本地遊戲控制器
 *
 * 在本地（瀏覽器端）執行演化論遊戲邏輯，不依賴後端 Socket.io。
 * 用於單人 vs AI 模式。
 *
 * @module controllers/evolution/LocalEvolutionGameController
 */

// ==================== 常數 ====================

const PHASES = {
  WAITING: 'waiting',
  EVOLUTION: 'evolution',
  FOOD_SUPPLY: 'foodSupply',
  FEEDING: 'feeding',
  EXTINCTION: 'extinction',
  GAME_END: 'gameEnd'
};

/** 勝利分數（牌庫耗盡後的最後一局結束時計算） */
const INITIAL_HAND_SIZE = 3;
/** 每回合發牌基礎張數（發牌 = 存活生物數 + 此值，至少 INITIAL_HAND_SIZE 張） */
const CARDS_PER_ROUND_BASE = 3;

// 卡牌性狀類型（對應後端 TRAIT_TYPES）
const TRAIT_TYPES = {
  CARNIVORE: 'carnivore',
  CAMOUFLAGE: 'camouflage',
  BURROWING: 'burrowing',
  POISONOUS: 'poisonous',
  AQUATIC: 'aquatic',
  AGILE: 'agile',
  GIANT: 'giant',
  TAIL_LOSS: 'tailLoss',
  MIMICRY: 'mimicry',
  FAT_TISSUE: 'fatTissue',
  HIBERNATION: 'hibernation',
  PARASITE: 'parasite',
  ROBBERY: 'robbery',
  COMMUNICATION: 'communication',
  COOPERATION: 'cooperation',
  SYMBIOSIS: 'symbiosis',
  TRAMPLING: 'trampling',
  SHARP_VISION: 'sharpVision',
  FORAGING: 'foraging'
};

// ==================== 牌組 ====================

/**
 * 建立 84 張雙面卡牌庫
 * 每張卡牌可以作為生物或作為性狀使用
 * 共 19 種性狀，每種性狀 3-6 張不等，總計 84 張
 *
 * @returns {Array} 牌組陣列
 */
function createDeck() {
  const traitCounts = {
    [TRAIT_TYPES.CARNIVORE]: 5,
    [TRAIT_TYPES.CAMOUFLAGE]: 5,
    [TRAIT_TYPES.BURROWING]: 4,
    [TRAIT_TYPES.POISONOUS]: 4,
    [TRAIT_TYPES.AQUATIC]: 4,
    [TRAIT_TYPES.AGILE]: 4,
    [TRAIT_TYPES.GIANT]: 4,
    [TRAIT_TYPES.TAIL_LOSS]: 3,
    [TRAIT_TYPES.MIMICRY]: 3,
    [TRAIT_TYPES.FAT_TISSUE]: 6,
    [TRAIT_TYPES.HIBERNATION]: 3,
    [TRAIT_TYPES.PARASITE]: 4,
    [TRAIT_TYPES.ROBBERY]: 4,
    [TRAIT_TYPES.COMMUNICATION]: 4,
    [TRAIT_TYPES.COOPERATION]: 4,
    [TRAIT_TYPES.SYMBIOSIS]: 4,
    [TRAIT_TYPES.TRAMPLING]: 3,
    [TRAIT_TYPES.SHARP_VISION]: 4,
    [TRAIT_TYPES.FORAGING]: 4
  };

  const deck = [];
  let cardIdCounter = 1;

  for (const [traitType, count] of Object.entries(traitCounts)) {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${String(cardIdCounter).padStart(3, '0')}`,
        traitType
      });
      cardIdCounter++;
    }
  }

  return deck;
}

/**
 * 洗牌（Fisher-Yates）
 *
 * @param {Array} deck - 牌組
 * @returns {Array} 已洗牌的陣列
 */
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ==================== 生物邏輯 ====================

let creatureIdCounter = 0;

/**
 * 建立新生物
 *
 * @param {string} ownerId - 擁有者玩家 ID
 * @returns {Object} 生物物件
 */
function createCreature(ownerId) {
  creatureIdCounter++;
  return {
    id: `creature_${ownerId}_${creatureIdCounter}`,
    ownerId,
    traits: [],
    bodySize: 1,
    population: 1,
    food: 0,    // 當前已吃食物
    hasFed: false,
    fatStorage: 0
  };
}

/**
 * 計算生物需要的食物量
 *
 * @param {Object} creature - 生物物件
 * @returns {number} 需要的食物量
 */
function getRequiredFood(creature) {
  return creature.population;
}

/**
 * 檢查生物是否擁有某性狀
 *
 * @param {Object} creature - 生物物件
 * @param {string} traitType - 性狀類型
 * @returns {boolean}
 */
function hasTrait(creature, traitType) {
  return (creature.traits || []).some(t => t.traitType === traitType);
}

/**
 * 嘗試在生物上新增性狀（驗證合法性）
 *
 * @param {Object} creature - 生物物件
 * @param {Object} card - 卡牌物件
 * @returns {{ success: boolean, creature: Object, error?: string }}
 */
function addTraitToCreature(creature, card) {
  // 不可重複新增相同性狀（可堆疊性狀除外）
  const stackable = [TRAIT_TYPES.FAT_TISSUE];
  if (!stackable.includes(card.traitType) && hasTrait(creature, card.traitType)) {
    return { success: false, creature, error: '生物已有此性狀' };
  }

  const updatedCreature = {
    ...creature,
    traits: [...creature.traits, { traitType: card.traitType, cardId: card.id }]
  };

  return { success: true, creature: updatedCreature };
}

// ==================== 進食邏輯 ====================

/**
 * 檢查肉食生物是否可以攻擊目標
 *
 * @param {Object} attacker - 攻擊生物
 * @param {Object} defender - 防守生物
 * @param {Object} gameState - 遊戲狀態
 * @returns {boolean}
 */
function canAttack(attacker, defender, gameState) {
  if (!hasTrait(attacker, TRAIT_TYPES.CARNIVORE)) return false;
  if (attacker.hasFed) return false;

  // 偽裝：只有銳目可以看穿
  if (hasTrait(defender, TRAIT_TYPES.CAMOUFLAGE) && !hasTrait(attacker, TRAIT_TYPES.SHARP_VISION)) {
    return false;
  }

  // 穴居：食物池不空時無法被攻擊
  if (hasTrait(defender, TRAIT_TYPES.BURROWING) && gameState.foodPool > 0) {
    return false;
  }

  // 水生：非水生肉食無法攻擊水生生物
  if (hasTrait(defender, TRAIT_TYPES.AQUATIC) && !hasTrait(attacker, TRAIT_TYPES.AQUATIC)) {
    return false;
  }

  return true;
}

/**
 * 執行攻擊並回傳結果
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} attackerPlayerId - 攻擊者玩家 ID
 * @param {string} attackerCreatureId - 攻擊生物 ID
 * @param {string} defenderPlayerId - 被攻擊玩家 ID
 * @param {string} defenderCreatureId - 被攻擊生物 ID
 * @returns {{ success: boolean, newState: Object, killed: boolean, error?: string }}
 */
function performAttack(gameState, attackerPlayerId, attackerCreatureId, defenderPlayerId, defenderCreatureId) {
  const attackerPlayer = gameState.players[attackerPlayerId];
  const defenderPlayer = gameState.players[defenderPlayerId];

  if (!attackerPlayer || !defenderPlayer) {
    return { success: false, newState: gameState, killed: false, error: '玩家不存在' };
  }

  const attackerCreature = attackerPlayer.creatures.find(c => c.id === attackerCreatureId);
  const defenderCreature = defenderPlayer.creatures.find(c => c.id === defenderCreatureId);

  if (!attackerCreature || !defenderCreature) {
    return { success: false, newState: gameState, killed: false, error: '生物不存在' };
  }

  if (!canAttack(attackerCreature, defenderCreature, gameState)) {
    return { success: false, newState: gameState, killed: false, error: '無法攻擊此目標' };
  }

  // 斷尾：被攻擊的生物可以選擇放棄一個性狀來存活（AI 自動棄掉最後一個非保護性性狀）
  // 在簡化版本中，被攻擊生物死亡
  let killed = true;
  let updatedDefenderCreatures = defenderPlayer.creatures.filter(c => c.id !== defenderCreatureId);

  // 毒液：攻擊者下一回合開始時消亡。
  // 簡化實作：立即標記 poisoned，在滅絕階段結算時移除。
  let attackerDiesFromPoison = hasTrait(defenderCreature, TRAIT_TYPES.POISONOUS);

  // 攻擊者獲得食物（等於被殺生物的 population）
  let updatedAttackerCreature = {
    ...attackerCreature,
    food: attackerCreature.food + defenderCreature.population,
    hasFed: true
  };

  if (attackerDiesFromPoison) {
    // 毒液效果：攻擊者也被標記死亡（在下一次滅絕結算時移除）
    updatedAttackerCreature = { ...updatedAttackerCreature, poisoned: true };
  }

  const updatedAttackerCreatures = attackerPlayer.creatures.map(c =>
    c.id === attackerCreatureId ? updatedAttackerCreature : c
  );

  const newState = {
    ...gameState,
    players: {
      ...gameState.players,
      [attackerPlayerId]: {
        ...attackerPlayer,
        creatures: updatedAttackerCreatures
      },
      [defenderPlayerId]: {
        ...defenderPlayer,
        creatures: updatedDefenderCreatures
      }
    }
  };

  return { success: true, newState, killed, defenderCreature };
}

// ==================== 本地遊戲控制器 ====================

/**
 * 演化論本地遊戲控制器
 */
class LocalEvolutionGameController {
  /**
   * @param {Object} options
   * @param {Array} options.players - 玩家陣列（含 AI 玩家實例）[{ id, name, isAI }]
   * @param {Function} options.onStateChange - 狀態變更回調 (gameState) => void
   * @param {Function} options.onEvent - 事件回調 (event) => void
   */
  constructor({ players, onStateChange, onEvent }) {
    this.playerDefs = players; // 原始玩家定義
    this.onStateChange = onStateChange;
    this.onEvent = onEvent;

    creatureIdCounter = 0;

    this.gameState = this._buildInitialState(players);
    this.deck = [];
    this.deckEmpty = false; // 牌庫是否已耗盡（觸發最後一局）
    this.lastRound = false;  // 是否進入最後一局
  }

  // ==================== 初始化 ====================

  _buildInitialState(players) {
    const playerOrder = players.map(p => p.id);
    const playersMap = {};
    for (const p of players) {
      playersMap[p.id] = {
        id: p.id,
        name: p.name,
        isAI: !!p.isAI,
        score: 0,
        hand: [],
        creatures: [],
        hasPassedEvolution: false,
        hasPassedFeeding: false
      };
    }

    return {
      gameId: `local-evo-${Date.now()}`,
      phase: PHASES.WAITING,
      round: 0,
      players: playersMap,
      playerOrder,
      currentPlayerId: playerOrder[0],
      startPlayerIndex: 0,
      foodPool: 0,
      diceResult: [],
      deckCount: 84
    };
  }

  /**
   * 開始遊戲
   */
  startGame() {
    console.log('[LocalEvoCtrl] 開始遊戲');
    this.deck = shuffleDeck(createDeck());
    this.gameState = {
      ...this.gameState,
      deckCount: this.deck.length,
      round: 0
    };
    this._startNextRound();
  }

  // ==================== 回合管理 ====================

  /**
   * 開始下一回合
   */
  _startNextRound() {
    this.gameState = {
      ...this.gameState,
      round: this.gameState.round + 1
    };

    console.log(`[LocalEvoCtrl] 開始第 ${this.gameState.round} 回合`);

    // 如果上一回合牌庫就已耗盡，這是最後一局
    if (this.deckEmpty) {
      this.lastRound = true;
    }

    // 發牌給所有玩家
    this._dealCards();

    // 重置玩家狀態
    const updatedPlayers = {};
    for (const [pid, player] of Object.entries(this.gameState.players)) {
      updatedPlayers[pid] = {
        ...player,
        hasPassedEvolution: false,
        hasPassedFeeding: false,
        creatures: player.creatures.map(c => ({
          ...c,
          hasFed: false,
          food: 0,
          poisoned: false
        }))
      };
    }

    // 輪換起始玩家
    const startIndex = (this.gameState.startPlayerIndex || 0) % this.gameState.playerOrder.length;

    this.gameState = {
      ...this.gameState,
      players: updatedPlayers,
      phase: PHASES.EVOLUTION,
      currentPlayerId: this.gameState.playerOrder[startIndex],
      startPlayerIndex: (startIndex + 1) % this.gameState.playerOrder.length,
      foodPool: 0,
      diceResult: []
    };

    this._emit({ type: 'roundStarted', round: this.gameState.round });
    this._notifyStateChange();
  }

  /**
   * 發牌給所有玩家
   * 每位玩家：存活生物數 + CARDS_PER_ROUND_FORMULA（至少 INITIAL_HAND_SIZE）
   */
  _dealCards() {
    const updatedPlayers = { ...this.gameState.players };

    for (const [pid, player] of Object.entries(updatedPlayers)) {
      const creatureCount = player.creatures.length;
      const cardsToDraw = Math.max(INITIAL_HAND_SIZE, creatureCount + CARDS_PER_ROUND_BASE);

      if (this.deck.length === 0) {
        this.deckEmpty = true;
        break;
      }

      const drawn = this.deck.splice(0, Math.min(cardsToDraw, this.deck.length));
      if (this.deck.length === 0) {
        this.deckEmpty = true;
      }

      updatedPlayers[pid] = {
        ...player,
        hand: [...player.hand, ...drawn]
      };
    }

    this.gameState = {
      ...this.gameState,
      players: updatedPlayers,
      deckCount: this.deck.length
    };
  }

  // ==================== 動作處理 ====================

  /**
   * 主要動作處理入口
   *
   * @param {Object} action - 動作物件
   * @param {string} playerId - 執行玩家 ID
   */
  async handleAction(action, playerId) {
    const phase = this.gameState.phase;
    console.log(`[LocalEvoCtrl] 玩家 ${playerId} 執行: ${action.type} (phase: ${phase})`);

    if (phase === PHASES.EVOLUTION) {
      await this._handleEvolutionAction(action, playerId);
    } else if (phase === PHASES.FEEDING) {
      await this._handleFeedingAction(action, playerId);
    } else {
      console.warn('[LocalEvoCtrl] 無法在當前階段執行動作:', phase);
    }
  }

  // ==================== 演化階段 ====================

  async _handleEvolutionAction(action, playerId) {
    const player = this.gameState.players[playerId];
    if (!player) return;

    switch (action.type) {
      case 'createCreature': {
        const card = player.hand.find(c => c.id === action.cardId);
        if (!card) {
          console.warn('[LocalEvoCtrl] 找不到卡牌:', action.cardId);
          return;
        }

        const newCreature = createCreature(playerId);
        const updatedPlayer = {
          ...player,
          hand: player.hand.filter(c => c.id !== action.cardId),
          creatures: [...player.creatures, newCreature]
        };

        this.gameState = {
          ...this.gameState,
          players: {
            ...this.gameState.players,
            [playerId]: updatedPlayer
          }
        };

        this._emit({
          type: 'creatureCreated',
          playerId,
          creature: newCreature,
          cardId: action.cardId
        });

        this._notifyStateChange();
        this._advanceEvolutionTurn();
        break;
      }

      case 'addTrait': {
        const card = player.hand.find(c => c.id === action.cardId);
        const creature = player.creatures.find(c => c.id === action.creatureId);
        if (!card || !creature) {
          console.warn('[LocalEvoCtrl] 找不到卡牌或生物');
          return;
        }

        const result = addTraitToCreature(creature, card);
        if (!result.success) {
          console.warn('[LocalEvoCtrl] 無法新增性狀:', result.error);
          return;
        }

        const updatedPlayer = {
          ...player,
          hand: player.hand.filter(c => c.id !== action.cardId),
          creatures: player.creatures.map(c => c.id === action.creatureId ? result.creature : c)
        };

        this.gameState = {
          ...this.gameState,
          players: {
            ...this.gameState.players,
            [playerId]: updatedPlayer
          }
        };

        this._emit({
          type: 'traitAdded',
          playerId,
          creatureId: action.creatureId,
          traitType: card.traitType,
          cardId: action.cardId
        });

        this._notifyStateChange();
        this._advanceEvolutionTurn();
        break;
      }

      case 'pass': {
        const updatedPlayer = {
          ...player,
          hasPassedEvolution: true
        };

        this.gameState = {
          ...this.gameState,
          players: {
            ...this.gameState.players,
            [playerId]: updatedPlayer
          }
        };

        this._emit({ type: 'playerPassedEvolution', playerId });
        this._notifyStateChange();
        this._checkEvolutionEnd();
        break;
      }

      default:
        console.warn('[LocalEvoCtrl] 未知演化動作:', action.type);
    }
  }

  /**
   * 前進到下一個演化回合玩家
   */
  _advanceEvolutionTurn() {
    const nextPlayerId = this._getNextActivePlayer(this.gameState.currentPlayerId, false);
    if (nextPlayerId) {
      this.gameState = { ...this.gameState, currentPlayerId: nextPlayerId };
    }
    this._checkEvolutionEnd();
  }

  /**
   * 檢查演化階段是否結束（所有玩家都 pass）
   */
  _checkEvolutionEnd() {
    const allPassed = this.gameState.playerOrder.every(
      pid => this.gameState.players[pid]?.hasPassedEvolution
    );

    if (allPassed) {
      console.log('[LocalEvoCtrl] 演化階段結束，進入食物供給');
      this._startFoodSupplyPhase();
    }
  }

  // ==================== 食物供給階段 ====================

  _startFoodSupplyPhase() {
    const playerCount = this.gameState.playerOrder.length;

    // 骰子模擬：2~6 點，食物 = playerCount + 骰子結果
    const diceRoll = Math.floor(Math.random() * 5) + 2;
    const foodPool = playerCount + diceRoll;

    this.gameState = {
      ...this.gameState,
      phase: PHASES.FOOD_SUPPLY,
      foodPool,
      diceResult: [diceRoll]
    };

    this._emit({ type: 'foodSupplySet', foodPool, diceResult: [diceRoll] });
    this._notifyStateChange();

    // 食物供給階段不需要玩家操作，立即進入進食階段
    setTimeout(() => this._startFeedingPhase(), 500);
  }

  // ==================== 進食階段 ====================

  _startFeedingPhase() {
    const startIndex = this.gameState.startPlayerIndex || 0;
    const startPlayerId = this.gameState.playerOrder[startIndex % this.gameState.playerOrder.length];

    // 重置所有玩家的 hasPassedFeeding
    const updatedPlayers = {};
    for (const [pid, player] of Object.entries(this.gameState.players)) {
      updatedPlayers[pid] = { ...player, hasPassedFeeding: false };
    }

    this.gameState = {
      ...this.gameState,
      phase: PHASES.FEEDING,
      players: updatedPlayers,
      currentPlayerId: startPlayerId
    };

    this._emit({ type: 'feedingStarted' });
    this._notifyStateChange();
  }

  async _handleFeedingAction(action, playerId) {
    const player = this.gameState.players[playerId];
    if (!player) return;

    switch (action.type) {
      case 'feed': {
        const creature = player.creatures.find(c => c.id === action.creatureId);
        if (!creature) {
          console.warn('[LocalEvoCtrl] 找不到生物:', action.creatureId);
          return;
        }
        if (creature.hasFed) {
          console.warn('[LocalEvoCtrl] 生物已進食');
          return;
        }
        if (this.gameState.foodPool <= 0) {
          console.warn('[LocalEvoCtrl] 食物池已空');
          return;
        }

        const updatedCreature = {
          ...creature,
          food: creature.food + 1,
          hasFed: creature.food + 1 >= getRequiredFood(creature)
        };

        const updatedPlayer = {
          ...player,
          creatures: player.creatures.map(c => c.id === action.creatureId ? updatedCreature : c)
        };

        this.gameState = {
          ...this.gameState,
          foodPool: this.gameState.foodPool - 1,
          players: { ...this.gameState.players, [playerId]: updatedPlayer }
        };

        this._emit({ type: 'creatureFed', playerId, creatureId: action.creatureId, food: 1 });
        this._notifyStateChange();
        this._advanceFeedingTurn();
        break;
      }

      case 'attack': {
        const { attackerCreatureId, targetCreatureId, targetPlayerId } = action;
        const result = performAttack(
          this.gameState,
          playerId,
          attackerCreatureId,
          targetPlayerId,
          targetCreatureId
        );

        if (!result.success) {
          console.warn('[LocalEvoCtrl] 攻擊失敗:', result.error);
          return;
        }

        this.gameState = result.newState;

        this._emit({
          type: 'attackResolved',
          attackerPlayerId: playerId,
          attackerCreatureId,
          targetPlayerId,
          targetCreatureId,
          killed: result.killed,
          defenderTraits: result.defenderCreature?.traits || []
        });

        this._notifyStateChange();
        this._advanceFeedingTurn();
        break;
      }

      case 'pass': {
        const updatedPlayer = { ...player, hasPassedFeeding: true };
        this.gameState = {
          ...this.gameState,
          players: { ...this.gameState.players, [playerId]: updatedPlayer }
        };

        this._emit({ type: 'playerPassedFeeding', playerId });
        this._notifyStateChange();
        this._checkFeedingEnd();
        break;
      }

      default:
        console.warn('[LocalEvoCtrl] 未知進食動作:', action.type);
    }
  }

  /**
   * 前進到下一個進食回合玩家
   */
  _advanceFeedingTurn() {
    const nextPlayerId = this._getNextActivePlayer(this.gameState.currentPlayerId, true);
    if (nextPlayerId) {
      this.gameState = { ...this.gameState, currentPlayerId: nextPlayerId };
    }
    this._checkFeedingEnd();
  }

  /**
   * 檢查進食階段是否結束
   */
  _checkFeedingEnd() {
    const allPassed = this.gameState.playerOrder.every(
      pid => this.gameState.players[pid]?.hasPassedFeeding
    );
    const foodEmpty = this.gameState.foodPool <= 0;

    // 所有生物都已進食完，或食物耗盡且所有玩家都 pass
    const allCreaturesFed = this.gameState.playerOrder.every(pid => {
      const player = this.gameState.players[pid];
      return (player?.creatures || []).every(c => c.hasFed || hasTrait(c, TRAIT_TYPES.HIBERNATION));
    });

    if (allPassed || (foodEmpty && allCreaturesFed)) {
      console.log('[LocalEvoCtrl] 進食階段結束，進入滅絕階段');
      this._startExtinctionPhase();
    }
  }

  // ==================== 滅絕階段 ====================

  _startExtinctionPhase() {
    this.gameState = { ...this.gameState, phase: PHASES.EXTINCTION };
    this._notifyStateChange();

    // 移除未進食的生物
    const updatedPlayers = {};
    const extinctionReport = {};

    for (const [pid, player] of Object.entries(this.gameState.players)) {
      const surviving = player.creatures.filter(c =>
        c.hasFed || hasTrait(c, TRAIT_TYPES.HIBERNATION) || c.fatStorage > 0
      );
      const extinct = player.creatures.filter(c =>
        !surviving.includes(c)
      );

      // 毒液死亡（在攻擊時標記的 poisoned）
      const survivingClean = surviving.filter(c => !c.poisoned);
      const poisonedCreatures = surviving.filter(c => c.poisoned);

      extinctionReport[pid] = {
        extinct: [...extinct, ...poisonedCreatures],
        surviving: survivingClean
      };

      // 棄掉剩餘手牌（演化論規則：每局結束後棄掉未用的牌）
      updatedPlayers[pid] = {
        ...player,
        creatures: survivingClean,
        hand: []
      };
    }

    this.gameState = {
      ...this.gameState,
      players: updatedPlayers
    };

    this._emit({ type: 'extinctionProcessed', extinctionReport });
    this._notifyStateChange();

    // 計算得分並決定是否繼續遊戲
    setTimeout(() => this._resolveExtinction(), 300);
  }

  _resolveExtinction() {
    // 如果是最後一局，結束遊戲
    if (this.lastRound) {
      this._endGame();
      return;
    }

    // 開始下一回合
    this._startNextRound();
  }

  // ==================== 遊戲結束 ====================

  _endGame() {
    console.log('[LocalEvoCtrl] 遊戲結束，計算最終得分');

    // 計算得分
    const scores = {};
    for (const [pid, player] of Object.entries(this.gameState.players)) {
      let score = 0;
      for (const creature of player.creatures) {
        score += 2; // 每隻生物 +2 分
        score += creature.traits.length; // 每個性狀 +1 分
        score += creature.food; // 吃的食物加成
      }
      scores[pid] = score;
    }

    // 找出贏家
    let maxScore = -1;
    let winnerId = null;
    for (const [pid, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winnerId = pid;
      }
    }

    this.gameState = {
      ...this.gameState,
      phase: PHASES.GAME_END,
      scores,
      winnerId
    };

    this._emit({ type: 'gameEnd', scores, winnerId });
    this._notifyStateChange();
  }

  // ==================== 輔助方法 ====================

  /**
   * 取得下一個有動作能力的玩家 ID
   *
   * @param {string} currentPlayerId - 當前玩家 ID
   * @param {boolean} feedingPhase - 是否在進食階段
   * @returns {string|null} 下一玩家 ID
   */
  _getNextActivePlayer(currentPlayerId, feedingPhase) {
    const order = this.gameState.playerOrder;
    const currentIndex = order.indexOf(currentPlayerId);
    const total = order.length;

    for (let i = 1; i <= total; i++) {
      const nextId = order[(currentIndex + i) % total];
      const nextPlayer = this.gameState.players[nextId];
      if (!nextPlayer) continue;

      if (feedingPhase) {
        if (!nextPlayer.hasPassedFeeding) return nextId;
      } else {
        if (!nextPlayer.hasPassedEvolution) return nextId;
      }
    }

    return null;
  }

  /**
   * 廣播事件給訂閱者（主要是 AI）
   *
   * @param {Object} event - 事件物件
   */
  _emit(event) {
    if (this.onEvent) {
      this.onEvent(event);
    }
  }

  /**
   * 通知狀態變更
   */
  _notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.gameState });
    }
  }

  /**
   * 取得當前遊戲狀態
   *
   * @returns {Object} 遊戲狀態快照
   */
  getState() {
    return { ...this.gameState };
  }

  /**
   * 取得當前玩家
   *
   * @returns {Object|null}
   */
  getCurrentPlayer() {
    return this.gameState.players[this.gameState.currentPlayerId] || null;
  }
}

export default LocalEvolutionGameController;
