# 工作單 0155

**日期**：2026-01-27

**工作單標題**：整合測試 - 前後端通訊與遊戲流程

**工單主旨**：測試 - Socket 通訊、房間管理、遊戲流程、重連機制的整合測試

**優先級**：高

**依賴工單**：0152, 0153

**計畫書**：`docs/TEST_PLAN.md`

---

## 一、測試範圍

### 1.1 測試目標

| 測試模組 | 測試案例數 |
|---------|-----------|
| 房間管理整合 | 4 |
| 遊戲流程整合 | 9 |
| 重連整合 | 4 |
| 認證整合 | 3 |
| Socket 事件 | 8 |
| **小計** | **28** |

### 1.2 測試環境需求
- 前端測試伺服器
- 後端 Socket 伺服器
- Mock Firebase 認證

---

## 二、測試案例清單

### 2.1 房間管理整合測試 (IT-01)
**檔案**：`frontend/src/__tests__/integration/roomManagement.test.js`

| 編號 | 測試案例 | 步驟 | 預期結果 |
|------|---------|------|---------|
| IT-01-01 | 完整創建房間流程 | 前端 createRoom → 後端處理 → roomCreated 事件 | 前端收到房間 ID 並更新狀態 |
| IT-01-02 | 完整加入房間流程 | 前端 joinRoom → 後端處理 → joinedRoom 事件 | 所有玩家收到 gameState 更新 |
| IT-01-03 | 完整離開房間流程 | 前端 leaveRoom → 後端處理 → playerLeft 事件 | 其他玩家收到離開通知 |
| IT-01-04 | 多玩家同時加入 | 3 個客戶端同時 joinRoom | 全部成功加入，狀態一致 |

### 2.2 遊戲流程整合測試 (IT-02)
**檔案**：`frontend/src/__tests__/integration/gameFlow.test.js`

| 編號 | 測試案例 | 步驟 | 預期結果 |
|------|---------|------|---------|
| IT-02-01 | 開始遊戲流程 | 房主 startGame → 後端發牌 → gameState 更新 | 所有玩家收到初始狀態 |
| IT-02-02 | 問牌流程 | 玩家發送問牌 → 後端處理 → 廣播結果 | 手牌正確轉移 |
| IT-02-03 | 顏色選擇流程 | 問牌類型2 → colorChoiceRequired → 選擇 → 完成 | 被要牌者正確選擇並完成 |
| IT-02-04 | 猜牌流程 | 發送猜牌 → followGuessStarted → 跟猜決定 → guessResult | 完整跟猜流程正確 |
| IT-02-05 | 跟猜流程 | 按順序詢問 → 收集決定 → 結算 | 順序正確，分數正確 |
| IT-02-06 | 預測流程 | 問牌後 → postQuestionPhase → 預測 → endTurn | 預測記錄正確 |
| IT-02-07 | 回合切換 | 動作完成 → 切換玩家 → 廣播 | 下一位玩家收到通知 |
| IT-02-08 | 局結束流程 | 猜對/所有人退出 → roundEnd → startNextRound | 新局正確初始化 |
| IT-02-09 | 遊戲結束流程 | 達到7分 → finished → 宣布獲勝者 | 正確顯示獲勝者 |

### 2.3 重連整合測試 (IT-03)
**檔案**：`frontend/src/__tests__/integration/reconnection.test.js`

| 編號 | 測試案例 | 步驟 | 預期結果 |
|------|---------|------|---------|
| IT-03-01 | 斷線重連成功 | 斷開連線 → 自動重連 → reconnected 事件 | 恢復遊戲狀態 |
| IT-03-02 | 重整重連成功 | 模擬重整 → 自動重連 → 恢復狀態 | 遊戲可繼續 |
| IT-03-03 | 重連超時處理 | 斷線 → 超過超時時間 | 玩家被移除，通知其他玩家 |
| IT-03-04 | 多人同時斷線 | 2人同時斷線 → 重連 | 各自恢復正確狀態 |

### 2.4 認證整合測試 (IT-04)
**檔案**：`frontend/src/__tests__/integration/auth.test.js`

