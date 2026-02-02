# 工單報告 0333：CreatureCard 生物卡牌組件

## 基本資訊

- **工單編號**：0333
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. FoodIndicator 組件

建立 `frontend/src/components/games/evolution/cards/FoodIndicator.jsx`：

**功能特性**：
- 顯示食物槽（空/填滿狀態）
- 顯示脂肪槽（僅在有脂肪組織性狀時）
- 使用 Emoji 顯示狀態（🍖 食物、🥓 脂肪）
- Tooltip 說明

### 2. TraitBadge 組件

建立 `frontend/src/components/games/evolution/cards/TraitBadge.jsx`：

**功能特性**：
- 圓形性狀徽章，顯示性狀圖示
- 三種尺寸（small / medium / large）
- 連結狀態指示器（🔗）
- Tooltip 顯示性狀名稱
- 點擊事件支援

### 3. CreatureCard 組件

建立 `frontend/src/components/games/evolution/cards/CreatureCard.jsx`：

**功能特性**：
- 顯示生物狀態（圖示、食物、性狀）
- 動態生物圖示（🦎/🐟/🦖/🦕）
- 狀態標籤（餓/飽/脂肪）
- 性狀徽章列表（動畫進出）
- 進食按鈕（進食階段顯示）
- 可攻擊狀態覆蓋層
- 放置性狀目標（拖放支援）
- 狀態類別（own/hungry/satisfied/attackable/attacking）

**Props 介面**：
```jsx
{
  creature,          // 生物資料 (必要)
  isOwn,             // 是否自己的生物
  selected,          // 選中狀態
  canBeAttacked,     // 可被攻擊
  canReceiveTrait,   // 可接收性狀
  isAttacking,       // 攻擊中
  isFed,             // 已進食
  currentPhase,      // 當前階段
  onSelect,          // 選擇事件
  onFeed,            // 進食事件
  onAttack,          // 攻擊事件
  onPlaceTrait,      // 放置性狀事件
  className,         // 自定義類別
}
```

---

## 測試結果

```
Test Suites: 6 passed, 6 total
Tests:       136 passed, 136 total
Snapshots:   0 total
Time:        5.539 s

覆蓋率：
- CardBase.jsx: 100%
- CreatureCard.jsx: 87.5%
- FoodIndicator.jsx: 100%
- HandCard.jsx: 86.84%
- TraitBadge.jsx: 100%
- useCardInteraction.js: 100%
```

### 測試涵蓋範圍

**CreatureCard.test.jsx (26 tests)**：
- Rendering: 基本渲染、圖示、食物指示器
- Creature Icons: 水生、肉食、巨化生物圖示
- Status Display: 餓/飽/脂肪狀態顯示
- Trait Badges: 性狀徽章列表
- Selection and Click: 選擇和攻擊事件
- Attackable State: 可攻擊覆蓋層
- Feed Button: 進食按鈕顯示和事件
- State Classes: 狀態 CSS 類別

**FoodIndicator.test.jsx (14 tests)**：
- Food Slots: 食物槽渲染和填滿狀態
- Fat Slots: 脂肪槽渲染和填滿狀態
- Tooltips: 正確的提示文字
- Edge Cases: 邊界情況處理

**TraitBadge.test.jsx (14 tests)**：
- Rendering: 基本渲染和圖示
- Size Variants: 尺寸變體
- Linked State: 連結狀態
- Tooltip: 提示文字
- Click Handler: 點擊事件
- Different Traits: 各種性狀圖示

---

## 新增的檔案

### 組件檔案
- `frontend/src/components/games/evolution/cards/CreatureCard.jsx`
- `frontend/src/components/games/evolution/cards/CreatureCard.css`
- `frontend/src/components/games/evolution/cards/FoodIndicator.jsx`
- `frontend/src/components/games/evolution/cards/FoodIndicator.css`
- `frontend/src/components/games/evolution/cards/TraitBadge.jsx`
- `frontend/src/components/games/evolution/cards/TraitBadge.css`

### 測試檔案
- `frontend/src/components/games/evolution/cards/__tests__/CreatureCard.test.jsx`
- `frontend/src/components/games/evolution/cards/__tests__/FoodIndicator.test.jsx`
- `frontend/src/components/games/evolution/cards/__tests__/TraitBadge.test.jsx`

### 報告
- `reports/演化論/REPORT_0333.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 正確顯示生物狀態 | ✅ |
| 食物指示器準確 | ✅ |
| 性狀徽章正確顯示 | ✅ |
| 可攻擊狀態視覺清晰 | ✅ |
| 拖放性狀功能正常 | ✅ |
| 進食按鈕正常運作 | ✅ |
| 動畫流暢 | ✅ |

---

## 技術決策

### 組件拆分

將 CreatureCard 拆分為三個子組件：
- `FoodIndicator`: 獨立的食物顯示組件，可重用
- `TraitBadge`: 獨立的性狀徽章組件，可重用
- `CreatureCard`: 組合上述組件的容器

### currentPhase 作為 prop

工單規格原本使用 `useEvolutionStore` 取得 `currentPhase`，但這會造成組件與 store 強耦合。改為接受 `currentPhase` 作為 prop，讓組件更加可測試和可重用。

---

## 下一步計劃

工單 0333 完成，繼續執行：
- 工單 0334：Hand 手牌容器組件
- 工單 0335：CreatureArea 生物區域組件

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
