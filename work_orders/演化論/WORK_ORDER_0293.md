# 工作單 0293

## 編號
0293

## 日期
2026-01-31

## 工作單標題
整合測試：Socket.io 整合

## 工單主旨
演化論遊戲整合測試 - Socket.io 通訊

## 內容

### 測試範圍
- `backend/server.js` 演化論 Socket 事件
- `backend/services/evolutionRoomManager.js`
- `frontend/src/services/socketService.js`

### 測試項目

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| IT-SOCK-001 | 房間創建 | evo:createRoom | 房間正確創建並廣播 |
| IT-SOCK-002 | 玩家加入 | evo:joinRoom | 玩家加入並同步狀態 |
| IT-SOCK-003 | 準備狀態 | evo:setReady | 狀態同步給所有玩家 |
| IT-SOCK-004 | 開始遊戲 | evo:startGame | 遊戲狀態初始化並廣播 |
| IT-SOCK-005 | 遊戲動作 | evo:createCreature | 動作處理並狀態同步 |
| IT-SOCK-006 | 攻擊待處理 | evo:attackPending | 防禦者收到待處理 |
| IT-SOCK-007 | 玩家離開 | evo:leaveRoom | 房主轉移或房間刪除 |
| IT-SOCK-008 | 斷線處理 | disconnect | 遊戲中標記，等待中移除 |

### 測試方法
啟動後端伺服器，使用前端或 Socket.io 客戶端測試

### 驗收標準
- [ ] 所有測試項目執行完畢
- [ ] 記錄測試結果（通過/失敗）
- [ ] 記錄發現的問題

### 參考文件
- `docs/演化論/TEST_PLAN_EVOLUTION.md`