| 編號 | 測試案例 | 步驟 | 預期結果 |
|------|---------|------|---------|
| IT-04-01 | 登入後進入大廳 | Google 登入 → 進入大廳 | 顯示玩家資訊 |
| IT-04-02 | 未登入重導向 | 未登入訪問遊戲頁 | 重導向至登入頁 |
| IT-04-03 | 登出清除狀態 | 登出 → 清除狀態 | 重導向至登入頁 |

### 2.5 Socket 事件整合測試 (IT-05)
**檔案**：`backend/__tests__/socket.integration.test.js`

| 編號 | 測試案例 | 觸發條件 | 預期事件 |
|------|---------|---------|---------|
| IT-05-01 | roomCreated 事件 | 創建房間 | 發送給創建者 |
| IT-05-02 | joinedRoom 事件 | 加入房間 | 發送給加入者 |
| IT-05-03 | gameState 事件 | 狀態變更 | 廣播給所有玩家 |
| IT-05-04 | colorChoiceRequired 事件 | 問牌類型2需選擇 | 發送給被要牌者 |
| IT-05-05 | followGuessStarted 事件 | 猜牌開始 | 廣播給所有玩家 |
| IT-05-06 | guessResult 事件 | 猜牌結算 | 廣播給所有玩家 |
| IT-05-07 | postQuestionPhase 事件 | 問牌完成 | 發送給當前玩家 |
| IT-05-08 | error 事件 | 發生錯誤 | 發送給相關玩家 |

---

## 三、測試程式碼範例

### 3.1 遊戲流程整合測試範例

