/**
 * 演化論遊戲 - 進食邏輯模組
 *
 * 此模組負責進食相關的所有邏輯，包括：
 * - 一般進食（從食物池取得食物）
 * - 肉食攻擊
 * - 腐食觸發
 * - 互動性狀連鎖（溝通、合作）
 * - 共生限制
 *
 * @module logic/evolution/feedingLogic
 */

const {
  TRAIT_TYPES,
  FOOD_TYPES,
  CARNIVORE_ATTACK_FOOD_REWARD,
  TAIL_LOSS_FOOD_REWARD,
  SCAVENGER_FOOD_REWARD,
  AGILE_ESCAPE_THRESHOLD
} = require('../../../shared/constants/evolution');

const {
  hasTrait,
  getTrait,
  isCarnivore,
  canBeAttacked,
  rollAgileEscape,
  canUseTailLoss,
  canUseMimicry,
  checkIsFed,
  getCurrentFood,
  getFatStorageCapacity,
  removeTrait,
  findCreatureById
} = require('./creatureLogic');

// ==================== 進食狀態檢查 ====================

/**
 * 檢查共生限制
 * 被保護者只有在代表吃飽後才能進食
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 想進食的生物 ID
 * @returns {{ canFeed: boolean, reason: string }}
 */
function checkSymbiosis(gameState, creatureId) {
  const creature = findCreatureInGameState(gameState, creatureId);
  if (!creature) {
    return { canFeed: false, reason: '找不到生物' };
  }

  // 檢查是否為共生的被保護者
  const symbiosisLinks = creature.interactionLinks.filter(
    link => link.traitType === TRAIT_TYPES.SYMBIOSIS && link.creature2Id === creatureId
  );

  for (const link of symbiosisLinks) {
    const protector = findCreatureInGameState(gameState, link.creature1Id);
    if (protector && !protector.isFed) {
      return {
        canFeed: false,
        reason: '共生代表尚未吃飽，被保護者不能進食'
      };
    }
  }

  return { canFeed: true, reason: '' };
}

/**
 * 檢查生物是否可進食
 * 考慮：已吃飽、冬眠、共生限制、肉食限制
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @returns {{ canFeed: boolean, isCarnivore: boolean, reason: string }}
 */
function canCreatureFeed(gameState, creatureId) {
  const creature = findCreatureInGameState(gameState, creatureId);
  if (!creature) {
    return { canFeed: false, isCarnivore: false, reason: '找不到生物' };
  }

  // 檢查是否正在冬眠
  if (creature.hibernating) {
    return { canFeed: false, isCarnivore: false, reason: '生物正在冬眠' };
  }

  // 檢查是否已吃飽
  if (creature.isFed) {
    // 檢查是否有脂肪組織可以繼續儲存
    const fatCapacity = getFatStorageCapacity(creature);
    if (creature.food.yellow >= fatCapacity) {
      return { canFeed: false, isCarnivore: false, reason: '生物已吃飽且脂肪儲存已滿' };
    }
  }

  // 檢查共生限制
  const symbiosisCheck = checkSymbiosis(gameState, creatureId);
  if (!symbiosisCheck.canFeed) {
    return { canFeed: false, isCarnivore: false, reason: symbiosisCheck.reason };
  }

  // 檢查是否為肉食動物
  const creatureIsCarnivore = isCarnivore(creature);
  if (creatureIsCarnivore) {
    return {
      canFeed: true,
      isCarnivore: true,
      reason: '肉食動物必須透過攻擊其他生物獲得食物'
    };
  }

  return { canFeed: true, isCarnivore: false, reason: '' };
}

// ==================== 一般進食 ====================

/**
 * 餵食生物（從食物池取得食物）
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @param {string} foodType - 食物類型 ('red')
 * @returns {{ success: boolean, gameState: Object, chainEffects: Object[] }}
 */
