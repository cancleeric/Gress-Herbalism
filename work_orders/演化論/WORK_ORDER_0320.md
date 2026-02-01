# 工作單 0320

## 編號
0320

## 日期
2026-02-01

## 工作單標題
實作基礎版性狀處理器（19 種性狀）

## 工單主旨
演化論第二階段 - 可擴展架構（P2-A）

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_PHASE2_ARCHITECTURE.md`

## 優先級
P0

## 內容

### 目標
將現有 19 種基礎版性狀的邏輯重構為獨立的 TraitHandler 實作。

### 詳細需求

#### 檔案結構

```
shared/expansions/base/traits/handlers/
├── index.js                    # 統一匯出
├── carnivore/
│   ├── CarnivoreHandler.js     # 肉食
│   ├── ScavengerHandler.js     # 腐食
│   └── SharpVisionHandler.js   # 銳目
├── defense/
│   ├── CamouflageHandler.js    # 偽裝
│   ├── BurrowingHandler.js     # 穴居
│   ├── PoisonousHandler.js     # 毒液
│   ├── AquaticHandler.js       # 水生
│   ├── AgileHandler.js         # 敏捷
│   ├── MassiveHandler.js       # 巨化
│   ├── TailLossHandler.js      # 斷尾
│   └── MimicryHandler.js       # 擬態
├── feeding/
│   ├── FatTissueHandler.js     # 脂肪組織
│   ├── HibernationHandler.js   # 冬眠
│   ├── ParasiteHandler.js      # 寄生蟲
│   └── RobberyHandler.js       # 掠奪
├── interactive/
│   ├── CommunicationHandler.js # 溝通
│   ├── CooperationHandler.js   # 合作
│   └── SymbiosisHandler.js     # 共生
└── special/
    └── TramplingHandler.js     # 踐踏
```

#### 肉食相關性狀處理器

##### 1. CarnivoreHandler（肉食）

```javascript
// shared/expansions/base/traits/handlers/carnivore/CarnivoreHandler.js

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

class CarnivoreHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.CARNIVORE]);
  }

  /**
   * 肉食生物不能從食物池進食
   */
  checkCanFeed(context) {
    return {
      canFeed: false,
      reason: '肉食生物必須透過攻擊獲得食物',
    };
  }

  /**
   * 肉食生物可以發動攻擊
   */
  canUseAbility(context) {
    const { creature, gameState } = context;

    // 檢查是否已經攻擊過
    if (creature.hasAttackedThisTurn) {
      return { canUse: false, reason: '本回合已經攻擊過' };
    }

    // 檢查是否吃飽
    if (this.isFed(creature)) {
      return { canUse: false, reason: '已經吃飽，不需要攻擊' };
    }

    // 檢查是否有可攻擊的目標
    const targets = this.getAbilityTargets(context);
    if (targets.length === 0) {
      return { canUse: false, reason: '沒有可攻擊的目標' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 取得可攻擊的目標
   */
  getAbilityTargets(context) {
    const { creature, gameState } = context;
    const targets = [];

    for (const player of gameState.players) {
      for (const target of player.creatures) {
        // 跳過自己
        if (target.id === creature.id) continue;

        // 檢查是否可以攻擊
        const canAttack = this.canAttackTarget(creature, target, gameState);
        if (canAttack.canAttack) {
          targets.push({
            creatureId: target.id,
            ownerId: player.id,
            ownerName: player.name,
          });
        }
      }
    }

    return targets;
  }

  /**
   * 檢查是否可以攻擊特定目標
   */
  canAttackTarget(attacker, defender, gameState) {
    // 這裡會調用所有防禦性狀的 checkDefense
    // 由規則引擎處理
    return { canAttack: true, reason: '' };
  }

  /**
   * 執行攻擊
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    // 標記已攻擊
    creature.hasAttackedThisTurn = true;

    // 攻擊結算由規則引擎處理
    // 這裡只返回攻擊意圖
    return {
      success: true,
      gameState,
      attackIntent: {
        attackerId: creature.id,
        targetId: target.creatureId,
      },
    };
  }

  /**
   * 回合開始重置攻擊狀態
   */
  onTurnStart(context) {
    const { creature } = context;
    creature.hasAttackedThisTurn = false;
    return context.gameState;
  }

  // 輔助方法
  isFed(creature) {
    const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
    return currentFood >= (creature.foodNeeded || 1);
  }
}

module.exports = CarnivoreHandler;
```

##### 2. ScavengerHandler（腐食）

```javascript
// shared/expansions/base/traits/handlers/carnivore/ScavengerHandler.js

class ScavengerHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.SCAVENGER]);
  }

  /**
   * 當任何生物被肉食攻擊滅絕時觸發
   * 這個方法由規則引擎在攻擊成功時調用
   */
  onCreatureExtinct(context, extinctCreature, attacker) {
    const { creature, gameState } = context;

    // 只有被肉食攻擊滅絕才觸發
    if (!attacker) return gameState;

    // 檢查攻擊者是否為肉食
    const attackerIsCarnivore = attacker.traits?.some(t => t.type === 'carnivore');
    if (!attackerIsCarnivore) return gameState;

    // 獲得 1 個藍色食物
    if (!creature.food) creature.food = { red: 0, blue: 0, yellow: 0 };
    creature.food.blue += 1;

    // 記錄到日誌
    gameState.actionLog = gameState.actionLog || [];
    gameState.actionLog.push({
      type: 'SCAVENGER_TRIGGER',
      creatureId: creature.id,
      ownerId: creature.ownerId,
      foodGained: 1,
    });

    return gameState;
  }
}

