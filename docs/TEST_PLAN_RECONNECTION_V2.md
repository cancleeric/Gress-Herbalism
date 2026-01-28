# 測試計畫書：重新整理重連功能 — 自動化測試與覆蓋率提升（V2）

## 一、測試背景

### 1.1 前情摘要

前次測試（工單 0188-0194）透過程式碼審查發現 7 個問題（BUG-001 ~ BUG-007），其中 4 個已在 commit `787a021`（版本 1.0.191）中修復：

| BUG 編號 | 嚴重度 | 問題描述 | 修復狀態 |
|---------|--------|---------|---------|
| BUG-001 | Critical | `getClientGameState` 函數未定義，重連回應無法發送 | 已修復 |
| BUG-002 | High | GameRoom 頁面無主動重連邏輯 | 已修復 |
| BUG-003 | High | `beforeunload` handler 僅在 Lobby 註冊 | 已修復（移至 GameRoom） |
| BUG-004 | Medium | 跟猜階段無重連恢復邏輯 | 已修復 |
| BUG-005 | Medium | `clearPersistedState` 未被呼叫 | 已修復 |
| BUG-006 | Medium | Cloud Run session affinity 需求 | 未修復（部署層級） |
| BUG-007 | Low | localStorage 無資料完整性驗證 | 未修復（影響有限） |

### 1.2 目前測試覆蓋率

#### 前端（frontend）
| 模組 | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **All files** | **82.83%** | **71.49%** | **81.38%** | **83.42%** |
| src/components/GameRoom | 57.34% | 49.69% | 47.4% | 57.8% |
| src/services | 66.3% | 51.85% | 66.01% | 66.79% |
| src/components/Lobby | 75.55% | 66.66% | 61.53% | 76.71% |
| src/store | 100% | 100% | 100% | 100% |
| src/utils | 93.2% | 97.05% | 98.43% | 92.47% |

- 測試套件：64 個（49 通過，**15 失敗**）
- 測試案例：1366 個（1275 通過，**91 失敗**）
- **失敗主因**：commit `787a021` 新增 `onReconnected` 但現有 mock 未更新，導致 `unsubReconnected is not a function` 錯誤

#### 後端（backend）
| 模組 | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **All files** | **21.63%** | **23.42%** | **27.66%** | **20.7%** |
| server.js | 0% | 0% | 0% | 0% |
| backend/logic | 95.69% | 98.07% | 100% | 95.12% |
| backend/services | 92.57% | 80.8% | 100% | 96% |

- 測試套件：10 個（全部通過）
- 測試案例：194 個（全部通過）
- **主要缺口**：`server.js`（1933 行）覆蓋率 0%，包含所有 Socket 事件處理和重連邏輯

### 1.3 本次測試目標

1. **修復現有失敗測試**：更新 socketService mock，解決 91 個失敗測試
2. **撰寫自動化測試**：針對重連功能撰寫可執行的 Jest 測試程式碼
3. **覆蓋率目標**：
   - 前端整體 ≥ 80%（目前 82.83%，修復失敗後維持）
   - 前端 GameRoom ≥ 70%（目前 57.34%，重點提升）
   - 前端 services ≥ 80%（目前 66.3%，重點提升）
   - 後端整體 ≥ 40%（目前 21.63%，`server.js` 從 0% 提升）
   - 後端 server.js 重連相關函數 ≥ 80%
4. **驗證修復有效性**：透過自動化測試確認 BUG-001 ~ BUG-005 修復正確

> **說明**：後端 `server.js` 為 1933 行的單體檔案，內含所有 Socket 事件處理邏輯。要達到整體 80% 需大量重構或 mock。本計畫聚焦於重連相關函數的測試覆蓋，後端整體目標設為 40%，重連相關函數目標 80%。

### 1.4 測試環境與工具

| 項目 | 前端 | 後端 |
|------|------|------|
| 測試框架 | Jest（react-scripts 內建） | Jest 30.2.0 |
| 元件測試 | @testing-library/react 14.3.1 | — |
| Socket 測試 | Mock socket（jest.mock） | socket.io-client + 真實測試伺服器 |
| 覆蓋率工具 | Jest --coverage | Jest --coverage |
| 版本 | 1.0.191 | 1.0.191 |

