/**
 * 進食規則
 *
 * @module expansions/base/rules/feedingRules
 */

const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');
const { HOOK_NAMES } = require('../../../../backend/logic/evolution/rules/hookNames');

/**
 * 註冊進食規則
 * @param {RuleEngine} engine - 規則引擎
 */
function register(engine) {
  /**
   * 進食驗證規則
   */
  engine.registerRule(RULE_IDS.FEED_VALIDATE, {
    description: '驗證進食是否合法',
    expansion: 'base',
    execute: async (context) => {
      const { creature, gameState, traitRegistry } = context;

      // 1. 檢查冬眠狀態
      if (creature.isHibernating) {
        return {
          ...context,
          valid: false,
          reason: '冬眠中不能進食',
        };
      }

      // 2. 檢查共生限制
      const symbiosisResult = await context.executeRule(
        RULE_IDS.FEED_CHECK_SYMBIOSIS,
        context
      );
      if (!symbiosisResult.canFeed) {
        return {
          ...context,
          valid: false,
          reason: symbiosisResult.reason,
        };
      }

      // 3. 檢查是否為肉食（肉食不能從食物池進食）
      const isCarnivore = creature.traits?.some(t => t.type === 'carnivore');
      if (isCarnivore) {
        return {
          ...context,
          valid: false,
          reason: '肉食生物必須透過攻擊獲得食物',
        };
      }

      // 4. 檢查食物池是否有食物
      if ((gameState.foodPool?.red || 0) <= 0) {
        return {
          ...context,
          valid: false,
          reason: '食物池沒有食物',
        };
      }

      // 5. 檢查是否需要進食（是否已飽）
      const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
      const foodNeeded = creature.foodNeeded || 1;

      if (currentFood >= foodNeeded) {
        // 檢查是否有脂肪組織
        const hasFat = creature.traits?.some(t => t.type === 'fatTissue');
        const fatCount = creature.traits?.filter(t => t.type === 'fatTissue').length || 0;
        const currentFat = creature.food?.yellow || 0;

        if (!hasFat || currentFat >= fatCount) {
          return {
            ...context,
            valid: false,
            reason: '已經吃飽，無法再進食',
          };
        }
        // 有脂肪組織且未滿，可以繼續進食存入脂肪
      }

      return {
        ...context,
        valid: true,
        reason: '',
      };
    },
  });

  /**
   * 共生限制檢查規則
   */
  engine.registerRule(RULE_IDS.FEED_CHECK_SYMBIOSIS, {
    description: '檢查共生限制',
    expansion: 'base',
    execute: (context) => {
      const { creature, gameState } = context;

      // 檢查此生物是否是被保護者
      if (creature.symbiosisRepresentativeId) {
        // 找到代表
        const representative = findCreatureById(gameState, creature.symbiosisRepresentativeId);
        if (representative) {
          // 檢查代表是否吃飽
          const repFood = (representative.food?.red || 0) + (representative.food?.blue || 0);
          const repNeeded = representative.foodNeeded || 1;

          if (repFood < repNeeded) {
            return {
              ...context,
              canFeed: false,
              reason: '共生代表未吃飽，被保護者不能進食',
            };
          }
        }
      }

      // 也檢查舊式 interactionLinks
      for (const link of creature.interactionLinks || []) {
        if (link.type !== 'symbiosis') continue;

        if (link.protectedId === creature.id) {
          const representative = findCreatureById(gameState, link.representativeId);
          if (representative) {
            const repFood = (representative.food?.red || 0) + (representative.food?.blue || 0);
            const repNeeded = representative.foodNeeded || 1;

            if (repFood < repNeeded) {
              return {
                ...context,
                canFeed: false,
                reason: '共生代表未吃飽，被保護者不能進食',
              };
            }
          }
        }
      }

      return {
        ...context,
        canFeed: true,
      };
    },
  });

  /**
   * 進食執行規則
   */
  engine.registerRule(RULE_IDS.FEED_EXECUTE, {
    description: '執行進食',
    expansion: 'base',
    execute: async (context) => {
      const { creature, gameState, traitRegistry } = context;
      let newState = { ...gameState };

      // 1. 從食物池取出食物
      newState.foodPool.red -= 1;

      // 2. 決定食物存放位置
      const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
      const foodNeeded = creature.foodNeeded || 1;

      if (!creature.food) {
        creature.food = { red: 0, blue: 0, yellow: 0 };
      }

      let foodType = 'red';
      if (currentFood < foodNeeded) {
        // 正常進食
        creature.food.red += 1;
      } else {
        // 存入脂肪
        creature.food.yellow += 1;
        foodType = 'yellow';
      }

      // 3. 觸發進食後鉤子
      if (context.triggerHook) {
        const hookResult = await context.triggerHook(HOOK_NAMES.AFTER_FEED, {
          ...context,
          gameState: newState,
          feedCreature: creature,
          foodType: 'red',
        });
        if (hookResult?.gameState) {
          newState = hookResult.gameState;
        }
      }

      // 4. 處理溝通連鎖
      const commResult = await context.executeRule(RULE_IDS.FEED_CHAIN_COMMUNICATION, {
        ...context,
        gameState: newState,
        sourceCreature: creature,
        processedCreatures: new Set([creature.id]),
      });
      newState = commResult.gameState;

      // 5. 處理合作連鎖
      const coopResult = await context.executeRule(RULE_IDS.FEED_CHAIN_COOPERATION, {
        ...context,
        gameState: newState,
        sourceCreature: creature,
        foodType: 'red',
        processedCreatures: new Set([creature.id]),
      });
      newState = coopResult.gameState;

      // 6. 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'FEED',
        creatureId: creature.id,
        ownerId: creature.ownerId,
        foodType,
      });

      return {
        ...context,
        gameState: newState,
      };
    },
  });

  /**
   * 溝通連鎖規則
   */
  engine.registerRule(RULE_IDS.FEED_CHAIN_COMMUNICATION, {
    description: '處理溝通連鎖',
    expansion: 'base',
    execute: async (context) => {
      const { sourceCreature, gameState, processedCreatures } = context;
      let newState = { ...gameState };

      // 找到所有溝通連結的生物
      const links = getInteractionLinks(sourceCreature, 'communication');

      for (const linkedId of links) {
        // 跳過已處理的
        if (processedCreatures.has(linkedId)) continue;

        // 找到連結的生物
        const linkedCreature = findCreatureById(newState, linkedId);
        if (!linkedCreature) continue;

        // 檢查食物池是否還有食物
        if ((newState.foodPool?.red || 0) <= 0) break;

        // 給連結的生物食物
        newState.foodPool.red -= 1;
        if (!linkedCreature.food) {
          linkedCreature.food = { red: 0, blue: 0, yellow: 0 };
        }
        linkedCreature.food.red += 1;
        processedCreatures.add(linkedId);

        // 記錄
        newState.actionLog = newState.actionLog || [];
        newState.actionLog.push({
          type: 'COMMUNICATION_CHAIN',
          sourceId: sourceCreature.id,
          targetId: linkedId,
        });

        // 遞迴處理
        const recursiveResult = await context.executeRule(RULE_IDS.FEED_CHAIN_COMMUNICATION, {
          ...context,
          gameState: newState,
          sourceCreature: linkedCreature,
          processedCreatures,
        });
        newState = recursiveResult.gameState;
      }

      return {
        ...context,
        gameState: newState,
      };
    },
  });

  /**
   * 合作連鎖規則
   */
  engine.registerRule(RULE_IDS.FEED_CHAIN_COOPERATION, {
    description: '處理合作連鎖',
    expansion: 'base',
    execute: async (context) => {
      const { sourceCreature, gameState, foodType, processedCreatures } = context;
      let newState = { ...gameState };

      // 只有紅色或藍色食物觸發合作
      if (foodType !== 'red' && foodType !== 'blue') {
        return { ...context, gameState: newState };
      }

      const links = getInteractionLinks(sourceCreature, 'cooperation');

      for (const linkedId of links) {
        if (processedCreatures.has(linkedId)) continue;

        const linkedCreature = findCreatureById(newState, linkedId);
        if (!linkedCreature) continue;

        // 合作給藍色食物（不消耗食物池）
        if (!linkedCreature.food) {
          linkedCreature.food = { red: 0, blue: 0, yellow: 0 };
        }
        linkedCreature.food.blue += 1;
        processedCreatures.add(linkedId);

        newState.actionLog = newState.actionLog || [];
        newState.actionLog.push({
          type: 'COOPERATION_CHAIN',
          sourceId: sourceCreature.id,
          targetId: linkedId,
        });

        // 遞迴處理（藍色食物也會觸發合作）
        const recursiveResult = await context.executeRule(RULE_IDS.FEED_CHAIN_COOPERATION, {
          ...context,
          gameState: newState,
          sourceCreature: linkedCreature,
          foodType: 'blue',
          processedCreatures,
        });
        newState = recursiveResult.gameState;
      }

      return {
        ...context,
        gameState: newState,
      };
    },
  });
}

