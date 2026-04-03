/**
 * 演化論 - 策略型 AI
 *
 * 以目標為導向，平衡生物數量與性狀數量以最大化得分。
 * 計分規則：每隻生物 +2 分，每個性狀 +1 分。
 *
 * @module ai/evolution/StrategicStrategy
 */

import { EVOLUTION_ACTION, FEEDING_ACTION } from './BasicStrategy';

/** 觸發跳過的平均性狀數閾值 */
const IDEAL_AVG_TRAITS = 2;

/** 性狀已足夠時跳過的機率 */
const BALANCED_PASS_PROBABILITY = 0.4;

/**
 * 策略型策略
 *
 * 行為特點：
 * - 演化階段：傾向每 2 張牌建立 1 隻生物，其餘用於新增性狀
 * - 進食階段：優先餵食性狀最多的生物（性狀越多得分越高）
 */
class StrategicStrategy {
  constructor() {
    this.name = 'StrategicStrategy';
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

    const randomCard = hand[Math.floor(Math.random() * hand.length)];

    // 若沒有生物，必須先建立
    if (creatures.length === 0) {
      return { type: EVOLUTION_ACTION.CREATE_CREATURE, cardId: randomCard.id };
    }

    // 目標比例：每 2 張牌擁有 1 隻生物，其餘加性狀
    const idealCreatureCount = Math.floor(hand.length / 2) + 1;

    if (creatures.length < idealCreatureCount) {
      return { type: EVOLUTION_ACTION.CREATE_CREATURE, cardId: randomCard.id };
    }

    // 比例已平衡 → 優先幫性狀最少的生物加性狀
    const sortedCreatures = [...creatures].sort(
      (a, b) => (a.traits || []).length - (b.traits || []).length
    );
    const targetCreature = sortedCreatures[0];

    // 若已有足夠性狀，考慮跳過
    const avgTraits = creatures.reduce((sum, c) => sum + (c.traits || []).length, 0) / creatures.length;
    if (avgTraits >= IDEAL_AVG_TRAITS && Math.random() < BALANCED_PASS_PROBABILITY) {
      return { type: EVOLUTION_ACTION.PASS };
    }

    return {
      type: EVOLUTION_ACTION.ADD_TRAIT,
      cardId: randomCard.id,
      creatureId: targetCreature.id
    };
  }

  /**
   * 進食階段：決定動作
   *
   * 優先餵食性狀最多（得分最高）的生物。
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @param {string} selfId - 自己的玩家 ID
   * @returns {Object} 動作物件
   */
  decideFeedingAction(gameState, selfId) {
    const player = gameState.players[selfId];
    if (!player) return { type: FEEDING_ACTION.PASS };

    const unfeeds = (player.creatures || []).filter(c => !c.hasFed);
    if (unfeeds.length === 0 || gameState.foodPool <= 0) {
      return { type: FEEDING_ACTION.PASS };
    }

    // 選擇性狀最多的生物優先進食
    const sorted = [...unfeeds].sort(
      (a, b) => (b.traits || []).length - (a.traits || []).length
    );
    const target = sorted[0];

    return { type: FEEDING_ACTION.FEED, creatureId: target.id };
  }
}

/**
 * 建立 StrategicStrategy 實例的工廠函數
 *
 * @returns {StrategicStrategy}
 */
export function createStrategicStrategy() {
  return new StrategicStrategy();
}

export default StrategicStrategy;
