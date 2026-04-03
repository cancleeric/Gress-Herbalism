/**
 * 演化論 - 防禦型策略
 *
 * 優先為生物加裝防禦性狀，降低被肉食攻擊的風險。
 *
 * @module ai/evolution/DefenseStrategy
 */

import { EVOLUTION_ACTION, FEEDING_ACTION } from './BasicStrategy';

/** 偏好新增的防禦性狀（依優先順序） */
const PREFERRED_DEFENSE_TRAITS = [
  'camouflage',  // 偽裝
  'burrowing',   // 穴居
  'aquatic',     // 水生
  'agile',       // 敏捷
  'poisonous',   // 毒液
  'tailLoss',    // 斷尾
  'mimicry'      // 擬態
];

/** 有防禦的生物決定強化而非新增生物的機率 */
const REINFORCE_PROBABILITY = 0.5;

/** 觸發新增生物的機率（當所有生物都已有防禦時） */
const NEW_CREATURE_PROBABILITY = 0.4;

/**
 * 防禦型策略
 *
 * 行為特點：
 * - 演化階段：優先為現有生物加裝防禦性狀；若無生物才建立新生物
 * - 進食階段：正常進食，不主動攻擊
 */
class DefenseStrategy {
  constructor() {
    this.name = 'DefenseStrategy';
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

    // 若無生物先建立
    if (creatures.length === 0) {
      return { type: EVOLUTION_ACTION.CREATE_CREATURE, cardId: randomCard.id };
    }

    // 尋找防禦性狀不足的生物（沒有任何防禦性狀）
    const undefendedCreatures = creatures.filter(c =>
      !PREFERRED_DEFENSE_TRAITS.some(trait => this._hasTrait(c, trait))
    );

    if (undefendedCreatures.length > 0) {
      const creature = undefendedCreatures[Math.floor(Math.random() * undefendedCreatures.length)];
      return {
        type: EVOLUTION_ACTION.ADD_TRAIT,
        cardId: randomCard.id,
        creatureId: creature.id
      };
    }

    // 所有生物都有防禦性狀 → 繼續強化或建立新生物（機率各半）
    if (Math.random() < REINFORCE_PROBABILITY && hand.length > 1) {
      // 加更多防禦性狀給防禦最少的生物
      const sorted = [...creatures].sort(
        (a, b) => this._defenseCount(a) - this._defenseCount(b)
      );
      return {
        type: EVOLUTION_ACTION.ADD_TRAIT,
        cardId: randomCard.id,
        creatureId: sorted[0].id
      };
    }

    // 建立新生物
    if (Math.random() < NEW_CREATURE_PROBABILITY) {
      return { type: EVOLUTION_ACTION.CREATE_CREATURE, cardId: randomCard.id };
    }

    return { type: EVOLUTION_ACTION.PASS };
  }

  /**
   * 進食階段：決定動作
   *
   * 防禦策略不主動攻擊，正常進食。
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

    // 優先餵食防禦性狀最多的生物（確保高價值生物存活）
    const sorted = [...unfeeds].sort(
      (a, b) => this._defenseCount(b) - this._defenseCount(a)
    );

    return { type: FEEDING_ACTION.FEED, creatureId: sorted[0].id };
  }

  /**
   * 計算生物的防禦性狀數量
   *
   * @param {Object} creature - 生物物件
   * @returns {number}
   */
  _defenseCount(creature) {
    return (creature.traits || []).filter(t =>
      PREFERRED_DEFENSE_TRAITS.includes(t.traitType)
    ).length;
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
 * 建立 DefenseStrategy 實例的工廠函數
 *
 * @returns {DefenseStrategy}
 */
export function createDefenseStrategy() {
  return new DefenseStrategy();
}

export default DefenseStrategy;
