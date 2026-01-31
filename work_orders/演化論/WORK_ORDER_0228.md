# 工作單 0228

## 編號
0228

## 日期
2026-01-31

## 工作單標題
建立演化論常數定義

## 工單主旨
建立演化論遊戲的共用常數檔案 `shared/constants/evolution.js`，定義所有遊戲基本常數、階段、食物類型、性狀類型、計分規則等

## 內容

### 任務描述

建立演化論遊戲的核心常數定義檔案，供前後端共用。

### 常數定義項目

#### 1. 遊戲基本常數
```javascript
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const INITIAL_HAND_SIZE = 6;
const TOTAL_CARDS = 84;
```

#### 2. 遊戲階段
```javascript
const GAME_PHASES = {
  WAITING: 'waiting',
  EVOLUTION: 'evolution',
  FOOD_SUPPLY: 'foodSupply',
  FEEDING: 'feeding',
  EXTINCTION: 'extinction',
  GAME_END: 'gameEnd'
};
```

#### 3. 食物類型
```javascript
const FOOD_TYPES = {
  RED: 'red',       // 現有食物
  BLUE: 'blue',     // 額外食物
  YELLOW: 'yellow'  // 脂肪儲存
};
```

#### 4. 食物數量計算公式
```javascript
const FOOD_FORMULA = {
  2: { dice: 1, bonus: 2 },   // 1顆骰子 + 2
  3: { dice: 2, bonus: 0 },   // 2顆骰子總和
  4: { dice: 2, bonus: 2 }    // 2顆骰子總和 + 2
};
```

#### 5. 性狀類型（19 種）
```javascript
const TRAIT_TYPES = {
  // 肉食相關 (3)
  CARNIVORE: 'carnivore',
  SCAVENGER: 'scavenger',
  SHARP_VISION: 'sharpVision',

  // 防禦相關 (8)
  CAMOUFLAGE: 'camouflage',
  BURROWING: 'burrowing',
  POISONOUS: 'poisonous',
  AQUATIC: 'aquatic',
  AGILE: 'agile',
  MASSIVE: 'massive',
  TAIL_LOSS: 'tailLoss',
  MIMICRY: 'mimicry',

  // 進食相關 (4)
  FAT_TISSUE: 'fatTissue',
  HIBERNATION: 'hibernation',
  PARASITE: 'parasite',
  ROBBERY: 'robbery',

  // 互動相關 (3)
  COMMUNICATION: 'communication',
  COOPERATION: 'cooperation',
  SYMBIOSIS: 'symbiosis',

  // 特殊能力 (1)
  TRAMPLING: 'trampling'
};
```

#### 6. 計分常數
```javascript
const SCORING = {
  CREATURE_BASE: 2,     // 每隻存活生物 +2 分
  TRAIT_BASE: 1,        // 每張性狀卡 +1 分
  FOOD_BONUS_1: 1,      // +1 性狀額外加分
  FOOD_BONUS_2: 2       // +2 性狀額外加分
};
```

#### 7. 動作類型
```javascript
const ACTION_TYPES = {
  CREATE_CREATURE: 'createCreature',
  ADD_TRAIT: 'addTrait',
  PASS: 'pass',
  FEED: 'feed',
  ATTACK: 'attack',
  USE_TRAIT: 'useTrait',
  USE_FAT: 'useFat'
};
```

### 前置條件
- 無

### 驗收標準
- [ ] `shared/constants/evolution.js` 檔案已建立
- [ ] 所有常數皆有 JSDoc 註解說明
- [ ] 檔案可被前後端正確 import
- [ ] 常數命名遵循專案規範（大寫底線）

### 相關檔案
- `shared/constants/evolution.js` — 新建
- `shared/constants.js` — 參考（本草遊戲常數格式）

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.4 節
