# 工作單 0210

## 編號：0210
## 日期：2026-01-28
## 標題：加強前端重連可靠性

## 工單主旨
強化 F5 重整後的前端重連機制，增加重試、狀態恢復和 UI 提示

## 內容

### 依賴
工單 0209（後端修復必須先完成）

### 具體修改

**修改檔案**：
- `frontend/src/components/GameRoom/GameRoom.js`
- `frontend/src/services/socketService.js`

#### 1. 新增重連中狀態
- 新增 `isReconnecting` state
- 新增 `reconnectTimerRef` 和 `reconnectAttemptsRef` refs

#### 2. 增加重連重試邏輯
- 修改 `onConnectionChange` useEffect
- 新增 `attemptReconnectWithRetry` 函數
- 重連後 5 秒未收到回應則自動重試，最多 3 次
- 每次重試在 console 輸出日誌

#### 3. 修復 `onReconnected` 狀態恢復
在 dispatch 中補齊缺失的 Redux 欄位：
- `scores`
- `currentRound`
- `predictions`
收到重連成功後清除重連 timer 並設 `isReconnecting = false`

#### 4. 收到 `onReconnectFailed` 後清除重連狀態
設 `isReconnecting = false`，清除 timer

#### 5. 新增重連 UI 覆蓋層
當 `isReconnecting = true` 時顯示全屏覆蓋層：
```jsx
{isReconnecting && (
  <div className="gr-reconnecting-overlay">
    <div className="gr-reconnecting-content">
      <div className="gr-reconnecting-spinner"></div>
      <p>重新連線中...</p>
    </div>
  </div>
)}
```

### 驗收標準
- F5 後看到「重新連線中...」提示
- 成功重連後提示消失，遊戲狀態完整恢復
- 重連失敗時最多重試 3 次，最終顯示錯誤提示
- 前端測試全部通過（1402 passed, 0 failed）
