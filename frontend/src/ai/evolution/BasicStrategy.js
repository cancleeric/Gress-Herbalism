/**
 * 演化論 - 基礎隨機策略
 *
 * 所有決策均隨機，適合作為最簡單的對手或測試基準。
 *
 * @module ai/evolution/BasicStrategy
 */

/**
 * 演化階段的可用動作類型
 */
export const EVOLUTION_ACTION = {
  CREATE_CREATURE: 'createCreature',
  ADD_TRAIT: 'addTrait',
  PASS: 'pass'
};

/**
 * 進食階段的可用動作類型
 */
export const FEEDING_ACTION = {
  FEED: 'feed',
  ATTACK: 'attack',
  PASS: 'pass'
};

/** 每回合主動跳過的機率 */
const PASS_PROBABILITY = 0.33;

/**
 * 基礎隨機策略
 *
 * 行為特點：
 * - 演化階段：隨機選擇建立生物、新增性狀或跳過
 * - 進食階段：隨機選擇進食的生物或跳過
 */
class BasicStrategy {
  constructor() {
    this.name = 'BasicStrategy';
  }

  /**
   * 演化階段：決定動作
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @param {string} selfId - 自己的玩家 ID
   * @returns {Object} 動作物件
   */
  decideEvolutionAction(gameState, selfId) {
    const player = gameState.players[selfId];
    if (!player) return { type: EVOLUTION_ACTION.PASS };

    const hand = player.hand || [];
    const creatures = player.creatures || [];

    if (hand.length === 0) return { type: EVOLUTION_ACTION.PASS };

    // 隨機跳過
    if (Math.random() < PASS_PROBABILITY) return { type: EVOLUTION_ACTION.PASS };

    const randomCard = hand[Math.floor(Math.random() * hand.length)];

    // 若沒有生物，必須先建立生物
    if (creatures.length === 0) {
      return { type: EVOLUTION_ACTION.CREATE_CREATURE, cardId: randomCard.id };
    }

    // 50% 機率建立生物，50% 機率新增性狀
    if (Math.random() < 0.5) {
      return { type: EVOLUTION_ACTION.CREATE_CREATURE, cardId: randomCard.id };
    }

    const randomCreature = creatures[Math.floor(Math.random() * creatures.length)];
    return {
      type: EVOLUTION_ACTION.ADD_TRAIT,
      cardId: randomCard.id,
      creatureId: randomCreature.id
    };
  }

  /**
   * 進食階段：決定動作
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @param {string} selfId - 自己的玩家 ID
   * @returns {Object} 動作物件
   */
  decideFeedingAction(gameState, selfId) {
    const player = gameState.players[selfId];
    if (!player) return { type: FEEDING_ACTION.PASS };

    const creatures = (player.creatures || []).filter(c => !c.hasFed);
    if (creatures.length === 0 || gameState.foodPool <= 0) {
      return { type: FEEDING_ACTION.PASS };
    }

    const randomCreature = creatures[Math.floor(Math.random() * creatures.length)];

    // 肉食生物嘗試攻擊
    if (this._hasTrait(randomCreature, 'carnivore')) {
      const target = this._findRandomTarget(gameState, selfId, randomCreature);
      if (target) {
        return {
          type: FEEDING_ACTION.ATTACK,
          attackerCreatureId: randomCreature.id,
          targetCreatureId: target.creatureId,
          targetPlayerId: target.playerId
        };
      }
    }

    return { type: FEEDING_ACTION.FEED, creatureId: randomCreature.id };
  }

  /**
   * 在對手中隨機尋找可攻擊目標
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {string} selfId - 自己的玩家 ID
   * @param {Object} attacker - 攻擊生物
   * @returns {Object|null} 包含 playerId 和 creatureId 的目標，或 null
   */
  _findRandomTarget(gameState, selfId, attacker) {
    const targets = [];
    for (const [playerId, player] of Object.entries(gameState.players)) {
      if (playerId === selfId) continue;
      for (const creature of (player.creatures || [])) {
        targets.push({ playerId, creatureId: creature.id });
      }
    }
    if (targets.length === 0) return null;
    return targets[Math.floor(Math.random() * targets.length)];
  }

  /**
   * 檢查生物是否具有特定性狀
   *
   * @param {Object} creature - 生物物件
   * @param {string} traitType - 性狀類型
   * @returns {boolean}
   */
  _hasTrait(creature, traitType) {
    return (creature.traits || []).some(t => t.traitType === traitType);
  }
}

/**
 * 建立 BasicStrategy 實例的工廠函數
 *
 * @returns {BasicStrategy}
 */
export function createBasicStrategy() {
  return new BasicStrategy();
}

export default BasicStrategy;
