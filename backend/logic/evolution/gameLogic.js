/**
 * 演化論遊戲 - 主邏輯模組
 *
 * 此模組負責遊戲主要流程控制，包括：
 * - 遊戲初始化
 * - 動作處理
 * - 狀態管理
 *
 * @module logic/evolution/gameLogic
 */

const {
  GAME_PHASES,
  ACTION_TYPES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  INITIAL_HAND_SIZE
} = require('../../../shared/constants/evolution');

const {
  createDeck,
  shuffleDeck,
  drawCards
} = require('./cardLogic');

const {
  createCreature,
  addTrait
} = require('./creatureLogic');

const {
  feedCreature,
  attackCreature,
  resolveAttack,
  useRobbery,
  useTrampling,
  useHibernation
} = require('./feedingLogic');

const {
  startEvolutionPhase,
  handleEvolutionPass,
  nextEvolutionPlayer,
  startFoodPhase,
  startFeedingPhase,
  handleFeedingPass,
  nextFeedingPlayer,
  startExtinctionPhase,
  advancePhase,
  calculateScores,
  determineWinner,
  checkGameEnd
} = require('./phaseLogic');

// ==================== 遊戲初始化 ====================

/**
 * 初始化遊戲
 *
 * @param {Object[]} players - 玩家列表 [{ id, name }]
 * @returns {{ success: boolean, gameState: Object, error: string }}
 */
function initGame(players) {
  // 驗證玩家數量
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    return {
      success: false,
      gameState: null,
      error: `玩家數量必須在 ${MIN_PLAYERS} 到 ${MAX_PLAYERS} 之間`
    };
  }

  // 建立並洗牌
  const deck = shuffleDeck(createDeck());

  // 初始化玩家狀態
  const playersState = {};
  let currentDeck = deck;

  for (const player of players) {
    const result = drawCards(currentDeck, INITIAL_HAND_SIZE);
    currentDeck = result.remainingDeck;

    playersState[player.id] = {
      id: player.id,
      name: player.name,
      hand: result.cards,
      creatures: [],
      hasPassedEvolution: false,
      hasPassedFeeding: false
    };
  }

  // 隨機決定起始玩家
  const startPlayerIndex = Math.floor(Math.random() * players.length);

  const gameState = {
    phase: GAME_PHASES.WAITING,
    round: 0,
    players: playersState,
    playerOrder: players.map(p => p.id),
    deck: currentDeck,
    discardPile: [],
    foodPool: 0,
    diceResult: [],
    currentPlayerIndex: startPlayerIndex,
    currentPlayerId: players[startPlayerIndex].id,
    startPlayerIndex: startPlayerIndex,
    isLastRound: false,
    pendingResponse: null
  };

  return {
    success: true,
    gameState,
    error: ''
  };
}

/**
 * 開始遊戲
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} 更新後的遊戲狀態
 */
function startGame(gameState) {
  if (gameState.phase !== GAME_PHASES.WAITING) {
    return gameState;
  }

  return {
    ...startEvolutionPhase(gameState),
    round: 1
  };
}

// ==================== 動作驗證 ====================

/**
 * 驗證動作合法性
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 玩家 ID
 * @param {Object} action - { type, payload }
 * @returns {{ valid: boolean, reason: string }}
 */
function validateAction(gameState, playerId, action) {
  // 檢查遊戲是否已結束
  if (gameState.phase === GAME_PHASES.GAME_END) {
    return { valid: false, reason: '遊戲已結束' };
  }

  // 檢查是否輪到該玩家
  if (gameState.pendingResponse) {
    // 有待處理的回應，檢查是否為回應者
    if (gameState.pendingResponse.responderId !== playerId) {
      return { valid: false, reason: '等待其他玩家回應' };
    }
  } else if (gameState.currentPlayerId !== playerId) {
    return { valid: false, reason: '還沒輪到你' };
  }

  // 根據階段驗證動作
  switch (gameState.phase) {
    case GAME_PHASES.EVOLUTION:
      return validateEvolutionAction(gameState, playerId, action);

    case GAME_PHASES.FEEDING:
      return validateFeedingAction(gameState, playerId, action);

    default:
      return { valid: false, reason: '當前階段不能執行此動作' };
  }
}

/**
 * 驗證演化階段動作
 */
