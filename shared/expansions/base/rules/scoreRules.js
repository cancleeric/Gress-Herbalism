/**
 * 計分規則
 *
 * @module expansions/base/rules/scoreRules
 */

const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');

/**
 * 計分常數
 */
const SCORE_VALUES = {
  CREATURE_BASE: 2,   // 每隻生物基礎分
  TRAIT_BASE: 1,      // 每個性狀基礎分
};

/**
 * 註冊計分規則
 * @param {RuleEngine} engine - 規則引擎
 */
function register(engine) {
  /**
   * 計算最終分數規則
   */
  engine.registerRule(RULE_IDS.SCORE_CALCULATE, {
    description: '計算最終分數',
    expansion: 'base',
    execute: (context) => {
      const { gameState, traitRegistry } = context;
      const scores = {};
      const scoreDetails = {};

      for (const player of gameState.players) {
        let score = 0;
        const details = {
          creatures: [],
          totalCreatureScore: 0,
          totalTraitScore: 0,
        };

        for (const creature of player.creatures || []) {
          const creatureDetail = {
            id: creature.id,
            baseScore: SCORE_VALUES.CREATURE_BASE,
            traits: [],
          };

          // 生物基礎分：2 分
          score += SCORE_VALUES.CREATURE_BASE;
          details.totalCreatureScore += SCORE_VALUES.CREATURE_BASE;

          // 每個性狀：1 分 + 食量加成
          for (const trait of creature.traits || []) {
            let traitScore = SCORE_VALUES.TRAIT_BASE;

            // 取得食量加成
            const handler = traitRegistry?.get(trait.type);
            if (handler) {
              const bonus = handler.foodBonus || 0;
              traitScore += bonus;
            }

            score += traitScore;
            details.totalTraitScore += traitScore;

            creatureDetail.traits.push({
              type: trait.type,
              score: traitScore,
            });
          }

          details.creatures.push(creatureDetail);
        }

        scores[player.id] = score;
        scoreDetails[player.id] = details;
      }

      return { ...context, scores, scoreDetails };
    },
  });

  /**
   * 生物計分規則
   */
  engine.registerRule(RULE_IDS.SCORE_CREATURE, {
    description: '計算單隻生物分數',
    expansion: 'base',
    execute: (context) => {
      const { creature, traitRegistry } = context;

      let score = SCORE_VALUES.CREATURE_BASE;

      for (const trait of creature.traits || []) {
        score += SCORE_VALUES.TRAIT_BASE;

        const handler = traitRegistry?.get(trait.type);
        if (handler) {
          score += handler.foodBonus || 0;
        }
      }

      return { ...context, creatureScore: score };
    },
  });

  /**
   * 性狀計分規則
   */
  engine.registerRule(RULE_IDS.SCORE_TRAIT, {
    description: '計算單個性狀分數',
    expansion: 'base',
    execute: (context) => {
      const { trait, traitRegistry } = context;

      let score = SCORE_VALUES.TRAIT_BASE;

      const handler = traitRegistry?.get(trait.type);
      if (handler) {
        score += handler.foodBonus || 0;
      }

      return { ...context, traitScore: score };
    },
  });

  /**
   * 判定勝者規則
   */
  engine.registerRule(RULE_IDS.GAME_END_DETERMINE_WINNER, {
    description: '判定勝者',
    expansion: 'base',
    execute: (context) => {
      const { scores, gameState } = context;

      // 找到最高分
      let maxScore = -1;
      let winners = [];

      for (const [playerId, score] of Object.entries(scores)) {
        if (score > maxScore) {
          maxScore = score;
          winners = [playerId];
        } else if (score === maxScore) {
          winners.push(playerId);
        }
      }

      // 平手判定：比較棄牌堆數量（滅絕的生物越多分數越低作為懲罰）
      if (winners.length > 1) {
        let minDiscard = Infinity;
        let tiebreakWinners = [];

        for (const winnerId of winners) {
          const player = gameState.players.find(p => p.id === winnerId);
          const discardCount = player?.discardPile?.length || 0;

          if (discardCount < minDiscard) {
            minDiscard = discardCount;
            tiebreakWinners = [winnerId];
          } else if (discardCount === minDiscard) {
            tiebreakWinners.push(winnerId);
          }
        }

        winners = tiebreakWinners;
      }

      return {
        ...context,
        winners,
        winnerId: winners.length === 1 ? winners[0] : null,
        isTie: winners.length > 1,
        winningScore: maxScore,
      };
    },
  });

  /**
   * 遊戲結束檢查規則
   */
  engine.registerRule(RULE_IDS.GAME_END_CHECK, {
    description: '檢查遊戲是否結束',
    expansion: 'base',
    execute: (context) => {
      const { gameState } = context;

      // 牌庫空且完成最後一回合
      const deckEmpty = (gameState.deck?.length || 0) === 0;
      const isLastRound = gameState.isLastRound || false;
      const phaseComplete = gameState.phase === 'extinction' ||
                           gameState.phaseComplete;

      const gameOver = deckEmpty && isLastRound && phaseComplete;

      return {
        ...context,
        gameOver,
        reason: gameOver ? '牌庫耗盡，遊戲結束' : '',
      };
    },
  });
}

module.exports = { register, SCORE_VALUES };
