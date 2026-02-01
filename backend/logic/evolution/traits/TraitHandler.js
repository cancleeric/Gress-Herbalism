/**
 * 性狀處理器基礎類別
 *
 * 所有性狀處理器必須繼承此類別。TraitHandler 封裝了性狀的所有邏輯，
 * 包括放置驗證、防禦檢查、進食處理、主動能力等。
 *
 * @abstract
 * @module logic/evolution/traits/TraitHandler
 */

/**
 * 性狀處理器基礎類別
 * @abstract
 */
class TraitHandler {
  /**
   * 建立性狀處理器
   *
   * @param {Object} definition - 性狀定義
   * @param {string} definition.type - 性狀類型
   * @param {string} definition.name - 性狀名稱
   * @param {number} [definition.foodBonus=0] - 食量加成
   * @param {string} [definition.description=''] - 描述
   * @param {string} definition.category - 類別
   * @param {boolean} [definition.isInteractive=false] - 是否為互動性狀
   * @param {boolean} [definition.isStackable=false] - 是否可疊加
   * @param {string[]} [definition.incompatible=[]] - 互斥性狀列表
   * @param {string} [definition.expansion='base'] - 所屬擴充包
   * @throws {Error} 如果直接實例化 TraitHandler
   */
  constructor(definition) {
    if (new.target === TraitHandler) {
      throw new Error('TraitHandler is abstract and cannot be instantiated directly');
    }

    if (!definition || !definition.type) {
      throw new Error('TraitHandler requires a definition with type');
    }

    this.type = definition.type;
    this.name = definition.name || definition.type;
    this.nameEn = definition.nameEn || '';
    this.foodBonus = definition.foodBonus || 0;
    this.description = definition.description || '';
    this.category = definition.category || 'unknown';
    this.isInteractive = definition.isInteractive || false;
    this.isStackable = definition.isStackable || false;
    this.incompatible = definition.incompatible || [];
    this.expansion = definition.expansion || 'base';

    // 特殊標記
    this.isParasite = definition.isParasite || false;
    this.hasRepresentative = definition.hasRepresentative || false;
  }

  // ==================== 放置相關 ====================

  /**
   * 驗證是否可以將此性狀放置到生物上
   *
   * @param {Object} context - 上下文
   * @param {Object} context.creature - 目標生物
   * @param {Object} context.player - 操作玩家
   * @param {Object} context.gameState - 遊戲狀態
   * @param {Object} [context.targetCreature] - 第二隻生物（互動性狀用）
   * @returns {{ valid: boolean, reason: string }} 驗證結果
   */
  canPlace(context) {
    const { creature, player, targetCreature } = context;

    // 基礎檢查：生物擁有者
    if (this.isParasite) {
      // 寄生蟲必須放在對手生物上
      if (creature.ownerId === player.id) {
        return { valid: false, reason: '寄生蟲只能放在對手的生物上' };
      }
    } else {
      // 一般性狀必須放在自己生物上
      if (creature.ownerId !== player.id) {
        return { valid: false, reason: '只能將性狀放在自己的生物上' };
      }
    }

    // 互動性狀檢查
    if (this.isInteractive) {
      if (!targetCreature) {
        return { valid: false, reason: '互動性狀需要指定第二隻生物' };
      }
      if (targetCreature.ownerId !== player.id) {
        return { valid: false, reason: '互動性狀的兩隻生物都必須是自己的' };
      }
      if (creature.id === targetCreature.id) {
        return { valid: false, reason: '不能與自己建立互動' };
      }
    }

    // 可疊加性檢查
    if (!this.isStackable) {
      const hasSameTrait = creature.traits?.some(t => t.type === this.type);
      if (hasSameTrait) {
        return { valid: false, reason: '此生物已經擁有這個性狀' };
      }
    }

    // 互斥性檢查
    for (const existingTrait of creature.traits || []) {
      if (this.incompatible.includes(existingTrait.type)) {
        return {
          valid: false,
          reason: `${this.name}與${existingTrait.name || existingTrait.type}互斥`,
        };
      }
    }

    return { valid: true, reason: '' };
  }

  /**
   * 放置性狀後的效果
   * 子類別可覆寫以實作特殊效果
   *
   * @param {Object} context - 上下文
   * @returns {Object} 修改後的 gameState
   */
  onPlace(context) {
    return context.gameState;
  }

  /**
   * 性狀被移除時的效果
   *
   * @param {Object} context - 上下文
   * @returns {Object} 修改後的 gameState
   */
  onRemove(context) {
    return context.gameState;
  }

  // ==================== 防禦相關 ====================

  /**
   * 檢查此性狀是否阻止攻擊
   *
   * @param {Object} context - 上下文
   * @param {Object} context.defender - 防禦方生物
   * @param {Object} context.attacker - 攻擊方生物
   * @param {Object} context.gameState - 遊戲狀態
   * @returns {{ canAttack: boolean, reason: string }} 檢查結果
   */
  checkDefense(context) {
    // 預設不阻止攻擊
    return { canAttack: true, reason: '' };
  }

