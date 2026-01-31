# 工作單 0229

## 編號
0229

## 日期
2026-01-31

## 工作單標題
建立卡牌邏輯模組

## 工單主旨
建立演化論遊戲的卡牌邏輯模組 `backend/logic/evolution/cardLogic.js`，實作 84 張雙面卡牌的定義、洗牌、抽牌等功能

## 內容

### 任務描述

實作演化論遊戲的完整卡牌系統，包含 84 張雙面卡牌（一面為生物、一面為性狀）。

### 卡牌分布（84 張）

| 性狀 | 數量 | 食量加成 | 備註 |
|------|------|---------|------|
| 肉食 | 4 | +1 | - |
| 腐食 | 4 | - | - |
| 銳目 | 4 | - | - |
| 偽裝 | 4 | - | - |
| 穴居 | 4 | - | - |
| 毒液 | 4 | - | - |
| 水生 | 8 | - | - |
| 敏捷 | 4 | - | - |
| 巨化 | 4 | +1 | - |
| 斷尾 | 4 | - | - |
| 擬態 | 4 | - | - |
| 脂肪組織 | 8 | - | 可疊加 |
| 冬眠 | 4 | - | - |
| 寄生蟲 | 8 | +2 | 放對手生物 |
| 掠奪 | 4 | - | - |
| 溝通 | 4 | - | 互動性狀 |
| 合作 | 4 | - | 互動性狀 |
| 共生 | 4 | - | 互動性狀 |
| 踐踏 | 4 | - | - |

### 函數規格

#### createDeck()
```javascript
/**
 * 建立完整的 84 張卡牌牌庫
 * @returns {Card[]} 卡牌陣列
 */
function createDeck() { }
```

#### shuffleDeck(deck)
```javascript
/**
 * 洗牌（Fisher-Yates 演算法）
 * @param {Card[]} deck - 牌庫
 * @returns {Card[]} 洗過的牌庫
 */
function shuffleDeck(deck) { }
```

#### drawCards(deck, count)
```javascript
/**
 * 從牌庫抽取指定數量的牌
 * @param {Card[]} deck - 牌庫
 * @param {number} count - 抽牌數量
 * @returns {{ cards: Card[], remainingDeck: Card[] }}
 */
function drawCards(deck, count) { }
```

#### getTraitInfo(traitType)
```javascript
/**
 * 取得性狀詳細資訊
 * @param {string} traitType - 性狀類型
 * @returns {TraitInfo} 性狀資訊
 */
function getTraitInfo(traitType) { }
```

#### validateTraitPlacement(creature, traitType, targetCreature)
```javascript
/**
 * 驗證性狀是否可放置在指定生物上
 * @param {Creature} creature - 來源生物
 * @param {string} traitType - 性狀類型
 * @param {Creature} targetCreature - 目標生物（互動性狀用）
 * @returns {{ valid: boolean, reason: string }}
 */
function validateTraitPlacement(creature, traitType, targetCreature) { }
```

### 卡牌資料結構
```javascript
const card = {
  id: 'card_001',
  traitType: 'carnivore',
  foodBonus: 1,
  isInteractive: false  // 互動性狀標記
};
```

### 前置條件
- 工單 0228 已完成（常數定義）

### 驗收標準
- [ ] 84 張卡牌完整定義
- [ ] 洗牌功能正確（隨機性）
- [ ] 抽牌功能正確（牌庫減少）
- [ ] 性狀資訊查詢正確
- [ ] 性狀放置驗證正確（互斥規則）
- [ ] 單元測試覆蓋率 ≥ 80%

### 相關檔案
- `backend/logic/evolution/cardLogic.js` — 新建
- `shared/constants/evolution.js` — 依賴

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.3 節
