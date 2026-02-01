/**
 * 基礎版卡牌模組
 *
 * @module expansions/base/cards
 */

const {
  BASE_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,
} = require('./definitions');

const {
  Card,
  CardFactory,
  cardFactory,
} = require('./cardFactory');

module.exports = {
  // 卡牌定義
  BASE_CARDS,
  EXPECTED_TOTAL,
  getTotalCardCount,
  getCardDefinition,
  getCardsByTrait,
  validateCardDefinitions,

  // 卡牌工廠
  Card,
  CardFactory,
  cardFactory,
};
