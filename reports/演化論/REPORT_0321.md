# 工單完成報告 0321

## 工單資訊
- **工單編號**: 0321
- **工單名稱**: 建立規則引擎核心
- **完成日期**: 2026-02-01
- **計畫書**: PLAN_EVOLUTION_PHASE2_ARCHITECTURE.md

## 完成內容

### 1. RuleEngine 核心類別

**檔案**: `backend/logic/evolution/rules/RuleEngine.js`

實作了完整的規則引擎，包含：

#### 規則管理
- `registerRule(ruleId, rule)` - 註冊規則
- `overrideRule(ruleId, modifier)` - 覆寫規則
- `extendRule(ruleId, extensions)` - 擴展規則（before/after）
- `getRule(ruleId)` - 取得規則
- `hasRule(ruleId)` - 檢查規則存在
- `removeRule(ruleId)` - 移除規則
- `executeRule(ruleId, context)` - 執行規則

#### 鉤子管理
- `addHook(hookName, callback, priority)` - 註冊鉤子
- `removeHook(hookName, callback)` - 移除鉤子
- `clearHook(hookName)` - 清除鉤子
- `getHookCount(hookName)` - 取得鉤子數量
- `triggerHook(hookName, context)` - 觸發鉤子

#### 中間件
- `use(middleware)` - 添加中間件
- `removeMiddleware(middleware)` - 移除中間件
- `clearMiddleware()` - 清除所有中間件

#### 上下文管理
- `createContext(context)` - 建立執行上下文
- `setTraitRegistry(registry)` - 設定性狀註冊中心
- `getTraitRegistry()` - 取得性狀註冊中心

#### 工具方法
- `getRuleIds()` - 取得所有規則 ID
- `getHookNames()` - 取得所有鉤子名稱
- `getRuleCount()` - 取得規則數量
- `reset()` - 重置引擎
- `exportState()` - 匯出狀態

### 2. 預定義規則 ID

**檔案**: `backend/logic/evolution/rules/ruleIds.js`

定義了完整的規則 ID 常數：

| 類別 | 規則數 | 範例 |
|------|--------|------|
| 遊戲初始化 | 2 | `GAME_INIT`, `GAME_START` |
| 階段轉換 | 5 | `PHASE_TRANSITION`, `PHASE_EVOLUTION_START` |
| 食物供給 | 2 | `FOOD_FORMULA`, `FOOD_ROLL_DICE` |
| 動作驗證 | 3 | `ACTION_VALIDATE`, `ACTION_VALIDATE_TURN` |
| 生物操作 | 2 | `CREATURE_CREATE`, `CREATURE_EXTINCT` |
| 性狀操作 | 3 | `TRAIT_VALIDATE_PLACEMENT`, `TRAIT_ADD` |
| 進食 | 5 | `FEED_VALIDATE`, `FEED_EXECUTE` |
| 攻擊 | 4 | `ATTACK_VALIDATE`, `ATTACK_EXECUTE` |
| 滅絕 | 3 | `EXTINCTION_CHECK`, `EXTINCTION_PROCESS` |
| 計分 | 3 | `SCORE_CALCULATE`, `SCORE_CREATURE` |
| 遊戲結束 | 2 | `GAME_END_CHECK`, `GAME_END_DETERMINE_WINNER` |

### 3. 預定義鉤子名稱

**檔案**: `backend/logic/evolution/rules/hookNames.js`

定義了完整的鉤子名稱常數：

| 類別 | 鉤子數 | 範例 |
|------|--------|------|
| 遊戲生命週期 | 6 | `BEFORE_GAME_INIT`, `AFTER_GAME_END` |
| 階段生命週期 | 4 | `BEFORE_PHASE_START`, `AFTER_PHASE_END` |
| 回合生命週期 | 4 | `BEFORE_TURN_START`, `AFTER_TURN_END` |
| 動作相關 | 3 | `BEFORE_ACTION`, `ACTION_REJECTED` |
| 生物相關 | 3 | `ON_CREATURE_CREATE`, `ON_CREATURE_EXTINCT` |
| 性狀相關 | 3 | `ON_TRAIT_ADD`, `ON_TRAIT_REMOVE` |
| 進食相關 | 3 | `BEFORE_FEED`, `ON_GAIN_FOOD` |
| 攻擊相關 | 5 | `BEFORE_ATTACK`, `ON_ATTACK_SUCCESS` |
| 食物池相關 | 2 | `ON_FOOD_POOL_CHANGE`, `ON_DICE_ROLL` |
| 計分相關 | 2 | `BEFORE_SCORE_CALCULATE`, `AFTER_SCORE_CALCULATE` |

### 4. 規則引擎工廠

**檔案**: `backend/logic/evolution/rules/createRuleEngine.js`

- `createRuleEngine(options)` - 建立規則引擎
- `createRuleEngineWithDefaults(options)` - 建立帶預設規則的引擎

支援選項：
- `traitRegistry` - 性狀註冊中心
- `debug` - 除錯模式
- `logger` - 自訂日誌函數

### 5. 統一匯出

**檔案**: `backend/logic/evolution/rules/index.js`

匯出所有模組供外部使用。

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       67 passed, 67 total
```

### 覆蓋率

| 檔案 | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| **總計** | **92.85%** | **100%** | **90.9%** | **92.66%** |
| RuleEngine.js | 96.59% | 100% | 90% | 96.47% |
| createRuleEngine.js | 100% | 100% | 100% | 100% |
| hookNames.js | 100% | 100% | 100% | 100% |
| ruleIds.js | 100% | 100% | 100% | 100% |

### 測試涵蓋內容

| 區塊 | 測試數 | 測試項目 |
|------|--------|----------|
| 構造函數 | 1 | 初始化狀態 |
| registerRule | 6 | 正常註冊、無效 ID、無效規則、時間戳 |
| getRule | 2 | 存在/不存在 |
| hasRule | 2 | 存在/不存在 |
| removeRule | 2 | 成功/失敗 |
| executeRule | 4 | 執行結果、異常、上下文、中間件 |
| overrideRule | 4 | 覆寫、原規則保存、異常、時間戳 |
| extendRule | 5 | before/after、順序、異常、標記 |
| addHook | 2 | 單一/多個 |
| removeHook | 3 | 成功/失敗/不匹配 |
| triggerHook | 4 | 優先級、上下文傳遞、中斷、不存在 |
| 中間件 | 4 | 添加、移除、清除、異常 |
| 上下文 | 4 | 引用、註冊中心、輔助方法、原屬性 |
| 工具方法 | 6 | ID列表、鉤子列表、計數、重置、匯出 |
| 常數 | 6 | RULE_IDS、HOOK_NAMES 驗證 |
| 工廠函數 | 5 | 建立、設定、除錯、日誌 |

## 檔案結構

```
backend/logic/evolution/rules/
├── index.js              # 統一匯出
├── RuleEngine.js         # 核心類別
├── ruleIds.js            # 規則 ID 常數
├── hookNames.js          # 鉤子名稱常數
├── createRuleEngine.js   # 工廠函數
└── __tests__/
    └── RuleEngine.test.js  # 測試檔案 (67 tests)
```

## 設計特點

1. **可擴展性**: 規則可被覆寫和擴展，支援擴充包修改基礎規則
2. **優先級控制**: 鉤子按優先級順序執行
3. **中間件架構**: 支援通用處理邏輯
4. **上下文傳遞**: 自動注入 ruleEngine 和 traitRegistry
5. **除錯支援**: 內建除錯中間件和狀態匯出

## 後續工作

- 工單 0322: 實作基礎規則集
- 工單 0324: 效果觸發系統
