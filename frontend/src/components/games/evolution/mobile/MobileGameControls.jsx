/**
 * 移動端遊戲控制面板
 *
 * @module components/games/evolution/mobile/MobileGameControls
 */

import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './MobileGameControls.css';

/**
 * 按鈕動畫變體
 */
const buttonVariants = {
  tap: { scale: 0.95 },
  hover: { scale: 1.02 },
};

/**
 * 移動端遊戲控制面板
 *
 * @param {Object} props
 * @param {boolean} props.isMyTurn - 是否輪到自己
 * @param {string} props.currentPhase - 當前遊戲階段
 * @param {boolean} props.canFeed - 是否可以進食
 * @param {boolean} props.canPass - 是否可以跳過
 * @param {boolean} props.canAttack - 是否可以攻擊
 * @param {Function} props.onFeed - 進食回調
 * @param {Function} props.onPass - 跳過回調
 * @param {Function} props.onAttack - 攻擊回調
 * @param {Function} props.onShowHand - 顯示手牌回調
 * @param {Function} props.onShowCreatures - 顯示生物回調
 * @param {number} props.handCount - 手牌數量
 * @param {number} props.creatureCount - 生物數量
 * @param {number} props.foodPool - 食物池數量
 */
export const MobileGameControls = ({
  isMyTurn = false,
  currentPhase = '',
  canFeed = false,
  canPass = false,
  canAttack = false,
  onFeed,
  onPass,
  onAttack,
  onShowHand,
  onShowCreatures,
  handCount = 0,
  creatureCount = 0,
  foodPool = 0,
}) => {
  const phaseLabels = {
    evolution: '演化階段',
    feeding_setup: '食物供給',
    feeding: '進食階段',
    extinction: '滅絕階段',
  };

  return (
    <div className="mobile-controls" data-testid="mobile-controls">
      {/* 階段指示器 */}
      <div className="mobile-controls__phase">
        <span className="mobile-controls__phase-label">
          {phaseLabels[currentPhase] || currentPhase}
        </span>
        {isMyTurn && (
          <span className="mobile-controls__turn-indicator">你的回合</span>
        )}
      </div>

      {/* 資訊區 */}
      <div className="mobile-controls__info">
        <div className="mobile-controls__stat">
          <span className="mobile-controls__stat-icon">🍖</span>
          <span className="mobile-controls__stat-value">{foodPool}</span>
        </div>
      </div>

      {/* 按鈕區 */}
      <div className="mobile-controls__buttons">
        {/* 手牌按鈕 */}
        <motion.button
          className="mobile-controls__btn mobile-controls__btn--hand"
          onClick={onShowHand}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          data-testid="btn-show-hand"
        >
          <span className="mobile-controls__icon">🃏</span>
          {handCount > 0 && (
            <span className="mobile-controls__badge">{handCount}</span>
          )}
        </motion.button>

        {/* 生物按鈕 */}
        <motion.button
          className="mobile-controls__btn mobile-controls__btn--creatures"
          onClick={onShowCreatures}
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
          data-testid="btn-show-creatures"
        >
          <span className="mobile-controls__icon">🦎</span>
          {creatureCount > 0 && (
            <span className="mobile-controls__badge">{creatureCount}</span>
          )}
        </motion.button>

        {/* 動作按鈕 */}
        <AnimatePresence mode="wait">
          {canFeed && (
            <motion.button
              key="feed"
              className="mobile-controls__btn mobile-controls__btn--feed"
              onClick={onFeed}
              variants={buttonVariants}
              whileTap="tap"
              whileHover="hover"
              disabled={!isMyTurn}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              data-testid="btn-feed"
            >
              <span className="mobile-controls__icon">🍖</span>
              <span className="mobile-controls__label">進食</span>
            </motion.button>
          )}

          {canAttack && (
            <motion.button
              key="attack"
              className="mobile-controls__btn mobile-controls__btn--attack"
              onClick={onAttack}
              variants={buttonVariants}
              whileTap="tap"
              whileHover="hover"
              disabled={!isMyTurn}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              data-testid="btn-attack"
            >
              <span className="mobile-controls__icon">⚔️</span>
              <span className="mobile-controls__label">攻擊</span>
            </motion.button>
          )}

          {canPass && (
            <motion.button
              key="pass"
              className="mobile-controls__btn mobile-controls__btn--pass"
              onClick={onPass}
              variants={buttonVariants}
              whileTap="tap"
              whileHover="hover"
              disabled={!isMyTurn}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              data-testid="btn-pass"
            >
              <span className="mobile-controls__icon">⏭️</span>
              <span className="mobile-controls__label">跳過</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

MobileGameControls.propTypes = {
  isMyTurn: PropTypes.bool,
  currentPhase: PropTypes.string,
  canFeed: PropTypes.bool,
  canPass: PropTypes.bool,
  canAttack: PropTypes.bool,
  onFeed: PropTypes.func,
  onPass: PropTypes.func,
  onAttack: PropTypes.func,
  onShowHand: PropTypes.func,
  onShowCreatures: PropTypes.func,
  handCount: PropTypes.number,
  creatureCount: PropTypes.number,
  foodPool: PropTypes.number,
};

export default MobileGameControls;
