# 工作單 0101

**日期：** 2026-01-25

**工作單標題：** 驗證預測結算邏輯

**工單主旨：** 驗證 - 確認預測結算計分正確

**計畫書：** [預測功能計畫書](../docs/PREDICTION_FEATURE_PLAN.md)

**優先級：** 高

---

## 驗證項目

### 1. 計分規則（計畫書 2.5 節）

| 預測結果 | 分數變化 |
|---------|---------|
| 預測顏色在蓋牌中 | +1 分 |
| 預測顏色不在蓋牌中 | -1 分 |
| 未預測 | 0 分 |
| 分數為 0 時被扣分 | 維持 0 分 |

### 2. 結算時機（計畫書 2.6 節）

- [x] 有玩家猜牌成功時結算
- [x] 當局以其他方式結束時結算（所有玩家猜錯退出）

### 3. 結算邏輯檢查

- [x] settlePredictions 函數正確過濾當局預測
- [x] 只結算 isCorrect === null 的預測（防重複）
- [x] 正確判斷預測顏色是否在蓋牌中
- [x] 正確計算分數變化
- [x] 分數不會變負（Math.max(0, score)）
- [x] 更新 gameState.scores 和 player.score

### 4. 結算結果

guessResult 事件應包含 predictionResults：
```javascript
{
  isCorrect: true,
  scoreChanges: {...},
  hiddenCards: [...],
  predictionResults: [
    { playerId, playerName, color, isCorrect, scoreChange }
  ]
}
```

## 檢查檔案

- `backend/server.js` - settlePredictions 函數
- `backend/server.js` - validateGuessResult 函數
- `backend/__tests__/prediction.test.js`

## 驗收標準

- [x] 計分邏輯正確
- [x] 防重複結算有效
- [x] 分數邊界處理正確
