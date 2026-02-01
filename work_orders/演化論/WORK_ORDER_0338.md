# 工單 0338：PhaseIndicator 階段指示器組件

## 基本資訊
- **工單編號**：0338
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：無
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/board/PhaseIndicator.jsx`（新增）
  - `frontend/src/components/games/evolution/board/PhaseIndicator.css`（新增）

---

## 目標

建立階段指示器組件，顯示遊戲進度：
1. 當前回合/階段
2. 四階段進度條
3. 當前玩家提示
4. 階段轉換動畫

---

## 詳細規格

### 組件實作

```jsx
// frontend/src/components/games/evolution/board/PhaseIndicator.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { GAME_PHASES } from '@shared/constants/evolution';
import './PhaseIndicator.css';

const PHASE_CONFIG = {
  [GAME_PHASES.EVOLUTION]: {
    name: '演化',
    icon: '🧬',
    description: '打出卡牌，建立生物或添加性狀',
    color: '#8b5cf6',
  },
  [GAME_PHASES.FOOD_SUPPLY]: {
    name: '食物供給',
    icon: '🎲',
    description: '擲骰決定食物池數量',
    color: '#f59e0b',
  },
  [GAME_PHASES.FEEDING]: {
    name: '進食',
    icon: '🍖',
    description: '餵食你的生物',
    color: '#10b981',
  },
  [GAME_PHASES.EXTINCTION]: {
    name: '滅絕',
    icon: '💀',
    description: '未吃飽的生物死亡',
    color: '#ef4444',
  },
};

const PHASE_ORDER = [
  GAME_PHASES.EVOLUTION,
  GAME_PHASES.FOOD_SUPPLY,
  GAME_PHASES.FEEDING,
  GAME_PHASES.EXTINCTION,
];

export const PhaseIndicator = ({
  currentPhase,
  round = 1,
  currentPlayer,
  isMyTurn = false,
  className = '',
}) => {
  const phaseIndex = PHASE_ORDER.indexOf(currentPhase);
  const currentConfig = PHASE_CONFIG[currentPhase] || {};

  return (
    <div className={`phase-indicator ${className}`}>
      {/* 回合資訊 */}
      <div className="phase-indicator__round">
        <span className="phase-indicator__round-label">第</span>
        <motion.span
          key={round}
          className="phase-indicator__round-number"
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {round}
        </motion.span>
        <span className="phase-indicator__round-label">回合</span>
      </div>

      {/* 階段進度 */}
      <div className="phase-indicator__phases">
        {PHASE_ORDER.map((phase, index) => {
          const config = PHASE_CONFIG[phase];
          const isActive = phase === currentPhase;
          const isPast = index < phaseIndex;

          return (
            <React.Fragment key={phase}>
              <motion.div
                className={`phase-indicator__phase ${isActive ? 'phase-indicator__phase--active' : ''} ${isPast ? 'phase-indicator__phase--past' : ''}`}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div
                  className="phase-indicator__phase-icon"
                  style={{ backgroundColor: isActive || isPast ? config.color : '#e2e8f0' }}
                >
                  {config.icon}
                </div>
                <span className="phase-indicator__phase-name">
                  {config.name}
                </span>
              </motion.div>

              {/* 連接線 */}
              {index < PHASE_ORDER.length - 1 && (
                <div
                  className={`phase-indicator__connector ${isPast ? 'phase-indicator__connector--filled' : ''}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 當前階段說明 */}
      <motion.div
        key={currentPhase}
        className="phase-indicator__current"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ borderColor: currentConfig.color }}
      >
        <span className="phase-indicator__current-icon">
          {currentConfig.icon}
        </span>
        <div className="phase-indicator__current-info">
          <span className="phase-indicator__current-name">
            {currentConfig.name}階段
          </span>
          <span className="phase-indicator__current-desc">
            {currentConfig.description}
          </span>
        </div>
      </motion.div>

      {/* 當前玩家 */}
      {currentPlayer && (
        <div className={`phase-indicator__player ${isMyTurn ? 'phase-indicator__player--self' : ''}`}>
          {isMyTurn ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ⭐ 你的回合
            </motion.span>
          ) : (
            <span>等待 {currentPlayer} 行動</span>
          )}
        </div>
      )}
    </div>
  );
};

PhaseIndicator.propTypes = {
  currentPhase: PropTypes.oneOf(Object.values(GAME_PHASES)),
  round: PropTypes.number,
  currentPlayer: PropTypes.string,
  isMyTurn: PropTypes.bool,
  className: PropTypes.string,
};

export default PhaseIndicator;
```

### 樣式

```css
/* frontend/src/components/games/evolution/board/PhaseIndicator.css */

.phase-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* === 回合資訊 === */
.phase-indicator__round {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.phase-indicator__round-label {
  font-size: 14px;
  color: #64748b;
}

.phase-indicator__round-number {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

/* === 階段進度 === */
.phase-indicator__phases {
  display: flex;
  align-items: center;
  gap: 0;
}

.phase-indicator__phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.phase-indicator__phase--active,
.phase-indicator__phase--past {
  opacity: 1;
}

.phase-indicator__phase-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #e2e8f0;
  transition: background-color 0.3s;
}

.phase-indicator__phase-name {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

.phase-indicator__phase--active .phase-indicator__phase-name {
  font-weight: 600;
  color: #1e293b;
}

/* === 連接線 === */
.phase-indicator__connector {
  width: 24px;
  height: 2px;
  background: #e2e8f0;
  margin: 0 4px;
  margin-bottom: 20px;
}

.phase-indicator__connector--filled {
  background: #10b981;
}

/* === 當前階段 === */
.phase-indicator__current {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.phase-indicator__current-icon {
  font-size: 28px;
}

.phase-indicator__current-info {
  display: flex;
  flex-direction: column;
}

.phase-indicator__current-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.phase-indicator__current-desc {
  font-size: 12px;
  color: #64748b;
}

/* === 當前玩家 === */
.phase-indicator__player {
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 14px;
  color: #64748b;
}

.phase-indicator__player--self {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  font-weight: 600;
}

/* === 響應式 === */
@media (max-width: 768px) {
  .phase-indicator__phases {
    transform: scale(0.9);
  }

  .phase-indicator__phase-name {
    display: none;
  }

  .phase-indicator__connector {
    margin-bottom: 0;
  }
}
```

---

## 驗收標準

1. [ ] 回合數正確顯示
2. [ ] 四階段進度正確
3. [ ] 當前階段高亮
4. [ ] 階段說明清晰
5. [ ] 玩家回合提示正確
6. [ ] 動畫流暢
7. [ ] 響應式正確

---

## 備註

- 階段指示器幫助玩家了解遊戲進度
- 視覺設計需直觀易懂
