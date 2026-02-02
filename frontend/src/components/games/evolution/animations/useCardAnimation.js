/**
 * 卡牌動畫 Hooks
 *
 * @module components/games/evolution/animations/useCardAnimation
 */

import { useState, useCallback } from 'react';
import { useAnimation } from 'framer-motion';
import {
  cardVariants,
  dealCardAnimation,
  flipCardAnimation,
  fanLayoutAnimation,
} from './cardAnimations';

/**
 * 卡牌動畫 Hook
 * @param {string} cardId - 卡牌 ID
 * @returns {Object} 動畫控制物件
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
 * @param {Array} cards - 卡牌陣列
 * @returns {Object} 發牌動畫控制物件
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
 * @param {Array} cards - 卡牌陣列
 * @param {string} selectedCardId - 選中的卡牌 ID
 * @returns {Object} 布局動畫控制物件
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
 * @returns {Object} 翻牌動畫控制物件
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