module.exports = ScavengerHandler;
```

##### 3. SharpVisionHandler（銳目）

```javascript
// shared/expansions/base/traits/handlers/carnivore/SharpVisionHandler.js

class SharpVisionHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.SHARP_VISION]);
  }

  // 銳目本身沒有特殊邏輯
  // 它的效果是在 CamouflageHandler.checkDefense 中檢查
  // 這裡保持空實作，作為標記性狀
}

module.exports = SharpVisionHandler;
```

#### 防禦相關性狀處理器

##### 4. CamouflageHandler（偽裝）

```javascript
// shared/expansions/base/traits/handlers/defense/CamouflageHandler.js

class CamouflageHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.CAMOUFLAGE]);
  }

  /**
   * 檢查攻擊者是否能攻擊有偽裝的生物
   */
  checkDefense(context) {
    const { attacker } = context;

    // 檢查攻擊者是否有銳目
    const hasSharpVision = attacker.traits?.some(t => t.type === 'sharpVision');

    if (!hasSharpVision) {
      return {
        canAttack: false,
        reason: '需要銳目才能攻擊有偽裝的生物',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = CamouflageHandler;
```

##### 5. BurrowingHandler（穴居）

```javascript
// shared/expansions/base/traits/handlers/defense/BurrowingHandler.js

class BurrowingHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.BURROWING]);
  }

  checkDefense(context) {
    const { defender } = context;

    // 檢查是否吃飽
    const currentFood = (defender.food?.red || 0) + (defender.food?.blue || 0);
    const isFed = currentFood >= (defender.foodNeeded || 1);

    if (isFed) {
      return {
        canAttack: false,
        reason: '穴居生物吃飽時無法被攻擊',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = BurrowingHandler;
```

##### 6. PoisonousHandler（毒液）

```javascript
// shared/expansions/base/traits/handlers/defense/PoisonousHandler.js

class PoisonousHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.POISONOUS]);
  }

  /**
   * 被攻擊滅絕時，攻擊者也會中毒
   */
  onExtinct(context, attacker) {
    const { gameState } = context;

    if (!attacker) return gameState;

    // 標記攻擊者為中毒
    attacker.isPoisoned = true;

    // 記錄日誌
    gameState.actionLog = gameState.actionLog || [];
    gameState.actionLog.push({
      type: 'POISON_TRIGGER',
      poisonedCreatureId: attacker.id,
      poisonedOwnerId: attacker.ownerId,
    });

    return gameState;
  }
}

module.exports = PoisonousHandler;
```

##### 7. AquaticHandler（水生）

```javascript
// shared/expansions/base/traits/handlers/defense/AquaticHandler.js

class AquaticHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.AQUATIC]);
  }

  checkDefense(context) {
    const { attacker, defender } = context;

    const attackerIsAquatic = attacker.traits?.some(t => t.type === 'aquatic');
    const defenderIsAquatic = true; // 這個處理器只會在防禦者有水生時調用

    // 水生只能被水生攻擊
    if (!attackerIsAquatic) {
      return {
        canAttack: false,
        reason: '只有水生生物才能攻擊水生生物',
      };
    }

    return { canAttack: true, reason: '' };
  }

  /**
   * 水生生物作為攻擊者時的額外檢查
   * 水生肉食不能攻擊非水生生物
   */
  static checkAttackerConstraint(attacker, defender) {
    const attackerIsAquatic = attacker.traits?.some(t => t.type === 'aquatic');
    const defenderIsAquatic = defender.traits?.some(t => t.type === 'aquatic');

    if (attackerIsAquatic && !defenderIsAquatic) {
      return {
        canAttack: false,
        reason: '水生肉食不能攻擊非水生生物',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = AquaticHandler;
```

##### 8. AgileHandler（敏捷）

```javascript
// shared/expansions/base/traits/handlers/defense/AgileHandler.js

class AgileHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.AGILE]);
  }

  getDefenseResponse(context) {
    return {
      canRespond: true,
      responseType: 'DICE_ROLL',
      options: {
        description: '擲骰逃脫：4-6 成功，1-3 失敗',
        autoRoll: true, // 自動擲骰
      },
    };
  }

  handleDefenseResponse(context, response) {
    const { gameState } = context;

    // 擲骰
    const diceResult = response.diceResult || this.rollDice();

    // 4-6 逃脫成功
    const escaped = diceResult >= 4;

    // 記錄日誌
    gameState.actionLog = gameState.actionLog || [];
    gameState.actionLog.push({
      type: 'AGILE_ROLL',
      diceResult,
      escaped,
    });

    return {
      success: true,
      gameState,
      attackCancelled: escaped,
      message: escaped
        ? `擲出 ${diceResult}，逃脫成功！`
        : `擲出 ${diceResult}，逃脫失敗`,
    };
  }

  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }
}

module.exports = AgileHandler;
```

##### 9. MassiveHandler（巨化）

```javascript
// shared/expansions/base/traits/handlers/defense/MassiveHandler.js

class MassiveHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.MASSIVE]);
  }

  checkDefense(context) {
    const { attacker } = context;

    const attackerIsMassive = attacker.traits?.some(t => t.type === 'massive');

    if (!attackerIsMassive) {
      return {
        canAttack: false,
        reason: '只有巨化生物才能攻擊巨化生物',
      };
    }

    return { canAttack: true, reason: '' };
  }

  // 巨化可以攻擊非巨化，但非巨化不能攻擊巨化
  // 這與水生不同：水生互相限制
}

module.exports = MassiveHandler;
```

##### 10. TailLossHandler（斷尾）

```javascript
// shared/expansions/base/traits/handlers/defense/TailLossHandler.js

class TailLossHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.TAIL_LOSS]);
  }

  getDefenseResponse(context) {
    const { defender } = context;

    // 檢查是否有其他性狀可以棄置
    const otherTraits = defender.traits?.filter(t => t.type !== 'tailLoss') || [];

    if (otherTraits.length === 0) {
      return { canRespond: false, responseType: null, options: null };
    }

    return {
      canRespond: true,
      responseType: 'SELECT_TRAIT',
      options: {
        description: '選擇一個性狀棄置以取消攻擊',
        traits: otherTraits.map(t => ({
          id: t.id,
          type: t.type,
          name: t.name,
        })),
        optional: true, // 可以選擇不使用斷尾
      },
    };
  }

  handleDefenseResponse(context, response) {
    const { defender, attacker, gameState } = context;

    if (!response.selectedTraitId) {
      // 選擇不使用斷尾
      return {
        success: false,
        gameState,
        attackCancelled: false,
      };
    }

    // 移除選擇的性狀
    const traitIndex = defender.traits.findIndex(t => t.id === response.selectedTraitId);
    if (traitIndex === -1) {
      return {
        success: false,
        gameState,
        attackCancelled: false,
        message: '找不到指定的性狀',
      };
    }

    const removedTrait = defender.traits.splice(traitIndex, 1)[0];

    // 攻擊者獲得 1 個藍色食物
    if (!attacker.food) attacker.food = { red: 0, blue: 0, yellow: 0 };
    attacker.food.blue += 1;

    // 記錄日誌
    gameState.actionLog = gameState.actionLog || [];
    gameState.actionLog.push({
      type: 'TAIL_LOSS',
      defenderId: defender.id,
      attackerId: attacker.id,
      removedTrait: removedTrait.type,
      attackerGainedFood: 1,
    });

    return {
      success: true,
      gameState,
      attackCancelled: true,
      message: `棄置${removedTrait.name || removedTrait.type}，攻擊取消`,
    };
  }
}

