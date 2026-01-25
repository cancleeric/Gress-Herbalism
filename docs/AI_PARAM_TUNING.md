# AI 參數調整與平衡

**建立日期：** 2026-01-25
**狀態：** 📍 下一步工作
**目標：** 調整 AI 決策參數，確保遊戲體驗平衡

---

## 一、調整目標

### 1.1 核心目標

1. **難度階梯明確**：Easy < Medium < Hard
2. **遊戲體驗良好**：不會太簡單或太難
3. **行為合理**：AI 決策符合邏輯
4. **勝率平衡**：各難度勝率在合理範圍

### 1.2 預期勝率（vs 一般玩家）

| 難度 | 目標勝率 | 說明 |
|------|---------|------|
| Easy | 20-30% | 新手可輕鬆戰勝 |
| Medium | 40-50% | 提供挑戰但可戰勝 |
| Hard | 60-70% | 需要策略才能獲勝 |

---

## 二、現有參數

### 2.1 MediumStrategy 參數

```javascript
class MediumStrategy {
  constructor() {
    // 決策閾值
    this.guessConfidenceThreshold = 0.6;     // 60% 信心度才猜牌
    this.followGuessProbThreshold = 0.15;    // 15% 以上才跟猜
  }
}
```

### 2.2 EasyStrategy 參數

```javascript
class EasyStrategy {
  constructor() {
    // 問牌類型權重
    this.questionTypeWeights = [0.6, 0.3, 0.1];  // 60%, 30%, 10%
  }

  decideFollowGuess() {
    return Math.random() > 0.5;  // 50% 跟猜機率
  }
}
```

### 2.3 思考延遲

```javascript
// constants.js
export const AI_THINK_DELAY = {
  MIN: 1000,      // 1 秒
  MAX: 3000,      // 3 秒
  FOLLOW_GUESS_MIN: 500,
  FOLLOW_GUESS_MAX: 1500
};
```

---

## 三、調整項目

### 3.1 優先級 P0：MediumStrategy 核心參數

#### 1. guessConfidenceThreshold（猜牌閾值）

**當前值：** 0.6 (60%)
**建議測試範圍：** 0.5 - 0.7

```javascript
// 測試場景
const scenarios = [
  { threshold: 0.5, description: '更激進，提早猜牌' },
  { threshold: 0.6, description: '當前值，平衡' },
  { threshold: 0.7, description: '更保守，多問牌' }
];
```

**影響：**
- 過低：過早猜牌，猜錯率高
- 過高：問牌過多，缺乏決斷力

#### 2. followGuessProbThreshold（跟猜閾值）

**當前值：** 0.15 (15%)
**建議測試範圍：** 0.1 - 0.25

```javascript
// 測試場景
const scenarios = [
  { threshold: 0.10, description: '容易跟猜' },
  { threshold: 0.15, description: '當前值' },
  { threshold: 0.20, description: '較謹慎' },
  { threshold: 0.25, description: '很少跟猜' }
];
```

**影響：**
- 過低：跟猜過於頻繁，損失分數
- 過高：錯過跟猜機會，少獲得分數

### 3.2 優先級 P1：EasyStrategy 參數

#### 1. questionTypeWeights（問牌類型權重）

**當前值：** [0.6, 0.3, 0.1]
**建議調整：** 保持不變或微調

**原因：**
- 類型 1 最簡單，符合 Easy 定位
- 權重分佈合理

#### 2. 跟猜機率

**當前值：** 50%
**建議測試：** 30% - 50%

```javascript
// 調整選項
decideFollowGuess() {
  // 選項 A: 30% 跟猜（更保守）
  return Math.random() < 0.3;

  // 選項 B: 50% 跟猜（當前值）
  return Math.random() > 0.5;
}
```

### 3.3 優先級 P2：思考延遲

**當前值：**
- 一般決策：1-3 秒
- 跟猜決策：0.5-1.5 秒

**建議：** 根據實際遊戲體驗調整

```javascript
// 可能的調整
export const AI_THINK_DELAY = {
  // 選項 A: 更快速（適合測試）
  MIN: 500,
  MAX: 1500,

  // 選項 B: 當前值（平衡）
  MIN: 1000,
  MAX: 3000,

  // 選項 C: 更自然（更像人類）
  MIN: 1500,
  MAX: 4000,

  FOLLOW_GUESS_MIN: 500,
  FOLLOW_GUESS_MAX: 1500
};
```

---

## 四、測試方法

### 4.1 單元測試（參數影響）

**檔案：** `frontend/src/ai/__tests__/ParamTuning.test.js`

```javascript
describe('Parameter Tuning Tests', () => {
  describe('MediumStrategy - guessConfidenceThreshold', () => {
    test('threshold 0.5 should guess more frequently', () => {
      const strategy = new MediumStrategy();
      strategy.guessConfidenceThreshold = 0.5;

      let guessCount = 0;
      for (let i = 0; i < 100; i++) {
        const knowledge = createRandomKnowledge();
        const action = strategy.decideAction(gameState, knowledge);
        if (action === ACTION_TYPE.GUESS) guessCount++;
      }

      // 應該比閾值 0.7 猜得更多
      expect(guessCount).toBeGreaterThan(30);
    });
  });

  describe('MediumStrategy - followGuessProbThreshold', () => {
    test('threshold 0.1 should follow more often', () => {
      const strategy = new MediumStrategy();
      strategy.followGuessProbThreshold = 0.1;

      let followCount = 0;
      for (let i = 0; i < 100; i++) {
        const knowledge = createRandomKnowledge();
        if (strategy.decideFollowGuess(['red', 'blue'], knowledge)) {
          followCount++;
        }
      }

      // 應該比閾值 0.25 跟得更多
      expect(followCount).toBeGreaterThan(40);
    });
  });
});
```