function validateEvolutionAction(gameState, playerId, action) {
  const player = gameState.players[playerId];

  switch (action.type) {
    case ACTION_TYPES.PLAY_CARD_AS_CREATURE:
      // 檢查卡牌是否在手牌中
      if (!player.hand.find(c => c.id === action.payload.cardId)) {
        return { valid: false, reason: '卡牌不在手牌中' };
      }
      return { valid: true, reason: '' };

    case ACTION_TYPES.PLAY_CARD_AS_TRAIT:
      // 檢查卡牌是否在手牌中
      if (!player.hand.find(c => c.id === action.payload.cardId)) {
        return { valid: false, reason: '卡牌不在手牌中' };
      }
      // 檢查目標生物是否存在
      const targetCreature = findCreatureById(gameState, action.payload.creatureId);
      if (!targetCreature) {
        return { valid: false, reason: '目標生物不存在' };
      }
      return { valid: true, reason: '' };

    case ACTION_TYPES.PASS:
      return { valid: true, reason: '' };

    default:
      return { valid: false, reason: '演化階段不能執行此動作' };
  }
}

/**
 * 驗證進食階段動作
 */
function validateFeedingAction(gameState, playerId, action) {
  switch (action.type) {
    case ACTION_TYPES.FEED:
      return { valid: true, reason: '' };

    case ACTION_TYPES.ATTACK:
      return { valid: true, reason: '' };

    case ACTION_TYPES.USE_ABILITY:
      return { valid: true, reason: '' };

    case ACTION_TYPES.HIBERNATE:
      return { valid: true, reason: '' };

    case ACTION_TYPES.PASS:
      return { valid: true, reason: '' };

    case ACTION_TYPES.DEFENSE_RESPONSE:
      if (!gameState.pendingResponse) {
        return { valid: false, reason: '沒有待處理的防禦' };
      }
      return { valid: true, reason: '' };

    default:
      return { valid: false, reason: '進食階段不能執行此動作' };
  }
}

// ==================== 動作處理 ====================

/**
 * 處理玩家動作
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 玩家 ID
 * @param {Object} action - { type, payload }
 * @returns {{ success: boolean, gameState: Object, events: Object[], error: string }}
 */
function processAction(gameState, playerId, action) {
  // 驗證動作
  const validation = validateAction(gameState, playerId, action);
  if (!validation.valid) {
    return {
      success: false,
      gameState,
      events: [],
      error: validation.reason
    };
  }

  // 根據動作類型處理
  switch (action.type) {
    case ACTION_TYPES.PLAY_CARD_AS_CREATURE:
      return handlePlayCardAsCreature(gameState, playerId, action.payload);

    case ACTION_TYPES.PLAY_CARD_AS_TRAIT:
      return handlePlayCardAsTrait(gameState, playerId, action.payload);

    case ACTION_TYPES.FEED:
      return handleFeed(gameState, playerId, action.payload);

    case ACTION_TYPES.ATTACK:
      return handleAttack(gameState, playerId, action.payload);

    case ACTION_TYPES.USE_ABILITY:
      return handleUseAbility(gameState, playerId, action.payload);

    case ACTION_TYPES.HIBERNATE:
      return handleHibernate(gameState, playerId, action.payload);

    case ACTION_TYPES.PASS:
      return handlePass(gameState, playerId);

    case ACTION_TYPES.DEFENSE_RESPONSE:
      return handleDefenseResponse(gameState, playerId, action.payload);

    default:
      return {
        success: false,
        gameState,
        events: [],
        error: '未知的動作類型'
      };
  }
}

/**
 * 處理出牌為生物
 */
function handlePlayCardAsCreature(gameState, playerId, payload) {
  const { cardId } = payload;
  const player = gameState.players[playerId];

  // 移除手牌
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  const card = player.hand[cardIndex];
  const newHand = [...player.hand.slice(0, cardIndex), ...player.hand.slice(cardIndex + 1)];

  // 創建生物
  const creature = createCreature(playerId, cardId);

  // 更新遊戲狀態
  let newGameState = {
    ...gameState,
    players: {
      ...gameState.players,
      [playerId]: {
        ...player,
        hand: newHand,
        creatures: [...player.creatures, creature]
      }
    }
  };

  // 移動到下一個玩家
  newGameState = nextEvolutionPlayer(newGameState);

  return {
    success: true,
    gameState: newGameState,
    events: [{
      type: 'creatureCreated',
      playerId,
      creatureId: creature.id,
      cardId
    }],
    error: ''
  };
}

/**
 * 處理出牌為性狀
 */
