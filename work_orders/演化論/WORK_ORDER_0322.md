# 工作單 0322

## 編號
0322

## 日期
2026-02-01

## 工作單標題
實作基礎規則集

## 工單主旨
演化論第二階段 - 可擴展架構（P2-A）

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_PHASE2_ARCHITECTURE.md`

## 優先級
P0

## 內容

### 目標
實作基礎版的所有遊戲規則，包括食物供給、攻擊判定、進食連鎖、滅絕檢查、計分等核心規則。

### 詳細需求

#### 1. 基礎規則集結構

**檔案**：`shared/expansions/base/rules/index.js`

```javascript
/**
 * 基礎版規則集
 */
const foodRules = require('./foodRules');
const attackRules = require('./attackRules');
const feedingRules = require('./feedingRules');
const extinctionRules = require('./extinctionRules');
const scoreRules = require('./scoreRules');
const phaseRules = require('./phaseRules');

/**
 * 註冊所有基礎規則到規則引擎
 * @param {RuleEngine} engine
 */
function registerBaseRules(engine) {
  foodRules.register(engine);
  attackRules.register(engine);
  feedingRules.register(engine);
  extinctionRules.register(engine);
  scoreRules.register(engine);
  phaseRules.register(engine);
}

module.exports = {
  registerBaseRules,
  foodRules,
  attackRules,
  feedingRules,
  extinctionRules,
  scoreRules,
  phaseRules,
};
```

#### 2. 食物供給規則

**檔案**：`shared/expansions/base/rules/foodRules.js`

```javascript
const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');

/**
 * 食物數量計算公式
 */
const FOOD_FORMULA = {
  2: { dice: 1, bonus: 2 },  // 1d6 + 2
  3: { dice: 2, bonus: 0 },  // 2d6
  4: { dice: 2, bonus: 2 },  // 2d6 + 2
};

function register(engine) {
  /**
   * 食物公式規則
   */
  engine.registerRule(RULE_IDS.FOOD_FORMULA, {
    description: '計算食物供給數量',
    expansion: 'base',
    execute: (context) => {
      const { gameState } = context;
      const playerCount = gameState.players.length;
      const formula = FOOD_FORMULA[playerCount];

      if (!formula) {
        throw new Error(`Unsupported player count: ${playerCount}`);
      }

      return {
        ...context,
        formula,
      };
    },
  });

  /**
   * 擲骰規則
   */
  engine.registerRule(RULE_IDS.FOOD_ROLL_DICE, {
    description: '擲骰決定食物數量',
    expansion: 'base',
    execute: (context) => {
      const { formula, gameState } = context;

      // 擲骰
      const diceResults = [];
      for (let i = 0; i < formula.dice; i++) {
        diceResults.push(Math.floor(Math.random() * 6) + 1);
      }

      const total = diceResults.reduce((sum, d) => sum + d, 0) + formula.bonus;

      // 更新遊戲狀態
      const newState = {
        ...gameState,
        foodPool: {
          ...gameState.foodPool,
          red: total,
        },
        lastDiceResults: diceResults,
      };

      // 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'FOOD_ROLL',
        diceResults,
        bonus: formula.bonus,
        total,
      });

      return {
        ...context,
        gameState: newState,
        diceResults,
        foodAmount: total,
      };
    },
  });
}

