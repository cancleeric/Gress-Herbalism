# 工作單 0248

## 編號
0248

## 日期
2026-01-31

## 工作單標題
實作【溝通】性狀

## 工單主旨
實作「溝通 Communication」性狀的完整邏輯，這是連結兩隻生物的互動性狀，進食時觸發連鎖效應

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 溝通 |
| 英文代碼 | communication |
| 類別 | 互動相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **互動性狀**：連結同一玩家的兩隻相鄰生物
2. **觸發條件**：當其中一隻生物從食物池拿取紅色食物時
3. **效果**：連結的另一隻生物也從中央食物池拿取 1 個紅色食物
4. **連鎖效應**：如果連結生物也有溝通連結其他生物，會繼續觸發
5. **限制**：
   - 只有拿取紅色食物才觸發
   - 藍色食物不觸發溝通
   - 食物池沒有紅色食物時不觸發

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.COMMUNICATION: 'communication'
```

#### 2. 互動連結資料結構
```javascript
const interactionLink = {
  type: 'communication',
  creature1Id: 'creature_1',
  creature2Id: 'creature_2',
  traitCardId: 'card_20'
};
```

#### 3. 放置驗證
在 `cardLogic.js` 添加互動性狀驗證：
```javascript
function validateInteractiveTrait(playerId, creature1, creature2, traitType) {
  // 必須是同一玩家的生物
  if (creature1.ownerId !== playerId || creature2.ownerId !== playerId) {
    return { valid: false, reason: '互動性狀必須放在自己的兩隻生物之間' };
  }

  // 必須是相鄰生物（在玩家區域中相鄰）
  // ... 相鄰判定邏輯 ...

  return { valid: true };
}
```

#### 4. 溝通連鎖邏輯
在 `backend/logic/evolution/feedingLogic.js` 實作：

```javascript
/**
 * 處理溝通連鎖
 * @param {GameState} gameState
 * @param {string} fedCreatureId - 被餵食的生物
 * @returns {{ gameState: GameState, chainedCreatures: string[], chainLog: string[] }}
 */
function processCommunication(gameState, fedCreatureId) {
  const chainedCreatures = [];
  const chainLog = [];
  const processedCreatures = new Set([fedCreatureId]);

  // BFS 處理連鎖
  const queue = [fedCreatureId];

  while (queue.length > 0 && gameState.foodPool.red > 0) {
    const currentId = queue.shift();
    const links = getCreatureCommunicationLinks(gameState, currentId);

    for (const link of links) {
      const linkedCreatureId = link.creature1Id === currentId
        ? link.creature2Id
        : link.creature1Id;

      if (processedCreatures.has(linkedCreatureId)) continue;

      const linkedCreature = getCreature(gameState, linkedCreatureId);

      // 從食物池取得紅色食物
      if (gameState.foodPool.red > 0) {
        gameState.foodPool.red -= 1;
        linkedCreature.food.red += 1;
        chainedCreatures.push(linkedCreatureId);
        chainLog.push(`${linkedCreature.id} 透過溝通獲得 1 紅色食物`);

        // 加入佇列繼續連鎖
        queue.push(linkedCreatureId);
        processedCreatures.add(linkedCreatureId);
      }
    }
  }

  return { gameState, chainedCreatures, chainLog };
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0248-01 | 簡單溝通連結觸發 | 連結生物獲得紅色食物 |
| TC-0248-02 | 三隻生物連鎖 | A→B→C 都獲得食物 |
| TC-0248-03 | 環形連結 | 不會無限循環 |
| TC-0248-04 | 食物池空了 | 連鎖中止 |
| TC-0248-05 | 獲得藍色食物 | 不觸發溝通 |
| TC-0248-06 | 溝通觸發合作 | 溝通獲得的紅色食物觸發合作 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 溝通可正確連結兩隻生物
- [ ] 拿取紅色食物正確觸發
- [ ] 連鎖效應正確處理
- [ ] 不會無限循環
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `backend/logic/evolution/cardLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
