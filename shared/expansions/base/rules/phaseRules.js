/**
 * 階段規則
 *
 * @module expansions/base/rules/phaseRules
 */

const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');
const { HOOK_NAMES } = require('../../../../backend/logic/evolution/rules/hookNames');

/**
 * 遊戲階段
 */
const PHASES = {
  EVOLUTION: 'evolution',
  FOOD_SUPPLY: 'foodSupply',
  FEEDING: 'feeding',
  EXTINCTION: 'extinction',
};

/**
 * 階段順序
 */
const PHASE_ORDER = [
  PHASES.EVOLUTION,
  PHASES.FOOD_SUPPLY,
  PHASES.FEEDING,
  PHASES.EXTINCTION,
];

/**
 * 註冊階段規則
 * @param {RuleEngine} engine - 規則引擎
 */
function register(engine) {
  /**
   * 階段轉換規則
   */
  engine.registerRule(RULE_IDS.PHASE_TRANSITION, {
    description: '處理階段轉換',
    expansion: 'base',
    execute: async (context) => {
      const { gameState } = context;
      let newState = { ...gameState };

      // 取得當前階段索引
      const currentPhaseIndex = PHASE_ORDER.indexOf(newState.phase);

      // 觸發階段結束鉤子
      if (context.triggerHook) {
        const endResult = await context.triggerHook(HOOK_NAMES.BEFORE_PHASE_END, {
          ...context,
          gameState: newState,
          phase: newState.phase,
        });
        if (endResult?.gameState) {
          newState = endResult.gameState;
        }
      }

      // 計算下一階段
      let nextPhaseIndex = currentPhaseIndex + 1;

      if (nextPhaseIndex >= PHASE_ORDER.length) {
        // 一輪結束，檢查是否為最後一回合
        if (newState.isLastRound) {
          // 遊戲結束
          newState.phase = 'gameOver';
          newState.gameOver = true;
        } else {
          // 進入下一回合
          nextPhaseIndex = 0;
          newState.round = (newState.round || 1) + 1;

          // 檢查是否為最後一回合（牌庫空）
          if ((newState.deck?.length || 0) === 0) {
            newState.isLastRound = true;
          }
        }
      }

      if (!newState.gameOver) {
        newState.phase = PHASE_ORDER[nextPhaseIndex];

        // 觸發階段開始鉤子
        if (context.triggerHook) {
          const startResult = await context.triggerHook(HOOK_NAMES.AFTER_PHASE_START, {
            ...context,
            gameState: newState,
            phase: newState.phase,
          });
          if (startResult?.gameState) {
            newState = startResult.gameState;
          }
        }

        // 執行階段開始規則
        const phaseStartRuleId = getPhaseStartRuleId(newState.phase);
        if (phaseStartRuleId && engine.hasRule(phaseStartRuleId)) {
          const result = await context.executeRule(phaseStartRuleId, {
            ...context,
            gameState: newState,
          });
          newState = result.gameState;
        }
      }

      return { ...context, gameState: newState };
    },
  });

  /**
   * 演化階段開始規則
   */
  engine.registerRule(RULE_IDS.PHASE_EVOLUTION_START, {
    description: '演化階段開始',
    expansion: 'base',
    execute: async (context) => {
      const { gameState } = context;
      let newState = { ...gameState };

      // 重置玩家狀態
      for (const player of newState.players) {
        player.passedEvolution = false;
      }

      // 設定當前玩家為起始玩家
      newState.currentPlayerIndex = newState.startingPlayerIndex || 0;

      // 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'PHASE_START',
        phase: PHASES.EVOLUTION,
        round: newState.round,
      });

      return { ...context, gameState: newState };
    },
  });

  /**
   * 食物供給階段開始規則
   */
  engine.registerRule(RULE_IDS.PHASE_FOOD_START, {
    description: '食物供給階段開始',
    expansion: 'base',
    execute: async (context) => {
      const { gameState } = context;
      let newState = { ...gameState };

      // 計算食物公式
      const formulaResult = await context.executeRule(RULE_IDS.FOOD_FORMULA, {
        ...context,
        gameState: newState,
      });

      // 擲骰
      const rollResult = await context.executeRule(RULE_IDS.FOOD_ROLL_DICE, {
        ...formulaResult,
        gameState: newState,
      });

      newState = rollResult.gameState;

      // 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'PHASE_START',
        phase: PHASES.FOOD_SUPPLY,
        foodAmount: rollResult.foodAmount,
      });

      return { ...context, gameState: newState };
    },
  });

  /**
   * 進食階段開始規則
   */
  engine.registerRule(RULE_IDS.PHASE_FEEDING_START, {
    description: '進食階段開始',
    expansion: 'base',
    execute: async (context) => {
      const { gameState, traitRegistry } = context;
      let newState = { ...gameState };

      // 重置玩家狀態
      for (const player of newState.players) {
        player.passedFeeding = false;

        // 重置生物狀態
        for (const creature of player.creatures || []) {
          creature.hasActedThisTurn = false;
          creature.robberyUsedThisPhase = false;
          creature.tramplingUsedThisPhase = false;

          // 觸發階段開始的性狀效果
          for (const trait of creature.traits || []) {
            const handler = traitRegistry?.get(trait.type);
            if (handler && handler.onPhaseStart) {
              newState = handler.onPhaseStart(
                { creature, gameState: newState },
                'feeding'
              );
            }
          }
        }
      }

      // 設定當前玩家
      newState.currentPlayerIndex = newState.startingPlayerIndex || 0;

      // 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'PHASE_START',
        phase: PHASES.FEEDING,
      });

      return { ...context, gameState: newState };
    },
  });

  /**
   * 滅絕階段開始規則
   */
  engine.registerRule(RULE_IDS.PHASE_EXTINCTION_START, {
    description: '滅絕階段開始',
    expansion: 'base',
    execute: async (context) => {
      const { gameState } = context;
      let newState = { ...gameState };

      // 執行滅絕處理
      const extinctResult = await context.executeRule(RULE_IDS.EXTINCTION_PROCESS, {
        ...context,
        gameState: newState,
      });
      newState = extinctResult.gameState;

      // 執行抽牌
      const drawResult = await context.executeRule(RULE_IDS.EXTINCTION_DRAW_CARDS, {
        ...context,
        gameState: newState,
      });
      newState = drawResult.gameState;

      // 更新起始玩家（順時針）
      newState.startingPlayerIndex =
        ((newState.startingPlayerIndex || 0) + 1) % newState.players.length;

      // 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'PHASE_START',
        phase: PHASES.EXTINCTION,
      });

      return { ...context, gameState: newState };
    },
  });

  /**
   * 遊戲初始化規則
   */
  engine.registerRule(RULE_IDS.GAME_INIT, {
    description: '初始化遊戲狀態',
    expansion: 'base',
    execute: (context) => {
      const { gameState, players } = context;

      const newState = {
        ...gameState,
        phase: PHASES.EVOLUTION,
        round: 1,
        players: players.map((p, index) => ({
          id: p.id,
          name: p.name,
          creatures: [],
          hand: [],
          discardPile: [],
          score: 0,
          passedEvolution: false,
          passedFeeding: false,
        })),
        foodPool: { red: 0, blue: 0 },
        deck: [],
        actionLog: [],
        startingPlayerIndex: 0,
        currentPlayerIndex: 0,
        isLastRound: false,
        gameOver: false,
      };

      return { ...context, gameState: newState };
    },
  });

  /**
   * 遊戲開始規則
   */
  engine.registerRule(RULE_IDS.GAME_START, {
    description: '開始遊戲',
    expansion: 'base',
    execute: async (context) => {
      const { gameState } = context;
      let newState = { ...gameState };

      // 發初始手牌
      const initialHandSize = 6;
      for (const player of newState.players) {
        for (let i = 0; i < initialHandSize && newState.deck.length > 0; i++) {
          const card = newState.deck.pop();
          player.hand.push(card);
        }
      }

      // 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'GAME_START',
        playerCount: newState.players.length,
        initialHandSize,
      });

      return { ...context, gameState: newState };
    },
  });
}

/**
 * 取得階段開始規則 ID
 * @param {string} phase - 階段
 * @returns {string|null} 規則 ID
 */
function getPhaseStartRuleId(phase) {
  switch (phase) {
    case PHASES.EVOLUTION:
      return RULE_IDS.PHASE_EVOLUTION_START;
    case PHASES.FOOD_SUPPLY:
      return RULE_IDS.PHASE_FOOD_START;
    case PHASES.FEEDING:
      return RULE_IDS.PHASE_FEEDING_START;
    case PHASES.EXTINCTION:
      return RULE_IDS.PHASE_EXTINCTION_START;
    default:
      return null;
  }
}

module.exports = { register, PHASES, PHASE_ORDER };
