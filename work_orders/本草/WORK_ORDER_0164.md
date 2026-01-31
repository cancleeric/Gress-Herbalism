# 工作單 0164

**建立日期**: 2026-01-27

**優先級**: P1 (重要)

**標題**: server.js 架構重構 (階段一)

---

## 一、工作目標

將 `backend/server.js` 中的遊戲邏輯提取到獨立的可測試模組，提高程式碼可維護性和測試覆蓋率。

---

## 二、問題描述

### 現象
- `server.js` 有 1837 行程式碼
- 後端整體測試覆蓋率僅 15.53%
- `server.js` 覆蓋率為 0%

### 根本原因
所有遊戲邏輯（房間管理、遊戲流程、問牌、猜牌、跟猜）都集中在一個檔案中，無法進行單元測試。

### 影響
- 核心邏輯無測試保護
- 重構風險高
- 新功能開發困難

---

## 三、實施計畫

### 3.1 目標架構

```
backend/
├── server.js              # 簡化：只處理伺服器啟動和 Socket 連線設置
├── handlers/
│   ├── index.js           # 統一導出
│   ├── roomHandler.js     # 房間管理：創建、加入、離開、列表
│   ├── gameHandler.js     # 遊戲流程：開始、結束、下一局、重連
│   ├── questionHandler.js # 問牌處理：三種問牌類型
│   └── guessHandler.js    # 猜牌處理：猜牌、跟猜、結果
├── logic/
│   ├── gameLogic.js       # 純函數：遊戲規則驗證
│   ├── cardLogic.js       # 純函數：牌組初始化、發牌、洗牌
│   └── scoreLogic.js      # 純函數：計分邏輯
└── services/              # 現有服務（已有良好測試）
```

### 3.2 階段一範圍

本工單只處理 `logic/` 資料夾的提取，這些是純函數，最容易測試：

1. `cardLogic.js` - 牌組處理
2. `gameLogic.js` - 遊戲規則
3. `scoreLogic.js` - 計分邏輯

### 3.3 實施內容

#### 3.3.1 建立 cardLogic.js

```javascript
// backend/logic/cardLogic.js

const { COLORS, CARD_COUNTS } = require('../../shared/constants');

/**
 * 初始化牌組
 * @returns {string[]} 完整牌組陣列
 */
function initializeDeck() {
  const deck = [];
  for (const [color, count] of Object.entries(CARD_COUNTS)) {
    for (let i = 0; i < count; i++) {
      deck.push(color);
    }
  }
  return deck;
}

/**
 * 洗牌（Fisher-Yates 演算法）
 * @param {string[]} deck - 牌組
 * @returns {string[]} 洗好的牌組（新陣列）
 */
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 發牌給玩家
 * @param {string[]} deck - 牌組
 * @param {number} playerCount - 玩家數量
 * @param {number} hiddenCount - 蓋牌數量
 * @returns {{ playerHands: string[][], hiddenCards: string[], remainingDeck: string[] }}
 */
function dealCards(deck, playerCount, hiddenCount = 2) {
  const shuffled = shuffleDeck(deck);

  // 先抽蓋牌
  const hiddenCards = shuffled.splice(0, hiddenCount);

  // 計算每人牌數
  const cardsPerPlayer = Math.floor(shuffled.length / playerCount);

  // 發牌
  const playerHands = [];
  for (let i = 0; i < playerCount; i++) {
    playerHands.push(shuffled.splice(0, cardsPerPlayer));
  }

  return {
    playerHands,
    hiddenCards,
    remainingDeck: shuffled
  };
}

/**
 * 根據問牌類型計算要給的牌
 * @param {string[]} hand - 玩家手牌
 * @param {string[]} colors - 被問的兩個顏色
 * @param {number} questionType - 問牌類型 (1, 2, 3)
 * @param {string} chosenColor - 玩家選擇的顏色（類型3時使用）
 * @returns {{ cardsToGive: string[], newHand: string[] }}
 */
function calculateCardsToGive(hand, colors, questionType, chosenColor = null) {
  const [color1, color2] = colors;
  const color1Cards = hand.filter(c => c === color1);
  const color2Cards = hand.filter(c => c === color2);

  let cardsToGive = [];

  switch (questionType) {
    case 1:
      // 各給一張
      if (color1Cards.length > 0) cardsToGive.push(color1);
      if (color2Cards.length > 0) cardsToGive.push(color2);
      break;

    case 2:
      // 其中一種全部（由問牌者選擇）
      // 這裡只計算可能的結果，實際選擇在 handler 中處理
      cardsToGive = color1Cards.length >= color2Cards.length ? color1Cards : color2Cards;
      break;

    case 3:
      // 給一張要全部
      if (chosenColor === color1) {
        cardsToGive = [...color1Cards];
      } else if (chosenColor === color2) {
        cardsToGive = [...color2Cards];
      }
      break;
  }

  // 計算剩餘手牌
  const newHand = [...hand];
  cardsToGive.forEach(card => {
    const index = newHand.indexOf(card);
    if (index !== -1) newHand.splice(index, 1);
  });

  return { cardsToGive, newHand };
}

module.exports = {
  initializeDeck,
  shuffleDeck,
  dealCards,
  calculateCardsToGive
};
```

