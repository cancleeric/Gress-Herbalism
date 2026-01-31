# 工作單 0242

## 編號
0242

## 日期
2026-01-31

## 工作單標題
實作【斷尾】性狀

## 工單主旨
實作「斷尾 Tail Loss」性狀的完整邏輯，被攻擊時可棄置性狀來取消攻擊

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 斷尾 |
| 英文代碼 | tailLoss |
| 類別 | 防禦相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **觸發時機**：被肉食攻擊且即將被吃掉時
2. **使用方式**：選擇棄置自己的一張性狀卡（包含斷尾本身）
3. **效果**：
   - 攻擊被取消
   - 攻擊者獲得 1 個藍色食物（作為補償）
   - 被棄置的性狀卡移至棄牌堆
4. **可選性**：玩家可以選擇不使用斷尾（例如不想失去重要性狀）
5. **消耗性**：若棄置斷尾本身，則只能使用一次

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.TAIL_LOSS: 'tailLoss'
```

#### 2. 斷尾響應邏輯
在 `backend/logic/evolution/traitLogic.js` 實作：

```javascript
/**
 * 使用斷尾能力
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} creatureId - 使用斷尾的生物
 * @param {string} traitIdToDiscard - 要棄置的性狀 ID
 * @returns {{ success: boolean, gameState: GameState }}
 */
function useTailLoss(gameState, creatureId, traitIdToDiscard) {
  // 1. 移除指定性狀
  // 2. 性狀卡移至棄牌堆
  // 3. 返回更新後的狀態
}
```

#### 3. 攻擊流程整合
在攻擊流程中添加斷尾響應：

```javascript
function attackCreature(gameState, attackerId, defenderId) {
  // 通過所有防禦檢查後...

  // 檢查斷尾（敏捷之後）
  if (hasTrait(defender, TRAIT_TYPES.TAIL_LOSS)) {
    // 返回待處理狀態，等待玩家選擇
    return {
      success: true,
      gameState,
      pendingResponse: {
        type: 'tailLossChoice',
        attackerId,
        defenderId,
        availableTraits: defender.traits
      }
    };
  }
}
```

#### 4. 攻擊者補償
斷尾成功時攻擊者獲得 1 藍色食物：

```javascript
function resolveTailLoss(gameState, attackerId, defenderId, useTailLoss, traitIdToDiscard) {
  if (useTailLoss) {
    // 棄置性狀
    gameState = removeTrait(gameState, defenderId, traitIdToDiscard);
    // 攻擊者獲得 1 藍色食物
    gameState = addFood(gameState, attackerId, 'blue', 1);
    return { attackCancelled: true, gameState };
  }
  return { attackCancelled: false, gameState };
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0242-01 | 使用斷尾棄置其他性狀 | 攻擊取消，攻擊者獲得 1 藍色食物 |
| TC-0242-02 | 使用斷尾棄置斷尾本身 | 攻擊取消，斷尾消失 |
| TC-0242-03 | 選擇不使用斷尾 | 攻擊正常進行 |
| TC-0242-04 | 斷尾後觸發合作 | 攻擊者獲得藍色食物觸發合作連鎖 |
| TC-0242-05 | 只有斷尾一個性狀 | 必須棄置斷尾或不使用 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0233 已完成（肉食性狀）

### 驗收標準
- [ ] 斷尾性狀可正確添加到生物
- [ ] 被攻擊時可選擇使用斷尾
- [ ] 棄置性狀正確移除
- [ ] 攻擊者正確獲得補償
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
