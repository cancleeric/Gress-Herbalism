# 電腦玩家（AI）實現計劃

## 專案背景

**Gress-Herbalism（本草推理遊戲）** 是一款 3-4 人推理桌遊，目前僅支援多人對戰。為了讓單人也能享受遊戲，需要實現電腦玩家功能。

---

## 🎯 實作進度總覽（更新於 2026-01-25）

### 已完成功能

**核心架構** ✅
- `AIPlayer.js` - AI 玩家基礎類別（支援三種難度）
- `InformationTracker.js` - 資訊追蹤器（概率計算、事件處理）
- `DecisionMaker.js` - 決策執行器（協調策略與知識）
- `BaseStrategy.js` - 策略基類（定義介面）

**難度實作** 🎮
- `EasyStrategy.js` - 簡單難度（隨機決策）✅
  - 25 個單元測試通過
  - 加權隨機問牌類型（60%/30%/10%）

- `MediumStrategy.js` - 中等難度（概率推理）✅
  - 18 個單元測試通過
  - 信心度評估（閾值 0.6）
  - 選擇手牌最多的玩家
  - 跟猜概率評估（閾值 0.15）

- `HardStrategy.js` - 困難難度（完整推理）✅
  - 31 個單元測試通過
  - 期望值計算決策
  - 資訊熵評估
  - 資訊增益最大化
  - 期望值閾值（0.5）

**整合測試** 🔧
- `MediumAI.integration.test.js` ✅（11 個）
- `HardAI.integration.test.js` ✅（14 個）

**測試覆蓋率** 📊
- 單元測試：110 個（Easy: 25, Medium: 18, Hard: 31, AIPlayer: 18, AIPlayerSelector: 18, 其他: 18）
- 整合測試：25 個（Medium: 11, Hard: 14）
- 參數調整測試：10 個
- 總測試數：354 個
- 通過率：100%

**UI 組件測試** 🖥️
- AIPlayerSelector：18 個測試（100% 通過）

### 待完成功能

**第四階段：UI 整合** 🚧
- [x] AI 玩家選擇器 ✅（工單 202601250054）
- [ ] 修改 GameRoom 整合 AI（下一個）
- [ ] AI 思考動畫
- [ ] 單人模式 E2E 測試

---

## 一、目標

1. **單人遊戲模式**：玩家可與 1-3 個 AI 對戰
2. **多難度級別**：簡單、中等、困難
3. **自然的遊戲體驗**：AI 決策有適當延遲，避免瞬間反應
4. **完整遊戲支援**：AI 支援所有遊戲動作（問牌、猜牌、跟猜、預測）

---

## 二、AI 決策框架

### 2.1 資訊追蹤系統

AI 需要追蹤以下資訊來做出決策：

```
┌─────────────────────────────────────────────────┐
│              InformationTracker                 │
├─────────────────────────────────────────────────┤
│ knownCards: Map<playerId, Card[]>              │ ← 已知玩家手牌
│ hiddenCardProbability: Map<color, number>      │ ← 蓋牌顏色概率
│ questionHistory: QuestionRecord[]              │ ← 問牌歷史
│ cardTransfers: TransferRecord[]                │ ← 牌轉移記錄
│ eliminatedColors: Set<color>                   │ ← 已確認不在蓋牌的顏色
│ confirmedColors: Set<color>                    │ ← 已確認在蓋牌的顏色
└─────────────────────────────────────────────────┘
```

### 2.2 概率計算引擎

根據牌組總數和已知資訊計算蓋牌概率：

| 顏色 | 總數 | 初始概率計算 |
|------|------|--------------|
| 紅   | 2    | 2/14 = 14.3% |
| 黃   | 3    | 3/14 = 21.4% |
| 綠   | 4    | 4/14 = 28.6% |
| 藍   | 5    | 5/14 = 35.7% |

**概率更新規則**：
- 看到某顏色牌在玩家手中 → 蓋牌為該顏色的概率下降
- 問牌結果為「無牌」→ 更新該顏色分布
- 某顏色已全部出現 → 該顏色不可能在蓋牌中

### 2.3 決策邏輯