function feedCreature(gameState, creatureId, foodType) {
  const creature = findCreatureInGameState(gameState, creatureId);
  if (!creature) {
    return { success: false, gameState, chainEffects: [] };
  }

  // 檢查是否可進食
  const feedCheck = canCreatureFeed(gameState, creatureId);
  if (!feedCheck.canFeed) {
    return { success: false, gameState, chainEffects: [], reason: feedCheck.reason };
  }

  // 肉食動物不能從食物池取得食物
  if (feedCheck.isCarnivore) {
    return {
      success: false,
      gameState,
      chainEffects: [],
      reason: '肉食動物必須透過攻擊獲得食物'
    };
  }

  // 檢查食物池是否有食物
  if (gameState.foodPool <= 0) {
    return { success: false, gameState, chainEffects: [], reason: '食物池已空' };
  }

  // 執行進食
  let newGameState = { ...gameState };
  newGameState.foodPool = gameState.foodPool - 1;

  // 更新生物的食物
  const updatedCreature = addFoodToCreature(creature, foodType);
  newGameState = updateCreatureInGameState(newGameState, updatedCreature);

  // 收集連鎖效果
  const chainEffects = [];

  // 處理溝通連鎖
  if (foodType === FOOD_TYPES.RED) {
    const commResult = processCommunication(newGameState, creatureId);
    newGameState = commResult.gameState;
    chainEffects.push(...commResult.chainEffects);
  }

  // 處理合作連鎖
  const coopResult = processCooperation(newGameState, creatureId, foodType);
  newGameState = coopResult.gameState;
  chainEffects.push(...coopResult.chainEffects);

  return { success: true, gameState: newGameState, chainEffects };
}

/**
 * 為生物添加食物
 *
 * @param {Object} creature - 生物
 * @param {string} foodType - 食物類型
 * @returns {Object} 更新後的生物
 */
function addFoodToCreature(creature, foodType) {
  const currentFood = getCurrentFood(creature);
  const updatedCreature = { ...creature };

  if (currentFood < creature.foodNeeded) {
    // 還沒吃飽，正常添加食物
    updatedCreature.food = {
      ...creature.food,
      [foodType]: creature.food[foodType] + 1
    };

    // 檢查是否吃飽
    if (getCurrentFood(updatedCreature) >= creature.foodNeeded) {
      updatedCreature.isFed = true;
    }
  } else {
    // 已吃飽，檢查是否有脂肪組織可儲存
    const fatCapacity = getFatStorageCapacity(creature);
    if (creature.food.yellow < fatCapacity) {
      updatedCreature.food = {
        ...creature.food,
        yellow: creature.food.yellow + 1
      };
    }
  }

  return updatedCreature;
}

// ==================== 肉食攻擊 ====================

/**
 * 肉食生物發動攻擊
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} attackerId - 攻擊者 ID
 * @param {string} defenderId - 防守者 ID
 * @returns {{ success: boolean, gameState: Object, pendingResponse: Object|null, reason: string }}
 */
function attackCreature(gameState, attackerId, defenderId) {
  const attacker = findCreatureInGameState(gameState, attackerId);
  const defender = findCreatureInGameState(gameState, defenderId);

  if (!attacker || !defender) {
    return {
      success: false,
      gameState,
      pendingResponse: null,
      reason: '找不到攻擊者或防守者'
    };
  }

  // 驗證攻擊
  const attackCheck = canBeAttacked(attacker, defender, gameState);
  if (!attackCheck.canAttack) {
    return {
      success: false,
      gameState,
      pendingResponse: null,
      reason: attackCheck.reason
    };
  }

  // 檢查防守方的防禦選項
  const defenseOptions = getDefenseOptions(defender, attacker, gameState);

  if (defenseOptions.length > 0) {
    // 有防禦選項，需要等待防守方回應
    return {
      success: true,
      gameState,
      pendingResponse: {
        type: 'defense',
        attackerId,
        defenderId,
        options: defenseOptions
      },
      reason: ''
    };
  }

  // 沒有防禦選項，直接解析攻擊
  return resolveAttack(gameState, {
    attackerId,
    defenderId,
    defenseChoice: null
  });
}

/**
 * 取得防守方的防禦選項
 *
 * @param {Object} defender - 防守方
 * @param {Object} attacker - 攻擊方
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object[]} 防禦選項列表
 */
