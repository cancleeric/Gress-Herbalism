# 工單 0350：前端組件單元測試

## 基本資訊
- **工單編號**：0350
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0331-0349（所有前端組件）
- **預計影響檔案**：
  - `frontend/src/**/__tests__/*.test.jsx`（新增）
  - `frontend/vitest.config.js`（更新）
  - `frontend/src/setupTests.js`（更新）

---

## 目標

為前端組件建立完整測試：
1. 組件渲染測試
2. 互動測試
3. 狀態管理測試
4. 測試覆蓋率 80%+

---

## 詳細規格

### 1. 測試配置

```javascript
// frontend/vitest.config.js

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/components/**/*.jsx', 'src/hooks/**/*.js'],
      exclude: ['node_modules', '**/*.test.jsx', '**/__tests__/**'],
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});
```

### 2. 測試設置

```javascript
// frontend/src/setupTests.js

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    set: vi.fn(),
  }),
  useDragLayer: () => ({
    isDragging: false,
    item: null,
    currentOffset: null,
  }),
}));

// Mock react-dnd
vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false, canDrop: true }, vi.fn()],
  DndProvider: ({ children }) => children,
}));

vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 3. 卡牌組件測試

```jsx
// frontend/src/components/games/evolution/cards/__tests__/CardBase.test.jsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardBase } from '../CardBase';

describe('CardBase', () => {
  const defaultProps = {
    frontContent: <div>Front</div>,
    backContent: <div>Back</div>,
  };

  it('should render front content by default', () => {
    render(<CardBase {...defaultProps} />);
    expect(screen.getByText('Front')).toBeInTheDocument();
  });

  it('should apply selected class when selected', () => {
    render(<CardBase {...defaultProps} selected testId="card" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('evolution-card--selected');
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<CardBase {...defaultProps} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<CardBase {...defaultProps} onClick={handleClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply size class', () => {
    const { rerender } = render(<CardBase {...defaultProps} size="small" testId="card" />);
    expect(screen.getByTestId('card')).toHaveClass('evolution-card--small');

    rerender(<CardBase {...defaultProps} size="large" testId="card" />);
    expect(screen.getByTestId('card')).toHaveClass('evolution-card--large');
  });

  it('should handle keyboard interaction', () => {
    const handleClick = vi.fn();
    render(<CardBase {...defaultProps} onClick={handleClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    // 預設 button 行為會觸發 click
  });
});
```

### 4. 遊戲板組件測試

```jsx
// frontend/src/components/games/evolution/board/__tests__/FoodPool.test.jsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FoodPool } from '../FoodPool';

describe('FoodPool', () => {
  it('should display food amount', () => {
    render(<FoodPool amount={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should show empty state when amount is 0', () => {
    render(<FoodPool amount={0} />);
    expect(screen.getByText('食物已耗盡')).toBeInTheDocument();
  });

  it('should show roll button when enabled', () => {
    render(<FoodPool amount={0} showRollButton onRoll={vi.fn()} />);
    expect(screen.getByText('決定食物')).toBeInTheDocument();
  });

  it('should call onRoll when roll button clicked', () => {
    const handleRoll = vi.fn();
    render(<FoodPool amount={0} showRollButton onRoll={handleRoll} />);
    fireEvent.click(screen.getByText('決定食物'));
    expect(handleRoll).toHaveBeenCalledOnce();
  });

  it('should show hint when canTakeFood is true', () => {
    render(<FoodPool amount={5} canTakeFood />);
    expect(screen.getByText(/點擊或拖動食物/)).toBeInTheDocument();
  });
});
```

### 5. Store 測試

```jsx
// frontend/src/store/evolution/__tests__/gameSlice.test.js

import { describe, it, expect } from 'vitest';
import gameReducer, {
  setGameState,
  setPhase,
  setRound,
  setFoodPool,
  addActionLog,
  resetGame,
} from '../gameSlice';

describe('gameSlice', () => {
  const initialState = {
    gameId: null,
    status: 'waiting',
    round: 0,
    currentPhase: null,
    foodPool: 0,
    actionLog: [],
    // ... 其他初始狀態
  };

  it('should handle setGameState', () => {
    const state = gameReducer(initialState, setGameState({
      id: 'game-1',
      status: 'playing',
      round: 1,
      currentPhase: 'evolution',
    }));

    expect(state.gameId).toBe('game-1');
    expect(state.status).toBe('playing');
    expect(state.round).toBe(1);
  });

  it('should handle setPhase', () => {
    const state = gameReducer(initialState, setPhase('feeding'));
    expect(state.currentPhase).toBe('feeding');
  });

  it('should handle setRound', () => {
    const state = gameReducer(initialState, setRound(3));
    expect(state.round).toBe(3);
  });

  it('should handle setFoodPool', () => {
    const state = gameReducer(initialState, setFoodPool({
      amount: 10,
      roll: { dice: 6, players: 4 },
    }));
    expect(state.foodPool).toBe(10);
    expect(state.lastFoodRoll.dice).toBe(6);
  });

  it('should handle addActionLog', () => {
    const state = gameReducer(initialState, addActionLog({
      type: 'createCreature',
      playerName: 'Player 1',
    }));
    expect(state.actionLog).toHaveLength(1);
    expect(state.actionLog[0].type).toBe('createCreature');
  });

  it('should limit actionLog to 100 entries', () => {
    let state = initialState;
    for (let i = 0; i < 110; i++) {
      state = gameReducer(state, addActionLog({ type: 'test', index: i }));
    }
    expect(state.actionLog).toHaveLength(100);
  });

  it('should handle resetGame', () => {
    const modifiedState = {
      ...initialState,
      gameId: 'game-1',
      round: 5,
    };
    const state = gameReducer(modifiedState, resetGame());
    expect(state.gameId).toBeNull();
    expect(state.round).toBe(0);
  });
});
```

### 6. Hook 測試

```jsx
// frontend/src/hooks/__tests__/useResponsive.test.js

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useResponsive, useIsMobile } from '../useResponsive';

describe('useResponsive', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
  });

  it('should return current window size', () => {
    window.innerWidth = 1024;
    window.innerHeight = 768;

    const { result } = renderHook(() => useResponsive());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should detect mobile breakpoint', () => {
    window.innerWidth = 500;
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(true);
  });

  it('should detect desktop breakpoint', () => {
    window.innerWidth = 1200;
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isDesktop).toBe(true);
  });

  it('should detect landscape orientation', () => {
    window.innerWidth = 800;
    window.innerHeight = 600;
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isLandscape).toBe(true);
  });
});
```

---

## 驗收標準

1. [ ] 測試配置正確
2. [ ] 卡牌組件測試通過
3. [ ] 遊戲板組件測試通過
4. [ ] Store 測試通過
5. [ ] Hook 測試通過
6. [ ] 測試覆蓋率達 80%+
7. [ ] CI 可執行測試

---

## 備註

- 使用 Vitest + Testing Library
- Mock 必要的外部依賴
- 本工單為 P2-B 收尾工單
