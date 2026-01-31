# 工作單 0290

## 編號
0290

## 日期
2026-01-31

## 工作單標題
單元測試：phaseLogic.js

## 工單主旨
演化論遊戲單元測試 - 階段邏輯

## 內容

### 測試範圍
`backend/logic/evolution/phaseLogic.js`

### 測試項目

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-PHAS-001 | startEvolutionPhase | 演化階段開始 | 正確初始化 |
| UT-PHAS-002 | handleEvolutionPass | 演化跳過 | 正確追蹤跳過狀態 |
| UT-PHAS-003 | startFoodPhase | 食物階段 | 正確計算食物數量 |
| UT-PHAS-004 | rollDice | 骰子公式 | 2人:1d6+2, 3人:2d6, 4人:2d6+2 |
| UT-PHAS-005 | startFeedingPhase | 進食階段開始 | 重置進食狀態 |
| UT-PHAS-006 | startExtinctionPhase | 滅絕階段 | 完整流程處理 |
| UT-PHAS-007 | advancePhase | 階段推進 | 正確狀態機轉換 |
| UT-PHAS-008 | calculateScores | 計分 | 生物+2, 性狀+1+食量加成 |
| UT-PHAS-009 | determineWinner | 勝負判定 | 最高分獲勝 |
| UT-PHAS-010 | checkGameEnd | 遊戲結束 | 牌庫空+滅絕階段結束 |

### 測試方法
使用 Jest 執行單元測試

### 驗收標準
- [ ] 所有測試項目執行完畢
- [ ] 記錄測試結果（通過/失敗）
- [ ] 記錄發現的問題

### 參考文件
- `docs/演化論/TEST_PLAN_EVOLUTION.md`
