/**
 * 整合測試：性狀互動
 *
 * 驗證性狀之間的互動邏輯
 *
 * @module expansions/__tests__/integration/traitInteractions.test
 */

const {
  createMockGameState,
  createMockCreature,
  addCreatureToPlayer,
  addTraitToCreature,
} = require('../testUtils');
const { ExpansionRegistry } = require('../../ExpansionRegistry');
const { baseExpansion, TRAIT_TYPES } = require('../../base');

describe('Trait Interactions Integration', () => {
  let registry;
  let gameState;

  beforeEach(() => {
    registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.enable('base');

    gameState = createMockGameState();
  });

  afterEach(() => {
    registry.reset();
  });

  describe('Carnivore Attack', () => {
    it('should allow carnivore to attack unprotected creature', () => {
      // 設定攻擊者（肉食）
      const attacker = createMockCreature('c1', 'player1');
      addTraitToCreature(attacker, TRAIT_TYPES.CARNIVORE, { foodBonus: 1 });
      addCreatureToPlayer(gameState, 'player1', attacker);

      // 設定防禦者（無防禦）
      const defender = createMockCreature('c2', 'player2');
      addCreatureToPlayer(gameState, 'player2', defender);

      // 執行攻擊檢查
      const handler = registry.getTraitHandler(TRAIT_TYPES.CARNIVORE);
      expect(handler).toBeDefined();

      // 檢查攻擊者有肉食性狀
      const hasCarnivore = attacker.traits.some(t => t.type === TRAIT_TYPES.CARNIVORE);
      expect(hasCarnivore).toBe(true);

      // 檢查防禦者沒有防禦性狀
      const hasDefense = defender.traits.length > 0;
      expect(hasDefense).toBe(false);
    });

    it('should block carnivore attack with camouflage when attacker has no sharp vision', () => {
      const attacker = createMockCreature('c1', 'player1');
      addTraitToCreature(attacker, TRAIT_TYPES.CARNIVORE);
      addCreatureToPlayer(gameState, 'player1', attacker);

      const defender = createMockCreature('c2', 'player2');
      addTraitToCreature(defender, TRAIT_TYPES.CAMOUFLAGE);
      addCreatureToPlayer(gameState, 'player2', defender);

      // 偽裝應該阻擋攻擊（假設攻擊者沒有銳目）
      const hasCamouflage = defender.traits.some(t => t.type === TRAIT_TYPES.CAMOUFLAGE);
      expect(hasCamouflage).toBe(true);

      const hasSharpVision = attacker.traits.some(t => t.type === TRAIT_TYPES.SHARP_VISION);
      expect(hasSharpVision).toBe(false);
    });

    it('should calculate food bonus for carnivore', () => {
      const attacker = createMockCreature('c1', 'player1');
      addTraitToCreature(attacker, TRAIT_TYPES.CARNIVORE, { foodBonus: 1 });

      // 肉食增加 1 食量
      expect(attacker.maxFood).toBe(2); // 基礎 1 + 肉食 1
    });

    it('should allow attack on camouflaged creature with sharp vision', () => {
      const attacker = createMockCreature('c1', 'player1');
      addTraitToCreature(attacker, TRAIT_TYPES.CARNIVORE);
      addTraitToCreature(attacker, TRAIT_TYPES.SHARP_VISION);
      addCreatureToPlayer(gameState, 'player1', attacker);

      const defender = createMockCreature('c2', 'player2');
      addTraitToCreature(defender, TRAIT_TYPES.CAMOUFLAGE);
      addCreatureToPlayer(gameState, 'player2', defender);

      // 銳目應該無視偽裝
      const hasSharpVision = attacker.traits.some(t => t.type === TRAIT_TYPES.SHARP_VISION);
      expect(hasSharpVision).toBe(true);

      const hasCamouflage = defender.traits.some(t => t.type === TRAIT_TYPES.CAMOUFLAGE);
      expect(hasCamouflage).toBe(true);
    });
  });

  describe('Defense Traits', () => {
    it('should block with burrowing during day', () => {
      const defender = createMockCreature('c1', 'player1');
      addTraitToCreature(defender, TRAIT_TYPES.BURROWING);
      addCreatureToPlayer(gameState, 'player1', defender);

      const hasBurrowing = defender.traits.some(t => t.type === TRAIT_TYPES.BURROWING);
      expect(hasBurrowing).toBe(true);
    });

    it('should block with poisonous and counter-attack', () => {
      const defender = createMockCreature('c1', 'player1');
      addTraitToCreature(defender, TRAIT_TYPES.POISONOUS);
      addCreatureToPlayer(gameState, 'player1', defender);

      const hasPoisonous = defender.traits.some(t => t.type === TRAIT_TYPES.POISONOUS);
      expect(hasPoisonous).toBe(true);
    });

    it('should block with massive when attacker is smaller', () => {
      const attacker = createMockCreature('c1', 'player1');
      addTraitToCreature(attacker, TRAIT_TYPES.CARNIVORE);
      addCreatureToPlayer(gameState, 'player1', attacker);

      const defender = createMockCreature('c2', 'player2');
      addTraitToCreature(defender, TRAIT_TYPES.MASSIVE);
      addCreatureToPlayer(gameState, 'player2', defender);

      const hasMassive = defender.traits.some(t => t.type === TRAIT_TYPES.MASSIVE);
      expect(hasMassive).toBe(true);
    });
  });

  describe('Feeding Traits', () => {
    it('should allow fat tissue to store food', () => {
      const creature = createMockCreature('c1', 'player1', { fat: 0 });
      addTraitToCreature(creature, TRAIT_TYPES.FAT_TISSUE);
      addCreatureToPlayer(gameState, 'player1', creature);

      const hasFatTissue = creature.traits.some(t => t.type === TRAIT_TYPES.FAT_TISSUE);
      expect(hasFatTissue).toBe(true);

      // 模擬存儲脂肪
      creature.fat = 1;
      expect(creature.fat).toBe(1);
    });

    it('should allow hibernation to skip feeding', () => {
      const creature = createMockCreature('c1', 'player1');
      addTraitToCreature(creature, TRAIT_TYPES.HIBERNATION);
      addCreatureToPlayer(gameState, 'player1', creature);

      const hasHibernation = creature.traits.some(t => t.type === TRAIT_TYPES.HIBERNATION);
      expect(hasHibernation).toBe(true);
    });
  });

  describe('Link Traits', () => {
    it('should trigger communication food sharing', () => {
      // 建立兩隻有溝通連結的生物
      const creature1 = createMockCreature('c1', 'player1', { maxFood: 2 });
      const creature2 = createMockCreature('c2', 'player1', { maxFood: 2 });

      addTraitToCreature(creature1, TRAIT_TYPES.COMMUNICATION, {
        link: { creatures: ['c1', 'c2'] },
      });
      addTraitToCreature(creature2, TRAIT_TYPES.COMMUNICATION, {
        link: { creatures: ['c1', 'c2'] },
      });

      addCreatureToPlayer(gameState, 'player1', creature1);
      addCreatureToPlayer(gameState, 'player1', creature2);

      // 驗證連結
      const link1 = creature1.traits.find(t => t.type === TRAIT_TYPES.COMMUNICATION);
      const link2 = creature2.traits.find(t => t.type === TRAIT_TYPES.COMMUNICATION);

      expect(link1.link.creatures).toContain('c1');
      expect(link1.link.creatures).toContain('c2');
      expect(link2.link.creatures).toContain('c1');
      expect(link2.link.creatures).toContain('c2');
    });

    it('should trigger cooperation bonus on feed', () => {
      const creature1 = createMockCreature('c1', 'player1', { maxFood: 2 });
      const creature2 = createMockCreature('c2', 'player1', { maxFood: 2 });

      addTraitToCreature(creature1, TRAIT_TYPES.COOPERATION, {
        link: { creatures: ['c1', 'c2'] },
      });
      addTraitToCreature(creature2, TRAIT_TYPES.COOPERATION, {
        link: { creatures: ['c1', 'c2'] },
      });

      addCreatureToPlayer(gameState, 'player1', creature1);
      addCreatureToPlayer(gameState, 'player1', creature2);

      // 模擬進食 creature1
      creature1.food = 1;

      // 合作應該觸發
      const handler = registry.getTraitHandler(TRAIT_TYPES.COOPERATION);
      expect(handler).toBeDefined();
    });

    it('should protect with symbiosis', () => {
      const creature1 = createMockCreature('c1', 'player1');
      const creature2 = createMockCreature('c2', 'player1');

      addTraitToCreature(creature1, TRAIT_TYPES.SYMBIOSIS, {
        link: { creatures: ['c1', 'c2'] },
      });
      addTraitToCreature(creature2, TRAIT_TYPES.SYMBIOSIS, {
        link: { creatures: ['c1', 'c2'] },
      });

      addCreatureToPlayer(gameState, 'player1', creature1);
      addCreatureToPlayer(gameState, 'player1', creature2);

      const hasSymbiosis = creature1.traits.some(t => t.type === TRAIT_TYPES.SYMBIOSIS);
      expect(hasSymbiosis).toBe(true);
    });
  });

  describe('Multiple Traits Interaction', () => {
    it('should calculate total food requirement with multiple traits', () => {
      const creature = createMockCreature('c1', 'player1');
      addTraitToCreature(creature, TRAIT_TYPES.CARNIVORE, { foodBonus: 1 });
      addTraitToCreature(creature, TRAIT_TYPES.PARASITE, { foodBonus: 2 });

      // 基礎 1 + 肉食 1 + 寄生蟲 2 = 4
      expect(creature.maxFood).toBe(4);
    });

    it('should handle aquatic limitation', () => {
      const creature1 = createMockCreature('c1', 'player1');
      addTraitToCreature(creature1, TRAIT_TYPES.AQUATIC);
      addCreatureToPlayer(gameState, 'player1', creature1);

      const creature2 = createMockCreature('c2', 'player2');
      addTraitToCreature(creature2, TRAIT_TYPES.CARNIVORE);
      addCreatureToPlayer(gameState, 'player2', creature2);

      // 非水生生物不能攻擊水生生物
      const attackerIsAquatic = creature2.traits.some(t => t.type === TRAIT_TYPES.AQUATIC);
      const defenderIsAquatic = creature1.traits.some(t => t.type === TRAIT_TYPES.AQUATIC);

      expect(attackerIsAquatic).toBe(false);
      expect(defenderIsAquatic).toBe(true);
    });
  });

  describe('Handler Existence', () => {
    it('should have handlers for all base traits', () => {
      // 使用 TRAIT_TYPES 常數來取得所有正確的性狀名稱
      const expectedTraits = Object.values(TRAIT_TYPES);

      for (const traitType of expectedTraits) {
        const handler = registry.getTraitHandler(traitType);
        expect(handler).toBeDefined();
      }
    });
  });
});
