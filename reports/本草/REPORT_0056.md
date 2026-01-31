# 工單 0056 完成報告

**日期：** 2026-01-24

**工單標題：** 上雲整合測試與上線

**完成狀態：** 完成

## 部署架構

```
玩家瀏覽器
    ↓
Cloud Run (前端)
https://gress-frontend-130514813450.asia-east1.run.app
    ↓
Cloud Run (後端)
https://gress-backend-130514813450.asia-east1.run.app
    ↓
Supabase (PostgreSQL 資料庫)
    ↓
Firebase Authentication (登入驗證)
```

## 服務資訊

| 服務 | URL | 區域 |
|------|-----|------|
| 前端 | https://gress-frontend-130514813450.asia-east1.run.app | asia-east1 |
| 後端 | https://gress-backend-130514813450.asia-east1.run.app | asia-east1 |

## 測試結果

### 連線測試

- [x] 前端網頁可正常載入
- [x] 前端可連線到後端 WebSocket
- [x] 後端可連線到資料庫（Supabase）
- [x] Firebase 登入功能正常

### 遊戲功能

- [x] 建立房間
- [x] 加入房間
- [x] 開始遊戲
- [x] WebSocket 即時通訊

### 連線穩定性改進

- [x] 無限重連機制
- [x] 心跳保持連線
- [x] 自動重連斷線

## 設定完成項目

### Firebase 授權網域

已加入：`gress-frontend-130514813450.asia-east1.run.app`

### 後端 CORS 設定

```
ALLOWED_ORIGINS=https://gress-frontend-130514813450.asia-east1.run.app
```

## 上線網址

**遊戲網址：** https://gress-frontend-130514813450.asia-east1.run.app

可分享給同學一起遊玩！

## 成本估算

Cloud Run 免費額度：
- 每月 200 萬次請求免費
- 每月 360,000 GB-秒免費
- 閒置時自動縮放至 0，不收費

預計在免費額度內使用。

## 驗收項目

- [x] 所有服務部署完成
- [x] 前後端連線正常
- [x] Firebase 登入正常
- [x] 遊戲可正常遊玩
- [x] 可分享網址給其他玩家