```javascript
import { Server } from 'socket.io';
import Client from 'socket.io-client';

describe('遊戲流程整合測試', () => {
  let io, serverSocket;
  let clientA, clientB, clientC;
  let gameId;

  beforeAll((done) => {
    // 啟動測試伺服器
    io = new Server(3002);
    // 載入後端遊戲邏輯
    require('../../backend/server.js').attachToServer(io);
    done();
  });

  afterAll(() => {
    io.close();
  });

  beforeEach(async () => {
    clientA = Client('http://localhost:3002');
    clientB = Client('http://localhost:3002');
    clientC = Client('http://localhost:3002');

    await Promise.all([
      waitForConnect(clientA),
      waitForConnect(clientB),
      waitForConnect(clientC)
    ]);
  });

  afterEach(() => {
    clientA.close();
    clientB.close();
    clientC.close();
  });

  describe('IT-02-01: 開始遊戲流程', () => {
    test('房主開始遊戲後所有玩家收到初始狀態', async () => {
      // Step 1: 創建房間
      clientA.emit('createRoom', {
        player: { id: 'player-a', name: '玩家A' },
        maxPlayers: 3
      });
      const { gameId: roomId } = await waitForEvent(clientA, 'roomCreated');
      gameId = roomId;

      // Step 2: 其他玩家加入
      clientB.emit('joinRoom', {
        gameId,
        player: { id: 'player-b', name: '玩家B' }
      });
      await waitForEvent(clientB, 'joinedRoom');

      clientC.emit('joinRoom', {
        gameId,
        player: { id: 'player-c', name: '玩家C' }
      });
      await waitForEvent(clientC, 'joinedRoom');

      // Step 3: 房主開始遊戲
      clientA.emit('startGame', { gameId });

      // Step 4: 驗證所有玩家收到遊戲狀態
      const [stateA, stateB, stateC] = await Promise.all([
        waitForEvent(clientA, 'gameState'),
        waitForEvent(clientB, 'gameState'),
        waitForEvent(clientC, 'gameState')
      ]);

      // 驗證狀態
      expect(stateA.gamePhase).toBe('playing');
      expect(stateA.players).toHaveLength(3);
      expect(stateA.hiddenCards).toHaveLength(2);

      // 驗證每個玩家手牌不同
      expect(stateA.players[0].hand).toHaveLength(4);
      expect(stateB.players[0].hand).toHaveLength(4); // 自己看得到手牌
    });
  });

  describe('IT-02-04: 猜牌流程', () => {
    test('完整猜牌和跟猜流程', async () => {
      // 假設遊戲已開始
      await setupGame(clientA, clientB, clientC);

      // Step 1: 玩家A猜牌
      clientA.emit('gameAction', {
        gameId,
        action: {
          type: 'guess',
          playerId: 'player-a',
          guessedColors: ['red', 'blue']
        }
      });

      // Step 2: 驗證跟猜開始事件
      const [followB, followC] = await Promise.all([
        waitForEvent(clientB, 'followGuessStarted'),
        waitForEvent(clientC, 'followGuessStarted')
      ]);

      expect(followB.guessingPlayerId).toBe('player-a');
      expect(followB.guessedColors).toEqual(['red', 'blue']);

      // Step 3: 玩家B決定跟猜
      clientB.emit('followGuessResponse', {
        gameId,
        playerId: 'player-b',
        isFollowing: true
      });

      // Step 4: 玩家C決定不跟
      clientC.emit('followGuessResponse', {
        gameId,
        playerId: 'player-c',
        isFollowing: false
      });

      // Step 5: 等待結果
      const [resultA, resultB, resultC] = await Promise.all([
        waitForEvent(clientA, 'guessResult'),
        waitForEvent(clientB, 'guessResult'),
        waitForEvent(clientC, 'guessResult')
      ]);

      // 驗證結果結構
      expect(resultA).toHaveProperty('isCorrect');
      expect(resultA).toHaveProperty('scoreChanges');
      expect(resultA).toHaveProperty('hiddenCards');
    });
  });
});

// 輔助函數
function waitForEvent(client, eventName, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${eventName}`));
    }, timeout);

    client.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function waitForConnect(client) {
  return new Promise((resolve) => {
    if (client.connected) {
      resolve();
    } else {
      client.on('connect', resolve);
    }
  });
}
```

### 3.2 重連整合測試範例

```javascript
describe('重連整合測試', () => {
  describe('IT-03-01: 斷線重連成功', () => {
    test('斷線後自動重連並恢復狀態', async () => {
      // 設置遊戲
      await setupGame(clientA, clientB, clientC);

      // 保存 localStorage
      localStorage.setItem('lastRoomId', gameId);
      localStorage.setItem('lastPlayerId', 'player-b');
      localStorage.setItem('lastPlayerName', '玩家B');

      // 模擬斷線
      clientB.disconnect();

      // 等待一下
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 重新連線
      clientB.connect();

      // 等待重連成功
      const reconnectedData = await waitForEvent(clientB, 'reconnected');

      // 驗證狀態恢復
      expect(reconnectedData.success).toBe(true);
      expect(reconnectedData.gameState).toBeDefined();
      expect(reconnectedData.gameState.players).toContainEqual(
        expect.objectContaining({ id: 'player-b' })
      );
    });
  });

  describe('IT-03-03: 重連超時處理', () => {
    test('超時後玩家被移除', async () => {
      await setupGame(clientA, clientB, clientC);

      // 玩家B斷線
      clientB.disconnect();

      // 等待超時（假設超時為 10 秒）
      await new Promise(resolve => setTimeout(resolve, 15000));

      // 驗證玩家A和C收到離開通知
      const leftEventA = await waitForEvent(clientA, 'playerLeft');

      expect(leftEventA.playerId).toBe('player-b');
    }, 20000); // 增加測試超時
  });
});
```

---

## 四、驗收標準

- [ ] 所有 28 個整合測試案例通過
- [ ] 前後端通訊正常
- [ ] 事件順序正確
- [ ] 狀態同步正確
- [ ] 錯誤處理正確

---

## 五、執行命令

```bash
# 啟動測試伺服器（需要同時啟動前後端）
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start

# 執行整合測試
cd frontend && npm test -- --testPathPattern="__tests__/integration"

# 或使用 Jest 並行執行
cd frontend && npm test -- --runInBand --testPathPattern="integration"
```

---

## 六、測試檔案清單

| 檔案路徑 | 狀態 |
|---------|------|
| `frontend/src/__tests__/integration/roomManagement.test.js` | 需新建 |
| `frontend/src/__tests__/integration/gameFlow.test.js` | 已存在，需補充 |
| `frontend/src/__tests__/integration/reconnection.test.js` | 需新建 |
| `frontend/src/__tests__/integration/auth.test.js` | 需新建 |
| `backend/__tests__/socket.integration.test.js` | 需新建 |

---

## 七、測試環境配置

### 7.1 Jest 配置
```javascript
// jest.integration.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  setupFilesAfterEnv: ['./jest.integration.setup.js'],
  testTimeout: 30000
};
```

### 7.2 環境變數
```bash
TEST_SOCKET_URL=http://localhost:3002
TEST_TIMEOUT=30000
```
