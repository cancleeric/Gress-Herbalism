# Nicholas Game - Docker 配置
# 工單 0374

# ===== 建置階段：前端 =====
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 安裝依賴
COPY frontend/package*.json ./
RUN npm ci --only=production

# 複製原始碼並建置
COPY frontend/ ./
RUN npm run build

# ===== 建置階段：後端 =====
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# 安裝依賴
COPY backend/package*.json ./
RUN npm ci --only=production

# ===== 運行階段 =====
FROM node:18-alpine AS runtime

# 安全性：使用非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 複製後端依賴和程式碼
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# 複製前端建置結果
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# 複製共用檔案
COPY shared/ ./shared/
COPY package.json ./

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=3001

# 切換到非 root 用戶
USER nodejs

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# 暴露端口
EXPOSE ${PORT}

# 啟動指令
WORKDIR /app/backend
CMD ["node", "server.js"]
