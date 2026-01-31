# 預測功能修復計畫書

**專案名稱：** Gress 推理桌遊 - 預測功能修復
**日期：** 2026-01-25
**版本：** 1.0
**狀態：** 待執行

---

## 一、現況分析

### 1.1 已實作功能

| 功能項目 | 檔案位置 | 狀態 |
|---------|---------|------|
| 預測 UI 組件 | `frontend/src/components/Prediction/Prediction.js` | ✅ 完成 |
| 預測列表組件 | `frontend/src/components/Prediction/PredictionList.js` | ✅ 完成 |
| 預測結算組件 | `frontend/src/components/Prediction/PredictionResult.js` | ✅ 完成 |
| Socket 事件定義 | `frontend/src/services/socketService.js` | ✅ 完成 |
| 後端事件處理 | `backend/server.js` | ✅ 完成 |
| GameRoom 整合 | `frontend/src/components/GameRoom/GameRoom.js` | ✅ 完成 |
| 預測結算邏輯 | `backend/server.js:settlePredictions()` | ✅ 完成 |

### 1.2 資料流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                         預測功能資料流程                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [後端] 問牌完成                                                     │
│      │                                                              │
│      ▼                                                              │
│  gameState.gamePhase = 'postQuestion'                               │
│  postQuestionStates.set(gameId, { playerId })                       │
│      │                                                              │
│      ▼                                                              │
│  emit('postQuestionPhase', { playerId, message })  ───────────────┐ │
│                                                                   │ │
│  ┌────────────────────────────────────────────────────────────────┼─┤
│  │ [前端] GameRoom.js                                             │ │
│  │     │                                                          │ │
│  │     ▼                                                          │ │
│  │ onPostQuestionPhase() → setShowPrediction(true)                │ │
│  │     │                                                          │ │
│  │     ▼                                                          │ │
│  │ 顯示 <Prediction /> 組件                                       │ │
│  │     │                                                          │ │
│  │     ▼                                                          │ │
│  │ 玩家選擇顏色 → 點擊「結束回合」                                  │ │
│  │     │                                                          │ │
│  │     ▼                                                          │ │
│  │ handleEndTurn(prediction) → endTurn(gameId, playerId, prediction)│
│  └────────────────────────────────────────────────────────────────┼─┤
│                                                                   │ │
│  ┌────────────────────────────────────────────────────────────────┘ │
│  ▼                                                                  │
│  [後端] socket.on('endTurn')                                        │
│      │                                                              │
│      ├── 記錄預測到 gameState.predictions[]                         │
│      ├── 記錄到 gameState.gameHistory[]                             │
│      ├── 刪除 postQuestionStates                                    │
│      ├── emit('turnEnded', { playerId, prediction, playerName })    │
│      ├── moveToNextPlayer(gameState)                                │
│      └── broadcastGameState(gameId)                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┤
│  │ [前端] onTurnEnded() → setShowPrediction(false)                  │
│  └──────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [猜牌成功時]                                                        │
│      │                                                              │
│      ▼                                                              │
│  [後端] validateGuessResult()                                        │
│      │                                                              │
│      ▼                                                              │
│  settlePredictions(gameState, scoreChanges)                          │
│      │                                                              │
│      ▼                                                              │
│  emit('guessResult', { ..., predictionResults })                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┤
│  │ [前端] 顯示 <PredictionResult /> 組件                             │
│  └──────────────────────────────────────────────────────────────────┤
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 現有測試覆蓋

| 測試檔案 | 測試數量 | 涵蓋範圍 |
|---------|---------|---------|
| `Prediction.test.js` | 17 個 | UI 組件渲染、選擇、結束回合 |
| 後端單元測試 | 0 個 | **缺少預測相關後端測試** |
| 整合測試 | 0 個 | **缺少預測流程整合測試** |

---

## 二、已識別問題

### 2.1 潛在 BUG

#### BUG-1：預測陣列跨局累積未清理

**問題描述：**
```javascript
// backend/server.js
gameState.predictions = [] // 初始化時為空
// 問題：新局開始時沒有清理 predictions 陣列
```

**影響：**
- 預測陣列會跨局累積
- `settlePredictions()` 使用 `round` 過濾，理論上不會結算舊預測
- 但陣列持續增長可能造成記憶體問題

**位置：** `backend/server.js` 新局初始化區塊

---

#### BUG-2：預測結算可能重複執行

**問題描述：**
當所有玩家都猜錯退出時，如果多次觸發結算邏輯，可能重複計算預測分數。

**需驗證：**
- `settlePredictions()` 是否有防重複機制
- `isCorrect` 欄位是否被正確標記為已處理

**位置：** `backend/server.js:1535-1576`

---

#### BUG-3：Socket 連線中斷時預測狀態遺失

