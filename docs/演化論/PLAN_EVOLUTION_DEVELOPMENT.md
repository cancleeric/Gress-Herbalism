# 演化論遊戲開發計畫書

## 文件資訊

| 項目 | 內容 |
|------|------|
| 文件名稱 | 演化論（Evolution: The Origin of Species）遊戲開發計畫書 |
| 版本 | 1.1 |
| 建立日期 | 2026-01-31 |
| 負責人 | Claude Code |
| 狀態 | 規劃完成 |

---

## 一、專案概述

### 1.1 專案背景

本專案旨在將現有的「本草 Herbalism」單一遊戲平台擴展為支援多款遊戲的平台。經過工單 0214-0227 的資料夾結構重組後，專案已具備模組化架構，可以容納新遊戲的開發。

### 1.2 專案目標

開發「演化論：物種起源」（Evolution: The Origin of Species）網頁版遊戲，使其成為平台的第二款遊戲。遊戲需支援：
- 2-4 人即時對戰
- 線上多人模式
- 遊戲數據統計與排行榜

### 1.3 遊戲簡介

《演化論：物種起源》是一款 2-4 人策略卡牌遊戲。玩家扮演造物主，創造生物並賦予性狀能力，在弱肉強食的世界中競爭有限的食物資源，讓自己的生物存活下來。

**核心機制：**
- 雙面卡牌系統（一面為生物、一面為性狀）
- 四階段回合制（演化 → 食物供給 → 進食 → 滅絕與抽牌）
- 肉食與防禦的攻防互動
- 互動性狀的連鎖效應

---

## 二、需求分析

### 2.1 功能需求

#### 2.1.1 核心遊戲功能

| 功能編號 | 功能名稱 | 優先級 | 說明 |
|---------|---------|--------|------|
| F001 | 遊戲房間系統 | P0 | 創建/加入演化論遊戲房間 |
| F002 | 玩家管理 | P0 | 2-4 人遊戲，支援中途加入觀戰 |
| F003 | 牌庫系統 | P0 | 84 張雙面卡牌管理 |
| F004 | 演化階段 | P0 | 創造生物、賦予性狀、跳過 |
| F005 | 食物供給階段 | P0 | 擲骰決定食物數量 |
| F006 | 進食階段 | P0 | 一般進食、肉食攻擊、性狀能力觸發 |
| F007 | 滅絕與抽牌階段 | P0 | 判定滅絕、清理食物、抽牌 |
| F008 | 計分系統 | P0 | 遊戲結束時計算分數 |
| F009 | 遊戲結束判定 | P0 | 牌庫耗盡後最後一回合 |

#### 2.1.2 性狀系統功能

| 功能編號 | 性狀類別 | 性狀數量 | 優先級 | 說明 |
|---------|---------|---------|--------|------|
| F010 | 肉食相關 | 3 | P0 | 肉食、腐食、銳目 |
| F011 | 防禦相關 | 8 | P0 | 偽裝、穴居、毒液、水生、敏捷、巨化、斷尾、擬態 |
| F012 | 進食相關 | 4 | P0 | 脂肪組織、冬眠、寄生蟲、掠奪 |
| F013 | 互動相關 | 3 | P1 | 溝通、合作、共生 |
| F014 | 特殊能力 | 1 | P1 | 踐踏 |

#### 2.1.3 平台整合功能

| 功能編號 | 功能名稱 | 優先級 | 說明 |
|---------|---------|--------|------|
| F015 | 遊戲選擇器 | P0 | 大廳頁面選擇本草/演化論 |
| F016 | 統一房間列表 | P1 | 分頁或篩選顯示不同遊戲的房間 |
| F017 | 數據統計 | P1 | 演化論遊戲紀錄與統計 |
| F018 | 排行榜整合 | P1 | 演化論專屬排行榜 |

### 2.2 非功能需求

| 需求編號 | 類別 | 說明 |
|---------|------|------|
| NF001 | 效能 | 回合切換延遲 < 500ms |
| NF002 | 可擴展性 | 支援未來新增性狀卡 |
| NF003 | 響應式設計 | 支援桌面與行動裝置 |
| NF004 | 即時同步 | 所有玩家畫面同步更新 |
| NF005 | 斷線重連 | 支援玩家斷線後重新加入 |

---

## 三、技術架構

