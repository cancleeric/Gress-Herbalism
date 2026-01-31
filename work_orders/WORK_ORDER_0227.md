# 工作單 0227

## 編號
0227

## 日期
2026-01-31

## 工作單標題
更新專案文檔

## 工單主旨
資料夾結構重組 - 階段六

## 內容

### 目標
更新專案相關文檔，反映新的資料夾結構。

### 需更新的文檔

#### 1. CLAUDE.md
更新架構概述，說明新的模組化結構。

#### 2. docs/ARCHITECTURE.md
更新架構文檔，詳細說明新的目錄結構。

#### 3. README.md
更新專案說明，反映新的結構。

#### 4. work_orders/INDEX.md
新增第九階段：資料夾結構重組。

### CLAUDE.md 更新內容

```markdown
## 架構概述

- **frontend/**: React 18 + Redux 前端應用
  - **components/common/**: 共用組件（登入、大廳、好友等）
  - **components/games/herbalism/**: 本草遊戲專屬組件
  - **components/games/evolution/**: 演化論遊戲專屬組件（待開發）
  - **ai/herbalism/**: 本草 AI 系統
  - **store/herbalism/**: 本草狀態管理

- **backend/**: Node.js + Express 後端服務
  - **logic/herbalism/**: 本草遊戲邏輯
  - **logic/evolution/**: 演化論遊戲邏輯（待開發）
  - **services/**: 共用服務

- **shared/**: 前後端共用的常數和工具函數
  - **constants/**: 模組化常數（common、herbalism、evolution）
```

### 驗收標準

- [ ] CLAUDE.md 已更新
- [ ] docs/ARCHITECTURE.md 已更新
- [ ] README.md 已更新（如需要）
- [ ] work_orders/INDEX.md 已更新
- [ ] docs/PLAN_FOLDER_RESTRUCTURE.md 狀態更新為「已完成」

### 依賴工單
- 0226（執行測試驗證）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
