# 工單報告 0334：Hand 手牌區域組件

## 基本資訊

- **工單編號**：0334
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. Hand 組件

建立 `frontend/src/components/games/evolution/board/Hand.jsx`：

**功能特性**：
- 扇形排列手牌（基於角度計算的位置）
- Grid 布局模式支援
- 手牌數量顯示
- 超過 maxDisplay 時顯示展開按鈕
- 展開視圖（overlay modal）顯示全部手牌
- 卡牌選擇邏輯（使用 useCardInteraction hook）
- 面選擇器（選擇正/背面性狀）
- 傳遞 onPlayAsCreature 和 onPlayAsTrait 回調

**Props 介面**：
```jsx
{
  cards,              // 卡牌陣列
  disabled,           // 禁用狀態
  maxDisplay,         // 最大顯示數量 (預設 10)
  onPlayAsCreature,   // 作為生物打出回調
  onPlayAsTrait,      // 作為性狀打出回調
  showCount,          // 顯示手牌數量 (預設 true)
  layout,             // 布局模式 ('fan' | 'grid')
  className,          // 自定義類別
}
```

### 2. Hand.css 樣式

建立 `frontend/src/components/games/evolution/board/Hand.css`：

**樣式特性**：
- 扇形布局（負間距讓卡牌重疊）
- Grid 布局
- 展開視圖 overlay
- 響應式設計（768px、480px 斷點）

### 3. 模組匯出

建立 `frontend/src/components/games/evolution/board/index.js`

---

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.063 s

覆蓋率：
- Hand.jsx: 77.08% statements, 86.66% branches
```

### 測試涵蓋範圍

**Hand.test.jsx (25 tests)**：
- Rendering (4 tests): 基本渲染、卡牌容器、卡牌數量、自定義類別
- Card Count Display (3 tests): 顯示/隱藏數量、零手牌
- Max Display (3 tests): 限制顯示、展開按鈕
- Expanded View (6 tests): 開啟/關閉展開視圖、overlay 點擊、內容點擊
- Layout Modes (2 tests): fan/grid 布局
- Play Actions (3 tests): 面選擇器顯示、回調傳遞
- Disabled State (1 test): 禁用狀態傳遞
- Empty State (2 tests): 空手牌渲染
- Card Positions (1 test): 扇形位置計算

---

## 新增的檔案

### 組件檔案
- `frontend/src/components/games/evolution/board/Hand.jsx`
- `frontend/src/components/games/evolution/board/Hand.css`
- `frontend/src/components/games/evolution/board/index.js`

### 測試檔案
- `frontend/src/components/games/evolution/board/__tests__/Hand.test.jsx`

### 報告
- `reports/演化論/REPORT_0334.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 扇形排列正確顯示 | ✅ |
| 選中卡牌突出顯示 | ✅ |
| 超出數量顯示展開按鈕 | ✅ |
| 展開視圖功能正常 | ✅ |
| 卡牌操作正常傳遞 | ✅ |
| 響應式布局正確 | ✅ |
| 動畫流暢 | ✅ |

---

## 技術決策

### 扇形排列算法

使用角度計算每張卡牌的位置：
- 每張卡的角度：`Math.min(5, 30 / total)`
- 起始角度：`-(total - 1) * spreadAngle / 2`
- Y 偏移：`Math.abs(angle) * 0.5`（弧形效果）

### 選中卡牌顯示面選擇器

當卡牌被選中時，顯示面選擇器讓使用者選擇要使用的性狀面。這是設計決策：先選卡 → 再選面 → 然後操作（拖放到目標）。

### 測試策略

由於 Hand 組件傳遞 `showSideSelector={isCardSelected}` 給 HandCard，選中卡牌時顯示面選擇器而非 action 按鈕。action 按鈕的點擊測試已在 HandCard.test.jsx 中涵蓋，Hand 測試專注於容器層級的功能。

---

## 下一步計劃

工單 0334 完成，繼續執行：
- 工單 0335：CreatureArea 生物區域組件

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
