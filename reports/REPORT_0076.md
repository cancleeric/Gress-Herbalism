# 工單完成報告 0076

**日期：** 2026-01-25

**工作單標題：** 問牌後未顯示預測選項

**工單主旨：** BUG 修復 - 問牌完成後應顯示預測選項但未出現

**分類：** BUG

**相關工單：** 0071（預測功能需求）

---

## 問題分析

### 問題描述
問牌完成後，預測選項未顯示，遊戲直接換到下一個玩家。

### 預期行為
問牌完成後：
1. 遊戲進入 `postQuestion` 階段
2. 向當前玩家發送 `postQuestionPhase` 事件
3. 前端顯示預測選項面板
4. 玩家選擇預測或跳過後按「結束回合」

### 調查結果

透過單元測試驗證，前端邏輯正確：
- 當 `postQuestionPhase` 事件被接收時，預測面板確實顯示
- 新增測試案例驗證此流程

問題可能在於：
1. 後端未正確發送 `postQuestionPhase` 事件
2. Socket 連接問題導致事件未送達
3. `findSocketByPlayerId` 找不到玩家的 socket

## 修復內容

### 1. 新增診斷日誌

#### 後端 (server.js)
- 在 `gameAction` 處理器加入處理結果日誌
- 在發送 `postQuestionPhase` 時加入成功/失敗日誌

```javascript
// gameAction 處理器
console.log(`[gameAction] 收到動作:`, action.type, action.playerId);
console.log(`[gameAction] 處理結果:`, {
  success: result.success,
  requireColorChoice: result.requireColorChoice,
  requireFollowGuess: result.requireFollowGuess,
  enterPostQuestionPhase: result.enterPostQuestionPhase
});

// postQuestionPhase 發送
if (playerSocket) {
  console.log(`[問牌] 發送 postQuestionPhase 給玩家 ${result.currentPlayerId}`);
} else {
  console.warn(`[問牌] 找不到玩家 socket，無法發送 postQuestionPhase`);
}
```

#### 前端 (GameRoom.js)
- 在接收 `postQuestionPhase` 時加入日誌

```javascript
const unsubPostQuestion = onPostQuestionPhase(({ playerId, message }) => {
  console.log('[工單 0076] 收到 postQuestionPhase 事件:', { playerId, message });
  setShowPrediction(true);
  setPredictionLoading(false);
});
```

### 2. 新增測試案例

新增 `postQuestionPhase 事件應顯示預測選項（工單 0076）` 測試：
- 模擬接收 `postQuestionPhase` 事件
- 驗證預測面板顯示（檢查「問牌完成！」和「結束回合」文字）

## 調試步驟

運行後端伺服器時，觀察控制台日誌：

1. **正常流程應該顯示：**
   ```
   [gameAction] 收到動作: question p1
   [gameAction] 處理結果: { success: true, enterPostQuestionPhase: true, ... }
   [問牌] 發送 postQuestionPhase 給玩家 p1
   ```

2. **如果出現警告：**
   ```
   [問牌] 找不到玩家 p1 的 socket，無法發送 postQuestionPhase
   ```
   這表示問題出在 socket 管理，需要檢查：
   - 玩家加入時 socketId 是否正確儲存
   - `findSocketByPlayerId` 函數是否正確找到 socket

3. **前端應顯示：**
   ```
   [工單 0076] 收到 postQuestionPhase 事件: { playerId: 'p1', message: '...' }
   ```
   如果沒有看到這條日誌，表示事件未送達前端。

## 測試結果

- 新增測試：1 個
- 所有測試通過：776 個測試
- 測試覆蓋驗證：
  - 當 `postQuestionPhase` 事件接收後，預測面板正確顯示

## 驗收項目

- [x] 新增診斷日誌幫助追蹤問題
- [x] 新增測試案例驗證前端邏輯
- [ ] 待運行實際伺服器確認後端事件發送

## 後續步驟

1. 運行伺服器和客戶端
2. 執行問牌操作
3. 觀察控制台日誌確認事件流程
4. 根據日誌結果進行進一步修復

---

**狀態：** 🔍 調查中（需運行實際測試確認）
