/**
 * 演化論遊戲 - 生物邏輯模組
 *
 * 此模組負責生物相關的所有邏輯，包括：
 * - 生物創建與管理
 * - 性狀添加與移除
 * - 食量計算
 * - 攻擊判定
 * - 滅絕判定
 *
 * @module logic/evolution/creatureLogic
 */

const {
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
  INTERACTIVE_TRAITS,
  isInteractiveTrait,
  isStackableTrait,
  areTraitsIncompatible,
  getTraitInfo
} = require('../../../shared/constants/evolution');

const { validateTraitPlacement } = require('./cardLogic');

// ==================== ID 產生器 ====================

let creatureIdCounter = 0;
let traitIdCounter = 0;

/**
 * 產生唯一的生物 ID
 * @returns {string} 唯一的生物 ID
 */
function generateCreatureId() {
  creatureIdCounter++;
  return `creature_${String(creatureIdCounter).padStart(3, '0')}`;
}

/**
 * 產生唯一的性狀 ID
 * @returns {string} 唯一的性狀 ID
 */
function generateTraitId() {
  traitIdCounter++;
  return `trait_${String(traitIdCounter).padStart(3, '0')}`;
}

/**
 * 重置生物 ID 計數器（主要用於測試）
 */
function resetCreatureIdCounter() {
  creatureIdCounter = 0;
}

/**
 * 重置性狀 ID 計數器（主要用於測試）
 */
function resetTraitIdCounter() {
  traitIdCounter = 0;
}

// ==================== 生物創建 ====================

/**
 * 創造新生物
 * 每張卡牌都可以翻面創造一個新生物
 *
 * @param {string} ownerId - 擁有者玩家 ID
 * @param {string} cardId - 用來創造生物的卡牌 ID
 * @returns {Creature} 新生物
 */
function createCreature(ownerId, cardId) {
  return {
    id: generateCreatureId(),
    ownerId: ownerId,
    sourceCardId: cardId,
    traits: [],
    food: {
      red: 0,
      blue: 0,
      yellow: 0
    },
    foodNeeded: 1,
    isFed: false,
    hibernating: false,
    interactionLinks: [],
    isPoisoned: false,
    usedMimicryThisTurn: false,
    usedRobberyThisPhase: false
  };
}

// ==================== 性狀管理 ====================

/**
 * 為生物添加性狀
 *
 * @param {Creature} creature - 目標生物
 * @param {string} traitType - 性狀類型
 * @param {string} cardId - 卡牌 ID
 * @param {string} playerId - 放置者玩家 ID
 * @param {Creature} [linkedCreature] - 連結生物（互動性狀用）
 * @returns {{ success: boolean, creature: Creature, linkedCreature: Creature|null, reason: string }}
 */
function addTrait(creature, traitType, cardId, playerId, linkedCreature = null) {
  // 驗證性狀放置
  const validation = validateTraitPlacement(creature, traitType, playerId, linkedCreature);
  if (!validation.valid) {
    return {
      success: false,
      creature: creature,
      linkedCreature: linkedCreature,
      reason: validation.reason
    };
  }

  const traitInfo = TRAIT_DEFINITIONS[traitType];
  const traitId = generateTraitId();

  // 建立性狀物件
  const trait = {
    id: traitId,
    type: traitType,
    cardId: cardId,
    foodBonus: traitInfo.foodBonus || 0
  };

  // 更新生物
  const updatedCreature = {
    ...creature,
    traits: [...creature.traits, trait]
  };

  // 重新計算食量
  updatedCreature.foodNeeded = calculateFoodNeed(updatedCreature);

  // 處理互動性狀
  let updatedLinkedCreature = linkedCreature;
  if (isInteractiveTrait(traitType) && linkedCreature) {
    const linkedTraitId = generateTraitId();
    const linkedTrait = {
      id: linkedTraitId,
      type: traitType,
      cardId: cardId,
      linkedTraitId: traitId,
      linkedCreatureId: creature.id,
      foodBonus: 0
    };

    // 更新原性狀的連結資訊
    trait.linkedTraitId = linkedTraitId;
    trait.linkedCreatureId = linkedCreature.id;

    // 更新連結生物
    updatedLinkedCreature = {
      ...linkedCreature,
      traits: [...linkedCreature.traits, linkedTrait]
    };

    // 添加互動連結記錄
    const linkRecord = {
      traitType: traitType,
      creature1Id: updatedCreature.id,
      creature2Id: updatedLinkedCreature.id,
      trait1Id: traitId,
      trait2Id: linkedTraitId
    };

    updatedCreature.interactionLinks = [
      ...updatedCreature.interactionLinks,
      linkRecord
    ];
    updatedLinkedCreature.interactionLinks = [
      ...updatedLinkedCreature.interactionLinks,
      linkRecord
    ];
  }

  return {
    success: true,
    creature: updatedCreature,
    linkedCreature: updatedLinkedCreature,
    reason: ''
  };
}