---

## 二、測試範圍與工單規劃

### 2.1 測試架構圖

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         測試計畫總覽                                      │
├───────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│    階段一       │    階段二      │    階段三      │    階段四      │   階段五    │
│   修復既有測試   │  前端單元測試   │  後端整合測試   │  回歸與場景    │   綜合報告   │
│               │   撰寫/優化    │   撰寫/優化    │   測試撰寫    │            │
│               │              │              │             │            │
│ ● 更新 mock   │ ● GameRoom   │ ● server.js  │ ● 重連場景   │ ● 覆蓋率   │
│ ● 修復 91 個  │   重連測試     │   重連函數     │   E2E 測試   │   達標確認  │
│   失敗測試     │ ● socketSvc  │ ● 斷線處理     │ ● 邊界條件   │ ● 風險評估  │
│              │   重連測試     │ ● 跟猜恢復     │ ● 回歸驗證   │ ● 問題清單  │
│              │ ● localStorage│              │             │            │
│              │   重連測試     │              │             │            │
└───────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

### 2.2 工單規劃

| 工單編號 | 階段 | 類型 | 工作內容 | 產出 |
|---------|------|------|---------|------|
| 0199 | 一 | 修復 | 修復前端 socketService mock，解決 91 個失敗測試 | 修改測試檔案 |
| 0200 | 二 | 撰寫 | 前端 GameRoom 重連邏輯單元測試 | 新增/修改 `GameRoom.test.js` |
| 0201 | 二 | 撰寫 | 前端 socketService 重連函數單元測試 | 新增/修改 `socketService.test.js` |
| 0202 | 三 | 撰寫 | 後端 `handlePlayerReconnect` 與 `handlePlayerDisconnect` 整合測試 | 修改 `reconnection.test.js` |
| 0203 | 四 | 撰寫 | 重連場景 E2E 測試與回歸測試 | 新增/修改測試檔案 |
| 0204 | 五 | 報告 | 覆蓋率確認、測試結果彙整與風險評估 | `REPORT_0204.md` |

---

## 三、階段一：修復既有失敗測試（工單 0199）

### 3.1 問題分析

commit `787a021` 在 `GameRoom.js` 中新增了 `onReconnected`、`onConnectionChange`、`attemptReconnect` 的 import 和使用，但 `GameRoom.test.js` 的 socketService mock 未同步更新。

**錯誤訊息**：
```
TypeError: unsubReconnected is not a function
    at src/components/GameRoom/GameRoom.js:595:7
```

**原因**：`socketService.onReconnected` 未被 mock，返回 `undefined`，在 cleanup 函數中呼叫 `unsubReconnected()` 時報錯。

### 3.2 修復內容

#### FIX-0199-01：更新 `GameRoom.test.js` 的 socketService mock

在 `beforeEach` 中補充以下 mock：

```javascript
// 工單 0196 新增的重連相關 mock
socketService.onReconnected.mockImplementation((callback) => {
  socketCallbacks.reconnected = callback;
  return () => {};  // 返回 unsubscribe 函數
});
socketService.onConnectionChange.mockImplementation((callback) => {
  socketCallbacks.connectionChange = callback;
  return () => {};
});
socketService.attemptReconnect.mockImplementation(() => {});
```

#### FIX-0199-02：更新 `clearPersistedState` mock

確認 `gameStore.js` 的 `clearPersistedState` export 在測試中被正確 mock。

### 3.3 驗收標準

- [ ] 所有 64 個前端測試套件通過
- [ ] 所有 1366 個前端測試案例通過
- [ ] 前端覆蓋率維持 ≥ 82%
- [ ] 執行 `npm test -- --watchAll=false` 零失敗

---

## 四、階段二：前端單元測試撰寫（工單 0200-0201）

### 4.1 工單 0200：GameRoom 重連邏輯單元測試

