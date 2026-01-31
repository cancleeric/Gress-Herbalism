/**
 * Game state generator for performance testing
 * 遊戲狀態產生器（用於效能測試）
 */

/**
 * Generate early game state
 * 產生早期遊戲狀態（手牌數量多，資訊少）
 */
function generateEarlyGameState(aiId = 'ai-1', numPlayers = 4) {
  const players = [
    {
      id: aiId,
      name: 'AI Player',
      isActive: true,
      cards: [] // AI 自己的手牌（未知）
    }
  ];

  // 建立其他玩家（手牌數量多）
  for (let i = 2; i <= numPlayers; i++) {
    const playerCards = [];
    const cardCount = Math.floor(Math.random() * 3) + 3; // 3-5 張牌

    // 隨機產生手牌
    const colors = ['red', 'yellow', 'green', 'blue'];
    for (let j = 0; j < cardCount; j++) {
      playerCards.push(colors[Math.floor(Math.random() * colors.length)]);
    }

    players.push({
      id: `player-${i}`,
      name: `Player ${i}`,
      isActive: true,
      cards: playerCards
    });
  }

  return {
    players,
    hiddenCards: ['red', 'blue'], // 兩張蓋牌
    currentPlayerId: aiId,
    phase: 'playing',
    round: 1
  };
}

/**
 * Generate mid-game state
 * 產生中期遊戲狀態（手牌數量中等，資訊中等）
 */
function generateMidGameState(aiId = 'ai-1', numPlayers = 4) {
  const players = [
    {
      id: aiId,
      name: 'AI Player',
      isActive: true,
      cards: []
    }
  ];

  // 建立其他玩家（手牌數量中等）
  for (let i = 2; i <= numPlayers; i++) {
    const playerCards = [];
    const cardCount = Math.floor(Math.random() * 2) + 2; // 2-3 張牌

    const colors = ['red', 'yellow', 'green', 'blue'];
    for (let j = 0; j < cardCount; j++) {
      playerCards.push(colors[Math.floor(Math.random() * colors.length)]);
    }

    players.push({
      id: `player-${i}`,
      name: `Player ${i}`,
      isActive: true,
      cards: playerCards
    });
  }

  return {
    players,
    hiddenCards: ['green', 'yellow'],
    currentPlayerId: aiId,
    phase: 'playing',
    round: 5
  };
}

/**
 * Generate late game state
 * 產生後期遊戲狀態（手牌數量少，資訊多）
 */
function generateLateGameState(aiId = 'ai-1', numPlayers = 4) {
  const players = [
    {
      id: aiId,
      name: 'AI Player',
      isActive: true,
      cards: []
    }
  ];

  // 建立其他玩家（手牌數量少）
  for (let i = 2; i <= numPlayers; i++) {
    const playerCards = [];
    const cardCount = Math.floor(Math.random() * 2) + 1; // 1-2 張牌

    const colors = ['red', 'yellow', 'green', 'blue'];
    for (let j = 0; j < cardCount; j++) {
      playerCards.push(colors[Math.floor(Math.random() * colors.length)]);
    }

    players.push({
      id: `player-${i}`,
      name: `Player ${i}`,
      isActive: true,
      cards: playerCards
    });
  }

  // 可能有玩家已被淘汰
  if (numPlayers >= 4 && Math.random() > 0.5) {
    players[players.length - 1].isActive = false;
    players[players.length - 1].cards = [];
  }

  return {
    players,
    hiddenCards: ['blue', 'green'],
    currentPlayerId: aiId,
    phase: 'playing',
    round: 12
  };
}

/**
 * Generate game state with specific knowledge
 * 產生具有特定知識的遊戲狀態
 */
function generateGameStateWithKnowledge(aiId = 'ai-1', knowledgeLevel = 'medium') {
  const baseState = generateMidGameState(aiId);

  if (knowledgeLevel === 'high') {
    // 高知識：大部分玩家手牌已知
    baseState.players.forEach((player, index) => {
      if (index > 0 && player.cards.length > 0) {
        // 讓 AI 知道一些玩家的手牌
        player.knownCards = player.cards.slice(0, Math.ceil(player.cards.length / 2));
      }
    });
  } else if (knowledgeLevel === 'low') {
    // 低知識：大部分資訊未知
    baseState.players.forEach((player, index) => {
      if (index > 0) {
        player.knownCards = [];
      }
    });
  }

  return baseState;
}

/**
 * Generate a sequence of game states simulating a game progress
 * 產生一系列遊戲狀態模擬遊戲進行
 */
function generateGameSequence(aiId = 'ai-1', rounds = 10) {
  const sequence = [];

  for (let round = 1; round <= rounds; round++) {
    let state;

    if (round <= 3) {
      state = generateEarlyGameState(aiId);
    } else if (round <= 7) {
      state = generateMidGameState(aiId);
    } else {
      state = generateLateGameState(aiId);
    }

    state.round = round;
    sequence.push(state);
  }

  return sequence;
}

/**
 * Create knowledge object for AI
 * 建立 AI 的知識物件
 */
function createKnowledge(gameState, knowledgeLevel = 'medium') {
  const knowledge = {
    knownCards: new Map(),
    hiddenCardProbability: {
      red: 0.25,
      yellow: 0.25,
      green: 0.25,
      blue: 0.25
    },
    questionHistory: [],
    eliminatedColors: new Set(),
    playerHandCounts: new Map()
  };

  // 根據知識等級填充資料
  gameState.players.forEach(player => {
    if (player.id !== gameState.currentPlayerId) {
      knowledge.playerHandCounts.set(player.id, player.cards.length);

      if (knowledgeLevel === 'high' && player.cards.length > 0) {
        // 高知識：知道一些玩家的手牌
        const knownCount = Math.ceil(player.cards.length / 2);
        knowledge.knownCards.set(player.id, player.cards.slice(0, knownCount));
      } else if (knowledgeLevel === 'medium' && player.cards.length > 0) {
        // 中等知識：知道少量玩家手牌
        if (Math.random() > 0.5) {
          knowledge.knownCards.set(player.id, [player.cards[0]]);
        }
      }
    }
  });

  // 根據知識等級調整問題歷史
  if (knowledgeLevel === 'high') {
    knowledge.questionHistory = generateQuestionHistory(gameState, 10);
  } else if (knowledgeLevel === 'medium') {
    knowledge.questionHistory = generateQuestionHistory(gameState, 5);
  }

  return knowledge;
}

/**
 * Generate question history
 * 產生問題歷史
 */
function generateQuestionHistory(gameState, count) {
  const history = [];
  const colors = ['red', 'yellow', 'green', 'blue'];

  for (let i = 0; i < count; i++) {
    const randomPlayer = gameState.players[Math.floor(Math.random() * (gameState.players.length - 1)) + 1];
    const randomColors = [
      colors[Math.floor(Math.random() * colors.length)],
      colors[Math.floor(Math.random() * colors.length)]
    ];

    history.push({
      askerId: gameState.currentPlayerId,
      targetId: randomPlayer.id,
      colors: randomColors,
      questionType: Math.floor(Math.random() * 3) + 1,
      result: {
        cardsGiven: [],
        noCardsForColors: randomColors
      }
    });
  }

  return history;
}

module.exports = {
  generateEarlyGameState,
  generateMidGameState,
  generateLateGameState,
  generateGameStateWithKnowledge,
  generateGameSequence,
  createKnowledge,
  generateQuestionHistory
};
