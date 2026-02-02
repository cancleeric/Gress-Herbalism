# 工單報告 0338：PhaseIndicator 階段指示器組件

## 基本資訊

- **工單編號**：0338
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. PhaseIndicator 組件

建立 `frontend/src/components/games/evolution/board/PhaseIndicator.jsx`：

**功能特性**：
- 回合數顯示（動畫數字）
- 四階段進度條（演化→食物供給→進食→滅絕）
- 當前階段高亮和脈動動畫
- 已過階段標記（連接線填充）
- 當前階段說明（圖示、名稱、描述）
- 當前玩家提示（自己的回合閃爍）

**Props 介面**：
```jsx
{
  currentPhase,   // 當前階段
  round,          // 回合數 (預設 1)
  currentPlayer,  // 當前玩家名稱
  isMyTurn,       // 是否自己的回合
  className,      // 自定義類別
}
```

### 2. 階段設定

| 階段 | 圖示 | 顏色 | 說明 |
|------|------|------|------|
| 演化 | 🧬 | #8b5cf6 | 打出卡牌，建立生物或添加性狀 |
| 食物供給 | 🎲 | #f59e0b | 擲骰決定食物池數量 |
| 進食 | 🍖 | #10b981 | 餵食你的生物 |
| 滅絕 | 💀 | #ef4444 | 未吃飽的生物死亡 |

### 3. PhaseIndicator.css 樣式

**樣式特性**：
- 圓形階段圖示
- 連接線（已過階段填充綠色）
- 當前階段左邊框高亮
- 自己回合藍色漸層背景
- 響應式設計（隱藏階段名稱）

---

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        4.224 s

覆蓋率：
- PhaseIndicator.jsx: 100% statements, 100% lines
```

### 測試涵蓋範圍

**PhaseIndicator.test.jsx (23 tests)**：
- Rendering (5 tests): 基本渲染、各區塊
- Round Display (2 tests): 回合數顯示
- Phase Progress (7 tests): 階段進度、活動/過去狀態、連接線
- Current Phase Info (4 tests): 各階段說明
- Current Player (5 tests): 玩家回合提示

---

## 新增的檔案

### 組件檔案
- `frontend/src/components/games/evolution/board/PhaseIndicator.jsx`
- `frontend/src/components/games/evolution/board/PhaseIndicator.css`

### 測試檔案
- `frontend/src/components/games/evolution/board/__tests__/PhaseIndicator.test.jsx`

### 報告
- `reports/演化論/REPORT_0338.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 回合數正確顯示 | ✅ |
| 四階段進度正確 | ✅ |
| 當前階段高亮 | ✅ |
| 階段說明清晰 | ✅ |
| 玩家回合提示正確 | ✅ |
| 動畫流暢 | ✅ |
| 響應式正確 | ✅ |

---

## 技術決策

### 內建階段常數

為避免導入路徑問題，階段常數直接定義在組件內部。這些常數與 `shared/constants/evolution.js` 中的 `GAME_PHASES` 相對應。

---

## 下一步計劃

工單 0338 完成，繼續執行：
- 工單 0339：ActionLog 行動日誌組件

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