**測試檔案**：`frontend/src/components/GameRoom/GameRoom.test.js`（新增測試案例）

**目標覆蓋率**：GameRoom 模組 Statements ≥ 70%（目前 57.34%）

#### TC-0200-01：重連 useEffect — 連線後觸發重連

```javascript
describe('工單 0196：GameRoom 重連邏輯', () => {
  test('連線後有儲存的房間資訊時應觸發重連', () => {
    // Arrange: mock getCurrentRoom 返回有效資料
    // Act: 觸發 onConnectionChange(true)
    // Assert: attemptReconnect 被呼叫且參數正確
  });

  test('連線後沒有儲存的房間資訊時不應觸發重連', () => {
    // Arrange: mock getCurrentRoom 返回 null
    // Act: 觸發 onConnectionChange(true)
    // Assert: attemptReconnect 未被呼叫
  });

  test('savedRoom.roomId 與當前 gameId 不符時不應觸發重連', () => {
    // Arrange: mock getCurrentRoom 返回不同 roomId
    // Act: 觸發 onConnectionChange(true)
    // Assert: attemptReconnect 未被呼叫
  });

  test('單人模式不應觸發重連', () => {
    // Arrange: isLocalMode = true
    // Act: 渲染 GameRoom
    // Assert: onConnectionChange 未被呼叫
  });
});
```

#### TC-0200-02：onReconnected handler

```javascript
describe('工單 0196：重連成功 handler', () => {
  test('收到 reconnected 事件時應更新 Redux store', () => {
    // Arrange: 渲染 GameRoom
    // Act: 觸發 socketCallbacks.reconnected({ gameId, playerId, gameState })
    // Assert: store 中的 gamePhase, players 等欄位已更新
  });

  test('重連成功後應設定 isLoading 為 false', () => {
    // Arrange: 渲染 GameRoom
    // Act: 觸發 reconnected callback
    // Assert: 載入指示器消失
  });
});
```

#### TC-0200-03：beforeunload handler（工單 0118 移至 GameRoom）

```javascript
describe('工單 0118：beforeunload handler', () => {
  test('頁面卸載時應發送 playerRefreshing 事件', () => {
    // Arrange: 渲染 GameRoom 並設定 gameState
    // Act: 觸發 window beforeunload 事件
    // Assert: emitPlayerRefreshing 被呼叫且參數包含 gameId 和 playerId
  });

  test('沒有 gameId 或 playerId 時不應發送', () => {
    // Arrange: gameState 中無有效 playerId
    // Act: 觸發 beforeunload
    // Assert: emitPlayerRefreshing 未被呼叫
  });
});
```

#### TC-0200-04：handleLeaveRoom 清理流程（工單 0198）

```javascript
describe('工單 0198：離開房間清理', () => {
  test('離開房間時應依序清理所有狀態', () => {
    // Arrange: 渲染 GameRoom
    // Act: 點擊離開按鈕
    // Assert:
    //   1. clearCurrentRoom() 被呼叫
    //   2. clearPersistedState() 被呼叫
    //   3. navigate('/') 被呼叫
  });
});
```

### 4.2 工單 0201：socketService 重連函數單元測試

**測試檔案**：`frontend/src/services/socketService.test.js`（新增測試案例）

**目標覆蓋率**：services 模組 Statements ≥ 80%（目前 66.3%）

#### TC-0201-01：attemptReconnect 函數

```javascript
describe('attemptReconnect', () => {
  test('應發送 reconnect 事件到 socket', () => {
    // Act: attemptReconnect('room1', 'player1', '玩家A')
    // Assert: socket.emit('reconnect', { roomId, playerId, playerName })
  });

  test('參數應正確傳遞', () => {
    // 驗證 roomId, playerId, playerName 三個參數完整傳遞
  });
});
```

#### TC-0201-02：onReconnected 函數

```javascript
describe('onReconnected', () => {
  test('應註冊 reconnected 事件監聽', () => {
    // Act: onReconnected(callback)
    // Assert: socket.on('reconnected', ...) 被呼叫
  });

  test('應返回 unsubscribe 函數', () => {
    // Act: const unsub = onReconnected(callback)
    // Assert: typeof unsub === 'function'
    // Act: unsub()
    // Assert: socket.off('reconnected', ...) 被呼叫
  });
});
```