  /**
   * 取得防禦回應選項
   *
   * @param {Object} context - 上下文
   * @returns {{ canRespond: boolean, responseType: string|null, options: Object|null }} 回應選項
   */
  getDefenseResponse(context) {
    return { canRespond: false, responseType: null, options: null };
  }

  /**
   * 處理防禦回應
   *
   * @param {Object} context - 上下文
   * @param {Object} response - 玩家的回應
   * @returns {{ success: boolean, gameState: Object, attackCancelled: boolean }} 處理結果
   */
  handleDefenseResponse(context, response) {
    return {
      success: false,
      gameState: context.gameState,
      attackCancelled: false,
    };
  }

  // ==================== 進食相關 ====================

  /**
   * 檢查是否可以進食
   *
   * @param {Object} context - 上下文
   * @returns {{ canFeed: boolean, reason: string }} 檢查結果
   */
  checkCanFeed(context) {
    return { canFeed: true, reason: '' };
  }

  /**
   * 進食時的效果
   *
   * @param {Object} context - 上下文
   * @param {string} context.foodType - 食物類型 ('red' | 'blue')
   * @returns {Object} 修改後的 gameState
   */
  onFeed(context) {
    return context.gameState;
  }

  /**
   * 獲得食物時觸發（溝通、合作用）
   *
   * @param {Object} context - 上下文
   * @param {string} foodType - 食物類型
   * @param {Set} processedCreatures - 已處理的生物（避免無限迴圈）
   * @returns {Object} 修改後的 gameState
   */
  onGainFood(context, foodType, processedCreatures) {
    return context.gameState;
  }

  // ==================== 主動能力 ====================

  /**
   * 檢查是否可以使用主動能力
   *
   * @param {Object} context - 上下文
   * @returns {{ canUse: boolean, reason: string }} 檢查結果
   */
  canUseAbility(context) {
    return { canUse: false, reason: '此性狀沒有主動能力' };
  }

  /**
   * 取得能力使用的目標選項
   *
   * @param {Object} context - 上下文
   * @returns {Object[]} 可選目標列表
   */
  getAbilityTargets(context) {
    return [];
  }

  /**
   * 使用主動能力
   *
   * @param {Object} context - 上下文
   * @param {Object} target - 目標
   * @returns {{ success: boolean, gameState: Object, message: string }} 使用結果
   */
  useAbility(context, target) {
    return {
      success: false,
      gameState: context.gameState,
      message: '此性狀沒有主動能力',
    };
  }

  // ==================== 階段相關 ====================

  /**
   * 階段開始時觸發
   *
   * @param {Object} context - 上下文
   * @param {string} phase - 階段名稱
   * @returns {Object} 修改後的 gameState
   */
  onPhaseStart(context, phase) {
    return context.gameState;
  }

  /**
   * 階段結束時觸發
   *
   * @param {Object} context - 上下文
   * @param {string} phase - 階段名稱
   * @returns {Object} 修改後的 gameState
   */
  onPhaseEnd(context, phase) {
    return context.gameState;
  }

  /**
   * 回合開始時重置狀態
   *
   * @param {Object} context - 上下文
   * @returns {Object} 修改後的 gameState
   */
  onTurnStart(context) {
    return context.gameState;
  }

  // ==================== 滅絕相關 ====================

  /**
   * 檢查滅絕條件
   *
   * @param {Object} context - 上下文
   * @returns {{ shouldSurvive: boolean, reason: string }} 檢查結果
   */
  checkExtinction(context) {
    return { shouldSurvive: false, reason: '' };
  }

  /**
   * 生物滅絕時觸發（如毒液）
   *
   * @param {Object} context - 上下文
   * @param {Object} attacker - 攻擊者（如果有）
   * @returns {Object} 修改後的 gameState
   */
  onExtinct(context, attacker) {
    return context.gameState;
  }

  /**
   * 其他生物被攻擊滅絕時觸發（如腐食）
   *
   * @param {Object} context - 上下文
   * @param {Object} extinctCreature - 滅絕的生物
   * @param {Object} attacker - 攻擊者
   * @returns {Object} 修改後的 gameState
   */
  onOtherExtinct(context, extinctCreature, attacker) {
    return context.gameState;
  }

  // ==================== 計分相關 ====================

  /**
   * 取得額外分數
   *
   * @param {Object} context - 上下文
   * @returns {number} 額外分數
   */
  getScoreBonus(context) {
    return this.foodBonus;
  }

  // ==================== 輔助方法 ====================

  /**
   * 取得性狀資訊（用於 UI 顯示）
   *
   * @returns {Object} 性狀資訊
   */
  getInfo() {
    return {
      type: this.type,
      name: this.name,
      nameEn: this.nameEn,
      foodBonus: this.foodBonus,
      description: this.description,
      category: this.category,
      isInteractive: this.isInteractive,
      isStackable: this.isStackable,
      incompatible: this.incompatible,
      expansion: this.expansion,
      isParasite: this.isParasite,
      hasRepresentative: this.hasRepresentative,
    };
  }

  /**
   * 取得性狀類型
   *
   * @returns {string} 性狀類型
   */
  getType() {
    return this.type;
  }
}

module.exports = TraitHandler;
