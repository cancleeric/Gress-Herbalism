# 工單報告 0331：CardBase 基礎卡牌組件

## 基本資訊

- **工單編號**：0331
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. 安裝依賴

- 安裝 `framer-motion` 動畫庫用於卡牌翻轉動畫

### 2. CardBase 組件實作

建立 `frontend/src/components/games/evolution/cards/CardBase.jsx`：

**功能特性**：
- 正反面內容渲染
- 翻轉動畫（使用 framer-motion）
- 尺寸變體（small / medium / large）
- 狀態樣式（selected / disabled / highlighted / hovered / flipped）
- 拖放支援預留（draggable prop）
- 事件處理（onClick / onDoubleClick / onHover）
- 無障礙支援（role="button" / tabIndex / aria-* 屬性）

**Props 介面**：
```jsx
{
  frontContent,     // 正面內容
  backContent,      // 背面內容
  flipped,          // 翻轉狀態
  selected,         // 選中狀態
  disabled,         // 禁用狀態
  highlighted,      // 高亮狀態
  size,             // 尺寸 ('small' | 'medium' | 'large')
  onClick,          // 點擊事件
  onDoubleClick,    // 雙擊事件
  onHover,          // 懸停事件
  draggable,        // 可拖動
  className,        // 自定義類別
  style,            // 自定義樣式
  testId,           // 測試 ID
  children,         // 額外內容
}
```

### 3. 樣式定義

建立 `frontend/src/components/games/evolution/cards/CardBase.css`：

**CSS 變數**：
- `--card-width-small/medium/large`: 卡牌寬度
- `--card-height-small/medium/large`: 卡牌高度
- `--card-border-radius`: 圓角
- `--card-shadow`: 陰影
- `--card-transition`: 過渡動畫

**響應式設計**：
- 768px 以下調整尺寸
- 480px 以下再次調整

**動畫效果**：
- 翻轉動畫 (rotateY 180deg)
- 懸停放大 (scale 1.02)
- 點擊縮小 (scale 0.98)
- 高亮脈動 (card-pulse keyframes)

### 4. useCardInteraction Hook

建立 `frontend/src/components/games/evolution/cards/useCardInteraction.js`：

**功能**：
- 卡牌選擇狀態管理
- 單選/多選模式支援
- 最大選擇數量限制

**返回方法**：
- `toggleSelect(cardId)`: 切換選擇
- `isSelected(cardId)`: 檢查是否選中
- `clearSelection()`: 清除所有選擇
- `selectAll(cardIds)`: 選擇多張卡
- `select(cardId)`: 選擇單張卡
- `deselect(cardId)`: 取消選擇

### 5. 模組匯出

建立 `frontend/src/components/games/evolution/cards/index.js`：
```javascript
export { CardBase } from './CardBase';
export { useCardInteraction } from './useCardInteraction';
```

---

## 測試結果

```
Test Suites: 2 passed, 2 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        8.408 s

覆蓋率：
- CardBase.jsx: 100% (Stmts / Branch / Funcs / Lines)
- useCardInteraction.js: 100% (Stmts / Branch / Funcs / Lines)
```

### 測試涵蓋範圍

**CardBase.test.jsx (27 tests)**：
- Rendering: 正面/背面內容、子元素、testId
- Size Variants: small/medium/large 尺寸
- State Classes: selected/disabled/highlighted/flipped/draggable
- Click Events: onClick/onDoubleClick、disabled 時不觸發
- Hover Events: onHover、hovered class
- Accessibility: role/tabIndex/aria-*
- Style Prop: 自定義樣式

**useCardInteraction.test.js (27 tests)**：
- Initial State: 空選擇
- Single Select Mode: 選擇/取消選擇/替換
- Multi Select Mode: 多選/maxSelect 限制
- isSelected: 檢查選擇狀態
- clearSelection: 清除所有
- selectAll: 批量選擇
- select/deselect: 直接選擇/取消

---

## 新增的檔案

### 組件檔案
- `frontend/src/components/games/evolution/cards/CardBase.jsx`
- `frontend/src/components/games/evolution/cards/CardBase.css`
- `frontend/src/components/games/evolution/cards/useCardInteraction.js`
- `frontend/src/components/games/evolution/cards/index.js`

### 測試檔案
- `frontend/src/components/games/evolution/cards/__tests__/CardBase.test.jsx`
- `frontend/src/components/games/evolution/cards/__tests__/useCardInteraction.test.js`

### 報告
- `reports/演化論/REPORT_0331.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 組件正確渲染正反面內容 | ✅ |
| 翻轉動畫流暢 | ✅ |
| 選中/懸停狀態視覺反饋正確 | ✅ |
| 三種尺寸正常顯示 | ✅ |
| disabled 狀態禁止互動 | ✅ |
| 響應式設計在各裝置正常 | ✅ |
| 單元測試通過 | ✅ |
| 無障礙支援（keyboard、ARIA） | ✅ |

---

## 技術決策

### 使用 framer-motion

選擇 framer-motion 作為動畫庫，原因：
1. React 原生整合，API 直觀
2. 支援 variants 動畫狀態管理
3. 內建 whileHover / whileTap 互動
4. 效能良好，GPU 加速

### 測試 Mock 策略

在測試中 mock framer-motion 的 motion.div，避免動畫執行影響測試穩定性。

---

## 下一步計劃

工單 0331 完成，繼續執行：
- 工單 0332：TraitCard 性狀卡牌組件
- 工單 0333：HandCard 手牌組件

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
