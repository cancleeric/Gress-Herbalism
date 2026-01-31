# 工作單 0153

**日期**：2026-01-27

**工作單標題**：單元測試 - 後端遊戲邏輯服務

**工單主旨**：測試 - 後端核心遊戲邏輯（問牌、猜牌、跟猜、預測、計分）的單元測試

**優先級**：高

**依賴工單**：0151

**計畫書**：`docs/TEST_PLAN.md`

---

## 一、測試範圍

### 1.1 測試目標

| 功能模組 | 測試案例數 |
|---------|-----------|
| 房間管理 | 8 |
| 遊戲狀態管理 | 6 |
| 問牌邏輯 | 10 |
| 猜牌邏輯 | 7 |
| 跟猜機制 | 7 |
| 預測機制 | 8 |
| 計分系統 | 6 |
| **小計** | **52** |

### 1.2 覆蓋率目標
- 目標覆蓋率：85%

---

## 二、測試案例清單

### 2.1 房間管理測試 (UT-BE-01)
**檔案**：`backend/__tests__/socket.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-BE-01-01 | createRoom 創建房間 | 成功創建並返回房間 ID |
| UT-BE-01-02 | createRoom 設置房主 | 第一位玩家為房主 |
| UT-BE-01-03 | joinRoom 加入房間 | 成功加入並廣播更新 |
| UT-BE-01-04 | joinRoom 房間不存在 | 返回「房間不存在」錯誤 |
| UT-BE-01-05 | joinRoom 房間已滿 | 返回「房間已滿」錯誤 |
| UT-BE-01-06 | leaveRoom 離開房間 | 成功離開並廣播更新 |
| UT-BE-01-07 | leaveRoom 房主離開 | 轉移房主給下一位或關閉房間 |
| UT-BE-01-08 | 密碼房間驗證 | 正確驗證密碼 |

### 2.2 遊戲狀態管理測試 (UT-BE-02)
**檔案**：`backend/__tests__/socket.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-BE-02-01 | startGame 開始遊戲 | 正確初始化遊戲狀態 |
| UT-BE-02-02 | startGame 人數不足 | 返回「需要至少3位玩家」錯誤 |
| UT-BE-02-03 | startGame 發牌正確 | 蓋牌2張，手牌分配正確 |
| UT-BE-02-04 | 回合切換 | 正確切換到下一位活躍玩家 |
| UT-BE-02-05 | 跳過已退出玩家 | 輪流時自動跳過不活躍玩家 |
| UT-BE-02-06 | broadcastGameState | 正確廣播給房間內所有玩家 |

### 2.3 問牌邏輯測試 (UT-BE-03)
**檔案**：`backend/__tests__/socket.test.js`

| 編號 | 測試案例 | 測試資料 | 預期結果 |
|------|---------|---------|---------|
| UT-BE-03-01 | 類型1 - 兩色都有 | 目標有紅1藍2 | 各給一張，共2張 |
| UT-BE-03-02 | 類型1 - 只有一種 | 目標只有紅1 | 只給紅色1張 |
| UT-BE-03-03 | 類型1 - 都沒有 | 目標無紅無藍 | 返回0張 |
| UT-BE-03-04 | 類型2 - 有該顏色 | 目標有紅3，選紅 | 給紅色全部3張 |
| UT-BE-03-05 | 類型2 - 沒有該顏色 | 目標無紅，選紅 | 返回0張 |
| UT-BE-03-06 | 類型2 - 需選擇 | 目標有紅2藍3 | 被要牌者選擇給哪種 |
| UT-BE-03-07 | 類型3 - 正常交換 | 有紅1，對方有藍2 | 給1張得2張 |
| UT-BE-03-08 | 類型3 - 對方沒有 | 有紅1，對方無藍 | 給出的牌不收回 |
| UT-BE-03-09 | 問牌記錄到歷史 | 任意問牌 | gameHistory 記錄正確 |
| UT-BE-03-10 | 向已退出玩家問牌 | 目標isActive=false | 允許問牌 |

### 2.4 猜牌邏輯測試 (UT-BE-04)
**檔案**：`backend/__tests__/socket.test.js`

| 編號 | 測試案例 | 測試資料 | 預期結果 |
|------|---------|---------|---------|
| UT-BE-04-01 | 猜對 - 基本流程 | 蓋牌[紅,藍]，猜[紅,藍] | 猜牌者+3分 |
| UT-BE-04-02 | 猜對 - 達到7分 | 現有4分，猜對+3 | gamePhase=finished |
| UT-BE-04-03 | 猜錯 - 無跟猜 | 蓋牌[紅,藍]，猜[紅,綠] | 猜牌者isActive=false |
| UT-BE-04-04 | 猜錯 - 有跟猜 | 有1人跟猜 | 猜牌者和跟猜者都退出 |
| UT-BE-04-05 | 猜錯 - 所有人退出 | 3人，2人跟猜都錯 | gamePhase=roundEnd |
| UT-BE-04-06 | 顏色順序不影響 | 猜[紅,藍] vs 蓋牌[藍,紅] | 判定為猜對 |
| UT-BE-04-07 | 可重複顏色 | 蓋牌[紅,紅]，猜[紅,紅] | 判定為猜對 |

