# 上雲計畫書

**專案名稱：** Gress 推理桌遊
**日期：** 2026-01-24
**目標：** 將遊戲部署至 Google Cloud Platform，實現多人線上遊玩

---

## 一、架構概覽

```
┌─────────────────────────────────────────────────────────┐
│                      使用者                              │
│                   (瀏覽器/手機)                          │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────────────┐
│                  Cloud Run (前端)                        │
│              React 靜態網站 + Nginx                      │
│                  (免費方案)                              │
└─────────────────┬───────────────────────────────────────┘
                  │ WebSocket / HTTPS
                  ▼
┌─────────────────────────────────────────────────────────┐
│                  Cloud Run (後端)                        │
│              Node.js + Socket.io                        │
│                  (免費方案)                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Cloud SQL (PostgreSQL)                     │
│              儲存玩家分數、遊戲記錄                       │
│           (免費試用 90 天 / 或用替代方案)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 二、服務選擇與費用

### Cloud Run（免費額度，每月）

| 項目 | 免費額度 | 預估用量 | 是否足夠 |
|------|---------|---------|---------|
| 請求數 | 200 萬次 | < 10 萬次 | ✅ 足夠 |
| CPU | 18 萬 vCPU-秒 | < 5 萬 | ✅ 足夠 |
| 記憶體 | 36 萬 GB-秒 | < 10 萬 | ✅ 足夠 |
| 網路輸出 | 1 GB | < 1 GB | ✅ 足夠 |

**結論：小型專案基本免費**

### Cloud SQL PostgreSQL（⚠️ 注意）

| 方案 | 說明 |
|------|------|
| 免費試用 | 新帳號 90 天 $300 美元額度 |
| 試用結束後 | 最小實例約 $7-10/月 |

**免費替代方案（推薦）：**

| 服務 | 免費額度 | 特點 |
|------|---------|------|
| **Supabase** | 500 MB、50,000 列 | PostgreSQL、有 API |
| **Neon** | 512 MB | PostgreSQL、無伺服器 |
| **PlanetScale** | 5 GB | MySQL、自動擴展 |
| **Railway** | $5/月額度 | 簡單好用 |

**建議：使用 Supabase 或 Neon 作為免費資料庫**

---

## 三、部署步驟

### 階段一：準備工作

#### 1. 安裝 Google Cloud CLI
```bash
# Windows (PowerShell)
winget install Google.CloudSDK

# 登入
gcloud auth login

# 設定專案
gcloud projects create gress-game --name="Gress Game"
gcloud config set project gress-game
```

#### 2. 啟用必要服務
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com  # 如果用 Cloud SQL
```

### 階段二：後端部署

#### 1. 建立 Dockerfile（後端）
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

#### 2. 部署後端到 Cloud Run
```bash
cd backend

# 建置並部署
gcloud run deploy gress-backend \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2
```

#### 3. 記下後端 URL
部署完成會顯示類似：
```
Service URL: https://gress-backend-xxxxx-de.a.run.app
```

### 階段三：前端部署

#### 1. 設定環境變數
```bash
# frontend/.env.production
REACT_APP_API_URL=https://gress-backend-xxxxx-de.a.run.app
REACT_APP_SOCKET_URL=https://gress-backend-xxxxx-de.a.run.app
```

#### 2. 建立 Dockerfile（前端）
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

#### 3. 建立 Nginx 設定
```nginx
# frontend/nginx.conf
server {
    listen 8080;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 4. 部署前端到 Cloud Run
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

### 階段四：資料庫設定（使用 Supabase 免費方案）

#### 1. 註冊 Supabase
1. 前往 [supabase.com](https://supabase.com)
2. 用 GitHub 帳號登入
3. 建立新專案

#### 2. 建立資料表
```sql
-- 玩家分數記錄
CREATE TABLE player_scores (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 遊戲歷史記錄
CREATE TABLE game_history (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  winner_name VARCHAR(50),
  player_count INTEGER,
  rounds_played INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. 取得連線資訊
在 Supabase Dashboard → Settings → Database 取得：
- Host
- Database name
- User
- Password

#### 4. 設定後端環境變數
```bash
gcloud run services update gress-backend \
  --set-env-vars="DATABASE_URL=postgresql://user:password@host:5432/dbname"
```

---

## 四、WebSocket 注意事項

Cloud Run 支援 WebSocket，但需要注意：

1. **連線逾時**：預設 5 分鐘，可設定最長 60 分鐘
   ```bash
   gcloud run services update gress-backend \
     --timeout=3600
   ```

2. **Session Affinity**：確保同一用戶連到同一實例
   ```bash
   gcloud run services update gress-backend \
     --session-affinity
   ```

---

## 五、預估費用

| 項目 | 月費用 |
|------|--------|
| Cloud Run (前端) | $0（免費額度內） |
| Cloud Run (後端) | $0（免費額度內） |
| Supabase (資料庫) | $0（免費方案） |
| **總計** | **$0** |

---

## 六、部署檢查清單

- [ ] 安裝 Google Cloud CLI
- [ ] 建立 GCP 專案
- [ ] 啟用必要 API
- [ ] 建立後端 Dockerfile
- [ ] 部署後端到 Cloud Run
- [ ] 設定 WebSocket 支援（timeout、session affinity）
- [ ] 建立前端 Dockerfile 和 nginx.conf
- [ ] 設定前端環境變數（後端 URL）
- [ ] 部署前端到 Cloud Run
- [ ] 註冊 Supabase 並建立資料表
- [ ] 設定後端資料庫連線
- [ ] 測試完整遊戲流程
- [ ] 分享網址給同學測試

---

## 七、上線後網址

部署完成後，你會得到：

- **前端網址**：`https://gress-frontend-xxxxx.a.run.app`
- **後端網址**：`https://gress-backend-xxxxx.a.run.app`

把前端網址分享給同學，就可以一起玩了！
