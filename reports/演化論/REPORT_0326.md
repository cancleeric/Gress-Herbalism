# 完成報告 0326

## 編號
0326

## 日期
2026-02-01

## 工作單標題
建立擴充包載入機制

## 完成摘要

成功建立擴充包動態載入機制，實現 Manifest 規範定義、動態模組載入、依賴解析與載入狀態追蹤。

## 實作內容

### 1. 擴充包 Manifest 規範 (`manifest.js`)

**常數定義**：

| 常數 | 說明 |
|------|------|
| `MANIFEST_VERSION` | Manifest 版本號 (1.0.0) |
| `EXPANSION_TYPE` | 擴充包類型：base、expansion、promo、fan_made |
| `EXPANSION_STATUS` | 載入狀態：not_loaded、loading、loaded、enabled、disabled、error |

**Manifest 必要欄位**：
- `id` - 唯一識別碼（小寫字母開頭，只含 a-z、0-9、_、-）
- `name` - 中文名稱
- `version` - 版本號（semver 格式）
- `type` - 擴充包類型

**Manifest 選填欄位**：
- `nameEn` - 英文名稱
- `description` - 描述
- `authors` - 作者陣列
- `dependencies` - 依賴 `{ id: versionRange }`
- `conflicts` - 衝突 `{ id: reason }`
- `minPlayers` / `maxPlayers` - 玩家數範圍
- `contents` - 內容摘要

**驗證函數 `validateManifest()`**：
- 檢查必要欄位
- 驗證 ID 格式（正規表達式）
- 驗證版本格式（semver）
- 驗證類型是否有效
- 驗證玩家數邏輯

**預設 Manifest**：
- `BASE_MANIFEST` - 基礎版 Manifest
- `FLIGHT_MANIFEST_EXAMPLE` - 飛行擴充範例

### 2. 擴充包載入器 (`loader.js`)

**LoadResult 類別**：
- 封裝載入結果
- 靜態方法 `success()` / `failure()` 快速建立結果
- 包含 expansionId、status、manifest、module、error、loadTime

**ExpansionLoader 類別**：

| 方法 | 說明 |
|------|------|
| `registerPath(id, path)` | 註冊擴充包路徑 |
| `registerPaths(pathMap)` | 批次註冊路徑 |
| `registerModule(id, module)` | 直接註冊模組（用於測試） |
| `load(id)` | 非同步載入擴充包 |
| `loadMultiple(ids)` | 批次載入多個擴充包 |
| `unload(id)` | 解除載入 |
| `getLoaded(id)` | 取得載入結果 |
| `getLoadedIds()` | 取得所有已載入 ID |
| `isLoaded(id)` | 檢查是否已載入 |
| `getStatus(id)` | 取得載入狀態 |
| `onLoad(callback)` | 註冊載入成功回調 |
| `onError(callback)` | 註冊載入失敗回調 |
| `reset()` | 重置載入器 |

**內部功能**：
- `_loadExpansion()` - 載入邏輯
- `_importModule()` - 動態載入（支援 CommonJS / ES Module）
- `_resolveDependencies()` - 依賴解析
- `_checkVersion()` - 版本相容性檢查（支援 `>=`、`^` 格式）
- `_compareVersions()` - 版本號比較

**載入流程**：
1. 檢查是否已載入（返回快取）
2. 檢查是否正在載入（等待 Promise）
3. 載入模組
4. 驗證 Manifest
5. 解析依賴（遞迴載入）
6. 檢查版本相容性
7. 返回 LoadResult

### 3. 模組匯出更新

更新 `shared/expansions/index.js`，新增匯出：
- Manifest 常數與函數
- LoadResult 類別
- ExpansionLoader 類別與預設實例

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       57 passed, 57 total
```

**測試覆蓋**：
- MANIFEST_VERSION: 1 個測試
- EXPANSION_TYPE: 1 個測試
- EXPANSION_STATUS: 1 個測試
- validateManifest: 18 個測試
- BASE_MANIFEST: 5 個測試
- LoadResult: 3 個測試
- ExpansionLoader.registerPath: 2 個測試
- ExpansionLoader.registerPaths: 1 個測試
- ExpansionLoader.registerModule: 1 個測試
- ExpansionLoader.load: 6 個測試
- dependency resolution: 3 個測試
- version checking: 3 個測試
- loadMultiple: 2 個測試
- unload: 2 個測試
- getters: 5 個測試
- callbacks: 3 個測試
- reset: 2 個測試
- expansionLoader 預設實例: 1 個測試

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `shared/expansions/manifest.js` | Manifest 規範定義 |
| `shared/expansions/loader.js` | 擴充包載入器 |
| `shared/expansions/index.js` | 更新模組匯出 |
| `shared/expansions/__tests__/loader.test.js` | 單元測試 |

## 驗收標準達成

- [x] Manifest 規範完整定義
- [x] `validateManifest` 正確驗證
- [x] `ExpansionLoader` 可動態載入模組
- [x] 依賴解析正常運作
- [x] 版本相容性檢查正常（>=、^ 格式）
- [x] 衝突檢測保留在 ExpansionRegistry
- [x] 所有單元測試通過（57 個）

## 備註

- 載入機制支援 CommonJS 和 ES Module
- 版本檢查支援 semver 基本格式及 >= 和 ^ 運算子
- `registerModule()` 方法方便測試時直接注入模組
- 預設實例 `expansionLoader` 可供全域使用
- ExpansionRegistry 整合將在後續工單完成