### 2.5 跟猜機制測試 (UT-BE-05)
**檔案**：`backend/__tests__/socket.test.js`

| 編號 | 測試案例 | 測試資料 | 預期結果 |
|------|---------|---------|---------|
| UT-BE-05-01 | 跟猜流程啟動 | 3人，玩家1猜牌 | 通知玩家2、3跟猜 |
| UT-BE-05-02 | 按順序決定 | 順序為玩家2→3 | 先詢問玩家2 |
| UT-BE-05-03 | 跟猜 + 猜對 | 玩家2跟猜 | 玩家2獲得+1分 |
| UT-BE-05-04 | 跟猜 + 猜錯 | 玩家2跟猜 | 玩家2扣1分並退出 |
| UT-BE-05-05 | 不跟猜 | 玩家2不跟 | 玩家2分數不變 |
| UT-BE-05-06 | 0分跟猜錯 | 玩家2有0分，跟猜錯 | 維持0分不變負 |
| UT-BE-05-07 | 等待所有人決定 | 3人遊戲 | 等2人都決定才驗證 |

### 2.6 預測機制測試 (UT-BE-06)
**檔案**：`backend/__tests__/prediction.test.js`

| 編號 | 測試案例 | 測試資料 | 預期結果 |
|------|---------|---------|---------|
| UT-BE-06-01 | 記錄預測 | 玩家預測紅色 | 正確記錄到predictions |
| UT-BE-06-02 | 預測正確 | 蓋牌有紅，預測紅 | 預測者+1分 |
| UT-BE-06-03 | 預測錯誤 | 蓋牌無紅，預測紅 | 預測者-1分 |
| UT-BE-06-04 | 0分預測錯 | 0分玩家預測錯 | 維持0分 |
| UT-BE-06-05 | 未預測 | 玩家未預測 | 分數不影響 |
| UT-BE-06-06 | 多次預測記錄 | 同一玩家多次預測 | 保留所有預測記錄 |
| UT-BE-06-07 | 新局清除預測 | 新局開始 | predictions 清空 |
| UT-BE-06-08 | 預測結算時機 | 有人猜對時 | 結算所有預測 |

### 2.7 計分系統測試 (UT-BE-07)
**檔案**：`backend/__tests__/socket.test.js`

| 編號 | 測試案例 | 測試資料 | 預期結果 |
|------|---------|---------|---------|
| UT-BE-07-01 | 猜對得分 | 猜對 | +3分 |
| UT-BE-07-02 | 跟猜正確得分 | 跟猜且猜對 | +1分 |
| UT-BE-07-03 | 跟猜錯誤扣分 | 跟猜且猜錯 | -1分 |
| UT-BE-07-04 | 最低分數 | 0分被扣分 | 維持0分 |
| UT-BE-07-05 | 勝利判定 | 達到7分 | winner設為該玩家 |
| UT-BE-07-06 | 分數跨局保留 | 新局開始 | 分數不重置 |

---

## 三、測試程式碼範例

### 3.1 問牌邏輯測試範例

