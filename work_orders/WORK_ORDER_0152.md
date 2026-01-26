# 工作單 0152

**日期**：2026-01-27

**工作單標題**：單元測試 - 前端核心遊戲組件

**工單主旨**：測試 - 遊戲核心組件（GameRoom、QuestionFlow、GuessCard、Prediction）的單元測試

**優先級**：高

**依賴工單**：0151

**計畫書**：`docs/TEST_PLAN.md`

---

## 一、測試範圍

### 1.1 測試目標

| 組件 | 檔案 | 測試案例數 |
|------|------|-----------|
| GameRoom | `GameRoom/GameRoom.test.js` | 12 |
| QuestionFlow | `QuestionFlow/QuestionFlow.test.js` | 10 |
| GuessCard | `GuessCard/GuessCard.test.js` | 8 |
| Prediction | `Prediction/Prediction.test.js` | 5 |
| PlayerHand | `PlayerHand/PlayerHand.test.js` | 3 |
| GameBoard | `GameBoard/GameBoard.test.js` | 5 |
| ColorCombinationCards | `ColorCombinationCards.test.js` | 5 |
| **小計** | | **48** |

### 1.2 覆蓋率目標
- 目標覆蓋率：80%

---

## 二、測試案例清單

### 2.1 GameRoom 組件測試 (UT-FE-03)
**檔案**：`frontend/src/components/GameRoom/GameRoom.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-03-01 | 等待階段渲染 | 顯示玩家列表和開始按鈕 |
| UT-FE-03-02 | 遊戲進行中渲染 | 顯示遊戲桌面和操作按鈕 |
| UT-FE-03-03 | 房主可開始遊戲 | 只有房主看到開始按鈕 |
| UT-FE-03-04 | 最少3人才能開始 | 人數不足時按鈕禁用 |
| UT-FE-03-05 | 離開房間功能 | 點擊離開導向大廳 |
| UT-FE-03-06 | 顯示當前回合玩家 | 正確標示輪到誰 |
| UT-FE-03-07 | 自己回合顯示操作 | 顯示問牌/猜牌選項 |
| UT-FE-03-08 | 他人回合等待提示 | 顯示等待訊息 |
| UT-FE-03-09 | 跟猜面板顯示 | 跟猜階段顯示決定面板 |
| UT-FE-03-10 | 結果面板顯示 | 猜牌後顯示結果 |
| UT-FE-03-11 | 遊戲結束顯示 | 顯示獲勝者和分數 |
| UT-FE-03-12 | 錯誤處理 | 錯誤時關閉 Modal 顯示提示 |

### 2.2 QuestionFlow 組件測試 (UT-FE-04)
**檔案**：`frontend/src/components/QuestionFlow/QuestionFlow.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-04-01 | 顯示已選顏色 | 顯示選擇的顏色組合 |
| UT-FE-04-02 | 選擇目標玩家 | 可選擇其他玩家 |
| UT-FE-04-03 | 選擇問牌類型1 | 各一張選項正確顯示 |
| UT-FE-04-04 | 選擇問牌類型2 | 其中一種全部選項正確顯示 |
| UT-FE-04-05 | 選擇問牌類型3 | 給一張要全部選項正確顯示 |
| UT-FE-04-06 | 類型3給牌顏色選擇 | 顯示給牌顏色選項 |
| UT-FE-04-07 | 確認問牌按鈕 | 選完後可確認 |
| UT-FE-04-08 | 取消問牌 | 可取消返回 |
| UT-FE-04-09 | 載入中狀態 | 顯示處理中指示器 |
| UT-FE-04-10 | 已退出玩家仍可選 | 可向已退出玩家問牌 |

### 2.3 GuessCard 組件測試 (UT-FE-05)
**檔案**：`frontend/src/components/GuessCard/GuessCard.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-05-01 | 顯示顏色選擇區 | 顯示四種顏色按鈕 |
| UT-FE-05-02 | 選擇第一個顏色 | 正確記錄選擇並高亮 |
| UT-FE-05-03 | 選擇第二個顏色 | 正確記錄選擇並高亮 |
| UT-FE-05-04 | 可選擇重複顏色 | 允許兩個相同顏色 |
| UT-FE-05-05 | 顯示蓋牌答案 | 點擊查看答案後顯示 |
| UT-FE-05-06 | 確認猜牌按鈕 | 選完兩色後可確認 |
| UT-FE-05-07 | 取消猜牌 | 可取消返回 |
| UT-FE-05-08 | 載入中狀態 | 顯示處理中指示器 |

### 2.4 Prediction 組件測試 (UT-FE-06)
**檔案**：`frontend/src/components/Prediction/Prediction.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-06-01 | 顯示預測選項 | 顯示四種顏色按鈕 |
| UT-FE-06-02 | 選擇預測顏色 | 正確記錄選擇並高亮 |
| UT-FE-06-03 | 結束回合按鈕 | 可不預測直接結束 |
| UT-FE-06-04 | 預測後結束 | 選擇顏色後可結束回合 |
| UT-FE-06-05 | 載入中狀態 | 顯示處理中指示器 |