function handlePlayCardAsTrait(gameState, playerId, payload) {
  const { cardId, creatureId, linkedCreatureId } = payload;
  const player = gameState.players[playerId];

  // 找到卡牌
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  const card = player.hand[cardIndex];
  const newHand = [...player.hand.slice(0, cardIndex), ...player.hand.slice(cardIndex + 1)];

  // 找到生物
  const creature = findCreatureById(gameState, creatureId);
  const linkedCreature = linkedCreatureId ? findCreatureById(gameState, linkedCreatureId) : null;

  // 添加性狀
  const result = addTrait(creature, card.traitType, cardId, playerId, linkedCreature);

  if (!result.success) {
    return {
      success: false,
      gameState,
      events: [],
      error: result.reason
    };
  }

  // 更新遊戲狀態
  let newGameState = updateCreatureInGameState(gameState, result.creature);
  if (result.linkedCreature) {
    newGameState = updateCreatureInGameState(newGameState, result.linkedCreature);
  }

  // 更新手牌
  newGameState = {
    ...newGameState,
    players: {
      ...newGameState.players,
      [playerId]: {
        ...newGameState.players[playerId],
        hand: newHand
      }
    }
  };

  // 移動到下一個玩家
  newGameState = nextEvolutionPlayer(newGameState);

  return {
    success: true,
    gameState: newGameState,
    events: [{
      type: 'traitAdded',
      playerId,
      creatureId,
      traitType: card.traitType,
      linkedCreatureId
    }],
    error: ''
  };
}

/**
 * 處理進食
 */
function handleFeed(gameState, playerId, payload) {
  const { creatureId } = payload;

  const result = feedCreature(gameState, creatureId, 'red');

  if (!result.success) {
    return {
      success: false,
      gameState,
      events: [],
      error: result.reason || '進食失敗'
    };
  }

  let newGameState = nextFeedingPlayer(result.gameState);

  return {
    success: true,
    gameState: newGameState,
    events: [{
      type: 'creatureFed',
      playerId,
      creatureId,
      chainEffects: result.chainEffects
    }],
    error: ''
  };
}

/**
 * 處理攻擊
 */
function handleAttack(gameState, playerId, payload) {
  const { attackerId, defenderId } = payload;

  const result = attackCreature(gameState, attackerId, defenderId);

  if (!result.success) {
    return {
      success: false,
      gameState,
      events: [],
      error: result.reason || '攻擊失敗'
    };
  }

  // 如果有待處理的防禦回應
  if (result.pendingResponse) {
    const defender = findCreatureById(gameState, defenderId);
    return {
      success: true,
      gameState: {
        ...gameState,
        pendingResponse: {
          ...result.pendingResponse,
          responderId: defender.ownerId
        }
      },
      events: [{
        type: 'attackInitiated',
        attackerId,
        defenderId,
        defenseOptions: result.pendingResponse.options
      }],
      error: ''
    };
  }

  // 攻擊直接成功
  let newGameState = nextFeedingPlayer(result.gameState);

  return {
    success: true,
    gameState: newGameState,
    events: [{
      type: 'attackResolved',
      attackerId,
      defenderId,
      attackerFood: result.attackerFood,
      defenderDead: result.defenderDead,
      chainEffects: result.chainEffects
    }],
    error: ''
  };
}

/**
 * 處理使用能力
 */
function handleUseAbility(gameState, playerId, payload) {
  const { abilityType, creatureId, targetId } = payload;

  let result;

  switch (abilityType) {
    case 'robbery':
      result = useRobbery(gameState, creatureId, targetId);
      break;
    case 'trampling':
      result = useTrampling(gameState, creatureId);
      break;
    default:
      return {
        success: false,
        gameState,
        events: [],
        error: '未知的能力類型'
      };
  }

  if (!result.success) {
    return {
      success: false,
      gameState,
      events: [],
      error: result.reason || '使用能力失敗'
    };
  }

  return {
    success: true,
    gameState: result.gameState,
    events: [{
      type: 'abilityUsed',
      playerId,
      abilityType,
      creatureId,
      targetId,
      chainEffects: result.chainEffects || []
    }],
    error: ''
  };
}

/**
 * 處理冬眠
 */
function handleHibernate(gameState, playerId, payload) {
  const { creatureId } = payload;

  const result = useHibernation(gameState, creatureId, gameState.isLastRound);

  if (!result.success) {
    return {
      success: false,
      gameState,
      events: [],
      error: result.reason || '使用冬眠失敗'
    };
  }

  let newGameState = nextFeedingPlayer(result.gameState);

  return {
    success: true,
    gameState: newGameState,
    events: [{
      type: 'creatureHibernated',
      playerId,
      creatureId
    }],
    error: ''
  };
}

/**
 * 處理跳過
 */
