# 工作單 0288

## 編號
0288

## 日期
2026-01-31

## 工作單標題
單元測試：creatureLogic.js

## 工單主旨
演化論遊戲單元測試 - 生物系統邏輯

## 內容

### 測試範圍
`backend/logic/evolution/creatureLogic.js`

### 測試項目

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-CREA-001 | createCreature | 創建生物 | 正確初始化屬性 |
| UT-CREA-002 | addTrait | 添加性狀 | 正確添加且不重複 |
| UT-CREA-003 | removeTrait | 移除性狀 | 正確移除 |
| UT-CREA-004 | calculateFoodNeed | 計算食量 | 基礎1 + 性狀加成 |
| UT-CREA-005 | checkIsFed | 判斷吃飽 | food >= foodNeeded |
| UT-CREA-006 | isCarnivore | 判斷肉食 | 有肉食性狀返回 true |
| UT-CREA-007 | canBeAttacked | 攻擊驗證 | 考慮所有防禦性狀 |
| UT-CREA-008 | rollAgileEscape | 敏捷逃脫 | 4-6成功，1-3失敗 |
| UT-CREA-009 | canUseTailLoss | 斷尾驗證 | 需要其他可棄性狀 |
| UT-CREA-010 | canUseMimicry | 擬態驗證 | 每回合限用一次 |
| UT-CREA-011 | checkExtinction | 滅絕判定 | 未吃飽或中毒 |

### 測試方法
使用 Jest 執行單元測試，直接調用 creatureLogic.js 導出的函數

### 驗收標準
- [ ] 所有測試項目執行完畢
- [ ] 記錄測試結果（通過/失敗）
- [ ] 記錄發現的問題

### 參考文件
- `docs/演化論/TEST_PLAN_EVOLUTION.md`
