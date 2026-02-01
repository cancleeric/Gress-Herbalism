# 工單 0343：遊戲事件動畫系統

## 基本資訊
- **工單編號**：0343
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0342（卡牌動畫）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/animations/gameEventAnimations.js`（新增）
  - `frontend/src/components/games/evolution/animations/AnimatedEvent.jsx`（新增）

---

## 目標

建立遊戲事件動畫系統：
1. 攻擊動畫
2. 進食動畫
3. 死亡動畫
4. 階段轉換動畫

---

## 詳細規格

### 1. 事件動畫定義

```javascript
// frontend/src/components/games/evolution/animations/gameEventAnimations.js

/**
 * 攻擊動畫
 */
export const attackAnimation = {
  // 攻擊者移動
  attacker: {
    initial: { x: 0, y: 0 },
    attack: {
      x: [0, 50, 0],
      y: [0, -20, 0],
      transition: {
        duration: 0.5,
        times: [0, 0.5, 1],
      },
    },
  },

  // 被攻擊者反應
  defender: {
    initial: { x: 0, rotate: 0 },
    hit: {
      x: [0, 20, -20, 10, 0],
      rotate: [0, 5, -5, 3, 0],
      transition: {
        duration: 0.5,
        times: [0, 0.2, 0.4, 0.7, 1],
      },
    },
  },

  // 攻擊特效
  effect: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
      transition: {
        duration: 0.6,
      },
    },
  },
};

/**
 * 進食動畫
 */
export const feedAnimation = {
  // 食物移動
  food: {
    initial: { scale: 1, opacity: 1 },
    consume: (targetPosition) => ({
      x: targetPosition.x,
      y: targetPosition.y,
      scale: 0,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: 'easeInOut',
      },
    }),
  },

  // 生物反應
  creature: {
    initial: { scale: 1 },
    eating: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.3,
      },
    },
  },

  // 飽足提示
  satisfied: {
    initial: { scale: 0, opacity: 0, y: 0 },
    animate: {
      scale: 1,
      opacity: [0, 1, 1, 0],
      y: -30,
      transition: {
        duration: 1,
      },
    },
  },
};

/**
 * 死亡動畫
 */
export const deathAnimation = {
  creature: {
    initial: { scale: 1, opacity: 1, rotate: 0 },
    dying: {
      scale: [1, 1.1, 0.5],
      opacity: [1, 1, 0],
      rotate: [0, -10, 20],
      filter: ['grayscale(0)', 'grayscale(0)', 'grayscale(100%)'],
      transition: {
        duration: 0.8,
        times: [0, 0.3, 1],
      },
    },
  },

  skull: {
    initial: { scale: 0, opacity: 0, y: 20 },
    appear: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1, 0],
      y: [20, -10, -30],
      transition: {
        duration: 1.2,
      },
    },
  },
};

/**
 * 階段轉換動畫
 */
export const phaseTransitionAnimation = {
  // 舊階段淡出
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.3,
    },
  },

  // 新階段淡入
  enter: {
    opacity: [0, 1],
    scale: [1.1, 1],
    transition: {
      duration: 0.4,
    },
  },

  // 階段標題
  title: {
    initial: { opacity: 0, y: -50, scale: 1.5 },
    animate: {
      opacity: [0, 1, 1, 0],
      y: [-50, 0, 0, 50],
      scale: [1.5, 1, 1, 0.8],
      transition: {
        duration: 2,
        times: [0, 0.2, 0.8, 1],
      },
    },
  },
};

/**
 * 性狀觸發動畫
 */
export const traitActivationAnimation = {
  badge: {
    initial: { scale: 1 },
    activate: {
      scale: [1, 1.3, 1],
      boxShadow: [
        '0 0 0 0 rgba(59, 130, 246, 0)',
        '0 0 0 10px rgba(59, 130, 246, 0.3)',
        '0 0 0 0 rgba(59, 130, 246, 0)',
      ],
      transition: {
        duration: 0.6,
      },
    },
  },
};
```

### 2. 動畫事件組件

```jsx
// frontend/src/components/games/evolution/animations/AnimatedEvent.jsx

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  attackAnimation,
  feedAnimation,
  deathAnimation,
  phaseTransitionAnimation,
} from './gameEventAnimations';
import './AnimatedEvent.css';