### 2.5 PlayerHand 組件測試 (UT-FE-07)
**檔案**：`frontend/src/components/PlayerHand/PlayerHand.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-07-01 | 顯示手牌數量 | 正確顯示牌數 |
| UT-FE-07-02 | 顯示牌面顏色 | 正確顯示各牌顏色 |
| UT-FE-07-03 | 空手牌處理 | 顯示無手牌訊息或空狀態 |

### 2.6 GameBoard 組件測試 (UT-FE-08)
**檔案**：`frontend/src/components/GameBoard/GameBoard.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-08-01 | 顯示蓋牌區域 | 顯示2張蓋牌 |
| UT-FE-08-02 | 蓋牌隱藏顏色 | 不顯示蓋牌實際顏色 |
| UT-FE-08-03 | 顯示顏色組合牌 | 顯示6張顏色組合牌 |
| UT-FE-08-04 | 禁用的顏色牌 | 正確顯示禁用狀態 |
| UT-FE-08-05 | 點擊顏色牌 | 觸發選擇回調 |

### 2.7 ColorCombinationCards 組件測試 (UT-FE-09)
**檔案**：`frontend/src/components/ColorCombinationCards/ColorCombinationCards.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-09-01 | 顯示6張組合牌 | 正確顯示所有組合 |
| UT-FE-09-02 | 組合牌顏色正確 | 每張牌顯示正確的兩種顏色 |
| UT-FE-09-03 | 可選狀態 | 可選時顯示正常樣式 |
| UT-FE-09-04 | 禁用狀態 | 禁用時顯示禁用樣式 |
| UT-FE-09-05 | 點擊事件 | 可選時觸發回調，禁用時不觸發 |

---

## 三、測試程式碼範例

### 3.1 GameRoom.test.js 範例

```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import GameRoom from './GameRoom';

// Mock dependencies
jest.mock('../../services/socketService');
jest.mock('../../firebase/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-uid', displayName: 'Test User' } })
}));

const mockPlayers = [
  { id: 'player-1', name: '玩家1', isHost: true, hand: [], score: 0, isActive: true },
  { id: 'player-2', name: '玩家2', isHost: false, hand: [], score: 0, isActive: true },
  { id: 'player-3', name: '玩家3', isHost: false, hand: [], score: 0, isActive: true }
];

const createMockStore = (overrides = {}) => configureStore({
  reducer: (state = {
    gameId: 'test-game',
    players: mockPlayers,
    currentPlayerIndex: 0,
    gamePhase: 'waiting',
    currentPlayerId: 'player-1',
    ...overrides
  }) => state
});

