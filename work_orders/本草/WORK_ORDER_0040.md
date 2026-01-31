# 工作單 0040

**日期：** 2026-01-23

**工作單標題：** 前端動態 API URL 配置

**工單主旨：** 前端配置 - 支援動態設定後端 API 位址

**內容：**

## 背景說明

前端目前可能寫死連接 `localhost:3001`（後端），但使用 ngrok 時，前端和後端會有不同的公開 URL，需要讓前端能夠動態設定後端位址。

## 工作內容

1. **建立環境變數配置**
   - 建立 `.env` 檔案（前端）
     ```
     REACT_APP_API_URL=http://localhost:3001
     REACT_APP_SOCKET_URL=http://localhost:3001
     ```
   - 建立 `.env.example` 作為範本

2. **更新 API 服務層**
   - 修改 `frontend/src/services/` 中的 API 呼叫
     ```javascript
     const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

     // 使用 API_URL 而非寫死的位址
     fetch(`${API_URL}/api/rooms`)
     ```

3. **更新 Socket.io 連線**
   ```javascript
   const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

   const socket = io(SOCKET_URL, {
     // 連線設定
   });
   ```

4. **建立設定檔集中管理**
   - 建立 `frontend/src/config.js`
     ```javascript
     export const config = {
       apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
       socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001',
     };
     ```

5. **更新 .gitignore**
   - 確保 `.env` 不會被提交
   - `.env.example` 可以提交作為範本

## 驗收標準

- [ ] 環境變數檔案已建立
- [ ] API 服務使用環境變數
- [ ] Socket.io 連線使用環境變數
- [ ] 設定檔已集中管理
- [ ] .gitignore 已更新
- [ ] 修改 .env 後重啟前端可連到不同的後端位址
