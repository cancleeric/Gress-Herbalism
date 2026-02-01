# 工單 0356：遊戲回放系統

## 基本資訊
- **工單編號**：0356
- **所屬計畫**：P2-C 資料庫統計
- **前置工單**：0351, 0352
- **預計影響檔案**：
  - `backend/services/evolution/replayService.js`（新增）
  - `frontend/src/components/games/evolution/replay/ReplayPlayer.jsx`（新增）

## 目標
實現遊戲回放功能

## 詳細規格
- 記錄遊戲所有事件
- 事件壓縮儲存
- 回放播放器組件
- 播放速度控制

## 驗收標準
1. [ ] 事件記錄完整
2. [ ] 回放播放正確
3. [ ] 播放控制正常
4. [ ] 儲存效率良好
