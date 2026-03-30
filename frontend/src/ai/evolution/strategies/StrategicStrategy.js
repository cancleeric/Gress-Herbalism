/**
 * 演化論 AI - 策略型（困難難度 - 得分最大化）
 *
 * 根據目標（存活、得分）選擇最優性狀組合：
 * - 平衡創造生物數量和性狀質量
 * - 根據對手陣容調整策略
 * - 優先保護有性狀的高價值生物
 *
 * @module ai/evolution/strategies/StrategicStrategy
 */

import BasicStrategy from './BasicStrategy';
import {
  TRAIT_TYPES,
  INTERACTIVE_TRAITS
} from '../../../shared/evolutionConstants';

/**
 * 策略型（困難難度）
 */
class StrategicStrategy extends BasicStrategy {
  constructor() {
    super();
    this.name = '策略 AI';
    this.difficulty = 'hard';

    // 各性狀的評分（基於得分和生存價值）
    this.traitScores = {
      [TRAIT_TYPES.FAT_TISSUE]: 3,       // 食物儲存，高價值
      [TRAIT_TYPES.BURROWING]: 2,        // 防禦
      [TRAIT_TYPES.COOPERATION]: 2,      // 連動進食
      [TRAIT_TYPES.COMMUNICATION]: 2,    // 連動進食
      [TRAIT_TYPES.CARNIVORE]: 2,        // 進食+攻擊
      [TRAIT_TYPES.CAMOUFLAGE]: 2,       // 防禦
      [TRAIT_TYPES.HIBERNATION]: 1,      // 應急
      [TRAIT_TYPES.POISONOUS]: 1,        // 被動防禦
      [TRAIT_TYPES.TAIL_LOSS]: 1,        // 防禦
      [TRAIT_TYPES.SHARP_VISION]: 1,     // 肉食輔助
      [TRAIT_TYPES.AQUATIC]: 1,          // 防禦
      [TRAIT_TYPES.MASSIVE]: 1,          // 中性
      [TRAIT_TYPES.AGILE]: 1,            // 輔助防禦
      [TRAIT_TYPES.MIMICRY]: 1,          // 高級防禦
      [TRAIT_TYPES.TRAMPLING]: 1,        // 特殊
      [TRAIT_TYPES.SCAVENGER]: 1,        // 腐食
      [TRAIT_TYPES.ROBBERY]: 0,          // 情境性
      [TRAIT_TYPES.PARASITE]: -1,        // 放對手身上（策略性）
      [TRAIT_TYPES.SYMBIOSIS]: 1         // 連動
    };
  }

  /**
   * 演化階段決策 - 最大化得分
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
    const opponentHasManyCarnivores = this.checkOpponentCarnivores(gameState, playerId);

    // 如果沒有生物，創造生物
    if (creatures.length === 0) {
      return this.createCreatureAction(hand, playerId);
    }

    // 評估最佳動作
    const bestAction = this.evaluateBestAction(hand, creatures, gameState, playerId, opponentHasManyCarnivores);
    if (bestAction) return bestAction;

    // 考慮寄生蟲策略（放對手生物上）
    const parasiteAction = this.tryParasiteStrategy(hand, gameState, playerId);
    if (parasiteAction) return parasiteAction;

    return { type: 'pass' };
  }

  /**
   * 評估最佳動作
   */
  evaluateBestAction(hand, creatures, gameState, playerId, opponentHasManyCarnivores) {
    let bestScore = -Infinity;
    let bestAction = null;

    // 評估賦予每張牌給每隻生物的得分
    for (const card of hand) {
      if (INTERACTIVE_TRAITS.includes(card.traitType)) continue;
      if (card.traitType === TRAIT_TYPES.PARASITE) continue; // 寄生蟲另外處理

      for (const creature of creatures) {
        const score = this.evaluateTraitForCreature(card.traitType, creature, opponentHasManyCarnivores);
        if (score > bestScore && score > 0) {
          bestScore = score;
          bestAction = {
            type: 'addTrait',
            cardId: card.id,
            creatureId: creature.id,
            traitType: card.traitType,
            playerId
          };
        }
      }
    }

    // 評估創造新生物的得分（創造生物 +2 分 + 潛在食物）
    const createScore = this.evaluateCreateCreature(creatures, gameState);
    if (createScore > bestScore && hand.length > 0) {
      return this.createCreatureAction(hand, playerId);
    }

    return bestAction;
  }

