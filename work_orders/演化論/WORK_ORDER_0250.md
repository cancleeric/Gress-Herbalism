# 工作單 0250

## 編號
0250

## 日期
2026-01-31

## 工作單標題
實作【共生】性狀

## 工單主旨
實作「共生 Symbiosis」性狀的完整邏輯，建立代表與被保護者的關係，提供進食限制與攻擊保護

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 共生 |
| 英文代碼 | symbiosis |
| 類別 | 互動相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **互動性狀**：連結同一玩家的兩隻相鄰生物
2. **角色指定**：放置時指定「代表」與「被保護者」
3. **進食限制**：代表吃飽前，被保護者不能獲得食物
4. **攻擊保護**：肉食生物只能攻擊代表，不能攻擊被保護者
5. **連結斷裂**：若代表滅絕，共生連結消失，被保護者失去保護

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.SYMBIOSIS: 'symbiosis'
```

#### 2. 共生連結資料結構
```javascript
const symbiosisLink = {
  type: 'symbiosis',
  representativeId: 'creature_1',  // 代表
  protectedId: 'creature_2',       // 被保護者
  traitCardId: 'card_25'
};
```

#### 3. 共生放置邏輯
```javascript
/**
 * 建立共生連結
 * @param {GameState} gameState
 * @param {string} representativeId - 代表生物
 * @param {string} protectedId - 被保護者
 * @param {string} cardId - 卡牌 ID
 */
function createSymbiosisLink(gameState, representativeId, protectedId, cardId) {
  const link = {
    type: 'symbiosis',
    representativeId,
    protectedId,
    traitCardId: cardId
  };
  gameState.symbiosisLinks.push(link);
  return gameState;
}
```

#### 4. 進食限制邏輯
在 `feedingLogic.js` 的 `checkSymbiosis` 實作：

```javascript
/**
 * 檢查共生限制
 * @param {GameState} gameState
 * @param {string} creatureId - 想進食的生物
 * @returns {{ canFeed: boolean, reason: string }}
 */
function checkSymbiosis(gameState, creatureId) {
  // 檢查此生物是否為被保護者
  const link = gameState.symbiosisLinks.find(l => l.protectedId === creatureId);

  if (link) {
    const representative = getCreature(gameState, link.representativeId);
    if (!representative.isFed) {
      return {
        canFeed: false,
        reason: '共生代表尚未吃飽，被保護者無法進食'
      };
    }
  }

  return { canFeed: true };
}
```

#### 5. 攻擊保護邏輯
在 `creatureLogic.js` 的 `canBeAttacked` 中：

```javascript
function canBeAttacked(attacker, defender, gameState) {
  // 檢查被保護者
  const link = gameState.symbiosisLinks.find(l => l.protectedId === defender.id);
  if (link) {
    const representative = getCreature(gameState, link.representativeId);
    if (representative) {  // 代表還活著
      return {
        canAttack: false,
        reason: '此生物受共生保護，只能攻擊其代表'
      };
    }
  }

  // ... 其他檢查 ...
}
```

#### 6. 連結清理
在滅絕階段清理斷裂的連結：
```javascript
function cleanupSymbiosisLinks(gameState) {
  gameState.symbiosisLinks = gameState.symbiosisLinks.filter(link => {
    const rep = getCreature(gameState, link.representativeId);
    const prot = getCreature(gameState, link.protectedId);
    return rep && prot;  // 兩者都存活才保留
  });
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0250-01 | 代表未吃飽時被保護者進食 | 無法進食 |
| TC-0250-02 | 代表吃飽後被保護者進食 | 可以進食 |
| TC-0250-03 | 攻擊被保護者 | 攻擊失敗 |
| TC-0250-04 | 攻擊代表 | 攻擊成功（若無其他防禦） |
| TC-0250-05 | 代表滅絕後攻擊原被保護者 | 攻擊成功 |
| TC-0250-06 | 代表滅絕後被保護者進食 | 可以進食 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 共生可正確連結兩隻生物
- [ ] 代表與被保護者角色正確
- [ ] 進食限制正確實作
- [ ] 攻擊保護正確實作
- [ ] 連結斷裂處理正確
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `backend/logic/evolution/creatureLogic.js` — 修改
- `backend/logic/evolution/phaseLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
