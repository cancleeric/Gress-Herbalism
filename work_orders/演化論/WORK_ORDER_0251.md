# 工作單 0251

## 編號
0251

## 日期
2026-01-31

## 工作單標題
實作【踐踏】性狀

## 工單主旨
實作「踐踏 Trampling」性狀的完整邏輯，可在進食階段移除食物池中的食物

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 踐踏 |
| 英文代碼 | trampling |
| 類別 | 特殊能力 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **使用時機**：進食階段輪到自己時可選擇使用
2. **效果**：將食物池中的 1 個紅色食物移除遊戲
3. **策略價值**：減少食物供應，威脅其他玩家生物
4. **使用限制**：每回合可使用多次（輪到就可以用）
5. **視為動作**：使用踐踏視為一次進食動作

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.TRAMPLING: 'trampling'
```

#### 2. 踐踏邏輯
在 `backend/logic/evolution/traitLogic.js` 實作：

```javascript
/**
 * 使用踐踏能力
 * @param {GameState} gameState
 * @param {string} creatureId - 使用踐踏的生物
 * @returns {{ success: boolean, gameState: GameState, reason: string }}
 */
function useTrampling(gameState, creatureId) {
  const creature = getCreature(gameState, creatureId);

  // 檢查是否有踐踏性狀
  if (!hasTrait(creature, TRAIT_TYPES.TRAMPLING)) {
    return { success: false, reason: '生物沒有踐踏性狀' };
  }

  // 檢查食物池是否有紅色食物
  if (gameState.foodPool.red <= 0) {
    return { success: false, reason: '食物池沒有紅色食物可移除' };
  }

  // 移除食物（不是獲得，是移除遊戲）
  gameState.foodPool.red -= 1;

  return {
    success: true,
    gameState,
    log: `${creature.id} 使用踐踏移除了 1 個紅色食物`
  };
}

/**
 * 檢查踐踏是否可用
 */
function canUseTrampling(gameState, creatureId) {
  const creature = getCreature(gameState, creatureId);
  return hasTrait(creature, TRAIT_TYPES.TRAMPLING) && gameState.foodPool.red > 0;
}
```

#### 3. 進食選項整合
在進食階段的可用動作中加入踐踏：

```javascript
function getAvailableFeedingActions(gameState, playerId) {
  const actions = [];
  const player = getPlayer(gameState, playerId);

  for (const creature of player.creatures) {
    // 一般進食選項...

    // 踐踏選項
    if (canUseTrampling(gameState, creature.id)) {
      actions.push({
        type: ACTION_TYPES.USE_TRAIT,
        creatureId: creature.id,
        traitType: TRAIT_TYPES.TRAMPLING
      });
    }
  }

  return actions;
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0251-01 | 使用踐踏移除食物 | 食物池 -1 |
| TC-0251-02 | 食物池為空時使用 | 無法使用 |
| TC-0251-03 | 無踐踏性狀時使用 | 無法使用 |
| TC-0251-04 | 多次使用踐踏 | 輪到時都可以使用 |
| TC-0251-05 | 踐踏後食物不可回收 | 食物離開遊戲 |
| TC-0251-06 | 踐踏視為進食動作 | 使用後輪到下一位玩家 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 踐踏性狀可正確添加到生物
- [ ] 正確移除食物池中的食物
- [ ] 使用限制正確
- [ ] 視為進食動作
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
