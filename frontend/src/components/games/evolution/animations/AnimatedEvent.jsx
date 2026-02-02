/**
 * 遊戲事件動畫組件
 *
 * @module components/games/evolution/animations/AnimatedEvent
 */

import React from 'react';
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
          data-testid="attack-animation"
          initial={attackAnimation.effect.initial}
          animate={attackAnimation.effect.animate}
        >
          ⚔️
        </motion.div>
      )}
    </AnimatePresence>
  );
};

AttackAnimation.propTypes = {
  show: PropTypes.bool,
  onComplete: PropTypes.func,
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
          data-testid="feed-animation"
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

FeedAnimation.propTypes = {
  show: PropTypes.bool,
  fromPosition: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  toPosition: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  onComplete: PropTypes.func,
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
          data-testid="death-animation"
          initial={deathAnimation.skull.initial}
          animate={deathAnimation.skull.appear}
        >
          💀
        </motion.div>
      )}
    </AnimatePresence>
  );
};

DeathAnimation.propTypes = {
  show: PropTypes.bool,
  onComplete: PropTypes.func,
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

  const config = phaseConfig[phase] || { name: phase, icon: '📌', color: '#64748b' };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="phase-transition"
          data-testid="phase-transition"
          initial={phaseTransitionAnimation.title.initial}
          animate={phaseTransitionAnimation.title.animate}
          style={{ '--phase-color': config.color }}
        >
          <span className="phase-transition__icon" data-testid="phase-icon">{config.icon}</span>
          <span className="phase-transition__name" data-testid="phase-name">{config.name}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

PhaseTransition.propTypes = {
  phase: PropTypes.string,
  show: PropTypes.bool,
  onComplete: PropTypes.func,
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
          data-testid="satisfied-animation"
          initial={feedAnimation.satisfied.initial}
          animate={feedAnimation.satisfied.animate}
        >
          ✅ 飽
        </motion.div>
      )}
    </AnimatePresence>
  );
};

SatisfiedAnimation.propTypes = {
  show: PropTypes.bool,
  onComplete: PropTypes.func,
};