function getDefenseOptions(defender, attacker, gameState) {
  const options = [];

  // 斷尾
  if (canUseTailLoss(defender)) {
    options.push({
      type: 'tailLoss',
      description: '棄置一張性狀來取消攻擊'
    });
  }

  // 擬態
  if (canUseMimicry(defender)) {
    const mimicryTargets = getMimicryTargets(defender, attacker, gameState);
    if (mimicryTargets.length > 0) {
      options.push({
        type: 'mimicry',
        description: '將攻擊轉移給另一隻生物',
        targets: mimicryTargets.map(c => c.id)
      });
    }
  }

  // 敏捷（自動觸發，不是選項）
  if (hasTrait(defender, TRAIT_TYPES.AGILE)) {
    options.push({
      type: 'agile',
      description: '擲骰嘗試逃脫 (4-6 成功)',
      auto: true
    });
  }

  return options;
}

/**
 * 取得擬態可轉移的目標
 *
 * @param {Object} defender - 防守方（使用擬態）
 * @param {Object} attacker - 攻擊方
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object[]} 可轉移攻擊的目標列表
 */
function getMimicryTargets(defender, attacker, gameState) {
  const targets = [];
  const defenderOwner = defender.ownerId;

  // 找出同一玩家的其他生物
  for (const player of Object.values(gameState.players)) {
    if (player.id === defenderOwner) {
      for (const creature of player.creatures || []) {
        if (creature.id !== defender.id) {
          // 檢查這隻生物是否可被攻擊
          const canAttack = canBeAttacked(attacker, creature, gameState);
          if (canAttack.canAttack) {
            targets.push(creature);
          }
        }
      }
    }
  }

  return targets;
}

/**
 * 解析攻擊結果
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {Object} attackResult - 攻擊結果
 * @returns {{ success: boolean, gameState: Object, attackerFood: number, defenderDead: boolean, chainEffects: Object[] }}
 */