**問題描述：**
如果玩家在 `postQuestion` 階段斷線重連，`postQuestionStates` Map 中的狀態可能導致問題。

**影響：**
- 玩家可能無法看到預測選項
- 或卡在預測階段無法繼續

**位置：** `backend/server.js` 重連處理區塊

---

#### BUG-4：未使用的 Socket 事件

**問題描述：**
```javascript
// frontend/src/services/socketService.js
export function onPredictionsSettled(callback) { ... } // 已定義但未使用
```

**影響：**
- 程式碼冗餘
- 可能造成混淆

---

### 2.2 文檔問題

| 問題 | 狀態 |
|------|------|
| `GAME_RULES.md` 缺少預測規則 | ✅ 已修復 |
| `PREDICTION_FEATURE_PLAN.md` 驗收項目未勾選 | 待更新 |

---

## 三、修復計畫

### 3.1 工單列表

| 工單編號 | 標題 | 優先級 | 預估複雜度 |
|---------|------|--------|-----------|
| 0091 | 預測陣列跨局清理 | 高 | 低 |
| 0092 | 預測結算防重複機制 | 高 | 中 |
| 0093 | 預測功能斷線重連處理 | 中 | 中 |
| 0094 | 移除未使用的 Socket 事件 | 低 | 低 |
| 0095 | 預測功能後端單元測試 | 高 | 中 |
| 0096 | 預測功能前後端整合測試 | 高 | 高 |
| 0097 | 更新預測功能計畫書驗收項目 | 低 | 低 |

---

### 3.2 工單詳細內容

#### 工單 0091：預測陣列跨局清理

**目標：** 確保新局開始時清理預測陣列

**修改位置：**
- `backend/server.js` - 新局初始化函數

**修改內容：**
```javascript
// 在 startNewRound 或類似函數中加入
gameState.predictions = [];
```

**驗證方式：**
1. 開始新局後檢查 `gameState.predictions` 是否為空
2. 上一局的預測不應出現在新局中

---

#### 工單 0092：預測結算防重複機制

**目標：** 確保預測只被結算一次

**修改位置：**
- `backend/server.js:settlePredictions()`

**修改內容：**
```javascript
function settlePredictions(gameState, scoreChanges) {
  const predictions = gameState.predictions || [];
  const currentRound = gameState.currentRound;

  // 只處理尚未結算的預測
  const roundPredictions = predictions.filter(
    p => p.round === currentRound && p.isCorrect === null
  );

  // ... 原有邏輯
}
```

**驗證方式：**
1. 同一局多次呼叫 `settlePredictions` 只應結算一次
2. 已結算的預測 `isCorrect` 應該是 `true` 或 `false`，不是 `null`

---

#### 工單 0093：預測功能斷線重連處理

**目標：** 確保斷線重連後預測狀態正確恢復

**修改位置：**
- `backend/server.js` - 重連處理區塊
- `frontend/src/components/GameRoom/GameRoom.js` - 狀態恢復

**修改內容：**
1. 重連時檢查 `postQuestionStates` 是否有該玩家的狀態
2. 如果有，重新發送 `postQuestionPhase` 事件
3. 前端收到 `gameState` 時，根據 `gamePhase === 'postQuestion'` 恢復 UI

**驗證方式：**
1. 在預測選項顯示時重新整理頁面
2. 重連後應該仍然看到預測選項

---

#### 工單 0094：移除未使用的 Socket 事件

**目標：** 清理冗餘程式碼

**修改位置：**
- `frontend/src/services/socketService.js`

**修改內容：**
刪除 `onPredictionsSettled` 函數（如果確認未使用）

**驗證方式：**
1. 全域搜尋確認沒有使用該函數
2. 移除後測試通過

---

#### 工單 0095：預測功能後端單元測試

**目標：** 建立預測相關後端測試

**修改位置：**
- 新增 `backend/__tests__/services/predictionService.test.js`
- 或 `backend/__tests__/prediction.test.js`

**測試案例：**
```javascript
describe('Prediction Feature', () => {
  describe('endTurn handler', () => {
    test('should record prediction when color is provided');
    test('should not record prediction when color is null');
    test('should add prediction to gameHistory');
    test('should clear postQuestionState');
    test('should broadcast turnEnded event');
    test('should move to next player');
  });

  describe('settlePredictions', () => {
    test('should return empty array when no predictions');
    test('should mark correct prediction');
    test('should mark wrong prediction');
    test('should apply +1 score for correct prediction');
    test('should apply -1 score for wrong prediction');
    test('should not go below 0 score');
    test('should only settle current round predictions');
    test('should not re-settle already settled predictions');
  });

  describe('postQuestionPhase', () => {
    test('should set gamePhase to postQuestion');
    test('should store postQuestionState');
    test('should emit postQuestionPhase event to current player');
  });
});
```

---

#### 工單 0096：預測功能前後端整合測試

