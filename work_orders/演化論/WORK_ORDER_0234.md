# 工作單 0234

## 編號
0234

## 日期
2026-01-31

## 工作單標題
實作【腐食】性狀

## 工單主旨
實作「腐食 Scavenger」性狀的完整邏輯，當任何生物被肉食攻擊滅絕時獲得食物

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 腐食 |
| 英文代碼 | scavenger |
| 類別 | 肉食相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **觸發時機**：當場上任何生物被肉食攻擊滅絕時觸發
2. **效果**：擁有腐食性狀的生物獲得 1 個藍色食物
3. **觸發範圍**：所有玩家的腐食生物都會觸發（包含攻擊者自己的）
4. **互斥性狀**：不能與「肉食」同時擁有
5. **疊加**：若有多隻腐食生物，每隻都獲得 1 個藍色食物

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.SCAVENGER: 'scavenger'
```

#### 2. 腐食觸發邏輯
在 `backend/logic/evolution/feedingLogic.js` 實作：

```javascript
/**
 * 觸發腐食效果
 * @param {GameState} gameState - 遊戲狀態
 * @param {string} deadCreatureId - 被殺死的生物 ID
 * @returns {{ gameState: GameState, scavengersFed: string[] }}
 */
function triggerScavenger(gameState, deadCreatureId) {
  // 找出所有有腐食性狀的生物
  // 每隻獲得 1 個藍色食物
  // 返回被觸發的生物列表
}
```

#### 3. 攻擊結算整合
在 `resolveAttack` 中呼叫 `triggerScavenger`：
- 攻擊成功且防守者滅絕時觸發
- 觸發後繼續處理合作連鎖（如有）

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0234-01 | 單隻腐食生物觸發 | 獲得 1 藍色食物 |
| TC-0234-02 | 多隻腐食生物觸發 | 每隻都獲得 1 藍色食物 |
| TC-0234-03 | 腐食與肉食互斥 | 無法同時添加 |
| TC-0234-04 | 腐食生物已吃飽仍觸發 | 獲得食物（存入脂肪或無效） |
| TC-0234-05 | 無腐食生物時不觸發 | 無任何效果 |
| TC-0234-06 | 腐食觸發合作連鎖 | 若有合作，連結生物也獲得藍色食物 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0233 已完成（肉食性狀）

### 驗收標準
- [ ] 腐食性狀可正確添加到生物
- [ ] 與肉食的互斥正確
- [ ] 任何生物被肉食攻擊滅絕時正確觸發
- [ ] 多隻腐食生物時每隻都觸發
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
