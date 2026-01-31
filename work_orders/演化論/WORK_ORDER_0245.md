# 工作單 0245

## 編號
0245

## 日期
2026-01-31

## 工作單標題
實作【冬眠】性狀

## 工單主旨
實作「冬眠 Hibernation」性狀的完整邏輯，允許生物跳過進食階段視為吃飽

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 冬眠 |
| 英文代碼 | hibernation |
| 類別 | 進食相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **使用時機**：進食階段輪到該生物時可選擇使用
2. **效果**：
   - 該生物視為吃飽（isFed = true）
   - 跳過本回合的進食
   - 性狀卡橫置表示已使用
3. **限制**：
   - 使用後到下回合結束前無法再次使用
   - **最後一回合不能使用冬眠**
4. **策略價值**：在食物不足時保護生物不滅絕

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.HIBERNATION: 'hibernation'
```

#### 2. 冬眠狀態追蹤
在生物結構中追蹤冬眠狀態：
```javascript
const creature = {
  // ... 其他屬性 ...
  hibernating: false,  // 是否正在冬眠
  hibernationUsed: false  // 本回合是否使用過冬眠
};
```

#### 3. 冬眠邏輯
在 `backend/logic/evolution/traitLogic.js` 實作：

```javascript
/**
 * 使用冬眠能力
 * @param {GameState} gameState
 * @param {string} creatureId
 * @returns {{ success: boolean, gameState: GameState, reason: string }}
 */
function useHibernation(gameState, creatureId) {
  // 檢查是否為最後一回合
  if (gameState.isLastRound) {
    return { success: false, reason: '最後一回合不能使用冬眠' };
  }

  const creature = getCreature(gameState, creatureId);

  // 檢查是否有冬眠性狀
  if (!hasTrait(creature, TRAIT_TYPES.HIBERNATION)) {
    return { success: false, reason: '生物沒有冬眠性狀' };
  }

  // 檢查冬眠是否可用
  if (creature.hibernating || creature.hibernationUsed) {
    return { success: false, reason: '冬眠能力不可用' };
  }

  // 進入冬眠
  creature.hibernating = true;
  creature.hibernationUsed = true;
  creature.isFed = true;

  return { success: true, gameState };
}

/**
 * 檢查冬眠是否可用
 */
function canUseHibernation(gameState, creatureId) {
  if (gameState.isLastRound) return false;
  const creature = getCreature(gameState, creatureId);
  return hasTrait(creature, TRAIT_TYPES.HIBERNATION) &&
         !creature.hibernating &&
         !creature.hibernationUsed;
}
```

#### 4. 回合重置
在演化階段開始時重置冬眠狀態：
```javascript
function startEvolutionPhase(gameState) {
  // 重置冬眠狀態
  gameState.players.forEach(player => {
    player.creatures.forEach(creature => {
      creature.hibernating = false;
      creature.hibernationUsed = false;
    });
  });
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0245-01 | 使用冬眠 | 生物視為吃飽 |
| TC-0245-02 | 冬眠中生物不需進食 | 滅絕階段不會滅絕 |
| TC-0245-03 | 最後一回合使用冬眠 | 無法使用 |
| TC-0245-04 | 同回合再次使用冬眠 | 無法使用 |
| TC-0245-05 | 新回合重置冬眠 | 可再次使用 |
| TC-0245-06 | 冬眠生物可被攻擊 | 冬眠不提供防禦 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 冬眠性狀可正確添加到生物
- [ ] 冬眠使生物視為吃飽
- [ ] 最後一回合限制正確
- [ ] 使用後到下回合重置
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `backend/logic/evolution/phaseLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