#### TC-0201-03：onReconnectFailed 函數

```javascript
describe('onReconnectFailed', () => {
  test('應註冊 reconnectFailed 事件監聽', () => {
    // 同上模式
  });
});
```

#### TC-0201-04：emitPlayerRefreshing 函數

```javascript
describe('emitPlayerRefreshing', () => {
  test('socket 連線時應發送事件', () => {
    // Arrange: socket.connected = true
    // Act: emitPlayerRefreshing('game1', 'player1')
    // Assert: socket.emit('playerRefreshing', { gameId, playerId })
  });

  test('socket 未連線時不應發送事件', () => {
    // Arrange: socket.connected = false
    // Act: emitPlayerRefreshing('game1', 'player1')
    // Assert: socket.emit 未被呼叫
  });
});
```

#### TC-0201-05：onConnectionChange 函數

```javascript
describe('onConnectionChange', () => {
  test('應註冊 connect 和 disconnect 事件監聽', () => {
    // Act: onConnectionChange(callback)
    // Assert: socket.on('connect') 和 socket.on('disconnect') 被呼叫
  });

  test('connect 時 callback 應收到 true', () => {
    // 觸發 connect 事件，驗證 callback(true)
  });

  test('disconnect 時 callback 應收到 false', () => {
    // 觸發 disconnect 事件，驗證 callback(false)
  });

  test('應返回 unsubscribe 函數', () => {
    // unsub() 後應移除兩個事件監聽
  });
});
```

#### TC-0201-06：Socket.io 自動重連事件處理

```javascript
describe('Socket.io reconnect 自動重連', () => {
  test('reconnect 事件觸發時應讀取 localStorage 並發送重連', () => {
    // Arrange: localStorage 中有 savedRoom 資訊
    // Act: 觸發 socket reconnect 事件
    // Assert: socket.emit('reconnect', { roomId, playerId, playerName })
  });

  test('localStorage 無資料時 reconnect 事件不應發送重連', () => {
    // Arrange: localStorage 無資料
    // Act: 觸發 socket reconnect
    // Assert: socket.emit 未被額外呼叫
  });

  test('應支援 legacy key fallback', () => {
    // Arrange: 設定 lastRoomId, lastPlayerId, lastPlayerName
    // Act: 觸發 reconnect
    // Assert: 使用 legacy key 的值
  });
});
```

---

## 五、階段三：後端整合測試撰寫（工單 0202）

### 5.1 工單 0202：後端重連函數整合測試

**測試檔案**：`backend/__tests__/reconnection.test.js`（擴充現有測試）

**目標**：重連相關函數覆蓋率 ≥ 80%

現有 `reconnection.test.js` 已有良好的測試伺服器架構（使用真實 Socket.io），但缺少以下場景的測試。以下為需新增的測試案例：

#### TC-0202-01：BUG-001 驗證 — reconnected 事件 payload

```javascript
describe('BUG-001 修復驗證：reconnected 事件', () => {
  test('重連成功時應發送包含完整 gameState 的 reconnected 事件', async () => {
    // Arrange: 建立房間 → 開始遊戲 → 玩家斷線
    // Act: 新 Socket 發送 reconnect_request
    // Assert: 收到 reconnected 事件
    //   - gameId 正確
    //   - playerId 正確
    //   - gameState 包含 players, gamePhase, hiddenCards 等
    //   - 不拋出 ReferenceError
  });

  test('gameState 應包含所有必要遊戲欄位', async () => {
    // Assert: gameState 包含:
    //   players, maxPlayers, gamePhase, currentPlayerIndex,
    //   hiddenCards, gameHistory
  });
});
```

#### TC-0202-02：BUG-004 驗證 — 跟猜階段重連恢復

在測試伺服器中新增 `followGuessStates` Map，並加入跟猜階段的測試：

