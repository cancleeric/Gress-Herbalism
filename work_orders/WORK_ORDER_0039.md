# 工作單 0039

**日期：** 2026-01-23

**工作單標題：** 後端支援外部連線配置

**工單主旨：** 後端配置 - 設定 CORS 與 WebSocket 支援外部連線

**內容：**

## 背景說明

當使用 ngrok 建立公開連結時，外部請求會從不同的網域（ngrok.io）進來，後端需要正確處理跨域請求（CORS）和 WebSocket 連線。

## 工作內容

1. **檢查並更新 CORS 設定**
   - 確認 Express 的 CORS 中介軟體已安裝
     ```bash
     npm install cors
     ```
   - 更新 CORS 設定允許 ngrok 網域
     ```javascript
     const cors = require('cors');

     // 開發環境允許所有來源
     app.use(cors({
       origin: true,  // 或指定允許的網域
       credentials: true
     }));
     ```

2. **更新 WebSocket/Socket.io CORS 設定**
   ```javascript
   const io = require('socket.io')(server, {
     cors: {
       origin: true,  // 允許所有來源（開發環境）
       methods: ['GET', 'POST'],
       credentials: true
     }
   });
   ```

3. **設定環境變數支援**
   - 建立 `.env` 檔案範本
   - 支援透過環境變數設定允許的來源網域
     ```javascript
     const allowedOrigins = process.env.ALLOWED_ORIGINS
       ? process.env.ALLOWED_ORIGINS.split(',')
       : ['http://localhost:3000'];
     ```

4. **確認後端監聽所有網路介面**
   ```javascript
   // 確保監聽 0.0.0.0 而非只有 localhost
   server.listen(PORT, '0.0.0.0', () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

## 驗收標準

- [ ] CORS 中介軟體已正確設定
- [ ] Socket.io CORS 已正確設定
- [ ] 後端監聽 0.0.0.0
- [ ] 環境變數支援已實作
- [ ] 從外部網域可以成功連線到後端 API
