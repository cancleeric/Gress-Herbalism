/**
 * 演化論 AI - 基礎策略（簡單難度）
 *
 * 隨機選擇合法動作：
 * - 演化階段：隨機出牌（創造生物或賦予性狀）或跳過
 * - 進食階段：隨機選擇進食或攻擊
 *
 * @module ai/evolution/strategies/BasicStrategy
 */

import {
  TRAIT_TYPES,
  INTERACTIVE_TRAITS
} from '../../../shared/evolutionConstants';

/**
 * 基礎隨機策略（簡單難度）
 */
class BasicStrategy {
  constructor() {
    this.name = '基礎 AI';
    this.difficulty = 'easy';
  }

  /**
   * 演化階段決策
   * @param {Object} gameState - 遊戲狀態
   * @param {string} playerId - AI 玩家 ID
   * @returns {Object} 動作物件
   */
  decideEvolutionAction(gameState, playerId) {
    const player = gameState.players[playerId];
    if (!player) return { type: 'pass' };

    const hand = player.hand || [];
    if (hand.length === 0) return { type: 'pass' };

    // 70% 機率出牌，30% 機率跳過
    if (Math.random() < 0.3) {
      return { type: 'pass' };
    }

    const creatures = player.creatures || [];

    // 如果沒有生物，必須創造生物
    if (creatures.length === 0) {
      return this.createCreatureAction(hand, playerId);
    }

    // 隨機選擇：創造生物或賦予性狀
    const action = Math.random() < 0.5 ? 'createCreature' : 'addTrait';

    if (action === 'createCreature') {
      return this.createCreatureAction(hand, playerId);
    } else {
      return this.addTraitAction(hand, creatures, playerId, gameState) || this.createCreatureAction(hand, playerId);
    }
  }

  /**
   * 生成創造生物動作
   * @param {Array} hand - 手牌
   * @param {string} playerId - 玩家 ID
   * @returns {Object} 動作物件
   */
  createCreatureAction(hand, playerId) {
    // 隨機選一張牌創造生物
    const card = hand[Math.floor(Math.random() * hand.length)];
    return {
      type: 'createCreature',
      cardId: card.id,
      playerId
    };
  }

  /**
   * 生成賦予性狀動作
   * @param {Array} hand - 手牌
   * @param {Array} creatures - 生物列表
   * @param {string} playerId - 玩家 ID
   * @param {Object} gameState - 遊戲狀態
   * @returns {Object|null} 動作物件或 null
   */
  addTraitAction(hand, creatures, playerId, gameState) {
    // 過濾掉互動性狀（基礎策略不使用互動性狀，太複雜）
    const nonInteractiveCards = hand.filter(card =>
      !INTERACTIVE_TRAITS.includes(card.traitType)
    );

    if (nonInteractiveCards.length === 0) return null;

    const card = nonInteractiveCards[Math.floor(Math.random() * nonInteractiveCards.length)];
    const creature = creatures[Math.floor(Math.random() * creatures.length)];

    // 檢查性狀是否已存在（非可疊加性狀不能重複）
    const hasTraitAlready = creature.traits?.some(t => t.traitType === card.traitType);
    if (hasTraitAlready && card.traitType !== TRAIT_TYPES.FAT_TISSUE) {
      return null;
    }

    return {
      type: 'addTrait',
      cardId: card.id,
      creatureId: creature.id,
      traitType: card.traitType,
      playerId
    };
  }

  /**
   * 進食階段決策
   * @param {Object} gameState - 遊戲狀態
   * @param {string} playerId - AI 玩家 ID
   * @returns {Object} 動作物件
   */
  decideFeedingAction(gameState, playerId) {
    const player = gameState.players[playerId];
    if (!player) return { type: 'pass' };

    const creatures = player.creatures || [];
    const foodPool = gameState.foodPool || 0;

    // 找到未吃飽的生物
    const hungryCreatures = creatures.filter(c => !c.isFed && !c.hibernating);
    if (hungryCreatures.length === 0) return { type: 'pass' };

    // 找肉食生物（需要攻擊）
    const carnivores = hungryCreatures.filter(c =>
      c.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)
    );

