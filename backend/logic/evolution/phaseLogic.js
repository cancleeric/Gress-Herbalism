/**
 * 演化論遊戲 - 階段邏輯模組
 *
 * 此模組負責遊戲階段流程控制，包括：
 * - 演化階段
 * - 食物供給階段
 * - 進食階段
 * - 滅絕與抽牌階段
 *
 * @module logic/evolution/phaseLogic
 */

const {
  GAME_PHASES,
  FOOD_FORMULA,
  INITIAL_HAND_SIZE
} = require('../../../shared/constants/evolution');

const {
  drawCards,
  isDeckEmpty
} = require('./cardLogic');

const {
  checkExtinction,
  processExtinction,
  resetTurnState,
  resetFeedingState,
  consumeFatReserves
} = require('./creatureLogic');

// ==================== 演化階段 ====================

/**
 * 開始演化階段
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} 更新後的遊戲狀態
 */
function startEvolutionPhase(gameState) {
  const playerIds = Object.keys(gameState.players);
  const playerCount = playerIds.length;

  // 重置所有生物的回合狀態
  const updatedPlayers = {};
  for (const [playerId, player] of Object.entries(gameState.players)) {
    updatedPlayers[playerId] = {
      ...player,
      creatures: (player.creatures || []).map(c => resetTurnState(c)),
      hasPassedEvolution: false
    };
  }

  return {
    ...gameState,
    phase: GAME_PHASES.EVOLUTION,
    players: updatedPlayers,
    currentPlayerIndex: 0,
    currentPlayerId: playerIds[gameState.startPlayerIndex || 0],
    evolutionPassCount: 0
  };
}

/**
 * 處理演化階段的跳過動作
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 玩家 ID
 * @returns {{ gameState: Object, phaseEnded: boolean }}
 */
function handleEvolutionPass(gameState, playerId) {
  const playerIds = Object.keys(gameState.players);
  const playerCount = playerIds.length;

  let newGameState = {
    ...gameState,
    players: {
      ...gameState.players,
      [playerId]: {
        ...gameState.players[playerId],
        hasPassedEvolution: true
      }
    }
  };

  // 檢查是否所有玩家都已跳過
  const allPassed = Object.values(newGameState.players).every(p => p.hasPassedEvolution);

  if (allPassed) {
    return { gameState: newGameState, phaseEnded: true };
  }

  // 移動到下一個還沒跳過的玩家
  let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
  while (newGameState.players[playerIds[nextPlayerIndex]].hasPassedEvolution) {
    nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
  }

  newGameState.currentPlayerIndex = nextPlayerIndex;
  newGameState.currentPlayerId = playerIds[nextPlayerIndex];

  return { gameState: newGameState, phaseEnded: false };
}

/**
 * 移動到下一個玩家（演化階段）
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} 更新後的遊戲狀態
 */
function nextEvolutionPlayer(gameState) {
  const playerIds = Object.keys(gameState.players);
  const playerCount = playerIds.length;

  let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;

  // 跳過已跳過的玩家
  let attempts = 0;
  while (gameState.players[playerIds[nextPlayerIndex]].hasPassedEvolution && attempts < playerCount) {
    nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
    attempts++;
  }

  return {
    ...gameState,
    currentPlayerIndex: nextPlayerIndex,
    currentPlayerId: playerIds[nextPlayerIndex]
  };
}

// ==================== 食物供給階段 ====================

/**
 * 開始食物供給階段
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} 更新後的遊戲狀態
 */
function startFoodPhase(gameState) {
  const playerIds = Object.keys(gameState.players);
  const playerCount = playerIds.length;

  // 擲骰決定食物數量
  const diceResult = rollDice(playerCount);

  return {
    ...gameState,
    phase: GAME_PHASES.FOOD_SUPPLY,
    foodPool: diceResult.total,
    diceResult: diceResult.dice,
    currentPlayerIndex: gameState.startPlayerIndex || 0,
    currentPlayerId: playerIds[gameState.startPlayerIndex || 0]
  };
}

/**
 * 擲骰決定食物數量
 * 2人: 1d6 + 2
 * 3人: 2d6
 * 4人: 2d6 + 2
 *
 * @param {number} playerCount - 玩家數
 * @returns {{ dice: number[], total: number }}
 */
function rollDice(playerCount) {
  const formula = FOOD_FORMULA[playerCount] || FOOD_FORMULA[3];
  const dice = [];

  for (let i = 0; i < formula.dice; i++) {
    dice.push(Math.floor(Math.random() * 6) + 1);
  }

  const total = dice.reduce((sum, d) => sum + d, 0) + formula.bonus;

  return { dice, total };
}

// ==================== 進食階段 ====================

/**
 * 開始進食階段
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} 更新後的遊戲狀態
 */