/**
 * 根據 ID 找到生物
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @returns {Object|null} 生物或 null
 */
function findCreatureById(gameState, creatureId) {
  for (const player of gameState.players) {
    const creature = player.creatures?.find(c => c.id === creatureId);
    if (creature) return creature;
  }
  return null;
}

/**
 * 取得生物的互動連結
 * @param {Object} creature - 生物
 * @param {string} type - 連結類型
 * @returns {string[]} 連結的生物 ID 列表
 */
function getInteractionLinks(creature, type) {
  const linkedIds = [];

  // 從 interactionLinks 取得
  for (const link of creature.interactionLinks || []) {
    if (link.type !== type) continue;

    const linkedId = link.creature1Id === creature.id
      ? link.creature2Id
      : link.creature1Id;

    if (linkedId) {
      linkedIds.push(linkedId);
    }
  }

  // 從性狀上的 linkedCreatureId 取得
  for (const trait of creature.traits || []) {
    if (trait.type === type && trait.linkedCreatureId) {
      if (!linkedIds.includes(trait.linkedCreatureId)) {
        linkedIds.push(trait.linkedCreatureId);
      }
    }
  }

  // 檢查 linkedCooperation / linkedCommunication
  const linkedArray = type === 'cooperation'
    ? creature.linkedCooperation
    : creature.linkedCommunication;

  for (const id of linkedArray || []) {
    if (!linkedIds.includes(id)) {
      linkedIds.push(id);
    }
  }

  return linkedIds;
}

module.exports = { register, findCreatureById, getInteractionLinks };
