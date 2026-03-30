/**
 * 演化論 AI - 肉食策略（中等難度 - 攻擊型）
 *
 * 偏好肉食策略：
 * - 優先賦予肉食性狀及輔助性狀（銳目、敏捷）
 * - 積極攻擊對手生物
 * - 適當防禦自身
 *
 * @module ai/evolution/strategies/CarnivoreStrategy
 */

import BasicStrategy from './BasicStrategy';
import {
  TRAIT_TYPES,
  INTERACTIVE_TRAITS
} from '../../../shared/evolutionConstants';

/**
 * 肉食型策略（中等難度）
 */
class CarnivoreStrategy extends BasicStrategy {
  constructor() {
    super();
    this.name = '肉食 AI';
    this.difficulty = 'medium';

    // 肉食策略偏好的性狀（優先級從高到低）
    this.preferredTraits = [
      TRAIT_TYPES.CARNIVORE,
      TRAIT_TYPES.SHARP_VISION,
      TRAIT_TYPES.MASSIVE,
      TRAIT_TYPES.AGILE,
      TRAIT_TYPES.FAT_TISSUE,
      TRAIT_TYPES.TRAMPLING
    ];
  }

  /**
   * 演化階段決策 - 偏好肉食性狀
   * @param {Object} gameState - 遊戲狀態
   * @param {string} playerId - AI 玩家 ID
   * @returns {Object} 動作物件
   */
  decideEvolutionAction(gameState, playerId) {
    const player = gameState.players[playerId];
    if (!player) return { type: 'pass' };

    const hand = player.hand || [];
    if (hand.length === 0) return { type: 'pass' };

    const creatures = player.creatures || [];

    // 如果沒有生物，必須創造生物
    if (creatures.length === 0) {
      return this.createCreatureAction(hand, playerId);
    }

    // 找出手牌中偏好的性狀
    const preferredCards = hand.filter(card =>
      this.preferredTraits.includes(card.traitType) &&
      !INTERACTIVE_TRAITS.includes(card.traitType)
    );

    if (preferredCards.length > 0) {
      // 優先賦予偏好的性狀
      const sortedCards = [...preferredCards].sort((a, b) => {
        const aIdx = this.preferredTraits.indexOf(a.traitType);
        const bIdx = this.preferredTraits.indexOf(b.traitType);
        return aIdx - bIdx;
      });

      // 找到最合適的目標生物
      for (const card of sortedCards) {
        const target = this.findBestCreatureForTrait(card.traitType, creatures);
        if (target) {
          return {
            type: 'addTrait',
            cardId: card.id,
            creatureId: target.id,
            traitType: card.traitType,
            playerId
          };
        }
      }
    }

    // 如果有多個生物，且手牌有足夠的牌，繼續創造生物
    if (creatures.length < 2 && hand.length >= 2 && Math.random() < 0.4) {
      return this.createCreatureAction(hand, playerId);
    }

    // 隨機出牌
    if (Math.random() < 0.6) {
      return this.addTraitAction(hand, creatures, playerId, gameState)
        || this.createCreatureAction(hand, playerId);
    }

    return { type: 'pass' };
  }

  /**
   * 為特定性狀找到最適合的生物
   * @param {string} traitType - 性狀類型
   * @param {Array} creatures - 生物列表
   * @returns {Object|null} 目標生物
   */
  findBestCreatureForTrait(traitType, creatures) {
    // 肉食性狀：選擇沒有肉食但也沒有腐食的生物
    if (traitType === TRAIT_TYPES.CARNIVORE) {
      return creatures.find(c =>
        !c.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE) &&
        !c.traits?.some(t => t.traitType === TRAIT_TYPES.SCAVENGER)
      );
    }

    // 銳目、敏捷：優先賦予肉食生物
    if ([TRAIT_TYPES.SHARP_VISION, TRAIT_TYPES.AGILE, TRAIT_TYPES.MASSIVE].includes(traitType)) {
      const carnivore = creatures.find(c =>
        c.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE) &&
        !c.traits?.some(t => t.traitType === traitType)
      );
      if (carnivore) return carnivore;
    }

    // 一般情況：選擇沒有此性狀的生物（脂肪可疊加）
    if (traitType === TRAIT_TYPES.FAT_TISSUE) {
      return creatures[Math.floor(Math.random() * creatures.length)];
    }

    return creatures.find(c =>
      !c.traits?.some(t => t.traitType === traitType)
    );
  }

  /**
   * 進食階段決策 - 優先攻擊
   * @param {Object} gameState - 遊戲狀態
   * @param {string} playerId - AI 玩家 ID
   * @returns {Object} 動作物件
   */
  decideFeedingAction(gameState, playerId) {
    const player = gameState.players[playerId];
    if (!player) return { type: 'pass' };

    const creatures = player.creatures || [];
    const foodPool = gameState.foodPool || 0;

    // 未吃飽的生物
    const hungryCreatures = creatures.filter(c => !c.isFed && !c.hibernating);
    if (hungryCreatures.length === 0) return { type: 'pass' };

    // 優先讓肉食生物攻擊
    const carnivores = hungryCreatures.filter(c =>
      c.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)
    );

    if (carnivores.length > 0) {
      // 選擇最強的肉食生物
      const bestCarnivore = this.selectBestCarnivore(carnivores);
      const attackAction = this.decideAttack(gameState, bestCarnivore, playerId);
      if (attackAction) return attackAction;
    }

    // 草食生物從食物池進食
    const herbivores = hungryCreatures.filter(c =>
      !c.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)
    );

    if (herbivores.length > 0 && foodPool > 0) {
      const creature = herbivores[0];
      return {
        type: 'feed',
        creatureId: creature.id,
        playerId
      };
    }

    return { type: 'pass' };
  }

  /**
   * 選擇最強的肉食生物
   * @param {Array} carnivores - 肉食生物列表
   * @returns {Object} 最強的肉食生物
   */
  selectBestCarnivore(carnivores) {
    // 偏好有銳目或敏捷的肉食生物
    const withSupportTraits = carnivores.filter(c =>
      c.traits?.some(t =>
        [TRAIT_TYPES.SHARP_VISION, TRAIT_TYPES.AGILE, TRAIT_TYPES.MASSIVE].includes(t.traitType)
      )
    );
    if (withSupportTraits.length > 0) return withSupportTraits[0];
    return carnivores[0];
  }

  /**
   * 攻擊目標選擇 - 優先攻擊弱小生物
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
          // 計算攻擊優先級（最少性狀的生物最脆弱）
          const traitCount = creature.traits?.length || 0;
          const isFed = creature.isFed ? 1 : 0;
          validTargets.push({
            creature,
            ownerId: opponent.id,
            // 優先選擇性狀少、吃飽的生物
            priority: traitCount * 2 - isFed * 3
          });
        }
      }
    }

    if (validTargets.length === 0) return null;

    // 選擇優先級最低的（最脆弱的）目標
    validTargets.sort((a, b) => a.priority - b.priority);
    const target = validTargets[0];

    return {
      type: 'attack',
      attackerCreatureId: carnivore.id,
      defenderCreatureId: target.creature.id,
      defenderPlayerId: target.ownerId,
      playerId
    };
  }
}

export default CarnivoreStrategy;
