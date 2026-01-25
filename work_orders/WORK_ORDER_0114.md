# 工作單 0114

**日期：** 2026-01-25

**工作單標題：** 全面測試驗證與工單品質審計

**工單主旨：** 測試審計 - 執行完整測試套件並驗證工單完成品質

**優先級：** 高

---

## 目標

對專案進行全面測試驗證，確保所有已完成工單的功能正常運作，並審計工單完成品質。

---

## 第一部分：測試套件執行

### 1.1 後端測試

```bash
cd backend && npm test -- --verbose 2>&1
```

檢查項目：
- [ ] 所有測試通過
- [ ] 無 `.skip` 標記的測試
- [ ] 無 `.only` 標記的測試
- [ ] 無 `TODO` 或 `FIXME` 未完成項目

### 1.2 前端測試

```bash
cd frontend && npm test -- --watchAll=false --verbose 2>&1
```

檢查項目：
- [ ] 所有測試通過
- [ ] 無 `.skip` 標記的測試
- [ ] 無 `.only` 標記的測試
- [ ] 無 `TODO` 或 `FIXME` 未完成項目

### 1.3 測試程式碼審計

搜尋測試檔案中的問題標記：

```bash
# 搜尋 .skip
grep -rn "\.skip\|it\.skip\|describe\.skip\|test\.skip" --include="*.test.js"

# 搜尋 .only
grep -rn "\.only\|it\.only\|describe\.only\|test\.only" --include="*.test.js"

# 搜尋 TODO/FIXME
grep -rn "TODO\|FIXME" --include="*.test.js"
```

---

## 第二部分：工單品質審計

### 2.1 Git 變更驗證

對每個已完成工單，使用以下指令驗證：

```bash
# 查看與工單相關的 commit
git log --oneline --grep="工單 XXXX" --grep="0XXX" --all-match

# 查看 commit 的實際變更
git show <commit_hash>
```

### 2.2 工單評分標準

對每個工單進行評分（總分 140 分，通過門檻 ≥126 分）：

| 評分項目 | 分數 | 說明 |
|---------|------|------|
| Description | 20 | 問題描述清晰、完整 |
| Solution | 20 | 解決方案合理、有效 |
| Modification | 20 | 程式碼修改正確、符合規範 |
| Test | 20 | 測試覆蓋充分、測試通過 |
| Completion | 20 | 驗收標準全部達成 |
| Test Execution | 25 | 測試實際執行成功 |
| Git | 15 | Commit 記錄完整、變更真實 |
| **總分** | **140** | **通過門檻：≥126** |

### 2.3 評分表模板

```markdown
## 工單 0XXX 評分

| 項目 | 得分 | 滿分 | 備註 |
|------|------|------|------|
| Description | | 20 | |
| Solution | | 20 | |
| Modification | | 20 | |
| Test | | 20 | |
| Completion | | 20 | |
| Test Execution | | 25 | |
| Git | | 15 | |
| **總分** | | **140** | |

**結果：** ☐ 通過 / ☐ 不通過
```

---

## 第三部分：抽樣審計範圍

### 3.1 必審工單（核心功能）

| 工單 | 功能 | 優先級 |
|------|------|--------|
| 0071 | 預測功能實作 | 必審 |
| 0091-0097 | 預測功能修復 | 必審 |
| 0098-0103 | 預測功能驗證 | 必審 |

### 3.2 隨機抽樣（至少 5 個）

從以下範圍隨機抽取：
- 0001-0061：基礎功能
- 0071-0090：進階功能

---

## 第四部分：測試結果記錄

### 4.1 測試執行摘要

```markdown
## 測試執行摘要

**執行日期：** YYYY-MM-DD
**執行環境：** Node.js vXX.XX.XX

### 後端測試
- 測試套件數：X
- 測試案例數：X
- 通過：X
- 失敗：X
- 跳過：X

### 前端測試
- 測試套件數：X
- 測試案例數：X
- 通過：X
- 失敗：X
- 跳過：X

### 問題標記統計
- .skip 標記：X 處
- .only 標記：X 處
- TODO 標記：X 處
- FIXME 標記：X 處
```

### 4.2 問題追蹤

如發現問題，記錄於此：

| 問題編號 | 類型 | 位置 | 描述 | 狀態 |
|---------|------|------|------|------|
| P001 | | | | |

---

## 驗收標準

- [ ] 後端所有測試通過
- [ ] 前端所有測試通過
- [ ] 無未處理的 .skip/.only 標記
- [ ] 抽樣工單全部達到 126 分門檻
- [ ] Git 變更驗證無異常
- [ ] 完成測試執行摘要報告

---

## 附錄：快速指令

```bash
# 執行全部測試
cd backend && npm test
cd frontend && npm test -- --watchAll=false

# 搜尋問題標記
grep -rn "\.skip\|\.only" --include="*.test.js" .
grep -rn "TODO\|FIXME" --include="*.test.js" .

# 查看工單相關 commit
git log --oneline | head -20

# 查看特定 commit 變更
git show <commit_hash> --stat
git show <commit_hash> -- <file_path>
```