**目標：** 建立預測功能 E2E 流程測試

**測試檔案：**
- `backend/__tests__/integration/prediction.integration.test.js`

**測試案例：**
```javascript
describe('Prediction Integration', () => {
  test('complete prediction flow: question → predict → next turn');
  test('prediction settlement on guess correct');
  test('prediction settlement on all players eliminated');
  test('reconnection during postQuestion phase');
  test('multiple predictions in same round');
});
```

---

#### 工單 0097：更新預測功能計畫書驗收項目

**目標：** 更新 `PREDICTION_FEATURE_PLAN.md` 驗收狀態

**修改位置：**
- `docs/PREDICTION_FEATURE_PLAN.md` 第六章驗收標準

---

## 四、執行計畫

### 4.1 執行順序

```
第一階段：修復核心問題
├── 0091 預測陣列跨局清理
├── 0092 預測結算防重複機制
└── 0093 預測功能斷線重連處理

第二階段：測試建立
├── 0095 預測功能後端單元測試
└── 0096 預測功能前後端整合測試

第三階段：清理與文檔
├── 0094 移除未使用的 Socket 事件
└── 0097 更新預測功能計畫書驗收項目
```

### 4.2 驗證流程

每個工單完成後執行：

```bash
# 1. 執行後端測試
cd backend && npm test

# 2. 執行前端測試
cd frontend && npm test

# 3. 手動驗證（如需要）
# - 啟動伺服器
# - 進行遊戲測試
# - 驗證預測功能流程
```

### 4.3 完成標準

| 項目 | 標準 |
|------|------|
| 後端測試 | 所有新增測試通過 |
| 前端測試 | 所有現有測試通過 |
| 手動測試 | 預測功能完整流程正常 |
| 程式碼審查 | 無明顯問題 |

---

## 五、測試計畫

### 5.1 單元測試

#### 後端單元測試清單

| 測試項目 | 測試檔案 | 測試數量 |
|---------|---------|---------|
| endTurn 處理器 | prediction.test.js | 6 |
| settlePredictions 函數 | prediction.test.js | 8 |
| postQuestionPhase 發送 | prediction.test.js | 3 |
| **總計** | | **17** |

#### 前端單元測試清單

| 測試項目 | 測試檔案 | 狀態 |
|---------|---------|------|
| Prediction 組件 | Prediction.test.js | ✅ 已存在 (7 個) |
| PredictionList 組件 | Prediction.test.js | ✅ 已存在 (5 個) |
| PredictionResult 組件 | Prediction.test.js | ✅ 已存在 (5 個) |

### 5.2 整合測試

| 測試場景 | 描述 |
|---------|------|
| 完整預測流程 | 問牌 → 預測 → 結束回合 → 下一玩家 |
| 預測結算（猜對） | 玩家猜對 → 結算所有預測 → 顯示結果 |
| 預測結算（猜錯） | 所有玩家猜錯 → 結算預測 → 新局 |
| 斷線重連 | 預測階段斷線 → 重連 → 恢復狀態 |
| 多人預測 | 多名玩家各自預測 → 統一結算 |

### 5.3 手動測試檢查表

- [ ] 問牌後顯示預測選項
- [ ] 可選擇四種顏色之一
- [ ] 可不選擇直接結束回合
- [ ] 選擇後正確顯示確認訊息
- [ ] 結束回合後輪到下一位玩家
- [ ] 其他玩家看到預測公告
- [ ] 猜對後顯示預測結算結果
- [ ] 預測正確 +1 分
- [ ] 預測錯誤 -1 分
- [ ] 0 分時預測錯誤不變負
- [ ] 新局開始時預測記錄清除
- [ ] 斷線重連後狀態正確

---

## 六、風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 修改結算邏輯可能影響其他功能 | 高 | 完整執行所有測試 |
| 重連處理複雜度高 | 中 | 分步驟實作，逐一驗證 |
| 測試覆蓋不足 | 中 | 優先建立單元測試 |

---

## 七、時程預估

| 階段 | 工單 | 預估 |
|------|------|------|
| 第一階段 | 0091-0093 | - |
| 第二階段 | 0095-0096 | - |
| 第三階段 | 0094, 0097 | - |

（不提供時間預估，依實際執行進度為準）

---

## 八、相關文檔

| 文檔 | 說明 |
|------|------|
| `docs/GAME_RULES.md` | 遊戲規則（已更新預測章節） |
| `docs/PREDICTION_FEATURE_PLAN.md` | 原始預測功能計畫書 |
| `work_orders/WORK_ORDER_0071.md` | 預測功能需求工單 |
| `work_orders/BUG/WORK_ORDER_0076.md` | 預測顯示問題 BUG 工單 |

---

**建立者：** Claude
**審核者：** 待定
**狀態：** 待執行
