/**
 * 遊戲事件動畫定義
 *
 * @module components/games/evolution/animations/gameEventAnimations
 */

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
