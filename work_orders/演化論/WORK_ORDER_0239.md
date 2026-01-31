# 工作單 0239

## 編號
0239

## 日期
2026-01-31

## 工作單標題
實作【水生】性狀

## 工單主旨
實作「水生 Aquatic」性狀的完整邏輯，限制水生與非水生生物之間的攻擊

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 水生 |
| 英文代碼 | aquatic |
| 類別 | 防禦相關 |
| 卡牌數量 | 8 張 |
| 食量加成 | 無 |

### 性狀規則

1. **雙向限制**：
   - 水生肉食只能攻擊水生生物
   - 非水生肉食只能攻擊非水生生物
2. **同類相食**：水生肉食可以攻擊其他水生生物
3. **自我保護**：非水生肉食無法攻擊水生生物

### 攻擊規則矩陣

| 攻擊者 \ 防守者 | 水生 | 非水生 |
|----------------|------|--------|
| 水生肉食 | ✓ 可攻擊 | ✗ 不可攻擊 |
| 非水生肉食 | ✗ 不可攻擊 | ✓ 可攻擊 |

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.AQUATIC: 'aquatic'
```

#### 2. 攻擊判定邏輯
在 `backend/logic/evolution/creatureLogic.js` 修改 `canBeAttacked`：

```javascript
function canBeAttacked(attacker, defender) {
  // ... 前置檢查 ...

  const attackerIsAquatic = hasTrait(attacker, TRAIT_TYPES.AQUATIC);
  const defenderIsAquatic = hasTrait(defender, TRAIT_TYPES.AQUATIC);

  // 水生限制
  if (attackerIsAquatic !== defenderIsAquatic) {
    if (attackerIsAquatic) {
      return {
        canAttack: false,
        reason: '水生肉食只能攻擊水生生物'
      };
    } else {
      return {
        canAttack: false,
        reason: '非水生肉食無法攻擊水生生物'
      };
    }
  }

  // ... 繼續其他檢查 ...
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0239-01 | 水生肉食攻擊水生生物 | 攻擊成功（若無其他防禦） |
| TC-0239-02 | 水生肉食攻擊非水生生物 | 攻擊失敗 |
| TC-0239-03 | 非水生肉食攻擊水生生物 | 攻擊失敗 |
| TC-0239-04 | 非水生肉食攻擊非水生生物 | 攻擊成功（若無其他防禦） |
| TC-0239-05 | 水生與其他防禦疊加 | 需同時滿足所有條件 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0233 已完成（肉食性狀）

### 驗收標準
- [ ] 水生性狀可正確添加到生物
- [ ] 水生/非水生攻擊限制正確
- [ ] 與其他防禦性狀正確疊加
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
