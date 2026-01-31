# 報告書 0160

**工作單編號**：0160

**完成日期**：2026-01-27

**工作單標題**：修復 useAIPlayers 無限循環

---

## 一、完成內容摘要

修復 `useAIPlayers.js` hook 中的 useEffect 無限循環問題。將不穩定的 `aiConfig` 物件依賴替換為穩定的原始值依賴。

### 修改內容
- 從 `aiConfig` 物件中提取 `aiCount`（數字）和 `difficultiesKey`（JSON 字串）作為穩定依賴
- 使用 `useMemo` 確保 `difficultiesKey` 在相同內容時不會變化
- useEffect 改為依賴 `[aiCount, difficultiesKey]` 而非 `[aiConfig]`

---

## 二、測試結果

```
Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Time:        1.772 s
```

所有 16 個 useAIPlayers 測試通過，無 "Maximum update depth exceeded" 警告。

---

## 三、遇到的問題與解決方案

### 問題：物件引用作為 useEffect 依賴
- **描述**：`aiConfig` 是物件，每次 GameRoom 渲染都會建立新引用
- **解決**：將物件拆解為原始值 (`aiCount`) 和序列化字串 (`difficultiesKey`)
- **關鍵程式碼**：
```javascript
const aiCount = aiConfig?.aiCount || 0;
const difficultiesKey = useMemo(
  () => aiConfig?.difficulties ? JSON.stringify(aiConfig.difficulties) : '',
  [aiConfig?.difficulties]
);

useEffect(() => {
  // ...初始化邏輯
}, [aiCount, difficultiesKey]);
```

---

## 四、修改的檔案

| 檔案 | 修改內容 |
|------|---------|
| `frontend/src/hooks/useAIPlayers.js` | 修復 useEffect 依賴為穩定原始值 |

---

## 五、下一步計劃

1. 工單 0161：建立 E2E 測試基礎設施
2. 修復後可重新啟用單人模式功能測試

---

*報告生成時間: 2026-01-27*
