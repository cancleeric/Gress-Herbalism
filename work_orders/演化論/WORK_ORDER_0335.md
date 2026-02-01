# 工單 0335：PlayerBoard 玩家區域組件

## 基本資訊
- **工單編號**：0335
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0333（CreatureCard）、0334（Hand）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/board/PlayerBoard.jsx`（新增）
  - `frontend/src/components/games/evolution/board/PlayerBoard.css`（新增）

---

## 目標

建立玩家區域組件，展示單個玩家的遊戲狀態：
1. 玩家資訊（名稱、分數）
2. 生物區域
3. 手牌區域（自己）或手牌數量（對手）
4. 狀態指示（當前回合、已跳過等）

---

## 詳細規格

### 1. 組件實作

```jsx
// frontend/src/components/games/evolution/board/PlayerBoard.jsx

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatureCard } from '../cards/CreatureCard';
import { Hand } from './Hand';
import { useEvolutionStore } from '../../../../store/evolution';
import './PlayerBoard.css';

/**
 * 玩家區域組件
 */
export const PlayerBoard = ({
  player,
  isCurrentPlayer = false,
  isMyTurn = false,
  isSelf = false,
  compact = false,
  onCreatureSelect,
  onCreatureFeed,
  onCreatureAttack,
  onPlaceTrait,
  onPlayAsCreature,
  onPlayAsTrait,
  className = '',
}) => {
  const currentPhase = useEvolutionStore((state) => state.currentPhase);
  const attackingCreature = useEvolutionStore((state) => state.attackingCreature);

  // 計算可攻擊的生物
  const attackableCreatures = useMemo(() => {
    if (!attackingCreature || isSelf) return new Set();

    // 簡化版本：所有生物都可被攻擊
    // 實際應根據性狀過濾
    return new Set(player.creatures.map(c => c.id));
  }, [attackingCreature, isSelf, player.creatures]);

  // 處理生物選擇
  const handleCreatureSelect = useCallback((creatureId) => {
    onCreatureSelect?.(player.id, creatureId);
  }, [player.id, onCreatureSelect]);

  // 處理進食
  const handleCreatureFeed = useCallback((creatureId) => {
    onCreatureFeed?.(player.id, creatureId);
  }, [player.id, onCreatureFeed]);

  // 處理攻擊
  const handleCreatureAttack = useCallback((creatureId) => {
    onCreatureAttack?.(player.id, creatureId);
  }, [player.id, onCreatureAttack]);

  // 處理放置性狀
  const handlePlaceTrait = useCallback((creatureId, cardId, side) => {
    onPlaceTrait?.(player.id, creatureId, cardId, side);
  }, [player.id, onPlaceTrait]);

  // 狀態類別
  const boardClasses = [
    'player-board',
    isCurrentPlayer && 'player-board--current',
    isSelf && 'player-board--self',
    player.passed && 'player-board--passed',
    !player.connected && 'player-board--disconnected',
    compact && 'player-board--compact',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={boardClasses}>
      {/* 玩家資訊 */}
      <div className="player-board__header">
        <div className="player-board__avatar">
          {player.name.charAt(0).toUpperCase()}
        </div>

        <div className="player-board__info">
          <span className="player-board__name">{player.name}</span>
          {player.score !== undefined && (
            <span className="player-board__score">{player.score} 分</span>
          )}
        </div>

        {/* 狀態標籤 */}
        <div className="player-board__status">
          {isCurrentPlayer && (
            <span className="player-board__tag player-board__tag--turn">
              當前回合
            </span>
          )}
          {player.passed && (
            <span className="player-board__tag player-board__tag--passed">
              已跳過
            </span>
          )}
          {!player.connected && (
            <span className="player-board__tag player-board__tag--offline">
              離線
            </span>
          )}
        </div>

        {/* 手牌數（對手） */}
        {!isSelf && (
          <div className="player-board__hand-count">
            <span className="player-board__hand-icon">🃏</span>
            <span>{player.hand.length}</span>
          </div>
        )}
      </div>

      {/* 生物區域 */}
      <div className="player-board__creatures">
        {player.creatures.length === 0 ? (
          <div className="player-board__empty">
            <span>尚無生物</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {player.creatures.map((creature) => (
              <motion.div
                key={creature.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
              >
                <CreatureCard
                  creature={creature}
                  isOwn={isSelf}
                  canBeAttacked={attackableCreatures.has(creature.id)}
                  canReceiveTrait={isSelf && currentPhase === 'evolution'}
                  onSelect={handleCreatureSelect}
                  onFeed={handleCreatureFeed}
                  onAttack={handleCreatureAttack}
                  onPlaceTrait={handlePlaceTrait}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 手牌區域（自己） */}
      {isSelf && (
        <div className="player-board__hand">
          <Hand
            cards={player.hand}
            disabled={!isMyTurn}
            onPlayAsCreature={onPlayAsCreature}
            onPlayAsTrait={onPlayAsTrait}
          />
        </div>
      )}

      {/* 互動性狀連結線 */}
      <svg className="player-board__links">
        {player.creatures.map((creature) =>
          creature.traits
            .filter((t) => t.link)
            .map((trait) => {
              // 繪製連結線（簡化版）
              const linkedCreatureId = trait.link.creatures.find(
                (id) => id !== creature.id
              );
              if (!linkedCreatureId) return null;

              // 實際實作需要計算 DOM 位置
              return null;
            })
        )}
      </svg>
    </div>
  );
};

PlayerBoard.propTypes = {
  player: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    hand: PropTypes.array.isRequired,
    creatures: PropTypes.array.isRequired,
    passed: PropTypes.bool,
    connected: PropTypes.bool,
    score: PropTypes.number,
  }).isRequired,
  isCurrentPlayer: PropTypes.bool,
  isMyTurn: PropTypes.bool,
  isSelf: PropTypes.bool,
  compact: PropTypes.bool,
  onCreatureSelect: PropTypes.func,
  onCreatureFeed: PropTypes.func,
  onCreatureAttack: PropTypes.func,
  onPlaceTrait: PropTypes.func,
  onPlayAsCreature: PropTypes.func,
  onPlayAsTrait: PropTypes.func,
  className: PropTypes.string,
};

export default PlayerBoard;
```

### 2. 樣式

```css
/* frontend/src/components/games/evolution/board/PlayerBoard.css */

.player-board {
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.player-board--current {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.player-board--self {
  background: #eff6ff;
}

.player-board--passed {
  opacity: 0.7;
}

.player-board--disconnected {
  filter: grayscale(50%);
}

/* === 玩家資訊 === */
.player-board__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.player-board__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, #60a5fa 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.player-board__info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.player-board__name {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

.player-board__score {
  font-size: 13px;
  color: #64748b;
}

.player-board__status {
  display: flex;
  gap: 4px;
}

.player-board__tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.player-board__tag--turn {
  background: #dbeafe;
  color: #1d4ed8;
}

.player-board__tag--passed {
  background: #fef3c7;
  color: #d97706;
}

.player-board__tag--offline {
  background: #fee2e2;
  color: #dc2626;
}

.player-board__hand-count {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
}

.player-board__hand-icon {
  font-size: 16px;
}

/* === 生物區域 === */
.player-board__creatures {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  min-height: 160px;
}

.player-board__empty {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
}

/* === 手牌區域 === */
.player-board__hand {
  border-top: 1px solid #e2e8f0;
  background: #fff;
}

/* === 連結線 === */
.player-board__links {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* === 緊湊模式 === */
.player-board--compact .player-board__header {
  padding: 8px 12px;
}

.player-board--compact .player-board__avatar {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.player-board--compact .player-board__creatures {
  padding: 12px;
  min-height: 120px;
}

/* === 響應式 === */
@media (max-width: 768px) {
  .player-board__header {
    flex-wrap: wrap;
  }

  .player-board__status {
    order: 3;
    width: 100%;
    margin-top: 8px;
  }

  .player-board__creatures {
    gap: 8px;
    padding: 12px;
  }
}
```

---

## 驗收標準

1. [ ] 玩家資訊正確顯示
2. [ ] 生物區域正常渲染
3. [ ] 自己的手牌可見
4. [ ] 對手只顯示手牌數量
5. [ ] 當前回合玩家高亮
6. [ ] 已跳過/離線狀態顯示
7. [ ] 緊湊模式正常
8. [ ] 響應式設計正確

---

## 備註

- 玩家區域是遊戲主要視圖
- 需處理多玩家的布局
- 互動性狀連結線需進一步實作
