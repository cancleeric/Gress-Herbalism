/**
 * 演化論 AI - 防禦策略（中等難度 - 防禦型）
 *
 * 偏好防禦策略：
 * - 優先賦予防禦性狀（穴居、偽裝、毒液、水生）
 * - 避免攻擊，穩健進食
 * - 利用脂肪儲存食物
 *
 * @module ai/evolution/strategies/DefenseStrategy
 */

import BasicStrategy from './BasicStrategy';
import {
  TRAIT_TYPES,
  INTERACTIVE_TRAITS
} from '../../../shared/evolutionConstants';

/**
 * 防禦型策略（中等難度）
 */
class DefenseStrategy extends BasicStrategy {
  constructor() {
    super();
    this.name = '防禦 AI';
    this.difficulty = 'medium';

    // 防禦策略偏好的性狀（優先級從高到低）
    this.preferredTraits = [
      TRAIT_TYPES.BURROWING,
      TRAIT_TYPES.CAMOUFLAGE,
      TRAIT_TYPES.POISONOUS,
      TRAIT_TYPES.AQUATIC,
      TRAIT_TYPES.FAT_TISSUE,
      TRAIT_TYPES.TAIL_LOSS,
      TRAIT_TYPES.MIMICRY,
      TRAIT_TYPES.HIBERNATION,
      TRAIT_TYPES.AGILE
    ];
  }

  /**
   * 演化階段決策 - 偏好防禦性狀
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

    // 如果沒有生物，創造生物
    if (creatures.length === 0) {
      return this.createCreatureAction(hand, playerId);
    }

    // 優先賦予偏好的防禦性狀
    const preferredCards = hand.filter(card =>
      this.preferredTraits.includes(card.traitType) &&
      !INTERACTIVE_TRAITS.includes(card.traitType)
    );

    if (preferredCards.length > 0) {
      const sortedCards = [...preferredCards].sort((a, b) => {
        const aIdx = this.preferredTraits.indexOf(a.traitType);
        const bIdx = this.preferredTraits.indexOf(b.traitType);
        return aIdx - bIdx;
      });

      for (const card of sortedCards) {
        const target = this.findBestCreatureForDefenseTrait(card.traitType, creatures);
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

    // 創造更多生物以增加得分點
    if (creatures.length < 3 && hand.length >= 2 && Math.random() < 0.5) {
      return this.createCreatureAction(hand, playerId);
    }

    // 使用其他手牌
    const nonInteractiveCards = hand.filter(card =>
      !INTERACTIVE_TRAITS.includes(card.traitType)
    );
    if (nonInteractiveCards.length > 0 && Math.random() < 0.5) {
      return this.addTraitAction(nonInteractiveCards, creatures, playerId, gameState)
        || { type: 'pass' };
    }

    return { type: 'pass' };
  }

  /**
   * 為防禦性狀找到最適合的生物
   * @param {string} traitType - 性狀類型
   * @param {Array} creatures - 生物列表
   * @returns {Object|null} 目標生物
   */
  findBestCreatureForDefenseTrait(traitType, creatures) {
    // 穴居：沒有穴居的生物
    // 偽裝：沒有偽裝的生物
    // 毒液：沒有毒液的生物
    // 水生：沒有水生的生物
    if ([TRAIT_TYPES.BURROWING, TRAIT_TYPES.CAMOUFLAGE, TRAIT_TYPES.POISONOUS, TRAIT_TYPES.AQUATIC, TRAIT_TYPES.MIMICRY].includes(traitType)) {
      return creatures.find(c =>
        !c.traits?.some(t => t.traitType === traitType)
      );
    }

    // 斷尾：有價值的生物（有多個性狀的）
    if (traitType === TRAIT_TYPES.TAIL_LOSS) {
      return creatures
        .filter(c => !c.traits?.some(t => t.traitType === traitType))
        .sort((a, b) => (b.traits?.length || 0) - (a.traits?.length || 0))[0] || null;
    }

    // 脂肪：可疊加，隨機選
    if (traitType === TRAIT_TYPES.FAT_TISSUE) {
      return creatures[Math.floor(Math.random() * creatures.length)];
    }

    // 冬眠：沒有冬眠的生物
    if (traitType === TRAIT_TYPES.HIBERNATION) {
      return creatures.find(c =>
        !c.traits?.some(t => t.traitType === TRAIT_TYPES.HIBERNATION)
      );
    }

    return creatures.find(c =>
      !c.traits?.some(t => t.traitType === traitType)
    );
  }

