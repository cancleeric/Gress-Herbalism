# 工作單 0318

## 編號
0318

## 日期
2026-02-01

## 工作單標題
重構性狀定義結構

## 工單主旨
演化論第二階段 - 可擴展架構（P2-A）

## 關聯計畫書
`docs/演化論/PLAN_EVOLUTION_PHASE2_ARCHITECTURE.md`

## 優先級
P0

## 內容

### 目標
將現有硬編碼的性狀定義（`shared/constants/evolution.js`）重構為可註冊的模組化結構，支援擴充包動態新增性狀。

### 現況分析

**現有結構（需保留以向後相容）**：
```javascript
// shared/constants/evolution.js
const TRAIT_TYPES = {
  CARNIVORE: 'carnivore',
  SCAVENGER: 'scavenger',
  // ... 19 種性狀
};

const TRAIT_DEFINITIONS = {
  carnivore: { name: '肉食', foodBonus: 1, ... },
  scavenger: { name: '腐食', foodBonus: 0, ... },
  // ...
};
```

**目標結構**：
```javascript
// shared/expansions/base/traits/definitions.js
const TRAIT_DEFINITIONS = {
  carnivore: {
    type: 'carnivore',
    name: '肉食',
    nameEn: 'Carnivore',
    foodBonus: 1,
    description: '不能吃現有食物，必須攻擊其他生物獲得食物',
    category: 'carnivore',
    incompatible: ['scavenger'],
    isInteractive: false,
    isStackable: false,
    // 新增：擴充包來源
    expansion: 'base',
    // 新增：圖示資源
    icon: 'carnivore.svg',
    // 新增：卡牌數量
    cardCount: 4,
  },
  // ...
};
```

### 詳細需求

#### 1. 建立基礎版性狀定義

**檔案**：`shared/expansions/base/traits/definitions.js`

