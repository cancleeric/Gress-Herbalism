# 完成報告 0071

**日期：** 2026-01-25

**工作單標題：** 新增「預測」功能

**工單主旨：** 功能開發 - 問牌後可選擇預測蓋牌顏色

---

## 完成摘要

成功實作預測功能，讓玩家在問牌後可以選擇性預測蓋牌中包含的顏色。預測結果會在答案揭曉時結算並計分。

## 實作內容

### 1. 常數定義 (shared/constants.js)

- 新增 `GAME_PHASE_POST_QUESTION = 'postQuestion'` 遊戲階段
- 新增 `PREDICTION_CORRECT_POINTS = 1` 預測正確得分
- 新增 `PREDICTION_WRONG_POINTS = -1` 預測錯誤扣分
- 更新 `GAME_PHASES` 陣列包含新階段

### 2. 後端實作 (backend/server.js)

- 新增 `postQuestionStates` Map 儲存問牌後狀態
- 修改 `processQuestionAction()` - 問牌完成後進入 postQuestion 階段
- 修改 `processColorChoice()` - 顏色選擇後進入 postQuestion 階段
- 新增 `endTurn` Socket 事件處理：
  - 記錄預測（如有）
  - 記錄到遊戲歷史
  - 移到下一位玩家
  - 恢復 playing 階段
- 新增 `settlePredictions()` 函數 - 結算本局所有預測
- 修改 `validateGuessResult()` - 猜牌結束時結算預測分數
- 遊戲狀態新增 `predictions` 陣列

### 3. 前端 Socket 服務 (socketService.js)

新增事件：
- `onPostQuestionPhase()` - 監聽進入問牌後階段
- `onTurnEnded()` - 監聽回合結束
- `onPredictionsSettled()` - 監聽預測結算
- `endTurn()` - 發送結束回合請求

### 4. 前端組件

**新增 Prediction 組件：**
- `Prediction.js` - 預測主組件（選擇顏色 + 結束回合按鈕）
- `PredictionList.js` - 顯示所有人的預測
- `PredictionResult.js` - 預測結算結果顯示
- `Prediction.css` - 樣式定義
- `index.js` - 組件導出

**修改 GameRoom.js：**
- 新增預測相關狀態 (`showPrediction`, `predictionLoading`)
- 新增 `handleEndTurn()` 處理結束回合
- 更新 `getGamePhaseText()` 包含 postQuestion 階段
- 新增預測介面 Modal 渲染
- 新增等待問牌玩家結束回合提示
- 更新猜牌結果顯示包含預測結算

### 5. 前端常數同步 (frontend/src/shared/constants.js)

同步新增 `GAME_PHASE_POST_QUESTION` 常數

## 遊戲流程

```
問牌完成後：
1. 進入 postQuestion 階段
2. 當前玩家看到預測介面
3. 可選擇一個顏色進行預測（可不選）
4. 按「結束回合」按鈕
5. 記錄預測（如有）並廣播
6. 移到下一位玩家，恢復 playing 階段

答案揭曉時：
1. 取得本局所有預測
2. 比對每個預測與蓋牌顏色
3. 預測對 +1 分，預測錯 -1 分（最低 0 分）
4. 在結果面板顯示預測結算
```

## 測試結果

- **測試套件：** 29 通過 / 29 總計
- **測試案例：** 732 通過 / 732 總計
- **執行時間：** 約 6 秒

新增測試：
- `Prediction.test.js` - 25+ 測試案例
  - Prediction 組件渲染與互動
  - PredictionList 列表顯示
  - PredictionResult 結果顯示

更新測試：
- `GameRoom.test.js` - 新增 socket mock

## 修改檔案清單

### 新增檔案
- `frontend/src/components/Prediction/Prediction.js`
- `frontend/src/components/Prediction/Prediction.css`
- `frontend/src/components/Prediction/PredictionList.js`
- `frontend/src/components/Prediction/PredictionResult.js`
- `frontend/src/components/Prediction/index.js`
- `frontend/src/components/Prediction/Prediction.test.js`

### 修改檔案
- `shared/constants.js` - 新增階段和計分常數
- `frontend/src/shared/constants.js` - 同步新增階段常數
- `backend/server.js` - 預測邏輯處理
- `frontend/src/services/socketService.js` - 新增預測事件
- `frontend/src/components/GameRoom/GameRoom.js` - 整合預測流程
- `frontend/src/components/GameRoom/GameRoom.test.js` - 更新 mock

## 驗收標準達成

- [x] 問牌後顯示預測選項與「結束回合」按鈕
- [x] 可以選擇四個顏色之一進行預測
- [x] 可以不選擇顏色（不預測）
- [x] 必須按下「結束回合」才會換下一位玩家
- [x] 預測內容公開顯示給所有玩家
- [x] 遊戲紀錄顯示預測動作
- [x] 答案揭曉時正確結算預測分數
- [x] 預測對 +1 分，預測錯 -1 分
- [x] 分數最低為 0 分（不會變負數）
