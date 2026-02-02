# 完成報告 0362：離線狀態處理

## 基本資訊
- **工單編號**：0362
- **完成日期**：2026-02-02
- **所屬計畫**：P2-D 品質保證

## 完成項目

### 建立的檔案
1. `backend/services/evolution/offlineHandler.js`
   - `PlayerOfflineInfo` - 玩家離線資訊類別
   - `OfflineHandler` - 離線處理器
   - `OFFLINE_STATUS` - 離線狀態常數
   - `OFFLINE_CONFIG` - 離線配置

2. `frontend/src/components/games/evolution/OfflineIndicator.jsx`
   - `OfflineIndicator` - 離線指示器主組件
   - `PlayerOfflineTag` - 玩家離線標籤
   - `OfflinePlayerList` - 離線玩家列表
   - `OfflineBanner` - 離線通知 Banner

3. `frontend/src/components/games/evolution/OfflineIndicator.css`
   - 完整樣式與響應式設計

### 測試檔案
- `backend/services/evolution/__tests__/offlineHandler.test.js`
- `frontend/src/components/games/evolution/__tests__/OfflineIndicator.test.jsx`

## 技術實現

### 後端 PlayerOfflineInfo
- 玩家離線狀態追蹤
- 離線時長計算
- 錯過回合計數
- JSON 序列化支援

### 後端 OfflineHandler
- 玩家註冊/取消註冊
- 離線/上線狀態切換
- 棄權超時處理（2 分鐘）
- 回合超時處理（60 秒）
- 自動跳過離線玩家
- 房間級別狀態管理

### 前端組件
- PlayerOfflineTag：顯示離線/棄權狀態
- OfflinePlayerList：固定位置的離線玩家列表
- OfflineBanner：大型離線通知橫幅
- 倒數計時顯示
- 重新連線按鈕

### 離線狀態
```javascript
OFFLINE_STATUS = {
  ONLINE: 'online',
  TEMPORARILY_OFFLINE: 'temporarily_offline',
  FORFEITED: 'forfeited',
};
```

### 配置選項
```javascript
OFFLINE_CONFIG = {
  temporaryOfflineTimeout: 30000,   // 30 秒
  forfeitTimeout: 120000,           // 2 分鐘
  turnTimeout: 60000,               // 60 秒
  autoPassEnabled: true,
};
```

## 測試結果

### 後端
```
Test Suites: 1 passed, 1 total
Tests:       50 passed, 50 total
```

| 指標 | 數值 |
|------|------|
| Statements | 98.73% |
| Branches | 87.5% |
| Functions | 100% |
| Lines | 98.71% |

### 前端
```
Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
```

| 指標 | 數值 |
|------|------|
| Statements | 100% |
| Branches | 95.31% |
| Functions | 100% |
| Lines | 100% |

## 驗收標準達成
1. [x] 離線狀態正確標記（三種狀態）
2. [x] 回合自動跳過（shouldAutoPass）
3. [x] 超時處理正確（棄權 2 分鐘、回合 60 秒）
4. [x] 遊戲流程不中斷（clearRoom、clear 方法）

## API 介面
```javascript
// 後端
offlineHandler.registerPlayer(playerId, roomId);
offlineHandler.handleOffline(playerId, onForfeit);
offlineHandler.handleOnline(playerId);
offlineHandler.shouldAutoPass(playerId);
offlineHandler.setTurnTimeout(playerId, onTimeout);
offlineHandler.getOnlineCount(roomId);
offlineHandler.getActiveCount(roomId);

// 前端組件
<OfflineIndicator
  players={players}
  currentPlayer={currentPlayer}
  showBanner={true}
  showList={true}
  onRetry={handleRetry}
/>
```
