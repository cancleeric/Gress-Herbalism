# 工作單 0243

## 編號
0243

## 日期
2026-01-31

## 工作單標題
實作【擬態】性狀

## 工單主旨
實作「擬態 Mimicry」性狀的完整邏輯，被攻擊時可將攻擊轉移給另一隻生物

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 擬態 |
| 英文代碼 | mimicry |
| 類別 | 防禦相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **使用限制**：每回合只能使用一次
2. **觸發時機**：被肉食攻擊時
3. **轉移條件**：
   - 目標必須是自己的另一隻生物
   - 目標必須「一定可以被獵食」（通過所有攻擊判定）
4. **效果**：攻擊轉移到指定的生物
5. **連鎖**：被轉移的目標若也有擬態，不能再次轉移

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.MIMICRY: 'mimicry'
```

#### 2. 擬態狀態追蹤
在生物結構中追蹤使用狀態：
```javascript
const creature = {
  // ... 其他屬性 ...
  mimicryUsedThisTurn: false
};
```

#### 3. 擬態邏輯
在 `backend/logic/evolution/traitLogic.js` 實作：

```javascript
/**
 * 使用擬態能力
 * @param {GameState} gameState
 * @param {string} mimicryCreatureId - 使用擬態的生物
 * @param {string} attackerId - 攻擊者
 * @param {string} newTargetId - 轉移目標
 * @returns {{ success: boolean, gameState: GameState, reason: string }}
 */
function useMimicry(gameState, mimicryCreatureId, attackerId, newTargetId) {
  const mimicryCreature = getCreature(gameState, mimicryCreatureId);

  // 檢查是否已使用
  if (mimicryCreature.mimicryUsedThisTurn) {
    return { success: false, reason: '本回合已使用過擬態' };
  }

  // 檢查新目標是否為自己的生物
  // 檢查新目標是否可被攻擊

  // 標記已使用
  mimicryCreature.mimicryUsedThisTurn = true;

  return { success: true, newTargetId };
}

/**
 * 取得可轉移的目標列表
 */
function getMimicryTargets(gameState, attackerId, mimicryCreatureId) {
  // 返回同玩家的其他可被攻擊生物
}
```

#### 4. 回合重置
在回合開始時重置擬態使用狀態：
```javascript
function resetTurnStates(gameState) {
  // 重置所有生物的 mimicryUsedThisTurn
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0243-01 | 使用擬態轉移攻擊 | 攻擊轉移到新目標 |
| TC-0243-02 | 同回合第二次使用擬態 | 無法使用 |
| TC-0243-03 | 轉移給有偽裝的生物（攻擊者無銳目）| 無法轉移 |
| TC-0243-04 | 轉移給已吃飽的穴居生物 | 無法轉移 |
| TC-0243-05 | 只有一隻生物時 | 無法使用擬態 |
| TC-0243-06 | 新回合重置擬態 | 可再次使用 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0233 已完成（肉食性狀）
- 工單 0236-0241 已完成（其他防禦性狀）

### 驗收標準
- [ ] 擬態性狀可正確添加到生物
- [ ] 每回合只能使用一次
- [ ] 只能轉移給可被攻擊的自己生物
- [ ] 攻擊正確轉移
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `backend/logic/evolution/phaseLogic.js` — 修改（回合重置）
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
