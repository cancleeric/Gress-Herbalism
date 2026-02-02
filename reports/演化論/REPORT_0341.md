# 工單報告 0341：拖放目標區域組件

## 基本資訊

- **工單編號**：0341
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. DropZone.jsx - 通用拖放目標區域

**功能**：
- useDrop 整合
- 有效/無效狀態視覺反饋
- 支援 placeholder 佔位
- activeLabel / invalidLabel 提示標籤
- disabled 狀態
- 自定義 className
- framer-motion 動畫效果

**Props**：
- `accept` - 接受的拖放類型（必填）
- `onDrop` - 放置回調
- `canDrop` - 自定義放置驗證
- `placeholder` - 空狀態佔位內容
- `activeLabel` - 有效狀態標籤
- `invalidLabel` - 無效狀態標籤
- `disabled` - 禁用狀態
- `className` - 自定義類別

### 2. NewCreatureZone.jsx - 新建生物區域

**功能**：
- 基於 DropZone 建構
- 只接受 HAND_CARD 類型
- AnimatePresence 進入/退出動畫
- 內建佔位內容（圖示 + 提示文字）
- 可見性控制

**Props**：
- `onCreateCreature` - 創建生物回調
- `disabled` - 禁用狀態
- `visible` - 可見性控制
- `className` - 自定義類別

### 3. 樣式檔案

**DropZone.css**：
- 基礎樣式（虛線邊框、圓角）
- 狀態樣式（active 綠色、invalid 紅色）
- 禁用樣式
- 標籤定位

**NewCreatureZone.css**：
- 容器尺寸限制
- 內容排版（圖示 + 文字）

---

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.036 s

覆蓋率：
- DropZone.jsx: 84.61%
- NewCreatureZone.jsx: 100%
- 整體: 89.47%
```

### 測試涵蓋範圍

**dropZone.test.jsx (25 tests)**：

DropZone (16 tests)：
- 渲染預設狀態
- 渲染 children
- placeholder 顯示邏輯
- 自定義 className
- disabled 狀態
- active 狀態與標籤
- invalid 狀態與標籤
- useDrop 配置驗證
- canDrop 回調處理
- onDrop 回調處理

NewCreatureZone (9 tests)：
- 可見性控制
- placeholder 內容
- 自定義 className
- accept 類型驗證
- onCreateCreature 回調
- disabled 狀態傳遞

---

## 新增的檔案

### 組件/模組檔案
- `frontend/src/components/games/evolution/dnd/DropZone.jsx`
- `frontend/src/components/games/evolution/dnd/DropZone.css`
- `frontend/src/components/games/evolution/dnd/NewCreatureZone.jsx`
- `frontend/src/components/games/evolution/dnd/NewCreatureZone.css`

### 測試檔案
- `frontend/src/components/games/evolution/dnd/__tests__/dropZone.test.jsx`

### 更新的檔案
- `frontend/src/components/games/evolution/dnd/index.js`（新增 exports）

### 報告
- `reports/演化論/REPORT_0341.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| DropZone 正確接受拖放 | ✅ |
| 有效/無效狀態視覺反饋 | ✅ |
| 新建生物區域功能正常 | ✅ |
| 動畫效果流暢 | ✅ |
| disabled 狀態正確 | ✅ |
| 標籤正確顯示 | ✅ |
| 與卡牌組件整合正常 | ✅ |

---

## 技術決策

### 組件分離

將通用 DropZone 與特定用途的 NewCreatureZone 分開，保持良好的組件復用性。NewCreatureZone 基於 DropZone 建構，只需關注特定業務邏輯。

### Test ID 添加

在組件中添加 data-testid 屬性，方便測試時定位元素，同時不影響生產環境。

---

## 下一步計劃

工單 0341 完成，繼續執行：
- 工單 0342：可拖動卡牌組件

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
