# 工單完成報告 0095

**日期：** 2026-01-25

**工作單標題：** 預測功能後端單元測試

**工單主旨：** 測試 - 建立預測相關後端單元測試

**分類：** 測試

---

## 完成項目

### 測試檔案

`backend/__tests__/prediction.test.js`

### 測試案例

#### settlePredictions 結算函數 (10 個測試)
- [x] 沒有預測時應返回空陣列
- [x] 預測正確時應標記 isCorrect 為 true
- [x] 預測錯誤時應標記 isCorrect 為 false
- [x] 預測正確應加 1 分
- [x] 預測錯誤應扣 1 分
- [x] 0 分時預測錯誤不會變成負分
- [x] 只結算當局的預測
- [x] 不應重複結算已結算的預測
- [x] 多人預測應各自結算
- [x] scoreChanges 應累計現有分數變化

#### endTurn 預測記錄 (4 個測試)
- [x] 有顏色時應記錄預測
- [x] 顏色為 null 時不應記錄預測
- [x] 應記錄到遊戲歷史
- [x] 玩家不存在時應使用預設名稱

#### 新局預測清理 (1 個測試)
- [x] 新局開始時應清空預測陣列

#### postQuestionPhase (1 個測試)
- [x] gamePhase 應設為 postQuestion

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Time:        0.373 s
```

## 覆蓋率

後端服務覆蓋率：88%+

---

**狀態：** ✅ 已完成