function startFeedingPhase(gameState) {
  const playerIds = Object.keys(gameState.players);

  // 重置所有生物的進食狀態
  const updatedPlayers = {};
  for (const [playerId, player] of Object.entries(gameState.players)) {
    updatedPlayers[playerId] = {
      ...player,
      creatures: (player.creatures || []).map(c => resetFeedingState(c)),
      hasPassedFeeding: false
    };
  }

  return {
    ...gameState,
    phase: GAME_PHASES.FEEDING,
    players: updatedPlayers,
    currentPlayerIndex: gameState.startPlayerIndex || 0,
    currentPlayerId: playerIds[gameState.startPlayerIndex || 0]
  };
}

/**
 * 處理進食階段的跳過動作
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 玩家 ID
 * @returns {{ gameState: Object, phaseEnded: boolean }}
 */
function handleFeedingPass(gameState, playerId) {
  const playerIds = Object.keys(gameState.players);
  const playerCount = playerIds.length;

  let newGameState = {
    ...gameState,
    players: {
      ...gameState.players,
      [playerId]: {
        ...gameState.players[playerId],
        hasPassedFeeding: true
      }
    }
  };

  // 檢查是否所有玩家都已跳過或食物池已空
  const allPassed = Object.values(newGameState.players).every(p => p.hasPassedFeeding);
  const noFood = newGameState.foodPool <= 0;

  // 檢查是否所有生物都已吃飽
  const allFed = Object.values(newGameState.players).every(player =>
    (player.creatures || []).every(c => c.isFed || c.hibernating)
  );

  if (allPassed || (noFood && allFed)) {
    return { gameState: newGameState, phaseEnded: true };
  }

  // 移動到下一個還沒跳過的玩家
  let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
  let attempts = 0;
  while (newGameState.players[playerIds[nextPlayerIndex]].hasPassedFeeding && attempts < playerCount) {
    nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
    attempts++;
  }

  newGameState.currentPlayerIndex = nextPlayerIndex;
  newGameState.currentPlayerId = playerIds[nextPlayerIndex];

  return { gameState: newGameState, phaseEnded: false };
}

/**
 * 移動到下一個玩家（進食階段）
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} 更新後的遊戲狀態
 */
function nextFeedingPlayer(gameState) {
  const playerIds = Object.keys(gameState.players);
  const playerCount = playerIds.length;

  let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;

  // 跳過已跳過的玩家
  let attempts = 0;
  while (gameState.players[playerIds[nextPlayerIndex]].hasPassedFeeding && attempts < playerCount) {
    nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
    attempts++;
  }

  return {
    ...gameState,
    currentPlayerIndex: nextPlayerIndex,
    currentPlayerId: playerIds[nextPlayerIndex]
  };
}

// ==================== 滅絕與抽牌階段 ====================

/**
 * 開始滅絕階段
 * 處理：消耗脂肪、滅絕判定、中毒生物死亡、食物清理、抽牌
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {{ gameState: Object, extinctCreatures: Object[], drawnCards: Object }}
 */
function startExtinctionPhase(gameState) {
  let newGameState = {
    ...gameState,
    phase: GAME_PHASES.EXTINCTION
  };

  const extinctCreatures = [];
  const drawnCards = {};

  // 1. 消耗脂肪儲備
  for (const [playerId, player] of Object.entries(newGameState.players)) {
    newGameState.players[playerId] = {
      ...player,
      creatures: (player.creatures || []).map(c => consumeFatReserves(c))
    };
  }

  // 2. 更新吃飽狀態
  for (const [playerId, player] of Object.entries(newGameState.players)) {
    newGameState.players[playerId] = {
      ...player,
      creatures: (player.creatures || []).map(c => ({
        ...c,
        isFed: c.food.red + c.food.blue >= c.foodNeeded || c.hibernating
      }))
    };
  }

  // 3. 判定滅絕
  for (const [playerId, player] of Object.entries(newGameState.players)) {
    const survivingCreatures = [];
    const deadCreatures = [];

    for (const creature of player.creatures || []) {
      if (checkExtinction(creature)) {
        deadCreatures.push(creature);
        extinctCreatures.push({
          ...creature,
          playerId
        });
      } else {
        survivingCreatures.push(creature);
      }
    }

    newGameState.players[playerId] = {
      ...player,
      creatures: survivingCreatures
    };
  }

  // 4. 清理食物
  for (const [playerId, player] of Object.entries(newGameState.players)) {
    newGameState.players[playerId] = {
      ...player,
      creatures: (player.creatures || []).map(c => ({
        ...c,
        food: { red: 0, blue: 0, yellow: c.food.yellow },
        isFed: false,
        hibernating: false,
        isPoisoned: false
      }))
    };
  }

  // 5. 檢查是否為最後一回合
  const isLastRound = newGameState.isLastRound || false;

  // 6. 抽牌（如果不是最後一回合）
  if (!isLastRound) {
    for (const [playerId, player] of Object.entries(newGameState.players)) {
      const creatureCount = (player.creatures || []).length;
      const drawCount = creatureCount + 1;

      const result = drawCards(newGameState.deck, drawCount);
      newGameState.deck = result.remainingDeck;

      drawnCards[playerId] = result.cards;

      newGameState.players[playerId] = {
        ...player,
        hand: [...(player.hand || []), ...result.cards]
      };
    }

    // 檢查牌庫是否空了
    if (isDeckEmpty(newGameState.deck)) {
      newGameState.isLastRound = true;
    }
  }

  // 7. 移動起始玩家
  const playerIds = Object.keys(newGameState.players);
  const playerCount = playerIds.length;
  newGameState.startPlayerIndex = ((newGameState.startPlayerIndex || 0) + 1) % playerCount;

  return {
    gameState: newGameState,
    extinctCreatures,
    drawnCards
  };
}

