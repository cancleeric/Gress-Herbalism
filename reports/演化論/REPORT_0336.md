# 工單報告 0336：FoodPool 食物池組件

## 基本資訊

- **工單編號**：0336
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. FoodPool 組件

建立 `frontend/src/components/games/evolution/board/FoodPool.jsx`：

**功能特性**：
- 視覺化顯示食物數量（最多顯示 30 顆，超過顯示 +N）
- 食物代幣可拖放和點擊取食
- 骰子動畫（決定食物階段）
- 空狀態和低食物警告顯示
- 擲骰按鈕
- 填充百分比背景動畫
- 顯示上次擲骰結果

**Props 介面**：
```jsx
{
  amount,          // 食物數量
  maxAmount,       // 最大顯示量 (計算填充比例)
  lastRoll,        // 上次擲骰結果 { dice, players }
  isRolling,       // 正在擲骰
  canTakeFood,     // 可取食物
  onTakeFood,      // 取食物事件
  onRoll,          // 擲骰事件
  showRollButton,  // 顯示擲骰按鈕
  className,       // 自定義類別
}
```

### 2. FoodToken 子組件

內建的食物代幣組件：
- 支援 react-dnd 拖放
- 動畫進入效果
- 可取/不可取狀態樣式

### 3. FoodPool.css 樣式

**樣式特性**：
- 金黃色漸層主題
- 低食物紅色警告
- 骰子旋轉動畫
- 響應式設計

---

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        4.338 s

覆蓋率：
- FoodPool.jsx: 76% statements, 79.16% lines
```

### 測試涵蓋範圍

**FoodPool.test.jsx (33 tests)**：
- Rendering (5 tests): 基本渲染、標題、數量顯示
- Food Tokens (4 tests): 代幣渲染、最大限制、溢出指示器
- Empty State (3 tests): 空狀態顯示和類別
- Low Food Warning (3 tests): 低食物警告類別
- Roll Result (2 tests): 擲骰結果顯示
- Rolling State (3 tests): 骰子動畫、rolling 類別
- Roll Button (5 tests): 按鈕顯示、禁用、事件
- Taking Food (5 tests): 提示顯示、點擊取食
- Fill Percentage (3 tests): 填充百分比計算

---

## 新增的檔案

### 組件檔案
- `frontend/src/components/games/evolution/board/FoodPool.jsx`
- `frontend/src/components/games/evolution/board/FoodPool.css`

### 測試檔案
- `frontend/src/components/games/evolution/board/__tests__/FoodPool.test.jsx`

### 報告
- `reports/演化論/REPORT_0336.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 正確顯示食物數量 | ✅ |
| 食物代幣可拖動 | ✅ |
| 骰子動畫流暢 | ✅ |
| 空/低食物狀態顯示 | ✅ |
| 擲骰按鈕正常運作 | ✅ |
| 響應式設計正確 | ✅ |
| 效能良好（大量食物） | ✅ |

---

## 技術決策

### 代幣數量限制

為避免大量 DOM 元素影響效能，最多只渲染 30 顆食物代幣，超過部分以 `+N` 數字顯示。

### DND_TYPES 匯出

匯出 `DND_TYPES.FOOD_TOKEN` 常數，供其他組件使用（如 CreatureCard 接收食物）。

---

## 下一步計劃

工單 0336 完成，繼續執行：
- 工單 0337：PhaseIndicator 階段指示器組件

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
