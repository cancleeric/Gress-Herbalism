# 工作單 0238

## 編號
0238

## 日期
2026-01-31

## 工作單標題
實作【毒液】性狀

## 工單主旨
實作「毒液 Poisonous」性狀的完整邏輯，使攻擊者在滅絕階段死亡

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 毒液 |
| 英文代碼 | poisonous |
| 類別 | 防禦相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **觸發時機**：當此生物被肉食攻擊滅絕時觸發
2. **效果**：攻擊者標記為「中毒」，將在滅絕階段死亡
3. **延遲死亡**：攻擊者不會立即死亡，而是在本回合滅絕階段才滅絕
4. **攻擊者仍獲得食物**：攻擊成功，獲得 2 藍色食物
5. **威懾效果**：高風險高報酬的攻擊目標

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.POISONOUS: 'poisonous'
```

#### 2. 生物狀態擴展
在生物資料結構中添加中毒標記：
```javascript
const creature = {
  // ... 其他屬性 ...
  isPoisoned: false  // 中毒標記
};
```

#### 3. 攻擊結算邏輯
在 `backend/logic/evolution/feedingLogic.js` 修改 `resolveAttack`：

```javascript
function resolveAttack(gameState, attackResult) {
  // 攻擊成功處理...

  // 檢查毒液
  const defender = getCreature(gameState, attackResult.defenderId);
  if (hasTrait(defender, TRAIT_TYPES.POISONOUS)) {
    const attacker = getCreature(gameState, attackResult.attackerId);
    attacker.isPoisoned = true;
    // 記錄日誌：攻擊者中毒
  }

  // 攻擊者仍獲得食物
  // ...
}
```

#### 4. 滅絕階段處理
在 `backend/logic/evolution/phaseLogic.js` 的 `startExtinctionPhase` 中：

```javascript
function startExtinctionPhase(gameState) {
  // 處理中毒生物滅絕
  gameState.players.forEach(player => {
    player.creatures = player.creatures.filter(creature => {
      if (creature.isPoisoned) {
        // 記錄日誌：因中毒滅絕
        return false;
      }
      // ... 其他滅絕判定 ...
    });
  });
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0238-01 | 肉食攻擊毒液生物 | 攻擊成功，攻擊者標記中毒 |
| TC-0238-02 | 中毒生物在滅絕階段 | 生物滅絕 |
| TC-0238-03 | 中毒前攻擊者獲得食物 | 正常獲得 2 藍色食物 |
| TC-0238-04 | 毒液觸發腐食 | 毒液生物死亡觸發腐食 |
| TC-0238-05 | 中毒生物可繼續行動 | 在滅絕階段前仍可進食/攻擊 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0233 已完成（肉食性狀）

### 驗收標準
- [ ] 毒液性狀可正確添加到生物
- [ ] 攻擊毒液生物時攻擊者正確標記中毒
- [ ] 中毒生物在滅絕階段正確死亡
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/feedingLogic.js` — 修改
- `backend/logic/evolution/phaseLogic.js` — 修改
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