### 3.1 整體架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (React 18)                          │
├─────────────────────────────────────────────────────────────────┤
│  components/                                                     │
│  ├── common/          ← 共用組件（登入、大廳、好友等）            │
│  └── games/                                                      │
│      ├── herbalism/   ← 本草遊戲組件（已完成）                   │
│      └── evolution/   ← 演化論遊戲組件（待開發）                 │
│                                                                  │
│  store/                                                          │
│  ├── gameStore.js     ← 共用遊戲狀態                             │
│  └── evolution/       ← 演化論專屬狀態（待開發）                 │
├─────────────────────────────────────────────────────────────────┤
│                     Socket.io 即時通訊                           │
├─────────────────────────────────────────────────────────────────┤
│                        後端 (Node.js)                            │
├─────────────────────────────────────────────────────────────────┤
│  logic/                                                          │
│  ├── herbalism/       ← 本草遊戲邏輯（已完成）                   │
│  └── evolution/       ← 演化論遊戲邏輯（待開發）                 │
│                                                                  │
│  services/            ← 共用服務（好友、邀請、存在狀態）          │
├─────────────────────────────────────────────────────────────────┤
│                      Supabase 資料庫                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 前端組件規劃

```
frontend/src/components/games/evolution/
├── EvolutionRoom/              # 遊戲房間主組件
│   ├── EvolutionRoom.js
│   ├── EvolutionRoom.css
│   ├── EvolutionRoom.test.js
│   └── index.js
│
├── GameBoard/                  # 遊戲桌面（中央食物區、玩家區域）
│   ├── GameBoard.js
│   ├── GameBoard.css
│   └── index.js
│
├── CreatureCard/               # 生物卡片組件
│   ├── CreatureCard.js
│   ├── CreatureCard.css
│   └── index.js
│
├── TraitCard/                  # 性狀卡片組件
│   ├── TraitCard.js
│   ├── TraitCard.css
│   └── index.js
│
├── PlayerArea/                 # 玩家區域（生物群、手牌）
│   ├── PlayerArea.js
│   ├── PlayerArea.css
│   └── index.js
│
├── HandCards/                  # 手牌區域
│   ├── HandCards.js
│   ├── HandCards.css
│   └── index.js
│
├── FoodPool/                   # 食物池組件
│   ├── FoodPool.js
│   ├── FoodPool.css
│   └── index.js
│
├── DiceRoller/                 # 擲骰組件
│   ├── DiceRoller.js
│   ├── DiceRoller.css
│   └── index.js
│
├── PhaseIndicator/             # 階段指示器
│   ├── PhaseIndicator.js
│   ├── PhaseIndicator.css
│   └── index.js
│
├── AttackResolver/             # 攻擊判定組件
│   ├── AttackResolver.js
│   ├── AttackResolver.css
│   └── index.js
│
├── TraitSelector/              # 性狀選擇器（雙面卡選擇）
│   ├── TraitSelector.js
│   ├── TraitSelector.css
│   └── index.js
│
├── InteractionLink/            # 互動性狀連結顯示
│   ├── InteractionLink.js
│   ├── InteractionLink.css
│   └── index.js
│
├── ScoreBoard/                 # 計分板
│   ├── ScoreBoard.js
│   ├── ScoreBoard.css
│   └── index.js
│
├── GameLog/                    # 遊戲日誌
│   ├── GameLog.js
│   ├── GameLog.css
│   └── index.js
│
├── TurnTimer/                  # 回合計時器
│   ├── TurnTimer.js
│   ├── TurnTimer.css
│   └── index.js
│
└── index.js                    # 統一匯出
```

### 3.3 後端邏輯規劃

