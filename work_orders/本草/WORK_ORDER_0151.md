# 工作單 0151

**日期**：2026-01-27

**工作單標題**：單元測試 - 共用模組與核心工具函數

**工單主旨**：測試 - 共用常數、牌組工具、遊戲規則驗證的單元測試

**優先級**：高

**依賴工單**：無

**計畫書**：`docs/TEST_PLAN.md`

---

## 一、測試範圍

### 1.1 測試目標

| 模組 | 檔案 | 測試案例數 |
|------|------|-----------|
| 常數定義 | `shared/constants.js` | 13 |
| 牌組工具 | `frontend/src/utils/cardUtils.js` | 9 |
| 遊戲規則 | `frontend/src/utils/gameRules.js` | 11 |
| **小計** | | **33** |

### 1.2 覆蓋率目標
- 目標覆蓋率：95%

---

## 二、測試案例清單

### 2.1 常數定義測試 (UT-SH-01)
**檔案**：`shared/constants.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-SH-01-01 | 牌組配置正確 | 紅2黃3綠4藍5，總共14張 |
| UT-SH-01-02 | 玩家數量限制 | MIN=3, MAX=4 |
| UT-SH-01-03 | 蓋牌數量正確 | HIDDEN_CARDS_COUNT=2 |
| UT-SH-01-04 | 勝利分數正確 | WINNING_SCORE=7 |
| UT-SH-01-05 | 猜對得分正確 | GUESS_CORRECT_POINTS=3 |
| UT-SH-01-06 | 跟猜得分正確 | FOLLOW_CORRECT=1, FOLLOW_WRONG=-1 |
| UT-SH-01-07 | 預測得分正確 | PREDICTION_CORRECT=1, PREDICTION_WRONG=-1 |
| UT-SH-01-08 | 遊戲階段定義 | 6個階段全部定義 |
| UT-SH-01-09 | 問牌類型定義 | 3種類型正確定義 |
| UT-SH-01-10 | 顏色組合牌定義 | 6種組合正確 |
| UT-SH-01-11 | isValidColor 函數 | 紅黃綠藍返回true，其他返回false |
| UT-SH-01-12 | isValidPlayerCount 函數 | 3-4返回true，其他返回false |
| UT-SH-01-13 | isValidQuestionType 函數 | 1-3返回true，其他返回false |

### 2.2 牌組工具函數測試 (UT-SH-02)
**檔案**：`frontend/src/utils/cardUtils.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-SH-02-01 | createDeck 建立牌組 | 14張牌，顏色分布正確 |
| UT-SH-02-02 | shuffleDeck 洗牌 | 牌組順序隨機化，總數不變 |
| UT-SH-02-03 | dealCards 發牌 | 正確分配牌給玩家 |
| UT-SH-02-04 | 3人發牌 | 蓋牌2張，每人4張 |
| UT-SH-02-05 | 4人發牌 | 蓋牌2張，每人3張 |
| UT-SH-02-06 | getCardsByColor | 正確篩選指定顏色的牌 |
| UT-SH-02-07 | removeCards | 正確從手牌移除牌 |
| UT-SH-02-08 | addCards | 正確添加牌到手牌 |
| UT-SH-02-09 | countCardsByColor | 正確計算各顏色牌數 |

### 2.3 遊戲規則驗證測試 (UT-SH-03)
**檔案**：`frontend/src/utils/gameRules.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-SH-03-01 | validateQuestion 基本驗證 | 正確驗證必要參數 |
| UT-SH-03-02 | validateQuestion 類型1 | 各一張驗證正確 |
| UT-SH-03-03 | validateQuestion 類型2 | 其中一種全部驗證正確 |
| UT-SH-03-04 | validateQuestion 類型3 | 給一張要全部驗證正確 |
| UT-SH-03-05 | validateGuess 基本驗證 | 正確驗證猜牌參數 |
| UT-SH-03-06 | validateGuess 顏色數量 | 必須選擇2個顏色 |
| UT-SH-03-07 | validateGuess 顏色可重複 | 允許選擇相同顏色 |
| UT-SH-03-08 | checkGuessResult 正確 | 正確比對返回true |
| UT-SH-03-09 | checkGuessResult 錯誤 | 錯誤比對返回false |
| UT-SH-03-10 | getActivePlayerCount | 正確計算活躍玩家數 |
| UT-SH-03-11 | mustGuess | 只剩一人時返回true |

---

## 三、測試程式碼範例

### 3.1 constants.test.js 範例

```javascript
import {
  CARD_COUNTS,
  TOTAL_CARDS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  HIDDEN_CARDS_COUNT,
  WINNING_SCORE,
  GUESS_CORRECT_POINTS,
  FOLLOW_CORRECT_POINTS,
  FOLLOW_WRONG_POINTS,
  GAME_PHASES,
  QUESTION_TYPES,
  COLOR_COMBINATION_CARDS,
  isValidColor,
  isValidPlayerCount,
  isValidQuestionType
} from './constants';

