# 工作單 0230

## 編號
0230

## 日期
2026-01-31

## 工作單標題
建立生物邏輯模組

## 工單主旨
建立演化論遊戲的生物邏輯模組 `backend/logic/evolution/creatureLogic.js`，實作生物的創建、性狀管理、食量計算、滅絕判定等功能

## 內容

### 任務描述

實作演化論遊戲的生物系統，包含生物的完整生命週期管理。

### 生物資料結構
```javascript
const creature = {
  id: 'creature_001',
  ownerId: 'player_1',
  traits: [],           // 性狀列表
  food: {
    red: 0,             // 紅色食物（現有）
    blue: 0,            // 藍色食物（額外）
    yellow: 0           // 黃色食物（脂肪）
  },
  foodNeeded: 1,        // 基礎食量需求
  isFed: false,         // 是否吃飽
  hibernating: false,   // 是否冬眠中
  interactionLinks: [], // 互動性狀連結
  isPoisoned: false     // 是否中毒（滅絕階段死亡）
};
```

### 函數規格

#### createCreature(ownerId, cardId)
```javascript
/**
 * 創造新生物
 * @param {string} ownerId - 擁有者玩家 ID
 * @param {string} cardId - 用來創造生物的卡牌 ID
 * @returns {Creature} 新生物
 */
function createCreature(ownerId, cardId) { }
```

#### addTrait(creature, traitType, cardId, linkedCreature)
```javascript
/**
 * 為生物添加性狀
 * @param {Creature} creature - 目標生物
 * @param {string} traitType - 性狀類型
 * @param {string} cardId - 卡牌 ID
 * @param {Creature} linkedCreature - 連結生物（互動性狀用）
 * @returns {{ success: boolean, creature: Creature, reason: string }}
 */
function addTrait(creature, traitType, cardId, linkedCreature) { }
```

#### removeTrait(creature, traitId)
```javascript
/**
 * 移除生物的性狀（斷尾用）
 * @param {Creature} creature - 目標生物
 * @param {string} traitId - 性狀 ID
 * @returns {Creature} 更新後的生物
 */
function removeTrait(creature, traitId) { }
```

#### calculateFoodNeed(creature)
```javascript
/**
 * 計算生物的食量需求
 * 基礎 1 + 肉食 +1 + 巨化 +1 + 寄生蟲 +2
 * @param {Creature} creature - 生物
 * @returns {number} 食量需求
 */
function calculateFoodNeed(creature) { }
```

#### canBeAttacked(attacker, defender)
```javascript
/**
 * 判定防守方是否可被攻擊
 * 考慮：偽裝、銳目、穴居、水生、巨化、共生
 * @param {Creature} attacker - 攻擊方
 * @param {Creature} defender - 防守方
 * @returns {{ canAttack: boolean, reason: string }}
 */
function canBeAttacked(attacker, defender) { }
```

#### checkExtinction(creature)
```javascript
/**
 * 判定生物是否滅絕
 * 滅絕條件：未吃飽且非冬眠狀態
 * @param {Creature} creature - 生物
 * @returns {boolean} 是否滅絕
 */
function checkExtinction(creature) { }
```

#### hasTrait(creature, traitType)
```javascript
/**
 * 檢查生物是否擁有指定性狀
 * @param {Creature} creature - 生物
 * @param {string} traitType - 性狀類型
 * @returns {boolean}
 */
function hasTrait(creature, traitType) { }
```

### 性狀互斥規則
- 肉食與腐食互斥
- 同一生物不能有重複性狀（脂肪組織除外，可疊加）
- 寄生蟲只能放在對手生物上

### 前置條件
- 工單 0228 已完成（常數定義）
- 工單 0229 已完成（卡牌邏輯）

### 驗收標準
- [ ] 生物創建功能正確
- [ ] 性狀添加功能正確（含互斥驗證）
- [ ] 食量計算正確（各種性狀組合）
- [ ] 攻擊判定正確（所有防禦性狀）
- [ ] 滅絕判定正確
- [ ] 單元測試覆蓋率 ≥ 80%

### 相關檔案
- `backend/logic/evolution/creatureLogic.js` — 新建
- `shared/constants/evolution.js` — 依賴
- `backend/logic/evolution/cardLogic.js` — 依賴

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.3 節