function resolveAttack(gameState, attackResult) {
  const { attackerId, defenderId, defenseChoice } = attackResult;
  let newGameState = { ...gameState };
  let attackerFood = 0;
  let defenderDead = false;
  const chainEffects = [];

  const attacker = findCreatureInGameState(newGameState, attackerId);
  let defender = findCreatureInGameState(newGameState, defenderId);

  if (!attacker || !defender) {
    return { success: false, gameState, attackerFood: 0, defenderDead: false, chainEffects: [] };
  }

  // 處理防禦選擇
  if (defenseChoice) {
    switch (defenseChoice.type) {
      case 'tailLoss': {
        // 斷尾：棄置性狀，攻擊取消
        const traitId = defenseChoice.traitId;
        const removeResult = removeTrait(defender, traitId);
        if (removeResult.success) {
          newGameState = updateCreatureInGameState(newGameState, removeResult.creature);
          // 攻擊者獲得 1 藍色食物
          const updatedAttacker = addFoodToCreature(attacker, FOOD_TYPES.BLUE);
          newGameState = updateCreatureInGameState(newGameState, updatedAttacker);
          attackerFood = TAIL_LOSS_FOOD_REWARD;

          chainEffects.push({
            type: 'tailLoss',
            creatureId: defenderId,
            removedTraitId: traitId
          });
        }
        return {
          success: true,
          gameState: newGameState,
          attackerFood,
          defenderDead: false,
          chainEffects
        };
      }

      case 'mimicry': {
        // 擬態：將攻擊轉移給另一隻生物
        const newTargetId = defenseChoice.targetId;

        // 標記此生物本回合已使用擬態
        const updatedDefender = { ...defender, usedMimicryThisTurn: true };
        newGameState = updateCreatureInGameState(newGameState, updatedDefender);

        chainEffects.push({
          type: 'mimicry',
          fromCreatureId: defenderId,
          toCreatureId: newTargetId
        });

        // 重新發動攻擊（針對新目標）
        return attackCreature(newGameState, attackerId, newTargetId);
      }

      case 'agile': {
        // 敏捷：擲骰逃脫
        const escapeResult = rollAgileEscape(defender);
        chainEffects.push({
          type: 'agileRoll',
          creatureId: defenderId,
          diceResult: escapeResult.diceResult,
          escaped: escapeResult.escaped
        });

        if (escapeResult.escaped) {
          // 逃脫成功
          return {
            success: true,
            gameState: newGameState,
            attackerFood: 0,
            defenderDead: false,
            chainEffects
          };
        }
        // 逃脫失敗，繼續執行攻擊
        break;
      }
    }
  } else if (hasTrait(defender, TRAIT_TYPES.AGILE)) {
    // 自動觸發敏捷
    const escapeResult = rollAgileEscape(defender);
    chainEffects.push({
      type: 'agileRoll',
      creatureId: defenderId,
      diceResult: escapeResult.diceResult,
      escaped: escapeResult.escaped
    });

    if (escapeResult.escaped) {
      return {
        success: true,
        gameState: newGameState,
        attackerFood: 0,
        defenderDead: false,
        chainEffects
      };
    }
  }

  // 攻擊成功
  defenderDead = true;

  // 檢查毒液
  if (hasTrait(defender, TRAIT_TYPES.POISONOUS)) {
    const poisonedAttacker = { ...attacker, isPoisoned: true };
    newGameState = updateCreatureInGameState(newGameState, poisonedAttacker);
    chainEffects.push({
      type: 'poisoned',
      creatureId: attackerId
    });
  }

  // 攻擊者獲得 2 藍色食物
  let updatedAttacker = findCreatureInGameState(newGameState, attackerId);
  for (let i = 0; i < CARNIVORE_ATTACK_FOOD_REWARD; i++) {
    updatedAttacker = addFoodToCreature(updatedAttacker, FOOD_TYPES.BLUE);
  }
  newGameState = updateCreatureInGameState(newGameState, updatedAttacker);
  attackerFood = CARNIVORE_ATTACK_FOOD_REWARD;

  // 處理合作連鎖（攻擊者獲得藍色食物）
  const coopResult = processCooperation(newGameState, attackerId, FOOD_TYPES.BLUE);
  newGameState = coopResult.gameState;
  chainEffects.push(...coopResult.chainEffects);

  // 移除死亡生物
  newGameState = removeCreatureFromGameState(newGameState, defenderId);
  chainEffects.push({
    type: 'death',
    creatureId: defenderId
  });

  // 觸發腐食效果
  const scavengerResult = triggerScavenger(newGameState, defenderId);
  newGameState = scavengerResult.gameState;
  chainEffects.push(...scavengerResult.chainEffects);

  return {
    success: true,
    gameState: newGameState,
    attackerFood,
    defenderDead,
    chainEffects
  };
}

// ==================== 腐食觸發 ====================

/**
 * 觸發腐食效果
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} deadCreatureId - 死亡生物 ID
 * @returns {{ gameState: Object, chainEffects: Object[] }}
 */
function triggerScavenger(gameState, deadCreatureId) {
  let newGameState = { ...gameState };
  const chainEffects = [];

  // 找出所有腐食生物
  const scavengers = [];
  for (const player of Object.values(newGameState.players)) {
    for (const creature of player.creatures || []) {
      if (hasTrait(creature, TRAIT_TYPES.SCAVENGER)) {
        scavengers.push(creature);
      }
    }
  }

  // 每隻腐食生物獲得 1 藍色食物
  for (const scavenger of scavengers) {
    const updatedScavenger = addFoodToCreature(scavenger, FOOD_TYPES.BLUE);
    newGameState = updateCreatureInGameState(newGameState, updatedScavenger);
    chainEffects.push({
      type: 'scavenger',
      creatureId: scavenger.id,
      foodGained: SCAVENGER_FOOD_REWARD
    });

    // 處理合作連鎖
    const coopResult = processCooperation(newGameState, scavenger.id, FOOD_TYPES.BLUE);
    newGameState = coopResult.gameState;
    chainEffects.push(...coopResult.chainEffects);
  }

  return { gameState: newGameState, chainEffects };
}

// ==================== 互動性狀連鎖 ====================

