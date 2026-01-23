# 部署指南

## 前端部署

### 建置生產版本

```bash
cd frontend
npm run build
```

建置完成後，產出檔案位於 `frontend/build/` 目錄。

### 靜態檔案伺服器

可以使用任何靜態檔案伺服器部署：

#### 使用 serve

```bash
npm install -g serve
serve -s build
```

#### 使用 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 靜態資源快取
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 環境變數

建立 `.env.production` 檔案：

```env
# API 伺服器位址
REACT_APP_API_URL=https://api.your-domain.com

# 其他設定
REACT_APP_ENV=production
```

---

## 後端部署（如需要）

### 環境變數

建立 `.env` 檔案：

```env
# 伺服器設定
PORT=3001
NODE_ENV=production

# CORS 設定
CORS_ORIGIN=https://your-domain.com
```

### 使用 PM2

```bash
# 安裝 PM2
npm install -g pm2

# 啟動應用
pm2 start backend/server.js --name "herbalism-api"

# 設定開機自動啟動
pm2 startup
pm2 save
```

### PM2 配置檔案

建立 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'herbalism-api',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

---

## Docker 部署

### Dockerfile（前端）

```dockerfile
# 建置階段
FROM node:18-alpine as build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# 生產階段
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    restart: unless-stopped

  # 如需後端
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### 使用 Docker Compose

```bash
# 建置並啟動
docker-compose up -d --build

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

---

## 雲端平台部署

### Vercel（前端）

1. 連接 GitHub 倉庫
2. 設定建置指令：`npm run build`
3. 設定輸出目錄：`build`
4. 部署

### Netlify（前端）

1. 連接 GitHub 倉庫
2. 設定建置指令：`cd frontend && npm install && npm run build`
3. 設定發布目錄：`frontend/build`
4. 部署

### Railway（全端）

1. 連接 GitHub 倉庫
2. 設定環境變數
3. 部署

---

## 部署檢查清單

### 部署前

- [ ] 所有測試通過
- [ ] 環境變數已設定
- [ ] 建置成功無錯誤
- [ ] 資產檔案已優化

### 部署後

- [ ] 網站可正常訪問
- [ ] 功能正常運作
- [ ] 無 Console 錯誤
- [ ] 效能監控已設定

---

## 監控和維護

### 前端監控

- 使用瀏覽器開發工具檢查效能
- 設定 Error Tracking（如 Sentry）

### 後端監控（如適用）

- 設定健康檢查端點
- 使用 PM2 監控
- 設定日誌記錄

### 備份策略

- 定期備份設定檔
- 版本控制所有配置
