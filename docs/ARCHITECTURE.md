# 系統架構說明

## 概覽

本專案採用前後端分離架構，前端使用 React + Redux，後端使用 Node.js + Express（可選）。

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐    │
│  │ 組件層   │──│ 服務層   │──│ 狀態管理 │──│ 工具函數     │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      後端 (Node.js)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ 路由層   │──│ 服務層   │──│ 數據層   │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## 前端架構

### 技術棧

- **React 18.2.0**：UI 框架
- **Redux 4.2.1**：狀態管理
- **React Router 6.20.0**：路由管理
- **Create React App**：建置工具

### 目錄結構

```
frontend/src/
├── components/           # UI 組件
│   ├── GameBoard/       # 遊戲桌面
│   ├── GameRoom/        # 遊戲房間
│   ├── GameStatus/      # 遊戲狀態
│   ├── GuessCard/       # 猜牌介面
│   ├── Lobby/           # 大廳
│   ├── PlayerHand/      # 玩家手牌
│   └── QuestionCard/    # 問牌介面
├── services/            # 服務層
│   └── gameService.js   # 遊戲服務
├── store/               # Redux Store
│   └── gameStore.js     # 遊戲狀態管理
├── utils/               # 工具函數
│   ├── actionHandlers/  # 動作處理器
│   │   ├── actionFactory.js
│   │   ├── questionAction.js
│   │   └── guessAction.js
│   ├── cardUtils.js     # 牌組工具
│   ├── gameRules.js     # 遊戲規則
│   └── performance.js   # 性能監控
├── shared/              # 共享代碼
│   └── constants.js     # 常數定義
└── styles/              # 樣式
    ├── variables.css    # CSS 變數
    ├── base.css         # 基礎樣式
    ├── components.css   # 組件樣式
    └── utilities.css    # 工具樣式
```

### 組件層

組件採用容器/展示組件模式：

- **展示組件**：純 UI 組件，接收 props 顯示內容
- **容器組件**：連接 Redux，處理業務邏輯

```
┌─────────────────────────────────┐
│     Container Component          │
│  ┌───────────────────────────┐  │
│  │   Redux Connection        │  │
│  │   Business Logic          │  │
│  └───────────────────────────┘  │
│              │                   │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │   Presentational Component │  │
│  │   Pure UI                  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 服務層

`gameService.js` 負責遊戲狀態管理：

- **遊戲建立**：`createGame()`, `createGameRoom()`
- **狀態管理**：`getGameState()`, `updateGameState()`
- **動作處理**：`processAction()`, `processQuestionAction()`, `processGuessAction()`

### 狀態管理

使用 Redux 管理全域狀態：

```javascript
{
  gameId: string,
  players: Player[],
  hiddenCards: Card[],
  currentPlayerIndex: number,
  gamePhase: string,
  winner: string | null,
  gameHistory: HistoryEntry[]
}
```

### 動作處理器架構

採用工廠模式處理遊戲動作：

```
┌─────────────────────────────────────────┐
│           Action Factory                 │
│  ┌─────────────────────────────────────┐│
│  │ actionHandlers Map                   ││
│  │  'question' → handleQuestionAction   ││
│  │  'guess' → handleGuessAction         ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       Question Action Handler            │
│  ┌──────────┬──────────┬──────────────┐ │
│  │ Type 1   │ Type 2   │ Type 3       │ │
│  │ 各一張   │ 全部一色  │ 給一要全部    │ │
│  └──────────┴──────────┴──────────────┘ │
└─────────────────────────────────────────┘
```

## 數據流

### Redux 數據流

```
Action → Reducer → Store → UI Update
   ↑                          │
   └──────── User Event ──────┘
```

### 遊戲動作流程

```
1. 用戶操作 (問牌/猜牌)
   ↓
2. 組件調用 gameService
   ↓
3. gameService 調用 actionFactory
   ↓
4. actionHandler 處理動作
   ↓
5. 返回新的 gameState
   ↓
6. 更新 Redux Store
   ↓
7. UI 重新渲染
```

## 擴展性設計

### 新增動作類型

1. 在 `constants.js` 添加動作類型常數
2. 在 `actionHandlers/` 建立新的處理器
3. 在 `actionFactory.js` 註冊處理器

```javascript
// 1. 添加常數
export const ACTION_TYPE_NEW = 'newAction';

// 2. 建立處理器
export function handleNewAction(gameState, action) {
  // 處理邏輯
}

// 3. 註冊處理器
const actionHandlers = {
  [ACTION_TYPE_NEW]: handleNewAction,
  // ...
};
```

### 新增組件

1. 在 `components/` 建立組件目錄
2. 建立組件檔案、樣式檔案、測試檔案
3. 建立 `index.js` 導出

### 新增遊戲規則

1. 在 `gameRules.js` 添加驗證函數
2. 在相應的 actionHandler 中使用驗證
3. 更新測試

## 性能優化

### 已實施的優化

1. **useSelector 分離**：避免建立新物件導致不必要的重新渲染
2. **React.memo**：記憶化純展示組件
3. **useCallback**：記憶化回調函數

### 性能監控

使用 `utils/performance.js` 進行性能追蹤：

```javascript
import { performanceMonitor, withTiming } from '../utils/performance';

// 測量函數執行時間
const result = performanceMonitor.measureSync('operationName', () => {
  // 執行操作
});

// 使用裝飾器
const timedFunction = withTiming('functionName', originalFunction);
```

## 安全考量

1. **輸入驗證**：所有用戶輸入都經過驗證
2. **XSS 防護**：React 自動轉義
3. **狀態隔離**：每個遊戲有獨立的狀態

## 測試架構

```
frontend/src/
├── __tests__/
│   └── integration/      # 整合測試
│       └── gameFlow.test.js
├── components/
│   └── */
│       └── *.test.js     # 組件測試
├── services/
│   └── *.test.js         # 服務測試
└── utils/
    └── *.test.js         # 工具測試
```
