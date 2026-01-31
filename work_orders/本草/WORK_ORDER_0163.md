# 工作單 0163

**建立日期**: 2026-01-27

**優先級**: P1 (重要)

**標題**: MediumAI 決策邏輯調查與修復

---

## 一、工作目標

調查並修復 MediumAI 在信心度不足時仍選擇猜牌的問題。

---

## 二、問題描述

### 現象
整合測試 `should guess when confidence is high` 失敗：
```
Expected: "question"
Received: "guess"
```

### 測試場景
```javascript
// 測試設置
// 已給 AI：全部紅色（2張）和全部黃色（3張）
// 剩餘：綠4、藍5，共9張，其中2張是蓋牌
// 藍色概率 = 5/9，綠色概率 = 4/9
// 聯合概率 ≈ (5/9) * (4/9) ≈ 0.247 < 0.6
// 預期：應該問牌（信心度不足）
// 實際：選擇猜牌
```

### 根本原因分析

根據 `MediumStrategy.js` 的邏輯：
```javascript
decideAction(gameState, knowledge) {
  if (this.mustGuess(gameState, this.selfId)) {
    return ACTION_TYPE.GUESS;  // 強制猜牌
  }

  const confidence = this.calculateConfidence(knowledge);

  if (confidence >= this.guessConfidenceThreshold) {  // 0.6
    return ACTION_TYPE.GUESS;
  }

  return ACTION_TYPE.QUESTION;
}
```

可能原因：
1. `mustGuess()` 回傳 true（錯誤判斷只剩自己）
2. `calculateConfidence()` 回傳值不正確
3. `knowledge.hiddenCardProbability` 資料不正確
4. 概率計算公式錯誤

---

## 三、實施計畫

### 3.1 調查階段

#### 3.1.1 加入調試日誌

在 `MediumStrategy.js` 中加入詳細日誌：

```javascript
decideAction(gameState, knowledge) {
  console.log('[MediumAI Debug] ========== 決策開始 ==========');
  console.log('[MediumAI Debug] gameState.players:', gameState.players?.map(p => ({
    id: p.id,
    isActive: p.isActive
  })));
  console.log('[MediumAI Debug] selfId:', this.selfId);

  // 檢查強制猜牌
  const mustGuessResult = this.mustGuess(gameState, this.selfId);
  console.log('[MediumAI Debug] mustGuess():', mustGuessResult);

  if (mustGuessResult) {
    console.log('[MediumAI Debug] 決定：強制猜牌');
    return ACTION_TYPE.GUESS;
  }

  // 計算信心度
  console.log('[MediumAI Debug] knowledge:', knowledge);
  console.log('[MediumAI Debug] hiddenCardProbability:', knowledge?.hiddenCardProbability);

  const confidence = this.calculateConfidence(knowledge);
  console.log('[MediumAI Debug] 計算的信心度:', confidence);
  console.log('[MediumAI Debug] 閾值:', this.guessConfidenceThreshold);

  if (confidence >= this.guessConfidenceThreshold) {
    console.log('[MediumAI Debug] 決定：信心度足夠，猜牌');
    return ACTION_TYPE.GUESS;
  }

  console.log('[MediumAI Debug] 決定：信心度不足，問牌');
  return ACTION_TYPE.QUESTION;
}
```

#### 3.1.2 檢查 BaseStrategy.mustGuess()

```javascript
// BaseStrategy.js
mustGuess(gameState, selfId) {
  const otherPlayers = this.getOtherActivePlayers(gameState, selfId);
  console.log('[BaseStrategy Debug] otherPlayers:', otherPlayers);
  return !otherPlayers || otherPlayers.length === 0;
}
```

#### 3.1.3 檢查 calculateJointProbability

```javascript
// BaseStrategy.js
calculateJointProbability(probabilities, color1, color2) {
  const prob1 = probabilities[color1] || 0;
  const prob2 = probabilities[color2] || 0;
  console.log('[BaseStrategy Debug] jointProb:', { color1, prob1, color2, prob2 });
  return prob1 * prob2;
}
```

### 3.2 修復階段（根據調查結果）

#### 可能修復 1：mustGuess 判斷錯誤

```javascript
// 確保正確判斷其他活躍玩家
mustGuess(gameState, selfId) {
  if (!gameState || !gameState.players) {
    return false;  // 資料不足時不強制猜牌
  }

  const otherPlayers = gameState.players.filter(
    p => p.id !== selfId && p.isActive === true
  );

  return otherPlayers.length === 0;
}
```

#### 可能修復 2：概率計算錯誤

```javascript
calculateConfidence(knowledge) {
  if (!knowledge || !knowledge.hiddenCardProbability) {
    return 0;  // 沒有資訊時信心度為 0
  }

  const probs = knowledge.hiddenCardProbability;

  // 確保概率物件有效
  if (typeof probs !== 'object' || Object.keys(probs).length === 0) {
    return 0;
  }

  const topColors = this.selectColorsByProbability(probs, 2);

  if (topColors.length < 2) {
    return 0;
  }

  // 修正：使用正確的聯合概率計算
  // P(兩張蓋牌分別是 color1 和 color2) 需要考慮排列
  const prob1 = probs[topColors[0]] || 0;
  const prob2 = probs[topColors[1]] || 0;

  // 假設蓋牌是無放回抽取，正確計算應考慮剩餘牌數
  // 簡化版：兩個概率相乘
  const confidence = prob1 * prob2;

  console.log('[MediumAI] 信心度計算:', {
    topColors,
    prob1,
    prob2,
    confidence
  });

  return confidence;
}
```

#### 可能修復 3：InformationTracker 更新問題

檢查 `InformationTracker.processEvent` 是否正確更新 `hiddenCardProbability`。

---

## 四、測試計畫

### 4.1 調試測試
執行失敗的測試並觀察日誌：
```bash
npm test -- --testPathPattern="MediumAI.integration" --verbose
```

### 4.2 單元測試
```javascript
describe('MediumStrategy.calculateConfidence', () => {
  test('概率均勻時信心度應較低', () => {
    const strategy = new MediumStrategy();
    const knowledge = {
      hiddenCardProbability: {
        red: 0.25,
        yellow: 0.25,
        green: 0.25,
        blue: 0.25
      }
    };
    const confidence = strategy.calculateConfidence(knowledge);
    expect(confidence).toBeLessThan(0.1);  // 0.25 * 0.25 = 0.0625
  });

  test('概率集中時信心度應較高', () => {
    const strategy = new MediumStrategy();
    const knowledge = {
      hiddenCardProbability: {
        red: 0.05,
        yellow: 0.05,
        green: 0.8,
        blue: 0.1
      }
    };
    const confidence = strategy.calculateConfidence(knowledge);
    expect(confidence).toBeGreaterThan(0.6);  // 0.8 * 0.1 = 0.08? 需要重新檢查邏輯
  });
});
```

### 4.3 整合測試
修復後重新執行：
```bash
npm test -- --testPathPattern="MediumAI.integration"
```

---

## 五、驗收標準

1. 找出並記錄導致測試失敗的根本原因
2. 修復邏輯錯誤
3. 所有 MediumAI 相關測試通過
4. 調試日誌可選擇性移除或保留為可配置

---

## 六、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| 修復破壞其他 AI 行為 | 中 | 中 | 完整測試所有 AI 難度 |
| 概率計算本身設計有問題 | 中 | 高 | 重新審視概率模型 |

---

## 七、相關工單

- 依賴: 無
- 被依賴: 無

---

*工單建立時間: 2026-01-27*