```
backend/logic/evolution/
├── cardLogic.js                # 卡牌邏輯
│   ├── createDeck()            # 建立 84 張卡牌
│   ├── shuffleDeck()           # 洗牌
│   ├── drawCards()             # 抽牌
│   ├── getTraitInfo()          # 取得性狀資訊
│   └── validateTraitPlacement() # 驗證性狀放置
│
├── creatureLogic.js            # 生物邏輯
│   ├── createCreature()        # 創造生物
│   ├── addTrait()              # 賦予性狀
│   ├── removeTrait()           # 移除性狀（斷尾）
│   ├── calculateFoodNeed()     # 計算食量需求
│   ├── canBeAttacked()         # 判定是否可被攻擊
│   └── checkExtinction()       # 判定滅絕
│
├── feedingLogic.js             # 進食邏輯
│   ├── feedCreature()          # 餵食生物
│   ├── attackCreature()        # 肉食攻擊
│   ├── resolveAttack()         # 解析攻擊結果
│   ├── triggerScavenger()      # 觸發腐食
│   ├── processCommunication()  # 處理溝通連鎖
│   ├── processCooperation()    # 處理合作連鎖
│   └── checkSymbiosis()        # 檢查共生限制
│
├── traitLogic.js               # 性狀邏輯
│   ├── canUseTrait()           # 判定性狀是否可使用
│   ├── useFatTissue()          # 使用脂肪組織
│   ├── useHibernation()        # 使用冬眠
│   ├── useMimicry()            # 使用擬態
│   ├── useTailLoss()           # 使用斷尾
│   ├── useRobbery()            # 使用掠奪
│   └── useTrampling()          # 使用踐踏
│
├── phaseLogic.js               # 階段邏輯
│   ├── startEvolutionPhase()   # 開始演化階段
│   ├── startFoodPhase()        # 開始食物供給階段
│   ├── rollDice()              # 擲骰
│   ├── startFeedingPhase()     # 開始進食階段
│   ├── startExtinctionPhase()  # 開始滅絕階段
│   └── checkGameEnd()          # 檢查遊戲結束
│
├── scoreLogic.js               # 計分邏輯
│   ├── calculateScore()        # 計算玩家分數
│   ├── compareScores()         # 比較分數（平手判定）
│   └── determineWinner()       # 決定勝者
│
├── gameLogic.js                # 遊戲主邏輯
│   ├── initGame()              # 初始化遊戲
│   ├── processAction()         # 處理玩家動作
│   ├── getGameState()          # 取得遊戲狀態
│   ├── validateAction()        # 驗證動作合法性
│   └── advancePhase()          # 推進階段
│
└── index.js                    # 統一匯出
```

### 3.4 共用常數規劃

```javascript
// shared/constants/evolution.js

// ==================== 遊戲基本常數 ====================
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const INITIAL_HAND_SIZE = 6;
const TOTAL_CARDS = 84;

// ==================== 遊戲階段 ====================
const GAME_PHASES = {
  WAITING: 'waiting',
  EVOLUTION: 'evolution',
  FOOD_SUPPLY: 'foodSupply',
  FEEDING: 'feeding',
  EXTINCTION: 'extinction',
  GAME_END: 'gameEnd'
};

// ==================== 食物類型 ====================
const FOOD_TYPES = {
  RED: 'red',       // 現有食物
  BLUE: 'blue',     // 額外食物
  YELLOW: 'yellow'  // 脂肪儲存
};

// ==================== 食物數量計算 ====================
const FOOD_FORMULA = {
  2: { dice: 1, bonus: 2 },   // 1顆骰子 + 2
  3: { dice: 2, bonus: 0 },   // 2顆骰子總和
  4: { dice: 2, bonus: 2 }    // 2顆骰子總和 + 2
};

// ==================== 性狀類型 ====================
const TRAIT_TYPES = {
  // 肉食相關
  CARNIVORE: 'carnivore',         // 肉食
  SCAVENGER: 'scavenger',         // 腐食
  SHARP_VISION: 'sharpVision',    // 銳目

  // 防禦相關
  CAMOUFLAGE: 'camouflage',       // 偽裝
  BURROWING: 'burrowing',         // 穴居
  POISONOUS: 'poisonous',         // 毒液
  AQUATIC: 'aquatic',             // 水生
  AGILE: 'agile',                 // 敏捷
  MASSIVE: 'massive',             // 巨化
  TAIL_LOSS: 'tailLoss',          // 斷尾
  MIMICRY: 'mimicry',             // 擬態

  // 進食相關
  FAT_TISSUE: 'fatTissue',        // 脂肪組織
  HIBERNATION: 'hibernation',     // 冬眠
  PARASITE: 'parasite',           // 寄生蟲
  ROBBERY: 'robbery',             // 掠奪

  // 互動相關
  COMMUNICATION: 'communication', // 溝通
  COOPERATION: 'cooperation',     // 合作
  SYMBIOSIS: 'symbiosis',         // 共生

  // 特殊能力
  TRAMPLING: 'trampling'          // 踐踏
};

// ==================== 性狀詳細定義 ====================
const TRAIT_DEFINITIONS = {
  [TRAIT_TYPES.CARNIVORE]: {
    name: '肉食',
    foodBonus: 1,
    description: '不能吃現有食物，必須攻擊其他生物',
    incompatible: [TRAIT_TYPES.SCAVENGER]
  },
  [TRAIT_TYPES.SCAVENGER]: {
    name: '腐食',
    foodBonus: 0,
    description: '當任何生物被肉食攻擊滅絕時獲得食物',
    incompatible: [TRAIT_TYPES.CARNIVORE]
  },
  // ... 其他性狀定義
};

// ==================== 計分常數 ====================
const SCORING = {
  CREATURE_BASE: 2,     // 每隻存活生物 +2 分
  TRAIT_BASE: 1,        // 每張性狀卡 +1 分
  FOOD_BONUS_1: 1,      // +1 性狀額外加分
  FOOD_BONUS_2: 2       // +2 性狀額外加分
};

// ==================== 動作類型 ====================
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

### 3.5 資料庫 Schema 規劃

```sql
-- 演化論遊戲紀錄表
CREATE TABLE evolution_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR(50) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  rounds_played INTEGER DEFAULT 0,
  winner_id UUID REFERENCES players(id),
  game_data JSONB,  -- 完整遊戲資料快照
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 演化論遊戲參與者表
CREATE TABLE evolution_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES evolution_games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  final_score INTEGER DEFAULT 0,
  creatures_survived INTEGER DEFAULT 0,
  traits_count INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 演化論玩家統計表
