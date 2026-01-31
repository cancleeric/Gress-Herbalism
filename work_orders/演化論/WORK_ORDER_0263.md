# 工作單 0263

## 編號
0263

## 日期
2026-01-31

## 工作單標題
建立路由整合

## 工單主旨
在 `App.js` 加入演化論遊戲的路由設定

## 內容

### 任務描述

整合演化論遊戲的路由，確保玩家可以正確導航到遊戲頁面。

### 路由結構

```javascript
// App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 現有組件
import Lobby from './components/Lobby/Lobby';
import GameRoom from './components/GameRoom/GameRoom';

// 演化論組件
import EvolutionRoom from './components/games/evolution/EvolutionRoom';

function App() {
  return (
    <Router>
      <Routes>
        {/* 首頁 - 大廳 */}
        <Route path="/" element={<Lobby />} />

        {/* 本草遊戲 */}
        <Route path="/game/herbalism/:roomId" element={<GameRoom />} />

        {/* 演化論遊戲 */}
        <Route path="/game/evolution/:roomId" element={<EvolutionRoom />} />

        {/* 相容舊路由 */}
        <Route path="/game/:roomId" element={<GameRoom />} />

        {/* 404 導向首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
```

### 遊戲類型判斷

```javascript
// 根據房間資訊導向正確的遊戲頁面
const navigateToGame = (roomId, gameType) => {
  if (gameType === 'evolution') {
    navigate(`/game/evolution/${roomId}`);
  } else {
    navigate(`/game/herbalism/${roomId}`);
  }
};
```

### URL 參數處理

```javascript
// 在 EvolutionRoom 中
import { useParams } from 'react-router-dom';

function EvolutionRoom() {
  const { roomId } = useParams();

  useEffect(() => {
    // 使用 roomId 加入房間
    socketService.emit('evo:joinRoom', { roomId, playerName });
  }, [roomId]);

  // ...
}
```

### 導航保護

```javascript
// 確保玩家已登入才能進入遊戲
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 使用
<Route
  path="/game/evolution/:roomId"
  element={
    <ProtectedRoute>
      <EvolutionRoom />
    </ProtectedRoute>
  }
/>
```

### 組件索引檔案

```javascript
// frontend/src/components/games/evolution/index.js
export { default as EvolutionRoom } from './EvolutionRoom';
export { default as GameBoard } from './GameBoard';
export { default as CreatureCard } from './CreatureCard';
export { default as TraitCard } from './TraitCard';
export { default as PlayerArea } from './PlayerArea';
export { default as HandCards } from './HandCards';
export { default as PhaseIndicator } from './PhaseIndicator';
export { default as TurnTimer } from './TurnTimer';
export { default as AttackResolver } from './AttackResolver';
export { default as DiceRoller } from './DiceRoller';
export { default as InteractionLink } from './InteractionLink';
export { default as TraitSelector } from './TraitSelector';
export { default as ScoreBoard } from './ScoreBoard';
export { default as GameLog } from './GameLog';
export { default as FoodPool } from './FoodPool';
```

### 前置條件
- 工單 0252 已完成（EvolutionRoom 組件）
- 工單 0260 已完成（大廳修改）

### 驗收標準
- [ ] 演化論路由可正確訪問
- [ ] URL 參數正確傳遞
- [ ] 舊路由相容正常
- [ ] 導航保護正常運作
- [ ] 測試覆蓋正常

### 相關檔案
- `frontend/src/App.js` — 修改
- `frontend/src/components/games/evolution/index.js` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章