/**
 * 移除生物的性狀（斷尾用）
 *
 * @param {Creature} creature - 目標生物
 * @param {string} traitId - 性狀 ID
 * @returns {{ success: boolean, creature: Creature, removedTrait: Object|null, reason: string }}
 */
function removeTrait(creature, traitId) {
  const traitIndex = creature.traits.findIndex(t => t.id === traitId);

  if (traitIndex === -1) {
    return {
      success: false,
      creature: creature,
      removedTrait: null,
      reason: '找不到指定的性狀'
    };
  }

  const removedTrait = creature.traits[traitIndex];

  // 建立更新後的性狀列表
  const updatedTraits = creature.traits.filter(t => t.id !== traitId);

  // 移除相關的互動連結
  const updatedLinks = creature.interactionLinks.filter(
    link => link.trait1Id !== traitId && link.trait2Id !== traitId
  );

  const updatedCreature = {
    ...creature,
    traits: updatedTraits,
    interactionLinks: updatedLinks
  };

  // 重新計算食量
  updatedCreature.foodNeeded = calculateFoodNeed(updatedCreature);

  return {
    success: true,
    creature: updatedCreature,
    removedTrait: removedTrait,
    reason: ''
  };
}

// ==================== 性狀查詢 ====================

/**
 * 檢查生物是否擁有指定性狀
 *
 * @param {Creature} creature - 生物
 * @param {string} traitType - 性狀類型
 * @returns {boolean}
 */
function hasTrait(creature, traitType) {
  return creature.traits.some(t => t.type === traitType);
}

/**
 * 取得生物的指定性狀
 *
 * @param {Creature} creature - 生物
 * @param {string} traitType - 性狀類型
 * @returns {Object|null} 性狀物件或 null
 */
function getTrait(creature, traitType) {
  return creature.traits.find(t => t.type === traitType) || null;
}

/**
 * 取得生物的所有脂肪組織數量
 *
 * @param {Creature} creature - 生物
 * @returns {number} 脂肪組織數量
 */
function getFatTissueCount(creature) {
  return creature.traits.filter(t => t.type === TRAIT_TYPES.FAT_TISSUE).length;
}

// ==================== 食量計算 ====================

/**
 * 計算生物的食量需求
 * 基礎 1 + 肉食 +1 + 巨化 +1 + 寄生蟲 +2 (每個)
 *
 * @param {Creature} creature - 生物
 * @returns {number} 食量需求
 */
function calculateFoodNeed(creature) {
  let need = 1; // 基礎食量

  creature.traits.forEach(trait => {
    const foodBonus = trait.foodBonus || 0;
    need += foodBonus;
  });

  return need;
}

/**
 * 計算生物當前已獲得的食物總量
 *
 * @param {Creature} creature - 生物
 * @returns {number} 當前食物總量
 */
function getCurrentFood(creature) {
  return creature.food.red + creature.food.blue;
}

/**
 * 檢查生物是否已吃飽
 *
 * @param {Creature} creature - 生物
 * @returns {boolean}
 */
function checkIsFed(creature) {
  return getCurrentFood(creature) >= creature.foodNeeded;
}

/**
 * 計算脂肪組織可儲存的上限
 *
 * @param {Creature} creature - 生物
 * @returns {number} 脂肪儲存上限
 */
function getFatStorageCapacity(creature) {
  return getFatTissueCount(creature);
}

// ==================== 攻擊判定 ====================

/**
 * 判定攻擊方是否為肉食動物
 *
 * @param {Creature} creature - 生物
 * @returns {boolean}
 */
function isCarnivore(creature) {
  return hasTrait(creature, TRAIT_TYPES.CARNIVORE);
}

/**
 * 判定防守方是否可被攻擊
 * 考慮：偽裝、銳目、穴居、水生、巨化、共生
 *
 * @param {Creature} attacker - 攻擊方
 * @param {Creature} defender - 防守方
 * @param {Object} [gameState] - 遊戲狀態（用於檢查共生）
 * @returns {{ canAttack: boolean, reason: string }}
 */