```javascript
/**
 * 基礎版性狀定義
 * Evolution: The Origin of Species
 */

// === 性狀類別 ===
const TRAIT_CATEGORIES = {
  CARNIVORE: 'carnivore',   // 肉食相關
  DEFENSE: 'defense',       // 防禦相關
  FEEDING: 'feeding',       // 進食相關
  INTERACTIVE: 'interactive', // 互動相關
  SPECIAL: 'special',       // 特殊能力
};

// === 性狀類型常數 ===
const TRAIT_TYPES = {
  // 肉食相關
  CARNIVORE: 'carnivore',
  SCAVENGER: 'scavenger',
  SHARP_VISION: 'sharpVision',

  // 防禦相關
  CAMOUFLAGE: 'camouflage',
  BURROWING: 'burrowing',
  POISONOUS: 'poisonous',
  AQUATIC: 'aquatic',
  AGILE: 'agile',
  MASSIVE: 'massive',
  TAIL_LOSS: 'tailLoss',
  MIMICRY: 'mimicry',

  // 進食相關
  FAT_TISSUE: 'fatTissue',
  HIBERNATION: 'hibernation',
  PARASITE: 'parasite',
  ROBBERY: 'robbery',

  // 互動相關
  COMMUNICATION: 'communication',
  COOPERATION: 'cooperation',
  SYMBIOSIS: 'symbiosis',

  // 特殊能力
  TRAMPLING: 'trampling',
};

// === 詳細性狀定義 ===
const TRAIT_DEFINITIONS = {
  // ==================== 肉食相關 ====================
  [TRAIT_TYPES.CARNIVORE]: {
    type: TRAIT_TYPES.CARNIVORE,
    name: '肉食',
    nameEn: 'Carnivore',
    foodBonus: 1,
    description: '不能吃現有食物，必須攻擊其他生物。攻擊成功獲得 2 個藍色食物，被攻擊者滅絕',
    category: TRAIT_CATEGORIES.CARNIVORE,
    incompatible: [TRAIT_TYPES.SCAVENGER],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'carnivore.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.SCAVENGER]: {
    type: TRAIT_TYPES.SCAVENGER,
    name: '腐食',
    nameEn: 'Scavenger',
    foodBonus: 0,
    description: '當任何生物被肉食攻擊滅絕時，獲得 1 個藍色食物。不能與肉食同時擁有',
    category: TRAIT_CATEGORIES.CARNIVORE,
    incompatible: [TRAIT_TYPES.CARNIVORE],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'scavenger.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.SHARP_VISION]: {
    type: TRAIT_TYPES.SHARP_VISION,
    name: '銳目',
    nameEn: 'Sharp Vision',
    foodBonus: 0,
    description: '只有銳目動物可以獵食具有偽裝性狀的生物',
    category: TRAIT_CATEGORIES.CARNIVORE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'sharp-vision.svg',
    cardCount: 4,
  },

  // ==================== 防禦相關 ====================
  [TRAIT_TYPES.CAMOUFLAGE]: {
    type: TRAIT_TYPES.CAMOUFLAGE,
    name: '偽裝',
    nameEn: 'Camouflage',
    foodBonus: 0,
    description: '肉食生物必須擁有銳目性狀才能攻擊此生物',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'camouflage.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.BURROWING]: {
    type: TRAIT_TYPES.BURROWING,
    name: '穴居',
    nameEn: 'Burrowing',
    foodBonus: 0,
    description: '當此生物吃飽時，無法被攻擊',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'burrowing.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.POISONOUS]: {
    type: TRAIT_TYPES.POISONOUS,
    name: '毒液',
    nameEn: 'Poisonous',
    foodBonus: 0,
    description: '被攻擊滅絕時，攻擊者也會在滅絕階段死亡',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'poisonous.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.AQUATIC]: {
    type: TRAIT_TYPES.AQUATIC,
    name: '水生',
    nameEn: 'Aquatic',
    foodBonus: 0,
    description: '只有同樣擁有水生的肉食生物才能攻擊此生物，有水生的肉食也無法攻擊無水生的生物',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'aquatic.svg',
    cardCount: 8,
  },

  [TRAIT_TYPES.AGILE]: {
    type: TRAIT_TYPES.AGILE,
    name: '敏捷',
    nameEn: 'Agile',
    foodBonus: 0,
    description: '被攻擊時擲骰，4-6 逃脫成功，1-3 逃脫失敗',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'agile.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.MASSIVE]: {
    type: TRAIT_TYPES.MASSIVE,
    name: '巨化',
    nameEn: 'Massive',
    foodBonus: 1,
    description: '只有同樣擁有巨化的肉食生物才能攻擊此生物，有巨化也可以獵食沒有巨化的生物',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'massive.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.TAIL_LOSS]: {
    type: TRAIT_TYPES.TAIL_LOSS,
    name: '斷尾',
    nameEn: 'Tail Loss',
    foodBonus: 0,
    description: '被攻擊時可棄置 1 張性狀卡來取消攻擊，攻擊者獲得 1 個藍色食物',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'tail-loss.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.MIMICRY]: {
    type: TRAIT_TYPES.MIMICRY,
    name: '擬態',
    nameEn: 'Mimicry',
    foodBonus: 0,
    description: '每回合可使用一次，被攻擊時可將攻擊轉移給自己另一隻一定可以被獵食的生物',
    category: TRAIT_CATEGORIES.DEFENSE,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'mimicry.svg',
    cardCount: 4,
  },

  // ==================== 進食相關 ====================
  [TRAIT_TYPES.FAT_TISSUE]: {
    type: TRAIT_TYPES.FAT_TISSUE,
    name: '脂肪組織',
    nameEn: 'Fat Tissue',
    foodBonus: 0,
    description: '吃飽後可繼續獲得食物，儲存為黃色脂肪標記（每張卡儲存 1 個）。可在進食階段消耗脂肪滿足食量',
    category: TRAIT_CATEGORIES.FEEDING,
    incompatible: [],
    isInteractive: false,
    isStackable: true,  // 可疊加
    expansion: 'base',
    icon: 'fat-tissue.svg',
    cardCount: 8,
  },

  [TRAIT_TYPES.HIBERNATION]: {
    type: TRAIT_TYPES.HIBERNATION,
    name: '冬眠',
    nameEn: 'Hibernation',
    foodBonus: 0,
    description: '可跳過整個進食階段視為吃飽。使用後橫置至下回合。最後一回合不能使用',
    category: TRAIT_CATEGORIES.FEEDING,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'hibernation.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.PARASITE]: {
    type: TRAIT_TYPES.PARASITE,
    name: '寄生蟲',
    nameEn: 'Parasite',
    foodBonus: 2,
    description: '只能放在對手的生物上，增加該生物的食量需求',
    category: TRAIT_CATEGORIES.FEEDING,
    incompatible: [],
    isInteractive: false,
    isStackable: true,  // 可疊加（多個寄生蟲）
    isParasite: true,   // 特殊標記：必須放在對手生物上
    expansion: 'base',
    icon: 'parasite.svg',
    cardCount: 8,
  },

  [TRAIT_TYPES.ROBBERY]: {
    type: TRAIT_TYPES.ROBBERY,
    name: '掠奪',
    nameEn: 'Robbery',
    foodBonus: 0,
    description: '可偷取其他未吃飽生物身上的 1 個食物，每階段限用一次',
    category: TRAIT_CATEGORIES.FEEDING,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'robbery.svg',
    cardCount: 4,
  },

  // ==================== 互動相關 ====================
  [TRAIT_TYPES.COMMUNICATION]: {
    type: TRAIT_TYPES.COMMUNICATION,
    name: '溝通',
    nameEn: 'Communication',
    foodBonus: 0,
    description: '當其中一隻生物拿取紅色食物時，另一隻也從中央拿取 1 個紅色食物。會連鎖觸發',
    category: TRAIT_CATEGORIES.INTERACTIVE,
    incompatible: [],
    isInteractive: true,  // 互動性狀
    isStackable: false,
    expansion: 'base',
    icon: 'communication.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.COOPERATION]: {
    type: TRAIT_TYPES.COOPERATION,
    name: '合作',
    nameEn: 'Cooperation',
    foodBonus: 0,
    description: '當其中一隻生物獲得紅/藍食物時，另一隻獲得 1 個藍色食物。會連鎖觸發',
    category: TRAIT_CATEGORIES.INTERACTIVE,
    incompatible: [],
    isInteractive: true,
    isStackable: false,
    expansion: 'base',
    icon: 'cooperation.svg',
    cardCount: 4,
  },

  [TRAIT_TYPES.SYMBIOSIS]: {
    type: TRAIT_TYPES.SYMBIOSIS,
    name: '共生',
    nameEn: 'Symbiosis',
    foodBonus: 0,
    description: '指定代表動物與被保護者。代表吃飽前被保護者不能獲得食物。肉食只能攻擊代表',
    category: TRAIT_CATEGORIES.INTERACTIVE,
    incompatible: [],
    isInteractive: true,
    isStackable: false,
    hasRepresentative: true,  // 需要指定代表
    expansion: 'base',
    icon: 'symbiosis.svg',
    cardCount: 4,
  },

  // ==================== 特殊能力 ====================
  [TRAIT_TYPES.TRAMPLING]: {
    type: TRAIT_TYPES.TRAMPLING,
    name: '踐踏',
    nameEn: 'Trampling',
    foodBonus: 0,
    description: '進食階段輪到自己時，可將桌面一個現有食物移除',
    category: TRAIT_CATEGORIES.SPECIAL,
    incompatible: [],
    isInteractive: false,
    isStackable: false,
    expansion: 'base',
    icon: 'trampling.svg',
    cardCount: 4,
  },
};

module.exports = {
  TRAIT_CATEGORIES,
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
};
```

