# 工作單 0161

**建立日期**: 2026-01-27

**優先級**: P0 (嚴重)

**標題**: 建立 E2E 測試基礎設施

---

## 一、工作目標

建立統一的 E2E 測試基礎設施，包含正確的 Context Providers，使所有 E2E 測試能正常執行。

---

## 二、問題描述

### 現象
E2E 測試失敗，錯誤訊息：
```
Error: useAuth must be used within an AuthProvider
at useAuth (src/firebase/AuthContext.js:98:11)
at GameRoom (src/components/GameRoom/GameRoom.js:192:37)
```

### 根本原因
E2E 測試使用的 render 函數沒有提供必要的 Context Providers（AuthProvider、Redux Provider、Router）。

### 影響
- 21/23 E2E 測試失敗
- 無法驗證核心遊戲流程

---

## 三、實施計畫

### 3.1 新增檔案
- `frontend/src/__tests__/testUtils.js` - 統一的測試工具

### 3.2 實施內容

#### 3.2.1 建立 testUtils.js

```javascript
// frontend/src/__tests__/testUtils.js

import React, { createContext, useContext } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createStore } from 'redux';
import { gameReducer, initialState as defaultInitialState } from '../store/gameStore';

// 建立 Mock AuthContext
const MockAuthContext = createContext(null);

/**
 * Mock Auth Provider
 * 提供測試用的認證上下文
 */
export const MockAuthProvider = ({ children, authValue }) => {
  const defaultAuthValue = {
    user: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      isAnonymous: false
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    loginAnonymously: jest.fn().mockResolvedValue(undefined),
    loginWithGoogle: jest.fn().mockResolvedValue(undefined)
  };

  return (
    <MockAuthContext.Provider value={{ ...defaultAuthValue, ...authValue }}>
      {children}
    </MockAuthContext.Provider>
  );
};

/**
 * Mock useAuth hook
 * 需要在測試中 mock AuthContext 模組
 */
export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * 建立測試用 Redux Store
 */
export const createTestStore = (preloadedState = {}) => {
  return createStore(gameReducer, {
    ...defaultInitialState,
    ...preloadedState
  });
};

/**
 * 統一的測試 Wrapper
 *
 * 包含所有必要的 Providers：
 * - Redux Provider
 * - Mock Auth Provider
 * - Memory Router
 */
export const TestWrapper = ({
  children,
  initialState = {},
  authValue = {},
  initialEntries = ['/']
}) => {
  const store = createTestStore(initialState);

  return (
    <Provider store={store}>
      <MockAuthProvider authValue={authValue}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </MockAuthProvider>
    </Provider>
  );
};

/**
 * 自訂 render 函數
 *
 * 自動包裝所有必要的 Providers
 *
 * @param {React.ReactElement} ui - 要渲染的元素
 * @param {Object} options - 選項
 * @param {Object} options.initialState - Redux 初始狀態
 * @param {Object} options.authValue - Auth Context 覆蓋值
 * @param {string[]} options.initialEntries - Router 初始路徑
 * @returns {Object} render 結果
 */
export const renderWithProviders = (ui, {
  initialState = {},
  authValue = {},
  initialEntries = ['/'],
  ...renderOptions
} = {}) => {
  const Wrapper = ({ children }) => (
    <TestWrapper
      initialState={initialState}
      authValue={authValue}
      initialEntries={initialEntries}
    >
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * 建立遊戲狀態的輔助函數
 */
export const createGameState = (overrides = {}) => ({
  gameId: 'test-game-id',
  players: [
    { id: 'player-1', name: 'Player 1', isActive: true, score: 0, cards: [] },
    { id: 'player-2', name: 'Player 2', isActive: true, score: 0, cards: [] },
    { id: 'player-3', name: 'Player 3', isActive: true, score: 0, cards: [] }
  ],
  currentPlayerIndex: 0,
  gamePhase: 'playing',
  winner: null,
  hiddenCards: ['red', 'blue'],
  gameHistory: [],
  currentPlayerId: 'player-1',
  maxPlayers: 4,
  ...overrides
});

/**
 * 等待非同步操作完成
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Mock Socket 事件
 */
export const mockSocketEvent = (eventName, data) => {
  const handlers = {};

  return {
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    }),
    emit: jest.fn(),
    off: jest.fn(),
    triggerEvent: (event, eventData) => {
      if (handlers[event]) {
        handlers[event](eventData);
      }
    }
  };
};

// 重新導出 testing-library 函數
export * from '@testing-library/react';
```

#### 3.2.2 修改 E2E 測試使用新的 testUtils

```javascript
// SinglePlayerMode.test.js 修改範例

// 修改 import
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  createGameState
} from '../testUtils';

// 修改 render
// 修改前
render(<GameRoom />, { wrapper: ({ children }) => (
  <Provider store={store}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </Provider>
)});

// 修改後
renderWithProviders(<GameRoom />, {
  initialState: createGameState(),
  initialEntries: ['/room/test-room?mode=single&ai=2']
});
```

#### 3.2.3 設置 AuthContext Mock

在 `jest.setup.js` 或測試檔案中：

```javascript
// Mock AuthContext 模組
jest.mock('../firebase/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    user: { uid: 'test-user-id', displayName: 'Test User' },
    isAuthenticated: true,
    isLoading: false
  }),
  AuthProvider: ({ children }) => children
}));
```

---

## 四、測試計畫

### 4.1 驗證 testUtils
```javascript
describe('testUtils', () => {
  test('renderWithProviders 應正確提供所有 Context', () => {
    const TestComponent = () => {
      const { user } = useMockAuth();
      return <div>{user.displayName}</div>;
    };

    renderWithProviders(<TestComponent />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  test('createTestStore 應使用正確的初始狀態', () => {
    const store = createTestStore({ gameId: 'custom-id' });
    expect(store.getState().gameId).toBe('custom-id');
  });
});
```

### 4.2 驗證 E2E 測試
- [ ] SinglePlayerMode.test.js 全部通過
- [ ] SinglePlayerURLParsing.test.js 全部通過

---

## 五、驗收標準

1. `testUtils.js` 已建立並導出所有必要函數
2. E2E 測試不再出現 AuthProvider 錯誤
3. 21 個原本失敗的 E2E 測試恢復正常
4. 測試可重複執行，結果一致

---

## 六、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| Mock 與真實行為不一致 | 中 | 中 | 保持 Mock 簡單，只提供必要功能 |
| 遺漏某些 Context | 低 | 高 | 根據錯誤訊息逐一添加 |

---

## 七、相關工單

- 依賴: 0159 (socketService 修復), 0160 (useAIPlayers 修復)
- 被依賴: 無

---

*工單建立時間: 2026-01-27*