```javascript
describe('BUG-004 修復驗證：跟猜階段重連', () => {
  test('跟猜階段重連時應收到 followGuessStarted 事件', async () => {
    // Arrange:
    //   1. 建立 3 人房間 → 開始遊戲
    //   2. 設定 followGuessStates（模擬猜牌觸發跟猜）
    //   3. 玩家斷線
    // Act: 玩家重連
    // Assert: 收到 followGuessStarted 事件，包含:
    //   guessingPlayerId, guessedColors, decisionOrder,
    //   currentDeciderId, decisions
  });

  test('非跟猜階段重連時不應收到 followGuessStarted', async () => {
    // Arrange: followGuessStates 為空
    // Act: 玩家重連
    // Assert: 未收到 followGuessStarted
  });

  test('不在 decisionOrder 中的玩家重連不應收到跟猜事件', async () => {
    // Arrange: followGuessStates 有資料但不包含該玩家
    // Act: 玩家重連
    // Assert: 未收到 followGuessStarted
  });
});
```

#### TC-0202-03：預測階段重連恢復

```javascript
describe('預測階段重連', () => {
  test('預測階段重連時應收到 postQuestionPhase 事件', async () => {
    // Arrange: postQuestionStates 中有該玩家的預測狀態
    // Act: 玩家重連
    // Assert: 收到 postQuestionPhase 事件
  });

  test('非當前預測玩家重連不應收到 postQuestionPhase', async () => {
    // Arrange: postQuestionStates 中是其他玩家
    // Act: 重連
    // Assert: 未收到 postQuestionPhase
  });
});
```

#### TC-0202-04：playerRefreshing + disconnect + reconnect 完整事件鏈

```javascript
describe('完整重整事件鏈', () => {
  test('playerRefreshing → disconnect → reconnect 應成功恢復', async () => {
    // Arrange: 建立 3 人房間 → 開始遊戲
    // Act:
    //   1. 玩家發送 playerRefreshing
    //   2. 玩家斷線
    //   3. 在寬限期內重連
    // Assert:
    //   - refreshingPlayers 在重連後被清除
    //   - player.isDisconnected === false
    //   - player.isRefreshing 已刪除
    //   - disconnectTimeout 已清除
  });

  test('playerRefreshing 超時後應移除玩家', async () => {
    // Arrange: 發送 playerRefreshing → 斷線
    // Act: 等待超過 REFRESH_GRACE_PERIOD
    // Assert: 玩家被從房間移除
  });
});
```

#### TC-0202-05：多人同時重整

```javascript
describe('多人同時重整', () => {
  test('3 位玩家同時斷線應各自獨立處理', async () => {
    // Arrange: 3 人房間，開始遊戲
    // Act: 3 人各自發送 playerRefreshing → 斷線
    // Assert: 3 個獨立的斷線計時器
  });

  test('3 位玩家依序重連應全部成功', async () => {
    // Act: 3 人斷線後，各自建立新連線並重連
    // Assert: 全部收到 reconnected，玩家數仍為 3
  });
});
```

#### TC-0202-06：socketId 更新驗證

```javascript
describe('socketId 更新', () => {
  test('重連後 player.socketId 應更新為新的 socket.id', async () => {
    // Arrange: 記錄舊 socketId
    // Act: 斷線 → 重連
    // Assert: player.socketId === 新 socket.id
  });

  test('重連後 playerSockets Map 應更新', async () => {
    // Assert: playerSockets 包含新的 socket.id 映射
  });
});
```

---

## 六、階段四：場景測試與回歸測試撰寫（工單 0203）

### 6.1 工單 0203：重連場景 E2E 測試與回歸測試

#### 6.1.1 後端 E2E 場景測試

**測試檔案**：`backend/__tests__/reconnection.test.js`（擴充）