    // 找草食生物（從食物池進食）
    const herbivores = hungryCreatures.filter(c =>
      !c.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)
    );

    // 優先讓草食生物進食（如果食物池有食物）
    if (herbivores.length > 0 && foodPool > 0) {
      const creature = herbivores[Math.floor(Math.random() * herbivores.length)];
      return {
        type: 'feed',
        creatureId: creature.id,
        playerId
      };
    }

    // 讓肉食生物攻擊
    if (carnivores.length > 0) {
      const attackAction = this.decideAttack(gameState, carnivores[0], playerId);
      if (attackAction) return attackAction;
    }

    return { type: 'pass' };
  }

  /**
   * 決定攻擊目標
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} carnivore - 肉食生物
   * @param {string} playerId - 攻擊者玩家 ID
   * @returns {Object|null} 攻擊動作或 null
   */
  decideAttack(gameState, carnivore, playerId) {
    const allPlayers = Object.values(gameState.players);
    const validTargets = [];

    for (const opponent of allPlayers) {
      if (opponent.id === playerId) continue;
      for (const creature of (opponent.creatures || [])) {
        if (this.canAttack(carnivore, creature)) {
          validTargets.push({ creature, ownerId: opponent.id });
        }
      }
    }

    if (validTargets.length === 0) return null;

    const target = validTargets[Math.floor(Math.random() * validTargets.length)];
    return {
      type: 'attack',
      attackerCreatureId: carnivore.id,
      defenderCreatureId: target.creature.id,
      defenderPlayerId: target.ownerId,
      playerId
    };
  }

  /**
   * 判斷是否可以攻擊目標生物
   * @param {Object} attacker - 攻擊生物
   * @param {Object} defender - 防禦生物
   * @returns {boolean}
   */
  canAttack(attacker, defender) {
    // 穴居生物吃飽後不能被攻擊
    if (defender.isFed && defender.traits?.some(t => t.traitType === TRAIT_TYPES.BURROWING)) {
      return false;
    }

    // 偽裝需要銳目才能攻擊
    if (defender.traits?.some(t => t.traitType === TRAIT_TYPES.CAMOUFLAGE)) {
      if (!attacker.traits?.some(t => t.traitType === TRAIT_TYPES.SHARP_VISION)) {
        return false;
      }
    }

    // 水生生物只能被水生肉食攻擊
    if (defender.traits?.some(t => t.traitType === TRAIT_TYPES.AQUATIC)) {
      if (!attacker.traits?.some(t => t.traitType === TRAIT_TYPES.AQUATIC)) {
        return false;
      }
    }

    // 巨化生物只能被巨化肉食攻擊
    if (defender.traits?.some(t => t.traitType === TRAIT_TYPES.MASSIVE)) {
      if (!attacker.traits?.some(t => t.traitType === TRAIT_TYPES.MASSIVE)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 防禦回應決策（被攻擊時）
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} pendingAttack - 待處理的攻擊
   * @param {string} playerId - 防禦玩家 ID
   * @returns {Object} 回應動作
   */
  decideDefenseResponse(gameState, pendingAttack, playerId) {
    const player = gameState.players[playerId];
    if (!player) return { type: 'defenseResponse', response: 'accept' };

    const defender = player.creatures?.find(c => c.id === pendingAttack.defenderCreatureId);
    if (!defender) return { type: 'defenseResponse', response: 'accept' };

    // 檢查是否有斷尾性狀
    const hasTailLoss = defender.traits?.some(t => t.traitType === TRAIT_TYPES.TAIL_LOSS);
    if (hasTailLoss) {
      // 50% 機率使用斷尾
      if (Math.random() < 0.5) {
        const tailLossTrait = defender.traits.find(t => t.traitType === TRAIT_TYPES.TAIL_LOSS);
        return {
          type: 'defenseResponse',
          response: 'tailLoss',
          traitId: tailLossTrait.id,
          playerId
        };
      }
    }

    return { type: 'defenseResponse', response: 'accept', playerId };
  }
}

export default BasicStrategy;
