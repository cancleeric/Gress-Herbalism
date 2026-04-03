/**
 * 噴墨性狀處理器
 * @module expansions/deepSea/traits/handlers/InkSquirtHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 噴墨性狀處理器
 *
 * 噴墨生物特性：
 * - 每回合一次，被攻擊時可標記攻擊者，使其本回合無法再發動攻擊
 * - 透過在攻擊者上設定 inkSprayed = true 實現
 */
class InkSquirtHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.INK_SQUIRT]);
  }

  /**
   * 被攻擊時噴墨，阻止攻擊者本回合繼續攻擊
   * @returns {Object} 防禦回應，包含噴墨效果
   */
  getDefenseResponse(context) {
    const { defender, gameState } = context;
    const inkTrait = defender.traits?.find(t => t.type === DEEP_SEA_TRAIT_TYPES.INK_SQUIRT);

    // 每回合只能使用一次
    if (inkTrait && inkTrait.usedThisTurn) {
      return { hasResponse: false };
    }

    return {
      hasResponse: true,
      type: 'INK_SQUIRT',
      description: '噴墨：攻擊者本回合無法再發動攻擊',
    };
  }

  /**
   * 處理噴墨防禦回應
   */
  handleDefenseResponse(context, response) {
    const { attacker, defender, gameState } = context;

    if (response.type !== 'INK_SQUIRT') {
      return gameState;
    }

    // 標記噴墨已使用
    const inkTrait = defender.traits?.find(t => t.type === DEEP_SEA_TRAIT_TYPES.INK_SQUIRT);
    if (inkTrait) {
      inkTrait.usedThisTurn = true;
    }

    // 標記攻擊者被噴墨，本回合無法再攻擊
    attacker.inkSprayed = true;
    attacker.hasAttackedThisTurn = true;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'INK_SQUIRT_TRIGGERED',
      defenderCreatureId: defender.id,
      attackerCreatureId: attacker.id,
    });

    return gameState;
  }

  /**
   * 回合開始重置狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;
    if (creature) {
      // 重置噴墨已使用狀態
      const inkTrait = creature.traits?.find(t => t.type === DEEP_SEA_TRAIT_TYPES.INK_SQUIRT);
      if (inkTrait) {
        inkTrait.usedThisTurn = false;
      }
      // 重置被噴墨狀態
      delete creature.inkSprayed;
    }
    return gameState;
  }
}

module.exports = InkSquirtHandler;