/**
 * 檢查遊戲是否結束
 * 結束條件：最後一回合的滅絕階段結束
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {boolean}
 */
function checkGameEnd(gameState) {
  return gameState.isLastRound && gameState.phase === GAME_PHASES.EXTINCTION;
}

/**
 * 推進到下一階段
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} 更新後的遊戲狀態
 */
function advancePhase(gameState) {
  switch (gameState.phase) {
    case GAME_PHASES.WAITING:
      return startEvolutionPhase(gameState);

    case GAME_PHASES.EVOLUTION:
      return startFoodPhase(gameState);

    case GAME_PHASES.FOOD_SUPPLY:
      return startFeedingPhase(gameState);

    case GAME_PHASES.FEEDING:
      const extinctionResult = startExtinctionPhase(gameState);
      return extinctionResult.gameState;

    case GAME_PHASES.EXTINCTION:
      if (checkGameEnd(gameState)) {
        return {
          ...gameState,
          phase: GAME_PHASES.GAME_END
        };
      }
      return startEvolutionPhase(gameState);

    case GAME_PHASES.GAME_END:
      return gameState;

    default:
      return gameState;
  }
}

// ==================== 計分 ====================

/**
 * 計算最終分數
 *
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object<string, { total: number, creatures: number, traits: number, details: Object[] }>}
 */
function calculateScores(gameState) {
  const scores = {};

  for (const [playerId, player] of Object.entries(gameState.players)) {
    let total = 0;
    let creaturesScore = 0;
    let traitsScore = 0;
    const details = [];

    for (const creature of player.creatures || []) {
      // 每隻生物 +2 分
      creaturesScore += 2;
      details.push({
        type: 'creature',
        creatureId: creature.id,
        points: 2
      });

      // 每張性狀 +1 分 + 額外食量加成
      for (const trait of creature.traits) {
        const traitPoints = 1 + (trait.foodBonus || 0);
        traitsScore += traitPoints;
        details.push({
          type: 'trait',
          creatureId: creature.id,
          traitType: trait.type,
          points: traitPoints
        });
      }
    }

    total = creaturesScore + traitsScore;

    scores[playerId] = {
      total,
      creatures: creaturesScore,
      traits: traitsScore,
      details
    };
  }

  return scores;
}

/**
 * 決定勝者
 *
 * @param {Object} scores - 分數物件
 * @returns {{ winnerId: string|null, tied: boolean, tiedPlayers: string[] }}
 */
function determineWinner(scores) {
  const playerScores = Object.entries(scores).map(([id, s]) => ({ id, total: s.total }));
  playerScores.sort((a, b) => b.total - a.total);

  if (playerScores.length === 0) {
    return { winnerId: null, tied: false, tiedPlayers: [] };
  }

  const topScore = playerScores[0].total;
  const topPlayers = playerScores.filter(p => p.total === topScore);

  if (topPlayers.length === 1) {
    return { winnerId: topPlayers[0].id, tied: false, tiedPlayers: [] };
  }

  return {
    winnerId: null,
    tied: true,
    tiedPlayers: topPlayers.map(p => p.id)
  };
}

// ==================== 導出 ====================

module.exports = {
  // 演化階段
  startEvolutionPhase,
  handleEvolutionPass,
  nextEvolutionPlayer,

  // 食物供給階段
  startFoodPhase,
  rollDice,

  // 進食階段
  startFeedingPhase,
  handleFeedingPass,
  nextFeedingPlayer,

  // 滅絕與抽牌階段
  startExtinctionPhase,
  checkGameEnd,

  // 階段推進
  advancePhase,

  // 計分
  calculateScores,
  determineWinner
};
