# BUG 修復計畫書

**日期**: 2026-01-27
**專案**: Herbalism 桌遊網頁版
**撰寫者**: Claude Code
**依據**: COMPREHENSIVE_TEST_REPORT_20260127.md

---

## 一、計畫概述

根據完整測試報告，本計畫針對發現的 9 個問題進行修復，分為三個優先級：
- **P0 (嚴重)**: 3 個 - 必須立即修復
- **P1 (重要)**: 3 個 - 本週修復
- **P2 (中等)**: 3 個 - 本月修復

---

## 二、問題分析與修復方案

### 2.1 P0-001: Socket cleanup 函數未定義

**問題位置**: `frontend/src/components/GameRoom/GameRoom.js:585`

**問題描述**:
```javascript
// 現有程式碼
const unsubPlayerLeft = onPlayerLeft(({ playerId, playerName }) => {
  console.log(`[房間] 玩家 ${playerName} 離開了房間`);
});

return () => {
  // ...
  unsubPlayerLeft();  // TypeError: unsubPlayerLeft is not a function
  // ...
};
```

**根本原因**:
`socketService.js` 中的 `onPlayerLeft()` 函數在某些情況下（如 socket 尚未初始化）可能返回 `undefined`。當組件 unmount 時調用 `undefined()` 會拋出 TypeError。

**影響範圍**:
- GameRoom 組件 unmount 時會報錯
- 可能導致記憶體洩漏（事件監聽器未被正確移除）
- 15 個 GameRoom 相關測試失敗

**修復方案**:

**方案 A (推薦)**: 在 socketService 中確保所有 `on*` 函數返回有效的 unsubscribe 函數
```javascript
// socketService.js
export function onPlayerLeft(callback) {
  const s = getSocket();
  if (!s) {
    return () => {}; // 返回空函數而非 undefined
  }
  s.on('playerLeft', callback);
  return () => s.off('playerLeft', callback);
}
```

**方案 B**: 在 GameRoom 中加入空值保護
```javascript
// GameRoom.js
const unsubPlayerLeft = onPlayerLeft(handler) || (() => {});
```

**選擇**: 採用方案 A，因為這是根本解決方案，可以防止所有調用處出現同樣問題。

---

### 2.2 P0-002: useAIPlayers 無限循環

**問題位置**: `frontend/src/hooks/useAIPlayers.js:37-65`

**問題描述**:
```javascript
// 現有程式碼
useEffect(() => {
  // ...創建 AI 玩家...
  setAIPlayers(players);  // 觸發重新渲染
}, [aiConfig]);  // aiConfig 是每次渲染創建的新物件
```

**根本原因**:
`aiConfig` 是一個物件，每次 GameRoom 渲染時都會創建新的物件引用。即使內容相同，引用不同也會觸發 useEffect 重新執行，進而調用 `setAIPlayers` 導致組件重新渲染，形成無限循環。

**影響範圍**:
- 瀏覽器卡頓/當機
- 測試無法完成（Maximum update depth exceeded）
- 需要跳過 useAIPlayers 相關測試

**修復方案**:

**方案 A (推薦)**: 使用原始值作為依賴
```javascript
useEffect(() => {
  if (!aiConfig || !aiConfig.aiCount || aiConfig.aiCount === 0) {
    setAIPlayers([]);
    aiPlayersRef.current = [];
    return;
  }
  // ...創建 AI 玩家...
}, [aiConfig?.aiCount, JSON.stringify(aiConfig?.difficulties)]);
```

**方案 B**: 使用 useRef 防止重複初始化
```javascript
const initializedRef = useRef(false);
const aiConfigRef = useRef(null);

useEffect(() => {
  // 深度比較 aiConfig
  if (initializedRef.current &&
      JSON.stringify(aiConfigRef.current) === JSON.stringify(aiConfig)) {
    return;
  }

  initializedRef.current = true;
  aiConfigRef.current = aiConfig;

  // ...創建 AI 玩家...
}, [aiConfig]);
```

**選擇**: 採用方案 A，因為它更簡潔且符合 React 最佳實踐。

---

### 2.3 P0-003: E2E 測試缺少 AuthProvider

**問題位置**: `frontend/src/__tests__/e2e/SinglePlayerMode.test.js`

**問題描述**:
```
Error: useAuth must be used within an AuthProvider
at useAuth (src/firebase/AuthContext.js:98:11)
at GameRoom (src/components/GameRoom/GameRoom.js:192:37)
```

**根本原因**:
E2E 測試的 render 函數沒有提供必要的 Context Providers，包括 AuthProvider。

**影響範圍**:
- 21/23 E2E 測試失敗
- 無法驗證核心遊戲流程

**修復方案**:

