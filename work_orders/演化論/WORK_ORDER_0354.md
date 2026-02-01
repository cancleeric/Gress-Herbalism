# 工單 0354：排行榜 API

## 基本資訊
- **工單編號**：0354
- **所屬計畫**：P2-C 資料庫統計
- **前置工單**：0352
- **預計影響檔案**：
  - `backend/routes/evolution/leaderboard.js`（新增）
  - `backend/controllers/evolution/leaderboardController.js`（新增）

## 目標
建立排行榜 API 端點

## 詳細規格
- GET /api/evolution/leaderboard - 總排行榜
- GET /api/evolution/leaderboard/daily - 每日排行榜
- GET /api/evolution/leaderboard/weekly - 每週排行榜
- 支援分頁和排序參數

## 驗收標準
1. [ ] API 端點正確回應
2. [ ] 分頁功能正常
3. [ ] 快取機制（Redis/記憶體）
4. [ ] 錯誤處理完善
