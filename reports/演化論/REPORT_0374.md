# 工單 0374 完成報告

## 基本資訊

| 項目 | 內容 |
|------|------|
| 工單編號 | 0374 |
| 工單標題 | 部署與 CI/CD 配置 |
| 完成日期 | 2026-02-07 |
| 所屬計畫 | P2-D 品質保證 |

---

## 完成內容摘要

### 1. CI 工作流程 (`ci.yml`)

| 工作 | 說明 |
|------|------|
| `lint` | 前端/後端 Lint 檢查 |
| `unit-tests` | 單元測試（前端/後端並行） |
| `e2e-tests` | Cypress E2E 測試 |
| `build` | 前端建置檢查 |
| `docker-build` | Docker 映像建置 |

### 2. CD 工作流程 (`deploy.yml`)

| 工作 | 說明 |
|------|------|
| `build-image` | 建置並推送 Docker 映像 |
| `deploy-staging` | 自動部署到測試環境 |
| `deploy-production` | 手動部署到生產環境 |
| `cleanup` | 清理舊映像 |

### 3. Docker 配置

| 檔案 | 說明 |
|------|------|
| `Dockerfile` | 多階段建置、非 root 用戶 |
| `docker-compose.yml` | App + MongoDB + Redis |
| `.dockerignore` | 優化建置大小 |

---

## 新增檔案

```
.github/workflows/
├── ci.yml              # CI 工作流程（160+ 行）
└── deploy.yml          # CD 工作流程（130+ 行）

Dockerfile              # Docker 映像配置（60+ 行）
docker-compose.yml      # Docker Compose（100+ 行）
.dockerignore           # Docker 忽略檔案
```

---

## CI 觸發條件

| 事件 | 分支 |
|------|------|
| push | master, main, develop |
| pull_request | master, main, develop |

---

## CI 流程圖

```
push/PR
  │
  ├── lint ──────────────────┐
  │                          │
  ├── unit-tests (frontend) ─┼── e2e-tests
  │                          │
  ├── unit-tests (backend) ──┘
  │
  └── build ───────── docker-build
```

---

## CD 流程

### 自動部署（Staging）

```
push to master/main
  │
  └── build-image → deploy-staging → cleanup
```

### 手動部署（Production）

```
workflow_dispatch
  │
  └── build-image → deploy-staging → deploy-production → cleanup
```

---

## Docker 服務

| 服務 | 映像 | 端口 |
|------|------|------|
| app | nicholas-game | 3001 |
| mongodb | mongo:7 | 27017 |
| redis | redis:7-alpine | 6379 |
| nginx | nginx:alpine | 80/443 |

---

## 健康檢查

```yaml
healthcheck:
  test: wget http://localhost:3001/api/health
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| NODE_ENV | 環境 | production |
| PORT | 端口 | 3001 |
| MONGODB_URI | MongoDB 連線 | mongodb://mongodb:27017 |
| REDIS_URL | Redis 連線 | redis://redis:6379 |
| JWT_SECRET | JWT 密鑰 | - |

---

## 使用方式

### 本地開發

```bash
# 啟動所有服務
docker-compose up -d

# 僅啟動 app
docker-compose up app

# 包含 nginx
docker-compose --profile with-nginx up -d
```

### 手動部署

1. 前往 GitHub Actions
2. 選擇 "Deploy" workflow
3. 點擊 "Run workflow"
4. 選擇環境（staging/production）

---

## 驗收標準達成

| 項目 | 狀態 |
|------|------|
| CI 自動執行 | ✅ push/PR 觸發 |
| 測試失敗阻止合併 | ✅ lint → tests 依賴 |
| 部署流程正常 | ✅ 自動/手動部署 |
| Docker 可正常運行 | ✅ 多階段建置 |

---

**報告完成**

*撰寫者：Claude Code*
*日期：2026-02-07*