#### 3.3.2 建立 gameLogic.js

```javascript
// backend/logic/gameLogic.js

const { GAME_PHASE, MIN_PLAYERS, MAX_PLAYERS, WIN_SCORE } = require('../../shared/constants');

/**
 * 檢查是否可以開始遊戲
 * @param {Object[]} players - 玩家陣列
 * @returns {{ canStart: boolean, reason?: string }}
 */
function canStartGame(players) {
  if (!players || players.length < MIN_PLAYERS) {
    return { canStart: false, reason: `需要至少 ${MIN_PLAYERS} 名玩家` };
  }
  if (players.length > MAX_PLAYERS) {
    return { canStart: false, reason: `最多 ${MAX_PLAYERS} 名玩家` };
  }
  return { canStart: true };
}

/**
 * 檢查猜牌是否正確
 * @param {string[]} guessedColors - 猜測的顏色
 * @param {string[]} hiddenCards - 實際蓋牌
 * @returns {boolean}
 */
function isGuessCorrect(guessedColors, hiddenCards) {
  if (!guessedColors || !hiddenCards) return false;
  if (guessedColors.length !== 2 || hiddenCards.length !== 2) return false;

  const sortedGuess = [...guessedColors].sort();
  const sortedHidden = [...hiddenCards].sort();

  return sortedGuess[0] === sortedHidden[0] && sortedGuess[1] === sortedHidden[1];
}

/**
 * 計算下一個玩家索引
 * @param {number} currentIndex - 當前玩家索引
 * @param {Object[]} players - 玩家陣列
 * @param {boolean} skipInactive - 是否跳過不活躍玩家
 * @returns {number} 下一個玩家索引
 */
function getNextPlayerIndex(currentIndex, players, skipInactive = true) {
  if (!players || players.length === 0) return 0;

  let nextIndex = (currentIndex + 1) % players.length;
  let attempts = 0;

  while (skipInactive && attempts < players.length) {
    if (players[nextIndex].isActive) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % players.length;
    attempts++;
  }

  return nextIndex;
}

/**
 * 檢查是否只剩一個活躍玩家
 * @param {Object[]} players - 玩家陣列
 * @returns {boolean}
 */
function isOnlyOnePlayerLeft(players) {
  if (!players) return false;
  return players.filter(p => p.isActive).length <= 1;
}

/**
 * 檢查是否有玩家達到勝利分數
 * @param {Object[]} players - 玩家陣列
 * @returns {Object|null} 勝利玩家或 null
 */
function checkWinner(players) {
  if (!players) return null;
  return players.find(p => p.score >= WIN_SCORE) || null;
}

/**
 * 驗證問牌動作
 * @param {Object} action - 動作物件
 * @param {Object} gameState - 遊戲狀態
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateQuestionAction(action, gameState) {
  const { targetPlayerId, colors, questionType } = action;

  if (!targetPlayerId) {
    return { valid: false, reason: '必須指定目標玩家' };
  }

  if (!colors || colors.length !== 2) {
    return { valid: false, reason: '必須選擇兩個顏色' };
  }

  if (![1, 2, 3].includes(questionType)) {
    return { valid: false, reason: '無效的問牌類型' };
  }

  const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer || !targetPlayer.isActive) {
    return { valid: false, reason: '目標玩家不存在或已退出' };
  }

  return { valid: true };
}

module.exports = {
  canStartGame,
  isGuessCorrect,
  getNextPlayerIndex,
  isOnlyOnePlayerLeft,
  checkWinner,
  validateQuestionAction
};
```

#### 3.3.3 建立 scoreLogic.js

```javascript
// backend/logic/scoreLogic.js

const {
  GUESS_CORRECT_SCORE,
  FOLLOW_CORRECT_SCORE,
  FOLLOW_WRONG_SCORE,
  PREDICT_CORRECT_SCORE,
  PREDICT_WRONG_SCORE
} = require('../../shared/constants');

/**
 * 計算猜牌得分
 * @param {boolean} isCorrect - 是否猜對
 * @returns {number} 得分變化
 */
function calculateGuessScore(isCorrect) {
  return isCorrect ? GUESS_CORRECT_SCORE : 0;
}

/**
 * 計算跟猜得分
 * @param {boolean} isCorrect - 是否跟對
 * @returns {number} 得分變化
 */
function calculateFollowGuessScore(isCorrect) {
  return isCorrect ? FOLLOW_CORRECT_SCORE : FOLLOW_WRONG_SCORE;
}

/**
 * 計算預測得分
 * @param {boolean} isCorrect - 是否預測正確
 * @returns {number} 得分變化
 */
function calculatePredictScore(isCorrect) {
  return isCorrect ? PREDICT_CORRECT_SCORE : PREDICT_WRONG_SCORE;
}

/**
 * 應用分數變化（確保不低於 0）
 * @param {number} currentScore - 當前分數
 * @param {number} change - 分數變化
 * @returns {number} 新分數
 */
function applyScoreChange(currentScore, change) {
  return Math.max(0, currentScore + change);
}

/**
 * 計算回合結束時所有玩家的分數變化
 * @param {Object} roundResult - 回合結果
 * @returns {Object} { playerId: scoreChange }
 */
function calculateRoundScores(roundResult) {
  const scoreChanges = {};
  const {
    guessingPlayerId,
    isCorrect,
    followingPlayers = [],
    predictionResults = []
  } = roundResult;

  // 猜牌者得分
  if (guessingPlayerId) {
    scoreChanges[guessingPlayerId] = calculateGuessScore(isCorrect);
  }

  // 跟猜者得分
  for (const follower of followingPlayers) {
    const followScore = calculateFollowGuessScore(isCorrect);
    scoreChanges[follower.id] = (scoreChanges[follower.id] || 0) + followScore;
  }

  // 預測者得分
  for (const prediction of predictionResults) {
    const predictScore = calculatePredictScore(prediction.isCorrect);
    scoreChanges[prediction.playerId] = (scoreChanges[prediction.playerId] || 0) + predictScore;
  }

  return scoreChanges;
}

module.exports = {
  calculateGuessScore,
  calculateFollowGuessScore,
  calculatePredictScore,
  applyScoreChange,
  calculateRoundScores
};
```

