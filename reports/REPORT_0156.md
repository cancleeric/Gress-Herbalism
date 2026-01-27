# 報告書 0156

**工作單編號**：0156

**完成日期**：2026-01-27

**工作單標題**：E2E 測試 - 核心遊戲流程端對端測試

---

## 一、完成內容摘要

本工單執行核心遊戲流程的 E2E 測試。

### 測試執行結果

| 測試模組 | 測試狀態 | 通過/總數 |
|---------|---------|-----------|
| SinglePlayerMode.test.js | ❌ 失敗 | 1/14 |
| SinglePlayerURLParsing.test.js | ❌ 失敗 | 1/9 |

---

## 二、測試數據

### 2.1 E2E 測試結果
```
Test Suites: 2 failed, 2 total
Tests:       21 failed, 2 passed, 23 total
Time:        3.757 s
```

### 2.2 失敗原因分析

#### 主要錯誤：AuthProvider 缺失
```
useAuth must be used within an AuthProvider
at useAuth (src/firebase/AuthContext.js:98:11)
at GameRoom (src/components/GameRoom/GameRoom.js:192:37)
```

**失敗的測試案例**：
- 單人模式初始化測試
- AI 玩家創建測試
- 問牌流程測試
- 猜牌流程測試
- 跟猜流程測試
- 預測流程測試
- 邊界情況測試
- 完整遊戲流程測試

---

## 三、遇到的問題與解決方案

### 問題 1：測試環境缺少 AuthProvider (嚴重)
- **描述**：E2E 測試沒有正確設置 AuthProvider
- **原因**：測試的 render wrapper 沒有包含 AuthProvider
- **影響**：所有需要認證的組件測試都會失敗
- **建議解決方案**：
```javascript
// 建立測試 wrapper
const TestWrapper = ({ children }) => (
  <Provider store={store}>
    <AuthProvider>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </AuthProvider>
  </Provider>
);

// 使用 wrapper 渲染
render(<GameRoom />, { wrapper: TestWrapper });
```

### 問題 2：Redux Selector 警告
- **描述**：每次渲染返回新的物件引用
- **影響**：可能導致效能問題和測試不穩定
- **建議**：使用 createSelector 做記憶化

### 問題 3：useAIPlayers 無限循環 (嚴重)
- **描述**：在之前的測試中發現 useAIPlayers hook 造成無限更新
- **錯誤訊息**：
```
Warning: Maximum update depth exceeded. This can happen when a component
calls setState inside useEffect, but useEffect either doesn't have a
dependency array, or one of the dependencies changes on every render.
```
- **位置**：`src/hooks/useAIPlayers.js:57`
- **建議**：
```javascript
// 修改 useEffect 的依賴陣列
// 避免在 effect 中使用會變化的引用
useEffect(() => {
  // 使用穩定的依賴
}, [aiConfig.aiCount]); // 而非 [aiConfig]
```

---

## 四、驗收標準檢查

| 標準 | 狀態 |
|------|------|
| 所有 19 個 E2E 測試案例通過 | ❌ 2/23 通過 |
| 多瀏覽器實例協調正確 | ⚠️ 無法驗證（測試失敗） |
| 測試環境穩定 | ❌ 環境設置不完整 |
| 無超時或競態問題 | ⚠️ 有無限循環問題 |
| 測試可重複執行 | ❌ 不穩定 |

---

## 五、需要修復的問題優先級

| 優先級 | 問題 | 檔案 |
|--------|------|------|
| P0 | AuthProvider 缺失 | E2E 測試 wrapper |
| P0 | useAIPlayers 無限循環 | useAIPlayers.js:57 |
| P1 | Redux selector 記憶化 | GameRoom.js |

---

## 六、下一步計劃

1. **立即修復**：建立正確的測試 wrapper 包含 AuthProvider
2. **立即修復**：修復 useAIPlayers 的無限循環問題
3. 重新執行 E2E 測試驗證修復
4. 補充多人遊戲的 E2E 測試（需要 Playwright）

---

*報告生成時間: 2026-01-27*