### 4.2 整合測試（完整遊戲）

**檔案：** `frontend/src/ai/__tests__/AIGameSimulation.test.js`

```javascript
describe('AI Game Simulation', () => {
  test('Medium AI should win ~40-50% against random player', async () => {
    const results = { aiWins: 0, playerWins: 0 };
    const gameCount = 100;

    for (let i = 0; i < gameCount; i++) {
      const winner = await simulateGame({
        players: [
          createMediumAI('ai-1'),
          createRandomPlayer('player-2'),
          createRandomPlayer('player-3')
        ]
      });

      if (winner === 'ai-1') results.aiWins++;
    }

    const winRate = results.aiWins / gameCount;
    expect(winRate).toBeGreaterThan(0.4);
    expect(winRate).toBeLessThan(0.6);
  });
});
```

### 4.3 手動測試清單

- [ ] 與 Easy AI 對戰 10 局，記錄勝負
- [ ] 與 Medium AI 對戰 10 局，記錄勝負
- [ ] 觀察 AI 決策是否合理
- [ ] 記錄 AI 平均猜牌回合數
- [ ] 記錄 AI 跟猜成功率

---

## 五、調整流程

### Step 1: 建立參數配置文件

**檔案：** `frontend/src/ai/config/aiConfig.js`

```javascript
/**
 * AI 參數配置
 *
 * 此檔案集中管理所有 AI 決策參數
 * 方便快速調整和 A/B 測試
 */

export const AI_PARAMS = {
  // Easy 難度參數
  EASY: {
    questionTypeWeights: [0.6, 0.3, 0.1],
    followGuessProbability: 0.5,
  },

  // Medium 難度參數
  MEDIUM: {
    guessConfidenceThreshold: 0.6,
    followGuessProbThreshold: 0.15,
  },

  // Hard 難度參數（預留）
  HARD: {
    guessConfidenceThreshold: 0.8,
    followGuessProbThreshold: 0.3,
    expectedValueMinimum: 0.5,
  },

  // 思考延遲
  THINK_DELAY: {
    MIN: 1000,
    MAX: 3000,
    FOLLOW_GUESS_MIN: 500,
    FOLLOW_GUESS_MAX: 1500,
  }
};

// 實驗性參數（用於 A/B 測試）
export const EXPERIMENTAL_PARAMS = {
  MEDIUM_AGGRESSIVE: {
    guessConfidenceThreshold: 0.5,  // 更激進
    followGuessProbThreshold: 0.1,
  },

  MEDIUM_CONSERVATIVE: {
    guessConfidenceThreshold: 0.7,  // 更保守
    followGuessProbThreshold: 0.25,
  }
};
```

### Step 2: 修改策略使用配置

```javascript
// MediumStrategy.js
import { AI_PARAMS } from '../config/aiConfig';

class MediumStrategy extends BaseStrategy {
  constructor(params = AI_PARAMS.MEDIUM) {
    super(AI_DIFFICULTY.MEDIUM);
    this.name = 'MediumStrategy';

    // 使用配置參數
    this.guessConfidenceThreshold = params.guessConfidenceThreshold;
    this.followGuessProbThreshold = params.followGuessProbThreshold;
  }
}
```

### Step 3: 執行測試並記錄

1. 執行單元測試：`npm test -- ParamTuning.test`
2. 執行整合測試：`npm test -- AIGameSimulation.test`
3. 手動對戰測試，記錄：
   - 勝率
   - 平均回合數
   - 猜牌時機
   - 跟猜決策

### Step 4: 分析結果並調整

```markdown
## 測試結果記錄

### 配置 A (Current)
- guessConfidenceThreshold: 0.6
- followGuessProbThreshold: 0.15

**結果：**
- vs Easy AI: 勝率 65%
- vs Medium AI: 勝率 50%
- 平均猜牌回合: 8 回合
- 跟猜成功率: 45%

### 配置 B (Aggressive)
- guessConfidenceThreshold: 0.5
- followGuessProbThreshold: 0.1

**結果：**
- vs Easy AI: 勝率 70%
- vs Medium AI: 勝率 55%
- 平均猜牌回合: 6 回合（提早猜牌）
- 跟猜成功率: 35%（跟猜過多）

**結論：** 配置 B 過於激進，跟猜成功率下降
```

---

## 六、驗收標準

### 必要條件

- [ ] 建立參數配置文件 `aiConfig.js`
- [ ] 所有策略使用配置參數
- [ ] 參數調整測試通過
- [ ] 遊戲模擬測試通過

### 品質標準

- [ ] Medium AI vs Easy AI 勝率 > 60%
- [ ] Medium AI vs Random Player 勝率 40-50%
- [ ] AI 決策行為合理（不會明顯失誤）
- [ ] 思考延遲符合自然體驗

### 文檔標準

- [ ] 記錄測試結果
- [ ] 說明參數選擇理由
- [ ] 提供調整建議

---

## 七、後續工作

完成參數調整後，進入第三階段：

1. **實現 HardStrategy**（困難難度）
2. **進階概率計算**
3. **期望值決策**
4. **資訊價值評估**
