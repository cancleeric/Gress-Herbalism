/**
 * Hand - 手牌區域組件
 *
 * 顯示玩家的手牌，支援扇形排列和選擇操作
 *
 * @module components/games/evolution/board/Hand
 */

import React, { useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { HandCard } from '../cards/HandCard';
import { useCardInteraction } from '../cards/useCardInteraction';
import './Hand.css';

/**
 * 手牌區域組件
 */
export const Hand = ({
  cards = [],
  disabled = false,
  maxDisplay = 10,
  onPlayAsCreature,
  onPlayAsTrait,
  showCount = true,
  layout = 'fan',
  className = '',
}) => {
  const [expandedView, setExpandedView] = useState(false);
  const [selectedSide, setSelectedSide] = useState({});

  // 卡牌選擇邏輯
  const {
    selectedCards,
    selectedCount,
    toggleSelect,
    isSelected,
    clearSelection,
  } = useCardInteraction({
    multiSelect: false,
    onSelect: (cardId) => {
      // 預設選擇正面
      setSelectedSide((prev) => ({ ...prev, [cardId]: 'front' }));
    },
    onDeselect: (cardId) => {
      setSelectedSide((prev) => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
    },
  });

  // 計算卡牌位置（扇形排列）
  const cardPositions = useMemo(() => {
    const total = Math.min(cards.length, maxDisplay);
    if (total === 0) return [];

    const positions = [];
    const spreadAngle = Math.min(5, 30 / total); // 每張卡的角度
    const startAngle = (-(total - 1) * spreadAngle) / 2;

    for (let i = 0; i < total; i++) {
      const angle = startAngle + i * spreadAngle;
      const yOffset = Math.abs(angle) * 0.5; // 弧形效果

      positions.push({
        rotation: angle,
        translateY: yOffset,
        zIndex: i + 1,
      });
    }

    return positions;
  }, [cards.length, maxDisplay]);

  // 處理面選擇
  const handleSideSelect = useCallback((cardId, side) => {
    setSelectedSide((prev) => ({ ...prev, [cardId]: side }));
  }, []);

  // 處理作為生物打出
  const handlePlayAsCreature = useCallback(
    (cardId) => {
      onPlayAsCreature?.(cardId);
      clearSelection();
    },
    [onPlayAsCreature, clearSelection]
  );

  // 處理作為性狀打出
  const handlePlayAsTrait = useCallback(
    (cardId) => {
      const side = selectedSide[cardId] || 'front';
      onPlayAsTrait?.(cardId, side);
      clearSelection();
    },
    [onPlayAsTrait, selectedSide, clearSelection]
  );

  // 處理展開視圖切換
  const handleToggleExpand = useCallback(() => {
    setExpandedView((prev) => !prev);
  }, []);

  // 處理關閉展開視圖
  const handleCloseExpand = useCallback(() => {
    setExpandedView(false);
  }, []);

  // 顯示的卡牌
  const displayCards = cards.slice(0, maxDisplay);
  const hiddenCount = cards.length - displayCards.length;

  const handClasses = [
    'hand',
    layout === 'fan' ? 'hand--fan' : 'hand--grid',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={handClasses} data-testid="hand">
      {/* 手牌數量 */}
      {showCount && (
        <div className="hand__count" data-testid="hand-count">
          <span className="hand__count-number">{cards.length}</span>
          <span className="hand__count-label">張手牌</span>
        </div>
      )}

      {/* 展開按鈕 */}
      {hiddenCount > 0 && (
        <button
          className="hand__expand-btn"
          onClick={handleToggleExpand}
          data-testid="expand-button"
        >
          {expandedView ? '收起' : `+${hiddenCount} 更多`}
        </button>
      )}

      {/* 卡牌容器 */}
      <div className="hand__cards" data-testid="hand-cards">
        <AnimatePresence mode="popLayout">
          {displayCards.map((card, index) => {
            const position = cardPositions[index] || {};
            const isCardSelected = isSelected(card.instanceId);

            return (
              <motion.div
                key={card.instanceId}
                className="hand__card-wrapper"
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{
                  opacity: 1,
                  scale: isCardSelected ? 1.1 : 1,
                  y: isCardSelected ? -20 : 0,
                  rotate: layout === 'fan' ? position.rotation : 0,
                  zIndex: isCardSelected ? 100 : position.zIndex,
                }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{
                  transformOrigin: 'center bottom',
                }}
                data-testid={`card-wrapper-${index}`}
              >
                <HandCard
                  card={card}
                  selected={isCardSelected}
                  disabled={disabled}
                  onSelect={toggleSelect}
                  onPlayAsCreature={handlePlayAsCreature}
                  onPlayAsTrait={handlePlayAsTrait}
                  showSideSelector={isCardSelected}
                  selectedSide={selectedSide[card.instanceId]}
                  onSideSelect={handleSideSelect}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 展開視圖（Grid 模式） */}
      <AnimatePresence>
        {expandedView && (
          <motion.div
            className="hand__expanded-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseExpand}
            data-testid="expanded-overlay"
          >
            <motion.div
              className="hand__expanded-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="expanded-content"
            >
              <h3>全部手牌 ({cards.length})</h3>
              <div className="hand__expanded-grid" data-testid="expanded-grid">
                {cards.map((card) => (
                  <HandCard
                    key={card.instanceId}
                    card={card}
                    selected={isSelected(card.instanceId)}
                    disabled={disabled}
                    onSelect={toggleSelect}
                    onPlayAsCreature={handlePlayAsCreature}
                    onPlayAsTrait={handlePlayAsTrait}
                  />
                ))}
              </div>
              <button
                className="hand__close-btn"
                onClick={handleCloseExpand}
                data-testid="close-button"
              >
                關閉
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Hand.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.object),
  disabled: PropTypes.bool,
  maxDisplay: PropTypes.number,
  onPlayAsCreature: PropTypes.func,
  onPlayAsTrait: PropTypes.func,
  showCount: PropTypes.bool,
  layout: PropTypes.oneOf(['fan', 'grid']),
  className: PropTypes.string,
};

export default Hand;
