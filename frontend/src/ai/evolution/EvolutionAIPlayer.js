/**
 * 演化論 AI 玩家類別
 *
 * 管理演化論遊戲中 AI 玩家的決策流程。
 * 支援四種策略：基礎隨機、策略型、肉食攻擊、防禦型。
 *
 * @module ai/evolution/EvolutionAIPlayer
 */

import { AI_DIFFICULTY, AI_THINK_DELAY, PLAYER_TYPE, isValidAIDifficulty, getAIPlayerName } from '../../shared/constants';
import BasicStrategy from './BasicStrategy';
import StrategicStrategy from './StrategicStrategy';
import CarnivoreStrategy from './CarnivoreStrategy';
import DefenseStrategy from './DefenseStrategy';

/**
 * 演化論遊戲 AI 策略類型
 */
export const EVOLUTION_AI_STRATEGY = {
  BASIC: 'basic',
  STRATEGIC: 'strategic',
  CARNIVORE: 'carnivore',
  DEFENSE: 'defense'
};

/**
 * 難度對應的預設策略
 */
const DIFFICULTY_STRATEGY_MAP = {
  [AI_DIFFICULTY.EASY]: EVOLUTION_AI_STRATEGY.BASIC,
  [AI_DIFFICULTY.MEDIUM]: EVOLUTION_AI_STRATEGY.STRATEGIC,
  [AI_DIFFICULTY.HARD]: EVOLUTION_AI_STRATEGY.CARNIVORE
};

/**
 * 演化論 AI 玩家類別
 */
class EvolutionAIPlayer {
  /**
   * 建立演化論 AI 玩家
   *
   * @param {string} id - 玩家唯一識別碼
   * @param {string} name - 玩家名稱
   * @param {string} difficulty - 難度級別 (easy/medium/hard)
   * @param {string} [strategyType] - 指定策略類型，未提供則依難度決定
   */
  constructor(id, name, difficulty = AI_DIFFICULTY.MEDIUM, strategyType) {
    if (!isValidAIDifficulty(difficulty)) {
      console.warn(`Invalid AI difficulty: ${difficulty}, using medium`);
      difficulty = AI_DIFFICULTY.MEDIUM;
    }

    this.id = id;
    this.name = name || getAIPlayerName(0, difficulty);
    this.isAI = true;
    this.playerType = PLAYER_TYPE.AI;
    this.difficulty = difficulty;

    // 遊戲狀態屬性
    this.hand = [];
    this.creatures = [];
    this.isActive = true;
    this.score = 0;
    this.isCurrentTurn = false;
    this.hasPassedEvolution = false;
    this.hasPassedFeeding = false;

    // AI 狀態
    this.isThinking = false;
    this.lastAction = null;
    this.actionHistory = [];

    this.strategyType = strategyType || DIFFICULTY_STRATEGY_MAP[difficulty];
    this.strategy = this._createStrategy(this.strategyType);
  }

  /**
   * 根據策略類型建立策略實例
   *
   * @param {string} strategyType - 策略類型
   * @returns {Object} 策略實例
   */
  _createStrategy(strategyType) {
    switch (strategyType) {
      case EVOLUTION_AI_STRATEGY.CARNIVORE:
        return new CarnivoreStrategy();
      case EVOLUTION_AI_STRATEGY.DEFENSE:
        return new DefenseStrategy();
      case EVOLUTION_AI_STRATEGY.STRATEGIC:
        return new StrategicStrategy();
      case EVOLUTION_AI_STRATEGY.BASIC:
      default:
        return new BasicStrategy();
    }
  }

  /**
   * 執行回合（非同步，含思考延遲）
   *
   * 根據當前遊戲階段呼叫對應的策略決策。
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @returns {Promise<Object>} AI 決策的動作物件
   */
  async takeTurn(gameState) {
    this.isThinking = true;

    try {
      await this.thinkDelay();

      let action;
      const phase = gameState.phase;

      if (phase === 'evolution') {
        action = this.strategy.decideEvolutionAction(gameState, this.id);
      } else if (phase === 'feeding') {
        action = this.strategy.decideFeedingAction(gameState, this.id);
      } else {
        // 其他階段不需要 AI 主動決策
        action = { type: 'pass' };
      }

      this.lastAction = action;
      this.actionHistory.push({
        action,
        phase,
        timestamp: Date.now()
      });

      return action;
    } finally {
      this.isThinking = false;
    }
  }

  /**
   * 模擬思考延遲
   *
   * @param {number} [min] - 最小延遲（毫秒），預設依難度決定
   * @param {number} [max] - 最大延遲（毫秒），預設為 min + 500
   * @returns {Promise<void>}
   */
  async thinkDelay(min, max) {
    const baseDelay = AI_THINK_DELAY[this.difficulty] || 1500;
    const minDelay = min !== undefined ? min : baseDelay * 0.6;
    const maxDelay = max !== undefined ? max : baseDelay * 1.4;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 重置 AI 狀態（新遊戲開始時）
   */
  reset() {
    this.hand = [];
    this.creatures = [];
    this.isActive = true;
    this.score = 0;
    this.isCurrentTurn = false;
    this.hasPassedEvolution = false;
    this.hasPassedFeeding = false;
    this.isThinking = false;
    this.lastAction = null;
    this.actionHistory = [];
  }

  /**
   * 設定手牌
   *
   * @param {Array} cards - 手牌陣列
   */
  setHand(cards) {
    this.hand = [...cards];
  }

  /**
   * 取得玩家資訊（用於 UI 顯示）
   *
   * @returns {Object} 玩家資訊
   */
  getPlayerInfo() {
    return {
      id: this.id,
      name: this.name,
      isAI: this.isAI,
      difficulty: this.difficulty,
      strategyType: this.strategyType,
      isActive: this.isActive,
      score: this.score,
      handCount: this.hand.length,
      isThinking: this.isThinking
    };
  }
}

/**
 * 工廠函數：建立演化論 AI 玩家
 *
 * @param {string} id - 玩家 ID
 * @param {string} name - 玩家名稱
 * @param {string} [difficulty] - 難度級別
 * @param {string} [strategyType] - 指定策略類型
 * @returns {EvolutionAIPlayer}
 */
export function createEvolutionAIPlayer(id, name, difficulty = AI_DIFFICULTY.MEDIUM, strategyType) {
  return new EvolutionAIPlayer(id, name, difficulty, strategyType);
}

export default EvolutionAIPlayer;
