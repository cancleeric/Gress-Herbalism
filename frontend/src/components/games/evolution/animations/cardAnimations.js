/**
 * 卡牌動畫變體定義
 *
 * @module components/games/evolution/animations/cardAnimations
 */

/**
 * 卡牌動畫變體
 */
export const cardVariants = {
  // 初始狀態（牌庫中）
  inDeck: {
    scale: 0.8,
    opacity: 0,
    y: -200,
    rotateY: 180,
  },

  // 在手中
  inHand: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },

  // 被選中
  selected: {
    scale: 1.1,
    y: -20,
    zIndex: 100,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },

  // 打出中
  playing: {
    scale: 1.2,
    y: -100,
    opacity: 0.8,
    transition: {
      duration: 0.3,
    },
  },

  // 已打出（作為生物）
  asCreature: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },

  // 已打出（作為性狀）
  asTrait: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },

  // 被棄置
  discarded: {
    scale: 0.5,
    opacity: 0,
    x: 200,
    rotate: 45,
    transition: {
      duration: 0.4,
    },
  },

  // 懸停
  hover: {
    scale: 1.05,
    y: -8,
    transition: {
      duration: 0.2,
    },
  },

  // 拖動中
  dragging: {
    scale: 1.1,
    opacity: 0.9,
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    cursor: 'grabbing',
  },
};

/**
 * 發牌動畫
 * @param {number} index - 卡牌索引
 * @param {number} total - 總卡牌數
 * @returns {Object} 動畫屬性
 */
export const dealCardAnimation = (index, total) => ({
  initial: {
    x: 0,
    y: -300,
    scale: 0.5,
    opacity: 0,
    rotateY: 180,
  },
  animate: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    rotateY: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
});

/**
 * 翻牌動畫
 */
export const flipCardAnimation = {
  front: {
    rotateY: 0,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  back: {
    rotateY: 180,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

/**
 * 卡牌入場動畫（從牌庫抽取）
 */
export const drawCardAnimation = {
  initial: {
    x: -100,
    y: -200,
    scale: 0.5,
    opacity: 0,
    rotate: -30,
  },
  animate: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

/**
 * 卡牌離場動畫
 */
export const exitCardAnimation = {
  exit: {
    scale: 0.5,
    opacity: 0,
    y: 100,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 手牌扇形排列動畫
 * @param {number} index - 卡牌索引
 * @param {number} total - 總卡牌數
 * @param {boolean} isSelected - 是否被選中
 * @returns {Object} 動畫屬性
 */
export const fanLayoutAnimation = (index, total, isSelected) => {
  const spreadAngle = Math.min(8, 60 / total);
  const startAngle = -(total - 1) * spreadAngle / 2;
  const angle = startAngle + index * spreadAngle;

  return {
    rotate: isSelected ? 0 : angle,
    y: isSelected ? -30 : Math.abs(angle) * 0.8,
    scale: isSelected ? 1.1 : 1,
    zIndex: isSelected ? 100 : index,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  };
};
