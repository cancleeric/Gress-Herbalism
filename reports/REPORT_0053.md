# 工單 0053 完成報告

**日期：** 2026-01-24

**工單標題：** 後端 Docker 化與 Cloud Run 部署

**完成狀態：** 完成

## 實作內容

### 1. Dockerfile

**檔案：** `backend/Dockerfile`

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

### 2. .dockerignore

**檔案：** `backend/.dockerignore`

排除不必要的檔案，減少 Docker 映像大小。

### 3. Socket.io 連線穩定性設定

**檔案：** `backend/server.js`

```javascript
const io = new Server(server, {
  cors: { ... },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
});
```

新增心跳機制：
```javascript
socket.on('ping', () => {
  socket.emit('pong');
});
```

### 4. 部署結果

- **服務名稱：** gress-backend
- **區域：** asia-east1
- **URL：** https://gress-backend-130514813450.asia-east1.run.app

### 5. 環境變數設定

```
NODE_ENV=production
ALLOWED_ORIGINS=https://gress-frontend-130514813450.asia-east1.run.app
```

## 驗收項目

- [x] Dockerfile 建立完成
- [x] .dockerignore 建立完成
- [x] 成功部署到 Cloud Run
- [x] 取得後端服務 URL
- [x] WebSocket 連線可用
- [x] 心跳機制實作完成