CREATE TABLE evolution_player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) UNIQUE,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  total_creatures INTEGER DEFAULT 0,
  total_traits INTEGER DEFAULT 0,
  favorite_trait VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 四、遊戲狀態設計

### 4.1 遊戲狀態結構

```javascript
const gameState = {
  // 基本資訊
  gameId: 'evo_xxxx',
  gameType: 'evolution',
  phase: 'evolution',
  round: 1,
  isLastRound: false,

  // 玩家資訊
  players: [
    {
      id: 'player_1',
      name: '玩家1',
      isAI: false,
      isStartPlayer: true,
      hand: [/* 手牌 */],
      creatures: [/* 生物列表 */],
      discardPile: [/* 棄牌堆 */]
    }
  ],

  // 牌庫
  deck: [/* 剩餘牌庫 */],
  deckCount: 60,

  // 食物池
  foodPool: {
    red: 8,
    blue: 0
  },

  // 回合控制
  currentPlayerIndex: 0,
  passedPlayers: [],

  // 攻擊狀態（進食階段）
  pendingAttack: null,

  // 歷史紀錄
  actionLog: []
};

// 生物結構
const creature = {
  id: 'creature_1',
  ownerId: 'player_1',
  traits: [/* 性狀列表 */],
  food: {
    red: 1,
    blue: 0,
    yellow: 0  // 脂肪
  },
  foodNeeded: 2,  // 計算後的食量需求
  isFed: false,
  hibernating: false,
  interactionLinks: [/* 互動性狀連結 */]
};

// 性狀結構
const trait = {
  id: 'trait_1',
  type: 'carnivore',
  cardId: 'card_15',
  isUsedThisTurn: false,
  // 互動性狀專用
  linkedCreatureId: null,
  isRepresentative: null  // 共生專用
};

// 互動連結結構
const interactionLink = {
  type: 'cooperation',
  creature1Id: 'creature_1',
  creature2Id: 'creature_2',
  traitCardId: 'card_20'
};
```

### 4.2 Socket 事件設計

```javascript
// ==================== 客戶端 → 伺服器 ====================

// 遊戲房間
'evo:createRoom'     // 創建演化論房間
'evo:joinRoom'       // 加入房間
'evo:leaveRoom'      // 離開房間
'evo:startGame'      // 開始遊戲

// 演化階段
'evo:createCreature' // 創造生物
'evo:addTrait'       // 賦予性狀
'evo:selectTrait'    // 選擇雙面卡的性狀
'evo:passEvolution'  // 跳過演化

// 進食階段
'evo:feedCreature'   // 餵食生物
'evo:attack'         // 發動攻擊
'evo:respondAttack'  // 回應攻擊（斷尾、擬態、敏捷骰子）
'evo:useTrait'       // 使用性狀能力
'evo:passFeed'       // 跳過進食

// ==================== 伺服器 → 客戶端 ====================

// 遊戲狀態
'evo:gameState'      // 完整遊戲狀態
'evo:phaseChange'    // 階段變更
'evo:turnChange'     // 回合變更

// 事件通知
'evo:creatureCreated'  // 生物被創造
'evo:traitAdded'       // 性狀被賦予
'evo:creatureFed'      // 生物被餵食
'evo:attackStarted'    // 攻擊開始
'evo:attackResolved'   // 攻擊結算
'evo:creatureExtinct'  // 生物滅絕
'evo:diceRolled'       // 擲骰結果
'evo:foodPoolUpdated'  // 食物池更新
'evo:chainTriggered'   // 連鎖效應觸發

// 遊戲結束
'evo:gameEnd'          // 遊戲結束
'evo:scoreCalculated'  // 分數計算
```

---

## 五、UI/UX 設計規劃

### 5.1 畫面佈局

