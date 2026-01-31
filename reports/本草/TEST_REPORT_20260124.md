# 測試報告

**日期**: 2026-01-24
**專案**: Herbalism 桌遊網頁版
**測試類型**: 單元測試 + 整合測試

---

## 一、測試摘要

| 項目 | 結果 |
|------|------|
| 測試套件 | 26 個全部通過 |
| 測試案例 | 663 個全部通過 |
| 測試時間 | 12.233 秒 |

---

## 二、覆蓋率報告

### 總體覆蓋率

| 指標 | 覆蓋率 | 目標 | 狀態 |
|------|--------|------|------|
| Statements | 78.63% | 85% | ⚠️ 未達標 |
| Branch | 70.18% | 85% | ⚠️ 未達標 |
| Functions | 79.71% | 85% | ⚠️ 未達標 |
| Lines | 79.24% | 85% | ⚠️ 未達標 |

### 高覆蓋率模組（≥90%）

| 檔案 | Statements | Branch | Functions |
|------|------------|--------|-----------|
| gameStore.js | 100% | 100% | 100% |
| apiService.js | 100% | 100% | 100% |
| friendService.js | 100% | 100% | 100% |
| AuthContext.js | 100% | 100% | 100% |
| Profile.js | 100% | 80% | 100% |
| validation.js | 100% | 100% | 100% |
| performance.js | 100% | 100% | 100% |
| guessAction.js | 100% | 100% | 100% |
| cardUtils.js | 100% | 87.5% | 100% |
| GameBoard.js | 97.36% | 93.61% | 100% |
| Leaderboard.js | 96.66% | 91.66% | 88.88% |
| Login.js | 95.65% | 75% | 100% |
| socketService.js | 93.2% | 70% | 89.58% |
| GameStatus.js | 90.9% | 82.35% | 100% |

### 低覆蓋率模組（需改善）

| 檔案 | Statements | 問題說明 |
|------|------------|----------|
| Friends.js | 0% | 尚無測試 |
| authService.js | 0% | Firebase SDK 難以 mock |
| firebase/config.js | 0% | 配置檔無需測試 |
| Lobby.js | 66.44% | 複雜的 Socket 互動 |
| GameRoom.js | 74.34% | 多種遊戲狀態處理 |
| QuestionCard.js | 78.36% | 分支條件過多 |

---

## 三、發現的問題

### 1. React 測試警告

**問題**: Lobby 組件測試出現 `act()` 警告

```
Warning: An update to Lobby inside a test was not wrapped in act(...)
```

**原因**: Socket.io 事件回調觸發的狀態更新未包在 `act()` 中

**影響**: 不影響測試結果，但可能導致測試不穩定

**建議**: 使用 `waitFor` 等待狀態更新完成

---

### 2. Worker 進程未正常退出

**問題**:
```
A worker process has failed to exit gracefully and has been force exited.
This is likely caused by tests leaking due to improper teardown.
```

**原因**:
- Socket 連線未在測試後正確斷開
- 計時器（setTimeout/setInterval）未清理

**影響**: 測試結束稍有延遲

**建議**:
- 在 `afterEach` 中呼叫 `disconnect()`
- 使用 `jest.useFakeTimers()` 管理計時器

---

### 3. Redux Selector 警告

**問題**: GameRoom 測試出現 selector 不穩定警告

```
Selector unknown returned a different result when called with the same parameters
```

**原因**: useSelector 返回新物件引用

**影響**: 可能造成不必要的重新渲染

**建議**: 使用 `createSelector` 做記憶化

---

### 4. React Router 未來版本警告

**問題**:
```
React Router will begin wrapping state updates in `React.startTransition` in v7
```

**影響**: 無，僅為升級提醒

**建議**: 升級到 React Router v7 時加入 future flag

---

## 四、新增測試檔案

本次測試新增以下測試檔案：

| 檔案 | 測試數量 | 覆蓋模組 |
|------|----------|----------|
| Leaderboard.test.js | 14 | 排行榜頁面 |
| Profile.test.js | 15 | 個人資料頁面 |
| apiService.test.js | 12 | API 服務層 |
| socketService.test.js | 29 | Socket 服務層 |
| friendService.test.js | 16 | 好友服務層 |
| AuthContext.test.js | 9 | 認證 Context |
| localStorage.test.js (增強) | 6 | 錯誤處理測試 |

---

## 五、建議後續行動

### 短期（優先）

1. **新增 Friends.js 測試**
   - 目前覆蓋率 0%
   - 需 mock Socket 事件

2. **補充 GameRoom.js 測試**
   - 覆蓋遊戲狀態切換邏輯
   - 覆蓋跟猜機制

3. **補充 QuestionCard.js 測試**
   - 覆蓋問牌類型選擇
   - 覆蓋顏色選擇邏輯

### 中期

4. **修復測試警告**
   - 包裝 Socket 回調在 `act()` 中
   - 確保測試後清理資源

5. **優化 Selector**
   - 使用 createSelector 做記憶化
   - 避免在 render 中創建新物件

---

## 六、測試環境

- **Node.js**: 18.x
- **React**: 18.x
- **Jest**: 29.x
- **Testing Library**: @testing-library/react

---

## 七、結論

目前測試覆蓋率為 **78.63%**，距離目標 85% 還有差距。主要原因是：

1. 部分新功能（好友系統）尚無測試
2. 複雜組件（GameRoom、Lobby）的分支覆蓋不完整
3. Firebase SDK 相關程式碼難以測試

建議優先補充 Friends.js 和 GameRoom.js 的測試，以提升整體覆蓋率。

---

*報告生成時間: 2026-01-24*
