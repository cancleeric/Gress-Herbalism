# 工作單 0249

## 編號
0249

## 日期
2026-01-31

## 工作單標題
實作【合作】性狀

## 工單主旨
實作「合作 Cooperation」性狀的完整邏輯，這是連結兩隻生物的互動性狀，進食時連結生物獲得額外藍色食物

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 合作 |
| 英文代碼 | cooperation |
| 類別 | 互動相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **互動性狀**：連結同一玩家的兩隻相鄰生物
2. **觸發條件**：當其中一隻生物獲得紅色或藍色食物時
3. **效果**：連結的另一隻生物獲得 1 個藍色食物（憑空產生）
4. **連鎖效應**：如果連結生物也有合作連結其他生物，會繼續觸發
5. **與溝通差異**：
   - 溝通：從食物池拿取（可能失敗）
   - 合作：憑空產生（一定成功）

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.COOPERATION: 'cooperation'
```

#### 2. 合作連鎖邏輯
在 `backend/logic/evolution/feedingLogic.js` 實作：

```javascript
/**
 * 處理合作連鎖
 * @param {GameState} gameState
 * @param {string} fedCreatureId - 獲得食物的生物
 * @param {string} foodType - 食物類型 ('red' 或 'blue')
 * @returns {{ gameState: GameState, chainedCreatures: string[], chainLog: string[] }}
 */
function processCooperation(gameState, fedCreatureId, foodType) {
  const chainedCreatures = [];
  const chainLog = [];
  const processedCreatures = new Set([fedCreatureId]);

  // BFS 處理連鎖
  const queue = [fedCreatureId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const links = getCreatureCooperationLinks(gameState, currentId);

    for (const link of links) {
      const linkedCreatureId = link.creature1Id === currentId
        ? link.creature2Id
        : link.creature1Id;

      if (processedCreatures.has(linkedCreatureId)) continue;

      const linkedCreature = getCreature(gameState, linkedCreatureId);

      // 獲得藍色食物（憑空產生）
      linkedCreature.food.blue += 1;
      chainedCreatures.push(linkedCreatureId);
      chainLog.push(`${linkedCreature.id} 透過合作獲得 1 藍色食物`);

      // 加入佇列繼續連鎖
      queue.push(linkedCreatureId);
      processedCreatures.add(linkedCreatureId);
    }
  }

  return { gameState, chainedCreatures, chainLog };
}
```

#### 3. 進食流程整合
修改 `feedCreature` 以觸發合作：

```javascript
function feedCreature(gameState, creatureId, foodType) {
  // 正常進食...

  // 觸發溝通（僅紅色）
  if (foodType === 'red') {
    const commResult = processCommunication(gameState, creatureId);
    // 溝通獲得的食物也要觸發合作
    for (const chainedId of commResult.chainedCreatures) {
      const coopResult = processCooperation(gameState, chainedId, 'red');
      // ...
    }
  }

  // 觸發合作
  const coopResult = processCooperation(gameState, creatureId, foodType);

  return { gameState, chainEffects: [...] };
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0249-01 | 獲得紅色食物觸發合作 | 連結生物獲得藍色食物 |
| TC-0249-02 | 獲得藍色食物觸發合作 | 連結生物獲得藍色食物 |
| TC-0249-03 | 三隻生物連鎖 | A→B→C 都獲得藍色食物 |
| TC-0249-04 | 環形連結 | 不會無限循環 |
| TC-0249-05 | 溝通觸發合作 | 溝通獲得食物後觸發合作 |
| TC-0249-06 | 合作連鎖觸發腐食後 | 腐食獲得藍色食物觸發合作 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0248 已完成（溝通性狀）

### 驗收標準
- [ ] 合作可正確連結兩隻生物
- [ ] 紅色或藍色食物都觸發
- [ ] 藍色食物憑空產生
- [ ] 連鎖效應正確處理
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
