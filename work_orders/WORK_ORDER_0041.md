# 工作單 0041

**日期：** 2026-01-23

**工作單標題：** ngrok 雙通道部署（前端與後端）

**工單主旨：** 部署設定 - 同時為前端和後端建立 ngrok 通道

**內容：**

## 背景說明

由於前端（React，port 3000）和後端（Node.js，port 3001）是分開的服務，需要分別為兩者建立 ngrok 通道，讓外部使用者能夠存取。

## 工作內容

1. **啟動後端 ngrok 通道**
   ```bash
   ngrok http 3001
   ```
   - 記錄產生的公開 URL（例如 `https://xxxx-xxx.ngrok.io`）

2. **更新前端環境變數**
   - 修改 `frontend/.env`
     ```
     REACT_APP_API_URL=https://xxxx-xxx.ngrok.io
     REACT_APP_SOCKET_URL=https://xxxx-xxx.ngrok.io
     ```

3. **重啟前端服務**
   ```bash
   cd frontend
   npm start
   ```

4. **啟動前端 ngrok 通道**
   - 開啟新的終端機
   ```bash
   ngrok http 3000
   ```
   - 記錄產生的公開 URL（例如 `https://yyyy-yyy.ngrok.io`）

5. **分享連結給其他玩家**
   - 將前端的 ngrok URL 分享給同學
   - 例如：`https://yyyy-yyy.ngrok.io`

## 使用 ngrok 設定檔（進階，可選）

建立 `ngrok.yml` 同時啟動多個通道：
```yaml
version: "2"
tunnels:
  frontend:
    addr: 3000
    proto: http
  backend:
    addr: 3001
    proto: http
```

啟動指令：
```bash
ngrok start --all
```

## 注意事項

- ngrok 免費版每次啟動會產生不同的 URL
- 每次重啟 ngrok 後需要更新前端的環境變數
- 免費版有連線數和頻寬限制，僅適合測試使用

## 驗收標準

- [ ] 後端 ngrok 通道已建立
- [ ] 前端環境變數已更新為後端 ngrok URL
- [ ] 前端 ngrok 通道已建立
- [ ] 外部使用者可透過 ngrok URL 存取遊戲
- [ ] WebSocket 連線在 ngrok 環境下正常運作
- [ ] 多人遊戲功能在 ngrok 環境下正常運作
