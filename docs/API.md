# API 文檔

## 遊戲服務 API

本文檔描述 `gameService.js` 提供的 API 接口。

### 遊戲建立

#### createGame(players)

建立新遊戲並開始。

**參數：**
- `players` (Array): 玩家陣列，每個玩家包含 `id` 和 `name`

**返回值：** GameState 物件

**範例：**
```javascript
const gameState = createGame([
  { id: 'p1', name: '玩家1' },
  { id: 'p2', name: '玩家2' },
  { id: 'p3', name: '玩家3' }
]);
```

#### createGameRoom(hostPlayer, maxPlayers)

建立遊戲房間（等待狀態）。

**參數：**
- `hostPlayer` (Object): 房主玩家，包含 `id` 和 `name`
- `maxPlayers` (number): 最大玩家數，預設 4

**返回值：** RoomState 物件

**範例：**
```javascript
const roomState = createGameRoom(
  { id: 'host', name: '房主' },
  3
);
```

#### startGame(gameId)

開始遊戲（從等待狀態轉為進行中）。

**參數：**
- `gameId` (string): 遊戲 ID

**返回值：** 操作結果物件
```javascript
{
  success: boolean,
  gameState: GameState | null,
  message: string
}
```

---

### 狀態管理

#### getGameState(gameId)

取得遊戲狀態。

**參數：**
- `gameId` (string): 遊戲 ID

**返回值：** GameState | null

#### updateGameState(gameId, updates)

更新遊戲狀態。

**參數：**
- `gameId` (string): 遊戲 ID
- `updates` (Object): 要更新的屬性

**返回值：** 更新後的 GameState | null

#### deleteGame(gameId)

刪除遊戲。

**參數：**
- `gameId` (string): 遊戲 ID

**返回值：** boolean

#### clearAllGames()

清除所有遊戲（用於測試）。

---

### 動作處理

#### processAction(gameId, action)

處理遊戲動作。

**參數：**
- `gameId` (string): 遊戲 ID
- `action` (Object): 動作物件

**返回值：** 操作結果物件

#### processQuestionAction(gameId, action)

處理問牌動作。

**參數：**
- `gameId` (string): 遊戲 ID
- `action` (Object): 問牌動作
  - `playerId` (string): 發起玩家 ID
  - `targetPlayerId` (string): 目標玩家 ID
  - `colors` (string[]): 選定的兩個顏色
  - `questionType` (number): 問牌類型（1, 2, 3）
  - `selectedColor` (string, 可選): 類型2時選擇的顏色
  - `giveColor` (string, 可選): 類型3時要給的顏色
  - `getColor` (string, 可選): 類型3時要拿的顏色

**返回值：** 操作結果物件
```javascript
{
  success: boolean,
  gameState: GameState,
  message: string,
  result: {
    cardsReceived: Card[],
    // ...
  }
}
```

**範例：**
```javascript
// 類型1：兩個顏色各一張
const result = processQuestionAction(gameId, {
  playerId: 'p1',
  targetPlayerId: 'p2',
  colors: ['red', 'blue'],
  questionType: 1
});

// 類型2：其中一種顏色全部
const result = processQuestionAction(gameId, {
  playerId: 'p1',
  targetPlayerId: 'p2',
  colors: ['red', 'blue'],
  questionType: 2,
  selectedColor: 'red'
});

// 類型3：給一張要全部
const result = processQuestionAction(gameId, {
  playerId: 'p1',
  targetPlayerId: 'p2',
  colors: ['red', 'blue'],
  questionType: 3,
  giveColor: 'red',
  getColor: 'blue'
});
```

#### processGuessAction(gameId, action)

處理猜牌動作。

**參數：**
- `gameId` (string): 遊戲 ID
- `action` (Object): 猜牌動作
  - `playerId` (string): 發起玩家 ID
  - `guessedColors` (string[]): 猜測的兩個顏色

**返回值：** 操作結果物件
```javascript
{
  success: boolean,
  gameState: GameState,
  message: string,
  isCorrect: boolean,
  revealedCards: Card[] // 猜對時提供
}
```

**範例：**
```javascript
const result = processGuessAction(gameId, {
  playerId: 'p1',
  guessedColors: ['red', 'blue']
});
```

#### revealHiddenCards(gameId, playerId)

取得蓋牌顏色（猜牌者查看答案用）。

**參數：**
- `gameId` (string): 遊戲 ID
- `playerId` (string): 玩家 ID

**返回值：**
```javascript
{
  success: boolean,
  cards: Card[] | null,
  message: string
}
```

---

## 資料結構

### GameState

```typescript
interface GameState {
  gameId: string;
  players: Player[];
  hiddenCards: Card[];
  currentPlayerIndex: number;
  gamePhase: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  gameHistory: HistoryEntry[];
}
```

### Player

```typescript
interface Player {
  id: string;
  name: string;
  hand: Card[];
  isActive: boolean;
  isCurrentTurn: boolean;
}
```

### Card

```typescript
interface Card {
  id: string;         // 格式：'顏色-編號'，如 'red-1'
  color: string;      // 'red' | 'yellow' | 'green' | 'blue'
  isHidden: boolean;
}
```

### HistoryEntry

```typescript
interface HistoryEntry {
  type: 'question' | 'guess';
  playerId: string;
  timestamp: number;
  // 問牌時額外欄位
  targetPlayerId?: string;
  colors?: string[];
  questionType?: number;
  result?: {
    cardsReceived: Card[];
  };
  // 猜牌時額外欄位
  guessedColors?: string[];
  isCorrect?: boolean;
}
```

---

## 常數

### 遊戲階段

```javascript
GAME_PHASE_WAITING = 'waiting'   // 等待玩家加入
GAME_PHASE_PLAYING = 'playing'   // 遊戲進行中
GAME_PHASE_FINISHED = 'finished' // 遊戲結束
```

### 動作類型

```javascript
ACTION_TYPE_QUESTION = 'question' // 問牌
ACTION_TYPE_GUESS = 'guess'       // 猜牌
```

### 問牌類型

```javascript
QUESTION_TYPE_ONE_EACH = 1        // 兩個顏色各一張
QUESTION_TYPE_ALL_ONE_COLOR = 2   // 其中一種顏色全部
QUESTION_TYPE_GIVE_ONE_GET_ALL = 3 // 給一張要全部
```

### 顏色

```javascript
COLORS = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
  BLUE: 'blue'
}
```

---

## 錯誤處理

所有 API 都會返回包含 `success` 和 `message` 的結果物件：

```javascript
// 成功
{
  success: true,
  gameState: {...},
  message: '操作成功'
}

// 失敗
{
  success: false,
  gameState: null,
  message: '錯誤描述'
}
```

### 常見錯誤

| 錯誤訊息 | 說明 |
|---------|------|
| 遊戲不存在 | 指定的 gameId 無效 |
| 玩家數量必須在 3-4 人之間 | 玩家數量不符合要求 |
| 遊戲已經開始或已結束 | 遊戲不處於等待狀態 |
| 不是你的回合 | 非當前玩家嘗試操作 |
| 無效的動作物件 | 動作物件格式錯誤 |
| 請選擇兩個不同顏色 | 顏色選擇錯誤 |
| 請選擇目標玩家 | 未選擇目標玩家 |