#### 2. 建立卡牌定義

**檔案**：`shared/expansions/base/cards.js`

```javascript
/**
 * 基礎版卡牌定義
 * 84 張雙面卡
 */

const { TRAIT_TYPES, TRAIT_DEFINITIONS } = require('./traits/definitions');

/**
 * 從性狀定義生成卡牌列表
 */
function generateCards() {
  const cards = [];

  for (const [traitType, definition] of Object.entries(TRAIT_DEFINITIONS)) {
    // 根據 cardCount 生成卡牌
    for (let i = 0; i < definition.cardCount; i++) {
      cards.push({
        traitType,
        traitName: definition.name,
        traitNameEn: definition.nameEn,
        foodBonus: definition.foodBonus,
        category: definition.category,
        expansion: definition.expansion,
      });
    }
  }

  return cards;
}

const BASE_CARDS = generateCards();

// 驗證總數
console.assert(BASE_CARDS.length === 84, `Expected 84 cards, got ${BASE_CARDS.length}`);

module.exports = {
  BASE_CARDS,
  generateCards,
};
```

#### 3. 建立相容層

**檔案**：`shared/constants/evolution.js`（修改）

```javascript
/**
 * 演化論遊戲常數
 *
 * 注意：此檔案保留以向後相容
 * 新代碼應使用 shared/expansions/base/ 下的模組
 */

// 從新模組匯入
const {
  TRAIT_CATEGORIES,
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
} = require('../expansions/base/traits/definitions');

// 保持原有的匯出（向後相容）
// ... 原有的其他常數 ...

module.exports = {
  // 保持原有匯出
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
  TRAIT_CATEGORIES,

  // 原有的其他匯出保持不變
  // ...
};
```

### 驗收標準

- [ ] 新的性狀定義結構完整
- [ ] 所有 19 種基礎版性狀已定義
- [ ] 卡牌總數為 84 張
- [ ] 向後相容層正常運作
- [ ] 現有測試全部通過
- [ ] 有 JSDoc 註解

### 相關檔案

**新增檔案**：
- `shared/expansions/base/traits/definitions.js`
- `shared/expansions/base/traits/index.js`
- `shared/expansions/base/cards.js`
- `shared/expansions/base/index.js`

**修改檔案**：
- `shared/constants/evolution.js`（新增相容層）

### 依賴工單
- 0317（擴充包註冊系統）

### 被依賴工單
- 0319（性狀處理器介面）
- 0320（基礎版性狀處理器）
