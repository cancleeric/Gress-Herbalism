# 工作單 0240

## 編號
0240

## 日期
2026-01-31

## 工作單標題
實作【敏捷】性狀

## 工單主旨
實作「敏捷 Agile」性狀的完整邏輯，被攻擊時擲骰決定是否逃脫

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 敏捷 |
| 英文代碼 | agile |
| 類別 | 防禦相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **觸發時機**：被肉食攻擊且通過其他防禦檢查後觸發
2. **機制**：擲一顆六面骰
   - 擲出 4、5、6：逃脫成功，攻擊失敗
   - 擲出 1、2、3：逃脫失敗，攻擊成功
3. **成功率**：50% 逃脫機率
4. **每次攻擊觸發**：每次被攻擊都要重新擲骰

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.AGILE: 'agile'

const AGILE_ESCAPE_THRESHOLD = 4;  // 4-6 逃脫成功
```

#### 2. 敏捷判定邏輯
在 `backend/logic/evolution/traitLogic.js` 實作：

```javascript
/**
 * 執行敏捷擲骰
 * @returns {{ dice: number, escaped: boolean }}
 */
function rollAgileEscape() {
  const dice = Math.floor(Math.random() * 6) + 1;  // 1-6
  return {
    dice,
    escaped: dice >= AGILE_ESCAPE_THRESHOLD
  };
}
```

#### 3. 攻擊流程整合
在 `backend/logic/evolution/feedingLogic.js` 修改攻擊流程：

```javascript
function attackCreature(gameState, attackerId, defenderId) {
  // 檢查基本攻擊條件...

  // 檢查敏捷
  if (hasTrait(defender, TRAIT_TYPES.AGILE)) {
    // 返回待處理狀態，等待擲骰結果
    return {
      success: true,
      gameState,
      pendingResponse: {
        type: 'agileRoll',
        attackerId,
        defenderId
      }
    };
  }

  // 直接攻擊成功
  return resolveAttack(gameState, { attackerId, defenderId, escaped: false });
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0240-01 | 敏捷擲骰 1-3 | 逃脫失敗，攻擊成功 |
| TC-0240-02 | 敏捷擲骰 4-6 | 逃脫成功，攻擊失敗 |
| TC-0240-03 | 無敏捷生物被攻擊 | 不觸發擲骰 |
| TC-0240-04 | 敏捷與其他防禦疊加 | 通過其他檢查後才觸發敏捷 |
| TC-0240-05 | 逃脫成功後攻擊者狀態 | 攻擊者回合繼續，可選擇其他目標 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0233 已完成（肉食性狀）

### 驗收標準
- [ ] 敏捷性狀可正確添加到生物
- [ ] 擲骰機制正確（1-6 隨機）
- [ ] 4-6 逃脫成功，1-3 逃脫失敗
- [ ] 攻擊流程正確處理敏捷判定
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/traitLogic.js` — 修改
- `backend/logic/evolution/feedingLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
