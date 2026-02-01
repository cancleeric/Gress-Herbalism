/**
 * 遊戲配置類別
 *
 * 管理遊戲的擴充包選擇、規則變體、時間限制等設定
 *
 * @module logic/evolution/gameConfig
 */

const { expansionLoader, EXPANSION_STATUS } = require('../../../shared/expansions');

/**
 * 預設遊戲配置
 */
const DEFAULT_GAME_CONFIG = {
  // 擴充包設定
  expansions: ['base'],

  // 規則變體
  variants: {
    hiddenCards: false,        // 隱藏對手手牌數量
    fastMode: false,           // 快速模式（減少發牌）
    friendlyFire: true,        // 允許攻擊自己的生物
    simultaneousFeed: false,   // 同時進食（非輪流）
  },

  // 時間限制（毫秒）
  timeouts: {
    evolutionPhase: 120000,    // 演化階段 2 分鐘
    feedingPhase: 60000,       // 進食階段 1 分鐘
    turnTimeout: 30000,        // 單次行動 30 秒
    inactivityTimeout: 180000, // 掛機 3 分鐘踢出
  },

  // 遊戲設定
  settings: {
    shufflePlayerOrder: true,  // 隨機玩家順序
    autoPass: true,            // 無可用行動時自動跳過
    showFoodPool: true,        // 顯示食物池數值
  },
};

/**
 * 遊戲配置類別
 */
class GameConfig {
  /**
   * @param {Object} options - 配置選項
   */
  constructor(options = {}) {
    this.expansions = options.expansions || [...DEFAULT_GAME_CONFIG.expansions];
    this.variants = { ...DEFAULT_GAME_CONFIG.variants, ...options.variants };
    this.timeouts = { ...DEFAULT_GAME_CONFIG.timeouts, ...options.timeouts };
    this.settings = { ...DEFAULT_GAME_CONFIG.settings, ...options.settings };
  }

  /**
   * 驗證配置有效性
   * @returns {Promise<{ valid: boolean, errors: string[] }>}
   */
  async validate() {
    const errors = [];

    // 必須包含基礎版
    if (!this.expansions.includes('base')) {
      errors.push('Base expansion is required');
    }

    // 檢查擴充包是否可載入
    for (const expansionId of this.expansions) {
      const status = expansionLoader.getStatus(expansionId);
      if (status === EXPANSION_STATUS.NOT_LOADED) {
        // 嘗試載入
        const result = await expansionLoader.load(expansionId);
        if (!result.success) {
          errors.push(`Expansion not found: ${expansionId}`);
        }
      } else if (status === EXPANSION_STATUS.ERROR) {
        errors.push(`Expansion failed to load: ${expansionId}`);
      }
    }

    // 檢查時間設定
    for (const [key, value] of Object.entries(this.timeouts)) {
      if (typeof value !== 'number' || value < 0) {
        errors.push(`Invalid timeout: ${key} must be a non-negative number`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 取得玩家數範圍
   * @returns {{ minPlayers: number, maxPlayers: number }}
   */
  getPlayerRange() {
    let minPlayers = 2;
    let maxPlayers = 4;

    for (const expansionId of this.expansions) {
      const loadResult = expansionLoader.getLoaded(expansionId);
      if (loadResult?.manifest) {
        const { minPlayers: min, maxPlayers: max } = loadResult.manifest;
        if (min !== undefined) minPlayers = Math.max(minPlayers, min);
        if (max !== undefined) maxPlayers = Math.max(maxPlayers, max);
      }
    }

    return { minPlayers, maxPlayers };
  }

  /**
   * 取得初始手牌數
   * @param {number} playerCount - 玩家數量
   * @returns {number}
   */
  getInitialHandSize(playerCount) {
    // 基礎規則：6 張
    // 快速模式：4 張
    if (this.variants.fastMode) {
      return 4;
    }
    return 6;
  }

  /**
   * 序列化為 JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      expansions: this.expansions,
      variants: this.variants,
      timeouts: this.timeouts,
      settings: this.settings,
    };
  }

  /**
   * 從 JSON 還原
   * @param {Object} json
   * @returns {GameConfig}
   */
  static fromJSON(json) {
    return new GameConfig(json);
  }
}

module.exports = {
  DEFAULT_GAME_CONFIG,
  GameConfig,
};
