# 工作單 0252

## 編號
0252

## 日期
2026-01-31

## 工作單標題
建立遊戲房間組件

## 工單主旨
建立演化論遊戲的主要房間組件 `EvolutionRoom`，作為遊戲畫面的容器組件

## 內容

### 任務描述

建立演化論遊戲的主要 React 組件，負責整合所有遊戲畫面元素和狀態管理。

### 組件結構

```
frontend/src/components/games/evolution/
├── EvolutionRoom/
│   ├── EvolutionRoom.js
│   ├── EvolutionRoom.css
│   ├── EvolutionRoom.test.js
│   └── index.js
```

### 組件功能

#### 1. 狀態管理連接
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { evolutionActions } from '../../../../store/evolution/evolutionStore';

function EvolutionRoom() {
  const gameState = useSelector(state => state.evolution);
  const dispatch = useDispatch();
  // ...
}
```

#### 2. Socket 事件處理
```javascript
useEffect(() => {
  // 連接演化論遊戲事件
  socketService.on('evo:gameState', handleGameState);
  socketService.on('evo:phaseChange', handlePhaseChange);
  socketService.on('evo:turnChange', handleTurnChange);
  socketService.on('evo:creatureCreated', handleCreatureCreated);
  // ... 其他事件

  return () => {
    // 清理事件監聽
  };
}, []);
```

#### 3. 畫面佈局
```jsx
return (
  <div className="evolution-room">
    <PhaseIndicator phase={gameState.phase} round={gameState.round} />

    <div className="game-area">
      <div className="opponents-area">
        {opponents.map(opponent => (
          <PlayerArea key={opponent.id} player={opponent} isOpponent={true} />
        ))}
      </div>

      <FoodPool foodPool={gameState.foodPool} deckCount={gameState.deckCount} />

      <div className="my-area">
        <PlayerArea player={currentPlayer} isOpponent={false} />
        <HandCards cards={currentPlayer.hand} onCardPlay={handleCardPlay} />
      </div>
    </div>

    <div className="game-controls">
      <GameLog logs={gameState.actionLog} />
      <ActionButtons phase={gameState.phase} onAction={handleAction} />
    </div>

    {pendingAttack && <AttackResolver attack={pendingAttack} />}
  </div>
);
```

### 主要功能

| 功能 | 說明 |
|------|------|
| 遊戲狀態顯示 | 顯示階段、回合、食物池等 |
| 玩家區域渲染 | 自己和對手的生物、手牌 |
| 動作處理 | 出牌、進食、攻擊等 |
| 攻擊判定 UI | 彈窗處理攻擊互動 |
| 斷線重連 | 重連後恢復遊戲狀態 |

### Socket 事件列表

| 事件 | 方向 | 說明 |
|------|------|------|
| evo:joinRoom | C→S | 加入房間 |
| evo:startGame | C→S | 開始遊戲 |
| evo:createCreature | C→S | 創造生物 |
| evo:addTrait | C→S | 賦予性狀 |
| evo:gameState | S→C | 完整遊戲狀態 |
| evo:phaseChange | S→C | 階段變更 |

### 前置條件
- 工單 0228-0251 已完成（後端邏輯）
- 工單 0262 同步開發（Redux Store）

### 驗收標準
- [ ] 組件可正確渲染
- [ ] Redux 連接正常
- [ ] Socket 事件處理正常
- [ ] 響應式佈局（桌面/平板）
- [ ] 單元測試覆蓋率 ≥ 70%

### 相關檔案
- `frontend/src/components/games/evolution/EvolutionRoom/` — 新建
- `frontend/src/store/evolution/evolutionStore.js` — 依賴
- `frontend/src/services/socketService.js` — 依賴

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.2 節
