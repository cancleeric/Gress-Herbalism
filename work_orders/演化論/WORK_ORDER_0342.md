# 工單 0342：卡牌動畫系統

## 基本資訊
- **工單編號**：0342
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0331-0333（卡牌組件）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/animations/cardAnimations.js`（新增）
  - `frontend/src/components/games/evolution/animations/useCardAnimation.js`（新增）

---

## 目標

建立卡牌動畫系統：
1. 發牌動畫
2. 打出卡牌動畫
3. 翻牌動畫
4. 卡牌消失動畫

---

## 詳細規格

### 1. 動畫變體定義

```javascript
// frontend/src/components/games/evolution/animations/cardAnimations.js

import { Variants } from 'framer-motion';

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
```

### 2. 動畫 Hook

```jsx
// frontend/src/components/games/evolution/animations/useCardAnimation.js

import { useState, useCallback, useMemo } from 'react';
import { useAnimation } from 'framer-motion';
import {
  cardVariants,
  dealCardAnimation,
  flipCardAnimation,
  fanLayoutAnimation,
} from './cardAnimations';

/**
 * 卡牌動畫 Hook
 */
export function useCardAnimation(cardId) {
  const controls = useAnimation();
  const [state, setState] = useState('inHand');

  const animate = useCallback(async (newState) => {
    setState(newState);
    if (cardVariants[newState]) {
      await controls.start(cardVariants[newState]);
    }
  }, [controls]);

  const reset = useCallback(() => {
    animate('inHand');
  }, [animate]);

  return {
    controls,
    state,
    animate,
    reset,
    variants: cardVariants,
  };
}

/**
 * 發牌動畫 Hook
 */
export function useDealAnimation(cards) {
  const [isDealing, setIsDealing] = useState(false);
  const [dealtCards, setDealtCards] = useState([]);

  const deal = useCallback(async () => {
    setIsDealing(true);
    setDealtCards([]);

    for (let i = 0; i < cards.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDealtCards(prev => [...prev, cards[i]]);
    }

    setIsDealing(false);
  }, [cards]);

  const getAnimationProps = useCallback((index) => {
    return dealCardAnimation(index, cards.length);
  }, [cards.length]);

  return {
    isDealing,
    dealtCards,
    deal,
    getAnimationProps,
  };
}

/**
 * 手牌布局動畫 Hook
 */
export function useHandLayoutAnimation(cards, selectedCardId) {
  const getCardStyle = useCallback((index) => {
    const isSelected = cards[index]?.instanceId === selectedCardId;
    return fanLayoutAnimation(index, cards.length, isSelected);
  }, [cards, selectedCardId]);

  return {
    getCardStyle,
  };
}

/**
 * 翻牌動畫 Hook
 */
export function useFlipAnimation() {
  const [isFlipped, setIsFlipped] = useState(false);
  const controls = useAnimation();

  const flip = useCallback(async () => {
    const newState = !isFlipped;
    setIsFlipped(newState);
    await controls.start(newState ? flipCardAnimation.back : flipCardAnimation.front);
  }, [isFlipped, controls]);

  const flipTo = useCallback(async (toBack) => {
    setIsFlipped(toBack);
    await controls.start(toBack ? flipCardAnimation.back : flipCardAnimation.front);
  }, [controls]);

  return {
    isFlipped,
    controls,
    flip,
    flipTo,
    variants: flipCardAnimation,
  };
}
```

---

## 測試需求

```jsx
// 測試動畫 Hook
describe('useCardAnimation', () => {
  it('should start with inHand state', () => {});
  it('should animate to selected state', () => {});
  it('should reset to inHand', () => {});
});
```

---

## 驗收標準

1. [ ] 發牌動畫流暢
2. [ ] 翻牌動畫正確
3. [ ] 扇形布局動畫正確
4. [ ] 選中狀態動畫正確
5. [ ] 打出動畫正確
6. [ ] Hook 可正常使用
7. [ ] 效能良好

---

## 備註

- 使用 Framer Motion 實現動畫
- 動畫應增強而非干擾遊戲體驗
