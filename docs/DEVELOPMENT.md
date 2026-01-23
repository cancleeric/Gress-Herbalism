# 開發指南

## 環境設定

### 系統需求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本

### 安裝步驟

1. 克隆專案

```bash
git clone <repository-url>
cd gress
```

2. 安裝前端依賴

```bash
cd frontend
npm install
```

3. 安裝後端依賴（如需要）

```bash
cd backend
npm install
```

## 開發模式

### 啟動前端開發伺服器

```bash
cd frontend
npm start
```

應用程式將在 `http://localhost:3000` 啟動，支援熱重載。

### 啟動後端開發伺服器

```bash
cd backend
npm run dev
```

## 代碼規範

### JavaScript/React 規範

- 使用 ES6+ 語法
- 組件使用函數式組件和 Hooks
- 使用 PropTypes 進行類型檢查
- 每個組件都應有對應的測試檔案

### 命名規範

- **組件**：PascalCase（如 `GameBoard`）
- **函數**：camelCase（如 `handleSubmit`）
- **常數**：UPPER_SNAKE_CASE（如 `GAME_PHASE_PLAYING`）
- **檔案**：組件檔案使用 PascalCase，其他使用 camelCase

### 檔案結構

```
frontend/src/
├── components/           # React 組件
│   └── ComponentName/
│       ├── ComponentName.js
│       ├── ComponentName.test.js
│       ├── ComponentName.css
│       └── index.js
├── services/            # 服務層
├── store/               # Redux 狀態管理
├── utils/               # 工具函數
├── shared/              # 共享代碼（常數等）
└── styles/              # 全域樣式
```

## 測試指南

### 執行所有測試

```bash
cd frontend
npm test
```

### 執行特定測試

```bash
npm test -- --testPathPattern="ComponentName"
```

### 執行測試並生成覆蓋率報告

```bash
npm test -- --coverage --watchAll=false
```

### 測試規範

- 每個組件都應有對應的測試檔案（`.test.js`）
- 使用 `@testing-library/react` 進行組件測試
- 使用 Jest 進行單元測試
- 測試覆蓋率目標：80% 以上

### 測試結構

```javascript
describe('ComponentName', () => {
  describe('渲染', () => {
    it('應正確渲染組件', () => {
      // ...
    });
  });

  describe('功能', () => {
    it('應處理用戶交互', () => {
      // ...
    });
  });
});
```

## Git 工作流程

### 分支策略

- `master`：主分支，包含穩定版本
- `feature/*`：功能分支
- `bugfix/*`：修復分支

### 提交訊息規範

使用以下格式：

```
Work Order XXXX: 簡短描述

- 詳細變更說明
- 另一個變更

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### 提交前檢查

1. 確保所有測試通過
2. 確保代碼符合規範
3. 更新相關文檔（如需要）

## 常見問題

### 測試執行緩慢

嘗試使用 `--maxWorkers=50%` 參數限制並行數量：

```bash
npm test -- --maxWorkers=50%
```

### 熱重載不工作

1. 確保沒有語法錯誤
2. 嘗試重啟開發伺服器
3. 清除瀏覽器快取

### 依賴安裝失敗

1. 刪除 `node_modules` 和 `package-lock.json`
2. 重新執行 `npm install`

## 相關資源

- [React 文檔](https://react.dev/)
- [Redux 文檔](https://redux.js.org/)
- [Jest 文檔](https://jestjs.io/)
- [Testing Library 文檔](https://testing-library.com/)
