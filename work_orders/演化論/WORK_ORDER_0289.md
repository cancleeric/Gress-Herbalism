# 工作單 0289

## 編號
0289

## 日期
2026-01-31

## 工作單標題
單元測試：feedingLogic.js

## 工單主旨
演化論遊戲單元測試 - 進食與戰鬥邏輯

## 內容

### 測試範圍
`backend/logic/evolution/feedingLogic.js`

### 測試項目

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-FEED-001 | feedCreature | 一般進食 | 正確獲得紅色食物 |
| UT-FEED-002 | feedCreature | 脂肪儲存 | 吃飽後存入黃色食物 |
| UT-FEED-003 | attackCreature | 肉食攻擊 | 返回防禦選項或直接解決 |
| UT-FEED-004 | resolveAttack | 斷尾防禦 | 棄置性狀，攻擊者+1藍 |
| UT-FEED-005 | resolveAttack | 擬態防禦 | 轉移攻擊目標 |
| UT-FEED-006 | resolveAttack | 敏捷防禦 | 骰子判定 |
| UT-FEED-007 | resolveAttack | 攻擊成功 | 攻擊者+2藍，防禦者滅絕 |
| UT-FEED-008 | resolveAttack | 毒液反擊 | 標記攻擊者中毒 |
| UT-FEED-009 | processCommunication | 溝通連鎖 | 遞迴傳遞紅色食物 |
| UT-FEED-010 | processCooperation | 合作連鎖 | 遞迴傳遞藍色食物 |
| UT-FEED-011 | triggerScavenger | 腐食觸發 | 所有腐食者+1藍 |
| UT-FEED-012 | useRobbery | 掠奪 | 偷取未吃飽生物的食物 |
| UT-FEED-013 | useTrampling | 踐踏 | 移除1個紅色食物 |
| UT-FEED-014 | useHibernation | 冬眠 | 視為吃飽，最後回合禁用 |

### 測試方法
使用 Jest 執行單元測試

### 驗收標準
- [ ] 所有測試項目執行完畢
- [ ] 記錄測試結果（通過/失敗）
- [ ] 記錄發現的問題

### 參考文件
- `docs/演化論/TEST_PLAN_EVOLUTION.md`
