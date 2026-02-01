/**
 * 卡牌工廠
 *
 * 負責建立卡牌實例和管理牌庫
 *
 * @module expansions/base/cards/cardFactory
 */

const { TRAIT_DEFINITIONS } = require('../traits/definitions');

/**
 * 卡牌實例類別
 */
class Card {
  /**
   * @param {string} id - 卡牌定義 ID
   * @param {string} instanceId - 唯一實例 ID
   * @param {string} frontTrait - 正面性狀
   * @param {string} backTrait - 背面性狀
   * @param {string} expansion - 所屬擴充包
   */
  constructor(id, instanceId, frontTrait, backTrait, expansion = 'base') {
    this.id = id;
    this.instanceId = instanceId;
    this.frontTrait = frontTrait;
    this.backTrait = backTrait;
    this.expansion = expansion;
    this.selectedSide = null;
  }

  /**
   * 取得正面性狀資訊
   * @returns {Object|null}
   */
  getFrontTraitInfo() {
    return TRAIT_DEFINITIONS[this.frontTrait] || null;
  }

  /**
   * 取得背面性狀資訊
   * @returns {Object|null}
   */
  getBackTraitInfo() {
    return TRAIT_DEFINITIONS[this.backTrait] || null;
  }

  /**
   * 選擇使用哪一面
   * @param {'front'|'back'} side
   * @returns {Card} this（支援鏈式呼叫）
   */
  selectSide(side) {
    if (side !== 'front' && side !== 'back') {
      throw new Error(`Invalid side: ${side}. Must be 'front' or 'back'`);
    }
    this.selectedSide = side;
    return this;
  }

  /**
   * 清除選擇
   * @returns {Card} this
   */
  clearSelection() {
    this.selectedSide = null;
    return this;
  }

  /**
   * 取得選擇的性狀
   * @returns {string|null}
   */
  getSelectedTrait() {
    if (!this.selectedSide) return null;
    return this.selectedSide === 'front' ? this.frontTrait : this.backTrait;
  }

  /**
   * 取得選擇的性狀資訊
   * @returns {Object|null}
   */
  getSelectedTraitInfo() {
    const trait = this.getSelectedTrait();
    if (!trait) return null;
    return TRAIT_DEFINITIONS[trait] || null;
  }

  /**
   * 檢查是否為雙面相同
   * @returns {boolean}
   */
  isSameBothSides() {
    return this.frontTrait === this.backTrait;
  }

  /**
   * 序列化為 JSON
   * @returns {Object}
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
   * @param {Object} json
   * @returns {Card}
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
 * 卡牌工廠類別
 */
class CardFactory {
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
   * @param {string} expansion - 擴充包 ID
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
   * @param {string} expansion - 擴充包 ID
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
   * @param {string} expansion - 擴充包 ID
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
   * 洗牌 (Fisher-Yates)
   * @param {Card[]} deck
   * @returns {Card[]} 洗過的新陣列
   */
  shuffle(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 建立並洗牌
   * @param {Object[]} cardDefinitions - 卡牌定義陣列
   * @param {string} expansion - 擴充包 ID
   * @returns {Card[]}
   */
  createShuffledDeck(cardDefinitions, expansion = 'base') {
    const deck = this.createDeck(cardDefinitions, expansion);
    return this.shuffle(deck);
  }
}

/**
 * 預設工廠實例
 */
const cardFactory = new CardFactory();

module.exports = {
  Card,
  CardFactory,
  cardFactory,
};