/**
 * 攻擊動畫組件
 */
export const AttackAnimation = ({ show, onComplete }) => {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="attack-animation"
          initial={attackAnimation.effect.initial}
          animate={attackAnimation.effect.animate}
        >
          ⚔️
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 進食動畫組件
 */
export const FeedAnimation = ({ show, fromPosition, toPosition, onComplete }) => {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="feed-animation"
          initial={{
            ...feedAnimation.food.initial,
            x: fromPosition?.x || 0,
            y: fromPosition?.y || 0,
          }}
          animate={{
            x: toPosition?.x || 0,
            y: toPosition?.y || 0,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.4 }}
        >
          🍖
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 死亡動畫組件
 */
export const DeathAnimation = ({ show, onComplete }) => {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="death-animation"
          initial={deathAnimation.skull.initial}
          animate={deathAnimation.skull.appear}
        >
          💀
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 階段轉換動畫組件
 */
export const PhaseTransition = ({ phase, show, onComplete }) => {
  const phaseConfig = {
    evolution: { name: '演化階段', icon: '🧬', color: '#8b5cf6' },
    food_supply: { name: '食物供給', icon: '🎲', color: '#f59e0b' },
    feeding: { name: '進食階段', icon: '🍖', color: '#10b981' },
    extinction: { name: '滅絕階段', icon: '💀', color: '#ef4444' },
  };

  const config = phaseConfig[phase] || {};

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="phase-transition"
          initial={phaseTransitionAnimation.title.initial}
          animate={phaseTransitionAnimation.title.animate}
          style={{ '--phase-color': config.color }}
        >
          <span className="phase-transition__icon">{config.icon}</span>
          <span className="phase-transition__name">{config.name}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 飽足提示動畫
 */
export const SatisfiedAnimation = ({ show, onComplete }) => {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="satisfied-animation"
          initial={feedAnimation.satisfied.initial}
          animate={feedAnimation.satisfied.animate}
        >
          ✅ 飽
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// PropTypes
AttackAnimation.propTypes = {
  show: PropTypes.bool,
  onComplete: PropTypes.func,
};

FeedAnimation.propTypes = {
  show: PropTypes.bool,
  fromPosition: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  toPosition: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  onComplete: PropTypes.func,
};

DeathAnimation.propTypes = {
  show: PropTypes.bool,
  onComplete: PropTypes.func,
};

PhaseTransition.propTypes = {
  phase: PropTypes.string,
  show: PropTypes.bool,
  onComplete: PropTypes.func,
};
```

### 3. 樣式

```css
/* frontend/src/components/games/evolution/animations/AnimatedEvent.css */

/* 通用動畫容器 */
.attack-animation,
.feed-animation,
.death-animation {
  position: fixed;
  font-size: 48px;
  z-index: 1000;
  pointer-events: none;
}

/* 攻擊動畫 */
.attack-animation {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 進食動畫 */
.feed-animation {
  font-size: 32px;
}

/* 死亡動畫 */
.death-animation {
  font-size: 64px;
}

/* 階段轉換 */
.phase-transition {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 2000;
  pointer-events: none;
}

.phase-transition__icon {
  font-size: 72px;
}

.phase-transition__name {
  font-size: 32px;
  font-weight: 700;
  color: var(--phase-color, #1e293b);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

/* 飽足提示 */
.satisfied-animation {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
  white-space: nowrap;
}
```

---

## 驗收標準

1. [ ] 攻擊動畫效果明顯
2. [ ] 進食動畫流暢
3. [ ] 死亡動畫有感染力
4. [ ] 階段轉換清晰
5. [ ] 動畫不影響遊戲操作
6. [ ] 效能良好
7. [ ] 可正確觸發和結束

---

## 備註

- 動畫增強遊戲體驗
- 需控制動畫時長避免拖慢遊戲
