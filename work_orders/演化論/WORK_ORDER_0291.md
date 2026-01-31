# 工作單 0291

## 編號
0291

## 日期
2026-01-31

## 工作單標題
單元測試：gameLogic.js

## 工單主旨
演化論遊戲單元測試 - 主遊戲邏輯

## 內容

### 測試範圍
`backend/logic/evolution/gameLogic.js`

### 測試項目

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-GAME-001 | initGame | 遊戲初始化 | 2-4人驗證、發牌、選起始 |
| UT-GAME-002 | validateAction | 動作驗證 | 檢查回合、階段、待處理 |
| UT-GAME-003 | processAction | 創建生物 | 正確處理出牌 |
| UT-GAME-004 | processAction | 添加性狀 | 正確處理性狀放置 |
| UT-GAME-005 | processAction | 進食動作 | 正確處理進食+連鎖 |
| UT-GAME-006 | processAction | 攻擊動作 | 正確處理攻擊流程 |
| UT-GAME-007 | processAction | 防禦回應 | 正確處理防禦選擇 |
| UT-GAME-008 | getGameState | 狀態查詢 | 隱藏對手手牌 |

### 測試方法
使用 Jest 執行單元測試

### 驗收標準
- [ ] 所有測試項目執行完畢
- [ ] 記錄測試結果（通過/失敗）
- [ ] 記錄發現的問題

### 參考文件
- `docs/演化論/TEST_PLAN_EVOLUTION.md`