```
┌─────────────────────────────────────────────────┐
│                DecisionMaker                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  輪到 AI 時：                                   │
│  ├─ 是否只剩自己？ ──是→ 強制猜牌              │
│  └─ 否                                         │
│      ├─ 評估猜牌信心度                         │
│      │   ├─ 高信心（>80%）→ 執行猜牌           │
│      │   └─ 低信心 → 繼續問牌                  │
│      │                                         │
│      └─ 問牌策略                               │
│          ├─ 選擇目標玩家                       │
│          ├─ 選擇兩個顏色                       │
│          └─ 選擇問牌方式                       │
│                                                 │
│  跟猜階段：                                     │
│  ├─ 評估猜測正確概率                           │
│  └─ 決定是否跟猜                               │
│                                                 │
│  預測階段：                                     │
│  └─ 根據概率選擇預測顏色                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 三、難度級別設計

### 3.1 簡單難度 (Easy)

**特點**：隨機決策，適合新手練習

| 決策項目 | 行為 |
|----------|------|
| 問牌目標 | 隨機選擇 |
| 問牌顏色 | 隨機選擇兩個顏色 |
| 問牌方式 | 隨機選擇（偏好類型 1） |
| 猜牌時機 | 僅在強制時猜牌 |
| 猜牌選擇 | 隨機選擇 |
| 跟猜決策 | 50% 機率跟猜 |

```javascript
// 簡單難度範例
class EasyAI {
  decideAction(gameState) {
    if (mustGuess(gameState)) {
      return this.makeRandomGuess();
    }
    return this.makeRandomQuestion();
  }
}
```

### 3.2 中等難度 (Medium)

**特點**：基礎推理，會追蹤明顯資訊

| 決策項目 | 行為 |
|----------|------|
| 問牌目標 | 選擇手牌最多的玩家 |
| 問牌顏色 | 選擇尚未確認的顏色 |
| 問牌方式 | 根據情況選擇最佳方式 |
| 猜牌時機 | 信心度 > 60% 時猜牌 |
| 猜牌選擇 | 選擇概率最高的兩個顏色 |
| 跟猜決策 | 評估猜測合理性後決定 |

```javascript
// 中等難度範例
class MediumAI {
  decideAction(gameState) {
    const confidence = this.calculateConfidence();

    if (mustGuess(gameState) || confidence > 0.6) {
      return this.makeProbabilityBasedGuess();
    }
    return this.makeStrategicQuestion();
  }
}
```

### 3.3 困難難度 (Hard)

**特點**：完整推理引擎，最佳化策略

| 決策項目 | 行為 |
|----------|------|
| 問牌目標 | 資訊價值最大化 |
| 問牌顏色 | 最大化資訊增益 |
| 問牌方式 | 貝葉斯最佳化 |
| 猜牌時機 | 期望值計算（風險/報酬） |
| 猜牌選擇 | 最高概率組合 |
| 跟猜決策 | 精確概率計算 |

```javascript
// 困難難度範例
class HardAI {
  decideAction(gameState) {
    // 更新所有概率
    this.updateProbabilities(gameState);

    // 計算各動作期望值
    const guessEV = this.calculateGuessExpectedValue();
    const questionEV = this.calculateQuestionExpectedValue();

    if (mustGuess(gameState)) {
      return this.makeOptimalGuess();
    }

    // 選擇期望值最高的動作
    if (guessEV > questionEV && guessEV > 0) {
      return this.makeOptimalGuess();
    }
    return this.makeOptimalQuestion();
  }
}
```

---

## 四、檔案結構設計

```
frontend/src/
├── ai/
│   ├── index.js                    # AI 模組入口
│   ├── AIPlayer.js                 # AI 玩家類別
│   ├── InformationTracker.js       # 資訊追蹤器
│   ├── ProbabilityCalculator.js    # 概率計算引擎
│   ├── DecisionMaker.js            # 決策執行器
│   │
│   ├── strategies/
│   │   ├── BaseStrategy.js         # 策略基類
│   │   ├── EasyStrategy.js         # 簡單難度策略
│   │   ├── MediumStrategy.js       # 中等難度策略
│   │   └── HardStrategy.js         # 困難難度策略
│   │
│   ├── decisions/
│   │   ├── QuestionDecision.js     # 問牌決策邏輯
│   │   ├── GuessDecision.js        # 猜牌決策邏輯
│   │   ├── FollowGuessDecision.js  # 跟猜決策邏輯
│   │   └── PredictionDecision.js   # 預測決策邏輯
│   │
│   └── __tests__/
│       ├── AIPlayer.test.js
│       ├── InformationTracker.test.js
│       ├── ProbabilityCalculator.test.js
│       └── strategies/*.test.js
│
├── components/
│   ├── GameSetup/
│   │   └── AIPlayerSelector.js     # AI 玩家選擇器（新增）
│   │
│   └── GameRoom/
│       └── GameRoom.js             # 修改：整合 AI 控制
│
└── shared/
    └── constants.js                # 新增：AI 相關常數
```

---

## 五、核心類別設計

### 5.1 AIPlayer 類別

```javascript
/**
 * AI 玩家類別
 */