  /**
   * 評估將性狀加到特定生物的得分
   */
  evaluateTraitForCreature(traitType, creature, opponentHasManyCarnivores) {
    const baseScore = this.traitScores[traitType] || 0;

    // 已有此性狀（脂肪除外）
    if (traitType !== TRAIT_TYPES.FAT_TISSUE &&
        creature.traits?.some(t => t.traitType === traitType)) {
      return -Infinity;
    }

    let bonus = 0;

    // 面對肉食威脅時，防禦性狀更有價值
    if (opponentHasManyCarnivores) {
      if ([TRAIT_TYPES.BURROWING, TRAIT_TYPES.CAMOUFLAGE, TRAIT_TYPES.AQUATIC,
           TRAIT_TYPES.POISONOUS, TRAIT_TYPES.TAIL_LOSS, TRAIT_TYPES.MASSIVE].includes(traitType)) {
        bonus += 2;
      }
    }

    // 肉食生物加銳目更有價值
    if (traitType === TRAIT_TYPES.SHARP_VISION &&
        creature.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)) {
      bonus += 2;
    }

    // 已有性狀的生物更值得保護
    const existingTraitCount = creature.traits?.length || 0;
    if ([TRAIT_TYPES.TAIL_LOSS, TRAIT_TYPES.MIMICRY].includes(traitType)) {
      bonus += existingTraitCount;
    }