module.exports = { register, FOOD_FORMULA };
```

#### 3. 攻擊規則

**檔案**：`shared/expansions/base/rules/attackRules.js`

```javascript
const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');
const { HOOK_NAMES } = require('../../../../backend/logic/evolution/rules/hookNames');

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

      // 2. 檢查是否已攻擊過
      if (attacker.hasAttackedThisTurn) {
        return {
          ...context,
          valid: false,
          reason: '本回合已經攻擊過',
        };
      }

      // 3. 檢查水生限制（攻擊者）
      const attackerIsAquatic = attacker.traits?.some(t => t.type === 'aquatic');
      const targetIsAquatic = target.traits?.some(t => t.type === 'aquatic');

      if (attackerIsAquatic && !targetIsAquatic) {
        return {
          ...context,
          valid: false,
          reason: '水生肉食不能攻擊非水生生物',
        };
      }

      // 4. 執行防禦檢查
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
        if (!handler) continue;

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
        if (!handler) continue;

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
      newState = await context.triggerHook(HOOK_NAMES.ON_ATTACK_SUCCESS, {
        ...context,
        gameState: newState,
      });
      newState = newState.gameState;

      // 4. 目標滅絕
      newState = await context.executeRule(RULE_IDS.CREATURE_EXTINCT, {
        ...context,
        gameState: newState,
        creature: target,
        attacker,
      });
      newState = newState.gameState;

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
      newState = await context.triggerHook(HOOK_NAMES.BEFORE_CREATURE_EXTINCT, {
        ...context,
        gameState: newState,
      });
      newState = newState.gameState;

      // 處理毒液效果
      const hasPoisonous = creature.traits?.some(t => t.type === 'poisonous');
      if (hasPoisonous && attacker) {
        const poisonHandler = traitRegistry?.get('poisonous');
        if (poisonHandler) {
          newState = poisonHandler.onExtinct(
            { creature, gameState: newState },
            attacker
          );
        }
      }

      // 觸發腐食效果
      if (attacker) {
        for (const player of newState.players) {
          for (const c of player.creatures) {
            const hasScavenger = c.traits?.some(t => t.type === 'scavenger');
            if (hasScavenger) {
              const scavengerHandler = traitRegistry?.get('scavenger');
              if (scavengerHandler) {
                newState = scavengerHandler.onCreatureExtinct(
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
        const index = owner.creatures.findIndex(c => c.id === creature.id);
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
      newState = await context.triggerHook(HOOK_NAMES.ON_CREATURE_EXTINCT, {
        ...context,
        gameState: newState,
        extinctCreature: creature,
      });

      return {
        ...context,
        gameState: newState.gameState || newState,
      };
    },
  });
}

function removeInteractionLinks(gameState, creatureId) {
  for (const player of gameState.players) {
    for (const creature of player.creatures) {
      if (creature.interactionLinks) {
        creature.interactionLinks = creature.interactionLinks.filter(
          link => link.creature1Id !== creatureId && link.creature2Id !== creatureId
        );
      }
    }
  }
  return gameState;
}

module.exports = { register };
```

#### 4. 進食規則

**檔案**：`shared/expansions/base/rules/feedingRules.js`

```javascript
const { RULE_IDS } = require('../../../../backend/logic/evolution/rules/ruleIds');
const { HOOK_NAMES } = require('../../../../backend/logic/evolution/rules/hookNames');

function register(engine) {
  /**
   * 進食驗證規則
   */
  engine.registerRule(RULE_IDS.FEED_VALIDATE, {
    description: '驗證進食是否合法',
    expansion: 'base',
    execute: async (context) => {
      const { creature, gameState, traitRegistry } = context;

      // 1. 檢查共生限制
      const symbiosisResult = await context.executeRule(
        RULE_IDS.FEED_CHECK_SYMBIOSIS,
        context
      );
      if (!symbiosisResult.canFeed) {
        return symbiosisResult;
      }

      // 2. 檢查是否為肉食（肉食不能從食物池進食）
      const isCarnivore = creature.traits?.some(t => t.type === 'carnivore');
      if (isCarnivore) {
        return {
          ...context,
          valid: false,
          reason: '肉食生物必須透過攻擊獲得食物',
        };
      }

      // 3. 檢查食物池是否有食物
      if ((gameState.foodPool?.red || 0) <= 0) {
        return {
          ...context,
          valid: false,
          reason: '食物池沒有食物',
        };
      }

      // 4. 檢查是否需要進食（是否已飽）
      const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
      const foodNeeded = creature.foodNeeded || 1;

      if (currentFood >= foodNeeded) {
        // 檢查是否有脂肪組織
        const hasFat = creature.traits?.some(t => t.type === 'fatTissue');
        if (!hasFat) {
          return {
            ...context,
            valid: false,
            reason: '已經吃飽，無法再進食',
          };
        }
        // 有脂肪組織，可以繼續進食存入脂肪
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

      // 找到此生物的共生連結
      for (const link of creature.interactionLinks || []) {
        if (link.type !== 'symbiosis') continue;

        // 如果此生物是被保護者
        if (link.protectedId === creature.id) {
          // 找到代表
          const representative = findCreatureById(gameState, link.representativeId);
          if (representative) {
            // 檢查代表是否吃飽
            const repFood = (representative.food?.red || 0) + (representative.food?.blue || 0);
            const repNeeded = representative.foodNeeded || 1;

            if (repFood < repNeeded) {
              return {
                ...context,
                canFeed: false,
                valid: false,
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

      if (currentFood < foodNeeded) {
        // 正常進食
        creature.food.red += 1;
      } else {
        // 存入脂肪
        creature.food.yellow += 1;
      }

      // 3. 觸發進食後鉤子
      newState = await context.triggerHook(HOOK_NAMES.AFTER_FEED, {
        ...context,
        gameState: newState,
        foodType: 'red',
      });
      newState = newState.gameState;

      // 4. 處理溝通連鎖
      newState = await context.executeRule(RULE_IDS.FEED_CHAIN_COMMUNICATION, {
        ...context,
        gameState: newState,
        sourceCreature: creature,
        processedCreatures: new Set([creature.id]),
      });
      newState = newState.gameState;

      // 5. 處理合作連鎖
      newState = await context.executeRule(RULE_IDS.FEED_CHAIN_COOPERATION, {
        ...context,
        gameState: newState,
        sourceCreature: creature,
        foodType: 'red',
        processedCreatures: new Set([creature.id]),
      });
      newState = newState.gameState;

      // 6. 記錄日誌
      newState.actionLog = newState.actionLog || [];
      newState.actionLog.push({
        type: 'FEED',
        creatureId: creature.id,
        foodType: 'red',
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
      for (const link of sourceCreature.interactionLinks || []) {
        if (link.type !== 'communication') continue;

        const linkedId = link.creature1Id === sourceCreature.id
          ? link.creature2Id
          : link.creature1Id;

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
        newState.actionLog.push({
          type: 'COMMUNICATION_CHAIN',
          sourceId: sourceCreature.id,
          targetId: linkedId,
        });

        // 遞迴處理
        newState = await context.executeRule(RULE_IDS.FEED_CHAIN_COMMUNICATION, {
          ...context,
          gameState: newState,
          sourceCreature: linkedCreature,
          processedCreatures,
        });
        newState = newState.gameState;
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

      for (const link of sourceCreature.interactionLinks || []) {
        if (link.type !== 'cooperation') continue;

        const linkedId = link.creature1Id === sourceCreature.id
          ? link.creature2Id
          : link.creature1Id;

        if (processedCreatures.has(linkedId)) continue;

        const linkedCreature = findCreatureById(newState, linkedId);
        if (!linkedCreature) continue;

        // 合作給藍色食物（不消耗食物池）
        if (!linkedCreature.food) {
          linkedCreature.food = { red: 0, blue: 0, yellow: 0 };
        }
        linkedCreature.food.blue += 1;
        processedCreatures.add(linkedId);

        newState.actionLog.push({
          type: 'COOPERATION_CHAIN',
          sourceId: sourceCreature.id,
          targetId: linkedId,
        });

        // 遞迴處理
        newState = await context.executeRule(RULE_IDS.FEED_CHAIN_COOPERATION, {
          ...context,
          gameState: newState,
          sourceCreature: linkedCreature,
          foodType: 'blue',
          processedCreatures,
        });
        newState = newState.gameState;
      }

      return {
        ...context,
        gameState: newState,
      };
    },
  });
}

function findCreatureById(gameState, creatureId) {
  for (const player of gameState.players) {
    const creature = player.creatures?.find(c => c.id === creatureId);
    if (creature) return creature;
  }
  return null;
}

module.exports = { register };
```

#### 5. 滅絕與計分規則

**檔案**：`shared/expansions/base/rules/extinctionRules.js`

```javascript
function register(engine) {
  engine.registerRule(RULE_IDS.EXTINCTION_CHECK, {
    description: '檢查滅絕條件',
    expansion: 'base',
    execute: (context) => {
      const { creature, traitRegistry } = context;

      // 檢查是否冬眠
      if (creature.isHibernating) {
        return { ...context, shouldExtinct: false, reason: '冬眠中' };
      }

      // 檢查是否吃飽
      const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
      const foodNeeded = creature.foodNeeded || 1;

      if (currentFood >= foodNeeded) {
        return { ...context, shouldExtinct: false, reason: '已吃飽' };
      }

      // 檢查是否可消耗脂肪
      const fatCount = creature.food?.yellow || 0;
      const deficit = foodNeeded - currentFood;

      if (fatCount >= deficit) {
        return { ...context, shouldExtinct: false, reason: '可消耗脂肪', fatToConsume: deficit };
      }

      return { ...context, shouldExtinct: true, reason: '食物不足' };
    },
  });

  engine.registerRule(RULE_IDS.EXTINCTION_PROCESS, {
    description: '處理滅絕階段',
    expansion: 'base',
    execute: async (context) => {
      const { gameState, traitRegistry } = context;
      let newState = { ...gameState };

      for (const player of newState.players) {
        const extinctCreatures = [];

        for (const creature of player.creatures) {
          // 檢查中毒
          if (creature.isPoisoned) {
            extinctCreatures.push(creature);
            continue;
          }

          // 檢查是否需要滅絕
          const checkResult = await context.executeRule(RULE_IDS.EXTINCTION_CHECK, {
            ...context,
            creature,
            gameState: newState,
          });

          if (checkResult.shouldExtinct) {
            extinctCreatures.push(creature);
          } else if (checkResult.fatToConsume) {
            // 消耗脂肪
            creature.food.yellow -= checkResult.fatToConsume;
          }
        }

        // 處理滅絕
        for (const creature of extinctCreatures) {
          newState = await context.executeRule(RULE_IDS.CREATURE_EXTINCT, {
            ...context,
            gameState: newState,
            creature,
            attacker: null,
          });
          newState = newState.gameState;
        }

        // 清除食物標記
        for (const creature of player.creatures) {
          if (creature.food) {
            creature.food.red = 0;
            creature.food.blue = 0;
            // 脂肪保留
          }
          creature.isHibernating = false;
          creature.isPoisoned = false;
        }
      }

      return { ...context, gameState: newState };
    },
  });
}

module.exports = { register };
```

**檔案**：`shared/expansions/base/rules/scoreRules.js`

```javascript
function register(engine) {
  engine.registerRule(RULE_IDS.SCORE_CALCULATE, {
    description: '計算最終分數',
    expansion: 'base',
    execute: (context) => {
      const { gameState, traitRegistry } = context;
      const scores = {};

      for (const player of gameState.players) {
        let score = 0;

        for (const creature of player.creatures) {
          // 生物基礎分：2 分
          score += 2;

          // 每個性狀：1 分 + 食量加成
          for (const trait of creature.traits || []) {
            score += 1;

            const handler = traitRegistry?.get(trait.type);
            if (handler) {
              score += handler.getScoreBonus({ creature, gameState });
            }
          }
        }

        scores[player.id] = score;
      }

      return { ...context, scores };
    },
  });

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

      // 平手判定：比較棄牌堆數量
      if (winners.length > 1) {
        let maxDiscard = -1;
        let tiebreakWinners = [];

        for (const winnerId of winners) {
          const player = gameState.players.find(p => p.id === winnerId);
          const discardCount = player?.discardPile?.length || 0;

          if (discardCount > maxDiscard) {
            maxDiscard = discardCount;
            tiebreakWinners = [winnerId];
          } else if (discardCount === maxDiscard) {
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
      };
    },
  });
}

module.exports = { register };
```

### 驗收標準

- [ ] 所有基礎規則實作完成
- [ ] 規則可正確註冊到 RuleEngine
- [ ] 食物公式符合規則書
- [ ] 攻擊流程完整（驗證、防禦、執行）
- [ ] 進食連鎖正確觸發
- [ ] 滅絕檢查符合規則
- [ ] 計分正確
- [ ] 單元測試覆蓋率 > 85%

### 依賴工單
- 0321（規則引擎核心）
- 0320（性狀處理器）

### 被依賴工單
- 0327（遊戲初始化重構）
- 0329（單元測試更新）
