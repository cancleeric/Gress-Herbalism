# 工作單 0233

## 編號
0233

## 日期
2026-01-31

## 工作單標題
實作【肉食】性狀

## 工單主旨
實作「肉食 Carnivore」性狀的完整邏輯，包含食量增加、禁止吃現有食物、攻擊機制

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 肉食 |
| 英文代碼 | carnivore |
| 類別 | 肉食相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | +1 |

### 性狀規則

1. **食量影響**：擁有肉食性狀的生物食量 +1
2. **進食限制**：不能從食物池取得紅色食物
3. **攻擊能力**：可攻擊其他生物（包含自己的其他生物）
4. **攻擊成功**：獲得 2 個藍色食物，被攻擊生物滅絕
5. **互斥性狀**：不能與「腐食」同時擁有

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.CARNIVORE: 'carnivore'
```

#### 2. 性狀效果邏輯
在 `backend/logic/evolution/traitLogic.js` 實作：

```javascript
/**
 * 判定生物是否為肉食動物
 * @param {Creature} creature
 * @returns {boolean}
 */
function isCarnivore(creature) { }

/**
 * 執行肉食攻擊
 * @param {GameState} gameState
 * @param {string} attackerId
 * @param {string} defenderId
 * @returns {AttackResult}
 */
function performCarnivoreAttack(gameState, attackerId, defenderId) { }
```

#### 3. 進食限制
在 `feedingLogic.js` 整合：
- 肉食生物呼叫 `feedCreature` 時應返回錯誤
- 肉食生物只能透過 `attackCreature` 獲得食物

#### 4. 食量計算
在 `creatureLogic.js` 的 `calculateFoodNeed` 整合：
- 有肉食性狀時 +1

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0233-01 | 肉食生物食量計算 | 基礎 1 + 肉食 1 = 2 |
| TC-0233-02 | 肉食生物嘗試吃紅色食物 | 返回錯誤 |
| TC-0233-03 | 肉食攻擊無防禦生物 | 攻擊成功，獲得 2 藍色食物 |
| TC-0233-04 | 肉食與腐食互斥 | 無法同時添加 |
| TC-0233-05 | 肉食攻擊自己的生物 | 允許，攻擊成功 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 肉食性狀可正確添加到生物
- [ ] 食量正確計算為 +1
- [ ] 肉食生物無法從食物池進食
- [ ] 攻擊機制正確運作
- [ ] 與腐食的互斥正確
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
