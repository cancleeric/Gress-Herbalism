/**
 * 內建效果處理器
 *
 * @module expansions/core/handlers/builtinEffectHandlers
 */

const { EffectHandler } = require('../effectSystem');
const { EFFECT_TYPE, EFFECT_RESULT } = require('../effectTypes');

/**
 * 輔助函數：尋找生物
 * @param {Object} gameState
 * @param {string} creatureId
 * @returns {Object|null}
 */
function findCreature(gameState, creatureId) {
  for (const player of gameState.players || []) {
    const creature = (player.creatures || []).find(c => c.id === creatureId);
    if (creature) return { creature, player };
  }
  return null;
}

/**
 * 進食效果處理器
 */
class GainFoodHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.GAIN_FOOD;
  }

  handle(effect, gameState) {
    const { creatureId, amount = 1, foodType = 'red' } = effect.data;

    const found = findCreature(gameState, creatureId);
    if (!found) {
      return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
    }

    const { creature } = found;

    // 初始化食物結構
    if (!creature.food) {
      creature.food = { red: 0, blue: 0, yellow: 0 };
    }

    // 計算實際獲得的食物
    const currentFood = (creature.food.red || 0) + (creature.food.blue || 0);
    const foodNeeded = creature.foodNeeded || 1;
    const available = Math.max(0, foodNeeded - currentFood);
    const gained = Math.min(amount, available);

    if (foodType === 'red') {
      creature.food.red = (creature.food.red || 0) + gained;
    } else if (foodType === 'blue') {
      creature.food.blue = (creature.food.blue || 0) + gained;
    }

    return {
      status: EFFECT_RESULT.SUCCESS,
      gained,
      foodType,
      newFood: creature.food,
    };
  }

  getHandlerPriority() {
    return 50;
  }
}

/**
 * 失去食物處理器
 */
class LoseFoodHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.LOSE_FOOD;
  }

  handle(effect, gameState) {
    const { creatureId, amount = 1 } = effect.data;

    const found = findCreature(gameState, creatureId);
    if (!found) {
      return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
    }

    const { creature } = found;

    if (!creature.food) {
      return { status: EFFECT_RESULT.FAILED, reason: 'No food to lose' };
    }

    let lost = 0;
    let remaining = amount;

    // 先從藍色食物扣除
    if (creature.food.blue > 0 && remaining > 0) {
      const fromBlue = Math.min(creature.food.blue, remaining);
      creature.food.blue -= fromBlue;
      lost += fromBlue;
      remaining -= fromBlue;
    }

    // 再從紅色食物扣除
    if (creature.food.red > 0 && remaining > 0) {
      const fromRed = Math.min(creature.food.red, remaining);
      creature.food.red -= fromRed;
      lost += fromRed;
    }

    return {
      status: lost > 0 ? EFFECT_RESULT.SUCCESS : EFFECT_RESULT.FAILED,
      lost,
      newFood: creature.food,
    };
  }

  getHandlerPriority() {
    return 50;
  }
}

/**
 * 儲存脂肪處理器
 */
class StoreFatHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.STORE_FAT;
  }

  handle(effect, gameState) {
    const { creatureId, amount = 1 } = effect.data;

    const found = findCreature(gameState, creatureId);
    if (!found) {
      return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
    }

    const { creature } = found;

    // 檢查是否有脂肪組織
    const fatTissueCount = (creature.traits || [])
      .filter(t => t.type === 'fatTissue').length;

    if (fatTissueCount === 0) {
      return { status: EFFECT_RESULT.FAILED, reason: 'No fat tissue trait' };
    }

    if (!creature.food) {
      creature.food = { red: 0, blue: 0, yellow: 0 };
    }

    // 計算可儲存量（每張脂肪組織可儲存 1 個）
    const currentFat = creature.food.yellow || 0;
    const available = fatTissueCount - currentFat;
    const stored = Math.min(amount, available);

    creature.food.yellow = currentFat + stored;

    return {
      status: stored > 0 ? EFFECT_RESULT.SUCCESS : EFFECT_RESULT.PARTIAL,
      stored,
      newFat: creature.food.yellow,
      capacity: fatTissueCount,
    };
  }

  getHandlerPriority() {
    return 45;
  }
}

/**
 * 使用脂肪處理器
 */
class UseFatHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.USE_FAT;
  }

  handle(effect, gameState) {
    const { creatureId, amount = 1 } = effect.data;

    const found = findCreature(gameState, creatureId);
    if (!found) {
      return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
    }

    const { creature } = found;

    if (!creature.food || !creature.food.yellow) {
      return { status: EFFECT_RESULT.FAILED, reason: 'No fat to use' };
    }

    const available = creature.food.yellow;
    const used = Math.min(amount, available);

    creature.food.yellow -= used;
    // 使用脂肪轉換為藍色食物
    creature.food.blue = (creature.food.blue || 0) + used;

    return {
      status: used > 0 ? EFFECT_RESULT.SUCCESS : EFFECT_RESULT.FAILED,
      used,
      newFat: creature.food.yellow,
    };
  }

  getHandlerPriority() {
    return 45;
  }
}

/**
 * 攻擊阻擋處理器
 */
class BlockAttackHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.BLOCK_ATTACK;
  }

  handle(effect, gameState) {
    const { attackEffectId, reason, blockedBy } = effect.data;

    if (gameState.effectQueue) {
      const cancelled = gameState.effectQueue.cancel(attackEffectId);
      if (cancelled) {
        return {
          status: EFFECT_RESULT.SUCCESS,
          attackBlocked: true,
          blockedBy,
          reason,
        };
      }
    }

    return {
      status: EFFECT_RESULT.FAILED,
      reason: 'Could not find attack effect to block',
    };
  }

  getHandlerPriority() {
    return 90;
  }
}

