# 工單 0323：重構卡牌系統支援擴充包

## 基本資訊
- **工單編號**：0323
- **所屬計畫**：P2-A 可擴充架構
- **前置工單**：0318（性狀定義模組化）
- **預計影響檔案**：
  - `shared/expansions/base/cards/definitions.js`（新增）
  - `shared/expansions/base/cards/cardFactory.js`（新增）
  - `shared/expansions/base/index.js`（修改）
  - `backend/logic/evolution/cardLogic.js`（重構）

---

## 目標

將現有卡牌系統重構為模組化結構，使每個擴充包可以：
1. 定義自己的卡牌
2. 指定雙面卡正反面的性狀組合
3. 支援卡牌數量配置
4. 支援卡牌稀有度（基礎版暫不使用）

---

## 詳細規格

### 1. 卡牌定義結構

```javascript
// shared/expansions/base/cards/definitions.js

/**
 * 基礎版卡牌定義
 * 每張卡都是雙面卡，可選擇作為生物或性狀使用
 */

export const BASE_CARDS = [
  // === 肉食相關卡牌 (8張) ===
  { id: 'BASE_001', frontTrait: 'CARNIVORE', backTrait: 'CARNIVORE', count: 4 },
  { id: 'BASE_002', frontTrait: 'CARNIVORE', backTrait: 'FAT_TISSUE', count: 4 },

  // === 防禦性狀卡牌 (32張) ===
  { id: 'BASE_003', frontTrait: 'CAMOUFLAGE', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_004', frontTrait: 'BURROWING', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_005', frontTrait: 'POISONOUS', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_006', frontTrait: 'AQUATIC', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_007', frontTrait: 'AGILE', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_008', frontTrait: 'MASSIVE', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_009', frontTrait: 'TAIL_LOSS', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_010', frontTrait: 'MIMICRY', backTrait: 'FAT_TISSUE', count: 4 },

  // === 進食相關卡牌 (16張) ===
  { id: 'BASE_011', frontTrait: 'FAT_TISSUE', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_012', frontTrait: 'HIBERNATION', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_013', frontTrait: 'PARASITE', backTrait: 'CARNIVORE', count: 4 },
  { id: 'BASE_014', frontTrait: 'PIRACY', backTrait: 'FAT_TISSUE', count: 4 },

  // === 互動性狀卡牌 (12張) ===
  { id: 'BASE_015', frontTrait: 'COMMUNICATION', backTrait: 'COMMUNICATION', count: 4 },
  { id: 'BASE_016', frontTrait: 'COOPERATION', backTrait: 'COOPERATION', count: 4 },
  { id: 'BASE_017', frontTrait: 'SYMBIOSIS', backTrait: 'SYMBIOSIS', count: 4 },

  // === 特殊能力卡牌 (8張) ===
  { id: 'BASE_018', frontTrait: 'SCAVENGER', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_019', frontTrait: 'SHARP_VISION', backTrait: 'FAT_TISSUE', count: 4 },

  // === 踐踏卡牌 (8張) ===
  { id: 'BASE_020', frontTrait: 'TRAMPLE', backTrait: 'FAT_TISSUE', count: 4 },
  { id: 'BASE_021', frontTrait: 'TRAMPLE', backTrait: 'CARNIVORE', count: 4 },
];

/**
 * 計算總卡牌數
 */
export function getTotalCardCount() {
  return BASE_CARDS.reduce((sum, card) => sum + card.count, 0);
}

/**
 * 取得卡牌定義
 * @param {string} cardId - 卡牌ID
 * @returns {Object|null} 卡牌定義
 */
export function getCardDefinition(cardId) {
  return BASE_CARDS.find(card => card.id === cardId) || null;
}
```

### 2. 卡牌工廠

