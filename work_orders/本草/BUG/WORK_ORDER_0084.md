# 工作單 0084

**日期：** 2026-01-25

**工作單標題：** BUG - 問牌後未顯示預測選項（後端問題診斷與修復）

**工單主旨：** BUG 修復 - 診斷並修復問牌完成後預測選項未顯示的根本原因

**分類：** BUG

**嚴重程度：** 高

**相關工單：** 0071, 0076, 0080

---

## 一、問題描述

### 1.1 問題現象

玩家完成問牌動作後，應該顯示預測選項介面讓玩家決定是否預測蓋牌顏色，但目前：

- 預測選項介面沒有顯示
- 遊戲直接跳到下一位玩家
- 完全跳過了預測階段

### 1.2 預期行為

```
問牌完成
    │
    ▼
顯示預測選項介面 ← 應該出現但沒有
    │
    ├─ 玩家選擇預測顏色
    │      │
    │      ▼
    │   提交預測，廣播給所有人
    │
    └─ 玩家選擇跳過
           │
           ▼
       廣播跳過訊息
    │
    ▼
切換到下一位玩家
```

### 1.3 實際行為

```
問牌完成
    │
    ▼
直接切換到下一位玩家 ← BUG：跳過預測階段
```

---

## 二、問題診斷流程

### 2.1 診斷步驟一：確認後端是否發送事件

**檢查位置：** `backend/server.js`

**搜尋關鍵字：**
```
enterPredictionPhase
postQuestion
GAME_PHASE_POST_QUESTION
```

**確認項目：**

| 檢查項目 | 預期 | 實際 | 狀態 |
|---------|------|------|------|
| 問牌完成後是否呼叫 `enterPredictionPhase` | 是 | ? | 待確認 |
| 是否有設定 `room.phase = 'postQuestion'` | 是 | ? | 待確認 |
| 是否有發送 `socket.emit('enterPredictionPhase')` | 是 | ? | 待確認 |

**診斷指令（在後端加入 console.log）：**

```javascript
// 在問牌事件處理的最後加入
console.log('[DEBUG] 問牌完成');
console.log('[DEBUG] 當前階段:', room.phase);
console.log('[DEBUG] 當前玩家:', currentPlayerId);
console.log('[DEBUG] 是否呼叫 enterPredictionPhase:', typeof enterPredictionPhase);
```

### 2.2 診斷步驟二：確認前端是否監聽事件

**檢查位置：** `frontend/src/components/GameRoom/GameRoom.js`

**搜尋關鍵字：**
```
enterPredictionPhase
showPredictionPrompt
socket.on
```

**確認項目：**

| 檢查項目 | 預期 | 實際 | 狀態 |
|---------|------|------|------|
| 是否有 `socket.on('enterPredictionPhase')` | 是 | ? | 待確認 |
| 收到事件後是否設定 `setShowPredictionPrompt(true)` | 是 | ? | 待確認 |
| PredictionPrompt 組件是否有渲染 | 是 | ? | 待確認 |

**診斷指令（在前端加入 console.log）：**

```javascript
// 在 useEffect 中的 socket 監聽加入
socket.on('enterPredictionPhase', (data) => {
  console.log('[DEBUG] 收到 enterPredictionPhase 事件:', data);
  console.log('[DEBUG] 設定 showPredictionPrompt = true');
  setShowPredictionPrompt(true);
});
```

### 2.3 診斷步驟三：確認組件是否存在

**檢查項目：**

| 檢查項目 | 預期路徑 | 是否存在 |
|---------|---------|---------|
| PredictionPrompt 組件 | `frontend/src/components/Prediction/PredictionPrompt.js` | ? |
| PredictionPrompt 樣式 | `frontend/src/components/Prediction/PredictionPrompt.css` | ? |
| 組件 index 匯出 | `frontend/src/components/Prediction/index.js` | ? |

**確認指令：**

```bash
# Windows
dir frontend\src\components\Prediction

# 或使用 ls 檢查
ls frontend/src/components/Prediction/
```

---

## 三、可能的根本原因

### 3.1 原因一：後端未實作預測階段

**可能性：** 高

**症狀：**
- 後端 `server.js` 中沒有 `enterPredictionPhase` 函數
- 問牌完成後直接呼叫 `nextPlayer()` 或類似函數
- 沒有 `postQuestion` 階段的處理

**確認方法：**

```bash
# 搜尋後端是否有 enterPredictionPhase
grep -r "enterPredictionPhase" backend/

# 搜尋問牌處理邏輯
grep -r "question" backend/server.js | grep socket
```

**修復方案：** 參考工單 0080 實作後端邏輯

### 3.2 原因二：前端未實作組件

**可能性：** 高

**症狀：**
- `frontend/src/components/Prediction/` 目錄不存在
- GameRoom 沒有引入 PredictionPrompt 組件
- 沒有 `showPredictionPrompt` 狀態

**確認方法：**

