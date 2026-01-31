# 完成報告 0040

**日期：** 2026-01-24

**工作單標題：** 前端動態 API URL 配置

**工單主旨：** 前端配置 - 支援動態設定後端 API 位址

## 完成內容

### 1. 環境變數範本
已建立 `frontend/.env.example`：
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
```

### 2. 設定檔集中管理
已建立 `frontend/src/config.js`：
```javascript
export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
```

### 3. Socket.io 服務整合
`frontend/src/services/socketService.js` 已使用設定檔：
```javascript
import config from '../config';
const SOCKET_URL = config.socketUrl;
```

## 驗收結果

- [x] 環境變數檔案已建立
- [x] Socket.io 連線使用環境變數
- [x] 設定檔已集中管理
- [x] .gitignore 已更新（.env 不會被提交）
- [x] 修改 .env 後重啟前端可連到不同的後端位址

## 修改的檔案

1. `frontend/.env.example` - 環境變數範本
2. `frontend/src/config.js` - 集中設定檔
3. `frontend/src/services/socketService.js` - 使用設定檔

## 使用說明

1. 複製 `frontend/.env.example` 為 `frontend/.env`
2. 修改 `REACT_APP_API_URL` 和 `REACT_APP_SOCKET_URL` 為 ngrok 產生的 URL
3. 重啟前端服務 (`npm start`)

## 備註

前端現在可以透過環境變數動態設定後端連線位址，方便使用 ngrok 進行外部連線測試。
