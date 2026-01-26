/**
 * AI 玩家類別
 *
 * AI 玩家的核心類別，負責管理 AI 的決策流程。
 * 包含策略選擇、資訊追蹤、決策執行等功能。
 *
 * @module ai/AIPlayer
 */

import {
  AI_DIFFICULTY,
  AI_THINK_DELAY,
  PLAYER_TYPE,
  isValidAIDifficulty,
  getAIPlayerName
} from '../shared/constants';

import EasyStrategy from './strategies/EasyStrategy';
import MediumStrategy from './strategies/MediumStrategy';
import HardStrategy from './strategies/HardStrategy';
import InformationTracker from './InformationTracker';
import DecisionMaker from './DecisionMaker';

/**
 * AI 玩家類別
 */
class AIPlayer {
  /**
   * 建立 AI 玩家
   *
   * @param {string} id - 玩家唯一識別碼
   * @param {string} name - 玩家名稱
   * @param {string} difficulty - 難度級別 (easy/medium/hard)
   */
  constructor(id, name, difficulty = AI_DIFFICULTY.MEDIUM) {
    // 驗證難度
    if (!isValidAIDifficulty(difficulty)) {
      console.warn(`Invalid AI difficulty: ${difficulty}, using medium`);
      difficulty = AI_DIFFICULTY.MEDIUM;
    }

    // 基本屬性
    this.id = id;
    this.name = name || getAIPlayerName(0);
    this.isAI = true;
    this.playerType = PLAYER_TYPE.AI;
    this.difficulty = difficulty;

    // 遊戲狀態屬性（與人類玩家相同）
    this.hand = [];
    this.isActive = true;
    this.score = 0;
    this.isCurrentTurn = false;

    // AI 專屬元件（將在後續工單實現）
    this.strategy = this.createStrategy(difficulty);
    this.informationTracker = this.createInformationTracker();
    this.decisionMaker = this.createDecisionMaker();

    // 狀態追蹤
    this.isThinking = false;
    this.lastAction = null;
    this.actionHistory = [];
  }

  /**
   * 根據難度建立策略
   *
   * @param {string} difficulty - 難度級別
   * @returns {Object} 策略實例
   */
  createStrategy(difficulty) {
    let strategy;

    switch (difficulty) {
      case AI_DIFFICULTY.EASY:
        strategy = new EasyStrategy();
        break;
      case AI_DIFFICULTY.MEDIUM:
        strategy = new MediumStrategy();
        break;
      case AI_DIFFICULTY.HARD:
        strategy = new HardStrategy();
        break;
      default:
        strategy = new MediumStrategy();
    }

    // 設置策略的 selfId
    strategy.selfId = this.id;

    return strategy;
  }

  /**
   * 建立資訊追蹤器
   *
   * @returns {InformationTracker} 資訊追蹤器實例
   */
  createInformationTracker() {
    return new InformationTracker(this.id);
  }

  /**
   * 建立決策執行器
   *
   * @returns {DecisionMaker} 決策執行器實例
   */
  createDecisionMaker() {
    return new DecisionMaker(this.strategy, this.id);
  }

  /**
   * 處理遊戲事件，更新資訊追蹤器
   *
   * @param {Object} event - 遊戲事件
   */
  onGameEvent(event) {
    if (this.informationTracker) {
      this.informationTracker.processEvent(event);
    }
  }

  /**
   * 執行回合（非同步，含思考延遲）
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @returns {Promise<Object>} AI 決策的動作
   */
  async takeTurn(gameState) {
    this.isThinking = true;

    try {
      // 加入思考延遲
      await this.thinkDelay();

      // 取得當前知識狀態
      const knowledge = this.informationTracker.getKnowledge();

      // 決定動作
      const action = this.decisionMaker.decide(gameState, knowledge);

      // 記錄動作
      this.lastAction = action;
      this.actionHistory.push({
        action,
        timestamp: Date.now(),
        gameState: { ...gameState }
      });

      return action;
    } finally {
      this.isThinking = false;
    }
  }