```bash
# 檢查目錄是否存在
ls frontend/src/components/ | grep -i prediction

# 檢查 GameRoom 是否有引入
grep -r "PredictionPrompt" frontend/src/components/GameRoom/
```

**修復方案：** 參考工單 0081 實作前端組件

### 3.3 原因三：事件名稱不一致

**可能性：** 中

**症狀：**
- 後端發送的事件名稱與前端監聽的不同
- 例如：後端發 `enter_prediction_phase`，前端監聽 `enterPredictionPhase`

**確認方法：**

```bash
# 比對後端發送的事件名稱
grep -r "emit.*[Pp]rediction" backend/server.js

# 比對前端監聯的事件名稱
grep -r "on.*[Pp]rediction" frontend/src/
```

**修復方案：** 統一事件名稱為 `enterPredictionPhase`

### 3.4 原因四：Socket 連線問題

**可能性：** 低

**症狀：**
- 只有特定玩家收不到事件
- 其他事件正常，只有預測事件有問題

**確認方法：**

在後端加入日誌：
```javascript
socket.emit('enterPredictionPhase', data);
console.log('[DEBUG] 已發送 enterPredictionPhase 給 socket:', socket.id);
```

---

## 四、修復步驟

### 4.1 後端修復

#### 4.1.1 確認常數定義

**檔案：** `shared/constants.js`

確認有以下常數：

```javascript
// 遊戲階段
const GAME_PHASE_POST_QUESTION = 'postQuestion';

module.exports = {
  // ... 其他
  GAME_PHASE_POST_QUESTION,
};
```

#### 4.1.2 新增 enterPredictionPhase 函數

**檔案：** `backend/server.js`

```javascript
/**
 * 進入預測階段
 * 問牌完成後呼叫此函數，讓當前玩家選擇是否預測
 *
 * @param {Object} room - 房間物件
 * @param {string} roomId - 房間 ID
 * @param {string} playerId - 當前玩家 ID（問牌的人）
 */
function enterPredictionPhase(room, roomId, playerId) {
  // 1. 設定遊戲階段為預測階段
  room.phase = GAME_PHASE_POST_QUESTION;
  room.currentPrediction = {
    waitingForPlayer: playerId,
    startTime: Date.now(),
  };

  console.log(`[預測階段] 房間 ${roomId} 進入預測階段，等待玩家 ${playerId}`);

  // 2. 發送事件給當前玩家
  const playerSocket = findSocketByPlayerId(playerId);
  if (playerSocket) {
    playerSocket.emit('enterPredictionPhase', {
      colors: ['red', 'yellow', 'green', 'blue'],
      message: '問牌完成！你可以預測蓋牌中有哪個顏色。',
    });
    console.log(`[預測階段] 已發送 enterPredictionPhase 給玩家 ${playerId}`);
  } else {
    console.error(`[預測階段] 找不到玩家 ${playerId} 的 socket`);
  }

  // 3. 廣播遊戲狀態更新給所有人
  io.to(roomId).emit('gameStateUpdate', {
    phase: room.phase,
    currentPlayerIndex: room.currentPlayerIndex,
    gameHistory: room.gameHistory,
  });
}
```

#### 4.1.3 修改問牌處理邏輯

**搜尋關鍵字：** `socket.on('question'` 或 `socket.on('askQuestion'`

**修改前：**
```javascript
socket.on('question', (data) => {
  // ... 問牌邏輯 ...
  // ... 牌轉移 ...

  // 錯誤：直接切換到下一位玩家
  room.currentPlayerIndex = getNextPlayerIndex(room);
  io.to(roomId).emit('gameStateUpdate', {...});
});
```

**修改後：**
```javascript
socket.on('question', (data) => {
  // ... 問牌邏輯 ...
  // ... 牌轉移 ...

  // 正確：進入預測階段
  enterPredictionPhase(room, roomId, currentPlayerId);
});
```

### 4.2 前端修復

#### 4.2.1 建立組件目錄結構

```bash
mkdir -p frontend/src/components/Prediction
```

#### 4.2.2 建立 PredictionPrompt 組件

參考工單 0081 的完整程式碼。

#### 4.2.3 修改 GameRoom 組件

**檔案：** `frontend/src/components/GameRoom/GameRoom.js`

**新增 import：**
```javascript
import PredictionPrompt from '../Prediction/PredictionPrompt';
```

**新增狀態：**
```javascript
const [showPredictionPrompt, setShowPredictionPrompt] = useState(false);
const [predictionLoading, setPredictionLoading] = useState(false);
```

**新增 Socket 監聽（在 useEffect 中）：**
```javascript
// 監聽進入預測階段
socket.on('enterPredictionPhase', (data) => {
  console.log('[前端] 收到 enterPredictionPhase:', data);
  setShowPredictionPrompt(true);
});

// 清理
return () => {
  socket.off('enterPredictionPhase');
  // ... 其他清理
};
```

