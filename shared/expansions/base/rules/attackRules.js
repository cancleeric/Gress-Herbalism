/**
 * 攻擊規則
 *
 * @module expansions/base/rules/attackRules
 */

const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');
const { HOOK_NAMES } = require('../../../../backend/logic/evolution/rules/hookNames');

/**
 * 註冊攻擊規則
 * @param {RuleEngine} engine - 規則引擎
 */
function register(engine) {
  /**
   * 攻擊驗證規則
   */
  engine.registerRule(RULE_IDS.ATTACK_VALIDATE, {
    description: '驗證攻擊是否合法',
    expansion: 'base',
    execute: async (context) => {
      const { attacker, target, gameState, traitRegistry } = context;

      // 1. 檢查攻擊者是否為肉食
      const isCarnivore = attacker.traits?.some(t => t.type === 'carnivore');
      if (!isCarnivore) {
        return {
          ...context,
          valid: false,
          reason: '只有肉食生物才能攻擊',
        };
      }

      // 2. 檢查是否攻擊自己的生物
      if (attacker.ownerId === target.ownerId) {
        return {
          ...context,
          valid: false,
          reason: '不能攻擊自己的生物',
        };
      }

      // 3. 檢查是否已攻擊過
      if (attacker.hasAttackedThisTurn) {
        return {
          ...context,
          valid: false,
          reason: '本回合已經攻擊過',
        };
      }

      // 4. 檢查水生限制（攻擊者）
      const attackerIsAquatic = attacker.traits?.some(t => t.type === 'aquatic');
      const targetIsAquatic = target.traits?.some(t => t.type === 'aquatic');

      if (attackerIsAquatic && !targetIsAquatic) {
        return {
          ...context,
          valid: false,
          reason: '水生肉食不能攻擊非水生生物',
        };
      }

      // 5. 執行防禦檢查
      const defenseResult = await context.executeRule(
        RULE_IDS.ATTACK_CHECK_DEFENSE,
        context
      );

      return defenseResult;
    },
  });

  /**
   * 防禦檢查規則
   */
  engine.registerRule(RULE_IDS.ATTACK_CHECK_DEFENSE, {
    description: '檢查目標的防禦性狀',
    expansion: 'base',
    execute: (context) => {
      const { attacker, target, traitRegistry } = context;

      // 檢查每個防禦性狀
      for (const trait of target.traits || []) {
        const handler = traitRegistry?.get(trait.type);
        if (!handler || !handler.checkDefense) continue;

        const defenseResult = handler.checkDefense({
          defender: target,
          attacker,
          gameState: context.gameState,
        });

        if (!defenseResult.canAttack) {
          return {
            ...context,
            valid: false,
            reason: defenseResult.reason,
            blockedByTrait: trait.type,
          };
        }
      }

      return {
        ...context,
        valid: true,
        reason: '',
      };
    },
  });

  /**
   * 攻擊解決規則
   */
  engine.registerRule(RULE_IDS.ATTACK_RESOLVE, {
    description: '解決攻擊（處理防禦回應）',
    expansion: 'base',
    execute: async (context) => {
      const { attacker, target, gameState, traitRegistry } = context;

      // 收集所有可用的防禦回應
      const defenseResponses = [];

      for (const trait of target.traits || []) {
        const handler = traitRegistry?.get(trait.type);
        if (!handler || !handler.getDefenseResponse) continue;

        const response = handler.getDefenseResponse({
          defender: target,
          attacker,
          gameState,
        });

        if (response.canRespond) {
          defenseResponses.push({
            traitType: trait.type,
            ...response,
          });
        }
      }

      if (defenseResponses.length > 0) {
        // 需要玩家選擇防禦回應
        return {
          ...context,
          pendingDefenseResponse: true,
          defenseResponses,
        };
      }

      // 沒有防禦回應，直接執行攻擊
      return context.executeRule(RULE_IDS.ATTACK_EXECUTE, context);
    },
  });

  /**
   * 攻擊執行規則
   */
  engine.registerRule(RULE_IDS.ATTACK_EXECUTE, {
    description: '執行攻擊（目標滅絕，攻擊者獲得食物）',
    expansion: 'base',
    execute: async (context) => {
      const { attacker, target, gameState } = context;
      let newState = { ...gameState };

      // 1. 標記攻擊者已攻擊
      attacker.hasAttackedThisTurn = true;

      // 2. 攻擊者獲得 2 個藍色食物
      if (!attacker.food) attacker.food = { red: 0, blue: 0, yellow: 0 };
      attacker.food.blue += 2;

      // 3. 觸發攻擊成功鉤子
      if (context.triggerHook) {
        const hookResult = await context.triggerHook(HOOK_NAMES.ON_ATTACK_SUCCESS, {
          ...context,
          gameState: newState,
        });
        if (hookResult?.gameState) {
          newState = hookResult.gameState;
        }
      }

      // 4. 目標滅絕
      const extinctResult = await context.executeRule(RULE_IDS.CREATURE_EXTINCT, {
        ...context,
        gameState: newState,
        creature: target,
        attacker,
      });
      newState = extinctResult.gameState;

      // 5. 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'ATTACK_SUCCESS',
        attackerId: attacker.id,
        targetId: target.id,
        foodGained: 2,
      });

      return {
        ...context,
        gameState: newState,
        attackSuccess: true,
      };
    },
  });

  /**
   * 生物滅絕規則
   */
  engine.registerRule(RULE_IDS.CREATURE_EXTINCT, {
    description: '處理生物滅絕',
    expansion: 'base',
    execute: async (context) => {
      const { creature, attacker, gameState, traitRegistry } = context;
      let newState = { ...gameState };

      // 觸發滅絕前鉤子
      if (context.triggerHook) {
        const hookResult = await context.triggerHook(HOOK_NAMES.BEFORE_CREATURE_EXTINCT, {
          ...context,
          gameState: newState,
        });
        if (hookResult?.gameState) {
          newState = hookResult.gameState;
        }
      }

      // 處理毒液效果
      const hasPoisonous = creature.traits?.some(t => t.type === 'poisonous');
      if (hasPoisonous && attacker) {
        const poisonHandler = traitRegistry?.get('poisonous');
        if (poisonHandler && poisonHandler.onExtinct) {
          newState = poisonHandler.onExtinct(
            { creature, gameState: newState },
            attacker
          );
        }
      }

      // 觸發腐食效果
      if (attacker) {
        for (const player of newState.players) {
          for (const c of player.creatures || []) {
            if (c.id === creature.id) continue; // 跳過滅絕的生物

            const hasScavenger = c.traits?.some(t => t.type === 'scavenger');
            if (hasScavenger) {
              const scavengerHandler = traitRegistry?.get('scavenger');
              if (scavengerHandler && scavengerHandler.onOtherExtinct) {
                newState = scavengerHandler.onOtherExtinct(
                  { creature: c, gameState: newState },
                  creature,
                  attacker
                );
              }
            }
          }
        }
      }

      // 從玩家生物列表中移除
      const owner = newState.players.find(p => p.id === creature.ownerId);
      if (owner) {
        const index = owner.creatures?.findIndex(c => c.id === creature.id) ?? -1;
        if (index !== -1) {
          owner.creatures.splice(index, 1);
        }

        // 加入棄牌堆
        owner.discardPile = owner.discardPile || [];
        owner.discardPile.push(creature);
        for (const trait of creature.traits || []) {
          owner.discardPile.push({ type: 'trait', ...trait });
        }
      }

      // 移除相關的互動連結
      newState = removeInteractionLinks(newState, creature.id);

      // 觸發滅絕後鉤子
      if (context.triggerHook) {
        const hookResult = await context.triggerHook(HOOK_NAMES.ON_CREATURE_EXTINCT, {
          ...context,
          gameState: newState,
          extinctCreature: creature,
        });
        if (hookResult?.gameState) {
          newState = hookResult.gameState;
        }
      }

      // 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'CREATURE_EXTINCT',
        creatureId: creature.id,
        ownerId: creature.ownerId,
        attackerId: attacker?.id || null,
      });

      return {
        ...context,
        gameState: newState,
      };
    },
  });
}

/**
 * 移除與指定生物相關的互動連結
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @returns {Object} 更新後的遊戲狀態
 */
function removeInteractionLinks(gameState, creatureId) {
  for (const player of gameState.players) {
    for (const creature of player.creatures || []) {
      if (creature.interactionLinks) {
        creature.interactionLinks = creature.interactionLinks.filter(
          link => link.creature1Id !== creatureId && link.creature2Id !== creatureId
        );
      }
      // 清除共生連結
      if (creature.symbiosisRepresentativeId === creatureId) {
        creature.symbiosisRepresentativeId = null;
      }
    }
  }
  return gameState;
}

module.exports = { register, removeInteractionLinks };
