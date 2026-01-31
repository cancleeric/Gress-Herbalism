# 工作單 0269

## 編號
0269

## 日期
2026-01-31

## 工作單標題
整合測試

## 工單主旨
撰寫演化論遊戲的完整流程整合測試

## 內容

### 任務描述

建立端對端測試，驗證完整遊戲流程的正確性。

### 測試場景

#### 1. 完整遊戲流程測試

```javascript
// backend/logic/evolution/__tests__/integration.test.js

describe('Evolution Game Integration', () => {
  let gameState;

  beforeEach(() => {
    gameState = initGame([
      { id: 'p1', name: '玩家1' },
      { id: 'p2', name: '玩家2' }
    ]);
  });

  describe('Full Game Flow', () => {
    test('should complete a full game cycle', () => {
      // 1. 演化階段 - 創造生物
      gameState = processAction(gameState, 'p1', {
        type: 'createCreature',
        cardId: gameState.players[0].hand[0].id
      }).gameState;

      expect(gameState.players[0].creatures.length).toBe(1);

      // 2. 演化階段 - 賦予性狀
      gameState = processAction(gameState, 'p2', {
        type: 'createCreature',
        cardId: gameState.players[1].hand[0].id
      }).gameState;

      // 3. 跳過演化
      gameState = processAction(gameState, 'p1', { type: 'pass' }).gameState;
      gameState = processAction(gameState, 'p2', { type: 'pass' }).gameState;

      // 4. 應該進入食物供給階段
      expect(gameState.phase).toBe('foodSupply');

      // ... 繼續測試其他階段
    });

    test('should handle carnivore attack correctly', () => {
      // 設置肉食生物
      // 執行攻擊
      // 驗證結果
    });

    test('should trigger chain effects correctly', () => {
      // 設置溝通/合作連結
      // 進食
      // 驗證連鎖效應
    });
  });
});
```

#### 2. 多人同步測試

```javascript
describe('Multiplayer Sync', () => {
  test('all players should see same game state', async () => {
    const room = createTestRoom(4);

    // 模擬 4 個玩家連接
    const sockets = await connectPlayers(room, 4);

    // 執行動作
    await sockets[0].emit('evo:createCreature', { cardId: 'c1' });

    // 驗證所有玩家收到更新
    for (const socket of sockets) {
      const state = await socket.waitForEvent('evo:gameState');
      expect(state.players[0].creatures.length).toBe(1);
    }
  });

  test('should maintain turn order', async () => {
    // 驗證回合順序正確
  });
});
```

#### 3. 性狀組合測試

```javascript
describe('Trait Combinations', () => {
  test('carnivore + sharp vision vs camouflage', () => {
    const attacker = createCreatureWithTraits(['carnivore', 'sharpVision']);
    const defender = createCreatureWithTraits(['camouflage']);

    const result = canBeAttacked(attacker, defender);
    expect(result.canAttack).toBe(true);
  });

  test('aquatic carnivore vs non-aquatic', () => {
    const attacker = createCreatureWithTraits(['carnivore', 'aquatic']);
    const defender = createCreatureWithTraits([]);

    const result = canBeAttacked(attacker, defender);
    expect(result.canAttack).toBe(false);
  });

  test('poisonous triggers delayed death', () => {
    // 設置毒液防守者
    // 執行攻擊
    // 驗證攻擊者在滅絕階段死亡
  });

  test('tail loss cancels attack', () => {
    // 設置斷尾防守者
    // 執行攻擊
    // 使用斷尾
    // 驗證攻擊取消
  });
});
```

#### 4. 邊界案例測試

```javascript
describe('Edge Cases', () => {
  test('last round restrictions', () => {
    const gameState = createLastRoundState();

    // 冬眠不能使用
    const result = useHibernation(gameState, 'c1');
    expect(result.success).toBe(false);
  });

  test('empty deck triggers last round', () => {
    const gameState = createNearEndState();

    // 抽牌導致牌庫空
    const newState = drawPhase(gameState);
    expect(newState.isLastRound).toBe(true);
  });

  test('all creatures extinct ends game for player', () => {
    // 所有生物滅絕但玩家還在遊戲中
  });

  test('score tie breaker', () => {
    // 測試平手判定
  });
});
```

### 效能測試

```javascript
describe('Performance', () => {
  test('game state update < 100ms', () => {
    const gameState = createComplexGameState();
    const start = Date.now();

    processAction(gameState, 'p1', { type: 'feed', creatureId: 'c1' });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test('chain effect calculation < 200ms', () => {
    // 複雜連鎖效應的效能測試
  });
});
```

### 前置條件
- 工單 0267 已完成（單元測試）
- 工單 0268 已完成（組件測試）

### 驗收標準
- [ ] 完整遊戲流程可通過
- [ ] 多人同步正確
- [ ] 所有性狀組合正確
- [ ] 邊界案例處理正確
- [ ] 效能符合要求

### 相關檔案
- `backend/logic/evolution/__tests__/integration.test.js` — 新建
- `backend/__tests__/evolutionE2E.test.js` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第七章
