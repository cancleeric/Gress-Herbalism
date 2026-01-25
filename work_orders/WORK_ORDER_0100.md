# 工作單 0100

**日期：** 2026-01-25

**工作單標題：** 驗證預測記錄與公開性

**工單主旨：** 驗證 - 確認預測內容正確記錄並公開顯示

**計畫書：** [預測功能計畫書](../docs/PREDICTION_FEATURE_PLAN.md)

**優先級：** 中

---

## 驗證項目

### 1. 預測記錄（計畫書 4.1 節）

預測記錄結構：
```javascript
{
  playerId: 'player1',
  playerName: '小明',
  color: 'red',
  round: 3,
  timestamp: 1706169600000,
  isCorrect: null  // 答案揭曉後填入
}
```

### 2. 公開性驗證（計畫書 2.4 節）

| 項目 | 應為 |
|------|------|
| 誰進行了預測 | 公開 |
| 預測的顏色 | 公開 |
| 預測結果 | 答案揭曉時公開 |

### 3. 檢查項目

- [x] 預測儲存到 gameState.predictions 陣列
- [x] 預測記錄包含所有必要欄位
- [x] turnEnded 事件廣播預測資訊給所有玩家
- [x] 遊戲歷史記錄預測動作
- [x] 未預測時不記錄到 predictions 陣列

### 4. 遊戲紀錄顯示

應顯示類似：
```
小明 問牌後預測：[紅色]
小華 問牌後預測：[綠色]
小王 選擇不預測
```

## 檢查檔案

- `backend/server.js` - endTurn 處理器中的預測記錄邏輯
- `frontend/src/components/Prediction/PredictionList.js`

## 驗收標準

- [x] 預測正確記錄
- [x] 預測資訊公開廣播
- [x] 遊戲歷史正確顯示
