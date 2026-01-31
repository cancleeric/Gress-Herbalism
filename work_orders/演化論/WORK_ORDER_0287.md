# 工作單 0287

## 編號
0287

## 日期
2026-01-31

## 工作單標題
單元測試：cardLogic.js

## 工單主旨
演化論遊戲單元測試 - 卡牌系統邏輯

## 內容

### 測試範圍
`backend/logic/evolution/cardLogic.js`

### 測試項目

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-CARD-001 | createDeck | 創建牌庫 | 生成 84 張卡牌 |
| UT-CARD-002 | shuffleDeck | 洗牌 | 牌序隨機化 |
| UT-CARD-003 | drawCards | 抽牌 | 正確返回指定數量卡牌 |
| UT-CARD-004 | validateDeck | 驗證牌庫 | 確認完整性 |
| UT-CARD-005 | getTraitInfo | 取得性狀資訊 | 返回正確性狀資料 |
| UT-CARD-006 | validateTraitPlacement | 寄生蟲驗證 | 只能放對手生物 |
| UT-CARD-007 | validateTraitPlacement | 互動性狀驗證 | 需要兩隻生物 |

### 測試方法
使用 Jest 執行單元測試，直接調用 cardLogic.js 導出的函數

### 驗收標準
- [ ] 所有測試項目執行完畢
- [ ] 記錄測試結果（通過/失敗）
- [ ] 記錄發現的問題

### 參考文件
- `docs/演化論/TEST_PLAN_EVOLUTION.md`
- `shared/constants/evolution.js`