    return baseScore + bonus;
  }

  /**
   * 評估創造新生物的得分
   */
  evaluateCreateCreature(creatures, gameState) {
    // 生物數量少時更值得創造
    if (creatures.length === 0) return 10;
    if (creatures.length === 1) return 3;
    if (creatures.length === 2) return 1;
    return 0; // 已有足夠生物
  }

  /**
   * 嘗試寄生蟲策略（放到對手生物上）
   */
  tryParasiteStrategy(hand, gameState, playerId) {
    const parasiteCard = hand.find(c => c.traitType === TRAIT_TYPES.PARASITE);
    if (!parasiteCard) return null;

    // 找對手最強的生物（最多性狀的）放寄生蟲
    let bestTarget = null;
    let mostTraits = 0;

    for (const [opId, opponent] of Object.entries(gameState.players)) {
      if (opId === playerId) continue;
      for (const creature of (opponent.creatures || [])) {
        const traitCount = creature.traits?.length || 0;
        const hasParasite = creature.traits?.some(t => t.traitType === TRAIT_TYPES.PARASITE);
        if (traitCount > mostTraits && !hasParasite) {
          mostTraits = traitCount;
          bestTarget = { creature, ownerId: opId };
        }
      }
    }

    if (bestTarget) {
      return {
        type: 'addTrait',
        cardId: parasiteCard.id,
        creatureId: bestTarget.creature.id,
        traitType: TRAIT_TYPES.PARASITE,
        targetPlayerId: bestTarget.ownerId,
        playerId
      };
    }

    return null;
  }

  /**
   * 檢查對手是否有很多肉食生物
   */
  checkOpponentCarnivores(gameState, playerId) {
    let carnivoreCount = 0;
    for (const [opId, opponent] of Object.entries(gameState.players)) {
      if (opId === playerId) continue;
      for (const creature of (opponent.creatures || [])) {
        if (creature.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE)) {
          carnivoreCount++;
        }
      }
    }
    return carnivoreCount >= 2;
  }

  /**
   * 進食階段決策 - 最大化存活和得分
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

    // 計算每隻生物的優先級
    const prioritized = this.prioritizeCreaturesForFeeding(hungryCreatures);

    for (const creature of prioritized) {
      const isCarnivore = creature.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE);

      if (isCarnivore) {
        // 肉食：選擇最優目標
        const attackAction = this.decideStrategicAttack(gameState, creature, playerId);
        if (attackAction) return attackAction;
      } else if (foodPool > 0) {
        // 草食：從食物池進食
        return {
          type: 'feed',
          creatureId: creature.id,
          playerId
        };
      }
    }

    // 使用冬眠作為最後手段
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

    return { type: 'pass' };
  }

  /**
   * 計算每隻生物的進食優先級
   */
  prioritizeCreaturesForFeeding(creatures) {
    return [...creatures].sort((a, b) => {
      // 有更多性狀的生物更值得優先喂食（保留得分點）
      const aTraitCount = a.traits?.length || 0;
      const bTraitCount = b.traits?.length || 0;
      return bTraitCount - aTraitCount;
    });
  }

  /**
   * 策略性攻擊選擇 - 優先消滅有價值的目標
   */
  decideStrategicAttack(gameState, carnivore, playerId) {
    const allPlayers = Object.values(gameState.players);
    const validTargets = [];

    for (const opponent of allPlayers) {
      if (opponent.id === playerId) continue;
      for (const creature of (opponent.creatures || [])) {
        if (this.canAttack(carnivore, creature)) {
          // 計算攻擊價值：消滅高性狀生物更有利
          const traitCount = creature.traits?.length || 0;
          const hasParasite = creature.traits?.some(t => t.traitType === TRAIT_TYPES.PARASITE);
          validTargets.push({
            creature,
            ownerId: opponent.id,
            // 優先消滅寄生蟲宿主，其次是性狀多的生物
            attackValue: (hasParasite ? 0 : 5) + traitCount
          });
        }
      }
    }

    if (validTargets.length === 0) return null;

    // 選擇攻擊價值最低的目標（消滅對手的弱小生物，減少其得分）
    validTargets.sort((a, b) => a.attackValue - b.attackValue);
    const target = validTargets[0];

    return {
      type: 'attack',
      attackerCreatureId: carnivore.id,
      defenderCreatureId: target.creature.id,
      defenderPlayerId: target.ownerId,
      playerId
    };
  }

  /**
   * 防禦回應決策 - 智能防禦
   */
  decideDefenseResponse(gameState, pendingAttack, playerId) {
    const player = gameState.players[playerId];
    if (!player) return { type: 'defenseResponse', response: 'accept' };

    const defender = player.creatures?.find(c => c.id === pendingAttack.defenderCreatureId);
    if (!defender) return { type: 'defenseResponse', response: 'accept' };

    const defenderTraitCount = defender.traits?.length || 0;

    // 如果生物有大量性狀，積極防禦
    if (defenderTraitCount >= 2) {
      // 優先使用斷尾
      const tailLossTrait = defender.traits?.find(t => t.traitType === TRAIT_TYPES.TAIL_LOSS);
      if (tailLossTrait) {
        return {
          type: 'defenseResponse',
          response: 'tailLoss',
          traitId: tailLossTrait.id,
          playerId
        };
      }

      // 使用擬態
      const mimicryTrait = defender.traits?.find(t => t.traitType === TRAIT_TYPES.MIMICRY);
      if (mimicryTrait && !defender.usedMimicryThisTurn) {
        const otherCreatures = player.creatures?.filter(c => c.id !== defender.id);
        if (otherCreatures?.length > 0) {
          // 選擇性狀最少的生物作為替代目標
          const sacrificeTarget = [...otherCreatures].sort((a, b) =>
            (a.traits?.length || 0) - (b.traits?.length || 0)
          )[0];
          return {
            type: 'defenseResponse',
            response: 'mimicry',
            alternativeTargetId: sacrificeTarget.id,
            playerId
          };
        }
      }

      // 使用敏捷
      const agileTrait = defender.traits?.find(t => t.traitType === TRAIT_TYPES.AGILE);
      if (agileTrait) {
        return {
          type: 'defenseResponse',
          response: 'agile',
          playerId
        };
      }
    }

    return { type: 'defenseResponse', response: 'accept', playerId };
  }
}

export default StrategicStrategy;
