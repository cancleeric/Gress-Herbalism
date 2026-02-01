# 報告書 0319

## 工單編號
0319

## 完成日期
2026-02-01

## 完成內容摘要

### 建立性狀處理器介面

定義 TraitHandler 抽象基礎類別，封裝性狀的所有邏輯，使性狀系統模組化、可擴展。

#### 新增檔案

1. **`backend/logic/evolution/traits/TraitHandler.js`**
   - 抽象基礎類別，不可直接實例化
   - 建構子驗證與屬性初始化
   - **放置相關**：canPlace(), onPlace(), onRemove()
   - **防禦相關**：checkDefense(), getDefenseResponse(), handleDefenseResponse()
   - **進食相關**：checkCanFeed(), onFeed(), onGainFood()
   - **主動能力**：canUseAbility(), getAbilityTargets(), useAbility()
   - **階段相關**：onPhaseStart(), onPhaseEnd(), onTurnStart()
   - **滅絕相關**：checkExtinction(), onExtinct(), onOtherExtinct()
   - **計分相關**：getScoreBonus()
   - **輔助方法**：getInfo(), getType()

2. **`backend/logic/evolution/traits/traitRegistry.js`**
   - TraitRegistry 類別：管理性狀處理器的註冊與取得
   - 核心方法：register(), get(), has(), getAll(), getAllTypes()
   - 批量操作：registerAll(), clear()
   - 進階查詢：getByCategory(), getByExpansion()
   - 全域單例：globalTraitRegistry

3. **`backend/logic/evolution/traits/index.js`**
   - 統一匯出點

4. **`backend/logic/evolution/traits/__tests__/TraitHandler.test.js`**
   - 56 個單元測試

### canPlace() 驗證邏輯

| 檢查項目 | 說明 |
|----------|------|
| 擁有者檢查 | 一般性狀須放在自己生物上 |
| 寄生蟲檢查 | 必須放在對手生物上 |
| 互動性狀檢查 | 需指定第二隻生物，且都是自己的 |
| 可疊加檢查 | 非疊加性狀不可重複放置 |
| 互斥性檢查 | 不可與互斥性狀共存 |

### 方法覆寫指南

子類別可覆寫以下方法實作特殊邏輯：

| 方法 | 使用場景 |
|------|----------|
| checkDefense() | 偽裝、穴居、水生、巨化等防禦檢查 |
| getDefenseResponse() | 斷尾、擬態、敏捷的防禦回應 |
| onFeed() | 溝通、合作的連鎖進食 |
| onGainFood() | 觸發連鎖效果 |
| canUseAbility() | 冬眠、踐踏、掠奪的主動能力 |
| useAbility() | 執行主動能力 |
| onExtinct() | 毒液的反擊效果 |
| onOtherExtinct() | 腐食的觸發 |

## 遇到的問題與解決方案

無重大問題。

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       56 passed, 56 total
Time:        0.454 s
```

### 測試覆蓋範圍

| 測試分類 | 測試數量 |
|----------|----------|
| TraitHandler constructor | 4 |
| TraitHandler canPlace | 8 |
| TraitHandler interactive | 4 |
| TraitHandler default methods | 17 |
| TraitHandler getInfo/getType | 2 |
| TraitRegistry | 18 |
| globalTraitRegistry | 3 |
| **總計** | **56** |

## 下一步計劃

- 工單 0320：基礎版性狀處理器實作（19 個具體 Handler）
- 工單 0321：規則引擎核心