建立統一的測試 Wrapper：
```javascript
// frontend/src/__tests__/testUtils.js
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../firebase/AuthContext';
import { createStore } from 'redux';
import { gameReducer, initialState } from '../../store/gameStore';

// Mock AuthProvider for tests
const MockAuthProvider = ({ children }) => {
  const mockAuthValue = {
    user: { uid: 'test-user-id', displayName: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    loginAnonymously: jest.fn()
  };

  return (
    <AuthContext.Provider value={mockAuthValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const TestWrapper = ({ children, initialState: customState }) => {
  const store = createStore(gameReducer, { ...initialState, ...customState });

  return (
    <Provider store={store}>
      <MockAuthProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </MockAuthProvider>
    </Provider>
  );
};

// 自訂 render 函數
export const renderWithProviders = (ui, options = {}) => {
  const { initialState, ...renderOptions } = options;
  return render(ui, {
    wrapper: (props) => <TestWrapper {...props} initialState={initialState} />,
    ...renderOptions
  });
};
```

---

### 2.4 P1-001: Redux Selector 記憶化

**問題位置**: `frontend/src/components/GameRoom/GameRoom.js:116-126`

**問題描述**:
```javascript
// 現有程式碼 - 每次渲染創建新物件
const gameState = useSelector((state) => ({
  storeGameId: state.gameId,
  players: state.players,
  // ...
}));
```

控制台警告:
```
Selector unknown returned a different result when called with the same parameters.
```

**根本原因**:
useSelector 中直接返回新物件，即使 state 內容沒變，每次渲染都會創建新的物件引用，導致不必要的重新渲染。

**影響範圍**:
- 效能問題（不必要的重新渲染）
- 測試不穩定

**修復方案**:

**方案 A (推薦)**: 使用 createSelector
```javascript
// frontend/src/store/selectors.js
import { createSelector } from '@reduxjs/toolkit';

const selectGame = (state) => state;

export const selectGameState = createSelector(
  [selectGame],
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

// GameRoom.js 中使用
import { selectGameState } from '../../store/selectors';
const gameState = useSelector(selectGameState);
```

**方案 B**: 使用 shallowEqual
```javascript
import { shallowEqual, useSelector } from 'react-redux';

const gameState = useSelector(
  (state) => ({ /* ... */ }),
  shallowEqual
);
```

**選擇**: 採用方案 A，因為 createSelector 提供更好的記憶化效果和可重用性。

---

### 2.5 P1-002: MediumAI 決策邏輯錯誤

**問題位置**: `frontend/src/ai/strategies/MediumStrategy.js:56-72`

**問題描述**:
整合測試 `should guess when confidence is high` 失敗：
```
Expected: "question"
Received: "guess"
```

當信心度不足時（例如 0.247 < 0.6），AI 應該選擇「問牌」而非「猜牌」，但測試顯示 AI 選擇了「猜牌」。

**根本原因**:
經分析 `MediumStrategy.js`，邏輯本身是正確的（信心度 >= 0.6 才猜牌）。問題可能出在：
1. `calculateJointProbability` 計算結果不正確
2. `InformationTracker` 中的概率資訊不正確
3. 測試設置的前置條件不正確

**修復方案**:

1. **調查階段**：
   - 在 MediumStrategy 中加入調試日誌
   - 驗證 `calculateJointProbability` 返回值
   - 檢查 `InformationTracker.processEvent` 是否正確更新概率

2. **可能的修復**：
```javascript
// MediumStrategy.js - 加入更嚴格的檢查
decideAction(gameState, knowledge) {
  if (this.mustGuess(gameState, this.selfId)) {
    console.log('[MediumAI] 強制猜牌：只剩自己一人');
    return ACTION_TYPE.GUESS;
  }

  const confidence = this.calculateConfidence(knowledge);
  console.log('[MediumAI] 計算信心度:', confidence, '閾值:', this.guessConfidenceThreshold);

  // 確保信心度是有效數字
  if (typeof confidence !== 'number' || isNaN(confidence)) {
    console.log('[MediumAI] 信心度無效，選擇問牌');
    return ACTION_TYPE.QUESTION;
  }

  if (confidence >= this.guessConfidenceThreshold) {
    console.log('[MediumAI] 信心度足夠，選擇猜牌');
    return ACTION_TYPE.GUESS;
  }

  console.log('[MediumAI] 信心度不足，選擇問牌');
  return ACTION_TYPE.QUESTION;
}
```

3. **檢查 BaseStrategy.calculateJointProbability**：確認計算公式正確

---

### 2.6 P1-003: server.js 無測試覆蓋

**問題位置**: `backend/server.js` (1837 行)

**問題描述**:
後端核心邏輯檔案完全沒有測試覆蓋率，所有 Socket 事件處理、遊戲邏輯都集中在這個巨大檔案中。

