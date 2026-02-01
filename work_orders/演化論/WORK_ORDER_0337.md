# 工單 0337：GameBoard 遊戲主板組件

## 基本資訊
- **工單編號**：0337
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0335（PlayerBoard）、0336（FoodPool）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/board/GameBoard.jsx`（新增）
  - `frontend/src/components/games/evolution/board/GameBoard.css`（新增）

---

## 目標

建立遊戲主板組件，整合所有遊戲區域：
1. 多玩家布局（2-4人）
2. 中央食物池
3. 階段/回合資訊
4. 響應式適配

---

## 詳細規格

### 1. 組件實作

```jsx
// frontend/src/components/games/evolution/board/GameBoard.jsx

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { PlayerBoard } from './PlayerBoard';
import { FoodPool } from './FoodPool';
import { PhaseIndicator } from './PhaseIndicator';
import { ActionLog } from './ActionLog';
import { useEvolutionStore } from '../../../../store/evolution';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import './GameBoard.css';

/**
 * 遊戲主板組件
 */
export const GameBoard = ({
  gameState,
  myPlayerId,
  onAction,
  className = '',
}) => {
  const isMobile = useIsMobile();

  // 從 store 獲取狀態
  const currentPhase = useEvolutionStore((state) => state.currentPhase);
  const currentPlayerIndex = useEvolutionStore((state) => state.currentPlayerIndex);

  // 整理玩家順序（自己在下方）
  const orderedPlayers = useMemo(() => {
    const players = Object.values(gameState.players);
    const myIndex = players.findIndex((p) => p.id === myPlayerId);

    if (myIndex === -1) return players;

    // 將自己移到最後
    const reordered = [
      ...players.slice(myIndex + 1),
      ...players.slice(0, myIndex),
      players[myIndex],
    ];

    return reordered;
  }, [gameState.players, myPlayerId]);

  // 當前玩家
  const currentPlayerId = gameState.turnOrder[currentPlayerIndex];
  const isMyTurn = currentPlayerId === myPlayerId;

  // 佈局計算
  const playerCount = orderedPlayers.length;
  const layoutClass = `game-board--${playerCount}p`;

  // 動作處理
  const handleCreatureSelect = (playerId, creatureId) => {
    onAction?.('selectCreature', { playerId, creatureId });
  };

  const handleCreatureFeed = (playerId, creatureId) => {
    onAction?.('feed', { playerId, creatureId });
  };

  const handleCreatureAttack = (playerId, creatureId) => {
    onAction?.('attack', { playerId, creatureId });
  };

  const handlePlaceTrait = (playerId, creatureId, cardId, side) => {
    onAction?.('placeTrait', { playerId, creatureId, cardId, side });
  };

  const handlePlayAsCreature = (cardId) => {
    onAction?.('playAsCreature', { cardId });
  };

  const handlePlayAsTrait = (cardId, side) => {
    onAction?.('playAsTrait', { cardId, side });
  };

  const handleTakeFood = () => {
    onAction?.('takeFood', {});
  };

  const handleRollFood = () => {
    onAction?.('rollFood', {});
  };

  // DnD 後端選擇
  const dndBackend = isMobile ? TouchBackend : HTML5Backend;
  const dndOptions = isMobile ? { enableMouseEvents: true } : {};

  return (
    <DndProvider backend={dndBackend} options={dndOptions}>
      <div className={`game-board ${layoutClass} ${className}`}>
        {/* 階段指示器 */}
        <div className="game-board__phase">
          <PhaseIndicator
            currentPhase={currentPhase}
            round={gameState.round}
            currentPlayer={gameState.players[currentPlayerId]?.name}
            isMyTurn={isMyTurn}
          />
        </div>

        {/* 對手區域 */}
        <div className="game-board__opponents">
          {orderedPlayers.slice(0, -1).map((player, index) => (
            <div
              key={player.id}
              className={`game-board__opponent game-board__opponent--${index + 1}`}
            >
              <PlayerBoard
                player={player}
                isCurrentPlayer={player.id === currentPlayerId}
                isSelf={false}
                compact={playerCount > 2}
                onCreatureSelect={handleCreatureSelect}
                onCreatureFeed={handleCreatureFeed}
                onCreatureAttack={handleCreatureAttack}
              />
            </div>
          ))}
        </div>

        {/* 中央區域 */}
        <div className="game-board__center">
          {/* 食物池 */}
          <FoodPool
            amount={gameState.foodPool}
            lastRoll={gameState.lastFoodRoll}
            isRolling={currentPhase === 'food_supply' && isMyTurn}
            canTakeFood={currentPhase === 'feeding' && isMyTurn}
            onTakeFood={handleTakeFood}
            onRoll={handleRollFood}
            showRollButton={
              currentPhase === 'food_supply' &&
              currentPlayerIndex === 0 &&
              isMyTurn
            }
          />

          {/* 牌庫資訊 */}
          <div className="game-board__deck-info">
            <span className="game-board__deck-icon">🃏</span>
            <span className="game-board__deck-count">{gameState.deck.length}</span>
            <span className="game-board__deck-label">張剩餘</span>
          </div>
        </div>

        {/* 自己的區域 */}
        <div className="game-board__self">
          <PlayerBoard
            player={orderedPlayers[orderedPlayers.length - 1]}
            isCurrentPlayer={myPlayerId === currentPlayerId}
            isMyTurn={isMyTurn}
            isSelf={true}
            onCreatureSelect={handleCreatureSelect}
            onCreatureFeed={handleCreatureFeed}
            onCreatureAttack={handleCreatureAttack}
            onPlaceTrait={handlePlaceTrait}
            onPlayAsCreature={handlePlayAsCreature}
            onPlayAsTrait={handlePlayAsTrait}
          />
        </div>

        {/* 行動日誌 */}
        <div className="game-board__log">
          <ActionLog />
        </div>
      </div>
    </DndProvider>
  );
};

