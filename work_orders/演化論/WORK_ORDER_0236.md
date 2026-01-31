# 工作單 0236

## 編號
0236

## 日期
2026-01-31

## 工作單標題
實作【偽裝】性狀

## 工單主旨
實作「偽裝 Camouflage」性狀的完整邏輯，使生物不會被沒有銳目的肉食攻擊

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 偽裝 |
| 英文代碼 | camouflage |
| 類別 | 防禦相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **防禦效果**：肉食生物必須擁有銳目性狀才能攻擊此生物
2. **被動性狀**：不需要主動使用，持續有效
3. **無互斥**：可與任何性狀共存

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.CAMOUFLAGE: 'camouflage'
```

#### 2. 防禦判定邏輯
在 `backend/logic/evolution/creatureLogic.js` 修改 `canBeAttacked`：

```javascript
function canBeAttacked(attacker, defender) {
  // 檢查偽裝
  if (hasTrait(defender, TRAIT_TYPES.CAMOUFLAGE)) {
    if (!hasTrait(attacker, TRAIT_TYPES.SHARP_VISION)) {
      return {
        canAttack: false,
        reason: '目標有偽裝性狀，需要銳目才能攻擊'
      };
    }
  }

  // ... 繼續其他檢查 ...
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0236-01 | 無銳目肉食攻擊偽裝生物 | 攻擊失敗 |
| TC-0236-02 | 有銳目肉食攻擊偽裝生物 | 攻擊成功（需驗證其他防禦） |
| TC-0236-03 | 偽裝與其他防禦性狀疊加 | 同時生效 |
| TC-0236-04 | 偽裝生物可正常進食 | 進食正常 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0235 同步開發（銳目性狀）

### 驗收標準
- [ ] 偽裝性狀可正確添加到生物
- [ ] 無銳目肉食無法攻擊偽裝生物
- [ ] 有銳目肉食可攻擊偽裝生物
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
