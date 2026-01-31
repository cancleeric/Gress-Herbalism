# 工作單 0244

## 編號
0244

## 日期
2026-01-31

## 工作單標題
實作【脂肪組織】性狀

## 工單主旨
實作「脂肪組織 Fat Tissue」性狀的完整邏輯，允許生物儲存額外食物作為脂肪

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 脂肪組織 |
| 英文代碼 | fatTissue |
| 類別 | 進食相關 |
| 卡牌數量 | 8 張 |
| 食量加成 | 無 |

### 性狀規則

1. **可疊加**：同一生物可以有多張脂肪組織
2. **儲存機制**：
   - 吃飽後可繼續獲得食物
   - 額外食物以「黃色脂肪標記」儲存
   - 每張脂肪組織最多儲存 1 個黃色食物
3. **消耗機制**：
   - 在進食階段可以消耗黃色食物來滿足食量需求
   - 消耗脂肪視為吃到食物
4. **跨回合**：脂肪會保留到下一回合

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.FAT_TISSUE: 'fatTissue'
FOOD_TYPES.YELLOW: 'yellow'  // 脂肪
```

#### 2. 脂肪儲存邏輯
在 `backend/logic/evolution/traitLogic.js` 實作：

```javascript
/**
 * 計算脂肪儲存上限
 * @param {Creature} creature
 * @returns {number} 脂肪上限（脂肪組織數量）
 */
function getFatCapacity(creature) {
  return creature.traits.filter(t => t.type === TRAIT_TYPES.FAT_TISSUE).length;
}

/**
 * 儲存脂肪
 * @param {GameState} gameState
 * @param {string} creatureId
 * @param {number} amount
 * @returns {{ success: boolean, stored: number, gameState: GameState }}
 */
function storeFat(gameState, creatureId, amount) {
  const creature = getCreature(gameState, creatureId);
  const capacity = getFatCapacity(creature);
  const currentFat = creature.food.yellow;
  const canStore = Math.min(amount, capacity - currentFat);
  creature.food.yellow += canStore;
  return { success: true, stored: canStore, gameState };
}

/**
 * 消耗脂肪滿足食量
 * @param {GameState} gameState
 * @param {string} creatureId
 * @param {number} amount
 * @returns {{ success: boolean, consumed: number, gameState: GameState }}
 */
function useFat(gameState, creatureId, amount) {
  const creature = getCreature(gameState, creatureId);
  const available = creature.food.yellow;
  const consumed = Math.min(amount, available);
  creature.food.yellow -= consumed;
  creature.food.red += consumed;  // 轉換為有效食物
  return { success: true, consumed, gameState };
}
```

#### 3. 進食流程整合
在 `feedingLogic.js` 修改 `feedCreature`：

```javascript
function feedCreature(gameState, creatureId, foodType) {
  const creature = getCreature(gameState, creatureId);

  // 如果已吃飽且有脂肪組織
  if (creature.isFed && hasTrait(creature, TRAIT_TYPES.FAT_TISSUE)) {
    // 嘗試儲存為脂肪
    return storeFat(gameState, creatureId, 1);
  }

  // 正常進食流程...
}
```

#### 4. 滅絕階段處理
脂肪在滅絕階段不會被清除（跨回合保留）

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0244-01 | 吃飽後儲存脂肪 | 黃色食物 +1 |
| TC-0244-02 | 多張脂肪組織疊加 | 上限 = 脂肪組織數量 |
| TC-0244-03 | 脂肪已滿時繼續進食 | 無法儲存 |
| TC-0244-04 | 消耗脂肪滿足食量 | 脂肪 -1，有效食物 +1 |
| TC-0244-05 | 脂肪跨回合保留 | 下回合仍有脂肪 |
| TC-0244-06 | 無脂肪組織時無法儲存 | 吃飽後無法繼續進食 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 脂肪組織可疊加
- [ ] 脂肪儲存上限正確
- [ ] 吃飽後可繼續儲存脂肪
- [ ] 消耗脂肪功能正確
- [ ] 脂肪跨回合保留
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
