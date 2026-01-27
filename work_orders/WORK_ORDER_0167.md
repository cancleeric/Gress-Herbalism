# 工作單 0167

**建立日期**: 2026-01-27

**優先級**: P2 (中等)

**標題**: 測試執行時間優化

---

## 一、工作目標

優化後端測試執行時間，特別是 `reconnection.test.js` 從 102 秒降低至 10 秒以內。

---

## 二、問題描述

### 現象
- `reconnection.test.js` 需要約 102 秒執行
- 後端測試總時間約 104 秒

### 根本原因
測試中使用真實計時器等待超時：
- 等待 15 秒（等待階段超時）
- 等待 60 秒（遊戲中超時）
- 等待 10 秒（重整寬限期）

### 影響
- CI/CD 執行時間過長
- 開發迭代速度慢
- Worker 進程退出警告

---

## 三、實施計畫

### 3.1 修改檔案
- `backend/__tests__/reconnection.test.js`
- `backend/__tests__/services/reconnectionService.test.js`

### 3.2 實施內容

#### 3.2.1 使用 Jest Fake Timers

```javascript
// backend/__tests__/reconnection.test.js

describe('斷線重連整合測試', () => {
  // 在每個測試前設置假計時器
  beforeEach(() => {
    jest.useFakeTimers();
  });

  // 在每個測試後恢復真實計時器
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('WA-03: 等待階段房主超時', () => {
    test('房主斷線超過 15 秒應被移除，房主轉移', async () => {
      // 設置測試場景
      const roomId = 'test-room';
      const hostPlayer = { id: 'host', name: 'Host' };

      // 模擬房主斷線
      simulateDisconnect(hostPlayer);

      // 快進 15 秒（而非真正等待）
      jest.advanceTimersByTime(15000);

      // 驗證房主已被移除
      expect(getRoomHost(roomId)).not.toBe('host');
    });
  });

  describe('GP-03: 遊戲中長時間斷線', () => {
    test('斷線超過 60 秒應標記為不活躍', async () => {
      // 設置測試場景
      const player = { id: 'player-1', isActive: true };

      // 模擬斷線
      simulateDisconnect(player);

      // 快進 60 秒
      jest.advanceTimersByTime(60000);

      // 驗證玩家被標記為不活躍
      expect(getPlayerStatus(player.id).isActive).toBe(false);
    });
  });

  describe('重整寬限期測試', () => {
    test('發送 playerRefreshing 後應使用較短的超時時間', async () => {
      // 設置測試場景
      const player = { id: 'player-1' };

      // 發送重整通知
      sendRefreshNotification(player);

      // 快進 5 秒
      jest.advanceTimersByTime(5000);

      // 驗證仍在寬限期內
      expect(getPlayerStatus(player.id).isRefreshing).toBe(true);

      // 再快進 5 秒（超過 10 秒寬限期）
      jest.advanceTimersByTime(5000);

      // 驗證寬限期結束
      expect(getPlayerStatus(player.id).isRefreshing).toBe(false);
    });
  });
});
```

#### 3.2.2 處理 async/await 與 Fake Timers

當測試中同時使用 async/await 和 fake timers 時，需要特別處理：

```javascript
// 輔助函數：等待所有 pending promises 和計時器
const flushPromisesAndTimers = async () => {
  // 先處理所有 pending promises
  await Promise.resolve();

  // 然後快進計時器
  jest.runAllTimers();

  // 再處理因計時器觸發的 promises
  await Promise.resolve();
};

// 使用範例
test('複雜的非同步超時場景', async () => {
  const mockCallback = jest.fn();

  // 設置一個會在 1 秒後執行的非同步操作
  setTimeout(async () => {
    await someAsyncOperation();
    mockCallback();
  }, 1000);

  // 快進計時器並等待 promises
  jest.advanceTimersByTime(1000);
  await flushPromisesAndTimers();

  expect(mockCallback).toHaveBeenCalled();
});
```

#### 3.2.3 保留必要的真實計時器測試

某些測試可能仍需要真實計時器（如網路延遲測試），可以有選擇地使用：

```javascript
describe('網路延遲測試', () => {
  // 這些測試使用真實計時器
  test.skip('網路延遲應正確處理', async () => {
    // 需要真實延遲的測試
  });
});

describe('超時邏輯測試（優化版）', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 這些測試使用假計時器
  test('快速測試超時邏輯', () => {
    // ...
  });
});
```

#### 3.2.4 Jest 配置優化

在 `jest.config.js` 中添加超時設定：

```javascript
// backend/jest.config.js
module.exports = {
  // ...現有配置
  testTimeout: 30000,  // 設定合理的超時時間（使用假計時器後可以降低）

  // 強制單一進程執行（避免 worker 退出問題）
  maxWorkers: 1,

  // 測試完成後強制退出
  forceExit: true
};
```

---

## 四、測試計畫

### 4.1 驗證測試執行時間

```bash
# 執行所有後端測試並記錄時間
time npm test

# 只執行 reconnection.test.js
time npm test -- reconnection.test.js
```

### 4.2 驗證測試結果一致性

確保優化後測試結果與優化前一致：
- 所有測試仍然通過
- 沒有遺漏的邊界情況

---

## 五、驗收標準

1. `reconnection.test.js` 執行時間 < 10 秒
2. 後端測試總時間 < 30 秒
3. 所有原有測試仍然通過
4. Worker 進程正常退出

---

## 六、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| 假計時器行為差異 | 中 | 中 | 保留少量真實計時器測試 |
| Promise 處理順序問題 | 高 | 中 | 使用 flushPromisesAndTimers |
| 遺漏某些計時相關行為 | 低 | 低 | 完整測試覆蓋 |

---

## 七、相關工單

- 依賴: 無
- 被依賴: 無

---

## 八、參考資料

- [Jest Timer Mocks](https://jestjs.io/docs/timer-mocks)
- [Testing Asynchronous Code](https://jestjs.io/docs/asynchronous)

---

*工單建立時間: 2026-01-27*
