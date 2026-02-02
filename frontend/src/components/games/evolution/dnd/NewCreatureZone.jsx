/**
 * NewCreatureZone - 新建生物區域
 *
 * 用於將手牌拖放創建新生物
 *
 * @module components/games/evolution/dnd/NewCreatureZone
 */

import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { DropZone } from './DropZone';
import { DRAG_TYPES } from './dragTypes';
import './NewCreatureZone.css';

/**
 * 新建生物區域
 * 用於將手牌拖放創建新生物
 */
export const NewCreatureZone = ({
  onCreateCreature,
  disabled = false,
  visible = true,
  className = '',
}) => {
  const handleDrop = (item) => {
    if (item.cardId) {
      onCreateCreature?.(item.cardId);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`new-creature-zone ${className}`}
          data-testid="new-creature-zone"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <DropZone
            accept={DRAG_TYPES.HAND_CARD}
            onDrop={handleDrop}
            disabled={disabled}
            placeholder={
              <div className="new-creature-zone__content">
                <span className="new-creature-zone__icon">🦎</span>
                <span className="new-creature-zone__text">
                  拖放卡牌創建新生物
                </span>
              </div>
            }
            activeLabel="放開創建生物"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

NewCreatureZone.propTypes = {
  onCreateCreature: PropTypes.func,
  disabled: PropTypes.bool,
  visible: PropTypes.bool,
  className: PropTypes.string,
};

export default NewCreatureZone;
