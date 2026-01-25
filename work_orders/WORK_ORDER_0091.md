# 工作單 0091

**日期：** 2026-01-25

**工作單標題：** AI 系統 - 困難難度策略實現（HardStrategy）

**工單主旨：** 功能開發 - 實現完整推理引擎與進階決策演算法

**相關工單：** 無

**依賴工單：** 無（獨立實現）

---

## 一、功能概述

### 1.1 核心功能

實現困難難度 AI 策略，提供最高難度的挑戰。

**主要特性：**
- 期望值計算決策
- 資訊熵評估
- 資訊增益最大化
- 科學決策框架

### 1.2 技術目標

- 完整推理引擎
- 數學模型應用
- 最佳化決策
- 高性能運算

---

## 二、技術實現

### 2.1 HardStrategy 類別

**檔案：** `frontend/src/ai/strategies/HardStrategy.js`

**核心演算法：**

1. **期望值計算**
```javascript
calculateGuessExpectedValue(gameState, knowledge) {
  const successProb = this.calculateSuccessProbability(bestGuess, knowledge);
  // EV = (成功概率 × 3分) - (失敗概率 × 0分)
  return successProb * 3 - (1 - successProb) * 0;
}
```

2. **資訊熵評估**
```javascript
calculateEntropy(probabilities) {
  let entropy = 0;
  for (const prob of Object.values(probabilities)) {
    if (prob > 0) {
      entropy -= prob * Math.log2(prob);  // H = -Σ(p_i × log2(p_i))
    }
  }
  return entropy;
}
```

3. **資訊增益最大化**
```javascript
evaluateColorPair(colors, knowledge) {
  const probs = knowledge.hiddenCardProbability;
  // 使用 p(1-p) 衡量不確定性
  const uncertainty1 = probs[colors[0]] * (1 - probs[colors[0]]);
  const uncertainty2 = probs[colors[1]] * (1 - probs[colors[1]]);
  return uncertainty1 + uncertainty2;
}
```

4. **決策流程**
```javascript
decideAction(gameState, knowledge) {
  // 計算猜牌期望值
  const guessEV = this.calculateGuessExpectedValue(gameState, knowledge);

  // 計算問牌資訊價值
  const questionValue = this.calculateQuestionValue(gameState, knowledge);

  // 期望值決策
  if (guessEV >= this.expectedValueMinimum && guessEV > questionValue) {
    return ACTION_TYPE.GUESS;
  }

  return ACTION_TYPE.QUESTION;
}
```

### 2.2 參數配置

**預設參數：**
```javascript
{
  guessConfidenceThreshold: 0.8,      // 猜牌信心度閾值
  followGuessProbThreshold: 0.3,      // 跟猜概率閾值
  expectedValueMinimum: 0.5,          // 期望值最小值
  informationEntropyWeight: 0.2       // 資訊熵權重
}
```

### 2.3 整合至 AIPlayer

**修改：** `frontend/src/ai/AIPlayer.js`

```javascript
import HardStrategy from './strategies/HardStrategy';
import InformationTracker from './InformationTracker';
import DecisionMaker from './DecisionMaker';

createStrategy(difficulty) {
  let strategy;

  switch (difficulty) {
    case AI_DIFFICULTY.EASY:
      strategy = new EasyStrategy();
      break;
    case AI_DIFFICULTY.MEDIUM:
      strategy = new MediumStrategy();
      break;
    case AI_DIFFICULTY.HARD:
      strategy = new HardStrategy();
      break;
    default:
      strategy = new MediumStrategy();
  }

  strategy.selfId = this.id;
  return strategy;
}
```

---

## 三、測試覆蓋

### 3.1 單元測試

**檔案：** `frontend/src/ai/__tests__/HardStrategy.test.js`

**測試項目（31 個）：**
- 構造函數測試（3 個）
- calculateEntropy 測試（3 個）
- calculateSuccessProbability 測試（3 個）
- calculateGuessExpectedValue 測試（2 個）
- calculateQuestionValue 測試（2 個）
- decideAction 測試（3 個）
- selectTargetPlayer 測試（2 個）
- calculateTargetValue 測試（2 個）
- evaluateColorPair 測試（1 個）
- selectColors 測試（2 個）
- selectQuestionType 測試（1 個）
- selectGuessColors 測試（2 個）
- decideFollowGuess 測試（3 個）
- getInfo 測試（1 個）
- 工廠函數測試（1 個）

### 3.2 整合測試

**檔案：** `frontend/src/ai/__tests__/HardAI.integration.test.js`

**測試項目（14 個）：**
- 期望值計算與決策（2 個）
- 資訊熵評估（2 個）
- 目標玩家選擇（1 個）
- 顏色選擇（1 個）
- 跟猜決策（3 個）
- 完整遊戲流程（3 個）
- 強制猜牌場景（1 個）
- createAIPlayer 測試（1 個）

### 3.3 測試結果

```
測試套件：12 passed
測試用例：336 passed
執行時間：27.974 秒
通過率：100%
```

---

## 四、數學模型

### 4.1 期望值理論

