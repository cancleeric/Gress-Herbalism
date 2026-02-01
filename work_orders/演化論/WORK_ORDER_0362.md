# 工單 0362：離線狀態處理

## 基本資訊
- **工單編號**：0362
- **所屬計畫**：P2-D 品質保證
- **前置工單**：0361
- **預計影響檔案**：
  - `backend/services/evolution/offlineHandler.js`
  - `frontend/src/components/games/evolution/OfflineIndicator.jsx`

## 目標
處理玩家離線情況

## 詳細規格
- 離線玩家標記
- 自動跳過離線玩家回合
- 離線超時踢出（可配置）
- AI 接管選項（未來擴展）

## 驗收標準
1. [ ] 離線狀態正確標記
2. [ ] 回合自動跳過
3. [ ] 超時處理正確
4. [ ] 遊戲流程不中斷