function handlePass(gameState, playerId) {
  const events = [];
  let newGameState = gameState;
  let phaseEnded = false;

  if (gameState.phase === GAME_PHASES.EVOLUTION) {
    const result = handleEvolutionPass(gameState, playerId);
    newGameState = result.gameState;
    phaseEnded = result.phaseEnded;
    events.push({ type: 'playerPassed', playerId, phase: 'evolution' });
  } else if (gameState.phase === GAME_PHASES.FEEDING) {
    const result = handleFeedingPass(gameState, playerId);
    newGameState = result.gameState;
    phaseEnded = result.phaseEnded;
    events.push({ type: 'playerPassed', playerId, phase: 'feeding' });
  }

  // 如果階段結束，推進到下一階段
  if (phaseEnded) {
    newGameState = advancePhase(newGameState);
    events.push({ type: 'phaseChanged', newPhase: newGameState.phase });

    // 如果是食物供給階段結束，自動推進到進食階段
    if (newGameState.phase === GAME_PHASES.FOOD_SUPPLY) {
      newGameState = advancePhase(newGameState);
      events.push({ type: 'phaseChanged', newPhase: newGameState.phase });
    }
  }

  return {
    success: true,
    gameState: newGameState,
    events,
    error: ''
  };
}

/**
 * 處理防禦回應
 */
function handleDefenseResponse(gameState, playerId, payload) {
  const { responseType, traitId, targetId } = payload;
  const pending = gameState.pendingResponse;

  if (!pending) {
    return {
      success: false,
      gameState,
      events: [],
      error: '沒有待處理的防禦'
    };
  }

  const defenseChoice = {
    type: responseType,
    traitId,
    targetId
  };

  const result = resolveAttack(gameState, {
    attackerId: pending.attackerId,
    defenderId: pending.defenderId,
    defenseChoice
  });

  // 清除待處理回應
  let newGameState = {
    ...result.gameState,
    pendingResponse: null
  };

  // 如果有新的待處理回應（例如擬態轉移後的新攻擊）
  if (result.pendingResponse) {
    const newDefender = findCreatureById(newGameState, result.pendingResponse.defenderId);
    newGameState.pendingResponse = {
      ...result.pendingResponse,
      responderId: newDefender.ownerId
    };
  } else {
    // 攻擊完成，移動到下一個玩家
    newGameState = nextFeedingPlayer(newGameState);
  }

  return {
    success: true,
    gameState: newGameState,
    events: [{
      type: 'defenseResolved',
      responseType,
      attackerId: pending.attackerId,
      defenderId: pending.defenderId,
      chainEffects: result.chainEffects
    }],
    error: ''
  };
}

// ==================== 狀態查詢 ====================

/**
 * 取得玩家視角的遊戲狀態
 * 隱藏其他玩家手牌
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 玩家 ID
 * @returns {Object} 玩家視角的遊戲狀態
 */
function getGameState(gameState, playerId) {
  const sanitizedPlayers = {};

  for (const [id, player] of Object.entries(gameState.players)) {
    if (id === playerId) {
      // 自己可以看到完整資訊
      sanitizedPlayers[id] = player;
    } else {
      // 其他玩家只能看到手牌數量
      sanitizedPlayers[id] = {
        ...player,
        hand: player.hand.length // 只顯示數量
      };
    }
  }

  return {
    ...gameState,
    players: sanitizedPlayers,
    deck: gameState.deck.length // 只顯示牌庫剩餘數量
  };
}

/**
 * 取得遊戲結果
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {{ scores: Object, winner: Object }}
 */
function getGameResult(gameState) {
  if (gameState.phase !== GAME_PHASES.GAME_END) {
    return null;
  }

  const scores = calculateScores(gameState);
  const winner = determineWinner(scores);

  return { scores, winner };
}

// ==================== 輔助函數 ====================

/**
 * 在遊戲狀態中找出生物
 */
function findCreatureById(gameState, creatureId) {
  for (const player of Object.values(gameState.players)) {
    const creature = (player.creatures || []).find(c => c.id === creatureId);
    if (creature) return creature;
  }
  return null;
}

/**
 * 更新遊戲狀態中的生物
 */
function updateCreatureInGameState(gameState, updatedCreature) {
  const newPlayers = { ...gameState.players };

  for (const [playerId, player] of Object.entries(newPlayers)) {
    const index = (player.creatures || []).findIndex(c => c.id === updatedCreature.id);
    if (index !== -1) {
      newPlayers[playerId] = {
        ...player,
        creatures: [
          ...player.creatures.slice(0, index),
          updatedCreature,
          ...player.creatures.slice(index + 1)
        ]
      };
      break;
    }
  }

  return { ...gameState, players: newPlayers };
}

// ==================== 導出 ====================

module.exports = {
  // 遊戲初始化
  initGame,
  startGame,

  // 動作處理
  validateAction,
  processAction,

  // 狀態查詢
  getGameState,
  getGameResult,

  // 階段控制
  advancePhase
};
