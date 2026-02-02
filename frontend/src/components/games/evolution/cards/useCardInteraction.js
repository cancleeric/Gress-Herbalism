/**
 * useCardInteraction - 卡牌互動 Hook
 *
 * 管理卡牌選擇狀態和互動邏輯
 *
 * @module components/games/evolution/cards/useCardInteraction
 */

import { useState, useCallback } from 'react';

/**
 * 卡牌互動 Hook
 *
 * @param {Object} options - 設定選項
 * @param {Function} options.onSelect - 選擇卡牌時的回調
 * @param {Function} options.onDeselect - 取消選擇時的回調
 * @param {boolean} options.multiSelect - 是否允許多選
 * @param {number} options.maxSelect - 最大選擇數量
 * @returns {Object} 卡牌互動狀態和方法
 */
export function useCardInteraction(options = {}) {
  const {
    onSelect,
    onDeselect,
    multiSelect = false,
    maxSelect = Infinity,
  } = options;

  const [selectedCards, setSelectedCards] = useState(new Set());

  /**
   * 切換卡牌選擇狀態
   * @param {string} cardId - 卡牌 ID
   */
  const toggleSelect = useCallback(
    (cardId) => {
      setSelectedCards((prev) => {
        const next = new Set(prev);

        if (next.has(cardId)) {
          next.delete(cardId);
          onDeselect?.(cardId);
        } else {
          if (!multiSelect) {
            // 單選模式，清除之前的選擇
            const prevSelected = Array.from(prev);
            prevSelected.forEach((id) => onDeselect?.(id));
            next.clear();
          } else if (next.size >= maxSelect) {
            // 達到最大選擇數
            return prev;
          }
          next.add(cardId);
          onSelect?.(cardId);
        }

        return next;
      });
    },
    [multiSelect, maxSelect, onSelect, onDeselect]
  );

  /**
   * 檢查卡牌是否被選中
   * @param {string} cardId - 卡牌 ID
   * @returns {boolean}
   */
  const isSelected = useCallback(
    (cardId) => {
      return selectedCards.has(cardId);
    },
    [selectedCards]
  );

  /**
   * 清除所有選擇
   */
  const clearSelection = useCallback(() => {
    const prevSelected = Array.from(selectedCards);
    prevSelected.forEach((id) => onDeselect?.(id));
    setSelectedCards(new Set());
  }, [selectedCards, onDeselect]);

  /**
   * 選擇指定的卡牌
   * @param {string[]} cardIds - 卡牌 ID 陣列
   */
  const selectAll = useCallback(
    (cardIds) => {
      const toSelect = multiSelect
        ? cardIds.slice(0, maxSelect)
        : cardIds.slice(0, 1);

      setSelectedCards(new Set(toSelect));
      toSelect.forEach((id) => onSelect?.(id));
    },
    [multiSelect, maxSelect, onSelect]
  );

  /**
   * 選擇單一卡牌（不切換）
   * @param {string} cardId - 卡牌 ID
   */
  const select = useCallback(
    (cardId) => {
      if (!multiSelect) {
        // 單選模式
        const prevSelected = Array.from(selectedCards);
        prevSelected.forEach((id) => onDeselect?.(id));
        setSelectedCards(new Set([cardId]));
        onSelect?.(cardId);
      } else if (selectedCards.size < maxSelect) {
        setSelectedCards((prev) => {
          const next = new Set(prev);
          next.add(cardId);
          return next;
        });
        onSelect?.(cardId);
      }
    },
    [multiSelect, maxSelect, selectedCards, onSelect, onDeselect]
  );

  /**
   * 取消選擇單一卡牌
   * @param {string} cardId - 卡牌 ID
   */
  const deselect = useCallback(
    (cardId) => {
      setSelectedCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
      onDeselect?.(cardId);
    },
    [onDeselect]
  );

  return {
    selectedCards: Array.from(selectedCards),
    selectedCount: selectedCards.size,
    toggleSelect,
    isSelected,
    clearSelection,
    selectAll,
    select,
    deselect,
  };
}

export default useCardInteraction;
