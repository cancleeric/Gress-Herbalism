# 工作單 0098

**日期：** 2026-01-25

**工作單標題：** 驗證預測功能流程正確性

**工單主旨：** 驗證 - 確認「問牌→預測→結束回合→換人」流程正確實作

**計畫書：** [預測功能計畫書](../docs/PREDICTION_FEATURE_PLAN.md)

**優先級：** 高

---

## 驗證項目

### 1. 流程驗證

根據計畫書 2.2 節，完整流程應為：

```
玩家回合開始
    ↓
選擇「問牌」動作
    ↓
執行問牌（選顏色→選玩家→選要牌方式）
    ↓
問牌完成，進入預測階段（gamePhase: 'postQuestion'）
    ↓
顯示預測選項（四個顏色按鈕 + 結束回合按鈕）
    ↓
玩家選擇預測或不選
    ↓
點擊「結束回合」
    ↓
回合結束，輪到下一位玩家
```

### 2. 檢查項目

- [x] 問牌完成後 gamePhase 設為 'postQuestion'
- [x] postQuestionPhase 事件正確發送給當前玩家
- [x] 前端收到事件後顯示 Prediction 組件
- [x] 玩家必須點擊「結束回合」才會換人
- [x] endTurn 事件正確處理預測記錄
- [x] turnEnded 事件廣播給所有玩家
- [x] moveToNextPlayer 在 endTurn 後執行

### 3. 後端關鍵程式碼位置

- `backend/server.js` - processQuestionAction 返回 enterPostQuestionPhase
- `backend/server.js` - socket.on('endTurn') 處理器
- `backend/server.js` - postQuestionStates Map 管理

### 4. 前端關鍵程式碼位置

- `frontend/src/components/GameRoom/GameRoom.js` - onPostQuestionPhase 監聽
- `frontend/src/components/Prediction/Prediction.js` - 預測 UI
- `frontend/src/services/socketService.js` - endTurn 函數

## 驗收標準

- [x] 流程符合計畫書描述
- [x] 不點擊「結束回合」不會換人
- [x] 預測記錄正確儲存
