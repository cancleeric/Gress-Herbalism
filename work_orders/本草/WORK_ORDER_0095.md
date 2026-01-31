# 工作單 0095

**日期：** 2026-01-25

**工作單標題：** 預測功能後端單元測試

**工單主旨：** 測試 - 建立預測相關後端單元測試

**計畫書：** [預測功能修復計畫書](../docs/PREDICTION_FIX_PLAN.md)

**優先級：** 高

---

## 目標

建立完整的預測功能後端單元測試，確保核心邏輯正確。

## 測試檔案

`backend/__tests__/prediction.test.js`

## 測試案例

### endTurn 處理器測試

```javascript
describe('endTurn handler', () => {
  test('should record prediction when color is provided');
  test('should not record prediction when color is null');
  test('should add prediction to gameHistory');
  test('should clear postQuestionState');
  test('should broadcast turnEnded event');
  test('should move to next player');
});
```

### settlePredictions 函數測試

```javascript
describe('settlePredictions', () => {
  test('should return empty array when no predictions');
  test('should mark correct prediction when color is in hidden cards');
  test('should mark wrong prediction when color is not in hidden cards');
  test('should apply +1 score for correct prediction');
  test('should apply -1 score for wrong prediction');
  test('should not go below 0 score');
  test('should only settle current round predictions');
  test('should not re-settle already settled predictions');
});
```

### postQuestionPhase 測試

```javascript
describe('postQuestionPhase', () => {
  test('should set gamePhase to postQuestion');
  test('should store postQuestionState');
  test('should emit postQuestionPhase event to current player');
});
```

## 驗收標準

- [ ] 所有 17 個測試案例通過
- [ ] 測試覆蓋主要邏輯路徑
- [ ] Mock 策略正確
- [ ] 測試獨立不互相影響