GameBoard.propTypes = {
  gameState: PropTypes.object.isRequired,
  myPlayerId: PropTypes.string.isRequired,
  onAction: PropTypes.func,
  className: PropTypes.string,
};

export default GameBoard;
```

### 2. 樣式

```css
/* frontend/src/components/games/evolution/board/GameBoard.css */

.game-board {
  display: grid;
  gap: 16px;
  padding: 16px;
  min-height: 100vh;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

/* === 階段指示器 === */
.game-board__phase {
  grid-area: phase;
}

/* === 對手區域 === */
.game-board__opponents {
  grid-area: opponents;
  display: flex;
  gap: 16px;
  justify-content: center;
}

.game-board__opponent {
  flex: 1;
  max-width: 400px;
}

/* === 中央區域 === */
.game-board__center {
  grid-area: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.game-board__deck-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.game-board__deck-icon {
  font-size: 20px;
}

.game-board__deck-count {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.game-board__deck-label {
  font-size: 14px;
  color: #64748b;
}

/* === 自己的區域 === */
.game-board__self {
  grid-area: self;
}

/* === 行動日誌 === */
.game-board__log {
  grid-area: log;
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 280px;
  max-height: 200px;
  z-index: 100;
}

/* === 2人布局 === */
.game-board--2p {
  grid-template-areas:
    "phase phase"
    "opponents opponents"
    "center center"
    "self self";
  grid-template-rows: auto 1fr auto 1fr;
}

/* === 3人布局 === */
.game-board--3p {
  grid-template-areas:
    "phase phase phase"
    "opponents opponents opponents"
    "center center center"
    "self self self";
  grid-template-columns: 1fr 1fr 1fr;
}

/* === 4人布局 === */
.game-board--4p {
  grid-template-areas:
    "phase phase phase"
    "opponent-left center opponent-right"
    "self self self";
  grid-template-columns: 1fr auto 1fr;
}

.game-board--4p .game-board__opponents {
  display: contents;
}

.game-board--4p .game-board__opponent--1 {
  grid-area: opponent-left;
}

.game-board--4p .game-board__opponent--2 {
  grid-area: center;
}

.game-board--4p .game-board__opponent--3 {
  grid-area: opponent-right;
}

/* === 響應式 === */
@media (max-width: 1024px) {
  .game-board {
    gap: 12px;
    padding: 12px;
  }

  .game-board__opponent {
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .game-board {
    grid-template-areas:
      "phase"
      "opponents"
      "center"
      "self";
    grid-template-columns: 1fr;
  }

  .game-board__opponents {
    flex-direction: column;
    align-items: stretch;
  }

  .game-board__opponent {
    max-width: none;
  }

  .game-board__log {
    position: static;
    width: 100%;
    max-height: 150px;
  }
}
```

---

## 驗收標準

1. [ ] 2/3/4 人布局正確
2. [ ] 玩家順序正確排列
3. [ ] 中央區域元素正確
4. [ ] 拖放功能正常
5. [ ] 觸控設備支援
6. [ ] 響應式布局正確
7. [ ] 動作正確傳遞

---

## 備註

- 主板是遊戲核心視圖
- 需處理多種玩家數量布局
- 效能考量重要
