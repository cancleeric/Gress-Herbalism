/**
 * 演化論 AI 玩家類別
 *
 * 演化論 AI 玩家的核心類別，負責管理演化論 AI 的決策流程。
 * 支援三種難度：簡單（隨機）、中等（肉食/防禦）、困難（策略性）
 *
 * @module ai/evolution/EvolutionAIPlayer
 */

import {
  AI_DIFFICULTY,
  AI_THINK_DELAY,
  PLAYER_TYPE,
  isValidAIDifficulty
} from '../../shared/constants';

import BasicStrategy from './strategies/BasicStrategy';
import CarnivoreStrategy from './strategies/CarnivoreStrategy';
import DefenseStrategy from './strategies/DefenseStrategy';
import StrategicStrategy from './strategies/StrategicStrategy';

// AI 名稱（演化論風格）
const EVOLUTION_AI_NAMES = ['草食獸', '肉食龍', '防禦甲', '策略鳥'];

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
   * @param {string} [aiType] - AI 類型 ('basic'|'carnivore'|'defense'|'strategic')
   */
  constructor(id, name, difficulty = AI_DIFFICULTY.MEDIUM, aiType = null) {
    if (!isValidAIDifficulty(difficulty)) {
      console.warn(`Invalid AI difficulty: ${difficulty}, using medium`);
      difficulty = AI_DIFFICULTY.MEDIUM;
    }

    this.id = id;
    this.name = name || EVOLUTION_AI_NAMES[0];
    this.isAI = true;
    this.playerType = PLAYER_TYPE.AI;
    this.difficulty = difficulty;
    this.aiType = aiType || this.getDefaultAIType(difficulty);

    // 遊戲狀態屬性
    this.hand = [];
    this.creatures = [];
    this.isActive = true;
    this.score = 0;

    // 策略
    this.strategy = this.createStrategy(difficulty, aiType);

    // 狀態追蹤
    this.isThinking = false;
    this.lastAction = null;
  }

  /**
   * 根據難度取得預設 AI 類型
   */
  getDefaultAIType(difficulty) {
    switch (difficulty) {
      case AI_DIFFICULTY.EASY: return 'basic';
      case AI_DIFFICULTY.MEDIUM: return Math.random() < 0.5 ? 'carnivore' : 'defense';
      case AI_DIFFICULTY.HARD: return 'strategic';
      default: return 'basic';
    }
  }

  /**
   * 根據難度和類型建立策略
   */
  createStrategy(difficulty, aiType) {
    const type = aiType || this.getDefaultAIType(difficulty);
    switch (type) {
      case 'carnivore': return new CarnivoreStrategy();
      case 'defense': return new DefenseStrategy();
      case 'strategic': return new StrategicStrategy();
      default: return new BasicStrategy();
    }
  }

  /**
   * 執行演化階段回合（非同步，含思考延遲）
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @returns {Promise<Object>} AI 決策的動作
   */
  async takeTurn(gameState) {
    this.isThinking = true;
    try {
      await this.thinkDelay();
      const action = this.strategy.decideEvolutionAction(gameState, this.id);
      this.lastAction = action;
      console.log(`[EvolutionAI] ${this.name} (${this.strategy.name}) 演化決策:`, action?.type);
      return action;
    } finally {
      this.isThinking = false;
    }
  }

  /**
   * 執行進食階段回合（非同步，含思考延遲）
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @returns {Promise<Object>} AI 決策的動作
   */
  async takeFeedingTurn(gameState) {
    this.isThinking = true;
    try {
      await this.thinkDelay();
      const action = this.strategy.decideFeedingAction(gameState, this.id);
      this.lastAction = action;
      console.log(`[EvolutionAI] ${this.name} 進食決策:`, action?.type);
      return action;
    } finally {
      this.isThinking = false;
    }
  }

  /**
   * 決定防禦回應（被攻擊時）
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @param {Object} pendingAttack - 待處理的攻擊
   * @returns {Promise<Object>} 防禦回應動作
   */
  async decideDefenseResponse(gameState, pendingAttack) {
    this.isThinking = true;
    try {
      await this.thinkDelay(500, 1000);
      const response = this.strategy.decideDefenseResponse(gameState, pendingAttack, this.id);
      return response;
    } finally {
      this.isThinking = false;
    }
  }

  /**
   * 模擬思考延遲
   */
  async thinkDelay(min = null, max = null) {
    const baseDelay = AI_THINK_DELAY[this.difficulty] || 1000;
    const minDelay = min ?? baseDelay * 0.6;
    const maxDelay = max ?? baseDelay * 1.4;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 重置 AI 狀態
   */
  reset() {
    this.hand = [];
    this.creatures = [];
    this.isActive = true;
    this.score = 0;
    this.isThinking = false;
    this.lastAction = null;
  }

  /**
   * 設定手牌
   */
  setHand(cards) {
    this.hand = [...cards];
  }

  /**
   * 取得玩家資訊（用於 UI 顯示）
   */
  getPlayerInfo() {
    return {
      id: this.id,
      name: this.name,
      isAI: this.isAI,
      difficulty: this.difficulty,
      aiType: this.aiType,
      strategyName: this.strategy.name,
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
 * @param {string} name - 玩家名稱（null 則使用預設名稱）
 * @param {string} difficulty - 難度級別
 * @param {string} [aiType] - AI 類型
 * @returns {EvolutionAIPlayer} AI 玩家實例
 */
export function createEvolutionAIPlayer(id, name, difficulty = AI_DIFFICULTY.MEDIUM, aiType = null) {
  const defaultName = EVOLUTION_AI_NAMES[parseInt(id.replace(/\D/g, ''), 10) % EVOLUTION_AI_NAMES.length] || '演化 AI';
  return new EvolutionAIPlayer(id, name || defaultName, difficulty, aiType);
}

export { EVOLUTION_AI_NAMES };
export default EvolutionAIPlayer;