```javascript
describe('E2E 重連場景', () => {
  // TC-0203-01：等待階段重整
  test('等待階段重整後應恢復完整房間狀態', async () => {
    // 3 人在等待階段 → 1 人重整 → 重連
    // 驗證：玩家列表完整、房主不變
  });

  // TC-0203-02：遊戲中重整（輪到自己）
  test('遊戲中自己回合重整後應恢復操作權', async () => {
    // 開始遊戲 → 輪到玩家 A → A 重整 → 重連
    // 驗證：gamePhase=playing, currentPlayerIndex 指向 A, 手牌完整
  });

  // TC-0203-03：遊戲中重整（非自己回合）
  test('非自己回合重整後應正確顯示等待狀態', async () => {
    // 開始遊戲 → 輪到 B → A 重整 → 重連
    // 驗證：A 的 gameState 中 currentPlayerIndex 指向 B
  });
});
```

#### 6.1.2 邊界條件測試

```javascript
describe('邊界條件', () => {
  // TC-0203-04：重連超時後再嘗試
  test('超時被移除後重連應收到 player_not_found', async () => {
    // 斷線 → 等待超時 → 嘗試重連
    // 驗證：收到 reconnectFailed { reason: 'player_not_found' }
  });

  // TC-0203-05：房間不存在時重連
  test('房間已刪除時重連應收到 room_not_found', async () => {
    // 建立房間 → 所有人離開 → 嘗試重連
    // 驗證：收到 reconnectFailed { reason: 'room_not_found' }
  });

  // TC-0203-06：快速連續重整
  test('快速重整 3 次後應仍只有 1 個玩家副本', async () => {
    // 已有此測試（PF-01），確認仍通過
  });
});
```

#### 6.1.3 回歸測試

```javascript
describe('回歸測試', () => {
  // TC-0203-07：正常加入和離開
  test('正常加入離開流程不受重連修改影響', async () => {
    // 建立房間 → 加入 → 離開
    // 驗證：流程正常
  });

  // TC-0203-08：正常遊戲流程
  test('正常遊戲流程（開始 → 進行）不受影響', async () => {
    // 建立房間 → 3 人加入 → 開始遊戲
    // 驗證：gamePhase 正確轉換
  });
});
```

#### 6.1.4 前端 localStorage 重連測試

**測試檔案**：`frontend/src/utils/localStorage.test.js`（擴充）

```javascript
describe('重連相關 localStorage 函數', () => {
  // TC-0203-09
  test('saveCurrentRoom 應儲存完整房間資訊並附加 timestamp', () => {
    saveCurrentRoom({ roomId: 'room1', playerId: 'p1', playerName: '玩家A' });
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM));
    expect(saved.roomId).toBe('room1');
    expect(saved.timestamp).toBeDefined();
  });

  // TC-0203-10
  test('getCurrentRoom 過期機制應在 2 小時後返回 null', () => {
    const expired = { roomId: 'room1', timestamp: Date.now() - 3 * 60 * 60 * 1000 };
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(expired));
    expect(getCurrentRoom()).toBeNull();
  });

  // TC-0203-11
  test('clearCurrentRoom 後 getCurrentRoom 應返回 null', () => {
    saveCurrentRoom({ roomId: 'room1', playerId: 'p1', playerName: '玩家A' });
    clearCurrentRoom();
    expect(getCurrentRoom()).toBeNull();
  });

  // TC-0203-12
  test('getCurrentRoom 應容忍損壞的 JSON', () => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, 'not valid json');
    expect(getCurrentRoom()).toBeNull();
  });
});
```

---

## 七、階段五：綜合報告（工單 0204）

### 7.1 產出內容

1. **覆蓋率報告**
   - 執行 `npm test -- --coverage` 的完整報告
   - 對比修改前後的覆蓋率變化
   - 各模組是否達到目標覆蓋率

2. **測試結果總覽**
   - 測試套件/案例通過率
   - 新增測試案例數量
   - 修復的既有失敗測試數量

3. **修復驗證結論**
   - BUG-001 ~ BUG-005 的自動化測試驗證結果
   - 每個 BUG 對應的測試案例編號

4. **殘留問題與風險評估**
   - 未覆蓋的程式碼區塊
   - 殘留風險（BUG-006, BUG-007）
   - 新發現的問題