**影響範圍**:
- 後端整體覆蓋率僅 15.53%
- 核心遊戲邏輯（問牌、猜牌、跟猜）無測試保護
- 重構風險高

**修復方案** (架構重構):

```
backend/
├── server.js              # 簡化為：啟動伺服器、建立 Socket 連線
├── handlers/
│   ├── index.js           # 統一導出
│   ├── roomHandler.js     # 房間管理：創建、加入、離開
│   ├── gameHandler.js     # 遊戲流程：開始、結束、下一局
│   ├── questionHandler.js # 問牌處理：三種問牌類型
│   └── guessHandler.js    # 猜牌處理：猜牌、跟猜
├── logic/
│   ├── gameLogic.js       # 遊戲規則驗證
│   ├── cardLogic.js       # 牌組初始化、發牌
│   └── scoreLogic.js      # 計分邏輯
└── services/              # 現有服務（已有良好測試）
```

**實施步驟**:
1. 建立 handlers 資料夾結構
2. 逐步提取 server.js 中的邏輯到對應 handler
3. 為每個 handler 建立單元測試
4. 確保提取後原有功能不變

---

### 2.7 P2-001: Friends.js 覆蓋率 0%

**問題位置**: `frontend/src/components/Friends/Friends.js`

**問題描述**:
好友組件完全沒有測試覆蓋。

**修復方案**:
建立 `Friends.test.js`，測試以下功能：
- 好友列表渲染
- 搜尋功能
- 發送/接受/拒絕好友請求
- 在線狀態顯示
- 邀請加入遊戲

---

### 2.8 P2-002: Lobby.js 覆蓋率 66%

**問題位置**: `frontend/src/components/Lobby/Lobby.js`

**問題描述**:
大廳組件有 34% 的分支未被測試覆蓋。

**修復方案**:
補充以下測試場景：
- 創建密碼房間
- 加入密碼房間（密碼正確/錯誤）
- 房間列表更新
- 邊界情況（房間已滿、房間不存在）

---

### 2.9 P2-003: 測試執行時間優化

**問題位置**: `backend/__tests__/reconnection.test.js`

**問題描述**:
重連測試需要 102 秒執行，因為測試實際等待超時時間。

**修復方案**:
```javascript
// 使用 Jest 假計時器
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('斷線超過 60 秒應標記為不活躍', async () => {
  // 不再等待真實的 60 秒
  jest.advanceTimersByTime(60000);
  // 驗證結果
});
```

---

## 三、實施計畫

### 3.1 工單規劃

| 工單編號 | 優先級 | 標題 | 依賴 |
|---------|--------|------|------|
| 0159 | P0 | 修復 socketService 返回值問題 | 無 |
| 0160 | P0 | 修復 useAIPlayers 無限循環 | 無 |
| 0161 | P0 | 建立 E2E 測試基礎設施 | 無 |
| 0162 | P1 | Redux Selector 記憶化優化 | 無 |
| 0163 | P1 | MediumAI 決策邏輯調查與修復 | 無 |
| 0164 | P1 | server.js 架構重構 (階段一) | 無 |
| 0165 | P2 | Friends.js 測試補充 | 無 |
| 0166 | P2 | Lobby.js 測試補充 | 無 |
| 0167 | P2 | 測試執行時間優化 | 無 |

### 3.2 執行順序

**第一階段** (P0 - 立即執行):
1. 工單 0159、0160、0161 可並行執行
2. 完成後執行全部測試驗證

**第二階段** (P1 - 本週):
1. 工單 0162、0163 可並行執行
2. 工單 0164 需較長時間，可分多次完成

**第三階段** (P2 - 本月):
1. 工單 0165、0166、0167 可並行執行

### 3.3 驗收標準

修復完成後需達到：
- [ ] 前端單元測試 100% 通過
- [ ] E2E 測試 100% 通過
- [ ] 後端測試 100% 通過
- [ ] 前端整體覆蓋率 > 80%
- [ ] 無 console 錯誤或警告

---

## 四、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| 修復引入新 bug | 中 | 高 | 完整測試覆蓋、程式碼審查 |
| server.js 重構影響現有功能 | 高 | 高 | 逐步重構、保持向後相容 |
| 測試環境差異導致問題 | 低 | 中 | CI/CD 環境一致性檢查 |

---

## 五、附錄

### 5.1 相關檔案

- `reports/COMPREHENSIVE_TEST_REPORT_20260127.md` - 完整測試報告
- `reports/REPORT_0152.md` - 前端核心組件測試報告
- `reports/REPORT_0156.md` - E2E 測試報告
- `docs/GAME_RULES.md` - 遊戲規則

### 5.2 參考資料

- React useSelector 最佳實踐
- Jest Fake Timers 文檔
- Redux createSelector 文檔

---

*計畫建立時間: 2026-01-27*
*計畫撰寫者: Claude Code*
