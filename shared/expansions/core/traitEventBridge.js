/**
 * 性狀事件橋接器
 *
 * 將遊戲事件轉換為性狀可處理的形式
 *
 * @module expansions/core/traitEventBridge
 */

const { GAME_EVENTS } = require('./gameEvents');

/**
 * 性狀事件橋接器類別
 */
class TraitEventBridge {
  /**
   * @param {GameEventEmitter} eventEmitter - 事件發射器
   * @param {Object} traitRegistry - 性狀註冊表
   */
  constructor(eventEmitter, traitRegistry = null) {
    this.eventEmitter = eventEmitter;
    this.traitRegistry = traitRegistry;
    this.subscriptions = [];
    this.initialized = false;
  }

  /**
   * 設定性狀註冊表
   * @param {Object} registry
   */
  setTraitRegistry(registry) {
    this.traitRegistry = registry;
  }

  /**
   * 初始化事件監聽
   */
  initialize() {
    if (this.initialized) return;

    // 監聯進食事件
    this.subscribe(GAME_EVENTS.CREATURE_FED, (event) => {
      this.triggerTraitEvent('onFeed', event.data);
    });

    // 監聽攻擊宣告事件
    this.subscribe(GAME_EVENTS.ATTACK_DECLARED, (event) => {
      this.triggerTraitEvent('onAttackDeclared', event.data);
      // 觸發防禦方的性狀
      this.triggerTraitEvent('onDefend', event.data, event.data.defenderCreatureId);
    });

    // 監聽攻擊成功事件
    this.subscribe(GAME_EVENTS.ATTACK_SUCCEEDED, (event) => {
      this.triggerTraitEvent('onAttackSuccess', event.data);
    });

    // 監聽攻擊阻擋事件
    this.subscribe(GAME_EVENTS.ATTACK_BLOCKED, (event) => {
      this.triggerTraitEvent('onAttackBlocked', event.data);
    });

    // 監聽階段進入事件
    this.subscribe(GAME_EVENTS.PHASE_ENTER, (event) => {
      this.triggerTraitEvent('onPhaseEnter', event.data);
    });

    // 監聽階段離開事件
    this.subscribe(GAME_EVENTS.PHASE_EXIT, (event) => {
      this.triggerTraitEvent('onPhaseExit', event.data);
    });

    // 監聽回合開始
    this.subscribe(GAME_EVENTS.ROUND_START, (event) => {
      this.triggerTraitEvent('onRoundStart', event.data);
    });

    // 監聽回合結束
    this.subscribe(GAME_EVENTS.ROUND_END, (event) => {
      this.triggerTraitEvent('onRoundEnd', event.data);
    });

    // 監聽連結創建
    this.subscribe(GAME_EVENTS.LINK_CREATED, (event) => {
      this.triggerTraitEvent('onLinkCreated', event.data);
    });

    // 監聽連結斷開
    this.subscribe(GAME_EVENTS.LINK_BROKEN, (event) => {
      this.triggerTraitEvent('onLinkBroken', event.data);
    });

    // 監聽生物創建
    this.subscribe(GAME_EVENTS.CREATURE_CREATED, (event) => {
      this.triggerTraitEvent('onCreatureCreated', event.data);
    });

    // 監聽生物死亡
    this.subscribe(GAME_EVENTS.CREATURE_DIED, (event) => {
      this.triggerTraitEvent('onCreatureDied', event.data);
    });

    // 監聽性狀添加
    this.subscribe(GAME_EVENTS.TRAIT_ADDED, (event) => {
      this.triggerTraitEvent('onTraitAdded', event.data);
    });

    // 監聽性狀移除
    this.subscribe(GAME_EVENTS.TRAIT_REMOVED, (event) => {
      this.triggerTraitEvent('onTraitRemoved', event.data);
    });

    // 監聽滅絕開始
    this.subscribe(GAME_EVENTS.EXTINCTION_START, (event) => {
      this.triggerTraitEvent('onExtinctionStart', event.data);
    });

    // 監聽滅絕結束
    this.subscribe(GAME_EVENTS.EXTINCTION_END, (event) => {
      this.triggerTraitEvent('onExtinctionEnd', event.data);
    });

    this.initialized = true;
  }

  /**
   * 訂閱事件
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函數
   * @returns {Function} 取消訂閱函數
   */
  subscribe(event, callback) {
    const unsubscribe = this.eventEmitter.on(event, callback);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * 觸發性狀事件
   * @param {string} methodName - 性狀處理方法名稱
   * @param {Object} eventData - 事件資料
   * @param {string} specificCreatureId - 特定生物 ID（可選）
   * @returns {Array} 結果陣列
   */
  triggerTraitEvent(methodName, eventData, specificCreatureId = null) {
    const { gameState } = eventData;
    if (!gameState || !this.traitRegistry) return [];

    const results = [];
    const players = gameState.players || [];

    for (const player of players) {
      for (const creature of player.creatures || []) {
        // 如果指定了特定生物，只處理該生物
        if (specificCreatureId && creature.id !== specificCreatureId) {
          continue;
        }

        for (const trait of creature.traits || []) {
          const handler = this.traitRegistry.get
            ? this.traitRegistry.get(trait.type)
            : this.traitRegistry[trait.type];

          if (handler && typeof handler[methodName] === 'function') {
            try {
              const result = handler[methodName](creature, gameState, eventData);
              if (result !== undefined && result !== null) {
                results.push({
                  creatureId: creature.id,
                  ownerId: player.id,
                  traitType: trait.type,
                  method: methodName,
                  result,
                });
              }
            } catch (error) {
              console.error(`Error in trait ${trait.type}.${methodName}:`, error);
              results.push({
                creatureId: creature.id,
                traitType: trait.type,
                method: methodName,
                error: error.message,
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * 直接觸發特定生物的性狀事件
   * @param {Object} creature - 生物
   * @param {string} methodName - 方法名稱
   * @param {Object} eventData - 事件資料
   * @returns {Array} 結果陣列
   */
  triggerCreatureTraits(creature, methodName, eventData) {
    if (!this.traitRegistry) return [];

    const results = [];

    for (const trait of creature.traits || []) {
      const handler = this.traitRegistry.get
        ? this.traitRegistry.get(trait.type)
        : this.traitRegistry[trait.type];

      if (handler && typeof handler[methodName] === 'function') {
        try {
          const result = handler[methodName](creature, eventData.gameState, eventData);
          if (result !== undefined && result !== null) {
            results.push({
              creatureId: creature.id,
              traitType: trait.type,
              method: methodName,
              result,
            });
          }
        } catch (error) {
          console.error(`Error in trait ${trait.type}.${methodName}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * 清理所有訂閱
   */
  cleanup() {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions = [];
    this.initialized = false;
  }

  /**
   * 取得訂閱數量
   * @returns {number}
   */
  get subscriptionCount() {
    return this.subscriptions.length;
  }
}

module.exports = {
  TraitEventBridge,
};