```javascript
// shared/expansions/base/cards/cardFactory.js

import { BASE_CARDS } from './definitions.js';
import { BASE_TRAITS } from '../traits/definitions.js';

/**
 * 卡牌實例類別
 */
export class Card {
  constructor(id, instanceId, frontTrait, backTrait, expansion = 'base') {
    this.id = id;                    // 卡牌定義ID
    this.instanceId = instanceId;    // 唯一實例ID
    this.frontTrait = frontTrait;    // 正面性狀
    this.backTrait = backTrait;      // 背面性狀
    this.expansion = expansion;      // 所屬擴充包
    this.selectedSide = null;        // 選擇的面（'front' | 'back' | null）
  }

  /**
   * 取得正面性狀資訊
   */
  getFrontTraitInfo() {
    return BASE_TRAITS[this.frontTrait] || null;
  }

  /**
   * 取得背面性狀資訊
   */
  getBackTraitInfo() {
    return BASE_TRAITS[this.backTrait] || null;
  }

  /**
   * 選擇使用哪一面
   * @param {'front'|'back'} side
   */
  selectSide(side) {
    if (side !== 'front' && side !== 'back') {
      throw new Error(`Invalid side: ${side}`);
    }
    this.selectedSide = side;
    return this;
  }

  /**
   * 取得選擇的性狀
   */
  getSelectedTrait() {
    if (!this.selectedSide) return null;
    return this.selectedSide === 'front' ? this.frontTrait : this.backTrait;
  }

  /**
   * 序列化為 JSON
   */
  toJSON() {
    return {
      id: this.id,
      instanceId: this.instanceId,
      frontTrait: this.frontTrait,
      backTrait: this.backTrait,
      expansion: this.expansion,
      selectedSide: this.selectedSide,
    };
  }

  /**
   * 從 JSON 還原
   */
  static fromJSON(json) {
    const card = new Card(
      json.id,
      json.instanceId,
      json.frontTrait,
      json.backTrait,
      json.expansion
    );
    if (json.selectedSide) {
      card.selectSide(json.selectedSide);
    }
    return card;
  }
}

/**
 * 卡牌工廠
 */
export class CardFactory {
  constructor() {
    this.instanceCounter = 0;
  }

  /**
   * 重置實例計數器
   */
  reset() {
    this.instanceCounter = 0;
  }

  /**
   * 建立單張卡牌實例
   * @param {Object} cardDef - 卡牌定義
   * @param {string} expansion - 擴充包ID
   * @returns {Card}
   */
  createCard(cardDef, expansion = 'base') {
    const instanceId = `${expansion}_${cardDef.id}_${++this.instanceCounter}`;
    return new Card(
      cardDef.id,
      instanceId,
      cardDef.frontTrait,
      cardDef.backTrait,
      expansion
    );
  }

  /**
   * 根據卡牌定義建立多張實例
   * @param {Object} cardDef - 卡牌定義
   * @param {string} expansion - 擴充包ID
   * @returns {Card[]}
   */
  createCards(cardDef, expansion = 'base') {
    const cards = [];
    for (let i = 0; i < cardDef.count; i++) {
      cards.push(this.createCard(cardDef, expansion));
    }
    return cards;
  }

  /**
   * 建立完整牌庫
   * @param {Object[]} cardDefinitions - 卡牌定義陣列
   * @param {string} expansion - 擴充包ID
   * @returns {Card[]}
   */
  createDeck(cardDefinitions, expansion = 'base') {
    this.reset();
    const deck = [];
    for (const cardDef of cardDefinitions) {
      deck.push(...this.createCards(cardDef, expansion));
    }
    return deck;
  }

  /**
   * 洗牌
   * @param {Card[]} deck
   * @returns {Card[]}
   */
  shuffle(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// 預設工廠實例
export const cardFactory = new CardFactory();
```

### 3. 擴充包索引更新

```javascript
// shared/expansions/base/index.js

import { BASE_TRAITS, getTraitDefinition, getAllTraits } from './traits/definitions.js';
import { BASE_CARDS, getTotalCardCount, getCardDefinition } from './cards/definitions.js';
import { Card, CardFactory, cardFactory } from './cards/cardFactory.js';
import { traitRegistry } from './traits/handlers/index.js';

/**
 * 基礎版擴充包
 */
export const BaseExpansion = {
  id: 'base',
  name: '基礎版',
  nameEn: 'Base Game',
  version: '1.0.0',

  // 性狀
  traits: BASE_TRAITS,
  getTraitDefinition,
  getAllTraits,
  traitRegistry,

  // 卡牌
  cards: BASE_CARDS,
  getTotalCardCount,
  getCardDefinition,
  Card,
  CardFactory,
  cardFactory,

  /**
   * 建立此擴充包的牌庫
   * @returns {Card[]}
   */
  createDeck() {
    return cardFactory.createDeck(BASE_CARDS, this.id);
  },

  /**
   * 取得此擴充包的所有性狀處理器
   */
  getTraitHandlers() {
    return traitRegistry.getAllHandlers();
  },

  /**
   * 驗證擴充包完整性
   */
  validate() {
    const errors = [];

    // 檢查每張卡的性狀是否存在
    for (const card of BASE_CARDS) {
      if (!BASE_TRAITS[card.frontTrait]) {
        errors.push(`Card ${card.id}: front trait ${card.frontTrait} not found`);
      }
      if (!BASE_TRAITS[card.backTrait]) {
        errors.push(`Card ${card.id}: back trait ${card.backTrait} not found`);
      }
    }

    // 檢查卡牌總數是否為84
    const totalCards = getTotalCardCount();
    if (totalCards !== 84) {
      errors.push(`Expected 84 cards, got ${totalCards}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default BaseExpansion;