class AIPlayer {
  constructor(id, name, difficulty = 'medium') {
    this.id = id;
    this.name = name;
    this.isAI = true;
    this.difficulty = difficulty;
    this.strategy = this.createStrategy(difficulty);
    this.informationTracker = new InformationTracker();
    this.decisionMaker = new DecisionMaker(this.strategy);
  }

  /**
   * 根據難度建立策略
   */
  createStrategy(difficulty) {
    switch (difficulty) {
      case 'easy':
        return new EasyStrategy();
      case 'medium':
        return new MediumStrategy();
      case 'hard':
        return new HardStrategy();
      default:
        return new MediumStrategy();
    }
  }

  /**
   * 處理遊戲事件，更新資訊
   */
  onGameEvent(event) {
    this.informationTracker.processEvent(event);
  }

  /**
   * 執行回合（非同步，帶延遲）
   */
  async takeTurn(gameState) {
    // 加入思考延遲（1-3秒）
    await this.thinkDelay();

    // 決定動作
    const action = this.decisionMaker.decide(
      gameState,
      this.informationTracker.getKnowledge()
    );

    return action;
  }

  /**
   * 決定是否跟猜
   */
  async decideFollowGuess(gameState, guessedColors) {
    await this.thinkDelay(500, 1500);

    return this.decisionMaker.decideFollowGuess(
      gameState,
      guessedColors,
      this.informationTracker.getKnowledge()
    );
  }

