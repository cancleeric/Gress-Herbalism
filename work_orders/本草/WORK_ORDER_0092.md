# 工作單 0092

**日期：** 2026-01-25

**工作單標題：** 預測結算防重複機制

**工單主旨：** BUG 修復 - 確保預測只被結算一次

**計畫書：** [預測功能修復計畫書](../docs/PREDICTION_FIX_PLAN.md)

**優先級：** 高

---

## 問題描述

當多次觸發結算邏輯時（例如所有玩家都猜錯退出），可能重複計算預測分數。

## 修改位置

`backend/server.js:settlePredictions()`

## 修改內容

```javascript
function settlePredictions(gameState, scoreChanges) {
  const predictions = gameState.predictions || [];
  const currentRound = gameState.currentRound;

  // 只處理尚未結算的預測（isCorrect === null）
  const roundPredictions = predictions.filter(
    p => p.round === currentRound && p.isCorrect === null
  );

  // ... 原有邏輯
}
```

## 驗證方式

1. 同一局多次呼叫 `settlePredictions` 只應結算一次
2. 已結算的預測 `isCorrect` 應該是 `true` 或 `false`，不是 `null`
3. 分數變化只發生一次

## 驗收標準

- [ ] 已結算預測不會重複處理
- [ ] 分數計算正確
- [ ] 所有現有測試通過
