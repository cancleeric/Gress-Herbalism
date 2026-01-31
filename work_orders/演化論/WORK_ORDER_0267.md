# 工作單 0267

## 編號
0267

## 日期
2026-01-31

## 工作單標題
後端邏輯單元測試

## 工單主旨
為演化論後端邏輯模組撰寫完整的單元測試

## 內容

### 任務描述

為所有後端邏輯模組撰寫單元測試，確保遊戲規則正確實作。

### 測試檔案結構

```
backend/logic/evolution/__tests__/
├── cardLogic.test.js
├── creatureLogic.test.js
├── feedingLogic.test.js
├── traitLogic.test.js
├── phaseLogic.test.js
├── scoreLogic.test.js
├── gameLogic.test.js
└── integration.test.js
```

### 測試項目

#### 1. cardLogic.test.js

```javascript
describe('cardLogic', () => {
  describe('createDeck', () => {
    test('should create 84 cards', () => { });
    test('should have correct trait distribution', () => { });
    test('each card should have id, traitType, foodBonus', () => { });
  });

  describe('shuffleDeck', () => {
    test('should randomize card order', () => { });
    test('should maintain all 84 cards', () => { });
  });

  describe('drawCards', () => {
    test('should draw correct number of cards', () => { });
    test('should reduce deck size', () => { });
    test('should handle drawing more than remaining', () => { });
  });

  describe('validateTraitPlacement', () => {
    test('should reject duplicate traits (except fat tissue)', () => { });
    test('should allow fat tissue stacking', () => { });
    test('should reject carnivore + scavenger combo', () => { });
    test('should allow parasite only on opponent creatures', () => { });
  });
});
```

#### 2. creatureLogic.test.js

```javascript
describe('creatureLogic', () => {
  describe('calculateFoodNeed', () => {
    test('base need should be 1', () => { });
    test('carnivore should add +1', () => { });
    test('massive should add +1', () => { });
    test('parasite should add +2', () => { });
    test('combined traits should stack correctly', () => { });
  });

  describe('canBeAttacked', () => {
    test('should check camouflage vs sharp vision', () => { });
    test('should check burrowing when fed', () => { });
    test('should check aquatic matching', () => { });
    test('should check massive matching', () => { });
    test('should check symbiosis protection', () => { });
  });

  describe('checkExtinction', () => {
    test('unfed creature should go extinct', () => { });
    test('hibernating creature should survive', () => { });
    test('fed creature should survive', () => { });
  });
});
```

#### 3. feedingLogic.test.js

```javascript
describe('feedingLogic', () => {
  describe('feedCreature', () => {
    test('should reduce food pool', () => { });
    test('should increase creature food', () => { });
    test('should trigger communication chain', () => { });
    test('should trigger cooperation chain', () => { });
    test('carnivore should not be able to take red food', () => { });
  });

  describe('attackCreature', () => {
    test('successful attack gives 2 blue food', () => { });
    test('attack triggers scavenger', () => { });
    test('poisonous marks attacker as poisoned', () => { });
  });

  describe('processCommunication', () => {
    test('should chain feed linked creatures', () => { });
    test('should stop when food pool empty', () => { });
    test('should not infinite loop on circular links', () => { });
  });
});
```

#### 4. traitLogic.test.js

```javascript
describe('traitLogic', () => {
  describe('useTailLoss', () => {
    test('should remove selected trait', () => { });
    test('attacker should get 1 blue food', () => { });
    test('should cancel attack', () => { });
  });

  describe('useMimicry', () => {
    test('should redirect attack to valid target', () => { });
    test('should fail if no valid targets', () => { });
    test('should only work once per turn', () => { });
  });

  describe('rollAgileEscape', () => {
    test('4-6 should escape', () => { });
    test('1-3 should fail', () => { });
  });

  describe('useHibernation', () => {
    test('should mark creature as fed', () => { });
    test('should fail on last round', () => { });
  });

  describe('storeFat', () => {
    test('should store up to capacity', () => { });
    test('capacity equals fat tissue count', () => { });
  });

  describe('useRobbery', () => {
    test('should steal from unfed creature', () => { });
    test('should fail on fed creature', () => { });
    test('should only work once per phase', () => { });
  });
});
```

### 測試覆蓋率目標

| 模組 | 目標覆蓋率 |
|------|-----------|
| cardLogic | ≥ 90% |
| creatureLogic | ≥ 90% |
| feedingLogic | ≥ 85% |
| traitLogic | ≥ 85% |
| phaseLogic | ≥ 80% |
| gameLogic | ≥ 80% |

### 前置條件
- 工單 0228-0251 已完成（後端邏輯實作）

### 驗收標準
- [ ] 所有測試案例通過
- [ ] 整體覆蓋率 ≥ 80%
- [ ] 邊界案例有測試
- [ ] 錯誤情境有測試

### 相關檔案
- `backend/logic/evolution/__tests__/*.test.js` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第七章