  /**
   * 模擬思考延遲
   */
  async thinkDelay(min = 1000, max = 3000) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 5.2 InformationTracker 類別

```javascript
/**
 * 資訊追蹤器 - 追蹤所有可觀察的遊戲資訊
 */
class InformationTracker {
  constructor() {
    this.reset();
  }

  reset() {
    // 已知牌的位置
    this.knownCards = new Map(); // playerId -> Card[]

    // 蓋牌概率分布
    this.hiddenCardProbability = {
      red: 2/14,
      yellow: 3/14,
      green: 4/14,
      blue: 5/14
    };

    // 各顏色已知數量
    this.visibleColorCounts = {
      red: 0,
      yellow: 0,
      green: 0,
      blue: 0
    };

    // 問牌歷史
    this.questionHistory = [];

    // 已確認不在蓋牌的顏色
    this.eliminatedColors = new Set();
  }

  /**
   * 處理遊戲事件
   */
  processEvent(event) {
    switch (event.type) {
      case 'GAME_STARTED':
        this.processGameStart(event);
        break;
      case 'QUESTION_RESULT':
        this.processQuestionResult(event);
        break;
      case 'CARD_TRANSFER':
        this.processCardTransfer(event);
        break;
      case 'GUESS_RESULT':
        this.processGuessResult(event);
        break;
    }
  }

  /**
   * 處理問牌結果 - 更新概率
   */
  processQuestionResult(event) {
    const { askerId, targetId, colors, result } = event;

    // 記錄問牌歷史
    this.questionHistory.push({
      askerId,
      targetId,
      colors,
      result,
      timestamp: Date.now()
    });

    // 根據結果更新概率
    if (result.cardsReceived) {
      result.cardsReceived.forEach(card => {
        this.updateVisibleCount(card.color);
      });
    }

    // 更新蓋牌概率
    this.recalculateProbabilities();
  }

  /**
   * 重新計算蓋牌概率
   */
  recalculateProbabilities() {
    const TOTAL_CARDS = { red: 2, yellow: 3, green: 4, blue: 5 };

    for (const color of ['red', 'yellow', 'green', 'blue']) {
      const total = TOTAL_CARDS[color];
      const visible = this.visibleColorCounts[color];
      const remaining = total - visible;

      if (remaining <= 0) {
        // 所有該顏色的牌都已出現
        this.hiddenCardProbability[color] = 0;
        this.eliminatedColors.add(color);
      } else {
        // 更新概率（簡化計算）
        const totalRemaining = 14 - Object.values(this.visibleColorCounts)
          .reduce((a, b) => a + b, 0);
        this.hiddenCardProbability[color] = remaining / totalRemaining;
      }
    }
  }

  /**
   * 取得當前知識狀態
   */
  getKnowledge() {
    return {
      knownCards: this.knownCards,
      hiddenCardProbability: { ...this.hiddenCardProbability },
      eliminatedColors: new Set(this.eliminatedColors),
      questionHistory: [...this.questionHistory]
    };
  }
}
```

### 5.3 DecisionMaker 類別

```javascript
/**
 * 決策執行器
 */
class DecisionMaker {
  constructor(strategy) {
    this.strategy = strategy;
  }

  /**
   * 決定動作
   */
  decide(gameState, knowledge) {
    // 檢查是否必須猜牌
    if (mustGuess(gameState)) {
      return this.makeGuessDecision(gameState, knowledge);
    }

    // 由策略決定問牌或猜牌
    return this.strategy.decideAction(gameState, knowledge);
  }

  /**
   * 問牌決策
   */
  makeQuestionDecision(gameState, knowledge) {
    const targetPlayer = this.strategy.selectTargetPlayer(gameState, knowledge);
    const colors = this.strategy.selectColors(gameState, knowledge);
    const questionType = this.strategy.selectQuestionType(gameState, knowledge, colors);

    return {
      type: 'question',
      targetPlayerId: targetPlayer.id,
      colors,
      questionType
    };
  }

  /**
   * 猜牌決策
   */
  makeGuessDecision(gameState, knowledge) {
    const colors = this.strategy.selectGuessColors(knowledge);

    return {
      type: 'guess',
      colors
    };
  }

  /**
   * 跟猜決策
   */
  decideFollowGuess(gameState, guessedColors, knowledge) {
    return this.strategy.decideFollowGuess(guessedColors, knowledge);
  }
}
```

---

## 六、策略類別設計

### 6.1 BaseStrategy（基類）

```javascript
/**
 * 策略基類
 */
class BaseStrategy {
  /**
   * 決定動作類型
   * @returns {{ type: 'question' | 'guess', ... }}
   */
  decideAction(gameState, knowledge) {
    throw new Error('Must implement decideAction');
  }

  /**
   * 選擇目標玩家
   */
  selectTargetPlayer(gameState, knowledge) {
    throw new Error('Must implement selectTargetPlayer');
  }

  /**
   * 選擇問牌顏色
   */
  selectColors(gameState, knowledge) {
    throw new Error('Must implement selectColors');
  }

  /**
   * 選擇問牌方式
   */
  selectQuestionType(gameState, knowledge, colors) {
    throw new Error('Must implement selectQuestionType');
  }

  /**
   * 選擇猜牌顏色
   */
  selectGuessColors(knowledge) {
    throw new Error('Must implement selectGuessColors');
  }

  /**
   * 決定是否跟猜
   */
  decideFollowGuess(guessedColors, knowledge) {
    throw new Error('Must implement decideFollowGuess');
  }
}
```

### 6.2 EasyStrategy（簡單）

```javascript
/**
 * 簡單難度策略 - 隨機決策
 */
class EasyStrategy extends BaseStrategy {
  decideAction(gameState, knowledge) {
    // 簡單難度永遠選擇問牌（除非被迫猜牌）
    return this.makeQuestionAction(gameState, knowledge);
  }

  selectTargetPlayer(gameState, knowledge) {
    const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
    const otherPlayers = gameState.players.filter(
      p => p.id !== currentPlayerId && p.isActive
    );

    // 隨機選擇
    return otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
  }

  selectColors(gameState, knowledge) {
    const colors = ['red', 'yellow', 'green', 'blue'];
    const shuffled = colors.sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  selectQuestionType(gameState, knowledge, colors) {
    // 簡單難度偏好類型 1（最簡單的方式）
    const rand = Math.random();
    if (rand < 0.6) return 1;
    if (rand < 0.9) return 2;
    return 3;
  }

  selectGuessColors(knowledge) {
    const colors = ['red', 'yellow', 'green', 'blue'];
    const shuffled = colors.sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  decideFollowGuess(guessedColors, knowledge) {
    // 50% 機率跟猜
    return Math.random() > 0.5;
  }
}
```

### 6.3 MediumStrategy（中等）

```javascript
/**
 * 中等難度策略 - 基礎推理
 */
class MediumStrategy extends BaseStrategy {
  constructor() {
    super();
    this.guessThreshold = 0.6; // 60% 信心度才猜牌
  }

  decideAction(gameState, knowledge) {
    const confidence = this.calculateConfidence(knowledge);

    if (confidence >= this.guessThreshold) {
      return this.makeGuessAction(knowledge);
    }

    return this.makeQuestionAction(gameState, knowledge);
  }

  calculateConfidence(knowledge) {
    const probs = knowledge.hiddenCardProbability;

    // 找出最高的兩個概率
    const sorted = Object.entries(probs)
      .filter(([color]) => !knowledge.eliminatedColors.has(color))
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length < 2) return 0;

    // 信心度 = 最高兩個概率的乘積
    return sorted[0][1] * sorted[1][1];
  }

  selectTargetPlayer(gameState, knowledge) {
    const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
    const otherPlayers = gameState.players.filter(
      p => p.id !== currentPlayerId && p.isActive
    );

    // 選擇手牌最多的玩家
    return otherPlayers.reduce((max, player) => {
      const handSize = player.hand ? player.hand.length : 0;
      const maxHandSize = max.hand ? max.hand.length : 0;
      return handSize > maxHandSize ? player : max;
    }, otherPlayers[0]);
  }

  selectColors(gameState, knowledge) {
    const probs = knowledge.hiddenCardProbability;

    // 選擇概率最高且未確認的兩個顏色
    const sorted = Object.entries(probs)
      .filter(([color]) => !knowledge.eliminatedColors.has(color))
      .sort((a, b) => b[1] - a[1]);

    return [sorted[0][0], sorted[1][0]];
  }

  selectQuestionType(gameState, knowledge, colors) {
    // 根據目標玩家可能的手牌選擇
    // 預設使用類型 2（其中一種顏色全部）以獲得更多資訊
    return 2;
  }

  selectGuessColors(knowledge) {
    const probs = knowledge.hiddenCardProbability;

    // 選擇概率最高的兩個顏色
    const sorted = Object.entries(probs)
      .filter(([color]) => !knowledge.eliminatedColors.has(color))
      .sort((a, b) => b[1] - a[1]);

    return [sorted[0][0], sorted[1][0]];
  }

  decideFollowGuess(guessedColors, knowledge) {
    // 評估猜測的合理性
    const probs = knowledge.hiddenCardProbability;
    const guessProb = guessedColors.reduce((acc, color) => {
      return acc * (probs[color] || 0);
    }, 1);

    // 如果猜測概率高於平均，跟猜
    return guessProb > 0.15;
  }
}
```

### 6.4 HardStrategy（困難）

```javascript
/**
 * 困難難度策略 - 完整推理引擎
 */
class HardStrategy extends BaseStrategy {
  constructor() {
    super();
    this.guessThreshold = 0.8; // 80% 信心度才猜牌
  }

  decideAction(gameState, knowledge) {
    // 計算猜牌期望值
    const guessEV = this.calculateGuessExpectedValue(gameState, knowledge);

    // 計算問牌資訊價值
    const questionValue = this.calculateQuestionValue(gameState, knowledge);

    // 如果猜牌期望值為正且高於問牌價值，猜牌
    if (guessEV > 0 && guessEV > questionValue) {
      return this.makeGuessAction(knowledge);
    }

    return this.makeQuestionAction(gameState, knowledge);
  }

  calculateGuessExpectedValue(gameState, knowledge) {
    const bestGuess = this.selectGuessColors(knowledge);
    const successProb = this.calculateSuccessProbability(bestGuess, knowledge);

    // EV = (成功概率 × 成功得分) - (失敗概率 × 失敗損失)
    const successScore = 3; // 猜對得3分
    const failureCost = 0;  // 猜錯退出當局，但不扣分

    return (successProb * successScore) - ((1 - successProb) * failureCost);
  }

  calculateSuccessProbability(guessedColors, knowledge) {
    const probs = knowledge.hiddenCardProbability;

    // 計算猜測正確的概率（兩張蓋牌都猜對）
    // 簡化：假設獨立事件
    const [color1, color2] = guessedColors;

    if (color1 === color2) {
      // 猜相同顏色
      return probs[color1] * probs[color1];
    }

    // 猜不同顏色（考慮順序）
    return 2 * probs[color1] * probs[color2];
  }

  calculateQuestionValue(gameState, knowledge) {
    // 計算問牌能獲得的資訊價值
    // 使用信息熵概念
    const currentEntropy = this.calculateEntropy(knowledge.hiddenCardProbability);

    // 預期問牌後的熵減少量
    return currentEntropy * 0.2; // 假設每次問牌減少20%不確定性
  }

  calculateEntropy(probabilities) {
    let entropy = 0;
    for (const prob of Object.values(probabilities)) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    return entropy;
  }

  selectTargetPlayer(gameState, knowledge) {
    const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
    const otherPlayers = gameState.players.filter(
      p => p.id !== currentPlayerId && p.isActive
    );

    // 選擇資訊價值最高的玩家
    // 考慮：手牌數量、已知資訊、問牌歷史
    return otherPlayers.reduce((best, player) => {
      const value = this.calculateTargetValue(player, knowledge);
      const bestValue = this.calculateTargetValue(best, knowledge);
      return value > bestValue ? player : best;
    }, otherPlayers[0]);
  }

  calculateTargetValue(player, knowledge) {
    const handSize = player.hand ? player.hand.length : 3;
    const unknownCards = handSize - (knowledge.knownCards.get(player.id)?.length || 0);
    return unknownCards;
  }

  selectColors(gameState, knowledge) {
    // 選擇能最大化資訊增益的顏色組合
    const colors = ['red', 'yellow', 'green', 'blue']
      .filter(c => !knowledge.eliminatedColors.has(c));

    let bestPair = [colors[0], colors[1]];
    let bestValue = 0;

    // 評估所有顏色組合
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const value = this.evaluateColorPair([colors[i], colors[j]], knowledge);
        if (value > bestValue) {
          bestValue = value;
          bestPair = [colors[i], colors[j]];
        }
      }
    }

    return bestPair;
  }

  evaluateColorPair(colors, knowledge) {
    const probs = knowledge.hiddenCardProbability;
    // 選擇不確定性最高的組合
    return probs[colors[0]] * (1 - probs[colors[0]]) +
           probs[colors[1]] * (1 - probs[colors[1]]);
  }

  selectQuestionType(gameState, knowledge, colors) {
    // 根據當前手牌和目標情況選擇最佳問牌方式
    const aiPlayer = gameState.players[gameState.currentPlayerIndex];
    const hand = aiPlayer.hand || [];

    // 如果有要給的顏色，考慮使用類型 3
    const hasColor1 = hand.some(c => c.color === colors[0]);
    const hasColor2 = hand.some(c => c.color === colors[1]);

    if ((hasColor1 || hasColor2) && Math.random() > 0.5) {
      return 3; // 給一張要全部
    }

    return 2; // 其中一種顏色全部（資訊量最大）
  }

  selectGuessColors(knowledge) {
    const probs = knowledge.hiddenCardProbability;

    // 選擇概率最高的組合
    const colors = Object.entries(probs)
      .filter(([color]) => !knowledge.eliminatedColors.has(color))
      .sort((a, b) => b[1] - a[1]);

    return [colors[0][0], colors[1][0]];
  }

  decideFollowGuess(guessedColors, knowledge) {
    const successProb = this.calculateSuccessProbability(guessedColors, knowledge);

    // 只有當預期值為正時才跟猜
    // EV = (成功概率 × 1分) - (失敗概率 × 1分)
    const ev = successProb * 1 - (1 - successProb) * 1;

    return ev > 0;
  }
}
```

---

## 七、UI 整合

### 7.1 遊戲設定頁面

新增 AI 玩家選擇器組件：

```jsx
/**
 * AI 玩家選擇器組件
 */
function AIPlayerSelector({ onConfigChange }) {
  const [aiCount, setAICount] = useState(2);
  const [difficulties, setDifficulties] = useState(['medium', 'medium']);

  const difficultyOptions = [
    { value: 'easy', label: '簡單', description: '隨機決策，適合新手' },
    { value: 'medium', label: '中等', description: '基礎推理' },
    { value: 'hard', label: '困難', description: '完整推理引擎' }
  ];

  return (
    <div className="ai-player-selector">
      <h3>單人模式設定</h3>

      <div className="ai-count-selector">
        <label>AI 玩家數量：</label>
        <select value={aiCount} onChange={e => setAICount(Number(e.target.value))}>
          <option value={2}>2 個 AI（3人遊戲）</option>
          <option value={3}>3 個 AI（4人遊戲）</option>
        </select>
      </div>

      {difficulties.slice(0, aiCount).map((diff, index) => (
        <div key={index} className="ai-difficulty-selector">
          <label>AI #{index + 1} 難度：</label>
          <select
            value={diff}
            onChange={e => {
              const newDiffs = [...difficulties];
              newDiffs[index] = e.target.value;
              setDifficulties(newDiffs);
            }}
          >
            {difficultyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label} - {opt.description}
              </option>
            ))}
          </select>
        </div>
      ))}

      <button onClick={() => onConfigChange({ aiCount, difficulties })}>
        開始單人遊戲
      </button>
    </div>
  );
}
```

### 7.2 GameRoom 整合

修改 GameRoom 組件以支援 AI 玩家：

```jsx
/**
 * 修改後的 GameRoom
 */
function GameRoom({ gameConfig }) {
  const [gameState, setGameState] = useState(initialState);
  const [aiPlayers, setAIPlayers] = useState([]);

  // 初始化 AI 玩家
  useEffect(() => {
    if (gameConfig.aiCount > 0) {
      const ais = gameConfig.difficulties.map((diff, index) =>
        new AIPlayer(`ai-${index}`, `AI ${index + 1}`, diff)
      );
      setAIPlayers(ais);
    }
  }, [gameConfig]);

  // AI 回合處理
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (currentPlayer?.isAI && gameState.gamePhase === 'playing') {
      handleAITurn(currentPlayer.id);
    }
  }, [gameState.currentPlayerIndex, gameState.gamePhase]);

  async function handleAITurn(aiPlayerId) {
    const aiPlayer = aiPlayers.find(ai => ai.id === aiPlayerId);
    if (!aiPlayer) return;

    // AI 決策
    const action = await aiPlayer.takeTurn(gameState);

    // 執行動作
    if (action.type === 'question') {
      handleQuestionAction(action);
    } else if (action.type === 'guess') {
      handleGuessAction(action);
    }
  }

  // ... 其餘邏輯
}
```

---

## 八、開發階段規劃

### 第一階段：基礎架構（預估工作量：5-8 個工作單）✅ 已完成

| 工作單 | 內容 | 優先級 | 狀態 | 完成日期 |
|--------|------|--------|------|----------|
| 1 | 建立 AI 模組目錄結構 | P0 | ✅ | 2026-01-25 |
| 2 | 實現 AIPlayer 基類 | P0 | ✅ | 2026-01-25 |
| 3 | 實現 InformationTracker | P0 | ✅ | 2026-01-25 |
| 4 | 實現 BaseStrategy | P0 | ✅ | 2026-01-25 |
| 5 | 實現 EasyStrategy | P0 | ✅ | 2026-01-25 |
| - | 實現 DecisionMaker（額外） | P0 | ✅ | 2026-01-25 |

### 第二階段：中等難度（預估工作量：4-6 個工作單）✅ 已完成

| 工作單 | 內容 | 優先級 | 狀態 | 完成日期 |
|--------|------|--------|------|----------|
| 6 | 實現 ProbabilityCalculator | P1 | ⏸️ | - |
| 7 | 實現 MediumStrategy | P1 | ✅ | 2026-01-25 |
| 8 | 測試中等難度 AI（整合測試） | P1 | ✅ | 2026-01-25 |
| 9 | 調整決策參數 | P1 | ✅ | 2026-01-25 |

**完成成果：**
- ✅ 建立參數配置系統（`aiConfig.js`）
- ✅ 策略類別整合配置參數
- ✅ 10 個參數調整測試全部通過
- ✅ 總測試數：64 個（100% 通過率）
- ✅ 支援實驗性配置（激進/保守模式）

**註：** ProbabilityCalculator 的核心功能已整合在 InformationTracker 中，暫時跳過獨立實作。

### 第三階段：困難難度（預估工作量：4-6 個工作單）✅ 已完成

**相關工單：** [WORK_ORDER_0091](../work_orders/WORK_ORDER_0091.md)

| 工作單 | 內容 | 工單編號 | 優先級 | 狀態 | 完成日期 |
|--------|------|----------|--------|------|----------|
| 10 | 實現進階概率計算（整合至 HardStrategy） | - | P2 | ✅ | 2026-01-25 |
| 11 | 實現 HardStrategy | WORK_ORDER_0091 | P2 | ✅ | 2026-01-25 |
| 12 | 實現期望值計算 | WORK_ORDER_0091 | P2 | ✅ | 2026-01-25 |
| 13 | 測試困難難度 AI | WORK_ORDER_0091 | P2 | ✅ | 2026-01-25 |

**完成成果（2026-01-25）：**
- ✅ HardStrategy 實現（389 行代碼）
- ✅ 期望值計算系統
- ✅ 資訊熵評估
- ✅ 資訊增益最大化
- ✅ 31 個單元測試全部通過
- ✅ 14 個整合測試全部通過
- ✅ 整合至 AIPlayer 系統
- **工單：** WORK_ORDER_0091

### 第四階段：UI 整合（預估工作量：3-5 個工作單）

| 工作單 | 內容 | 工單編號 | 狀態 | 優先級 |
|--------|------|----------|------|--------|
| 14 | 實現 AIPlayerSelector 組件 | 202601250054 | ✅ 完成 | P1 |
| 15 | 修改 GameRoom 整合 AI | 202601250055 | 待處理 | P1 |
| 16 | 實現 AI 思考動畫 | 202601250056 | 待處理 | P2 |
| 17 | 單人模式 E2E 測試 | 202601250057 | 待處理 | P1 |

**階段 14 完成成果（2026-01-25）：**
- ✅ AIPlayerSelector 組件實現（187 行代碼）
- ✅ AI 數量選擇（2-3 個 AI，對應 3-4 人遊戲）
- ✅ 難度設定（簡單/中等/困難）
- ✅ 難度說明顯示
- ✅ 響應式設計（手機/平板/桌面）
- ✅ 18 個單元測試全部通過
- ✅ 100% 測試覆蓋率
- ✅ 整合至 GameSetup 模組
- **工單：** 202601250054

### 第五階段：測試調整（預估工作量：2-4 個工作單）

| 工作單 | 內容 | 工單編號 | 狀態 | 優先級 |
|--------|------|----------|------|--------|
| 18 | AI 行為測試與驗證 | 202601250058 | 待處理 | P1 |
| 19 | 難度平衡調整 | 202601250059 | 待處理 | P2 |
| 20 | 效能測試與記憶體檢查 | 202601250060 | 待處理 | P2 |

---

## 九、新增常數

在 `shared/constants.js` 中新增：

```javascript
// ==================== AI 相關常數 ====================

/**
 * AI 難度級別
 */
export const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

/**
 * AI 玩家名稱
 */
export const AI_PLAYER_NAMES = [
  '小草', '藥師', '本草', '仙丹'
];

/**
 * AI 思考延遲（毫秒）
 */
export const AI_THINK_DELAY = {
  MIN: 1000,
  MAX: 3000
};

/**
 * 玩家類型
 */
export const PLAYER_TYPE = {
  HUMAN: 'human',
  AI: 'ai'
};
```

---

## 十、測試策略

### 10.1 單元測試

```javascript
describe('AIPlayer', () => {
  test('should create AI player with correct difficulty', () => {
    const ai = new AIPlayer('ai-1', 'Test AI', 'hard');
    expect(ai.difficulty).toBe('hard');
    expect(ai.isAI).toBe(true);
  });

  test('should update information on game events', () => {
    const ai = new AIPlayer('ai-1', 'Test AI', 'medium');
    ai.onGameEvent({
      type: 'CARD_TRANSFER',
      playerId: 'player-1',
      cards: [{ color: 'red' }]
    });

    const knowledge = ai.informationTracker.getKnowledge();
    expect(knowledge.visibleColorCounts.red).toBe(1);
  });
});

describe('InformationTracker', () => {
  test('should update probabilities when cards are revealed', () => {
    const tracker = new InformationTracker();

    // 模擬看到所有紅色牌
    tracker.updateVisibleCount('red');
    tracker.updateVisibleCount('red');
    tracker.recalculateProbabilities();

    expect(tracker.hiddenCardProbability.red).toBe(0);
    expect(tracker.eliminatedColors.has('red')).toBe(true);
  });
});

describe('EasyStrategy', () => {
  test('should always make valid decisions', () => {
    const strategy = new EasyStrategy();
    const gameState = createMockGameState();
    const knowledge = createMockKnowledge();

    const action = strategy.decideAction(gameState, knowledge);

    expect(['question', 'guess']).toContain(action.type);
  });
});
```

### 10.2 整合測試

```javascript
describe('AI Game Integration', () => {
  test('should complete a full game with AI players', async () => {
    const game = createGameWithAI({
      humanCount: 1,
      aiCount: 2,
      difficulties: ['easy', 'medium']
    });

    game.start();

    // 模擬遊戲直到結束
    while (!game.isFinished()) {
      await game.processNextTurn();
    }

    expect(game.winner).toBeDefined();
  });
});
```

---

## 十一、未來擴展

1. **學習型 AI**：根據玩家行為調整策略
2. **個性化 AI**：不同個性（保守、激進、隨機）
3. **多人 + AI 混合**：支援 2 人 + AI 的模式
4. **AI 對戰統計**：追蹤各難度 AI 的勝率
5. **教學模式**：AI 解釋決策理由

---

## 十二、結論

本計劃提供了完整的電腦玩家實現方案，包括：

- **三種難度級別**：滿足不同玩家需求
- **模組化設計**：易於維護和擴展
- **完整的推理引擎**：困難難度提供真正的挑戰
- **自然的遊戲體驗**：適當的延遲和動畫

預估總工作量：**18-29 個工作單**

建議從簡單難度開始實現，逐步增加複雜度，確保每個階段都有可運行的版本。