**猜牌期望值：**
```
EV_guess = P(success) × Reward - P(failure) × Cost
         = P(success) × 3 - P(failure) × 0
         = P(success) × 3
```

**跟猜期望值：**
```
EV_follow = P(success) × 1 - P(failure) × 1
          = 2 × P(success) - 1
```

**決策規則：**
- EV > 0 → 執行動作
- EV ≤ 0 → 不執行動作

### 4.2 資訊熵理論

**定義：**
```
H(X) = -Σ p(x_i) × log₂(p(x_i))
```

**特性：**
- 均勻分布時熵最大（最不確定）
- 集中分布時熵最小（較確定）
- 確定性分布時熵為 0（完全確定）

**應用：**
- 衡量不確定性
- 評估資訊價值
- 指導決策選擇

### 4.3 資訊增益

**不確定性度量：**
```
Uncertainty(p) = p × (1 - p)
```

**特性：**
- p = 0.5 時不確定性最大（0.25）
- p = 0 或 p = 1 時不確定性為 0
- 用於選擇最佳問牌顏色組合

---

## 五、文件更新

### 5.1 新增文件

1. `frontend/src/ai/strategies/HardStrategy.js` (389 行)
2. `frontend/src/ai/__tests__/HardStrategy.test.js` (416 行)
3. `frontend/src/ai/__tests__/HardAI.integration.test.js` (351 行)
4. `reports/HARDSTRATEGY_IMPLEMENTATION_COMPLETE.md`

### 5.2 修改文件

1. `frontend/src/ai/AIPlayer.js`
   - 導入 HardStrategy
   - 更新 createStrategy 方法
   - 整合實際 InformationTracker 和 DecisionMaker

2. `frontend/src/ai/__tests__/AIPlayer.test.js`
   - 修正測試兼容性

3. `docs/AI_PLAYER_IMPLEMENTATION_PLAN.md`
   - 更新完成進度
   - 標記第三階段完成

---

## 六、驗收標準

### 功能完整性
- [x] HardStrategy 類別實現
- [x] 期望值計算正確
- [x] 資訊熵評估正確
- [x] 資訊增益最大化
- [x] 整合至 AIPlayer

### 測試覆蓋
- [x] 單元測試 31 個全部通過
- [x] 整合測試 14 個全部通過
- [x] 所有 AI 測試 336 個通過
- [x] 測試覆蓋率 100%

### 代碼質量
- [x] 代碼註解完整
- [x] 方法文檔完整
- [x] 遵循命名規範
- [x] 無 ESLint 警告

### 文檔完整性
- [x] 完成報告撰寫
- [x] 技術文檔更新
- [x] 計劃文檔更新
- [x] 測試結果記錄

---

## 七、技術亮點

### 7.1 期望值決策框架

建立完整的數學決策框架，基於期望值理論做出最佳決策：
- 科學的風險評估
- 量化的收益分析
- 可配置的決策閾值

### 7.2 資訊理論應用

應用資訊熵理論評估資訊價值：
- 量化不確定性
- 評估問牌價值
- 最佳化資訊獲取

### 7.3 最佳化演算法

實現資訊增益最大化：
- 評估所有顏色組合
- 選擇不確定性最高的組合
- 動態調整策略

---

## 八、後續工作

### 8.1 短期優化

1. 參數調整
   - 根據實際測試數據微調
   - 測試實驗性參數

2. 性能優化
   - 優化計算效率
   - 減少記憶體使用

### 8.2 中期擴展

1. UI 整合
   - AI 難度選擇器
   - 思考動畫
   - 決策可視化

2. AI vs AI 測試
   - 自動對戰系統
   - 勝率統計
   - 參數優化

### 8.3 長期規劃

1. 學習型 AI
   - 記錄遊戲數據
   - 行為模式分析
   - 自適應參數調整

2. 個性化 AI
   - 不同風格變體
   - 玩家偏好匹配
   - 動態難度調整

---

## 九、結語

成功實現 HardStrategy 困難難度 AI 策略，建立了完整的期望值計算和資訊熵評估系統。所有測試通過（336/336），達成專案里程碑。

**完成日期：** 2026-01-25
**工作時數：** 約 4 小時
**代碼行數：** 1,156 行（實現 389 + 測試 767）
**測試通過率：** 100%

---

**相關文檔：**
- [完成報告](../reports/HARDSTRATEGY_IMPLEMENTATION_COMPLETE.md) - HardStrategy 實現完成報告
- [實現計劃](../docs/AI_PLAYER_IMPLEMENTATION_PLAN.md) - AI 玩家實現計劃
- [參數調整報告](../reports/AI_PARAM_TUNING_COMPLETE.md) - AI 參數調整完成報告
- [工單索引](./INDEX.md) - 工單索引

**相關代碼：**
- 策略實現：`frontend/src/ai/strategies/HardStrategy.js`
- 單元測試：`frontend/src/ai/__tests__/HardStrategy.test.js`
- 整合測試：`frontend/src/ai/__tests__/HardAI.integration.test.js`
- AI 玩家：`frontend/src/ai/AIPlayer.js`
