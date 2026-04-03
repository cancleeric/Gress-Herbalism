/**
 * 演化論遊戲常數定義
 *
 * 此檔案包含演化論（Evolution: The Origin of Species）遊戲的所有常數定義，包括：
 * - 遊戲基本常數（玩家數量、手牌數量、總卡牌數）
 * - 遊戲階段常數
 * - 食物類型常數
 * - 性狀類型常數（19種）
 * - 計分規則常數
 * - 動作類型常數
 *
 * @module constants/evolution
 *
 * @deprecated 此檔案保留以向後相容。
 * 新代碼應使用 shared/expansions/base/ 下的模組：
 * - 性狀定義：shared/expansions/base/traits/definitions.js
 * - 卡牌定義：shared/expansions/base/cards.js
 * - 擴充包：shared/expansions/base/index.js
 */

// 匯入新模組以確保相容性
const baseExpansionModule = require('../expansions/base');

// 匯入深海擴充包常數
const deepSeaExpansionModule = require('../expansions/deepSea');

/**
 * 性狀類別定義（從新模組匯入）
 * @see module:expansions/base/traits/definitions
 */
const TRAIT_CATEGORIES = baseExpansionModule.TRAIT_CATEGORIES;

// ==================== 遊戲基本常數 ====================

/**
 * 最小玩家數
 * @readonly
 * @type {number}
 */
const MIN_PLAYERS = 2;

/**
 * 最大玩家數
 * @readonly
 * @type {number}
 */
const MAX_PLAYERS = 4;

/**
 * 初始手牌數量
 * @readonly
 * @type {number}
 */
const INITIAL_HAND_SIZE = 6;

/**
 * 總卡牌數量
 * @readonly
 * @type {number}
 */
const TOTAL_CARDS = 84;

/**
 * 敏捷逃脫閾值（擲骰結果 >= 此值則逃脫成功）
 * @readonly
 * @type {number}
 */
const AGILE_ESCAPE_THRESHOLD = 4;

// ==================== 遊戲階段 ====================

/**
 * 遊戲階段定義
 * @readonly
 * @enum {string}
 */
const GAME_PHASES = {
  /** 等待開始 */
  WAITING: 'waiting',
  /** 演化階段 - 玩家出牌創造生物或賦予性狀 */
  EVOLUTION: 'evolution',
  /** 食物供給階段 - 擲骰決定食物數量 */
  FOOD_SUPPLY: 'foodSupply',
  /** 進食階段 - 玩家輪流進食或攻擊 */
  FEEDING: 'feeding',
  /** 滅絕階段 - 判定滅絕、清理、抽牌 */
  EXTINCTION: 'extinction',
  /** 遊戲結束 */
  GAME_END: 'gameEnd'
};

/**
 * 所有遊戲階段陣列
 * @readonly
 * @type {string[]}
 */
const ALL_GAME_PHASES = Object.values(GAME_PHASES);

/**
 * 遊戲狀態（工單 0327）
 * @readonly
 * @enum {string}
 */
const GAME_STATUS = {
  /** 等待玩家 */
  WAITING: 'waiting',
  /** 準備開始 */
  READY: 'ready',
  /** 遊戲進行中 */
  PLAYING: 'playing',
  /** 遊戲暫停 */
  PAUSED: 'paused',
  /** 遊戲結束 */
  FINISHED: 'finished',
  /** 遊戲放棄 */
  ABANDONED: 'abandoned',
};

/**
 * 預設玩家範圍（可被擴充包覆寫）
 * @readonly
 * @type {Object}
 */
const DEFAULT_PLAYER_RANGE = {
  MIN: 2,
  MAX: 4,
};

/**
 * 可用擴充包列表（工單 0327）
 * @readonly
 * @type {Object[]}
 */
const AVAILABLE_EXPANSIONS = [
  {
    id: 'base',
    name: '基礎版',
    nameEn: 'Evolution: The Origin of Species',
    required: true,
    description: '84張卡牌、19種性狀',
  },
  // 未來擴充包會加在這裡
];

// ==================== 食物類型 ====================

/**
 * 食物類型定義
 * @readonly
 * @enum {string}
 */
