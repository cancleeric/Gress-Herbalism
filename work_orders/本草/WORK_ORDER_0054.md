# 工作單 0054

**日期：** 2026-01-24

**工作單標題：** 前端 Docker 化與 Cloud Run 部署

**工單主旨：** 上雲計畫 - 將前端部署至 Google Cloud Run

**內容：**

## 目標

將 React 前端打包並透過 Nginx 部署到 Cloud Run。

## 依賴

- 工單 0053（後端部署）完成，取得後端 URL

## 工作項目

### 1. 建立 Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 建立 nginx.conf

```nginx
# frontend/nginx.conf
server {
    listen 8080;
    server_name _;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Gzip 壓縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 3. 建立 .dockerignore

```
node_modules
npm-debug.log
.env
.git
build
```

### 4. 設定生產環境變數

```bash
# frontend/.env.production
REACT_APP_API_URL=https://gress-backend-xxxxx.a.run.app
REACT_APP_SOCKET_URL=https://gress-backend-xxxxx.a.run.app
```

### 5. 部署指令

```bash
cd frontend

gcloud run deploy gress-frontend \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 128Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2
```

## 驗收標準

- [ ] Dockerfile 建立完成
- [ ] nginx.conf 建立完成
- [ ] .env.production 設定正確的後端 URL
- [ ] 本地 Docker 測試通過
- [ ] 成功部署到 Cloud Run
- [ ] 前端可正常載入
- [ ] 前端可連線到後端 WebSocket
