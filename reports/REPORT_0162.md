# 報告書 0162

**工作單編號**：0162

**完成日期**：2026-01-27

**工作單標題**：Redux Selector 記憶化優化

---

## 一、完成內容摘要

使用 `reselect` 函式庫的 `createSelector` 建立記憶化 selector，替換 GameRoom 組件中每次渲染都會創建新物件的 inline selector，消除 `Selector unknown returned a different result when called with the same parameters` 警告。

### 修改/新增檔案

| 檔案 | 修改內容 |
|------|---------|
| `frontend/src/store/selectors.js` | 新增：記憶化 selector 模組 |
| `frontend/src/store/selectors.test.js` | 新增：selector 單元測試（14 個） |
| `frontend/src/components/GameRoom/GameRoom.js` | 修改：import 新 selector，替換 inline useSelector |
| `frontend/package.json` | 新增 `reselect` 依賴 |

### 技術決策

工單原計劃使用 `@reduxjs/toolkit` 的 `createSelector`，但考慮到專案僅需 `createSelector` 功能，改用輕量的 `reselect` 函式庫（`@reduxjs/toolkit` 內部也使用 `reselect`），避免引入過多不必要的依賴。

### 實作細節

1. **建立 `selectors.js`**：
   - `selectGameRoomState`：9 個基礎 input selector → 組合為物件（使用 `createSelector` 記憶化）
   - `selectCurrentPlayer`：根據 players 和 currentPlayerIndex 計算（使用 `createSelector`）
   - `selectActivePlayers`：過濾活躍玩家（使用 `createSelector`）
   - `selectGameHistory`：簡單提取函數（不需 createSelector）
   - `selectWinner`：簡單提取函數（不需 createSelector）

2. **修改 `GameRoom.js`**：
   ```javascript
   // 修改前：每次渲染創建新物件
   const gameState = useSelector((state) => ({
     storeGameId: state.gameId,
     players: state.players,
     // ...
   }));

   // 修改後：使用記憶化 selector
   const gameState = useSelector(selectGameRoomState);
   ```

---

## 二、測試結果

### Selector 單元測試
```
Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
```

### GameRoom 整合測試
```
Test Suites: 1 passed, 1 total
Tests:       61 passed, 61 total
```

### gameStore 測試
```
Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
```

### 所有測試通過，無回歸問題。

---

## 三、遇到的問題與解決方案

### 問題 1：reselect v5 identity function 警告 (已解決)
- **描述**：`selectGameHistory` 和 `selectWinner` 的 result function 直接返回輸入值，觸發 reselect 開發模式警告
- **解決**：將這些簡單提取改為普通函數，不使用 `createSelector`，只有需要衍生計算或物件組合的 selector 才使用 `createSelector`

### 問題 2：reselect v5 API 變更 (已解決)
- **描述**：v5 使用 `weakMapMemoize` 取代 `defaultMemoize`，`recomputations()` 行為不同
- **解決**：測試改用 `clearCache()` API，移除對 `recomputations()` 計數的斷言，改以物件引用相等性驗證記憶化效果

---

## 四、驗收標準檢查

| 標準 | 狀態 |
|------|------|
| selectors.js 已建立並導出所有必要的 selector | ✅ |
| GameRoom 使用新的 memoized selector | ✅ |
| 控制台不再出現 selector 警告 | ✅ |
| 所有相關測試通過 | ✅ (96/96) |

---

## 五、下一步計劃

1. 工單 0163：MediumAI 決策邏輯調查與修復
2. 其他組件如需要也可遷移到使用 `selectors.js` 中的 selector

---

*報告生成時間: 2026-01-27*