const FOOD_TYPES = {
  /** 紅色食物 - 從食物池獲得的一般食物 */
  RED: 'red',
  /** 藍色食物 - 額外獲得的食物（肉食攻擊、合作等） */
  BLUE: 'blue',
  /** 黃色食物 - 脂肪組織儲存的食物 */
  YELLOW: 'yellow'
};

// ==================== 食物數量計算公式 ====================

/**
 * 食物數量計算公式（根據玩家數）
 * @readonly
 * @type {Object<number, {dice: number, bonus: number}>}
 */
const FOOD_FORMULA = {
  /** 2人: 1顆骰子 + 2 */
  2: { dice: 1, bonus: 2 },
  /** 3人: 2顆骰子總和 */
  3: { dice: 2, bonus: 0 },
  /** 4人: 2顆骰子總和 + 2 */
  4: { dice: 2, bonus: 2 }
};

// ==================== 性狀類型 ====================

/**
 * 性狀類型定義（共19種）
 * @readonly
 * @enum {string}
 */
const TRAIT_TYPES = {
  // ===== 肉食相關 (3) =====
  /** 肉食 - 食量+1，不能吃現有食物，必須攻擊其他生物 */
  CARNIVORE: 'carnivore',
  /** 腐食 - 當任何生物被肉食攻擊滅絕時獲得藍色食物 */
  SCAVENGER: 'scavenger',
  /** 銳目 - 可攻擊有偽裝的生物 */
  SHARP_VISION: 'sharpVision',

  // ===== 防禦相關 (8) =====
  /** 偽裝 - 需要銳目才能被攻擊 */
  CAMOUFLAGE: 'camouflage',
  /** 穴居 - 吃飽時無法被攻擊 */
  BURROWING: 'burrowing',
  /** 毒液 - 被攻擊滅絕時，攻擊者也會在滅絕階段死亡 */
  POISONOUS: 'poisonous',
  /** 水生 - 只有水生肉食可攻擊水生生物，水生肉食也只能攻擊水生 */
  AQUATIC: 'aquatic',
  /** 敏捷 - 被攻擊時擲骰，4-6逃脫 */
  AGILE: 'agile',
  /** 巨化 - 食量+1，只有巨化肉食可攻擊巨化生物 */
  MASSIVE: 'massive',
  /** 斷尾 - 被攻擊時可棄置性狀取消攻擊，攻擊者獲得1藍色食物 */
  TAIL_LOSS: 'tailLoss',
  /** 擬態 - 每回合一次，被攻擊時可轉移攻擊給自己另一隻可被獵食的生物 */
  MIMICRY: 'mimicry',

  // ===== 進食相關 (4) =====
  /** 脂肪組織 - 吃飽後可繼續獲得食物儲存為黃色脂肪，可疊加 */
  FAT_TISSUE: 'fatTissue',
  /** 冬眠 - 可跳過進食階段視為吃飽，最後一回合不能使用 */
  HIBERNATION: 'hibernation',
  /** 寄生蟲 - 食量+2，只能放在對手生物上 */
  PARASITE: 'parasite',
  /** 掠奪 - 可偷取其他未吃飽生物身上的食物，每階段限用一次 */
  ROBBERY: 'robbery',

  // ===== 互動相關 (3) =====
  /** 溝通 - 連結兩隻生物，其中一隻拿紅色食物時另一隻也從中央拿取 */
  COMMUNICATION: 'communication',
  /** 合作 - 連結兩隻生物，其中一隻獲得紅/藍食物時另一隻獲得藍色食物 */
  COOPERATION: 'cooperation',
  /** 共生 - 指定代表與被保護者，代表吃飽前被保護者不能進食，只能攻擊代表 */
  SYMBIOSIS: 'symbiosis',

  // ===== 特殊能力 (1) =====
  /** 踐踏 - 進食階段可移除食物池中的一個紅色食物 */
  TRAMPLING: 'trampling'
};

/**
 * 所有性狀類型陣列
 * @readonly
 * @type {string[]}
 */
const ALL_TRAIT_TYPES = Object.values(TRAIT_TYPES);

/**
 * 互動性狀類型（需要連結兩隻生物）
 * @readonly
 * @type {string[]}
 */
const INTERACTIVE_TRAITS = [
  TRAIT_TYPES.COMMUNICATION,
  TRAIT_TYPES.COOPERATION,
  TRAIT_TYPES.SYMBIOSIS
];

