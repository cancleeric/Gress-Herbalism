/**
 * 滅絕規則
 *
 * @module expansions/base/rules/extinctionRules
 */

const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');

/**
 * 註冊滅絕規則
 * @param {RuleEngine} engine - 規則引擎
 */
function register(engine) {
  /**
   * 滅絕條件檢查規則
   */
  engine.registerRule(RULE_IDS.EXTINCTION_CHECK, {
    description: '檢查滅絕條件',
    expansion: 'base',
    execute: (context) => {
      const { creature, traitRegistry } = context;

      // 檢查是否冬眠
      if (creature.isHibernating) {
        return { ...context, shouldExtinct: false, reason: '冬眠中' };
      }

      // 檢查是否吃飽
      const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
      const foodNeeded = creature.foodNeeded || 1;

      if (currentFood >= foodNeeded) {
        return { ...context, shouldExtinct: false, reason: '已吃飽' };
      }

      // 檢查是否可消耗脂肪
      const fatCount = creature.food?.yellow || 0;
      const deficit = foodNeeded - currentFood;

      if (fatCount >= deficit) {
        return {
          ...context,
          shouldExtinct: false,
          reason: '可消耗脂肪',
          fatToConsume: deficit,
        };
      }

      return { ...context, shouldExtinct: true, reason: '食物不足' };
    },
  });

  /**
   * 滅絕階段處理規則
   */
  engine.registerRule(RULE_IDS.EXTINCTION_PROCESS, {
    description: '處理滅絕階段',
    expansion: 'base',
    execute: async (context) => {
      const { gameState, traitRegistry } = context;
      let newState = { ...gameState };

      for (const player of newState.players) {
        const extinctCreatures = [];

        for (const creature of player.creatures || []) {
          // 檢查中毒
          if (creature.isPoisoned) {
            extinctCreatures.push(creature);
            continue;
          }

          // 檢查是否需要滅絕
          const checkResult = await context.executeRule(RULE_IDS.EXTINCTION_CHECK, {
            ...context,
            creature,
            gameState: newState,
          });

          if (checkResult.shouldExtinct) {
            extinctCreatures.push(creature);
          } else if (checkResult.fatToConsume) {
            // 消耗脂肪
            creature.food.yellow -= checkResult.fatToConsume;
            creature.food.blue += checkResult.fatToConsume;

            // 記錄日誌
            newState.actionLog = newState.actionLog || [];
            newState.actionLog.push({
              type: 'FAT_CONSUMED',
              creatureId: creature.id,
              amount: checkResult.fatToConsume,
            });
          }
        }

        // 處理滅絕
        for (const creature of extinctCreatures) {
          const result = await context.executeRule(RULE_IDS.CREATURE_EXTINCT, {
            ...context,
            gameState: newState,
            creature,
            attacker: null,
          });
          newState = result.gameState;
        }

        // 清除食物標記（在所有滅絕處理完成後）
        for (const creature of player.creatures || []) {
          if (creature.food) {
            creature.food.red = 0;
            creature.food.blue = 0;
            // 脂肪保留
          }
          creature.isHibernating = false;
          creature.isPoisoned = false;
          creature.hasAttackedThisTurn = false;
        }
      }

      return { ...context, gameState: newState };
    },
  });

  /**
   * 滅絕後抽牌規則
   */
  engine.registerRule(RULE_IDS.EXTINCTION_DRAW_CARDS, {
    description: '滅絕後抽牌補充手牌',
    expansion: 'base',
    execute: (context) => {
      const { gameState } = context;
      let newState = { ...gameState };

      for (const player of newState.players) {
        // 每隻存活的生物抽一張牌
        const aliveCreatures = player.creatures?.length || 0;

        // 加上基礎抽牌數
        const cardsToDraw = aliveCreatures + 1;

        // 實際抽牌邏輯由其他地方處理
        // 這裡只計算數量
        player.cardsToDraw = cardsToDraw;
      }

      return { ...context, gameState: newState };
    },
  });
}

module.exports = { register };
