/**
 * 預定義的規則 ID
 *
 * @module logic/evolution/rules/ruleIds
 */

/**
 * 規則 ID 常數
 * @readonly
 * @enum {string}
 */
const RULE_IDS = {
  // ==================== 遊戲初始化 ====================
  /** 遊戲初始化 */
  GAME_INIT: 'game.init',
  /** 遊戲開始 */
  GAME_START: 'game.start',

  // ==================== 階段轉換 ====================
  /** 階段轉換 */
  PHASE_TRANSITION: 'phase.transition',
  /** 演化階段開始 */
  PHASE_EVOLUTION_START: 'phase.evolution.start',
  /** 食物供給階段開始 */
  PHASE_FOOD_START: 'phase.food.start',
  /** 進食階段開始 */
  PHASE_FEEDING_START: 'phase.feeding.start',
  /** 滅絕階段開始 */
  PHASE_EXTINCTION_START: 'phase.extinction.start',

  // ==================== 食物供給 ====================
  /** 食物公式計算 */
  FOOD_FORMULA: 'food.formula',
  /** 擲骰決定食物 */
  FOOD_ROLL_DICE: 'food.rollDice',

  // ==================== 動作驗證 ====================
  /** 動作驗證 */
  ACTION_VALIDATE: 'action.validate',
  /** 驗證回合 */
  ACTION_VALIDATE_TURN: 'action.validate.turn',
  /** 驗證階段 */
  ACTION_VALIDATE_PHASE: 'action.validate.phase',

  // ==================== 生物操作 ====================
  /** 建立生物 */
  CREATURE_CREATE: 'creature.create',
  /** 生物滅絕 */
  CREATURE_EXTINCT: 'creature.extinct',

  // ==================== 性狀操作 ====================
  /** 驗證性狀放置 */
  TRAIT_VALIDATE_PLACEMENT: 'trait.validate.placement',
  /** 添加性狀 */
  TRAIT_ADD: 'trait.add',
  /** 移除性狀 */
  TRAIT_REMOVE: 'trait.remove',

  // ==================== 進食 ====================
  /** 驗證進食 */
  FEED_VALIDATE: 'feed.validate',
  /** 執行進食 */
  FEED_EXECUTE: 'feed.execute',
  /** 溝通連鎖 */
  FEED_CHAIN_COMMUNICATION: 'feed.chain.communication',
  /** 合作連鎖 */
  FEED_CHAIN_COOPERATION: 'feed.chain.cooperation',
  /** 共生檢查 */
  FEED_CHECK_SYMBIOSIS: 'feed.check.symbiosis',

  // ==================== 攻擊 ====================
  /** 驗證攻擊 */
  ATTACK_VALIDATE: 'attack.validate',
  /** 檢查防禦 */
  ATTACK_CHECK_DEFENSE: 'attack.checkDefense',
  /** 解析攻擊 */
  ATTACK_RESOLVE: 'attack.resolve',
  /** 執行攻擊 */
  ATTACK_EXECUTE: 'attack.execute',

  // ==================== 滅絕 ====================
  /** 滅絕檢查 */
  EXTINCTION_CHECK: 'extinction.check',
  /** 滅絕處理 */
  EXTINCTION_PROCESS: 'extinction.process',
  /** 滅絕後抽牌 */
  EXTINCTION_DRAW_CARDS: 'extinction.drawCards',

  // ==================== 計分 ====================
  /** 計算分數 */
  SCORE_CALCULATE: 'score.calculate',
  /** 生物計分 */
  SCORE_CREATURE: 'score.creature',
  /** 性狀計分 */
  SCORE_TRAIT: 'score.trait',

  // ==================== 遊戲結束 ====================
  /** 檢查遊戲結束 */
  GAME_END_CHECK: 'game.end.check',
  /** 判定勝者 */
  GAME_END_DETERMINE_WINNER: 'game.end.determineWinner',
};

module.exports = { RULE_IDS };
