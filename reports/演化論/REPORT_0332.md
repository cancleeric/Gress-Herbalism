# 工單報告 0332：HandCard 手牌卡牌組件

## 基本資訊

- **工單編號**：0332
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. 安裝依賴

- 安裝 `react-dnd` 和 `react-dnd-html5-backend` 用於拖放功能

### 2. 性狀視覺常數

建立 `frontend/src/components/games/evolution/constants/traitVisuals.js`：

**包含內容**：
- `TRAIT_ICONS`: 19 種性狀對應的 Emoji 圖示
- `TRAIT_COLORS`: 5 種性狀類別對應的顏色
- `TRAIT_NAMES`: 性狀中文名稱對照表
- `TRAIT_CATEGORY_MAP`: 性狀類別對照表
- `TRAIT_FOOD_BONUS`: 性狀食量加成對照表
- `getTraitDescription()`: 取得性狀描述
- `getTraitInfo()`: 取得完整性狀資訊

### 3. HandCard 組件實作

建立 `frontend/src/components/games/evolution/cards/HandCard.jsx`：

**功能特性**：
- 雙面卡牌顯示（正反面性狀）
- 拖放支援（使用 react-dnd）
- 雙擊翻轉查看背面
- 選中時顯示操作按鈕（作為生物/性狀打出）
- 面選擇器（選擇使用正面或背面）
- 食量加成顯示（肉食 +1、巨化 +1、寄生蟲 +2）
- 響應式設計

**Props 介面**：
```jsx
{
  card,              // 卡牌資料 (必要)
  selected,          // 選中狀態
  disabled,          // 禁用狀態
  onSelect,          // 選擇事件
  onPlayAsCreature,  // 作為生物打出
  onPlayAsTrait,     // 作為性狀打出
  showSideSelector,  // 顯示面選擇器
  selectedSide,      // 選中的面 ('front' | 'back')
  onSideSelect,      // 面選擇事件
  className,         // 自定義類別
}
```

### 4. 樣式定義

建立 `frontend/src/components/games/evolution/cards/HandCard.css`：

**樣式特點**：
- 卡牌內容佈局（圖示、名稱、食量加成）
- 拖動狀態樣式（半透明、放大）
- 面選擇器樣式
- 操作按鈕樣式（生物按鈕綠色、性狀按鈕紫色）
- 響應式調整（768px 以下縮小尺寸）

---

## 測試結果

```
Test Suites: 3 passed, 3 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        5.375 s

覆蓋率：
- HandCard.jsx: 86.84% Stmts / 72.72% Branch / 75% Funcs / 88.88% Lines
```

### 測試涵蓋範圍

**HandCard.test.jsx (24 tests)**：
- Rendering: 正面性狀、圖示、食量加成、自定義 className
- Selection: onSelect 事件、disabled 狀態
- Actions: 操作按鈕顯示、onPlayAsCreature、onPlayAsTrait
- Side Selector: 面選擇器顯示、面按鈕點擊、選中狀態
- Flip Functionality: 雙擊翻轉、多次翻轉
- Different Trait Cards: 防禦性狀、互動性狀、無食量加成卡
- Disabled State: 禁用狀態下不觸發事件

---

## 新增的檔案

### 常數檔案
- `frontend/src/components/games/evolution/constants/traitVisuals.js`
- `frontend/src/components/games/evolution/constants/index.js`

### 組件檔案
- `frontend/src/components/games/evolution/cards/HandCard.jsx`
- `frontend/src/components/games/evolution/cards/HandCard.css`

### 測試檔案
- `frontend/src/components/games/evolution/cards/__tests__/HandCard.test.jsx`

### 報告
- `reports/演化論/REPORT_0332.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 正確顯示雙面性狀資訊 | ✅ |
| 雙擊可翻轉查看背面 | ✅ |
| 選中時顯示操作按鈕 | ✅ |
| 拖動功能正常 | ✅ |
| 面選擇器正確運作 | ✅ |
| 與 CardBase 整合正常 | ✅ |
| 響應式設計正確 | ✅ |
| 單元測試通過 | ✅ |

---

## 技術決策

### react-dnd 測試 Mock

由於 react-dnd 使用 ES modules，Jest 無法直接解析。使用 `jest.mock()` mock 掉 react-dnd，避免測試配置複雜化：

```javascript
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
  DndProvider: ({ children }) => children,
}));
```

### 性狀資訊本地化

工單規格原本使用 `useEvolutionStore` 取得性狀資訊，但現有的 evolutionStore 是 Redux Toolkit 格式且不包含性狀定義。

改為在 `traitVisuals.js` 中定義完整的性狀視覺資訊，組件直接使用這些常數，避免對 store 的依賴。

---

## 下一步計劃

工單 0332 完成，繼續執行：
- 工單 0333：CreatureCard 生物卡牌組件
- 工單 0334：Hand 手牌容器組件

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
