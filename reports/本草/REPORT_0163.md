# 報告書 0163

**工作單編號**：0163

**完成日期**：2026-01-27

**工作單標題**：MediumAI 決策邏輯調查與修復

---

## 一、完成內容摘要

調查 MediumAI 整合測試失敗的根本原因，並修復所有相關測試。

### 根本原因

測試使用的是舊的猜牌信心度閾值（0.6），但在先前的參數調整工單（REF: 202601250049）中，`AI_PARAMS.MEDIUM.guessConfidenceThreshold` 已從 0.6 調整為 0.2。原因是信心度計算使用聯合概率（p1 * p2），理論最大值僅約 0.25，因此 0.6 的閾值永遠不可達成。

**結論：AI 邏輯本身正確，問題出在測試未同步更新參數。**

### 修改檔案

| 檔案 | 修改內容 |
|------|---------|
| `MediumAI.integration.test.js` | 修正測試名稱與斷言，新增低信心度測試案例 |
| `MediumStrategy.test.js` | 更新閾值斷言 (0.6→0.2, 0.15→0.1) |
| `MediumAI.param-tuning.test.js` | 修正「不可達成」閾值的驗證邏輯 |

### 詳細修改

1. **MediumAI.integration.test.js**:
   - 原測試 `should guess when confidence is high`：名稱與斷言矛盾，且使用過時的閾值假設
   - 改為 `should guess when confidence exceeds threshold`：聯合概率 0.247 >= 閾值 0.2 → 猜牌
   - 新增 `should ask when confidence is below threshold`：排除較少顏色，聯合概率 0.139 < 0.2 → 問牌

2. **MediumStrategy.test.js**:
   - `guessConfidenceThreshold`：0.6 → 0.2
   - `followGuessProbThreshold`：0.15 → 0.1

3. **MediumAI.param-tuning.test.js**:
   - 閾值 >= 0.5 的配置：改為驗證「永遠不猜牌」(guessAttempts === 0)
   - 移除「至少問 3 次牌」的硬性要求（不同閾值有不同的猜牌時機）

---

## 二、測試結果

### 修改前
```
Test Suites: 2 failed, 1 passed, 3 total
Tests:       5 failed, 31 passed, 36 total
```

### 修改後
```
Test Suites: 3 passed, 3 total
Tests:       36 passed, 36 total
```

---

## 三、遇到的問題與解決方案

### 問題 1：測試與參數不同步 (已解決)
- **描述**：先前的參數調整工單修改了 `aiConfig.js` 中的閾值，但未同步更新所有相關測試
- **解決**：逐一檢查所有引用舊閾值的測試，更新為當前配置值

### 問題 2：測試名稱誤導 (已解決)
- **描述**：`should guess when confidence is high` 但斷言卻期望 `question`
- **解決**：重命名為 `should guess when confidence exceeds threshold`，並新增對應的低信心度測試

---

## 四、驗收標準檢查

| 標準 | 狀態 |
|------|------|
| 找出並記錄導致測試失敗的根本原因 | ✅ (測試未同步參數調整) |
| 修復邏輯錯誤 | ✅ (邏輯正確，修復測試) |
| 所有 MediumAI 相關測試通過 | ✅ (36/36) |
| 調試日誌可選擇性移除或保留為可配置 | N/A (無需添加) |

---

## 五、下一步計劃

1. 工單 0164：server.js 架構重構（階段一）
2. 建議：未來修改 `aiConfig.js` 參數時，應同步更新所有相關測試

---

*報告生成時間: 2026-01-27*