const renderGameRoom = (storeOverrides = {}) => {
  const store = createMockStore(storeOverrides);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/game/test-game']}>
        <Routes>
          <Route path="/game/:gameId" element={<GameRoom />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('GameRoom 組件', () => {
  describe('等待階段', () => {
    test('UT-FE-03-01: 等待階段渲染', () => {
      renderGameRoom({ gamePhase: 'waiting' });

      expect(screen.getByText(/等待/)).toBeInTheDocument();
      expect(screen.getByText('玩家1')).toBeInTheDocument();
      expect(screen.getByText('玩家2')).toBeInTheDocument();
      expect(screen.getByText('玩家3')).toBeInTheDocument();
    });

    test('UT-FE-03-03: 房主可開始遊戲', () => {
      renderGameRoom({ gamePhase: 'waiting', currentPlayerId: 'player-1' });

      const startButton = screen.getByRole('button', { name: /開始遊戲/ });
      expect(startButton).toBeInTheDocument();
    });

    test('UT-FE-03-04: 最少3人才能開始', () => {
      renderGameRoom({
        gamePhase: 'waiting',
        players: mockPlayers.slice(0, 2),
        currentPlayerId: 'player-1'
      });

      const startButton = screen.getByRole('button', { name: /開始遊戲/ });
      expect(startButton).toBeDisabled();
    });
  });

  describe('遊戲進行中', () => {
    test('UT-FE-03-02: 遊戲進行中渲染', () => {
      renderGameRoom({ gamePhase: 'playing' });

      expect(screen.getByText(/遊戲進行中/)).toBeInTheDocument();
    });

    test('UT-FE-03-06: 顯示當前回合玩家', () => {
      renderGameRoom({
        gamePhase: 'playing',
        currentPlayerIndex: 1
      });

      expect(screen.getByText(/玩家2/)).toBeInTheDocument();
      // 應該有「回合」標記
    });

    test('UT-FE-03-07: 自己回合顯示操作', () => {
      renderGameRoom({
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        currentPlayerId: 'player-1',
        players: mockPlayers.map(p => ({ ...p, hand: [{ id: 'c1', color: 'red' }] }))
      });

      // 應該顯示猜牌按鈕
      expect(screen.getByRole('button', { name: /猜牌/ })).toBeInTheDocument();
    });
  });
});
```

### 3.2 QuestionFlow.test.js 範例

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionFlow from './QuestionFlow';

const mockProps = {
  selectedCard: { id: 'red-blue', colors: ['red', 'blue'] },
  players: [
    { id: 'player-1', name: '玩家1', isActive: true },
    { id: 'player-2', name: '玩家2', isActive: true },
    { id: 'player-3', name: '玩家3', isActive: false }
  ],
  currentPlayerId: 'player-1',
  currentPlayerHand: [
    { id: 'c1', color: 'red' },
    { id: 'c2', color: 'blue' }
  ],
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  isLoading: false
};

describe('QuestionFlow 組件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('UT-FE-04-01: 顯示已選顏色', () => {
    render(<QuestionFlow {...mockProps} />);

    expect(screen.getByText(/紅色/)).toBeInTheDocument();
    expect(screen.getByText(/藍色/)).toBeInTheDocument();
  });

  test('UT-FE-04-02: 選擇目標玩家', () => {
    render(<QuestionFlow {...mockProps} />);

    // 應該顯示其他玩家（不包括自己）
    expect(screen.getByText('玩家2')).toBeInTheDocument();
    expect(screen.getByText('玩家3')).toBeInTheDocument();
    expect(screen.queryByText('玩家1')).not.toBeInTheDocument();
  });

  test('UT-FE-04-10: 已退出玩家仍可選', () => {
    render(<QuestionFlow {...mockProps} />);

    // 玩家3已退出但仍可選擇
    const player3Button = screen.getByText('玩家3');
    expect(player3Button).not.toBeDisabled();
  });

  test('UT-FE-04-08: 取消問牌', () => {
    render(<QuestionFlow {...mockProps} />);

    const cancelButton = screen.getByRole('button', { name: /取消/ });
    fireEvent.click(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  test('UT-FE-04-09: 載入中狀態', () => {
    render(<QuestionFlow {...mockProps} isLoading={true} />);

    expect(screen.getByText(/處理中/)).toBeInTheDocument();
  });
});
```

---

## 四、驗收標準

- [ ] 所有 48 個測試案例通過
- [ ] 覆蓋率達到 80%
- [ ] 無 console 錯誤或警告
- [ ] 所有組件邏輯正確測試

---

## 五、執行命令

```bash
# 執行核心組件測試
cd frontend && npm test -- --testPathPattern="components/(GameRoom|QuestionFlow|GuessCard|Prediction|PlayerHand|GameBoard|ColorCombinationCards)"

# 查看覆蓋率
cd frontend && npm test -- --coverage --collectCoverageFrom="src/components/**/*.js"
```

---

## 六、測試檔案清單

| 檔案路徑 | 狀態 |
|---------|------|
| `frontend/src/components/GameRoom/GameRoom.test.js` | 已存在，需補充 |
| `frontend/src/components/QuestionFlow/QuestionFlow.test.js` | 已存在，需補充 |
| `frontend/src/components/GuessCard/GuessCard.test.js` | 已存在，需補充 |
| `frontend/src/components/Prediction/Prediction.test.js` | 已存在，需補充 |
| `frontend/src/components/PlayerHand/PlayerHand.test.js` | 已存在，需補充 |
| `frontend/src/components/GameBoard/GameBoard.test.js` | 已存在，需補充 |
| `frontend/src/components/ColorCombinationCards/ColorCombinationCards.test.js` | 已存在，需補充 |
