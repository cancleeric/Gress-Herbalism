# 工作單 0053

**日期：** 2026-01-24

**工作單標題：** 後端 Docker 化與 Cloud Run 部署

**工單主旨：** 上雲計畫 - 將後端部署至 Google Cloud Run

**內容：**

## 目標

將 Node.js + Socket.io 後端服務容器化並部署到 Cloud Run。

## 前置作業

- [ ] 安裝 Google Cloud CLI
- [ ] 建立 GCP 專案
- [ ] 啟用 Cloud Run API 和 Cloud Build API

## 工作項目

### 1. 建立 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
```

### 2. 建立 .dockerignore

```
node_modules
npm-debug.log
.env
.git
```

### 3. 修改 server.js

- 確保 PORT 從環境變數讀取：`const PORT = process.env.PORT || 3001;`
- 確保監聽 `0.0.0.0`

### 4. 部署指令

```bash
cd backend

gcloud run deploy gress-backend \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --timeout=3600 \
  --session-affinity
```

### 5. 設定環境變數

```bash
gcloud run services update gress-backend \
  --set-env-vars="NODE_ENV=production,ALLOWED_ORIGINS=https://gress-frontend-xxxxx.a.run.app"
```

## 驗收標準

- [ ] Dockerfile 建立完成
- [ ] 本地 Docker 測試通過
- [ ] 成功部署到 Cloud Run
- [ ] 取得後端服務 URL
- [ ] WebSocket 連線測試通過
