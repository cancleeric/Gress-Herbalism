# 報告書 0152

**工作單編號**：0152

**完成日期**：2026-01-27

**工作單標題**：單元測試 - 前端核心遊戲組件

---

## 一、完成內容摘要

本工單測試範圍涵蓋前端核心遊戲組件。

### 測試執行結果

| 組件 | 測試狀態 | 問題 |
|------|---------|------|
| GameRoom | ❌ 失敗 | `unsubPlayerLeft is not a function` |
| QuestionFlow | ✅ 通過 | - |
| GuessCard | ✅ 通過 | - |
| Prediction | ✅ 通過 | - |
| PlayerHand | ✅ 通過 | - |
| GameBoard | ✅ 通過 | - |
| ColorCombinationCards | ✅ 通過 | - |

---

## 二、測試數據

### 2.1 前端測試結果
```
Test Suites: 44 passed, 18 failed, 62 total
Tests:       1207 passed, 112 failed, 1319 total
Time:        16.464 s
```

### 2.2 失敗測試分析

#### GameRoom 組件測試失敗（15 個測試）
**錯誤訊息**：
```
TypeError: unsubPlayerLeft is not a function
at src/components/GameRoom/GameRoom.js:585:7
```

**失敗的測試案例**：
- 等待階段渲染測試
- 遊戲進行中渲染測試
- 房主開始遊戲測試
- Socket 事件處理測試
- 遊戲紀錄顯示測試
- 顏色牌禁用邏輯測試

---

## 三、遇到的問題與解決方案

### 問題 1：Socket 取消訂閱函數未定義 (嚴重)
- **描述**：`unsubPlayerLeft` 在 cleanup 時不是函數
- **原因**：`socketService.on('playerLeft', ...)` 可能在某些情況下返回 `undefined` 而非取消訂閱函數
- **位置**：`GameRoom.js:585`
- **影響**：組件 unmount 時會拋出錯誤，可能導致記憶體洩漏
- **建議解決方案**：
```javascript
// 修改前
const unsubPlayerLeft = socketService.on('playerLeft', handler);

// 修改後
const unsubPlayerLeft = socketService.on('playerLeft', handler) || (() => {});
```

### 問題 2：Redux Selector 警告
- **描述**：`Selector unknown returned a different result when called with the same parameters`
- **原因**：useSelector 在每次渲染時返回新的物件引用
- **影響**：造成不必要的重新渲染
- **建議**：使用 `createSelector` 做記憶化
```javascript
import { createSelector } from '@reduxjs/toolkit';

const selectGameState = createSelector(
  [(state) => state.game],
  (game) => ({
    storeGameId: game.gameId,
    players: game.players,
    // ...
  })
);
```

---

## 四、驗收標準檢查

| 標準 | 狀態 |
|------|------|
| 所有 48 個測試案例通過 | ❌ 15 個失敗 |
| 覆蓋率達到 80% | ⚠️ 無法準確計算（測試失敗） |
| 無 console 錯誤或警告 | ❌ 有錯誤和警告 |
| 所有組件邏輯正確測試 | ⚠️ GameRoom 需修復 |

---

## 五、發現的程式碼問題

### 5.1 需要修復的 Bug

| 優先級 | 檔案 | 問題描述 |
|--------|------|----------|
| 高 | GameRoom.js:585 | Socket cleanup 函數可能為 undefined |
| 中 | GameRoom.js:116 | Redux selector 需要 memoization |

---

## 六、下一步計劃

1. **立即修復**：Socket cleanup 函數的空值檢查
2. **短期改善**：使用 createSelector 優化 Redux selectors
3. **補充測試**：修復後重新執行 GameRoom 測試

---

*報告生成時間: 2026-01-27*
