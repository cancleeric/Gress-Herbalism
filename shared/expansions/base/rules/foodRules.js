/**
 * 食物供給規則
 *
 * @module expansions/base/rules/foodRules
 */

const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');
const { HOOK_NAMES } = require('../../../../backend/logic/evolution/rules/hookNames');

/**
 * 食物數量計算公式
 * @readonly
 */
const FOOD_FORMULA = {
  2: { dice: 1, bonus: 2 },  // 1d6 + 2
  3: { dice: 2, bonus: 0 },  // 2d6
  4: { dice: 2, bonus: 2 },  // 2d6 + 2
};

/**
 * 註冊食物規則
 * @param {RuleEngine} engine - 規則引擎
 */
function register(engine) {
  /**
   * 食物公式規則
   */
  engine.registerRule(RULE_IDS.FOOD_FORMULA, {
    description: '計算食物供給數量',
    expansion: 'base',
    execute: (context) => {
      const { gameState } = context;
      const playerCount = gameState.players.length;
      const formula = FOOD_FORMULA[playerCount];

      if (!formula) {
        throw new Error(`Unsupported player count: ${playerCount}`);
      }

      return {
        ...context,
        formula,
      };
    },
  });

  /**
   * 擲骰規則
   */
  engine.registerRule(RULE_IDS.FOOD_ROLL_DICE, {
    description: '擲骰決定食物數量',
    expansion: 'base',
    execute: async (context) => {
      const { formula, gameState } = context;

      // 擲骰
      const diceResults = [];
      for (let i = 0; i < formula.dice; i++) {
        diceResults.push(Math.floor(Math.random() * 6) + 1);
      }

      const total = diceResults.reduce((sum, d) => sum + d, 0) + formula.bonus;

      // 更新遊戲狀態
      const newState = {
        ...gameState,
        foodPool: {
          ...gameState.foodPool,
          red: total,
        },
        lastDiceResults: diceResults,
      };

      // 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'FOOD_ROLL',
        diceResults,
        bonus: formula.bonus,
        total,
      });

      // 觸發擲骰鉤子
      if (context.triggerHook) {
        await context.triggerHook(HOOK_NAMES.ON_DICE_ROLL, {
          ...context,
          diceResults,
          total,
        });
      }

      return {
        ...context,
        gameState: newState,
        diceResults,
        foodAmount: total,
      };
    },
  });
}

module.exports = { register, FOOD_FORMULA };