module.exports = TailLossHandler;
```

##### 11. MimicryHandler（擬態）

```javascript
// shared/expansions/base/traits/handlers/defense/MimicryHandler.js

class MimicryHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.MIMICRY]);
  }

  getDefenseResponse(context) {
    const { defender, attacker, gameState } = context;

    // 檢查是否已使用
    if (defender.mimicryUsedThisTurn) {
      return { canRespond: false, responseType: null, options: null };
    }

    // 找到可以轉移攻擊的目標（自己的其他生物）
    const owner = gameState.players.find(p => p.id === defender.ownerId);
    const validTargets = owner?.creatures?.filter(c => {
      if (c.id === defender.id) return false;
      // 必須是可以被攻擊者攻擊的生物
      // 這需要檢查所有防禦性狀
      return this.canBeAttackedBy(c, attacker, gameState);
    }) || [];

    if (validTargets.length === 0) {
      return { canRespond: false, responseType: null, options: null };
    }

    return {
      canRespond: true,
      responseType: 'SELECT_CREATURE',
      options: {
        description: '選擇一隻生物承受攻擊',
        creatures: validTargets.map(c => ({
          id: c.id,
          traits: c.traits?.map(t => t.type) || [],
        })),
        optional: true,
      },
    };
  }

  handleDefenseResponse(context, response) {
    const { defender, gameState } = context;

    if (!response.selectedCreatureId) {
      return {
        success: false,
        gameState,
        attackCancelled: false,
      };
    }

    // 標記已使用
    defender.mimicryUsedThisTurn = true;

    // 記錄日誌
    gameState.actionLog = gameState.actionLog || [];
    gameState.actionLog.push({
      type: 'MIMICRY',
      originalTargetId: defender.id,
      newTargetId: response.selectedCreatureId,
    });

    return {
      success: true,
      gameState,
      attackCancelled: false,
      redirectTarget: response.selectedCreatureId,
    };
  }

  onTurnStart(context) {
    const { creature } = context;
    creature.mimicryUsedThisTurn = false;
    return context.gameState;
  }

  canBeAttackedBy(creature, attacker, gameState) {
    // 簡化檢查，完整邏輯由規則引擎處理
    return true;
  }
}

module.exports = MimicryHandler;
```

#### 進食相關、互動相關、特殊能力處理器

（由於篇幅限制，以下只列出主要結構，實作邏輯與上述類似）

**FatTissueHandler**：
- `onFeed()` - 吃飽後可儲存脂肪
- `canUseAbility()` - 有脂肪時可消耗
- `useAbility()` - 消耗脂肪獲得食物

**HibernationHandler**：
- `canUseAbility()` - 非最後回合可使用
- `useAbility()` - 標記為冬眠狀態
- `checkExtinction()` - 冬眠中視為存活
- `onPhaseEnd()` - 進食結束後解除使用狀態

**ParasiteHandler**：
- 覆寫 `canPlace()` - 只能放對手生物
- 不需要其他特殊邏輯

**RobberyHandler**：
- `canUseAbility()` - 每階段限一次
- `getAbilityTargets()` - 未吃飽且有食物的生物
- `useAbility()` - 偷取食物

**CommunicationHandler**：
- `onGainFood()` - 連結生物獲得紅色食物時觸發
- 實作連鎖邏輯（避免無限迴圈）

**CooperationHandler**：
- `onGainFood()` - 連結生物獲得任何食物時觸發
- 給予藍色食物

**SymbiosisHandler**：
- 覆寫 `onPlace()` - 指定代表/被保護者
- `checkCanFeed()` - 代表未飽前被保護者不能進食
- `checkDefense()` - 肉食只能攻擊代表

**TramplingHandler**：
- `canUseAbility()` - 食物池有食物
- `useAbility()` - 移除一個紅色食物

### 驗收標準

- [ ] 19 個性狀處理器全部實作
- [ ] 邏輯與現有實作一致
- [ ] 每個處理器有獨立測試
- [ ] 統一匯出可用
- [ ] 與 TraitRegistry 整合正常

### 依賴工單
- 0318（性狀定義結構）
- 0319（性狀處理器介面）

### 被依賴工單
- 0321（規則引擎核心）
- 0327（遊戲初始化重構）
