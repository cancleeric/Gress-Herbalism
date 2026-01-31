# 工作單 0247

## 編號
0247

## 日期
2026-01-31

## 工作單標題
實作【掠奪】性狀

## 工單主旨
實作「掠奪 Robbery」性狀的完整邏輯，可偷取其他未吃飽生物身上的食物

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 掠奪 |
| 英文代碼 | robbery |
| 類別 | 進食相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **使用時機**：進食階段輪到時可選擇使用
2. **使用限制**：每個進食階段只能使用一次
3. **目標條件**：
   - 任何玩家的生物（包含自己的）
   - 目標必須未吃飽（身上有食物但未滿足食量）
4. **效果**：偷取目標生物身上的 1 個食物（紅或藍）
5. **視為進食**：偷取成功視為一次進食動作

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.ROBBERY: 'robbery'
```

#### 2. 掠奪狀態追蹤
```javascript
const creature = {
  // ... 其他屬性 ...
  robberyUsedThisPhase: false
};
```

#### 3. 掠奪邏輯
在 `backend/logic/evolution/traitLogic.js` 實作：

```javascript
/**
 * 使用掠奪能力
 * @param {GameState} gameState
 * @param {string} robberCreatureId - 使用掠奪的生物
 * @param {string} targetCreatureId - 被偷取的生物
 * @returns {{ success: boolean, gameState: GameState, reason: string }}
 */
function useRobbery(gameState, robberCreatureId, targetCreatureId) {
  const robber = getCreature(gameState, robberCreatureId);
  const target = getCreature(gameState, targetCreatureId);

  // 檢查是否已使用
  if (robber.robberyUsedThisPhase) {
    return { success: false, reason: '本階段已使用過掠奪' };
  }

  // 檢查目標是否有食物可偷
  const targetFood = target.food.red + target.food.blue;
  if (targetFood === 0) {
    return { success: false, reason: '目標沒有食物可偷' };
  }

  // 檢查目標是否未吃飽
  if (target.isFed) {
    return { success: false, reason: '目標已吃飽，無法偷取' };
  }

  // 偷取食物（優先偷取藍色）
  if (target.food.blue > 0) {
    target.food.blue -= 1;
    robber.food.blue += 1;
  } else {
    target.food.red -= 1;
    robber.food.red += 1;
  }

  robber.robberyUsedThisPhase = true;

  return { success: true, gameState };
}

/**
 * 取得可掠奪的目標列表
 */
function getRobberyTargets(gameState, robberCreatureId) {
  // 返回所有未吃飽且有食物的生物（排除自己）
}
```

#### 4. 階段重置
在進食階段開始時重置：
```javascript
function startFeedingPhase(gameState) {
  gameState.players.forEach(player => {
    player.creatures.forEach(creature => {
      creature.robberyUsedThisPhase = false;
    });
  });
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0247-01 | 偷取對手生物食物 | 偷取成功，食物轉移 |
| TC-0247-02 | 偷取自己其他生物食物 | 允許 |
| TC-0247-03 | 偷取已吃飽生物 | 無法偷取 |
| TC-0247-04 | 偷取無食物生物 | 無法偷取 |
| TC-0247-05 | 同階段第二次使用 | 無法使用 |
| TC-0247-06 | 偷取觸發合作連鎖 | 掠奪者獲得食物觸發合作 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 掠奪性狀可正確添加到生物
- [ ] 每階段只能使用一次
- [ ] 只能偷取未吃飽生物
- [ ] 食物正確轉移
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `backend/logic/evolution/phaseLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
