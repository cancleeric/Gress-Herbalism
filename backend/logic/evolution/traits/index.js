/**
 * 性狀處理器模組統一匯出
 *
 * @module logic/evolution/traits
 */

const TraitHandler = require('./TraitHandler');
const { TraitRegistry, globalTraitRegistry } = require('./traitRegistry');

module.exports = {
  TraitHandler,
  TraitRegistry,
  globalTraitRegistry,
};
