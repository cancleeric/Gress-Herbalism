# 完成報告 0046

**日期：** 2026-01-24

**工作單標題：** 計分系統基礎建設

**工單主旨：** 規則擴充 - 建立計分制的數據結構和基礎邏輯

## 完成內容

### 1. 常數定義更新（shared/constants.js）

新增計分相關常數：
```javascript
export const WINNING_SCORE = 7;           // 勝利分數
export const GUESS_CORRECT_POINTS = 3;    // 猜對得分
export const FOLLOW_CORRECT_POINTS = 1;   // 跟猜正確得分
export const FOLLOW_WRONG_POINTS = -1;    // 跟猜錯誤扣分
export const MIN_SCORE = 0;               // 最低分數
```

新增遊戲階段：
```javascript
export const GAME_PHASE_FOLLOW_GUESSING = 'followGuessing';  // 跟猜中
export const GAME_PHASE_ROUND_END = 'roundEnd';              // 局結束
```

### 2. 計分工具函數（shared/utils/scoreUtils.js）

新建立的函數：
- `addScore(currentScore, points)` - 加分（考慮最低分數限制）
- `checkWinCondition(scores, winningScore)` - 檢查是否有人達到勝利條件
- `getLeaderboard(scores)` - 取得排名（依分數由高到低）
- `calculateGuessScoreChanges(isCorrect, followingPlayers, guessingPlayerId)` - 計算猜牌結果的分數變化
- `applyScoreChanges(scores, changes)` - 應用分數變化到分數表
- `initializeScores(players)` - 初始化玩家分數

### 3. 後端服務更新（backend/server.js）

#### 玩家數據結構
```javascript
player: {
  id: string,
  name: string,
  hand: Card[],
  isActive: boolean,
  score: number,  // 新增
  // ...
}
```

#### 遊戲狀態擴展
```javascript
roomState: {
  // 現有欄位...
  currentRound: number,     // 新增：當前局數
  scores: {},               // 新增：所有玩家分數
  winningScore: 7,          // 新增：勝利所需分數
  roundHistory: []          // 新增：局歷史記錄
}
```

#### 開始遊戲時初始化分數
遊戲開始時自動初始化：
- 所有玩家分數設為 0（或保留之前的分數）
- currentRound 設為 1
- scores 物件建立

## 驗收結果

- [x] 玩家數據結構包含 `score` 欄位
- [x] 遊戲狀態包含 `currentRound` 和 `scores` 欄位
- [x] 常數檔案包含所有計分相關常數
- [x] 計分工具函數正確實作
- [x] 遊戲開始時所有玩家分數初始化為 0

## 修改的檔案

1. `shared/constants.js` - 新增計分相關常數和遊戲階段
2. `shared/utils/scoreUtils.js` - 新建計分工具函數
3. `backend/server.js` - 更新玩家和遊戲狀態結構

## 備註

此工單建立了計分系統的基礎架構，為後續的跟猜機制（0047）和多局遊戲邏輯（0048）提供支援。
