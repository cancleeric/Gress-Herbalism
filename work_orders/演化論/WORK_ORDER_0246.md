# 工作單 0246

## 編號
0246

## 日期
2026-01-31

## 工作單標題
實作【寄生蟲】性狀

## 工單主旨
實作「寄生蟲 Parasite」性狀的完整邏輯，只能放在對手生物上增加其食量需求

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 寄生蟲 |
| 英文代碼 | parasite |
| 類別 | 進食相關 |
| 卡牌數量 | 8 張 |
| 食量加成 | +2 |

### 性狀規則

1. **放置限制**：只能放在對手的生物上，不能放在自己的生物上
2. **效果**：目標生物食量需求 +2
3. **可疊加**：同一生物可以有多個寄生蟲
4. **負面性狀**：是遊戲中唯一可以主動傷害對手的性狀
5. **策略價值**：增加對手生物的生存壓力

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.PARASITE: 'parasite'
```

#### 2. 放置驗證邏輯
在 `backend/logic/evolution/cardLogic.js` 修改 `validateTraitPlacement`：

```javascript
function validateTraitPlacement(playerId, creature, traitType, targetCreature) {
  // 寄生蟲特殊規則
  if (traitType === TRAIT_TYPES.PARASITE) {
    // 必須放在對手生物上
    if (creature.ownerId === playerId) {
      return {
        valid: false,
        reason: '寄生蟲只能放在對手的生物上'
      };
    }
    // 可疊加，不需要檢查重複
    return { valid: true };
  }

  // 其他性狀的驗證邏輯...
}
```

#### 3. 食量計算整合
在 `backend/logic/evolution/creatureLogic.js` 的 `calculateFoodNeed`：

```javascript
function calculateFoodNeed(creature) {
  let foodNeed = 1;  // 基礎食量

  // 肉食 +1
  if (hasTrait(creature, TRAIT_TYPES.CARNIVORE)) {
    foodNeed += 1;
  }

  // 巨化 +1
  if (hasTrait(creature, TRAIT_TYPES.MASSIVE)) {
    foodNeed += 1;
  }

  // 寄生蟲 +2（可疊加）
  const parasiteCount = creature.traits.filter(
    t => t.type === TRAIT_TYPES.PARASITE
  ).length;
  foodNeed += parasiteCount * 2;

  return foodNeed;
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0246-01 | 放置寄生蟲到對手生物 | 放置成功 |
| TC-0246-02 | 嘗試放置寄生蟲到自己生物 | 放置失敗 |
| TC-0246-03 | 寄生蟲食量計算 | 食量 +2 |
| TC-0246-04 | 多個寄生蟲疊加 | 每個 +2 |
| TC-0246-05 | 寄生蟲 + 肉食 + 巨化 | 1 + 1 + 1 + 2 = 5 |
| TC-0246-06 | 對手需餵飽寄生蟲生物 | 需滿足增加的食量 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 寄生蟲只能放在對手生物上
- [ ] 食量正確增加 +2
- [ ] 寄生蟲可疊加
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/cardLogic.js` — 修改
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