function canBeAttacked(attacker, defender, gameState = null) {
  // 1. 攻擊者必須是肉食動物
  if (!isCarnivore(attacker)) {
    return { canAttack: false, reason: '攻擊者不是肉食動物' };
  }

  // 2. 不能攻擊自己
  if (attacker.id === defender.id) {
    return { canAttack: false, reason: '不能攻擊自己' };
  }

  // 3. 檢查偽裝 - 需要銳目才能攻擊
  if (hasTrait(defender, TRAIT_TYPES.CAMOUFLAGE)) {
    if (!hasTrait(attacker, TRAIT_TYPES.SHARP_VISION)) {
      return { canAttack: false, reason: '目標有偽裝，需要銳目才能攻擊' };
    }
  }

  // 4. 檢查穴居 - 吃飽時無法被攻擊
  if (hasTrait(defender, TRAIT_TYPES.BURROWING) && defender.isFed) {
    return { canAttack: false, reason: '目標有穴居且已吃飽，無法被攻擊' };
  }

  // 5. 檢查水生
  const attackerIsAquatic = hasTrait(attacker, TRAIT_TYPES.AQUATIC);
  const defenderIsAquatic = hasTrait(defender, TRAIT_TYPES.AQUATIC);

  if (attackerIsAquatic && !defenderIsAquatic) {
    return { canAttack: false, reason: '水生肉食只能攻擊水生生物' };
  }

  if (!attackerIsAquatic && defenderIsAquatic) {
    return { canAttack: false, reason: '只有水生肉食可以攻擊水生生物' };
  }

  // 6. 檢查巨化
  const attackerIsMassive = hasTrait(attacker, TRAIT_TYPES.MASSIVE);
  const defenderIsMassive = hasTrait(defender, TRAIT_TYPES.MASSIVE);

  if (defenderIsMassive && !attackerIsMassive) {
    return { canAttack: false, reason: '只有巨化肉食可以攻擊巨化生物' };
  }

  // 7. 檢查共生（如果有遊戲狀態）
  if (gameState) {
    const symbiosisProtection = checkSymbiosisProtection(defender, gameState);
    if (symbiosisProtection.isProtected) {
      return {
        canAttack: false,
        reason: `目標受共生保護，只能攻擊其代表 ${symbiosisProtection.protectorId}`
      };
    }
  }

  return { canAttack: true, reason: '' };
}

/**
 * 檢查共生保護
 *
 * @param {Creature} creature - 被攻擊的生物
 * @param {Object} gameState - 遊戲狀態
 * @returns {{ isProtected: boolean, protectorId: string|null }}
 */
function checkSymbiosisProtection(creature, gameState) {
  // 檢查是否有共生連結
  const symbiosisLinks = creature.interactionLinks.filter(
    link => link.traitType === TRAIT_TYPES.SYMBIOSIS
  );

  for (const link of symbiosisLinks) {
    // 找出共生代表（creature2 是被保護者，creature1 是代表）
    if (link.creature2Id === creature.id) {
      // 找出代表生物
      const protector = findCreatureById(link.creature1Id, gameState);
      if (protector && !protector.isFed) {
        // 代表未吃飽時，被保護者受到保護
        return { isProtected: true, protectorId: protector.id };
      }
    }
  }

  return { isProtected: false, protectorId: null };
}

/**
 * 從遊戲狀態中找出生物
 *
 * @param {string} creatureId - 生物 ID
 * @param {Object} gameState - 遊戲狀態
 * @returns {Creature|null}
 */
function findCreatureById(creatureId, gameState) {
  if (!gameState || !gameState.players) return null;

  for (const player of Object.values(gameState.players)) {
    if (player.creatures) {
      const creature = player.creatures.find(c => c.id === creatureId);
      if (creature) return creature;
    }
  }

  return null;
}

// ==================== 防禦機制 ====================

/**
 * 處理敏捷逃脫
 * 被攻擊時擲骰，4-6 逃脫成功
 *
 * @param {Creature} defender - 防守方
 * @returns {{ escaped: boolean, diceResult: number }}
 */
function rollAgileEscape(defender) {
  if (!hasTrait(defender, TRAIT_TYPES.AGILE)) {
    return { escaped: false, diceResult: 0 };
  }

  const diceResult = Math.floor(Math.random() * 6) + 1;
  const escaped = diceResult >= 4;

  return { escaped, diceResult };
}

