# 工作單 0067

**日期：** 2026-01-24

**工作單標題：** 測試覆蓋率報告與 CI 整合

**工單主旨：** 提升測試覆蓋率 - 建立測試覆蓋率追蹤與 CI/CD 整合

**分類：** 測試

---

## 目標

建立完整的測試覆蓋率報告機制，並整合到 CI/CD 流程中，確保程式碼品質。

## 背景

測試撰寫完成後，需要：
- 追蹤測試覆蓋率變化
- 自動化執行測試
- 防止覆蓋率下降
- 產生可視化報告

## 工作項目

### 1. 前端覆蓋率設定

**jest.config.js 更新：**
```javascript
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js',
    '!src/**/*.test.{js,jsx}',
    '!src/__tests__/**',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary']
};
```

### 2. 後端覆蓋率設定

**backend/jest.config.js：**
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!jest.config.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary']
};
```

### 3. GitHub Actions CI 設定

**.github/workflows/test.yml：**
```yaml
name: Test Suite

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  frontend-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run tests with coverage
        working-directory: ./frontend
        run: npm test -- --coverage --watchAll=false

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./frontend/coverage
          flags: frontend
          name: frontend-coverage

  backend-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run tests with coverage
        working-directory: ./backend
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage
          flags: backend
          name: backend-coverage

  e2e-test:
    runs-on: ubuntu-latest
    needs: [frontend-test, backend-test]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci

      - name: Install Playwright browsers
        working-directory: ./frontend
        run: npx playwright install --with-deps

      - name: Run E2E tests
        working-directory: ./frontend
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload E2E test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30
```

### 4. Codecov 設定

**codecov.yml：**
```yaml
codecov:
  require_ci_to_pass: yes

coverage:
  precision: 2
  round: down
  range: "60...100"

  status:
    project:
      default:
        target: auto
        threshold: 2%
        if_ci_failed: error
    patch:
      default:
        target: 80%
        threshold: 2%

parsers:
  gcov:
    branch_detection:
      conditional: yes
      loop: yes
      method: no
      macro: no

comment:
  layout: "reach,diff,flags,files,footer"
  behavior: default
  require_changes: no
```

### 5. 覆蓋率徽章

**README.md 新增徽章：**
```markdown
[![codecov](https://codecov.io/gh/username/gress/branch/main/graph/badge.svg)](https://codecov.io/gh/username/gress)
[![Tests](https://github.com/username/gress/actions/workflows/test.yml/badge.svg)](https://github.com/username/gress/actions/workflows/test.yml)
```

### 6. Pre-commit Hook（選用）

**package.json 根目錄新增：**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:staged"
    }
  },
  "lint-staged": {
    "frontend/src/**/*.{js,jsx}": [
      "npm test -- --findRelatedTests --passWithNoTests"
    ],
    "backend/**/*.js": [
      "npm test -- --findRelatedTests --passWithNoTests"
    ]
  }
}
```

### 7. 本地覆蓋率報告腳本

**package.json（根目錄）：**
```json
{
  "scripts": {
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm test -- --coverage --watchAll=false",
    "test:backend": "cd backend && npm test -- --coverage",
    "test:e2e": "cd frontend && npm run test:e2e",
    "test:all": "npm run test && npm run test:e2e",
    "coverage:report": "open frontend/coverage/lcov-report/index.html && open backend/coverage/lcov-report/index.html"
  }
}
```

## 目標覆蓋率

| 模組 | 目標覆蓋率 |
|------|-----------|
| 前端 Utils | 90% |
| 前端 Services | 85% |
| 前端 Components | 75% |
| 後端 Services | 85% |
| 後端 Socket.io | 80% |
| 整體 | 80% |

## 驗收標準

- [ ] 前端測試覆蓋率 > 75%
- [ ] 後端測試覆蓋率 > 75%
- [ ] GitHub Actions CI 設定完成
- [ ] Codecov 整合完成
- [ ] PR 自動顯示覆蓋率變化
- [ ] README 顯示覆蓋率徽章
- [ ] 覆蓋率低於閾值時 CI 失敗
