/**
 * 預定義的鉤子名稱
 *
 * @module logic/evolution/rules/hookNames
 */

/**
 * 鉤子名稱常數
 * @readonly
 * @enum {string}
 */
const HOOK_NAMES = {
  // ==================== 遊戲生命週期 ====================
  /** 遊戲初始化前 */
  BEFORE_GAME_INIT: 'beforeGameInit',
  /** 遊戲初始化後 */
  AFTER_GAME_INIT: 'afterGameInit',
  /** 遊戲開始前 */
  BEFORE_GAME_START: 'beforeGameStart',
  /** 遊戲開始後 */
  AFTER_GAME_START: 'afterGameStart',
  /** 遊戲結束前 */
  BEFORE_GAME_END: 'beforeGameEnd',
  /** 遊戲結束後 */
  AFTER_GAME_END: 'afterGameEnd',

  // ==================== 階段生命週期 ====================
  /** 階段開始前 */
  BEFORE_PHASE_START: 'beforePhaseStart',
  /** 階段開始後 */
  AFTER_PHASE_START: 'afterPhaseStart',
  /** 階段結束前 */
  BEFORE_PHASE_END: 'beforePhaseEnd',
  /** 階段結束後 */
  AFTER_PHASE_END: 'afterPhaseEnd',

  // ==================== 回合生命週期 ====================
  /** 回合開始前 */
  BEFORE_TURN_START: 'beforeTurnStart',
  /** 回合開始後 */
  AFTER_TURN_START: 'afterTurnStart',
  /** 回合結束前 */
  BEFORE_TURN_END: 'beforeTurnEnd',
  /** 回合結束後 */
  AFTER_TURN_END: 'afterTurnEnd',

  // ==================== 動作相關 ====================
  /** 動作執行前 */
  BEFORE_ACTION: 'beforeAction',
  /** 動作執行後 */
  AFTER_ACTION: 'afterAction',
  /** 動作被拒絕 */
  ACTION_REJECTED: 'actionRejected',

  // ==================== 生物相關 ====================
  /** 生物創建時 */
  ON_CREATURE_CREATE: 'onCreatureCreate',
  /** 生物滅絕時 */
  ON_CREATURE_EXTINCT: 'onCreatureExtinct',
  /** 生物滅絕前 */
  BEFORE_CREATURE_EXTINCT: 'beforeCreatureExtinct',

  // ==================== 性狀相關 ====================
  /** 性狀添加時 */
  ON_TRAIT_ADD: 'onTraitAdd',
  /** 性狀移除時 */
  ON_TRAIT_REMOVE: 'onTraitRemove',
  /** 性狀添加前 */
  BEFORE_TRAIT_ADD: 'beforeTraitAdd',

  // ==================== 進食相關 ====================
  /** 進食前 */
  BEFORE_FEED: 'beforeFeed',
  /** 進食後 */
  AFTER_FEED: 'afterFeed',
  /** 獲得食物時 */
  ON_GAIN_FOOD: 'onGainFood',

  // ==================== 攻擊相關 ====================
  /** 攻擊前 */
  BEFORE_ATTACK: 'beforeAttack',
  /** 攻擊後 */
  AFTER_ATTACK: 'afterAttack',
  /** 攻擊成功時 */
  ON_ATTACK_SUCCESS: 'onAttackSuccess',
  /** 攻擊失敗時 */
  ON_ATTACK_FAILED: 'onAttackFailed',
  /** 防禦回應時 */
  ON_DEFENSE_RESPONSE: 'onDefenseResponse',

  // ==================== 食物池相關 ====================
  /** 食物池變化時 */
  ON_FOOD_POOL_CHANGE: 'onFoodPoolChange',
  /** 擲骰時 */
  ON_DICE_ROLL: 'onDiceRoll',

  // ==================== 計分相關 ====================
  /** 計分前 */
  BEFORE_SCORE_CALCULATE: 'beforeScoreCalculate',
  /** 計分後 */
  AFTER_SCORE_CALCULATE: 'afterScoreCalculate',
};

module.exports = { HOOK_NAMES };