/**
 * 性狀互斥規則
 * @readonly
 * @type {Object<string, string[]>}
 */
const TRAIT_INCOMPATIBILITIES = {
  [TRAIT_TYPES.CARNIVORE]: [TRAIT_TYPES.SCAVENGER],
  [TRAIT_TYPES.SCAVENGER]: [TRAIT_TYPES.CARNIVORE]
};

/**
 * 可疊加的性狀（同一生物可擁有多張）
 * @readonly
 * @type {string[]}
 */
const STACKABLE_TRAITS = [
  TRAIT_TYPES.FAT_TISSUE
];

// ==================== 性狀詳細定義 ====================

/**
 * 性狀詳細定義
 * @readonly
 * @type {Object<string, {name: string, foodBonus: number, description: string, cardCount: number}>}
 */
const TRAIT_DEFINITIONS = {
  [TRAIT_TYPES.CARNIVORE]: {
    name: '肉食',
    foodBonus: 1,
    description: '不能吃現有食物，必須攻擊其他生物獲得2個藍色食物',
    cardCount: 4
  },
  [TRAIT_TYPES.SCAVENGER]: {
    name: '腐食',
    foodBonus: 0,
    description: '當任何生物被肉食攻擊滅絕時獲得1個藍色食物',
    cardCount: 4
  },
  [TRAIT_TYPES.SHARP_VISION]: {
    name: '銳目',
    foodBonus: 0,
    description: '可以攻擊具有偽裝性狀的生物',
    cardCount: 4
  },
  [TRAIT_TYPES.CAMOUFLAGE]: {
    name: '偽裝',
    foodBonus: 0,
    description: '肉食生物需要銳目才能攻擊此生物',
    cardCount: 4
  },
  [TRAIT_TYPES.BURROWING]: {
    name: '穴居',
    foodBonus: 0,
    description: '吃飽時無法被攻擊',
    cardCount: 4
  },
  [TRAIT_TYPES.POISONOUS]: {
    name: '毒液',
    foodBonus: 0,
    description: '被攻擊滅絕時，攻擊者也會在滅絕階段死亡',
    cardCount: 4
  },
  [TRAIT_TYPES.AQUATIC]: {
    name: '水生',
    foodBonus: 0,
    description: '只有水生肉食可攻擊水生生物，水生肉食也只能攻擊水生',
    cardCount: 4
  },
  [TRAIT_TYPES.AGILE]: {
    name: '敏捷',
    foodBonus: 0,
    description: '被攻擊時擲骰，4-6逃脫成功',
    cardCount: 4
  },
  [TRAIT_TYPES.MASSIVE]: {
    name: '巨化',
    foodBonus: 1,
    description: '只有巨化肉食可攻擊巨化生物',
    cardCount: 4
  },
  [TRAIT_TYPES.TAIL_LOSS]: {
    name: '斷尾',
    foodBonus: 0,
    description: '被攻擊時可棄置一張性狀取消攻擊，攻擊者獲得1藍色食物',
    cardCount: 4
  },
  [TRAIT_TYPES.MIMICRY]: {
    name: '擬態',
    foodBonus: 0,
    description: '每回合一次，被攻擊時可轉移攻擊給自己另一隻可被獵食的生物',
    cardCount: 4
  },
  [TRAIT_TYPES.FAT_TISSUE]: {
    name: '脂肪組織',
    foodBonus: 0,
    description: '吃飽後可繼續獲得食物儲存為脂肪，可疊加',
    cardCount: 8
  },
  [TRAIT_TYPES.HIBERNATION]: {
    name: '冬眠',
    foodBonus: 0,
    description: '可跳過進食階段視為吃飽，最後一回合不能使用',
    cardCount: 4
  },
  [TRAIT_TYPES.PARASITE]: {
    name: '寄生蟲',
    foodBonus: 2,
    description: '只能放在對手生物上，增加該生物的食量需求',
    cardCount: 8
  },
  [TRAIT_TYPES.ROBBERY]: {
    name: '掠奪',
    foodBonus: 0,
    description: '可偷取其他未吃飽生物身上的1個食物，每階段限用一次',
    cardCount: 4
  },
  [TRAIT_TYPES.COMMUNICATION]: {
    name: '溝通',
    foodBonus: 0,
    description: '當其中一隻生物拿紅色食物時，另一隻也從中央拿取',
    cardCount: 4,
    isInteractive: true
  },
  [TRAIT_TYPES.COOPERATION]: {
    name: '合作',
    foodBonus: 0,
    description: '當其中一隻生物獲得紅/藍食物時，另一隻獲得1藍色食物',
    cardCount: 4,
    isInteractive: true
  },
  [TRAIT_TYPES.SYMBIOSIS]: {
    name: '共生',
    foodBonus: 0,
    description: '代表吃飽前被保護者不能進食，只能攻擊代表',
    cardCount: 4,
    isInteractive: true
  },
  [TRAIT_TYPES.TRAMPLING]: {
    name: '踐踏',
    foodBonus: 0,
    description: '進食階段可移除食物池中的一個紅色食物',
    cardCount: 4
  }
};

