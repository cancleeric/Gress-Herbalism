/**
 * 演化論 - 肉食攻擊策略
 *
 * 積極建立肉食生物並攻擊對手。
 *
 * @module ai/evolution/CarnivoreStrategy
 */

import { EVOLUTION_ACTION, FEEDING_ACTION } from './BasicStrategy';

/** 防禦性狀（用於評估攻擊難度） */
const DEFENSE_TRAITS = ['camouflage', 'burrowing', 'poisonous', 'aquatic', 'agile'];

/**
 * 肉食攻擊策略
 *
 * 行為特點：
 * - 演化階段：前 3 張牌中用 2 張建立生物，其餘優先加肉食或銳目性狀
 * - 進食階段：若有肉食生物則積極攻擊，優先選擇性狀最多的目標
 */
class CarnivoreStrategy {
  constructor() {
    this.name = 'CarnivoreStrategy';
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

    // 前 3 張手牌中至多 2 張用來建立生物
    const maxCreatures = Math.min(2, Math.ceil(hand.length * 0.6));
    if (creatures.length < maxCreatures) {
      const card = hand[Math.floor(Math.random() * hand.length)];
      return { type: EVOLUTION_ACTION.CREATE_CREATURE, cardId: card.id };
    }

    if (creatures.length === 0) {
      return { type: EVOLUTION_ACTION.PASS };
    }

    // 找尚未有肉食性狀的生物
    const nonCarnivores = creatures.filter(c => !this._hasTrait(c, 'carnivore'));
    if (nonCarnivores.length > 0 && hand.length > 0) {
      const card = hand[Math.floor(Math.random() * hand.length)];
      const creature = nonCarnivores[Math.floor(Math.random() * nonCarnivores.length)];
      return {
        type: EVOLUTION_ACTION.ADD_TRAIT,
        cardId: card.id,
        creatureId: creature.id
      };
    }

    // 肉食生物再加銳目性狀
    const carnivoresWithoutVision = creatures.filter(
      c => this._hasTrait(c, 'carnivore') && !this._hasTrait(c, 'sharpVision')
    );
    if (carnivoresWithoutVision.length > 0 && hand.length > 0) {
      const card = hand[Math.floor(Math.random() * hand.length)];
      const creature = carnivoresWithoutVision[Math.floor(Math.random() * carnivoresWithoutVision.length)];
      return {
        type: EVOLUTION_ACTION.ADD_TRAIT,
        cardId: card.id,
        creatureId: creature.id
      };
    }

    return { type: EVOLUTION_ACTION.PASS };
  }

  /**
   * 進食階段：決定動作
   *
   * 肉食生物優先攻擊，目標選擇性狀最多的對手生物。
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @param {string} selfId - 自己的玩家 ID
   * @returns {Object} 動作物件
   */
  decideFeedingAction(gameState, selfId) {
    const player = gameState.players[selfId];
    if (!player) return { type: FEEDING_ACTION.PASS };

    const unfeeds = (player.creatures || []).filter(c => !c.hasFed);
    if (unfeeds.length === 0) return { type: FEEDING_ACTION.PASS };

    // 肉食生物優先出擊
    const carnivores = unfeeds.filter(c => this._hasTrait(c, 'carnivore'));
    for (const attacker of carnivores) {
      const target = this._findBestTarget(gameState, selfId, attacker);
      if (target) {
        return {
          type: FEEDING_ACTION.ATTACK,
          attackerCreatureId: attacker.id,
          targetCreatureId: target.creatureId,
          targetPlayerId: target.playerId
        };
      }
    }

    // 沒有可攻擊目標時，普通進食
    if (gameState.foodPool <= 0) return { type: FEEDING_ACTION.PASS };
    const normalFeeders = unfeeds.filter(c => !this._hasTrait(c, 'carnivore'));
    if (normalFeeders.length === 0) return { type: FEEDING_ACTION.PASS };

    return { type: FEEDING_ACTION.FEED, creatureId: normalFeeders[0].id };
  }

  /**
   * 尋找最佳攻擊目標（性狀最多，即被吃掉損失最大）
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {string} selfId - 自己的玩家 ID
   * @param {Object} attacker - 攻擊生物
   * @returns {Object|null} 包含 playerId 和 creatureId 的目標，或 null
   */
  _findBestTarget(gameState, selfId, attacker) {
    let best = null;
    let bestScore = -1;

    for (const [playerId, player] of Object.entries(gameState.players)) {
      if (playerId === selfId) continue;
      for (const creature of (player.creatures || [])) {
        // 有毒液風險評估 — 仍然攻擊但降低優先級
        const defenseCount = (creature.traits || []).filter(t =>
          DEFENSE_TRAITS.includes(t.traitType)
        ).length;
        const traitCount = (creature.traits || []).length;
        // 分數 = 性狀數 - 防禦分（高性狀但高防禦也值得攻擊）
        const score = traitCount - defenseCount * 0.5;
        if (score > bestScore) {
          bestScore = score;
          best = { playerId, creatureId: creature.id };
        }
      }
    }

    return best;
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
 * 建立 CarnivoreStrategy 實例的工廠函數
 *
 * @returns {CarnivoreStrategy}
 */
export function createCarnivoreStrategy() {
  return new CarnivoreStrategy();
}

export default CarnivoreStrategy;
