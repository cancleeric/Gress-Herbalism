# 完成報告 0322

## 編號
0322

## 日期
2026-02-01

## 工作單標題
實作基礎規則集

## 完成摘要

成功實作基礎版的所有遊戲規則，包含 6 個規則模組共 20+ 條規則，涵蓋遊戲的完整生命週期。

## 實作內容

### 1. 規則模組結構

**檔案**：`shared/expansions/base/rules/index.js`
- 統一匯出所有規則模組
- 提供 `registerBaseRules()` 一鍵註冊功能

### 2. 食物供給規則 (`foodRules.js`)

**規則**：
- `FOOD_FORMULA` - 計算食物供給數量（根據玩家數）
- `FOOD_ROLL_DICE` - 擲骰決定食物數量

**公式**：
| 玩家數 | 公式 |
|--------|------|
| 2 人 | 1d6 + 2 |
| 3 人 | 2d6 |
| 4 人 | 2d6 + 2 |

### 3. 攻擊規則 (`attackRules.js`)

**規則**：
- `ATTACK_VALIDATE` - 驗證攻擊合法性
- `ATTACK_CHECK_DEFENSE` - 檢查目標防禦性狀
- `ATTACK_RESOLVE` - 解決攻擊（處理防禦回應）
- `ATTACK_EXECUTE` - 執行攻擊（目標滅絕，攻擊者獲得食物）
- `CREATURE_EXTINCT` - 處理生物滅絕（含毒液、腐食觸發）

**驗證規則**：
- 只有肉食生物才能攻擊
- 每回合只能攻擊一次
- 不能攻擊自己的生物
- 水生攻擊者只能攻擊水生目標

### 4. 進食規則 (`feedingRules.js`)

**規則**：
- `FEED_VALIDATE` - 驗證進食合法性
- `FEED_CHECK_SYMBIOSIS` - 檢查共生限制
- `FEED_EXECUTE` - 執行進食
- `FEED_CHAIN_COMMUNICATION` - 處理溝通連鎖
- `FEED_CHAIN_COOPERATION` - 處理合作連鎖

**特性**：
- 溝通連鎖：連結的生物從食物池獲得紅色食物
- 合作連鎖：連結的生物獲得藍色食物（不消耗食物池）
- 支援遞迴連鎖處理

### 5. 滅絕規則 (`extinctionRules.js`)

**規則**：
- `EXTINCTION_CHECK` - 檢查滅絕條件
- `EXTINCTION_PROCESS` - 處理滅絕階段
- `EXTINCTION_DRAW_CARDS` - 滅絕後抽牌補充手牌

**特性**：
- 冬眠中的生物不會滅絕
- 支援消耗脂肪以存活
- 中毒的生物必定滅絕

### 6. 計分規則 (`scoreRules.js`)

**規則**：
- `SCORE_CALCULATE` - 計算最終分數
- `SCORE_CREATURE` - 計算單隻生物分數
- `SCORE_TRAIT` - 計算單個性狀分數
- `GAME_END_DETERMINE_WINNER` - 判定勝者
- `GAME_END_CHECK` - 檢查遊戲是否結束

**計分公式**：
- 生物基礎分：2 分
- 性狀基礎分：1 分 + 食量加成

### 7. 階段規則 (`phaseRules.js`)

**規則**：
- `PHASE_TRANSITION` - 處理階段轉換
- `PHASE_EVOLUTION_START` - 演化階段開始
- `PHASE_FOOD_START` - 食物供給階段開始
- `PHASE_FEEDING_START` - 進食階段開始
- `PHASE_EXTINCTION_START` - 滅絕階段開始
- `GAME_INIT` - 初始化遊戲狀態
- `GAME_START` - 開始遊戲

**階段順序**：
`evolution` → `foodSupply` → `feeding` → `extinction` → (循環)

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
```

**測試覆蓋**：
- `registerBaseRules` - 1 個測試
- `foodRules` - 4 個測試
- `attackRules` - 5 個測試
- `feedingRules` - 7 個測試
- `extinctionRules` - 4 個測試
- `scoreRules` - 5 個測試
- `phaseRules` - 6 個測試

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `shared/expansions/base/rules/index.js` | 規則集主入口 |
| `shared/expansions/base/rules/foodRules.js` | 食物供給規則 |
| `shared/expansions/base/rules/attackRules.js` | 攻擊規則 |
| `shared/expansions/base/rules/feedingRules.js` | 進食規則 |
| `shared/expansions/base/rules/extinctionRules.js` | 滅絕規則 |
| `shared/expansions/base/rules/scoreRules.js` | 計分規則 |
| `shared/expansions/base/rules/phaseRules.js` | 階段規則 |
| `shared/expansions/base/rules/__tests__/baseRules.test.js` | 單元測試 |

## 驗收標準達成

- [x] 所有基礎規則實作完成
- [x] 規則可正確註冊到 RuleEngine
- [x] 食物公式符合規則書
- [x] 攻擊流程完整（驗證、防禦、執行）
- [x] 進食連鎖正確觸發
- [x] 滅絕檢查符合規則
- [x] 計分正確
- [x] 單元測試覆蓋率 > 85%（28 個測試全數通過）

## 備註

- 規則設計支援擴展包覆寫（透過 RuleEngine.overrideRule）
- 透過 Hook 系統支援事件注入
- 進食連鎖使用 Set 追蹤已處理生物以避免無限迴圈