// ==================== 計分常數 ====================

/**
 * 計分規則
 * @readonly
 * @type {Object}
 */
const SCORING = {
  /** 每隻存活生物的基礎分數 */
  CREATURE_BASE: 2,
  /** 每張性狀卡的基礎分數 */
  TRAIT_BASE: 1,
  /** +1食量性狀的額外加分 */
  FOOD_BONUS_1: 1,
  /** +2食量性狀的額外加分 */
  FOOD_BONUS_2: 2
};

// ==================== 動作類型 ====================

/**
 * 動作類型定義
 * @readonly
 * @enum {string}
 */
const ACTION_TYPES = {
  /** 創造生物 - 將卡牌當作生物打出 */
  CREATE_CREATURE: 'createCreature',
  PLAY_CARD_AS_CREATURE: 'createCreature', // 別名
  /** 賦予性狀 - 將卡牌當作性狀放在生物上 */
  ADD_TRAIT: 'addTrait',
  PLAY_CARD_AS_TRAIT: 'addTrait', // 別名
  /** 跳過 - 跳過當前動作 */
  PASS: 'pass',
  /** 進食 - 從食物池取得食物 */
  FEED: 'feed',
  /** 攻擊 - 肉食生物攻擊其他生物 */
  ATTACK: 'attack',
  /** 使用性狀 - 使用性狀能力（冬眠、掠奪、踐踏等） */
  USE_TRAIT: 'useTrait',
  USE_ABILITY: 'useTrait', // 別名
  /** 冬眠 - 跳過進食視為吃飽 */
  HIBERNATE: 'hibernate',
  /** 使用脂肪 - 消耗脂肪來滿足食量 */
  USE_FAT: 'useFat',
  /** 防禦回應 - 攻擊時的防禦選擇 */
  DEFENSE_RESPONSE: 'defenseResponse'
};

// ==================== 攻擊結果類型 ====================

/**
 * 攻擊防禦回應類型
 * @readonly
 * @enum {string}
 */
const DEFENSE_RESPONSE_TYPES = {
  /** 斷尾 - 棄置性狀取消攻擊 */
  TAIL_LOSS: 'tailLoss',
  /** 擬態 - 轉移攻擊目標 */
  MIMICRY: 'mimicry',
  /** 敏捷 - 擲骰逃脫 */
  AGILE: 'agile'
};

// ==================== 連結類型 ====================

/**
 * 互動性狀連結類型
 * @readonly
 * @enum {string}
 */
const LINK_TYPES = {
  /** 溝通連結 */
  COMMUNICATION: 'communication',
  /** 合作連結 */
  COOPERATION: 'cooperation',
  /** 共生連結 */
  SYMBIOSIS: 'symbiosis'
};

// ==================== 肉食攻擊獎勵 ====================

/**
 * 肉食攻擊成功獲得的藍色食物數量
 * @readonly
 * @type {number}
 */
const CARNIVORE_ATTACK_FOOD_REWARD = 2;

/**
 * 斷尾時攻擊者獲得的藍色食物數量
 * @readonly
 * @type {number}
 */
const TAIL_LOSS_FOOD_REWARD = 1;

/**
 * 腐食觸發時獲得的藍色食物數量
 * @readonly
 * @type {number}
 */
const SCAVENGER_FOOD_REWARD = 1;

// ==================== 工具函數 ====================