```javascript
const { Server } = require('socket.io');
const Client = require('socket.io-client');

describe('問牌邏輯測試', () => {
  let io, clientA, clientB, clientC;
  let serverSocket;
  let gameId;

  beforeAll((done) => {
    io = new Server(3002);
    io.on('connection', (socket) => {
      serverSocket = socket;
    });
    done();
  });

  afterAll(() => {
    io.close();
  });

  beforeEach(async () => {
    // 創建測試遊戲並初始化
    clientA = Client('http://localhost:3002');
    clientB = Client('http://localhost:3002');
    clientC = Client('http://localhost:3002');

    // 設置測試遊戲狀態
    gameId = 'test-game-' + Date.now();
  });

  afterEach(() => {
    clientA.close();
    clientB.close();
    clientC.close();
  });

  describe('類型1 - 各一張', () => {
    test('UT-BE-03-01: 兩色都有時各給一張', async () => {
      // 設置目標玩家手牌：紅1張、藍2張
      const targetHand = [
        { id: 'r1', color: 'red' },
        { id: 'b1', color: 'blue' },
        { id: 'b2', color: 'blue' }
      ];

      // 執行問牌類型1
      const action = {
        type: 'question',
        playerId: 'player-a',
        targetPlayerId: 'player-b',
        colors: ['red', 'blue'],
        questionType: 1
      };

      // 驗證結果
      // 應該轉移2張牌（紅1 + 藍1）
      expect(transferredCards).toHaveLength(2);
      expect(transferredCards.filter(c => c.color === 'red')).toHaveLength(1);
      expect(transferredCards.filter(c => c.color === 'blue')).toHaveLength(1);
    });

    test('UT-BE-03-02: 只有一種顏色時只給一張', async () => {
      // 設置目標玩家手牌：只有紅1張
      const targetHand = [{ id: 'r1', color: 'red' }];

      const action = {
        type: 'question',
        playerId: 'player-a',
        targetPlayerId: 'player-b',
        colors: ['red', 'blue'],
        questionType: 1
      };

      // 應該只轉移1張紅牌
      expect(transferredCards).toHaveLength(1);
      expect(transferredCards[0].color).toBe('red');
    });

    test('UT-BE-03-03: 都沒有時返回0張', async () => {
      // 設置目標玩家手牌：只有綠色
      const targetHand = [{ id: 'g1', color: 'green' }];

      const action = {
        type: 'question',
        playerId: 'player-a',
        targetPlayerId: 'player-b',
        colors: ['red', 'blue'],
        questionType: 1
      };

      // 應該轉移0張牌
      expect(transferredCards).toHaveLength(0);
    });
  });

  describe('類型2 - 其中一種全部', () => {
    test('UT-BE-03-04: 有該顏色時給全部', async () => {
      // 設置目標玩家手牌：紅3張
      const targetHand = [
        { id: 'r1', color: 'red' },
        { id: 'r2', color: 'red' },
        { id: 'r3', color: 'red' }
      ];

      const action = {
        type: 'question',
        playerId: 'player-a',
        targetPlayerId: 'player-b',
        colors: ['red', 'blue'],
        questionType: 2,
        selectedColor: 'red'
      };

      // 應該轉移全部3張紅牌
      expect(transferredCards).toHaveLength(3);
      expect(transferredCards.every(c => c.color === 'red')).toBe(true);
    });
  });

  describe('類型3 - 給一張要全部', () => {
    test('UT-BE-03-08: 對方沒有要的顏色，給出的牌不收回', async () => {
      // 發起者有紅牌，對方沒有藍牌
      const askerHand = [{ id: 'r1', color: 'red' }];
      const targetHand = [{ id: 'g1', color: 'green' }];

      const action = {
        type: 'question',
        playerId: 'player-a',
        targetPlayerId: 'player-b',
        colors: ['red', 'blue'],
        questionType: 3,
        giveColor: 'red',
        getColor: 'blue'
      };

      // 發起者給出紅牌（不收回）
      // 對方沒有藍牌所以不轉移
      // 結果：發起者少1張紅牌，對方多1張紅牌
    });
  });
});
```

### 3.2 跟猜機制測試範例

```javascript
describe('跟猜機制測試', () => {
  test('UT-BE-05-01: 跟猜流程啟動', async () => {
    // 3人遊戲，玩家A猜牌
    const guessAction = {
      type: 'guess',
      playerId: 'player-a',
      guessedColors: ['red', 'blue']
    };

    // 發送猜牌動作
    clientA.emit('gameAction', { gameId, action: guessAction });

    // 驗證：玩家B和C應該收到跟猜通知
    const followGuessEvent = await waitForEvent(clientB, 'followGuessStarted');

    expect(followGuessEvent.guessingPlayerId).toBe('player-a');
    expect(followGuessEvent.guessedColors).toEqual(['red', 'blue']);
    expect(followGuessEvent.decisionOrder).toContain('player-b');
    expect(followGuessEvent.decisionOrder).toContain('player-c');
  });

  test('UT-BE-05-06: 0分跟猜錯不變負分', async () => {
    // 設置玩家B分數為0
    gameState.players[1].score = 0;

    // 玩家B選擇跟猜
    clientB.emit('followGuessResponse', {
      gameId,
      playerId: 'player-b',
      isFollowing: true
    });

    // 猜錯
    // 驗證玩家B分數仍為0
    expect(updatedState.players[1].score).toBe(0);
  });
});
```

---

## 四、驗收標準

- [ ] 所有 52 個測試案例通過
- [ ] 覆蓋率達到 85%
- [ ] 無 console 錯誤或警告
- [ ] 所有邊界情況正確處理

---

## 五、執行命令

```bash
# 執行後端測試
cd backend && npm test

# 執行特定測試
cd backend && npm test -- --testPathPattern="socket.test.js"
cd backend && npm test -- --testPathPattern="prediction.test.js"

# 查看覆蓋率
cd backend && npm test -- --coverage
```

---

## 六、測試檔案清單

| 檔案路徑 | 狀態 |
|---------|------|
| `backend/__tests__/socket.test.js` | 已存在，需補充 |
| `backend/__tests__/prediction.test.js` | 已存在，需補充 |
| `backend/__tests__/scoring.test.js` | 需新建 |
