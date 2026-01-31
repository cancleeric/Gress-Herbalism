# 工作單 0241

## 編號
0241

## 日期
2026-01-31

## 工作單標題
實作【巨化】性狀

## 工單主旨
實作「巨化 Massive」性狀的完整邏輯，增加食量並限制被攻擊條件

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 巨化 |
| 英文代碼 | massive |
| 類別 | 防禦相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | +1 |

### 性狀規則

1. **食量增加**：擁有巨化性狀的生物食量 +1
2. **防禦效果**：只有同樣擁有巨化的肉食生物才能攻擊
3. **攻擊優勢**：擁有巨化的肉食可以攻擊沒有巨化的生物

### 攻擊規則矩陣

| 攻擊者 \ 防守者 | 巨化 | 非巨化 |
|----------------|------|--------|
| 巨化肉食 | ✓ 可攻擊 | ✓ 可攻擊 |
| 非巨化肉食 | ✗ 不可攻擊 | ✓ 可攻擊 |

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.MASSIVE: 'massive'
```

#### 2. 食量計算
在 `backend/logic/evolution/creatureLogic.js` 的 `calculateFoodNeed` 整合：

```javascript
function calculateFoodNeed(creature) {
  let foodNeed = 1;  // 基礎食量

  if (hasTrait(creature, TRAIT_TYPES.CARNIVORE)) {
    foodNeed += 1;
  }

  if (hasTrait(creature, TRAIT_TYPES.MASSIVE)) {
    foodNeed += 1;
  }

  // 寄生蟲...

  return foodNeed;
}
```

#### 3. 攻擊判定邏輯
在 `canBeAttacked` 中添加巨化檢查：

```javascript
function canBeAttacked(attacker, defender) {
  // ... 前置檢查 ...

  // 巨化限制
  if (hasTrait(defender, TRAIT_TYPES.MASSIVE)) {
    if (!hasTrait(attacker, TRAIT_TYPES.MASSIVE)) {
      return {
        canAttack: false,
        reason: '目標有巨化性狀，攻擊者也需要巨化'
      };
    }
  }

  // ... 繼續其他檢查 ...
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0241-01 | 巨化生物食量計算 | 基礎 1 + 巨化 1 = 2 |
| TC-0241-02 | 肉食+巨化食量計算 | 1 + 1 + 1 = 3 |
| TC-0241-03 | 巨化肉食攻擊巨化生物 | 攻擊成功（若無其他防禦） |
| TC-0241-04 | 巨化肉食攻擊非巨化生物 | 攻擊成功 |
| TC-0241-05 | 非巨化肉食攻擊巨化生物 | 攻擊失敗 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0233 已完成（肉食性狀）

### 驗收標準
- [ ] 巨化性狀可正確添加到生物
- [ ] 食量正確計算為 +1
- [ ] 攻擊限制正確實作
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