```
┌─────────────────────────────────────────────────────────────────┐
│  階段指示器  [演化] [食物供給] [進食] [滅絕]     回合: 3/最後   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────┐ │
│  │   對手區域 1     │  │   中央食物池       │  │  對手區域 2  │ │
│  │  [生物][生物]    │  │   🔴 x 8          │  │  [生物]      │ │
│  │  手牌: 4         │  │   牌庫: 45        │  │  手牌: 3     │ │
│  └──────────────────┘  └───────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                       對手區域 3                            ││
│  │                    [生物][生物][生物]                       ││
│  │                       手牌: 5                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                       我的區域                              ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                       ││
│  │  │ 🦎生物1 │ │ 🦎生物2 │ │ 🦎生物3 │  [+ 創造生物]        ││
│  │  │ 肉食+1  │ │ 偽裝    │ │ 脂肪    │                       ││
│  │  │ 銳目    │ │ 穴居    │ │ 🔴🔴   │                       ││
│  │  │ 🔴🔴🔵 │ │ 🔴     │ │ 🟡🟡   │                       ││
│  │  └─────────┘ └─────────┘ └─────────┘                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  我的手牌 (6)                                               ││
│  │  [卡1] [卡2] [卡3] [卡4] [卡5] [卡6]                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌───────────────────────────────┐  ┌────────────────────────┐ │
│  │  遊戲日誌                      │  │  動作按鈕              │ │
│  │  > 玩家1 創造了一隻生物        │  │  [跳過] [確認]         │ │
│  │  > 玩家2 賦予 肉食 性狀        │  └────────────────────────┘ │
│  └───────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 卡牌設計

```
┌───────────────────┐
│  +1        🔄     │  ← 食量加成 / 雙面卡指示
│                   │
│     ┌─────┐       │
│     │ 🦎  │       │  ← 蜥蜴面（生物）
│     └─────┘       │
│                   │
│   ───翻轉───      │
│                   │
│     肉 食          │  ← 性狀面
│   CARNIVORE       │
│                   │
│  必須攻擊其他     │
│  生物獲得食物     │
│                   │
└───────────────────┘
```

### 5.3 互動性狀視覺化

```
┌─────────┐         ┌─────────┐
│ 生物 A  │─合作───│ 生物 B  │
│  🔴🔵  │         │  🔵🔵  │
└─────────┘         └─────────┘
     │
   共生
     │
     ▼
┌─────────┐
│ 生物 C  │
│ (被保護)│
└─────────┘
```

---

## 六、測試策略（原第七節）

> **注意**：本版本不包含 AI 系統與單人模式

## ~~六、AI 系統設計~~（已移除）

### 6.1 AI 難度分級

| 難度 | 名稱 | 策略描述 |
|-----|------|---------|
| Easy | 新手 | 隨機出牌、基本進食、不主動攻擊 |
| Medium | 普通 | 基礎策略、會判斷攻擊時機、簡單防禦 |
| Hard | 困難 | 進階策略、連鎖計算、優化食物分配 |
| Expert | 專家 | 最優策略、預測對手、長期規劃 |

### 6.2 AI 策略模組

```javascript
// frontend/src/ai/evolution/

├── strategies/
│   ├── evolutionStrategy.js    # 演化階段策略
│   │   ├── decideCreateOrTrait()
│   │   ├── chooseBestTrait()
│   │   └── evaluateCreatureValue()
│   │
│   ├── feedingStrategy.js      # 進食階段策略
│   │   ├── decideFeedOrder()
│   │   ├── evaluateAttackTarget()
│   │   ├── shouldUseTrait()
│   │   └── calculateRisk()
│   │
│   └── attackStrategy.js       # 攻擊策略
│       ├── findVulnerableTargets()
│       ├── assessDefenses()
│       └── predictCounterAttack()
│
├── evaluators/
│   ├── boardEvaluator.js       # 場面評估
│   ├── threatEvaluator.js      # 威脅評估
│   └── scoreProjector.js       # 分數預測
│
└── index.js
```

### 6.3 AI 決策流程

```
┌─────────────────┐
│   取得遊戲狀態   │
└────────┬────────┘
         ▼
┌─────────────────┐
│   評估場面優勢   │
└────────┬────────┘
         ▼
┌─────────────────┐
│   根據階段選策略 │
├─────────────────┤
│ 演化 → 出牌策略  │
│ 進食 → 進食策略  │
│ 攻擊 → 攻擊策略  │
└────────┬────────┘
         ▼
┌─────────────────┐
│   計算各選項價值 │
└────────┬────────┘
         ▼
