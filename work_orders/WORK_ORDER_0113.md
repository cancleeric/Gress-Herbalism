# 工作單 0113

**日期：** 2026-01-25

**工作單標題：** 修復預測錯誤未確實扣分問題

**工單主旨：** BUG 修復 - 預測錯誤時分數沒有正確扣減

**優先級：** 緊急

---

## 問題描述

當玩家預測蓋牌顏色**錯誤**時，應該扣 1 分，但分數沒有正確減少。

### 預期行為

| 預測結果 | 分數變化 |
|---------|---------|
| 預測正確 | +1 分 |
| 預測錯誤 | -1 分 |
| 0 分時錯誤 | 維持 0 分 |

### 實際行為

預測錯誤時分數沒有減少。

## 調查範圍

### 後端

**檔案：** `backend/server.js`
**函數：** `settlePredictions` (約 line 1546-1589)

需檢查：
- [ ] `isPredictionCorrect` 判斷是否正確
- [ ] `change = isPredictionCorrect ? 1 : -1` 是否執行
- [ ] `gameState.scores[playerId] = newScore` 是否更新
- [ ] `gameState.players[playerIndex].score = newScore` 是否更新
- [ ] `broadcastGameState` 是否發送更新後的分數

### 前端

**檔案：** `frontend/src/components/GameRoom/GameRoom.js`

需檢查：
- [ ] `onGuessResult` 事件處理
- [ ] Redux store 分數更新
- [ ] UI 分數顯示

## 除錯步驟

1. 在 `settlePredictions` 加入日誌：
```javascript
console.log(`[預測結算] 玩家: ${pred.playerName}, 顏色: ${pred.color}`);
console.log(`[預測結算] 蓋牌: ${hiddenColors}, 正確: ${isPredictionCorrect}`);
console.log(`[預測結算] 分數變化: ${currentScore} → ${newScore} (${actualChange})`);
```

2. 檢查 `guessResult` 事件內容
3. 檢查 Redux store 更新

## 可能原因

1. `hiddenColors.includes(pred.color)` 比對失敗
2. 分數更新後沒有正確廣播
3. 前端沒有正確處理分數更新
4. `scoreChanges` 沒有正確傳遞

## 驗收標準

- [ ] 預測錯誤時正確扣 1 分
- [ ] 0 分時不會變負數
- [ ] 分數變化正確顯示在 UI
- [ ] 預測結算畫面顯示正確的分數變化
