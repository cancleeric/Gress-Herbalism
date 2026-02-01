# 工單 0370：錯誤監控整合（Sentry）

## 基本資訊
- **工單編號**：0370
- **所屬計畫**：P2-D 品質保證
- **前置工單**：0348
- **預計影響檔案**：
  - `frontend/src/services/sentry.js`
  - `backend/services/sentry.js`
  - `frontend/src/index.js`
  - `backend/server.js`

## 目標
整合 Sentry 錯誤監控

## 詳細規格
### 前端
- 初始化 Sentry
- 捕捉未處理錯誤
- 遊戲狀態 context
- 使用者識別

### 後端
- 初始化 Sentry
- Express 錯誤中介
- Socket.io 錯誤捕捉

## 驗收標準
1. [ ] 錯誤正確上報
2. [ ] 包含足夠 context
3. [ ] 不影響效能