  /**
   * 進食階段決策 - 穩健進食，不攻擊
   * @param {Object} gameState - 遊戲狀態
   * @param {string} playerId - AI 玩家 ID
   * @returns {Object} 動作物件
   */
  decideFeedingAction(gameState, playerId) {
    const player = gameState.players[playerId];
    if (!player) return { type: 'pass' };

    const creatures = player.creatures || [];
    const foodPool = gameState.foodPool || 0;

    const hungryCreatures = creatures.filter(c => !c.isFed && !c.hibernating);
    if (hungryCreatures.length === 0) return { type: 'pass' };

    // 草食生物優先從食物池進食
    const herbivores = hungryCreatures.filter(c =>
      !c.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)
    );

    if (herbivores.length > 0 && foodPool > 0) {
      // 優先讓最需要食物的生物進食
      const prioritized = this.prioritizeForFeeding(herbivores);
      return {
        type: 'feed',
        creatureId: prioritized.id,
        playerId
      };
    }

    // 使用冬眠（如果有且食物不足）
    if (foodPool === 0) {
      const hibernatableCreature = hungryCreatures.find(c =>
        c.traits?.some(t => t.traitType === TRAIT_TYPES.HIBERNATION) && !c.hibernated
      );
      if (hibernatableCreature) {
        return {
          type: 'hibernate',
          creatureId: hibernatableCreature.id,
          playerId
        };
      }
    }

    // 肉食生物：如果必要才攻擊
    const carnivores = hungryCreatures.filter(c =>
      c.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)
    );
    if (carnivores.length > 0) {
      const attackAction = this.decideAttack(gameState, carnivores[0], playerId);
      if (attackAction) return attackAction;
    }

    return { type: 'pass' };
  }

  /**
   * 選擇最需要進食的生物
   * @param {Array} creatures - 生物列表
   * @returns {Object} 最需要進食的生物
   */
  prioritizeForFeeding(creatures) {
    // 優先選擇有穴居但還沒吃飽的生物（穴居吃飽後免疫攻擊）
    const withBurrowing = creatures.filter(c =>
      c.traits?.some(t => t.traitType === TRAIT_TYPES.BURROWING)
    );
    if (withBurrowing.length > 0) return withBurrowing[0];
    return creatures[0];
  }

  /**
   * 防禦回應決策 - 積極使用防禦性狀
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

    // 優先使用斷尾（保存生物）
    const tailLossTrait = defender.traits?.find(t => t.traitType === TRAIT_TYPES.TAIL_LOSS);
    if (tailLossTrait) {
      return {
        type: 'defenseResponse',
        response: 'tailLoss',
        traitId: tailLossTrait.id,
        playerId
      };
    }

    // 使用擬態（如果有其他可攻擊的生物）
    const mimicryTrait = defender.traits?.find(t => t.traitType === TRAIT_TYPES.MIMICRY);
    if (mimicryTrait && !defender.usedMimicryThisTurn) {
      const otherCreatures = player.creatures?.filter(c =>
        c.id !== defender.id && !c.isFed
      );
      if (otherCreatures?.length > 0) {
        return {
          type: 'defenseResponse',
          response: 'mimicry',
          alternativeTargetId: otherCreatures[0].id,
          playerId
        };
      }
    }

    // 使用敏捷（擲骰逃脫）
    const agileTrait = defender.traits?.find(t => t.traitType === TRAIT_TYPES.AGILE);
    if (agileTrait) {
      return {
        type: 'defenseResponse',
        response: 'agile',
        playerId
      };
    }

    return { type: 'defenseResponse', response: 'accept', playerId };
  }
}

export default DefenseStrategy;