#### 3.3.4 建立 logic/index.js

```javascript
// backend/logic/index.js

const cardLogic = require('./cardLogic');
const gameLogic = require('./gameLogic');
const scoreLogic = require('./scoreLogic');

module.exports = {
  ...cardLogic,
  ...gameLogic,
  ...scoreLogic
};
```

---

## 四、測試計畫

### 4.1 單元測試

為每個 logic 模組建立測試：

```javascript
// backend/__tests__/logic/cardLogic.test.js

const {
  initializeDeck,
  shuffleDeck,
  dealCards,
  calculateCardsToGive
} = require('../../logic/cardLogic');

describe('cardLogic', () => {
  describe('initializeDeck', () => {
    test('應產生 14 張牌', () => {
      const deck = initializeDeck();
      expect(deck).toHaveLength(14);
    });

    test('應包含正確的牌組配置', () => {
      const deck = initializeDeck();
      expect(deck.filter(c => c === 'red')).toHaveLength(2);
      expect(deck.filter(c => c === 'yellow')).toHaveLength(3);
      expect(deck.filter(c => c === 'green')).toHaveLength(4);
      expect(deck.filter(c => c === 'blue')).toHaveLength(5);
    });
  });

  describe('shuffleDeck', () => {
    test('洗牌後牌數應相同', () => {
      const deck = initializeDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).toHaveLength(deck.length);
    });

    test('洗牌應返回新陣列', () => {
      const deck = initializeDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).not.toBe(deck);
    });
  });

  describe('dealCards', () => {
    test('3 人遊戲應正確發牌', () => {
      const deck = initializeDeck();
      const result = dealCards(deck, 3, 2);

      expect(result.hiddenCards).toHaveLength(2);
      expect(result.playerHands).toHaveLength(3);
      expect(result.playerHands.every(h => h.length === 4)).toBe(true);
    });

    test('4 人遊戲應正確發牌', () => {
      const deck = initializeDeck();
      const result = dealCards(deck, 4, 2);

      expect(result.hiddenCards).toHaveLength(2);
      expect(result.playerHands).toHaveLength(4);
      expect(result.playerHands.every(h => h.length === 3)).toBe(true);
    });
  });

  describe('calculateCardsToGive', () => {
    test('類型1：各給一張', () => {
      const hand = ['red', 'red', 'blue', 'green'];
      const result = calculateCardsToGive(hand, ['red', 'blue'], 1);

      expect(result.cardsToGive).toContain('red');
      expect(result.cardsToGive).toContain('blue');
      expect(result.cardsToGive).toHaveLength(2);
    });

    test('類型1：沒有的顏色不給', () => {
      const hand = ['red', 'red', 'green'];
      const result = calculateCardsToGive(hand, ['red', 'blue'], 1);

      expect(result.cardsToGive).toContain('red');
      expect(result.cardsToGive).not.toContain('blue');
      expect(result.cardsToGive).toHaveLength(1);
    });
  });
});
```

### 4.2 覆蓋率目標
- `cardLogic.js`: > 95%
- `gameLogic.js`: > 95%
- `scoreLogic.js`: > 95%

---

## 五、驗收標準

1. 建立 `backend/logic/` 資料夾結構
2. 三個 logic 檔案及其測試通過
3. 每個 logic 模組覆蓋率 > 95%
4. 現有功能不受影響

---

## 六、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| 提取邏輯時破壞原有功能 | 中 | 高 | 完整測試覆蓋、逐步重構 |
| 模組間依賴複雜 | 低 | 中 | 純函數設計、清晰的介面 |

---

## 七、後續工單

本工單完成後，可建立後續工單：
- 0168: server.js 架構重構 (階段二) - handlers 提取
- 0169: server.js 簡化 - 使用新模組重構 server.js

---

## 八、相關工單

- 依賴: 無
- 被依賴: 無

---

*工單建立時間: 2026-01-27*