/**
 * 處理溝通連鎖
 * 當生物獲得紅色食物時，連結的生物也從中央獲得紅色食物
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} fedCreatureId - 被餵食的生物 ID
 * @param {Set} [processedCreatures] - 已處理的生物（避免無限迴圈）
 * @returns {{ gameState: Object, chainEffects: Object[], chainedCreatures: string[] }}
 */
function processCommunication(gameState, fedCreatureId, processedCreatures = new Set()) {
  // 避免無限迴圈
  if (processedCreatures.has(fedCreatureId)) {
    return { gameState, chainEffects: [], chainedCreatures: [] };
  }
  processedCreatures.add(fedCreatureId);

  const creature = findCreatureInGameState(gameState, fedCreatureId);
  if (!creature) {
    return { gameState, chainEffects: [], chainedCreatures: [] };
  }

  let newGameState = { ...gameState };
  const chainEffects = [];
  const chainedCreatures = [];

  // 找出溝通連結
  const commLinks = creature.interactionLinks.filter(
    link => link.traitType === TRAIT_TYPES.COMMUNICATION
  );

  for (const link of commLinks) {
    const linkedCreatureId = link.creature1Id === fedCreatureId
      ? link.creature2Id
      : link.creature1Id;

    if (processedCreatures.has(linkedCreatureId)) continue;

    const linkedCreature = findCreatureInGameState(newGameState, linkedCreatureId);
    if (!linkedCreature) continue;

    // 檢查食物池是否有食物
    if (newGameState.foodPool <= 0) break;

    // 檢查連結生物是否可進食
    const feedCheck = canCreatureFeed(newGameState, linkedCreatureId);
    if (!feedCheck.canFeed || feedCheck.isCarnivore) continue;

    // 連結生物也獲得紅色食物
    newGameState.foodPool -= 1;
    const updatedLinkedCreature = addFoodToCreature(linkedCreature, FOOD_TYPES.RED);
    newGameState = updateCreatureInGameState(newGameState, updatedLinkedCreature);

    chainedCreatures.push(linkedCreatureId);
    chainEffects.push({
      type: 'communication',
      fromCreatureId: fedCreatureId,
      toCreatureId: linkedCreatureId
    });

    // 遞迴處理連鎖
    const recursiveResult = processCommunication(newGameState, linkedCreatureId, processedCreatures);
    newGameState = recursiveResult.gameState;
    chainEffects.push(...recursiveResult.chainEffects);
    chainedCreatures.push(...recursiveResult.chainedCreatures);

    // 處理合作連鎖
    const coopResult = processCooperation(newGameState, linkedCreatureId, FOOD_TYPES.RED);
    newGameState = coopResult.gameState;
    chainEffects.push(...coopResult.chainEffects);
  }

  return { gameState: newGameState, chainEffects, chainedCreatures };
}

/**
 * 處理合作連鎖
 * 當生物獲得紅/藍食物時，連結的生物獲得藍色食物
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} fedCreatureId - 被餵食的生物 ID
 * @param {string} foodType - 食物類型
 * @param {Set} [processedCreatures] - 已處理的生物
 * @returns {{ gameState: Object, chainEffects: Object[], chainedCreatures: string[] }}
 */
