# 報告書 0318

## 工單編號
0318

## 完成日期
2026-02-01

## 完成內容摘要

### 重構性狀定義結構

將現有硬編碼的性狀定義重構為模組化結構，支援擴充包動態新增性狀。

#### 新增檔案

1. **`shared/expansions/base/traits/definitions.js`**
   - 定義 5 種性狀類別（CARNIVORE, DEFENSE, FEEDING, INTERACTIVE, SPECIAL）
   - 定義 19 種性狀類型常數
   - 每個性狀包含完整元數據：
     - `type`, `name`, `nameEn` - 識別與顯示
     - `foodBonus` - 食量加成
     - `description` - 描述
     - `category` - 所屬類別
     - `incompatible` - 不相容性狀
     - `isInteractive`, `isStackable` - 特性標記
     - `expansion`, `icon`, `cardCount` - 擴充包資訊
   - 工具函數：getAllTraitTypes, getInteractiveTraits, getStackableTraits, getTraitsByCategory, areTraitsIncompatible, getTraitDefinition, getTotalCardCount

2. **`shared/expansions/base/traits/index.js`**
   - 統一匯出點

3. **`shared/expansions/base/cards.js`**
   - 定義 11 種卡牌配對（雙面卡正面/背面組合）
   - 總計 44 張雙面卡（88 面）
   - generateCardPool(), generateSimpleCards() 函數

4. **`shared/expansions/base/index.js`**
   - 完整的 baseExpansion 擴充包定義
   - 符合 ExpansionInterface 介面
   - 包含規則定義（玩家數、初始手牌、食物公式、計分規則）
   - 生命週期鉤子（onRegister, onEnable, onDisable, onGameInit, onGameEnd）

5. **`shared/expansions/base/__tests__/traits.test.js`**
   - 42 個單元測試

#### 修改檔案

1. **`shared/constants/evolution.js`**
   - 新增 @deprecated 標記，指向新模組
   - 新增 TRAIT_CATEGORIES 匯出
   - 新增 baseExpansion 匯出
   - 保持向後相容性

### 性狀分布統計

| 類別 | 數量 | 性狀 |
|------|------|------|
| 肉食相關 | 3 | 肉食、腐食、銳目 |
| 防禦相關 | 8 | 偽裝、穴居、毒液、水生、敏捷、巨化、斷尾、擬態 |
| 進食相關 | 4 | 脂肪組織、冬眠、寄生蟲、掠奪 |
| 互動相關 | 3 | 溝通、合作、共生 |
| 特殊能力 | 1 | 踐踏 |
| **總計** | **19** | |

### 卡牌數量統計

| 性狀 | 卡牌數 |
|------|--------|
| 脂肪組織 | 8 |
| 寄生蟲 | 8 |
| 其他 17 種 | 各 4 張 |
| **總計** | **84** |

## 遇到的問題與解決方案

1. **水生卡牌數量錯誤**
   - 問題：初始設定水生為 8 張，實際應為 4 張
   - 解決：修正 cardCount 為 4

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       42 passed, 42 total
Time:        0.382 s
```

### 測試覆蓋範圍

- TRAIT_CATEGORIES：2 個測試
- TRAIT_TYPES：2 個測試
- TRAIT_DEFINITIONS：9 個測試
- getAllTraitTypes：2 個測試
- getInteractiveTraits：2 個測試
- getStackableTraits：2 個測試
- getTraitsByCategory：5 個測試
- areTraitsIncompatible：3 個測試
- getTraitDefinition：2 個測試
- getTotalCardCount：1 個測試
- Card Pool：3 個測試
- baseExpansion：9 個測試

## 下一步計劃

- 工單 0319：性狀處理器介面（TraitHandler）
- 工單 0320：基礎版性狀處理器實作