  /**
   * 決定是否跟猜
   *
   * @param {Object} gameState - 當前遊戲狀態
   * @param {string[]} guessedColors - 被猜測的顏色
   * @returns {Promise<boolean>} 是否跟猜
   */
  async decideFollowGuess(gameState, guessedColors) {
    this.isThinking = true;

    try {
      // 跟猜時使用較短的延遲
      await this.thinkDelay(
        AI_THINK_DELAY.FOLLOW_GUESS_MIN,
        AI_THINK_DELAY.FOLLOW_GUESS_MAX
      );

      // 取得當前知識狀態
      const knowledge = this.informationTracker.getKnowledge();

      // 決定是否跟猜
      return this.decisionMaker.decideFollowGuess(gameState, guessedColors, knowledge);
    } finally {
      this.isThinking = false;
    }
  }

  /**
   * 模擬思考延遲
   *
   * @param {number} min - 最小延遲（毫秒）
   * @param {number} max - 最大延遲（毫秒）
   * @returns {Promise<void>}
   */
  async thinkDelay(min = AI_THINK_DELAY.MIN, max = AI_THINK_DELAY.MAX) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 重置 AI 狀態（新遊戲開始時）
   */
  reset() {
    this.hand = [];
    this.isActive = true;
    this.score = 0;
    this.isCurrentTurn = false;
    this.isThinking = false;
    this.lastAction = null;
    this.actionHistory = [];

    if (this.informationTracker) {
      this.informationTracker.reset();
    }
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
      isActive: this.isActive,
      score: this.score,
      handCount: this.hand.length,
      isThinking: this.isThinking
    };
  }

  // ==================== 預設決策方法（簡單隨機實現）====================

  /**
   * 預設決策動作（隨機選擇問牌或猜牌）
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {Object} 動作物件
   */
  defaultDecideAction(gameState, knowledge) {
    // 檢查是否必須猜牌
    const activePlayers = gameState.players?.filter(p => p.isActive) || [];
    const mustGuess = activePlayers.length === 1;

    if (mustGuess) {
      return {
        type: 'guess',
        colors: this.defaultSelectGuessColors(knowledge)
      };
    }

    // 預設選擇問牌
    return {
      type: 'question',
      targetPlayerId: this.defaultSelectTargetPlayer(gameState, knowledge)?.id,
      colors: this.defaultSelectColors(gameState, knowledge),
      questionType: this.defaultSelectQuestionType(gameState, knowledge, [])
    };
  }

  /**
   * 預設選擇目標玩家（隨機）
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {Object|null} 目標玩家
   */
  defaultSelectTargetPlayer(gameState, knowledge) {
    const otherPlayers = (gameState.players || []).filter(
      p => p.id !== this.id && p.isActive
    );

    if (otherPlayers.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * otherPlayers.length);
    return otherPlayers[randomIndex];
  }

  /**
   * 預設選擇問牌顏色（隨機兩個）
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {string[]} 顏色陣列
   */
  defaultSelectColors(gameState, knowledge) {
    const colors = ['red', 'yellow', 'green', 'blue'];
    const shuffled = [...colors].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  /**
   * 預設選擇問牌類型（偏好類型 1）
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @param {string[]} colors - 選定的顏色
   * @returns {number} 問牌類型
   */
  defaultSelectQuestionType(gameState, knowledge, colors) {
    const rand = Math.random();
    if (rand < 0.6) return 1; // 各一張
    if (rand < 0.9) return 2; // 全部
    return 3; // 給一張要全部
  }

  /**
   * 預設選擇猜牌顏色（隨機兩個）
   *
   * @param {Object} knowledge - 知識狀態
   * @returns {string[]} 顏色陣列
   */
  defaultSelectGuessColors(knowledge) {
    const colors = ['red', 'yellow', 'green', 'blue'];
    const shuffled = [...colors].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  /**
   * 預設跟猜決策（50% 機率）
   *
   * @param {string[]} guessedColors - 被猜測的顏色
   * @param {Object} knowledge - 知識狀態
   * @returns {boolean} 是否跟猜
   */
  defaultDecideFollowGuess(guessedColors, knowledge) {
    return Math.random() > 0.5;
  }
}

/**
 * 工廠函數：建立 AI 玩家
 *
 * @param {string} id - 玩家 ID
 * @param {string} name - 玩家名稱
 * @param {string} difficulty - 難度級別
 * @returns {AIPlayer} AI 玩家實例
 */
export function createAIPlayer(id, name, difficulty = AI_DIFFICULTY.MEDIUM) {
  return new AIPlayer(id, name, difficulty);
}

export default AIPlayer;