/**
 * 攻擊重定向處理器
 */
class RedirectAttackHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.REDIRECT_ATTACK;
  }

  handle(effect, gameState) {
    const { attackEffectId, newTargetId, redirectedBy } = effect.data;

    if (gameState.effectQueue) {
      const attackEffect = gameState.effectQueue
        .findEffects(e => e.id === attackEffectId)[0];

      if (attackEffect && !attackEffect.cancelled && !attackEffect.resolved) {
        attackEffect.target = newTargetId;
        attackEffect.data.originalTarget = attackEffect.data.targetId;
        attackEffect.data.targetId = newTargetId;

        return {
          status: EFFECT_RESULT.REDIRECTED,
          redirectedBy,
          newTarget: newTargetId,
        };
      }
    }

    return {
      status: EFFECT_RESULT.FAILED,
      reason: 'Could not find attack effect to redirect',
    };
  }

  getHandlerPriority() {
    return 85;
  }
}

/**
 * 生物死亡處理器
 */
class DestroyCreatureHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.DESTROY_CREATURE;
  }

  handle(effect, gameState) {
    const { creatureId, reason } = effect.data;

    for (const player of gameState.players || []) {
      const index = (player.creatures || []).findIndex(c => c.id === creatureId);
      if (index !== -1) {
        const [removed] = player.creatures.splice(index, 1);

        // 記錄到棄牌堆/墓地
        if (!player.discardPile) {
          player.discardPile = [];
        }
        player.discardPile.push({
          type: 'creature',
          creature: removed,
          deathReason: reason,
          diedAt: Date.now(),
        });

        // 性狀卡也進入棄牌堆
        for (const trait of removed.traits || []) {
          player.discardPile.push({
            type: 'trait',
            trait,
            fromCreature: removed.id,
          });
        }

        return {
          status: EFFECT_RESULT.SUCCESS,
          removedCreature: removed,
          reason,
        };
      }
    }

    return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
  }

  getHandlerPriority() {
    return 30;
  }
}

/**
 * 移除性狀處理器
 */
class RemoveTraitHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.REMOVE_TRAIT;
  }

  handle(effect, gameState) {
    const { creatureId, traitType, traitIndex } = effect.data;

    const found = findCreature(gameState, creatureId);
    if (!found) {
      return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
    }

    const { creature, player } = found;

    let removedTrait = null;

    if (traitIndex !== undefined) {
      // 按索引移除
      if (traitIndex >= 0 && traitIndex < (creature.traits || []).length) {
        [removedTrait] = creature.traits.splice(traitIndex, 1);
      }
    } else if (traitType) {
      // 按類型移除
      const index = (creature.traits || []).findIndex(t => t.type === traitType);
      if (index !== -1) {
        [removedTrait] = creature.traits.splice(index, 1);
      }
    }

    if (removedTrait) {
      // 加入棄牌堆
      if (!player.discardPile) {
        player.discardPile = [];
      }
      player.discardPile.push({
        type: 'trait',
        trait: removedTrait,
        fromCreature: creature.id,
      });

      // 更新食量
      if (removedTrait.foodBonus) {
        creature.foodNeeded = Math.max(1, (creature.foodNeeded || 1) - removedTrait.foodBonus);
      }

      return {
        status: EFFECT_RESULT.SUCCESS,
        removedTrait,
      };
    }

    return { status: EFFECT_RESULT.FAILED, reason: 'Trait not found' };
  }

  getHandlerPriority() {
    return 40;
  }
}

/**
 * 應用毒素處理器
 */
class ApplyPoisonHandler extends EffectHandler {
  canHandle(effect) {
    return effect.type === EFFECT_TYPE.APPLY_POISON;
  }

  handle(effect, gameState) {
    const { creatureId, source } = effect.data;

    const found = findCreature(gameState, creatureId);
    if (!found) {
      return { status: EFFECT_RESULT.FAILED, reason: 'Creature not found' };
    }

    const { creature } = found;
    creature.isPoisoned = true;
    creature.poisonSource = source;

    return {
      status: EFFECT_RESULT.SUCCESS,
      poisoned: true,
    };
  }

  getHandlerPriority() {
    return 95;
  }
}

/**
 * 註冊所有內建處理器
 * @param {EffectQueue} effectQueue
 */
function registerBuiltinHandlers(effectQueue) {
  effectQueue.registerHandler(new GainFoodHandler());
  effectQueue.registerHandler(new LoseFoodHandler());
  effectQueue.registerHandler(new StoreFatHandler());
  effectQueue.registerHandler(new UseFatHandler());
  effectQueue.registerHandler(new BlockAttackHandler());
  effectQueue.registerHandler(new RedirectAttackHandler());
  effectQueue.registerHandler(new DestroyCreatureHandler());
  effectQueue.registerHandler(new RemoveTraitHandler());
  effectQueue.registerHandler(new ApplyPoisonHandler());
}

module.exports = {
  GainFoodHandler,
  LoseFoodHandler,
  StoreFatHandler,
  UseFatHandler,
  BlockAttackHandler,
  RedirectAttackHandler,
  DestroyCreatureHandler,
  RemoveTraitHandler,
  ApplyPoisonHandler,
  registerBuiltinHandlers,
  findCreature,
};