5. **建議後續行動**
   - 後續可提升覆蓋率的方向
   - 需要修復的問題

---

## 八、測試判定標準

### 8.1 覆蓋率達標標準

| 模組 | 目標 Statements | 目標 Lines | 當前值 |
|------|----------------|-----------|--------|
| 前端整體 | ≥ 80% | ≥ 80% | 82.83% / 83.42% |
| 前端 GameRoom | ≥ 70% | ≥ 70% | 57.34% / 57.8% |
| 前端 services | ≥ 80% | ≥ 80% | 66.3% / 66.79% |
| 後端整體 | ≥ 40% | ≥ 40% | 21.63% / 20.7% |
| 後端 server.js 重連函數 | ≥ 80% | ≥ 80% | 0% |

### 8.2 測試品質標準

| 標準 | 要求 |
|------|------|
| 測試通過率 | 100%（零失敗） |
| 測試獨立性 | 每個測試案例可獨立執行 |
| 測試穩定性 | 無 flaky tests（不穩定測試） |
| 清理 | 每個測試後正確清理（clearAllMocks, cleanup） |
| 命名 | 測試名稱清楚描述預期行為 |

### 8.3 嚴重度判定

| 嚴重度 | 定義 | 處理方式 |
|--------|------|---------|
| Critical | 功能完全無法運作 | 必須立即修復 |
| High | 功能部分失效或不穩定 | 優先修復 |
| Medium | 有潛在風險但目前可運作 | 排入修復計畫 |
| Low | 程式碼品質改善建議 | 可選修復 |

---

## 九、文件產出

| 文件類型 | 路徑 | 說明 |
|---------|------|------|
| 測試計畫書 | `docs/TEST_PLAN_RECONNECTION_V2.md` | 本文件 |
| 工單 | `work_orders/WORK_ORDER_0199.md` ~ `0204.md` | 6 張工單 |
| 個別報告 | `reports/REPORT_0199.md` ~ `0204.md` | 6 份報告 |
| 測試程式碼 | 前端 `*.test.js` / 後端 `__tests__/*.test.js` | 新增/修改的測試檔案 |

---

## 十、實施計畫

### 10.1 階段一：修復既有失敗測試（工單 0199）

**工作內容**：
1. 更新 `GameRoom.test.js` 中 socketService 的 mock，補充 `onReconnected`、`onConnectionChange`、`attemptReconnect` 的 mock 定義
2. 確認 `clearPersistedState` 的 mock/import 正確
3. 執行全部前端測試，確認 0 失敗
4. 執行覆蓋率報告，記錄基線值

### 10.2 階段二：前端單元測試撰寫（工單 0200-0201）

**工作內容**：
1. 在 `GameRoom.test.js` 新增重連相關測試（~15 個測試案例）
2. 在 `socketService.test.js` 新增重連函數測試（~12 個測試案例）
3. 執行覆蓋率報告，確認 GameRoom ≥ 70%、services ≥ 80%

### 10.3 階段三：後端整合測試撰寫（工單 0202）

**工作內容**：
1. 在 `reconnection.test.js` 的測試伺服器中新增 `followGuessStates`、`postQuestionStates` 支援
2. 新增跟猜/預測階段重連測試、多人重整測試、socketId 更新測試（~12 個測試案例）
3. 執行覆蓋率報告

### 10.4 階段四：場景測試與回歸測試（工單 0203）

**工作內容**：
1. 後端 E2E 場景測試（等待/遊戲中/邊界條件）（~8 個測試案例）
2. 前端 localStorage 重連函數測試（~4 個測試案例）
3. 回歸測試（~4 個測試案例）
4. 執行完整覆蓋率報告

### 10.5 階段五：綜合報告（工單 0204）

**工作內容**：
1. 彙整所有測試結果
2. 產出覆蓋率對比報告
3. 撰寫風險評估與後續建議

---

**建立日期**：2026-01-28
**版本**：2.0
**前置測試計畫**：`docs/TEST_PLAN_RECONNECTION.md`（V1，工單 0188-0194）
**專案版本**：1.0.191