```

### 4. 重構 cardLogic.js

```javascript
// backend/logic/evolution/cardLogic.js（重構版）

import { ExpansionRegistry } from '../../../shared/expansions/registry.js';

/**
 * 卡牌邏輯模組（重構版）
 * 委託給 ExpansionRegistry 處理
 */
export const cardLogic = {
  /**
   * 建立遊戲牌庫
   * @param {string[]} expansionIds - 啟用的擴充包ID列表
   * @returns {Card[]}
   */
  createDeck(expansionIds = ['base']) {
    return ExpansionRegistry.createCombinedDeck(expansionIds);
  },

  /**
   * 洗牌
   * @param {Card[]} deck
   * @returns {Card[]}
   */
  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * 發牌給玩家
   * @param {Object} gameState - 遊戲狀態
   * @param {number} cardsPerPlayer - 每位玩家的牌數
   */
  dealCards(gameState, cardsPerPlayer) {
    const { deck, players } = gameState;

    for (const player of Object.values(players)) {
      const drawnCards = deck.splice(0, cardsPerPlayer);
      player.hand.push(...drawnCards);
    }

    return gameState;
  },

  /**
   * 玩家抽牌
   * @param {Object} gameState - 遊戲狀態
   * @param {string} playerId - 玩家ID
   * @param {number} count - 抽牌數量
   */
  drawCards(gameState, playerId, count) {
    const player = gameState.players[playerId];
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const drawnCards = gameState.deck.splice(0, count);
    player.hand.push(...drawnCards);

    return {
      drawnCards,
      remainingDeck: gameState.deck.length,
    };
  },

  /**
   * 從手牌打出卡牌作為生物
   * @param {Object} gameState - 遊戲狀態
   * @param {string} playerId - 玩家ID
   * @param {string} cardInstanceId - 卡牌實例ID
   */
  playAsCreature(gameState, playerId, cardInstanceId) {
    const player = gameState.players[playerId];
    const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId);

    if (cardIndex === -1) {
      throw new Error(`Card ${cardInstanceId} not in hand`);
    }

    const [card] = player.hand.splice(cardIndex, 1);

    // 建立新生物
    const creatureId = `creature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const creature = {
      id: creatureId,
      ownerId: playerId,
      traits: [],
      food: 0,
      maxFood: 1, // 基礎食量
      fat: 0,
      usedCard: card,
    };

    player.creatures.push(creature);

    return creature;
  },

  /**
   * 從手牌打出卡牌作為性狀
   * @param {Object} gameState - 遊戲狀態
   * @param {string} playerId - 玩家ID
   * @param {string} cardInstanceId - 卡牌實例ID
   * @param {'front'|'back'} side - 使用哪一面
   * @param {string} creatureId - 目標生物ID
   * @param {string} [linkedCreatureId] - 連結生物ID（互動性狀用）
   */
  playAsTrait(gameState, playerId, cardInstanceId, side, creatureId, linkedCreatureId = null) {
    const player = gameState.players[playerId];
    const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId);

    if (cardIndex === -1) {
      throw new Error(`Card ${cardInstanceId} not in hand`);
    }

    const [card] = player.hand.splice(cardIndex, 1);
    card.selectSide(side);

    const traitType = card.getSelectedTrait();

    // 找到目標生物
    const creature = this.findCreature(gameState, creatureId);
    if (!creature) {
      throw new Error(`Creature ${creatureId} not found`);
    }

    // 檢查是否為互動性狀
    const traitHandler = ExpansionRegistry.getTraitHandler(traitType);
    if (traitHandler && traitHandler.isLinkTrait && traitHandler.isLinkTrait()) {
      if (!linkedCreatureId) {
        throw new Error(`Trait ${traitType} requires a linked creature`);
      }

      const linkedCreature = this.findCreature(gameState, linkedCreatureId);
      if (!linkedCreature) {
        throw new Error(`Linked creature ${linkedCreatureId} not found`);
      }

      // 建立連結性狀
      const traitLink = {
        traitType,
        card,
        creatures: [creatureId, linkedCreatureId],
      };

      creature.traits.push({ type: traitType, link: traitLink });
      linkedCreature.traits.push({ type: traitType, link: traitLink });

      return { traitType, linked: true, creatures: [creatureId, linkedCreatureId] };
    }

    // 一般性狀
    creature.traits.push({ type: traitType, card });

    // 更新食量加成
    if (traitHandler && typeof traitHandler.getFoodBonus === 'function') {
      creature.maxFood += traitHandler.getFoodBonus();
    }

    return { traitType, linked: false, creature: creatureId };
  },

  /**
   * 尋找生物
   */
  findCreature(gameState, creatureId) {
    for (const player of Object.values(gameState.players)) {
      const creature = player.creatures.find(c => c.id === creatureId);
      if (creature) {
        return creature;
      }
    }
    return null;
  },

  /**
   * 取得玩家的所有生物
   */
  getPlayerCreatures(gameState, playerId) {
    const player = gameState.players[playerId];
    return player ? player.creatures : [];
  },
};

export default cardLogic;
```

---

## 測試需求

### 單元測試

```javascript
// tests/unit/expansions/base/cards.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { BASE_CARDS, getTotalCardCount, getCardDefinition } from '@shared/expansions/base/cards/definitions.js';
import { Card, CardFactory, cardFactory } from '@shared/expansions/base/cards/cardFactory.js';

describe('Card Definitions', () => {
  it('should have 84 total cards', () => {
    expect(getTotalCardCount()).toBe(84);
  });

  it('should have unique card IDs', () => {
    const ids = BASE_CARDS.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should find card definition by ID', () => {
    const card = getCardDefinition('BASE_001');
    expect(card).toBeDefined();
    expect(card.frontTrait).toBe('CARNIVORE');
  });
});

describe('Card', () => {
  let card;

  beforeEach(() => {
    card = new Card('BASE_001', 'base_001_1', 'CARNIVORE', 'FAT_TISSUE');
  });

  it('should select front side', () => {
    card.selectSide('front');
    expect(card.getSelectedTrait()).toBe('CARNIVORE');
  });

  it('should select back side', () => {
    card.selectSide('back');
    expect(card.getSelectedTrait()).toBe('FAT_TISSUE');
  });

  it('should serialize and deserialize', () => {
    card.selectSide('front');
    const json = card.toJSON();
    const restored = Card.fromJSON(json);
    expect(restored.getSelectedTrait()).toBe('CARNIVORE');
  });
});

describe('CardFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new CardFactory();
  });

  it('should create deck with correct count', () => {
    const deck = factory.createDeck(BASE_CARDS, 'base');
    expect(deck.length).toBe(84);
  });

  it('should assign unique instance IDs', () => {
    const deck = factory.createDeck(BASE_CARDS, 'base');
    const instanceIds = deck.map(c => c.instanceId);
    const uniqueIds = new Set(instanceIds);
    expect(uniqueIds.size).toBe(84);
  });

  it('should shuffle deck', () => {
    const deck1 = factory.createDeck(BASE_CARDS, 'base');
    const deck2 = factory.shuffle([...deck1]);

    // 洗牌後順序應該不同（極小機率會相同）
    const sameOrder = deck1.every((card, i) => card.instanceId === deck2[i].instanceId);
    expect(sameOrder).toBe(false);
  });
});
```

---

## 驗收標準

1. [ ] `BASE_CARDS` 定義完整，共 84 張卡
2. [ ] `Card` 類別支援雙面選擇
3. [ ] `CardFactory` 可建立完整牌庫
4. [ ] 卡牌實例ID唯一
5. [ ] `BaseExpansion` 匯出完整卡牌模組
6. [ ] `cardLogic.js` 成功重構
7. [ ] 所有單元測試通過
8. [ ] 與 ExpansionRegistry 整合正常

---

## 備註

- 卡牌組合參考實體遊戲規則
- 雙面卡設計允許靈活策略
- 未來擴充包可定義新卡牌並自動整合
