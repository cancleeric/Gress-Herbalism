/**
 * 演化論擴充包定義（前端用）
 *
 * 前端使用的擴充包清單，對應後端 shared/constants/evolution.js 的 AVAILABLE_EXPANSIONS。
 * 包含前端顯示所需的額外欄位（icon、newTraits 預覽等）。
 *
 * @module components/games/evolution/constants/expansionList
 */

/**
 * @typedef {Object} ExpansionTraitPreview
 * @property {string} type - 性狀類型 key
 * @property {string} name - 中文名稱
 * @property {string} icon - Emoji 圖示
 * @property {string} description - 簡短描述
 */

/**
 * @typedef {Object} ExpansionInfo
 * @property {string} id - 擴充包 ID（對應後端 id）
 * @property {string} name - 中文名稱
 * @property {string} nameEn - 英文名稱
 * @property {boolean} required - 是否必選
 * @property {string} description - 簡短說明
 * @property {number} cardCount - 新增卡牌數量
 * @property {number} traitCount - 新增性狀數量
 * @property {string} icon - Emoji 圖示
 * @property {string[]} [requires] - 依賴的擴充包 ID
 * @property {ExpansionTraitPreview[]} [newTraits] - 新性狀預覽
 */

/**
 * 所有可用擴充包的前端定義清單
 * @type {ExpansionInfo[]}
 */
export const EXPANSION_LIST = [
  {
    id: 'base',
    name: '基礎版',
    nameEn: 'Evolution: The Origin of Species',
    required: true,
    description: '84 張卡牌、19 種性狀',
    cardCount: 84,
    traitCount: 19,
    icon: '🌿',
  },
  {
    id: 'deep-sea',
    name: '深海生態',
    nameEn: 'Deep Sea Ecology',
    required: false,
    description: '28 張新卡牌、6 種深海性狀',
    cardCount: 28,
    traitCount: 6,
    icon: '🌊',
    requires: ['base'],
    newTraits: [
      { type: 'deepDive', name: '深潛', icon: '🤿', description: '只有水生肉食才能攻擊此生物' },
      { type: 'electric', name: '電擊', icon: '⚡', description: '被攻擊時，攻擊者失去 1 個藍色食物' },
      { type: 'bioluminescence', name: '發光', icon: '✨', description: '進食時，自己的另一隻生物獲得 1 個藍色食物' },
      { type: 'schooling', name: '群游', icon: '🐠', description: '連結兩隻生物；其中一隻進食時，另一隻獲得 1 個藍色食物' },
      { type: 'megamouth', name: '巨口', icon: '🦈', description: '食量+1，不能從食物池進食，攻擊成功獲得 3 個藍色食物' },
      { type: 'abyssalAdaptation', name: '深淵適應', icon: '🌊', description: '食量需求減少 1（最低 1），可疊加' },
    ],
  },
];

export default EXPANSION_LIST;