/**
 * 驗證玩家數量是否有效
 * @param {number} count - 玩家數量
 * @returns {boolean} 是否有效
 */
function isValidPlayerCount(count) {
  return count >= MIN_PLAYERS && count <= MAX_PLAYERS;
}

/**
 * 驗證遊戲階段是否有效
 * @param {string} phase - 遊戲階段
 * @returns {boolean} 是否有效
 */
function isValidGamePhase(phase) {
  return ALL_GAME_PHASES.includes(phase);
}

/**
 * 驗證性狀類型是否有效
 * @param {string} traitType - 性狀類型
 * @returns {boolean} 是否有效
 */
function isValidTraitType(traitType) {
  return ALL_TRAIT_TYPES.includes(traitType);
}

/**
 * 檢查性狀是否為互動性狀
 * @param {string} traitType - 性狀類型
 * @returns {boolean} 是否為互動性狀
 */
function isInteractiveTrait(traitType) {
  return INTERACTIVE_TRAITS.includes(traitType);
}

/**
 * 檢查性狀是否可疊加
 * @param {string} traitType - 性狀類型
 * @returns {boolean} 是否可疊加
 */
function isStackableTrait(traitType) {
  return STACKABLE_TRAITS.includes(traitType);
}

/**
 * 檢查兩個性狀是否互斥
 * @param {string} trait1 - 性狀1
 * @param {string} trait2 - 性狀2
 * @returns {boolean} 是否互斥
 */
function areTraitsIncompatible(trait1, trait2) {
  const incompatible = TRAIT_INCOMPATIBILITIES[trait1];
  return incompatible ? incompatible.includes(trait2) : false;
}

/**
 * 取得性狀資訊
 * @param {string} traitType - 性狀類型
 * @returns {Object|null} 性狀資訊
 */
function getTraitInfo(traitType) {
  return TRAIT_DEFINITIONS[traitType] || null;
}

/**
 * 計算食物數量
 * @param {number} playerCount - 玩家數
 * @param {number[]} diceResults - 骰子結果陣列
 * @returns {number} 食物數量
 */
function calculateFoodAmount(playerCount, diceResults) {
  const formula = FOOD_FORMULA[playerCount];
  if (!formula) return 0;
  const diceSum = diceResults.reduce((sum, val) => sum + val, 0);
  return diceSum + formula.bonus;
}

// ==================== 導出 ====================

module.exports = {
  // 基本常數
  MIN_PLAYERS,
  MAX_PLAYERS,
  INITIAL_HAND_SIZE,
  TOTAL_CARDS,
  AGILE_ESCAPE_THRESHOLD,

  // 遊戲階段
  GAME_PHASES,
  ALL_GAME_PHASES,
  GAME_STATUS,
  DEFAULT_PLAYER_RANGE,
  AVAILABLE_EXPANSIONS,

  // 食物
  FOOD_TYPES,
  FOOD_FORMULA,

  // 性狀
  TRAIT_TYPES,
  ALL_TRAIT_TYPES,
  INTERACTIVE_TRAITS,
  TRAIT_INCOMPATIBILITIES,
  STACKABLE_TRAITS,
  TRAIT_DEFINITIONS,
  TRAIT_CATEGORIES, // 新增：從新模組匯入

  // 計分
  SCORING,

  // 動作
  ACTION_TYPES,

  // 防禦回應
  DEFENSE_RESPONSE_TYPES,

  // 連結
  LINK_TYPES,

  // 獎勵常數
  CARNIVORE_ATTACK_FOOD_REWARD,
  TAIL_LOSS_FOOD_REWARD,
  SCAVENGER_FOOD_REWARD,

  // 工具函數
  isValidPlayerCount,
  isValidGamePhase,
  isValidTraitType,
  isInteractiveTrait,
  isStackableTrait,
  areTraitsIncompatible,
  getTraitInfo,
  calculateFoodAmount,

  // 新增：擴充包模組存取
  baseExpansion: baseExpansionModule.baseExpansion,

  // 深海生態擴充包
  deepSeaExpansion: deepSeaExpansionModule.deepSeaExpansion,
  DEEP_SEA_TRAIT_TYPES: deepSeaExpansionModule.DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS: deepSeaExpansionModule.DEEP_SEA_TRAIT_DEFINITIONS,
};