function processCooperation(gameState, fedCreatureId, foodType, processedCreatures = new Set()) {
  // 只有紅色或藍色食物會觸發合作
  if (foodType !== FOOD_TYPES.RED && foodType !== FOOD_TYPES.BLUE) {
    return { gameState, chainEffects: [], chainedCreatures: [] };
  }

  // 避免無限迴圈
  const key = `${fedCreatureId}_${foodType}`;
  if (processedCreatures.has(key)) {
    return { gameState, chainEffects: [], chainedCreatures: [] };
  }
  processedCreatures.add(key);

  const creature = findCreatureInGameState(gameState, fedCreatureId);
  if (!creature) {
    return { gameState, chainEffects: [], chainedCreatures: [] };
  }

  let newGameState = { ...gameState };
  const chainEffects = [];
  const chainedCreatures = [];

  // 找出合作連結
  const coopLinks = creature.interactionLinks.filter(
    link => link.traitType === TRAIT_TYPES.COOPERATION
  );

  for (const link of coopLinks) {
    const linkedCreatureId = link.creature1Id === fedCreatureId
      ? link.creature2Id
      : link.creature1Id;

    const linkedKey = `${linkedCreatureId}_${FOOD_TYPES.BLUE}`;
    if (processedCreatures.has(linkedKey)) continue;

    const linkedCreature = findCreatureInGameState(newGameState, linkedCreatureId);
    if (!linkedCreature) continue;

    // 連結生物獲得藍色食物（不需要從食物池取得）
    const updatedLinkedCreature = addFoodToCreature(linkedCreature, FOOD_TYPES.BLUE);
    newGameState = updateCreatureInGameState(newGameState, updatedLinkedCreature);

    chainedCreatures.push(linkedCreatureId);
    chainEffects.push({
      type: 'cooperation',
      fromCreatureId: fedCreatureId,
      toCreatureId: linkedCreatureId
    });

    // 遞迴處理連鎖（合作獲得藍色食物也會觸發其他合作）
    const recursiveResult = processCooperation(newGameState, linkedCreatureId, FOOD_TYPES.BLUE, processedCreatures);
    newGameState = recursiveResult.gameState;
    chainEffects.push(...recursiveResult.chainEffects);
    chainedCreatures.push(...recursiveResult.chainedCreatures);
  }

  return { gameState: newGameState, chainEffects, chainedCreatures };
}

// ==================== 特殊能力 ====================

/**
 * 使用掠奪能力
 * 偷取其他未吃飽生物身上的食物
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} robberId - 掠奪者 ID
 * @param {string} targetId - 目標生物 ID
 * @returns {{ success: boolean, gameState: Object, chainEffects: Object[] }}
 */
function useRobbery(gameState, robberId, targetId) {
  const robber = findCreatureInGameState(gameState, robberId);
  const target = findCreatureInGameState(gameState, targetId);

  if (!robber || !target) {
    return { success: false, gameState, chainEffects: [], reason: '找不到生物' };
  }

  if (!hasTrait(robber, TRAIT_TYPES.ROBBERY)) {
    return { success: false, gameState, chainEffects: [], reason: '沒有掠奪性狀' };
  }

  if (robber.usedRobberyThisPhase) {
    return { success: false, gameState, chainEffects: [], reason: '本階段已使用過掠奪' };
  }

  if (target.isFed) {
    return { success: false, gameState, chainEffects: [], reason: '目標已吃飽，無法掠奪' };
  }

  // 檢查目標是否有食物
  const targetFood = getCurrentFood(target);
  if (targetFood === 0) {
    return { success: false, gameState, chainEffects: [], reason: '目標沒有食物可掠奪' };
  }

  let newGameState = { ...gameState };
  const chainEffects = [];

  // 決定偷取的食物類型（優先偷藍色）
  let stolenFoodType;
  if (target.food.blue > 0) {
    stolenFoodType = FOOD_TYPES.BLUE;
  } else {
    stolenFoodType = FOOD_TYPES.RED;
  }

  // 從目標移除食物
  const updatedTarget = {
    ...target,
    food: {
      ...target.food,
      [stolenFoodType]: target.food[stolenFoodType] - 1
    }
  };
  newGameState = updateCreatureInGameState(newGameState, updatedTarget);

  // 給掠奪者添加食物
  let updatedRobber = addFoodToCreature(robber, stolenFoodType);
  updatedRobber = { ...updatedRobber, usedRobberyThisPhase: true };
  newGameState = updateCreatureInGameState(newGameState, updatedRobber);

  chainEffects.push({
    type: 'robbery',
    fromCreatureId: targetId,
    toCreatureId: robberId,
    foodType: stolenFoodType
  });

  // 處理合作連鎖
  const coopResult = processCooperation(newGameState, robberId, stolenFoodType);
  newGameState = coopResult.gameState;
  chainEffects.push(...coopResult.chainEffects);

  return { success: true, gameState: newGameState, chainEffects };
}

/**
 * 使用踐踏能力
 * 移除食物池中的一個紅色食物
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 使用踐踏的生物 ID
 * @returns {{ success: boolean, gameState: Object }}
 */
