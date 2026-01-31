# 工作單 0064

**日期：** 2026-01-24

**工作單標題：** 後端 Socket.io 整合測試

**工單主旨：** 提升測試覆蓋率 - 建立 Socket.io 事件整合測試

**分類：** 測試

---

## 目標

為後端 Socket.io 即時通訊建立整合測試，確保多人遊戲的即時互動正確性。

## 背景

遊戲核心依賴 Socket.io 進行即時通訊，包括：
- 房間管理（建立、加入、離開）
- 遊戲狀態同步
- 問牌 / 猜牌動作廣播
- 跟猜機制
- 斷線重連

這些功能需要模擬多個客戶端的整合測試。

## 測試範圍

### 1. 測試環境設置

```bash
npm install --save-dev socket.io-client
```

**測試輔助函數：**
```javascript
// backend/__tests__/helpers/socketClient.js

const { io } = require('socket.io-client');

function createTestClient(serverUrl) {
  return new Promise((resolve) => {
    const client = io(serverUrl, {
      transports: ['websocket'],
      forceNew: true
    });
    client.on('connect', () => resolve(client));
  });
}

function waitForEvent(client, eventName, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    client.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

module.exports = { createTestClient, waitForEvent };
```

### 2. 房間管理測試

**測試檔案：** `backend/__tests__/integration/room.test.js`

**測試案例：**
- [ ] 建立房間成功
- [ ] 加入房間成功
- [ ] 房間人數限制（3-4人）
- [ ] 房間密碼驗證
- [ ] 房主離開時房主轉移
- [ ] 房間滿員時拒絕加入
- [ ] 遊戲中禁止加入

### 3. 遊戲流程測試

**測試檔案：** `backend/__tests__/integration/gameFlow.test.js`

**測試案例：**
- [ ] 遊戲開始條件驗證（3-4人）
- [ ] 發牌正確性（每人手牌數量）
- [ ] 蓋牌設置（2張）
- [ ] 回合輪替順序
- [ ] 問牌動作廣播
- [ ] 猜牌動作處理
- [ ] 跟猜流程（按順位）
- [ ] 計分正確性
- [ ] 遊戲結束條件（7分）

### 4. 斷線處理測試

**測試檔案：** `backend/__tests__/integration/disconnect.test.js`

**測試案例：**
- [ ] 玩家斷線通知其他玩家
- [ ] 斷線重連狀態恢復
- [ ] 斷線超時移除玩家
- [ ] 遊戲中斷線處理
- [ ] 房主斷線轉移

### 5. 多客戶端模擬

```javascript
describe('多人遊戲流程', () => {
  let server;
  let clients = [];

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    clients.forEach(c => c.disconnect());
    await server.close();
  });

  test('4人完整遊戲流程', async () => {
    // 建立4個客戶端
    for (let i = 0; i < 4; i++) {
      const client = await createTestClient(serverUrl);
      clients.push(client);
    }

    // 玩家1建立房間
    clients[0].emit('createRoom', { nickname: 'Player1' });
    const roomData = await waitForEvent(clients[0], 'roomCreated');

    // 其他玩家加入
    for (let i = 1; i < 4; i++) {
      clients[i].emit('joinRoom', {
        roomId: roomData.roomId,
        nickname: `Player${i + 1}`
      });
      await waitForEvent(clients[i], 'joinedRoom');
    }

    // 開始遊戲
    clients[0].emit('startGame');

    // 所有玩家收到遊戲開始事件
    await Promise.all(
      clients.map(c => waitForEvent(c, 'gameStarted'))
    );

    // 驗證每個玩家收到正確的手牌
    // ...
  });
});
```

## 驗收標準

- [ ] 房間管理所有功能測試通過
- [ ] 完整遊戲流程測試通過
- [ ] 斷線處理測試通過
- [ ] 測試可模擬 3-4 人同時連線
- [ ] 測試執行時間在合理範圍內（< 60秒）
- [ ] 無記憶體洩漏問題
