# 工作單 0237

## 編號
0237

## 日期
2026-01-31

## 工作單標題
實作【穴居】性狀

## 工單主旨
實作「穴居 Burrowing」性狀的完整邏輯，使生物在吃飽時無法被攻擊

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 穴居 |
| 英文代碼 | burrowing |
| 類別 | 防禦相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **防禦條件**：當此生物已吃飽時，無法被肉食生物攻擊
2. **未吃飽時**：沒有防禦效果，可被正常攻擊
3. **被動性狀**：不需要主動使用
4. **策略意義**：鼓勵玩家優先餵食穴居生物以獲得保護

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.BURROWING: 'burrowing'
```

#### 2. 防禦判定邏輯
在 `backend/logic/evolution/creatureLogic.js` 修改 `canBeAttacked`：

```javascript
function canBeAttacked(attacker, defender) {
  // ... 前置檢查 ...

  // 檢查穴居（吃飽時無法被攻擊）
  if (hasTrait(defender, TRAIT_TYPES.BURROWING) && defender.isFed) {
    return {
      canAttack: false,
      reason: '目標有穴居性狀且已吃飽，無法被攻擊'
    };
  }

  // ... 繼續其他檢查 ...
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0237-01 | 攻擊已吃飽的穴居生物 | 攻擊失敗 |
| TC-0237-02 | 攻擊未吃飽的穴居生物 | 攻擊成功（若無其他防禦） |
| TC-0237-03 | 穴居生物吃飽後狀態 | isFed = true，獲得保護 |
| TC-0237-04 | 穴居與其他防禦疊加 | 同時檢查所有防禦 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）

### 驗收標準
- [ ] 穴居性狀可正確添加到生物
- [ ] 吃飽的穴居生物無法被攻擊
- [ ] 未吃飽的穴居生物可被攻擊
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