┌─────────────────┐
│  加入隨機因子   │
│  (依難度調整)   │
└────────┬────────┘
         ▼
┌─────────────────┐
│   執行最佳動作   │
└─────────────────┘
```

---

## 七、測試策略

### 7.1 單元測試

| 測試範圍 | 測試項目 | 優先級 |
|---------|---------|--------|
| cardLogic | 牌庫建立、洗牌、抽牌 | P0 |
| creatureLogic | 生物創建、性狀添加、食量計算 | P0 |
| feedingLogic | 進食規則、攻擊判定 | P0 |
| traitLogic | 各性狀效果正確性 | P0 |
| scoreLogic | 計分正確性 | P0 |
| phaseLogic | 階段切換、結束判定 | P0 |

### 6.2 整合測試

| 測試場景 | 說明 |
|---------|------|
| 完整遊戲流程 | 從開始到結束的完整遊戲 |
| 多人同步 | 4 人同時操作的同步性 |
| 斷線重連 | 玩家斷線後重新連接 |

### 6.3 性狀組合測試

| 測試案例 | 預期結果 |
|---------|---------|
| 肉食 + 銳目攻擊偽裝 | 攻擊成功 |
| 肉食攻擊穴居（已吃飽）| 攻擊失敗 |
| 攻擊毒液生物 | 攻擊者也滅絕 |
| 敏捷骰子 4-6 | 逃脫成功 |
| 溝通連鎖三隻 | 三隻都獲得食物 |
| 合作連鎖 | 藍色食物正確分配 |
| 共生進食順序 | 代表先吃飽才能餵被保護者 |

---

## 八、實施計畫

### 階段一：基礎架構（工單 0228-0232）

| 工單 | 標題 | 內容 | 預估天數 |
|------|------|------|---------|
| 0228 | 建立演化論常數定義 | 完成 shared/constants/evolution.js | 1 |
| 0229 | 建立卡牌邏輯模組 | 完成 cardLogic.js 含 84 張卡定義 | 2 |
| 0230 | 建立生物邏輯模組 | 完成 creatureLogic.js | 1 |
| 0231 | 建立進食邏輯模組 | 完成 feedingLogic.js | 2 |
| 0232 | 建立階段邏輯模組 | 完成 phaseLogic.js 和 gameLogic.js | 2 |

### 階段二：性狀系統（工單 0233-0251）

#### 2.1 肉食相關性狀（工單 0233-0235）

| 工單 | 標題 | 內容 | 說明 |
|------|------|------|------|
| 0233 | 實作【肉食】性狀 | carnivore | 食量+1，不能吃現有食物，必須攻擊其他生物獲得 2 個藍色食物 |
| 0234 | 實作【腐食】性狀 | scavenger | 當任何生物被肉食攻擊滅絕時獲得 1 個藍色食物，不能與肉食同時擁有 |
| 0235 | 實作【銳目】性狀 | sharpVision | 只有銳目動物可以獵食具有偽裝性狀的生物 |

#### 2.2 防禦相關性狀（工單 0236-0243）

| 工單 | 標題 | 內容 | 說明 |
|------|------|------|------|
| 0236 | 實作【偽裝】性狀 | camouflage | 肉食生物必須擁有銳目性狀才能攻擊此生物 |
| 0237 | 實作【穴居】性狀 | burrowing | 當此生物吃飽時，無法被攻擊 |
| 0238 | 實作【毒液】性狀 | poisonous | 被攻擊滅絕時，攻擊者也會在滅絕階段死亡 |
| 0239 | 實作【水生】性狀 | aquatic | 只有同樣擁有水生的肉食生物才能攻擊，有水生的肉食也無法攻擊無水生的 |
| 0240 | 實作【敏捷】性狀 | agile | 被攻擊時擲骰，4-6 逃脫成功，1-3 逃脫失敗 |
| 0241 | 實作【巨化】性狀 | massive | 食量+1，只有同樣擁有巨化的肉食生物才能攻擊，有巨化也可以獵食沒有巨化的 |
| 0242 | 實作【斷尾】性狀 | tailLoss | 被攻擊時可棄置 1 張性狀卡來取消攻擊，攻擊者獲得 1 個藍色食物 |
| 0243 | 實作【擬態】性狀 | mimicry | 每回合可使用一次，被攻擊時可將攻擊轉移給自己另一隻一定可以被獵食的生物 |

#### 2.3 進食相關性狀（工單 0244-0247）

| 工單 | 標題 | 內容 | 說明 |
|------|------|------|------|
| 0244 | 實作【脂肪組織】性狀 | fatTissue | 吃飽後可繼續獲得食物，儲存為黃色脂肪標記，可在進食階段消耗滿足食量 |
| 0245 | 實作【冬眠】性狀 | hibernation | 可跳過整個進食階段視為吃飽，使用後橫置至下回合，最後一回合不能使用 |
| 0246 | 實作【寄生蟲】性狀 | parasite | 食量+2，只能放在對手的生物上，增加該生物的食量需求 |
| 0247 | 實作【掠奪】性狀 | robbery | 可偷取其他未吃飽生物身上的 1 個食物，每階段限用一次 |

#### 2.4 互動相關性狀（工單 0248-0250）

| 工單 | 標題 | 內容 | 說明 |
|------|------|------|------|
| 0248 | 實作【溝通】性狀 | communication | 當其中一隻生物拿取紅色食物時，另一隻也從中央拿取（會連鎖觸發） |
| 0249 | 實作【合作】性狀 | cooperation | 當其中一隻生物獲得紅/藍食物時，另一隻獲得 1 個藍色食物（會連鎖觸發） |
| 0250 | 實作【共生】性狀 | symbiosis | 指定代表動物與被保護者，代表吃飽前被保護者不能獲得食物，肉食只能攻擊代表 |

#### 2.5 特殊能力性狀（工單 0251）

| 工單 | 標題 | 內容 | 說明 |
|------|------|------|------|
| 0251 | 實作【踐踏】性狀 | trampling | 進食階段輪到自己時，可將桌面一個現有食物移除 |

### 階段三：前端組件（工單 0252-0259）

| 工單 | 標題 | 內容 | 預估天數 |
|------|------|------|---------|
| 0252 | 建立遊戲房間組件 | EvolutionRoom 主組件 | 2 |
| 0253 | 建立遊戲桌面組件 | GameBoard、FoodPool | 2 |
| 0254 | 建立卡牌組件 | CreatureCard、TraitCard | 2 |
| 0255 | 建立玩家區域組件 | PlayerArea、HandCards | 2 |
| 0256 | 建立階段指示器組件 | PhaseIndicator、TurnTimer | 1 |
| 0257 | 建立攻擊判定組件 | AttackResolver、DiceRoller | 2 |
| 0258 | 建立互動性狀組件 | InteractionLink、TraitSelector | 2 |
| 0259 | 建立計分與日誌組件 | ScoreBoard、GameLog | 1 |

### 階段四：平台整合（工單 0260-0263）

| 工單 | 標題 | 內容 | 預估天數 |
|------|------|------|---------|
| 0260 | 修改大廳支援遊戲選擇 | Lobby 加入遊戲類型選擇器 | 2 |
| 0261 | 整合 Socket 事件 | 後端 server.js 加入演化論事件 | 2 |
| 0262 | 建立演化論 Redux Store | evolution/gameStore.js | 1 |
| 0263 | 建立路由整合 | App.js 加入演化論路由 | 1 |

### 階段五：資料庫與統計（工單 0264-0266）

| 工單 | 標題 | 內容 | 預估天數 |
|------|------|------|---------|
| 0264 | 建立演化論資料表 | Supabase schema | 1 |
| 0265 | 實作遊戲紀錄儲存 | 遊戲結束時存檔 | 1 |
| 0266 | 實作演化論排行榜 | 排行榜 API 與頁面 | 2 |

### 階段六：測試與優化（工單 0267-0271）

| 工單 | 標題 | 內容 | 預估天數 |
|------|------|------|---------|
| 0267 | 後端邏輯單元測試 | 所有 logic 模組測試 | 3 |
| 0268 | 前端組件單元測試 | 所有組件測試 | 2 |
| 0269 | 整合測試 | 完整遊戲流程測試 | 2 |
| 0270 | 效能優化 | 渲染優化、記憶體優化 | 2 |
| 0271 | 更新專案文檔 | CLAUDE.md、README | 1 |

---

## 九、工單清單總覽

| 階段 | 工單範圍 | 工單數 | 說明 |
|------|---------|--------|------|
| 階段一：基礎架構 | 0228-0232 | 5 | 常數、卡牌、生物、進食、階段邏輯 |
| 階段二：性狀系統 | 0233-0251 | 19 | 每個性狀獨立工單 |
| 階段三：前端組件 | 0252-0259 | 8 | 遊戲畫面組件 |
| 階段四：平台整合 | 0260-0263 | 4 | 大廳、Socket、路由整合 |
| 階段五：資料庫 | 0264-0266 | 3 | 資料表、紀錄、排行榜 |
| 階段六：測試優化 | 0267-0271 | 5 | 測試與文檔更新 |

**總計：44 張工單**

### 9.1 性狀工單詳細清單

| 工單 | 性狀名稱 | 類別 | 英文代碼 |
|------|---------|------|---------|
| 0233 | 肉食 | 肉食相關 | carnivore |
| 0234 | 腐食 | 肉食相關 | scavenger |
| 0235 | 銳目 | 肉食相關 | sharpVision |
| 0236 | 偽裝 | 防禦相關 | camouflage |
| 0237 | 穴居 | 防禦相關 | burrowing |
| 0238 | 毒液 | 防禦相關 | poisonous |
| 0239 | 水生 | 防禦相關 | aquatic |
| 0240 | 敏捷 | 防禦相關 | agile |
| 0241 | 巨化 | 防禦相關 | massive |
| 0242 | 斷尾 | 防禦相關 | tailLoss |
| 0243 | 擬態 | 防禦相關 | mimicry |
| 0244 | 脂肪組織 | 進食相關 | fatTissue |
| 0245 | 冬眠 | 進食相關 | hibernation |
| 0246 | 寄生蟲 | 進食相關 | parasite |
| 0247 | 掠奪 | 進食相關 | robbery |
| 0248 | 溝通 | 互動相關 | communication |
| 0249 | 合作 | 互動相關 | cooperation |
| 0250 | 共生 | 互動相關 | symbiosis |
| 0251 | 踐踏 | 特殊能力 | trampling |

---

## 十、風險評估

### 10.1 技術風險

| 風險 | 等級 | 影響 | 緩解措施 |
|------|------|------|---------|
| 互動性狀連鎖複雜度 | 高 | 邏輯錯誤 | 詳細單元測試、狀態機設計 |
| 即時同步延遲 | 中 | 體驗不佳 | 樂觀更新、衝突解決機制 |
| 行動裝置相容性 | 中 | 部分功能失效 | 響應式設計、觸控優化 |
| 性狀互斥規則 | 中 | 玩家困惑 | 清晰的 UI 提示與驗證 |

### 10.2 專案風險

| 風險 | 等級 | 影響 | 緩解措施 |
|------|------|------|---------|
| 需求變更 | 中 | 延期 | 模組化設計、預留擴展點 |
| 與本草衝突 | 低 | 整合問題 | 完整隔離、命名空間區分 |

---

## 十一、依賴關係

### 11.1 技術依賴

- React 18.x（已有）
- Redux Toolkit（已有）
- Socket.io 4.x（已有）
- Node.js 18.x（已有）
- Supabase（已有）

### 11.2 工單依賴圖

```
階段一（基礎架構）
    │
    ├── 0228（常數）→ 0229（卡牌）→ 0230（生物）→ 0231（進食）→ 0232（階段）
    │
    ▼