/**
 * 檢查是否可使用斷尾
 *
 * @param {Creature} creature - 生物
 * @returns {boolean}
 */
function canUseTailLoss(creature) {
  // 需要有斷尾性狀且至少有一個其他性狀可棄置
  return hasTrait(creature, TRAIT_TYPES.TAIL_LOSS) && creature.traits.length > 1;
}

/**
 * 取得可棄置的性狀列表（斷尾用）
 *
 * @param {Creature} creature - 生物
 * @returns {Object[]} 可棄置的性狀列表
 */
function getDiscardableTraits(creature) {
  // 斷尾本身不能棄置
  return creature.traits.filter(t => t.type !== TRAIT_TYPES.TAIL_LOSS);
}

/**
 * 檢查是否可使用擬態
 *
 * @param {Creature} creature - 生物
 * @returns {boolean}
 */
function canUseMimicry(creature) {
  return hasTrait(creature, TRAIT_TYPES.MIMICRY) && !creature.usedMimicryThisTurn;
}

// ==================== 滅絕判定 ====================

/**
 * 判定生物是否滅絕
 * 滅絕條件：未吃飽且非冬眠狀態，或中毒
 *
 * @param {Creature} creature - 生物
 * @returns {boolean} 是否滅絕
 */
function checkExtinction(creature) {
  // 中毒的生物在滅絕階段死亡
  if (creature.isPoisoned) {
    return true;
  }

  // 冬眠中的生物不會滅絕（視為吃飽）
  if (creature.hibernating) {
    return false;
  }

  // 未吃飽的生物滅絕
  return !creature.isFed;
}

/**
 * 處理生物滅絕
 * 移除生物並將手牌（如果有卡牌機制）返還
 *
 * @param {Creature} creature - 滅絕的生物
 * @returns {{ traitCards: string[] }} 返還的性狀卡牌 ID 列表
 */
function processExtinction(creature) {
  // 收集所有性狀卡牌 ID（這些卡牌會返還給玩家或棄牌堆）
  const traitCards = creature.traits.map(t => t.cardId);

  return { traitCards };
}

// ==================== 狀態重置 ====================

/**
 * 重置生物的回合狀態
 * 在新回合開始時調用
 *
 * @param {Creature} creature - 生物
 * @returns {Creature} 更新後的生物
 */
function resetTurnState(creature) {
  return {
    ...creature,
    usedMimicryThisTurn: false,
    usedRobberyThisPhase: false
  };
}

/**
 * 重置生物的進食狀態
 * 在進食階段開始時調用
 *
 * @param {Creature} creature - 生物
 * @returns {Creature} 更新後的生物
 */
function resetFeedingState(creature) {
  return {
    ...creature,
    isFed: false,
    hibernating: false,
    usedRobberyThisPhase: false
  };
}

/**
 * 消耗脂肪儲備
 * 在滅絕階段前，將脂肪轉換為紅色食物
 *
 * @param {Creature} creature - 生物
 * @returns {Creature} 更新後的生物
 */
function consumeFatReserves(creature) {
  if (creature.food.yellow === 0) {
    return creature;
  }

  const yellowFood = creature.food.yellow;
  const foodShortage = creature.foodNeeded - getCurrentFood(creature);

  // 只消耗需要的脂肪量
  const fatToConsume = Math.min(yellowFood, Math.max(0, foodShortage));

  return {
    ...creature,
    food: {
      ...creature.food,
      red: creature.food.red + fatToConsume,
      yellow: creature.food.yellow - fatToConsume
    }
  };
}

// ==================== 導出 ====================

module.exports = {
  // ID 產生器
  generateCreatureId,
  generateTraitId,
  resetCreatureIdCounter,
  resetTraitIdCounter,

  // 生物創建
  createCreature,

  // 性狀管理
  addTrait,
  removeTrait,

  // 性狀查詢
  hasTrait,
  getTrait,
  getFatTissueCount,

  // 食量計算
  calculateFoodNeed,
  getCurrentFood,
  checkIsFed,
  getFatStorageCapacity,

  // 攻擊判定
  isCarnivore,
  canBeAttacked,
  checkSymbiosisProtection,
  findCreatureById,

  // 防禦機制
  rollAgileEscape,
  canUseTailLoss,
  getDiscardableTraits,
  canUseMimicry,

  // 滅絕判定
  checkExtinction,
  processExtinction,

  // 狀態重置
  resetTurnState,
  resetFeedingState,
  consumeFatReserves
};
