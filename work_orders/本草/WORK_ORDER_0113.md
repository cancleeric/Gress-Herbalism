# 工作單 0113

**日期：** 2026-01-25

**工作單標題：** 驗證預測加扣分功能正確性

**工單主旨：** 測試驗證 - 確認預測功能的分數計算正確

**優先級：** 一般

---

## 測試目標

驗證預測蓋牌功能的分數計算是否正確運作。

## 預期行為

| 預測結果 | 分數變化 |
|---------|---------|
| 預測正確 | +1 分 |
| 預測錯誤 | -1 分 |
| 0 分時錯誤 | 維持 0 分 |

## 測試範圍

### 後端

**檔案：** `backend/server.js`
**函數：** `settlePredictions` (約 line 1556-1610)

驗證項目：
- [x] `isPredictionCorrect` 判斷邏輯正確
- [x] `change = isPredictionCorrect ? 1 : -1` 正確計算
- [x] `gameState.scores[playerId] = newScore` 正確更新
- [x] `gameState.players[playerIndex].score = newScore` 正確更新
- [x] `guessResult` 事件正確傳遞分數變化

### 前端

**檔案：** `frontend/src/components/GameRoom/GameRoom.js`

驗證項目：
- [x] `onGuessResult` 事件正確處理
- [x] `PredictionResult` 組件正確顯示
- [x] 分數變化正確顯示在 UI

## 驗收標準

- [x] 預測正確時加 1 分
- [x] 預測錯誤時扣 1 分
- [x] 0 分時不會變負數
- [x] 分數變化正確顯示在 UI
- [x] 預測結算畫面顯示正確的分數變化
- [x] 單元測試全部通過
