# 完成報告 0328

## 編號
0328

## 日期
2026-02-01

## 工作單標題
建立擴充包驗證系統

## 完成摘要

成功建立擴充包驗證系統，實現結構驗證、性狀定義驗證、卡牌配置驗證及擴充包間相容性檢查。

## 實作內容

### 1. 驗證結果類別 (`ValidationResult`)

| 方法 | 說明 |
|------|------|
| `addError(message, context)` | 新增錯誤（設為無效） |
| `addWarning(message, context)` | 新增警告（不影響有效性） |
| `addInfo(message, context)` | 新增資訊 |
| `merge(other)` | 合併另一個驗證結果 |
| `toJSON()` | 輸出 JSON（含 summary） |

### 2. 擴充包驗證器 (`ExpansionValidator`)

**驗證方法**：

| 方法 | 說明 |
|------|------|
| `validate(expansion)` | 完整驗證擴充包 |
| `validateManifest(expansion)` | 驗證 Manifest |
| `validateStructure(expansion)` | 驗證模組結構 |
| `validateTraits(traits, expansionId)` | 驗證性狀定義 |
| `validateCards(cards, traits, expansionId)` | 驗證卡牌定義 |
| `validateHandlers(handlers, traits)` | 驗證性狀處理器 |

**自訂驗證器**：

| 方法 | 說明 |
|------|------|
| `registerTraitValidator(fn)` | 註冊性狀驗證器 |
| `registerCardValidator(fn)` | 註冊卡牌驗證器 |
| `registerStructureValidator(fn)` | 註冊結構驗證器 |
| `reset()` | 重置所有自訂驗證器 |

**驗證規則**：

| 項目 | 驗證內容 |
|------|----------|
| Manifest | id、name、version、type 必填 |
| 結構 | 基礎版需匯出 traits、cards、createDeck |
| 性狀 | name、type 必填，foodBonus 須為數字 |
| 卡牌 | id、frontTrait、backTrait、count 必填 |
| 處理器 | canPlace 方法須存在 |

### 3. 相容性結果類別 (`CompatibilityResult`)

| 方法 | 說明 |
|------|------|
| `addIssue(type, message, details)` | 新增問題（設為不相容） |
| `addSuggestion(message)` | 新增建議 |
| `toJSON()` | 輸出 JSON |

**問題類型**：
- `missing_base` - 缺少基礎版
- `load_failed` - 載入失敗
- `load_error` - 載入錯誤
- `missing_dependency` - 缺少依賴
- `version_mismatch` - 版本不符
- `conflict` - 擴充包衝突
- `player_range` - 玩家數範圍不相容
- `trait_conflict` - 性狀衝突

### 4. 相容性檢查器 (`CompatibilityChecker`)

| 方法 | 說明 |
|------|------|
| `check(expansionIds)` | 檢查擴充包組合相容性 |
| `getPlayerRange(expansionIds)` | 取得玩家數範圍 |

**內部檢查**：
- `_loadAll()` - 載入所有擴充包
- `_checkDependencies()` - 檢查依賴關係
- `_checkConflicts()` - 檢查衝突宣告
- `_checkPlayerRange()` - 檢查玩家數範圍
- `_checkTraitConflicts()` - 檢查性狀衝突
- `_generateSuggestions()` - 產生建議
- `_matchVersion()` - 版本匹配（支援 >=、^）
- `_compareVersions()` - 版本比較

### 5. 模組匯出更新

更新 `shared/expansions/index.js`，新增匯出：
- `ValidationResult`
- `ExpansionValidator`
- `expansionValidator`
- `CompatibilityResult`
- `CompatibilityChecker`
- `compatibilityChecker`

## 測試結果

```
Test Suites: 2 passed, 2 total
Tests:       71 passed, 71 total
```

**ValidationResult 測試** (9 個)：
- constructor: 1 個
- addError: 2 個
- addWarning: 1 個
- addInfo: 1 個
- merge: 3 個
- toJSON: 1 個

**ExpansionValidator 測試** (27 個)：
- validateManifest: 3 個
- validateStructure: 3 個
- validateTraits: 7 個
- validateCards: 10 個
- validateHandlers: 5 個
- validate (full): 2 個
- custom validators: 3 個

**CompatibilityResult 測試** (4 個)：
- constructor: 1 個
- addIssue: 2 個
- addSuggestion: 1 個
- toJSON: 1 個

**CompatibilityChecker 測試** (26 個)：
- check: 3 個
- _checkDependencies: 3 個
- _checkConflicts: 2 個
- _checkPlayerRange: 2 個
- _checkTraitConflicts: 2 個
- _generateSuggestions: 2 個
- _matchVersion: 3 個
- _compareVersions: 4 個
- getPlayerRange: 1 個

**相關測試**：
```
shared/expansions: 453 passed
```

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `shared/expansions/validator.js` | 驗證器實作 |
| `shared/expansions/compatibility.js` | 相容性檢查器 |
| `shared/expansions/__tests__/validator.test.js` | 驗證器測試 |
| `shared/expansions/__tests__/compatibility.test.js` | 相容性檢查器測試 |
| `shared/expansions/index.js` | 更新模組匯出 |

## 驗收標準達成

- [x] `ValidationResult` 正確追蹤錯誤/警告
- [x] `ExpansionValidator` 驗證 Manifest
- [x] 性狀定義驗證完整
- [x] 卡牌定義驗證完整
- [x] 處理器驗證正常
- [x] `CompatibilityChecker` 檢測依賴
- [x] 衝突檢測正常
- [x] 玩家數範圍檢查正常
- [x] 版本匹配支援 >=、^ 格式
- [x] 所有單元測試通過（71 個 + 453 個相關測試）

## 備註

- 驗證系統支援自訂驗證器擴展
- 相容性檢查在遊戲開始前執行
- 基礎版性狀可被擴充包覆寫（產生建議而非錯誤）
- 卡牌數量超過 150 張時會產生建議
- 預設實例 `expansionValidator` 和 `compatibilityChecker` 可供全域使用