**新增處理函數：**
```javascript
const handleSubmitPrediction = (color) => {
  console.log('[前端] 提交預測:', color);
  setPredictionLoading(true);
  socket.emit('submitPrediction', { color });

  setTimeout(() => {
    setShowPredictionPrompt(false);
    setPredictionLoading(false);
  }, 500);
};

const handleSkipPrediction = () => {
  console.log('[前端] 跳過預測');
  setPredictionLoading(true);
  socket.emit('skipPrediction');

  setTimeout(() => {
    setShowPredictionPrompt(false);
    setPredictionLoading(false);
  }, 500);
};
```

**渲染組件：**
```jsx
return (
  <div className="game-room">
    {/* ... 現有內容 ... */}

    {/* 預測選項介面 */}
    <PredictionPrompt
      isOpen={showPredictionPrompt}
      onSubmit={handleSubmitPrediction}
      onSkip={handleSkipPrediction}
      isLoading={predictionLoading}
    />
  </div>
);
```

---

## 五、驗證方法

### 5.1 單元驗證

#### 後端驗證

```javascript
// 測試檔案：backend/tests/prediction.test.js

describe('預測階段進入', () => {
  test('問牌完成後應進入預測階段', async () => {
    // 1. 模擬問牌事件
    socket.emit('question', { ... });

    // 2. 驗證房間狀態
    expect(room.phase).toBe('postQuestion');
    expect(room.currentPrediction.waitingForPlayer).toBe(playerId);
  });

  test('應該發送 enterPredictionPhase 事件', async () => {
    const spy = jest.spyOn(socket, 'emit');
    socket.emit('question', { ... });

    expect(spy).toHaveBeenCalledWith('enterPredictionPhase', expect.any(Object));
  });
});
```

#### 前端驗證

```javascript
// 測試檔案：frontend/src/components/GameRoom/GameRoom.test.js

describe('預測介面顯示', () => {
  test('收到 enterPredictionPhase 後顯示預測介面', async () => {
    render(<GameRoom />);

    // 模擬收到事件
    act(() => {
      mockSocket.emit('enterPredictionPhase', { colors: ['red', 'yellow', 'green', 'blue'] });
    });

    await waitFor(() => {
      expect(screen.getByText('預測蓋牌顏色')).toBeInTheDocument();
    });
  });
});
```

### 5.2 整合驗證

#### 手動測試流程

```
┌─────────────────────────────────────────────────────────────┐
│ 測試流程：預測介面顯示                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. 開啟兩個瀏覽器視窗                                        │
│    - 視窗 A：玩家 A                                          │
│    - 視窗 B：玩家 B                                          │
│                                                             │
│ 2. 玩家 A 建立房間，玩家 B 加入                               │
│                                                             │
│ 3. 開始遊戲（需要 3-4 人，可用匿名玩家補齊）                   │
│                                                             │
│ 4. 輪到玩家 A 時，選擇問牌：                                  │
│    - 選擇兩個顏色                                            │
│    - 選擇目標玩家                                            │
│    - 選擇問牌方式                                            │
│    - 點擊確認                                                │
│                                                             │
│ 5. 檢查視窗 A：                                              │
│    ✓ 應該顯示預測選項介面                                    │
│    ✓ 顯示「預測蓋牌顏色」標題                                │
│    ✓ 顯示四個顏色按鈕                                        │
│    ✓ 顯示「跳過預測」按鈕                                    │
│                                                             │
│ 6. 玩家 A 選擇一個顏色並點擊「確認預測」                      │
│                                                             │
│ 7. 檢查視窗 A 和 B：                                         │
│    ✓ 預測介面關閉                                            │
│    ✓ 遊戲紀錄顯示預測訊息                                    │
│    ✓ 切換到下一位玩家                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Console 日誌驗證

**預期日誌輸出：**

後端：
```
[預測階段] 房間 room_123 進入預測階段，等待玩家 player_456
[預測階段] 已發送 enterPredictionPhase 給玩家 player_456
```

前端：
```
[前端] 收到 enterPredictionPhase: { colors: ['red', 'yellow', 'green', 'blue'], message: '...' }
```

---

## 六、驗收標準

### 功能驗證
- [ ] 問牌完成後顯示預測選項介面
- [ ] 預測介面顯示四個顏色選項
- [ ] 預測介面顯示「跳過預測」按鈕
- [ ] 選擇顏色後可點擊「確認預測」
- [ ] 點擊後介面關閉

### 日誌驗證
- [ ] 後端日誌顯示進入預測階段
- [ ] 後端日誌顯示已發送事件
- [ ] 前端日誌顯示收到事件

### 狀態驗證
- [ ] 房間 phase 設為 'postQuestion'
- [ ] currentPrediction.waitingForPlayer 正確設定
- [ ] 前端 showPredictionPrompt 為 true

### 錯誤處理
- [ ] 找不到 socket 時有錯誤日誌
- [ ] 事件發送失敗時有錯誤日誌

