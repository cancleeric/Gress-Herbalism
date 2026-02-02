/**
 * 性狀視覺常數定義
 *
 * 定義性狀的圖示和顏色
 *
 * @module components/games/evolution/constants/traitVisuals
 */

/**
 * 性狀圖示（使用 Emoji 作為臨時方案，可替換為 SVG）
 * @readonly
 */
export const TRAIT_ICONS = {
  // 肉食相關
  carnivore: '🦷',
  scavenger: '🦅',
  sharpVision: '👁️',

  // 防禦相關
  camouflage: '🍃',
  burrowing: '🕳️',
  poisonous: '☠️',
  aquatic: '🌊',
  agile: '💨',
  massive: '🦣',
  tailLoss: '🦎',
  mimicry: '🎭',

  // 進食相關
  fatTissue: '🍖',
  hibernation: '💤',
  parasite: '🪱',
  robbery: '🏴‍☠️',

  // 互動相關
  communication: '📢',
  cooperation: '🤝',
  symbiosis: '🔗',

  // 特殊
  trampling: '🦏',
};

/**
 * 性狀類別顏色
 * @readonly
 */
export const TRAIT_COLORS = {
  carnivore: '#ef4444', // 紅色
  defense: '#3b82f6', // 藍色
  feeding: '#f59e0b', // 黃色
  interactive: '#10b981', // 綠色
  special: '#8b5cf6', // 紫色
};

/**
 * 性狀中文名稱對照表
 * @readonly
 */
export const TRAIT_NAMES = {
  // 肉食相關
  carnivore: '肉食',
  scavenger: '腐食',
  sharpVision: '銳目',

  // 防禦相關
  camouflage: '偽裝',
  burrowing: '穴居',
  poisonous: '毒液',
  aquatic: '水生',
  agile: '敏捷',
  massive: '巨化',
  tailLoss: '斷尾',
  mimicry: '擬態',

  // 進食相關
  fatTissue: '脂肪組織',
  hibernation: '冬眠',
  parasite: '寄生蟲',
  robbery: '掠奪',

  // 互動相關
  communication: '溝通',
  cooperation: '合作',
  symbiosis: '共生',

  // 特殊
  trampling: '踐踏',
};

/**
 * 性狀類別對照表
 * @readonly
 */
export const TRAIT_CATEGORY_MAP = {
  carnivore: 'carnivore',
  scavenger: 'carnivore',
  sharpVision: 'carnivore',
  camouflage: 'defense',
  burrowing: 'defense',
  poisonous: 'defense',
  aquatic: 'defense',
  agile: 'defense',
  massive: 'defense',
  tailLoss: 'defense',
  mimicry: 'defense',
  fatTissue: 'feeding',
  hibernation: 'feeding',
  parasite: 'feeding',
  robbery: 'feeding',
  communication: 'interactive',
  cooperation: 'interactive',
  symbiosis: 'interactive',
  trampling: 'special',
};

/**
 * 性狀食量加成對照表
 * @readonly
 */
export const TRAIT_FOOD_BONUS = {
  carnivore: 1,
  massive: 1,
  parasite: 2,
  // 其他性狀食量加成為 0
};

/**
 * 取得性狀描述
 * @param {string} traitType - 性狀類型
 * @returns {string} 性狀描述
 */
export const getTraitDescription = (traitType) => {
  const descriptions = {
    carnivore: '可以攻擊其他生物獲得食物',
    scavenger: '當任何生物被肉食攻擊滅絕時獲得藍色食物',
    sharpVision: '可攻擊有偽裝的生物',
    camouflage: '需要銳目才能被攻擊',
    burrowing: '吃飽時無法被攻擊',
    poisonous: '被攻擊滅絕時，攻擊者也會在滅絕階段死亡',
    aquatic: '只有水生肉食可攻擊水生生物',
    agile: '被攻擊時擲骰，4-6逃脫',
    massive: '食量+1，只有巨化肉食可攻擊巨化生物',
    tailLoss: '被攻擊時可棄置性狀取消攻擊',
    mimicry: '被攻擊時可轉移攻擊給自己另一隻生物',
    fatTissue: '可以儲存額外的食物',
    hibernation: '可跳過進食階段視為吃飽',
    parasite: '食量+2，只能放在對手生物上',
    robbery: '可偷取其他生物身上的食物',
    communication: '拿食物時連結的生物也從中央拿取',
    cooperation: '獲得食物時連結的生物獲得藍色食物',
    symbiosis: '代表吃飽前被保護者不能進食',
    trampling: '可移除食物池中的一個紅色食物',
  };
  return descriptions[traitType] || '';
};

/**
 * 取得完整性狀資訊
 * @param {string} traitType - 性狀類型
 * @returns {Object} 性狀資訊
 */
export const getTraitInfo = (traitType) => {
  return {
    type: traitType,
    name: TRAIT_NAMES[traitType] || traitType,
    icon: TRAIT_ICONS[traitType] || '❓',
    category: TRAIT_CATEGORY_MAP[traitType] || 'special',
    color: TRAIT_COLORS[TRAIT_CATEGORY_MAP[traitType]] || '#6b7280',
    foodBonus: TRAIT_FOOD_BONUS[traitType] || 0,
    description: getTraitDescription(traitType),
  };
};

export default {
  TRAIT_ICONS,
  TRAIT_COLORS,
  TRAIT_NAMES,
  TRAIT_CATEGORY_MAP,
  TRAIT_FOOD_BONUS,
  getTraitDescription,
  getTraitInfo,
};