function useTrampling(gameState, creatureId) {
  const creature = findCreatureInGameState(gameState, creatureId);

  if (!creature) {
    return { success: false, gameState, reason: '找不到生物' };
  }

  if (!hasTrait(creature, TRAIT_TYPES.TRAMPLING)) {
    return { success: false, gameState, reason: '沒有踐踏性狀' };
  }

  if (gameState.foodPool <= 0) {
    return { success: false, gameState, reason: '食物池已空' };
  }

  const newGameState = {
    ...gameState,
    foodPool: gameState.foodPool - 1
  };

  return { success: true, gameState: newGameState };
}

/**
 * 使用冬眠能力
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 使用冬眠的生物 ID
 * @param {boolean} isLastRound - 是否為最後一回合
 * @returns {{ success: boolean, gameState: Object }}
 */
function useHibernation(gameState, creatureId, isLastRound = false) {
  const creature = findCreatureInGameState(gameState, creatureId);

  if (!creature) {
    return { success: false, gameState, reason: '找不到生物' };
  }

  if (!hasTrait(creature, TRAIT_TYPES.HIBERNATION)) {
    return { success: false, gameState, reason: '沒有冬眠性狀' };
  }

  if (isLastRound) {
    return { success: false, gameState, reason: '最後一回合不能使用冬眠' };
  }

  const updatedCreature = {
    ...creature,
    hibernating: true,
    isFed: true
  };

  const newGameState = updateCreatureInGameState(gameState, updatedCreature);

  return { success: true, gameState: newGameState };
}

// ==================== 輔助函數 ====================

/**
 * 在遊戲狀態中找出生物
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @returns {Object|null}
 */
function findCreatureInGameState(gameState, creatureId) {
  if (!gameState || !gameState.players) return null;

  for (const player of Object.values(gameState.players)) {
    if (player.creatures) {
      const creature = player.creatures.find(c => c.id === creatureId);
      if (creature) return creature;
    }
  }

  return null;
}

/**
 * 更新遊戲狀態中的生物
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {Object} updatedCreature - 更新後的生物
 * @returns {Object} 更新後的遊戲狀態
 */
function updateCreatureInGameState(gameState, updatedCreature) {
  const newGameState = { ...gameState };
  newGameState.players = { ...gameState.players };

  for (const [playerId, player] of Object.entries(newGameState.players)) {
    if (player.creatures) {
      const index = player.creatures.findIndex(c => c.id === updatedCreature.id);
      if (index !== -1) {
        newGameState.players[playerId] = {
          ...player,
          creatures: [
            ...player.creatures.slice(0, index),
            updatedCreature,
            ...player.creatures.slice(index + 1)
          ]
        };
        break;
      }
    }
  }

  return newGameState;
}

/**
 * 從遊戲狀態中移除生物
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @returns {Object} 更新後的遊戲狀態
 */
function removeCreatureFromGameState(gameState, creatureId) {
  const newGameState = { ...gameState };
  newGameState.players = { ...gameState.players };

  for (const [playerId, player] of Object.entries(newGameState.players)) {
    if (player.creatures) {
      const index = player.creatures.findIndex(c => c.id === creatureId);
      if (index !== -1) {
        newGameState.players[playerId] = {
          ...player,
          creatures: player.creatures.filter(c => c.id !== creatureId)
        };
        break;
      }
    }
  }

  return newGameState;
}

// ==================== 導出 ====================

module.exports = {
  // 進食狀態檢查
  checkSymbiosis,
  canCreatureFeed,

  // 一般進食
  feedCreature,
  addFoodToCreature,

  // 肉食攻擊
  attackCreature,
  getDefenseOptions,
  getMimicryTargets,
  resolveAttack,

  // 腐食觸發
  triggerScavenger,

  // 互動性狀連鎖
  processCommunication,
  processCooperation,

  // 特殊能力
  useRobbery,
  useTrampling,
  useHibernation,

  // 輔助函數
  findCreatureInGameState,
  updateCreatureInGameState,
  removeCreatureFromGameState
};