describe('遊戲常數定義', () => {
  describe('牌組配置', () => {
    test('UT-SH-01-01: 牌組配置正確', () => {
      expect(CARD_COUNTS.red).toBe(2);
      expect(CARD_COUNTS.yellow).toBe(3);
      expect(CARD_COUNTS.green).toBe(4);
      expect(CARD_COUNTS.blue).toBe(5);
      expect(TOTAL_CARDS).toBe(14);
    });
  });

  describe('玩家數量', () => {
    test('UT-SH-01-02: 玩家數量限制', () => {
      expect(MIN_PLAYERS).toBe(3);
      expect(MAX_PLAYERS).toBe(4);
    });
  });

  describe('計分規則', () => {
    test('UT-SH-01-04: 勝利分數', () => {
      expect(WINNING_SCORE).toBe(7);
    });

    test('UT-SH-01-05: 猜對得分', () => {
      expect(GUESS_CORRECT_POINTS).toBe(3);
    });

    test('UT-SH-01-06: 跟猜得分', () => {
      expect(FOLLOW_CORRECT_POINTS).toBe(1);
      expect(FOLLOW_WRONG_POINTS).toBe(-1);
    });
  });

  describe('工具函數', () => {
    test('UT-SH-01-11: isValidColor', () => {
      expect(isValidColor('red')).toBe(true);
      expect(isValidColor('yellow')).toBe(true);
      expect(isValidColor('green')).toBe(true);
      expect(isValidColor('blue')).toBe(true);
      expect(isValidColor('purple')).toBe(false);
      expect(isValidColor('')).toBe(false);
    });

    test('UT-SH-01-12: isValidPlayerCount', () => {
      expect(isValidPlayerCount(2)).toBe(false);
      expect(isValidPlayerCount(3)).toBe(true);
      expect(isValidPlayerCount(4)).toBe(true);
      expect(isValidPlayerCount(5)).toBe(false);
    });
  });
});
```

### 3.2 cardUtils.test.js 範例

```javascript
import {
  createDeck,
  shuffleDeck,
  dealCards,
  getCardsByColor,
  removeCards,
  addCards,
  countCardsByColor
} from './cardUtils';

describe('牌組工具函數', () => {
  describe('createDeck', () => {
    test('UT-SH-02-01: 建立牌組', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(14);

      const colorCounts = countCardsByColor(deck);
      expect(colorCounts.red).toBe(2);
      expect(colorCounts.yellow).toBe(3);
      expect(colorCounts.green).toBe(4);
      expect(colorCounts.blue).toBe(5);
    });
  });

  describe('shuffleDeck', () => {
    test('UT-SH-02-02: 洗牌', () => {
      const deck1 = createDeck();
      const deck2 = shuffleDeck([...deck1]);

      expect(deck2).toHaveLength(14);
      // 順序應該不同（機率極高）
      const sameOrder = deck1.every((card, i) => card.id === deck2[i].id);
      expect(sameOrder).toBe(false);
    });
  });

  describe('dealCards', () => {
    test('UT-SH-02-04: 3人發牌', () => {
      const { hiddenCards, playerHands } = dealCards(3);

      expect(hiddenCards).toHaveLength(2);
      expect(playerHands).toHaveLength(3);
      expect(playerHands[0]).toHaveLength(4);
      expect(playerHands[1]).toHaveLength(4);
      expect(playerHands[2]).toHaveLength(4);
    });

    test('UT-SH-02-05: 4人發牌', () => {
      const { hiddenCards, playerHands } = dealCards(4);

      expect(hiddenCards).toHaveLength(2);
      expect(playerHands).toHaveLength(4);
      expect(playerHands[0]).toHaveLength(3);
      expect(playerHands[1]).toHaveLength(3);
      expect(playerHands[2]).toHaveLength(3);
      expect(playerHands[3]).toHaveLength(3);
    });
  });
});
```

---

## 四、驗收標準

- [ ] 所有 33 個測試案例通過
- [ ] 覆蓋率達到 95%
- [ ] 無 console 錯誤或警告
- [ ] 測試程式碼符合專案規範

---

## 五、執行命令

```bash
# 執行共用模組測試
cd shared && npm test

# 執行前端工具函數測試
cd frontend && npm test -- --testPathPattern="utils/(cardUtils|gameRules).test.js"

# 查看覆蓋率
cd frontend && npm test -- --coverage --collectCoverageFrom="src/utils/*.js"
```

---

## 六、測試檔案清單

| 檔案路徑 | 狀態 |
|---------|------|
| `shared/constants.test.js` | 已存在，需補充 |
| `frontend/src/utils/cardUtils.test.js` | 已存在，需補充 |
| `frontend/src/utils/gameRules.test.js` | 已存在，需補充 |
