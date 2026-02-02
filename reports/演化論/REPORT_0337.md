# 工單報告 0337：GameBoard 遊戲主板組件

## 基本資訊

- **工單編號**：0337
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. GameBoard 組件

建立 `frontend/src/components/games/evolution/board/GameBoard.jsx`：

**功能特性**：
- 整合 PlayerBoard、FoodPool 組件
- 支援 2/3/4 人布局（CSS Grid）
- 玩家順序重排（自己在下方）
- 階段/回合資訊顯示
- 牌庫剩餘數量顯示
- DndProvider 包裝（拖放支援）
- 動作事件傳遞（onAction）

**Props 介面**：
```jsx
{
  gameState,           // 遊戲狀態 (必要)
  myPlayerId,          // 自己的玩家 ID (必要)
  currentPhase,        // 當前階段
  currentPlayerIndex,  // 當前玩家索引
  onAction,            // 動作回調
  className,           // 自定義類別
}
```

### 2. GameBoard.css 樣式

**樣式特性**：
- CSS Grid 多人布局（2p/3p/4p）
- 階段指示器（脈動動畫）
- 中央區域（食物池、牌庫）
- 響應式設計（1024px、768px、480px）

### 3. 階段顯示名稱

內建 `getPhaseDisplayName` 函數：
- evolution → 演化階段
- food_supply → 食物供給
- feeding → 進食階段
- extinction → 滅絕階段

---

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        3.832 s

覆蓋率：
- GameBoard.jsx: 80.55% statements, 82.35% lines
```

### 測試涵蓋範圍

**GameBoard.test.jsx (23 tests)**：
- Rendering (6 tests): 基本渲染、各區域
- Layout Classes (3 tests): 2p/3p/4p 布局
- Phase Display (5 tests): 回合、階段、輪到你
- Deck Info (2 tests): 牌庫數量
- Player Ordering (2 tests): 對手數量
- Actions (2 tests): takeFood、rollFood
- Food Pool Integration (3 tests): 擲骰按鈕、取食

---

## 新增的檔案

### 組件檔案
- `frontend/src/components/games/evolution/board/GameBoard.jsx`
- `frontend/src/components/games/evolution/board/GameBoard.css`

### 測試檔案
- `frontend/src/components/games/evolution/board/__tests__/GameBoard.test.jsx`

### 報告
- `reports/演化論/REPORT_0337.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 2/3/4 人布局正確 | ✅ |
| 玩家順序正確排列 | ✅ |
| 中央區域元素正確 | ✅ |
| 拖放功能正常 | ✅ |
| 觸控設備支援 | ⏸️ (預留) |
| 響應式布局正確 | ✅ |
| 動作正確傳遞 | ✅ |

---

## 技術決策

### 簡化版本

工單規格依賴 PhaseIndicator 和 ActionLog 組件，這些尚未建立。本實作使用內建的階段顯示區域替代，待後續工單完成後可替換。

### Store 依賴移除

將 `currentPhase` 和 `currentPlayerIndex` 改為 props 傳入，避免與 Zustand store 耦合，提高組件可測試性。

### isRolling 狀態

isRolling 改為從 `gameState.isRolling` 讀取，而非基於階段判斷，讓 UI 狀態與實際擲骰動作同步。

---

## 下一步計劃

工單 0337 完成，繼續執行：
- 工單 0338：PhaseIndicator 階段指示器組件

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