階段二（性狀系統）
    │
    ├── 0233-0251（19 個性狀，依賴 0228-0232）
    │
    ▼
階段三（前端組件）   ←──┐
    │                   │
    ├── 0252-0259       │ 可平行開發
    │                   │
階段四（平台整合）   ←──┘
    │
    ├── 0260-0263（依賴階段三）
    │
    ▼
階段五（資料庫）
    │
    ├── 0264-0266（可與階段四平行）
    │
    ▼
階段六（測試優化）
    │
    └── 0267-0271（依賴所有前置階段）
```

---

## 十二、驗收標準

### 12.1 功能驗收

- [ ] 2-4 人可正常進行完整遊戲
- [ ] 所有 19 種性狀正確運作
- [ ] 連鎖效應正確觸發
- [ ] 計分正確
- [ ] 斷線重連正常運作
- [ ] 遊戲紀錄正確儲存
- [ ] 排行榜正常顯示

### 12.2 效能驗收

- [ ] 回合切換 < 500ms
- [ ] 首屏載入 < 3s
- [ ] 無記憶體洩漏

### 12.3 相容性驗收

- [ ] Chrome/Firefox/Safari/Edge 最新版
- [ ] iOS Safari / Android Chrome
- [ ] 平板裝置

---

## 十三、附錄

### 附錄 A：84 張卡牌清單

（待階段一工單 0229 完成時補充）

### 附錄 B：性狀詳細規格

（參考 docs/GAME_RULES_EVOLUTION.md）

### 附錄 C：UI 設計稿

（待設計階段補充）

---

**文件結束**

| 建立日期 | 2026-01-31 |
| 最後更新 | 2026-01-31 |
| 版本 | 1.1 |
| 狀態 | 規劃完成 |
| 備註 | v1.1 移除單人模式與 AI 系統 |
