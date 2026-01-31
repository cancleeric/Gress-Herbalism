# 工作單 0162

**建立日期**: 2026-01-27

**優先級**: P1 (重要)

**標題**: Redux Selector 記憶化優化

---

## 一、工作目標

使用 `createSelector` 優化 GameRoom 組件中的 Redux selector，消除不必要的重新渲染和控制台警告。

---

## 二、問題描述

### 現象
控制台警告：
```
Selector unknown returned a different result when called with the same parameters.
This can lead to unnecessary rerenders.
```

### 根本原因
```javascript
// GameRoom.js:116-126
const gameState = useSelector((state) => ({
  storeGameId: state.gameId,
  players: state.players,
  // ...每次渲染創建新物件
}));
```

每次 useSelector 調用都會創建新的物件，即使 state 內容沒變，物件引用也不同，導致組件重新渲染。

### 影響
- 效能問題
- 測試不穩定
- 控制台警告影響開發體驗

---

## 三、實施計畫

### 3.1 修改/新增檔案
- `frontend/src/store/selectors.js` (新增)
- `frontend/src/components/GameRoom/GameRoom.js` (修改)

### 3.2 實施內容

#### 3.2.1 建立 selectors.js

```javascript
// frontend/src/store/selectors.js

import { createSelector } from '@reduxjs/toolkit';

/**
 * 基礎 selector - 取得完整 state
 */
const selectGameState = (state) => state;

/**
 * 遊戲房間狀態 selector
 * 使用 createSelector 進行記憶化
 */
export const selectGameRoomState = createSelector(
  [selectGameState],
  (game) => ({
    storeGameId: game.gameId,
    players: game.players,
    currentPlayerIndex: game.currentPlayerIndex,
    gamePhase: game.gamePhase,
    winner: game.winner,
    hiddenCards: game.hiddenCards,
    gameHistory: game.gameHistory,
    currentPlayerId: game.currentPlayerId,
    maxPlayers: game.maxPlayers
  })
);

/**
 * 當前玩家 selector
 */
export const selectCurrentPlayer = createSelector(
  [selectGameState],
  (game) => {
    if (!game.players || game.currentPlayerIndex === undefined) {
      return null;
    }
    return game.players[game.currentPlayerIndex] || null;
  }
);

/**
 * 遊戲進行中的玩家 selector
 */
export const selectActivePlayers = createSelector(
  [selectGameState],
  (game) => {
    if (!game.players) return [];
    return game.players.filter(p => p.isActive);
  }
);

/**
 * 遊戲歷史記錄 selector
 */
export const selectGameHistory = createSelector(
  [selectGameState],
  (game) => game.gameHistory || []
);

/**
 * 遊戲是否結束 selector
 */
export const selectIsGameFinished = createSelector(
  [selectGameState],
  (game) => game.gamePhase === 'finished'
);

/**
 * 遊戲是否在等待階段 selector
 */
export const selectIsWaitingPhase = createSelector(
  [selectGameState],
  (game) => game.gamePhase === 'waiting'
);

/**
 * 勝利者 selector
 */
export const selectWinner = createSelector(
  [selectGameState],
  (game) => game.winner
);
```

#### 3.2.2 修改 GameRoom.js

```javascript
// 修改 import
import { useSelector, useDispatch } from 'react-redux';
import { selectGameRoomState, selectCurrentPlayer } from '../../store/selectors';

// 修改 useSelector 使用
// 修改前
const gameState = useSelector((state) => ({
  storeGameId: state.gameId,
  players: state.players,
  currentPlayerIndex: state.currentPlayerIndex,
  gamePhase: state.gamePhase,
  winner: state.winner,
  hiddenCards: state.hiddenCards,
  gameHistory: state.gameHistory,
  currentPlayerId: state.currentPlayerId,
  maxPlayers: state.maxPlayers
}));

// 修改後
const gameState = useSelector(selectGameRoomState);
```

#### 3.2.3 確認 @reduxjs/toolkit 已安裝

```bash
cd frontend
npm list @reduxjs/toolkit
# 如果未安裝
npm install @reduxjs/toolkit
```

---

## 四、測試計畫

### 4.1 單元測試
建立 `selectors.test.js`：

```javascript
// frontend/src/store/__tests__/selectors.test.js

import {
  selectGameRoomState,
  selectCurrentPlayer,
  selectActivePlayers
} from '../selectors';

describe('Redux Selectors', () => {
  const mockState = {
    gameId: 'test-game',
    players: [
      { id: '1', name: 'P1', isActive: true },
      { id: '2', name: 'P2', isActive: false },
      { id: '3', name: 'P3', isActive: true }
    ],
    currentPlayerIndex: 0,
    gamePhase: 'playing',
    winner: null,
    hiddenCards: ['red', 'blue'],
    gameHistory: [],
    currentPlayerId: '1',
    maxPlayers: 4
  };

  describe('selectGameRoomState', () => {
    test('應返回正確的遊戲狀態', () => {
      const result = selectGameRoomState(mockState);
      expect(result.storeGameId).toBe('test-game');
      expect(result.players).toHaveLength(3);
    });

    test('相同輸入應返回相同引用（記憶化）', () => {
      const result1 = selectGameRoomState(mockState);
      const result2 = selectGameRoomState(mockState);
      expect(result1).toBe(result2);
    });
  });

  describe('selectCurrentPlayer', () => {
    test('應返回當前玩家', () => {
      const result = selectCurrentPlayer(mockState);
      expect(result.id).toBe('1');
    });

    test('players 為空時應返回 null', () => {
      const result = selectCurrentPlayer({ ...mockState, players: [] });
      expect(result).toBeNull();
    });
  });

  describe('selectActivePlayers', () => {
    test('應只返回活躍玩家', () => {
      const result = selectActivePlayers(mockState);
      expect(result).toHaveLength(2);
      expect(result.every(p => p.isActive)).toBe(true);
    });
  });
});
```

### 4.2 整合測試
- 確認 GameRoom 渲染時不再出現 selector 警告

### 4.3 效能測試
- 使用 React DevTools Profiler 確認減少了不必要的渲染

---

## 五、驗收標準

1. `selectors.js` 已建立並導出所有必要的 selector
2. GameRoom 使用新的 memoized selector
3. 控制台不再出現 selector 警告
4. 所有相關測試通過
5. React DevTools 顯示渲染次數減少

---

## 六、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| createSelector 行為差異 | 低 | 低 | 完整測試驗證 |
| 遺漏某些 selector 使用處 | 中 | 低 | 全專案搜尋 useSelector |

---

## 七、相關工單

- 依賴: 無
- 被依賴: 無

---

*工單建立時間: 2026-01-27*
