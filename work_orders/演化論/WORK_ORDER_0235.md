# 工作單 0235

## 編號
0235

## 日期
2026-01-31

## 工作單標題
實作【銳目】性狀

## 工單主旨
實作「銳目 Sharp Vision」性狀的完整邏輯，使肉食生物能夠獵食具有偽裝性狀的生物

## 內容

### 性狀基本資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 銳目 |
| 英文代碼 | sharpVision |
| 類別 | 肉食相關 |
| 卡牌數量 | 4 張 |
| 食量加成 | 無 |

### 性狀規則

1. **功能**：銳目是肉食性狀的輔助能力
2. **效果**：只有擁有銳目的肉食生物才能攻擊具有偽裝性狀的生物
3. **單獨效果**：若生物只有銳目沒有肉食，此性狀無作用
4. **非肉食限制**：非肉食生物不需要銳目

### 實作項目

#### 1. 常數定義
在 `shared/constants/evolution.js` 確認：
```javascript
TRAIT_TYPES.SHARP_VISION: 'sharpVision'
```

#### 2. 攻擊判定邏輯
在 `backend/logic/evolution/creatureLogic.js` 修改 `canBeAttacked`：

```javascript
function canBeAttacked(attacker, defender) {
  // ... 其他檢查 ...

  // 偽裝檢查
  if (hasTrait(defender, TRAIT_TYPES.CAMOUFLAGE)) {
    if (!hasTrait(attacker, TRAIT_TYPES.SHARP_VISION)) {
      return { canAttack: false, reason: '目標有偽裝，攻擊者需要銳目' };
    }
  }

  // ... 其他檢查 ...
}
```

### 測試案例

| 測試 ID | 測試描述 | 預期結果 |
|---------|---------|---------|
| TC-0235-01 | 肉食+銳目攻擊偽裝生物 | 攻擊成功 |
| TC-0235-02 | 肉食無銳目攻擊偽裝生物 | 攻擊失敗 |
| TC-0235-03 | 肉食+銳目攻擊無偽裝生物 | 攻擊成功 |
| TC-0235-04 | 非肉食生物有銳目 | 性狀無效果 |
| TC-0235-05 | 銳目可與任何性狀共存 | 無互斥 |

### 前置條件
- 工單 0228-0232 已完成（基礎架構）
- 工單 0233 已完成（肉食性狀）
- 工單 0236 同步開發（偽裝性狀）

### 驗收標準
- [ ] 銳目性狀可正確添加到生物
- [ ] 肉食+銳目可攻擊偽裝生物
- [ ] 肉食無銳目無法攻擊偽裝生物
- [ ] 測試案例全部通過

### 相關檔案
- `backend/logic/evolution/creatureLogic.js` — 修改
- `shared/constants/evolution.js` — 參考

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 階段二
`docs/演化論/GAME_RULES_EVOLUTION.md` 性狀說明
