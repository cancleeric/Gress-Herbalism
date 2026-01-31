# 報告 0098

**工作單：** [WORK_ORDER_0098](../work_orders/WORK_ORDER_0098.md)

**日期：** 2026-01-25

**狀態：** ✅ 完成

---

## 執行摘要

驗證「問牌→預測→結束回合→換人」流程正確實作。

---

## 驗證結果

### 後端流程驗證

| 檢查項目 | 結果 | 程式碼位置 |
|---------|------|-----------|
| 問牌完成後 gamePhase 設為 'postQuestion' | ✅ | server.js:633, 732 |
| postQuestionPhase 事件發送給當前玩家 | ✅ | server.js:651-657, 750-756 |
| postQuestionStates Map 管理狀態 | ✅ | server.js:338, 636, 735 |
| endTurn 處理器驗證狀態 | ✅ | server.js:773-791 |
| 有預測時記錄到 predictions 陣列 | ✅ | server.js:796-812 |
| turnEnded 事件廣播給所有玩家 | ✅ | server.js:818-822 |
| moveToNextPlayer 執行 | ✅ | server.js:825 |
| gamePhase 重設為 'playing' | ✅ | server.js:826 |

### 前端流程驗證

| 檢查項目 | 結果 | 程式碼位置 |
|---------|------|-----------|
| onPostQuestionPhase 監聽器 | ✅ | GameRoom.js:251-255 |
| 收到事件後 setShowPrediction(true) | ✅ | GameRoom.js:253 |
| onTurnEnded 監聽器 | ✅ | GameRoom.js:258-261 |
| 結束後 setShowPrediction(false) | ✅ | GameRoom.js:259 |
| handleEndTurn 呼叫 socketService.endTurn | ✅ | GameRoom.js:441-446 |
| 重連恢復預測 UI 狀態 | ✅ | GameRoom.js:289-293 |

### Prediction 組件驗證

| 檢查項目 | 結果 |
|---------|------|
| 顯示四種顏色按鈕 | ✅ |
| 可點擊選擇/取消選擇顏色 | ✅ |
| 顯示「結束回合」按鈕 | ✅ |
| 點擊結束回合呼叫 onEndTurn(selectedColor) | ✅ |
| 顯示預測規則說明 | ✅ |

### Socket 事件驗證

| 事件 | 方向 | 驗證結果 |
|------|------|---------|
| postQuestionPhase | 後端→前端 | ✅ |
| endTurn | 前端→後端 | ✅ |
| turnEnded | 後端→前端（廣播） | ✅ |

---

## 測試結果

### 後端測試

```
Tests: 16 passed, 16 total
- settlePredictions 相關: 10 tests ✅
- endTurn 預測記錄: 4 tests ✅
- 新局清理: 1 test ✅
- postQuestionPhase: 1 test ✅
```

### 前端測試

```
Tests: 17 passed, 17 total
- Prediction Component: 8 tests ✅
- PredictionList Component: 5 tests ✅
- PredictionResult Component: 4 tests ✅
```

---

## 流程圖驗證

```
玩家回合開始
    ↓
選擇「問牌」動作
    ↓
執行問牌（選顏色→選玩家→選要牌方式）
    ↓
問牌完成，進入預測階段
    │
    ├─ 後端：gamePhase = 'postQuestion' ✅
    ├─ 後端：postQuestionStates.set() ✅
    └─ 後端：emit('postQuestionPhase') ✅
    ↓
顯示預測選項
    │
    └─ 前端：setShowPrediction(true) ✅
    ↓
玩家選擇預測或不選
    │
    └─ 前端：Prediction 組件 ✅
    ↓
點擊「結束回合」
    │
    ├─ 前端：emit('endTurn') ✅
    ├─ 後端：記錄 prediction ✅
    ├─ 後端：postQuestionStates.delete() ✅
    └─ 後端：emit('turnEnded') ✅
    ↓
回合結束，輪到下一位玩家
    │
    ├─ 後端：moveToNextPlayer() ✅
    ├─ 後端：gamePhase = 'playing' ✅
    └─ 後端：broadcastGameState() ✅
```

---

## 驗收標準

- [x] 流程符合計畫書描述
- [x] 不點擊「結束回合」不會換人
- [x] 預測記錄正確儲存

---

## 結論

預測功能流程完全符合計畫書規格，所有檢查項目均通過驗證。
