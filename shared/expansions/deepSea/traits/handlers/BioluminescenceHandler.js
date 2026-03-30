/**
 * 發光性狀處理器
 * @module expansions/deepSea/traits/handlers/BioluminescenceHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 發光性狀處理器
 *
 * 發光生物特性：
 * - 每進食階段一次，可照亮目標生物
 * - 被照亮的生物本階段失去偽裝（camouflage）和穴居（burrowing）的防禦效果
 */
class BioluminescenceHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]);
  }

  /**
   * 回合開始時重置發光狀態
   */
  onPhaseStart(context, phase) {
    const { creature, gameState } = context;
    if (phase === 'feeding' && creature) {
      creature.bioluminescenceUsed = false;
    }
    return gameState;
  }

  /**
   * 檢查是否可以使用發光能力
   */
  canUseAbility(context) {
    const { creature, gameState } = context;

    if (creature.bioluminescenceUsed) {
      return { canUse: false, reason: '本階段已使用過發光能力' };
    }

    const targets = this.getAbilityTargets(context);
    if (targets.length === 0) {
      return { canUse: false, reason: '沒有可照亮的目標（需要擁有偽裝或穴居的生物）' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 取得可照亮的目標（擁有偽裝或穴居的生物）
   */
  getAbilityTargets(context) {
    const { creature, gameState } = context;
    const targets = [];

    for (const player of gameState.players || []) {
      for (const target of player.creatures || []) {
        if (target.id === creature.id) continue;

        const hasCamouflage = target.traits?.some(t => t.type === 'camouflage');
        const hasBurrowing = target.traits?.some(t => t.type === 'burrowing');

        if (hasCamouflage || hasBurrowing) {
          targets.push({
            creatureId: target.id,
            ownerId: player.id,
            hasCamouflage,
            hasBurrowing,
          });
        }
      }
    }

    return targets;
  }

  /**
   * 使用發光能力照亮目標，使其防禦效果在本階段失效
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    // 標記已使用
    creature.bioluminescenceUsed = true;

    // 找到目標生物並標記為被照亮
    let targetCreature = null;
    for (const player of gameState.players || []) {
      for (const c of player.creatures || []) {
        if (c.id === target.creatureId) {
          targetCreature = c;
          break;
        }
      }
      if (targetCreature) break;
    }

    if (targetCreature) {
      targetCreature.isIlluminated = true;

      if (!gameState.actionLog) {
        gameState.actionLog = [];
      }
      gameState.actionLog.push({
        type: 'BIOLUMINESCENCE_USED',
        sourceId: creature.id,
        targetId: targetCreature.id,
        message: `發光照亮了生物 [${targetCreature.id}]，其偽裝與穴居防禦本階段失效`,
      });
    }

    return {
      success: true,
      gameState,
      message: '發光照亮目標',
    };
  }

  /**
   * 進食階段結束後清除照亮標記
   */
  onPhaseEnd(context, phase) {
    const { gameState } = context;
    if (phase === 'feeding') {
      for (const player of gameState.players || []) {
        for (const creature of player.creatures || []) {
          delete creature.isIlluminated;
        }
      }
    }
    return gameState;
  }
}

module.exports = BioluminescenceHandler;
