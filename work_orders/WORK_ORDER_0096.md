# 工作單 0096

**日期：** 2026-01-25

**工作單標題：** 預測功能前後端整合測試

**工單主旨：** 測試 - 建立預測功能 E2E 流程整合測試

**計畫書：** [預測功能修復計畫書](../docs/PREDICTION_FIX_PLAN.md)

**優先級：** 高

---

## 目標

建立預測功能的前後端整合測試，驗證完整流程。

## 測試檔案

`backend/__tests__/integration/prediction.integration.test.js`

## 測試案例

```javascript
describe('Prediction Integration', () => {
  describe('完整預測流程', () => {
    test('question → predict → next turn');
    test('question → skip predict → next turn');
  });

  describe('預測結算', () => {
    test('prediction settlement on guess correct');
    test('correct prediction gets +1 score');
    test('wrong prediction gets -1 score');
    test('0 score player wrong prediction stays at 0');
  });

  describe('多人場景', () => {
    test('multiple players predict in same round');
    test('all predictions settled together');
  });

  describe('斷線重連', () => {
    test('reconnection during postQuestion phase');
    test('prediction UI restored after reconnect');
  });

  describe('邊界條件', () => {
    test('all players eliminated triggers settlement');
    test('new round clears predictions');
  });
});
```

## 測試環境

- 使用 socket.io-client 模擬多客戶端
- 使用測試伺服器實例
- Mock Supabase 資料庫

## 驗收標準

- [ ] 所有整合測試通過
- [ ] 涵蓋主要使用場景
- [ ] 測試可重複執行
- [ ] 測試獨立不互相影響
