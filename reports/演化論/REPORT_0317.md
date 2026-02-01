# 報告書 0317

## 工單編號
0317

## 完成日期
2026-02-01

## 完成內容摘要

### 建立擴充包註冊系統核心

完成 ExpansionRegistry 核心模組，作為演化論遊戲擴充包系統的基礎設施。

#### 新增檔案

1. **`shared/expansions/ExpansionInterface.js`**
   - 定義擴充包介面規範（必要欄位、可選欄位）
   - ID 格式驗證（小寫字母、數字、連字號）
   - 版本格式驗證（語意化版本 x.y.z）
   - `validateExpansionInterface()` 介面驗證函數
   - `createExpansionTemplate()` 模板建立函數

2. **`shared/expansions/ExpansionRegistry.js`**
   - 擴充包生命週期管理類別
   - 核心方法實作：
     - `register()` / `unregister()` - 註冊/移除擴充包
     - `enable()` / `disable()` - 啟用/停用擴充包
     - `isEnabled()` - 檢查啟用狀態
     - `getExpansion()` / `getAllExpansions()` / `getEnabledExpansions()`
     - `getTraitHandler()` / `getAllTraitHandlers()` - 性狀處理器管理
     - `getCardPool()` / `createDeck()` - 卡牌池管理
     - `getRule()` - 規則管理
     - `checkDependencies()` - 依賴檢查
     - `checkCompatibility()` - 相容性檢查
     - `validateExpansion()` - 格式驗證
     - `triggerGameInit()` / `triggerGameEnd()` - 生命週期鉤子
     - `reset()` - 重置註冊表

3. **`shared/expansions/index.js`**
   - 統一匯出點
   - 全域單例 `globalRegistry`

4. **`shared/expansions/__tests__/ExpansionRegistry.test.js`**
   - 完整單元測試（66 個測試案例）

#### 功能特點

- **依賴管理**：支援擴充包間的依賴關係，啟用時自動檢查
- **相容性檢查**：支援雙向不相容檢查
- **生命週期鉤子**：onRegister、onEnable、onDisable、onGameInit、onGameEnd
- **性狀處理器整合**：啟用時自動註冊性狀處理器
- **規則合併**：支援擴充包規則覆寫與合併
- **卡牌池管理**：自動維護啟用擴充包的卡牌池

## 遇到的問題與解決方案

1. **Jest 覆蓋率路徑問題**
   - 問題：rootDir 設為 `..` 後，覆蓋率統計無法正確顯示 shared 資料夾
   - 解決：測試本身正常執行，覆蓋率統計的路徑配置需後續調整

2. **Jest 版本更新**
   - 問題：`--testPathPattern` 已被棄用
   - 解決：改用 `--testPathPatterns`

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       66 passed, 66 total
Time:        2.432 s
```

### 測試覆蓋範圍

| 測試分類 | 測試數量 |
|----------|----------|
| register | 9 |
| unregister | 4 |
| enable | 9 |
| disable | 5 |
| getTraitHandler | 3 |
| getAllTraitHandlers | 2 |
| createDeck | 5 |
| getCardPool | 2 |
| checkDependencies | 4 |
| checkCompatibility | 4 |
| validateExpansion | 2 |
| getEnabledExpansions | 2 |
| getAllExpansions | 1 |
| reset | 2 |
| rules | 4 |
| game lifecycle hooks | 2 |
| ExpansionInterface | 6 |
| **總計** | **66** |

## 修改的現有檔案

- `backend/package.json` - 更新 Jest 配置以支援 shared 資料夾測試

## 下一步計劃

- 工單 0318：性狀定義結構
- 工單 0319：性狀處理器介面
