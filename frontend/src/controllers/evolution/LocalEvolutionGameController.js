/**
 * 演化論本地遊戲控制器
 *
 * 用於單人模式（含 AI 玩家）時的演化論本地遊戲邏輯處理。
 * 模擬後端遊戲邏輯，不依賴 Socket.io。
 *
 * @module controllers/evolution/LocalEvolutionGameController
 */

import {
  GAME_PHASES,
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
  INTERACTIVE_TRAITS,
  STACKABLE_TRAITS,
  FOOD_FORMULA,
  INITIAL_HAND_SIZE,
  SCORE_PER_CREATURE,
  SCORE_PER_TRAIT
} from '../../shared/evolutionConstants';

// ==================== 卡牌管理 ====================

let cardIdCounter = 0;
let creatureIdCounter = 0;
let traitIdCounter = 0;

function generateCardId() {
  return `card_${++cardIdCounter}`;
}
function generateCreatureId() {
  return `creature_${++creatureIdCounter}`;
}
function generateTraitId() {
  return `trait_${++traitIdCounter}`;
}

function createDeck() {
  cardIdCounter = 0;
  const deck = [];
  for (const [traitType, def] of Object.entries(TRAIT_DEFINITIONS)) {
    for (let i = 0; i < def.cardCount; i++) {
      deck.push({
        id: generateCardId(),
        traitType,
        foodBonus: def.foodBonus || 0,
        isInteractive: def.isInteractive || false
      });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function drawCards(deck, count) {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { cards: drawn, remaining };
}

// ==================== 生物管理 ====================

function createCreature(ownerId, cardId) {
  creatureIdCounter++;
  return {
    id: generateCreatureId(),
    ownerId,
    sourceCardId: cardId,
    traits: [],
    food: { red: 0, blue: 0, yellow: 0 },
    foodNeeded: 1,
    isFed: false,
    hibernating: false,
    hibernated: false,
    usedMimicryThisTurn: false,
    usedRobberyThisPhase: false,
    isPoisoned: false
  };
}

function getCreatureFoodNeeded(creature) {
  let needed = 1;
  for (const trait of (creature.traits || [])) {
    const def = TRAIT_DEFINITIONS[trait.traitType];
    if (def && def.foodBonus > 0) {
      needed += def.foodBonus;
    }
  }
  return needed;
}

function isCreatureFed(creature) {
  const needed = getCreatureFoodNeeded(creature);
  const total = (creature.food?.red || 0) + (creature.food?.blue || 0);
  return total >= needed;
}

function addTraitToCreature(creature, traitType, cardId) {
  traitIdCounter++;
  const newTrait = {
    id: generateTraitId(),
    traitType,
    cardId
  };
  return {
    ...creature,
    traits: [...creature.traits, newTrait],
    foodNeeded: getCreatureFoodNeeded({ ...creature, traits: [...creature.traits, newTrait] })
  };
}

// ==================== 食物計算 ====================

function rollDice(playerCount) {
  const formula = FOOD_FORMULA[playerCount] || FOOD_FORMULA[3];
  let total = formula.bonus;
  const dice = [];
  for (let i = 0; i < formula.dice; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    dice.push(roll);
    total += roll;
  }
  return { dice, total: Math.max(0, total) };
}

// ==================== 計分 ====================

function calculateScores(players) {
  const scores = {};
  for (const [playerId, player] of Object.entries(players)) {
    let score = 0;
    for (const creature of (player.creatures || [])) {
      if (creature.isFed || isCreatureFed(creature)) {
        score += SCORE_PER_CREATURE;
        score += (creature.traits?.length || 0) * SCORE_PER_TRAIT;
      }
    }
    scores[playerId] = score;
  }
  return scores;
}

// ==================== 主控制器 ====================

/**
 * 演化論本地遊戲控制器
 */
class LocalEvolutionGameController {
  /**
   * @param {Object} options
   * @param {Array} options.players - 玩家陣列（包含 AI 玩家實例）
   * @param {Function} options.onStateChange - 狀態變更回調
   * @param {Function} options.onEvent - 事件回調
   */
  constructor({ players, onStateChange, onEvent }) {
    this.players = players; // 包含 AI 實例的玩家陣列
    this.onStateChange = onStateChange;
    this.onEvent = onEvent;

    // 重置 ID 計數器
    cardIdCounter = 0;
    creatureIdCounter = 0;
    traitIdCounter = 0;

    // 遊戲狀態
    this.gameState = {
      gameId: `local-evo-${Date.now()}`,
      phase: GAME_PHASES.WAITING,
      round: 0,
      players: {}, // { playerId: { id, name, hand, creatures, hasPassedEvolution, hasPassedFeeding } }
      playerOrder: [],
      currentPlayerIndex: 0,
      currentPlayerId: null,
      foodPool: 0,
      diceResult: null,
      deckCount: 0,
      pendingAttack: null,
      winner: null,
      scores: {}
    };

    this.deck = [];
    this.isLastRound = false;
    this._actionInProgress = false;

    this.startGame = this.startGame.bind(this);
    this.handleAction = this.handleAction.bind(this);
  }

  // ==================== 遊戲啟動 ====================

  startGame() {
    console.log('[LocalEvoCtrl] 開始遊戲，玩家:', this.players.map(p => p.name));

    // 建立牌組
    this.deck = shuffleDeck(createDeck());

    // 初始化玩家狀態
    const playerOrder = this.players.map(p => p.id);
    const playersState = {};

    for (const player of this.players) {
      const { cards, remaining } = drawCards(this.deck, INITIAL_HAND_SIZE);
      this.deck = remaining;

      playersState[player.id] = {
        id: player.id,
        name: player.name,
        isAI: player.isAI || false,
        hand: cards,
        creatures: [],
        hasPassedEvolution: false,
        hasPassedFeeding: false,
        score: 0
      };

      // 更新 AI 手牌
      if (player.isAI && player.setHand) {
        player.setHand(cards);
      }
    }

    this.gameState = {
      ...this.gameState,
      players: playersState,
      playerOrder,
      deckCount: this.deck.length
    };

    // 開始第一回合的演化階段
    this.startEvolutionPhase();
  }

  // ==================== 演化階段 ====================

  startEvolutionPhase() {
    this.gameState.round++;
    console.log(`[LocalEvoCtrl] 第 ${this.gameState.round} 回合 - 演化階段`);

    // 重置演化通過狀態
    for (const player of Object.values(this.gameState.players)) {
      player.hasPassedEvolution = false;
      player.creatures = player.creatures.map(c => ({
        ...c,
        usedMimicryThisTurn: false,
        usedRobberyThisPhase: false,
        hibernated: false
      }));
    }

    const startIdx = (this.gameState.round - 1) % this.gameState.playerOrder.length;

    this.gameState = {
      ...this.gameState,
      phase: GAME_PHASES.EVOLUTION,
      currentPlayerIndex: startIdx,
      currentPlayerId: this.gameState.playerOrder[startIdx]
    };

    this.broadcastEvent({ type: 'phaseChanged', phase: GAME_PHASES.EVOLUTION, round: this.gameState.round });
    this.emitStateChange();
  }

  handleEvolutionAction(action) {
    const { type, playerId, cardId, creatureId, traitType, targetPlayerId } = action;
    const player = this.gameState.players[playerId];
    if (!player) return;

    if (type === 'createCreature') {
      // 消耗手牌、創造生物
      const card = player.hand.find(c => c.id === cardId);
      if (!card) { console.warn('[LocalEvoCtrl] 找不到卡牌:', cardId); this.passEvolution(playerId); return; }

      const newCreature = createCreature(playerId, cardId);
      player.hand = player.hand.filter(c => c.id !== cardId);
      player.creatures = [...player.creatures, newCreature];

      console.log(`[LocalEvoCtrl] ${player.name} 創造生物 ${newCreature.id}`);
      this.broadcastEvent({ type: 'creatureCreated', playerId, creature: newCreature });

    } else if (type === 'addTrait') {
      const card = player.hand.find(c => c.id === cardId);
      if (!card) { console.warn('[LocalEvoCtrl] 找不到卡牌:', cardId); this.passEvolution(playerId); return; }

      // 寄生蟲可以放到對手生物上
      const isParasite = traitType === TRAIT_TYPES.PARASITE;
      const targetPId = isParasite && targetPlayerId ? targetPlayerId : playerId;
      const targetPlayer = this.gameState.players[targetPId];
      if (!targetPlayer) { this.passEvolution(playerId); return; }

      const targetCreature = targetPlayer.creatures.find(c => c.id === creatureId);
      if (!targetCreature) { console.warn('[LocalEvoCtrl] 找不到生物:', creatureId); this.passEvolution(playerId); return; }

      // 驗證：不能重複添加相同性狀（脂肪除外）
      const hasAlready = targetCreature.traits?.some(t => t.traitType === traitType);
      if (hasAlready && traitType !== TRAIT_TYPES.FAT_TISSUE) {
        console.warn('[LocalEvoCtrl] 生物已有此性狀');
        this.passEvolution(playerId);
        return;
      }

      const updatedCreature = addTraitToCreature(targetCreature, traitType, cardId);
      player.hand = player.hand.filter(c => c.id !== cardId);
      targetPlayer.creatures = targetPlayer.creatures.map(c =>
        c.id === creatureId ? updatedCreature : c
      );

      console.log(`[LocalEvoCtrl] ${player.name} 為 ${targetCreature.id} 賦予 ${traitType} 性狀`);
      this.broadcastEvent({ type: 'traitAdded', playerId: targetPId, creatureId, traitType });

    } else if (type === 'pass') {
      this.passEvolution(playerId);
      return;
    }

    // 更新 AI 手牌
    const aiInstance = this.players.find(p => p.id === playerId);
    if (aiInstance?.isAI && aiInstance.setHand) {
      aiInstance.setHand(player.hand);
    }

    // 移到下一個演化玩家
    this.nextEvolutionPlayer();
  }

  passEvolution(playerId) {
    const player = this.gameState.players[playerId];
    if (player) player.hasPassedEvolution = true;

    // 檢查是否所有人都跳過
    const allPassed = Object.values(this.gameState.players).every(p => p.hasPassedEvolution);
    if (allPassed) {
      this.startFoodPhase();
    } else {
      this.nextEvolutionPlayer();
    }
  }

  nextEvolutionPlayer() {
    const playerOrder = this.gameState.playerOrder;
    const playerCount = playerOrder.length;
    let nextIdx = (this.gameState.currentPlayerIndex + 1) % playerCount;
    let attempts = 0;

    // 跳過已通過的玩家
    while (this.gameState.players[playerOrder[nextIdx]]?.hasPassedEvolution && attempts < playerCount) {
      nextIdx = (nextIdx + 1) % playerCount;
      attempts++;
    }

    // 如果所有玩家都通過
    if (this.gameState.players[playerOrder[nextIdx]]?.hasPassedEvolution) {
      this.startFoodPhase();
      return;
    }

    this.gameState = {
      ...this.gameState,
      currentPlayerIndex: nextIdx,
      currentPlayerId: playerOrder[nextIdx]
    };
    this.emitStateChange();
  }

  // ==================== 食物供給階段 ====================

  startFoodPhase() {
    console.log('[LocalEvoCtrl] 食物供給階段');
    const playerCount = this.gameState.playerOrder.length;
    const { dice, total } = rollDice(playerCount);

    this.gameState = {
      ...this.gameState,
      phase: GAME_PHASES.FOOD_SUPPLY,
      foodPool: total,
      diceResult: dice
    };

    this.broadcastEvent({ type: 'phaseChanged', phase: GAME_PHASES.FOOD_SUPPLY, foodPool: total, diceResult: dice });
    this.emitStateChange();

    // 食物供給階段自動進入進食階段（短暫延遲顯示骰子結果）
    setTimeout(() => this.startFeedingPhase(), 1500);
  }

  // ==================== 進食階段 ====================

  startFeedingPhase() {
    console.log('[LocalEvoCtrl] 進食階段');

    // 重置進食狀態
    for (const player of Object.values(this.gameState.players)) {
      player.hasPassedFeeding = false;
      player.creatures = player.creatures.map(c => ({
        ...c,
        isFed: false,
        food: { red: 0, blue: 0, yellow: 0 },
        hibernating: false
      }));
    }

    const startIdx = (this.gameState.round - 1) % this.gameState.playerOrder.length;

    this.gameState = {
      ...this.gameState,
      phase: GAME_PHASES.FEEDING,
      currentPlayerIndex: startIdx,
      currentPlayerId: this.gameState.playerOrder[startIdx]
    };

    this.broadcastEvent({ type: 'phaseChanged', phase: GAME_PHASES.FEEDING });
    this.emitStateChange();
  }

  handleFeedingAction(action) {
    const { type, playerId, creatureId, attackerCreatureId, defenderCreatureId, defenderPlayerId } = action;
    const player = this.gameState.players[playerId];
    if (!player) return;

    if (type === 'feed') {
      this.handleFeed(playerId, creatureId);
    } else if (type === 'attack') {
      this.handleAttack(playerId, attackerCreatureId, defenderCreatureId, defenderPlayerId);
    } else if (type === 'hibernate') {
      this.handleHibernate(playerId, creatureId);
    } else if (type === 'pass') {
      this.passFeed(playerId);
      return;
    } else {
      this.passFeed(playerId);
      return;
    }
  }

  handleFeed(playerId, creatureId) {
    if (this.gameState.foodPool <= 0) {
      this.passFeed(playerId);
      return;
    }

    const player = this.gameState.players[playerId];
    const creature = player.creatures.find(c => c.id === creatureId);
    if (!creature || creature.isFed || creature.hibernating) {
      this.passFeed(playerId);
      return;
    }

    // 吃食物
    creature.food.red = (creature.food.red || 0) + 1;
    this.gameState.foodPool--;

    // 檢查是否吃飽
    if (isCreatureFed(creature)) {
      creature.isFed = true;
    }

    console.log(`[LocalEvoCtrl] ${player.name} 的 ${creatureId} 進食（食物池剩 ${this.gameState.foodPool}）`);
    this.broadcastEvent({ type: 'creatureFed', playerId, creatureId, foodPool: this.gameState.foodPool });
    this.nextFeedingPlayer();
  }

  handleAttack(attackerPlayerId, attackerCreatureId, defenderCreatureId, defenderPlayerId) {
    const attackerPlayer = this.gameState.players[attackerPlayerId];
    const defenderPlayer = this.gameState.players[defenderPlayerId];
    const attacker = attackerPlayer?.creatures.find(c => c.id === attackerCreatureId);
    const defender = defenderPlayer?.creatures.find(c => c.id === defenderCreatureId);

    if (!attacker || !defender) {
      this.passFeed(attackerPlayerId);
      return;
    }

    // 檢查攻擊合法性
    const canAttack = this.checkCanAttack(attacker, defender);
    if (!canAttack) {
      this.passFeed(attackerPlayerId);
      return;
    }

    // 設定待處理攻擊
    this.gameState.pendingAttack = {
      attackerPlayerId,
      attackerCreatureId,
      defenderCreatureId,
      defenderPlayerId
    };

    console.log(`[LocalEvoCtrl] ${attackerPlayer.name} 攻擊 ${defenderPlayer.name} 的 ${defenderCreatureId}`);
    this.broadcastEvent({
      type: 'attackPending',
      attackerPlayerId,
      attackerCreatureId,
      defenderCreatureId,
      defenderPlayerId
    });
    this.emitStateChange();

    // 如果防禦者是 AI，自動決定防禦
    const defenderAI = this.players.find(p => p.id === defenderPlayerId && p.isAI);
    if (defenderAI) {
      setTimeout(async () => {
        try {
          const response = await defenderAI.decideDefenseResponse(
            this.gameState,
            this.gameState.pendingAttack
          );
          this.handleDefenseResponse(response);
        } catch (e) {
          console.error('[LocalEvoCtrl] AI 防禦決策失敗:', e);
          this.handleDefenseResponse({ type: 'defenseResponse', response: 'accept' });
        }
      }, 800);
    }
  }

  handleDefenseResponse(action) {
    if (!this.gameState.pendingAttack) return;

    const { attackerPlayerId, attackerCreatureId, defenderCreatureId, defenderPlayerId } = this.gameState.pendingAttack;
    const attackerPlayer = this.gameState.players[attackerPlayerId];
    const defenderPlayer = this.gameState.players[defenderPlayerId];
    const attacker = attackerPlayer?.creatures.find(c => c.id === attackerCreatureId);
    const defender = defenderPlayer?.creatures.find(c => c.id === defenderCreatureId);

    if (!attacker || !defender) {
      this.gameState.pendingAttack = null;
      this.emitStateChange();
      return;
    }

    const { response } = action;

    if (response === 'tailLoss') {
      // 斷尾：防禦者棄置一個性狀，攻擊取消
      const tailLossTraitId = action.traitId;
      defenderPlayer.creatures = defenderPlayer.creatures.map(c => {
        if (c.id === defenderCreatureId) {
          return { ...c, traits: c.traits.filter(t => t.id !== tailLossTraitId) };
        }
        return c;
      });
      console.log(`[LocalEvoCtrl] 斷尾！攻擊取消`);
      this.broadcastEvent({ type: 'attackResolved', result: 'tailLoss' });

    } else if (response === 'agile') {
      // 敏捷：擲骰，50% 逃脫
      const escaped = Math.random() < 0.5;
      if (escaped) {
        console.log(`[LocalEvoCtrl] 敏捷逃脫！`);
        this.broadcastEvent({ type: 'attackResolved', result: 'agileEscape' });
        this.gameState.pendingAttack = null;
        this.nextFeedingPlayer();
        return;
      }
      // 沒逃脫，繼續攻擊
      this.resolveAttack(attacker, defender, attackerPlayer, defenderPlayer, attackerCreatureId, defenderCreatureId);
      return;

    } else {
      // accept 或其他：攻擊成功
      this.resolveAttack(attacker, defender, attackerPlayer, defenderPlayer, attackerCreatureId, defenderCreatureId);
      return;
    }

    this.gameState.pendingAttack = null;
    this.emitStateChange();
    this.nextFeedingPlayer();
  }

  resolveAttack(attacker, defender, attackerPlayer, defenderPlayer, attackerCreatureId, defenderCreatureId) {
    // 攻擊成功：防禦者滅絕，攻擊者獲得食物
    defenderPlayer.creatures = defenderPlayer.creatures.filter(c => c.id !== defenderCreatureId);

    // 攻擊者吃到食物（藍色食物）
    attacker.food.blue = (attacker.food.blue || 0) + 2;
    if (isCreatureFed(attacker)) {
      attacker.isFed = true;
    }

    // 毒液效果：攻擊者下回合開始時中毒（簡化：直接讓攻擊者食量歸零）
    const defenderHasPoison = defender.traits?.some(t => t.traitType === TRAIT_TYPES.POISONOUS);
    if (defenderHasPoison) {
      attacker.isPoisoned = true;
    }

    // 腐食效果：其他玩家的腐食生物獲得食物
    this.triggerScavenger(attackerPlayer.id);

    console.log(`[LocalEvoCtrl] 攻擊成功！${defender.id} 滅絕`);
    this.broadcastEvent({ type: 'attackResolved', result: 'success', attackerCreatureId, defenderCreatureId });

    this.gameState.pendingAttack = null;
    this.emitStateChange();
    this.nextFeedingPlayer();
  }

  triggerScavenger(excludePlayerId) {
    for (const [pid, player] of Object.entries(this.gameState.players)) {
      if (pid === excludePlayerId) continue;
      for (const creature of player.creatures) {
        if (creature.traits?.some(t => t.traitType === TRAIT_TYPES.SCAVENGER) && !creature.isFed) {
          creature.food.blue = (creature.food.blue || 0) + 1;
          if (isCreatureFed(creature)) creature.isFed = true;
        }
      }
    }
  }

  handleHibernate(playerId, creatureId) {
    const player = this.gameState.players[playerId];
    const creature = player?.creatures.find(c => c.id === creatureId);
    if (!creature) { this.passFeed(playerId); return; }

    const hasHibernation = creature.traits?.some(t => t.traitType === TRAIT_TYPES.HIBERNATION);
    if (!hasHibernation) { this.passFeed(playerId); return; }

    creature.hibernating = true;
    creature.hibernated = true;
    creature.isFed = true; // 冬眠視為吃飽
    console.log(`[LocalEvoCtrl] ${player.name} 的 ${creatureId} 進入冬眠`);
    this.broadcastEvent({ type: 'creatureHibernated', playerId, creatureId });
    this.nextFeedingPlayer();
  }

  passFeed(playerId) {
    const player = this.gameState.players[playerId];
    if (player) player.hasPassedFeeding = true;

    const allPassed = Object.values(this.gameState.players).every(p => p.hasPassedFeeding);
    if (allPassed) {
      this.startExtinctionPhase();
    } else {
      this.nextFeedingPlayer();
    }
  }

  nextFeedingPlayer() {
    const playerOrder = this.gameState.playerOrder;
    const playerCount = playerOrder.length;
    let nextIdx = (this.gameState.currentPlayerIndex + 1) % playerCount;
    let attempts = 0;

    while (this.gameState.players[playerOrder[nextIdx]]?.hasPassedFeeding && attempts < playerCount) {
      nextIdx = (nextIdx + 1) % playerCount;
      attempts++;
    }

    if (this.gameState.players[playerOrder[nextIdx]]?.hasPassedFeeding) {
      this.startExtinctionPhase();
      return;
    }

    this.gameState = {
      ...this.gameState,
      currentPlayerIndex: nextIdx,
      currentPlayerId: playerOrder[nextIdx]
    };
    this.emitStateChange();
  }

  // ==================== 攻擊驗證 ====================

  checkCanAttack(attacker, defender) {
    if (!attacker.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)) return false;
    if (defender.isFed && defender.traits?.some(t => t.traitType === TRAIT_TYPES.BURROWING)) return false;
    if (defender.traits?.some(t => t.traitType === TRAIT_TYPES.CAMOUFLAGE)) {
      if (!attacker.traits?.some(t => t.traitType === TRAIT_TYPES.SHARP_VISION)) return false;
    }
    if (defender.traits?.some(t => t.traitType === TRAIT_TYPES.AQUATIC)) {
      if (!attacker.traits?.some(t => t.traitType === TRAIT_TYPES.AQUATIC)) return false;
    }
    if (defender.traits?.some(t => t.traitType === TRAIT_TYPES.MASSIVE)) {
      if (!attacker.traits?.some(t => t.traitType === TRAIT_TYPES.MASSIVE)) return false;
    }
    return true;
  }

  // ==================== 滅絕階段 ====================

  startExtinctionPhase() {
    console.log('[LocalEvoCtrl] 滅絕階段');

    // 中毒生物滅絕
    for (const player of Object.values(this.gameState.players)) {
      player.creatures = player.creatures.filter(c => !c.isPoisoned);
    }

    // 未吃飽的生物滅絕（除了冬眠生物）
    const extinctCreatures = [];
    for (const [pid, player] of Object.entries(this.gameState.players)) {
      const extinct = player.creatures.filter(c => !c.isFed && !c.hibernating);
      extinctCreatures.push(...extinct.map(c => ({ ...c, ownerId: pid })));
      player.creatures = player.creatures.filter(c => c.isFed || c.hibernating);
    }

    // 計分
    this.gameState.scores = calculateScores(this.gameState.players);

    // 抽牌（每位玩家根據生物數量 + 1 抽牌）
    for (const [pid, player] of Object.entries(this.gameState.players)) {
      const drawCount = Math.min(
        player.creatures.length + 1 + INITIAL_HAND_SIZE - player.hand.length,
        Math.max(1, player.creatures.length + 1)
      );
      if (this.deck.length > 0) {
        const { cards, remaining } = drawCards(this.deck, Math.min(drawCount, this.deck.length));
        player.hand = [...player.hand, ...cards];
        this.deck = remaining;
      }
    }

    this.gameState = {
      ...this.gameState,
      phase: GAME_PHASES.EXTINCTION,
      deckCount: this.deck.length
    };

    this.broadcastEvent({
      type: 'phaseChanged',
      phase: GAME_PHASES.EXTINCTION,
      extinctCreatures,
      scores: this.gameState.scores
    });
    this.emitStateChange();

    // 檢查是否最後一回合（牌庫空了）
    if (this.deck.length === 0) {
      this.isLastRound = true;
    }

    // 短暫延遲後開始下一回合或結束遊戲
    setTimeout(() => {
      if (this.isLastRound) {
        this.endGame();
      } else {
        // 發牌給AI
        for (const aiPlayer of this.players.filter(p => p.isAI)) {
          const playerState = this.gameState.players[aiPlayer.id];
          if (playerState && aiPlayer.setHand) {
            aiPlayer.setHand(playerState.hand);
          }
        }
        this.startEvolutionPhase();
      }
    }, 2000);
  }

  // ==================== 遊戲結束 ====================

  endGame() {
    console.log('[LocalEvoCtrl] 遊戲結束！');

    const scores = this.gameState.scores;
    let winnerId = null;
    let maxScore = -1;

    for (const [pid, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winnerId = pid;
      }
    }

    this.gameState = {
      ...this.gameState,
      phase: GAME_PHASES.GAME_END,
      winner: winnerId,
      scores
    };

    this.broadcastEvent({ type: 'gameEnded', winner: winnerId, scores });
    this.emitStateChange();
  }

  // ==================== 主動作入口 ====================

  async handleAction(action) {
    if (this._actionInProgress) {
      console.warn('[LocalEvoCtrl] 動作正在進行中，忽略:', action.type);
      return;
    }

    this._actionInProgress = true;
    try {
      const phase = this.gameState.phase;
      console.log(`[LocalEvoCtrl] 處理動作: ${action.type} (階段: ${phase})`);

      if (phase === GAME_PHASES.EVOLUTION) {
        this.handleEvolutionAction(action);
      } else if (phase === GAME_PHASES.FEEDING) {
        if (action.type === 'defenseResponse') {
          this.handleDefenseResponse(action);
        } else {
          this.handleFeedingAction(action);
        }
      }
    } finally {
      this._actionInProgress = false;
    }
  }

  // ==================== 輔助方法 ====================

  broadcastEvent(event) {
    if (this.onEvent) {
      this.onEvent(event);
    }
  }

  emitStateChange() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.gameState });
    }
  }

  getState() {
    return { ...this.gameState };
  }

  getCurrentPlayer() {
    return this.gameState.players[this.gameState.currentPlayerId] || null;
  }

  isAITurn() {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) return false;
    return this.players.some(p => p.id === currentPlayer.id && p.isAI);
  }

  getAIInstance(playerId) {
    return this.players.find(p => p.id === playerId && p.isAI);
  }
}

export default LocalEvolutionGameController;
