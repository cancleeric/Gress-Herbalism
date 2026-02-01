# 工單 0355：玩家個人統計 API

## 基本資訊
- **工單編號**：0355
- **所屬計畫**：P2-C 資料庫統計
- **前置工單**：0352
- **預計影響檔案**：
  - `backend/routes/evolution/stats.js`（新增）
  - `backend/controllers/evolution/statsController.js`（新增）

## 目標
建立玩家統計 API

## 詳細規格
- GET /api/evolution/stats/:userId - 玩家統計
- GET /api/evolution/stats/:userId/history - 遊戲歷史
- GET /api/evolution/stats/:userId/achievements - 成就列表
- 支援時間區間篩選

## 驗收標準
1. [ ] API 端點正確回應
2. [ ] 權限驗證正確
3. [ ] 歷史分頁正常
4. [ ] 統計計算正確
